//'use strict'; - cannot delect tiddlycut with this
(function (){
	var tiddlycut = {};

if (typeof(tiddlycut.log) === 'undefined') {
	var consoleService = Components.classes['@mozilla.org/consoleservice;1']
								.getService(Components.interfaces.nsIConsoleService);
	tiddlycut.log = function() {
		var i, concated = '', hasError = false;
		var args = Array.prototype.slice.apply(arguments);
		concated=args.join(' ');
		consoleService.logStringMessage('tiddlycut: ' + concated);
	};
};

//Components.utils.import("chrome://tiddlycut/content/ff/tabId.jsm",tiddlycut);//just a common numbering for tabs
tiddlycut.tabN =Math.random();//tiddlycut.tiddlycutgettabN();

tiddlycut.log("cs" + tiddlycut.tabN);

tiddlycut.unload = (function() {
	if (!!content) content.removeEventListener('unload', this.unload);
	this.log("unload ev cs",this.tabN);

}).bind(tiddlycut); 

tiddlycut.docLoad = (function(doc) {
	if (doc.defaultView.frameElement) return;
	if (doc.nodeName != '#document') tiddlycut.log("in docload fail");
			//return?;
		tiddlycut.log("in docload");

		try { 	// if the tab is closing then the source of the message can be invalid
				//- tabclose is watch for in background-server and sends this message when seen  
			sendAsyncMessage('tcutrequest', {data:{req: 'pageChanged', id: this.tabN}}); 
			//maybe we are docked
			removeMessageListener('tcdock',tiddlycut.dock);
			removeMessageListener('tcutpaste',tiddlycut.paste);		
			removeMessageListener('tcuttids',tiddlycut.cuttids);
			removeMessageListener('tcut',tiddlycut.cut);
			removeMessageListener('tchlight',tiddlycut.hlight);
			removeMessageListener('tcdock',tiddlycut.dock);
		} catch (e) {
		}

		content.addEventListener('unload', tiddlycut.unload);
}).bind(tiddlycut);

tiddlycut.contextListener = (function(e) { 
	//when context menu appears, needed data from the content is send to background. id is alo send so current frame is identified
	tiddlycut.log('contextmenu',tiddlycut.tabN, content.location.href);
	var messageBox = content.document.getElementById("tiddlyclip-message-box");
	if(messageBox) {	//this is a tw file in the 	
		//BJ HACK - really we should only add paste listens to docked tws not all of them with the tc plugin
		addMessageListener('tcutpaste',tiddlycut.paste);//paste is the only persistant listener - all the rest are one shot.
		addMessageListener('tcdock',tiddlycut.dock);
	}
	addMessageListener('tchlight',tiddlycut.hlight);
	addMessageListener('tcuttids',tiddlycut.cuttids);
	addMessageListener('tcut',tiddlycut.cut);
	sendAsyncMessage('tcutrequest', {data:
		{req: 'focusedtab', istarget:!!messageBox, id: tiddlycut.tabN, 
			loc: content.location.href, tit: content.document.title, twc:isTiddlyWikiClassic(), tw5:isTiddlyWiki5()
	}});
	tiddlycut.log('contextmenu sent',tiddlycut.tabN);
}).bind(tiddlycut);

	function isTiddlyWikiClassic() {
		//from tiddlyfox
		// Test whether the document is a TiddlyWiki (we don't have access to JS objects in it)
		
		var doc = content.document;
		var versionArea = doc.getElementById("versionArea");
		return !!(doc.getElementById("storeArea") &&
			(versionArea && /TiddlyWiki/.test(versionArea.text)));
	}

	function isTiddlyWiki5() {
		//from tiddlyfox
		// Test whether the document is a TiddlyWiki5 (we don't have access to JS objects in it)
		var doc = content.document;
		var metaTags = doc.getElementsByTagName("meta"),
			generator = false;
		for(var t=0; t<metaTags.length; t++) {
			if(metaTags[t].name === "application-name" && metaTags[t].content === "TiddlyWiki") {
				generator = true;
			}
		}
		return generator;
	}

	function findTiddlerInPage_ByTitle(title) {
		
		var i,tid,nodes = content.document.getElementById("storeArea").getElementsByTagName('div');
		//try version 2.2 style store 
		for(i=0; i<nodes.length; i++) 
			if(title===nodes[i].getAttribute('title')) 
				break;

		if (i !== nodes.length) { 
			//tid= htmlthis(nodes[i],true,content.location.href);
			return extractToJson(nodes[i]);
		}
		//not found in a version 2.2 store, try 2.1 style
		for(i=0; i<nodes.length; i++) 
			if(title===nodes[i].getAttribute('tiddler')) 
				break;
				
		if (i !== nodes.length) { 
			//tid= htmlthis(nodes[i],true,content.location.href);
			return extractToJson(nodes[i]);
		}
		return null; //not found
	}
	function findTiddlersInPage_ByTag(tag) {
		var i,tid, nodes = content.document.getElementById("storeArea").getElementsByTagName('div');
		var found=false;
		remoteTidArr= [];
		for(i=0; i<nodes.length; i++) 
			if (nodes[i].getAttribute("tags") != null) {
				
				if(nodes[i].getAttribute("tags").indexOf(tag) !== -1) {
					found = true;
					tid = nodes[i];
					remoteTidArr.push(extractToJson(tid)); 
				}
			}	
		return found?remoteTidArr:null; 
	}
	
	function extractToJson(node) {//based on tw5 boot
		htmlDecode = function(s) {
				return s.toString().replace(/&lt;/mg,"<").replace(/&nbsp;/mg,"\xA0").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
			};
		var e = node.firstChild;
		while(e && e.nodeName.toLowerCase() !== "pre") {
			e = e.nextSibling;
		}
		var title = node.getAttribute ? node.getAttribute("title") : null;
		if(e && title) {
			var attrs = node.attributes,
				tiddler = {
					text: htmlDecode(e.innerHTML)
				};
			for(var i=attrs.length-1; i >= 0; i--) {
				tiddler[attrs[i].name] = attrs[i].value;
			}
			return JSON.stringify(tiddler);
		} else {
			return "";
		}
	}
	
	function snap(size){ 
        var document = content.document;
		var thumbnail = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
		thumbnail.mozOpaque = true;
		//if any text is selected temporarly remove this while making the snap
			var range, sel = content.getSelection();
			try{
				if (sel.getRangeAt) {
					range = sel.getRangeAt(0);
				}
				if (range) {
					sel.removeAllRanges();
				} 
			} catch(e) {range=null;} 
		var win = content;
		var ctx = thumbnail.getContext("2d");
		thumbnail.width = win.innerWidth*size;
		thumbnail.height = win.innerHeight*size;
		ctx.scale(size, size);
		ctx.drawWindow(	win, win.scrollX, win.scrollY, win.innerWidth,
						win.innerHeight, "rgb(255,255,255)");
		//Create a data url from the canvas
		var data = thumbnail.toDataURL("image/png");
		//re-apply selected text (if any)
			if (range) {
				sel.addRange(range);
			} 
		return data.substring(data.indexOf(',') + 1);
	}
	
	// Return plain text selection as a string.
	function getSelectedAsText()
	{
		var selectedText = "";
		var chrome = content.document;
		var element = content.focusedElement;
		if(element) {// only allow input[type=text]/textarea
			if (element.tagName === "TEXTAREA" ||(element.tagName === "INPUT" && element.type === "text")) {
				return element.value.substring(element.selectionStart,element.selectionEnd);
			}
		} {
			try
				{
					var selection = content.getSelection();
					selectedText = selection.toString();
				}
			catch(e)
				{

				}
			
			}
		//tiddlycut.log("selectedtext ",selectedText);
		return selectedText;
	}
	
	//-------------------------------------------------- cut as html ------------------------------------
	function getHtml(styles)
	{
		var selection;
		try
			{
			selection = content.getSelection();
			}
		catch(e)
			{

			}
		var range;	
		try {
			range = selection.getRangeAt(0);
			var documentFragment = range.cloneContents();
			var mydiv = content.document.createElement("div");

			if (styles){				
				mydiv.style.cssText = "display: none";
				mydiv.appendChild(documentFragment);
				var container = range["startContainer"];
			   // Check if the container is a text node and return its parent if so
				var mycon =( container.nodeType === 3 ? container.parentNode : container);
				mycon.appendChild(mydiv);
			}
			else
				mydiv.appendChild(documentFragment);
			return mydiv;
		}
		catch(e) { return null; }//if there is no selected
	}
	
	function htmlEncode(param)
	{
		return(param.replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;"));
	}
	function getSelectedAsHtml(alocation,astyles,asafe){
		var location = alocation||content.location.href;
		var styles = astyles||false;
		var safe = asafe||false;
		var aDiv=getHtml(styles);
		if (!!aDiv) 
			if (safe) {
				var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
					.createInstance(Components.interfaces.nsIDOMParser);
				var systemPrincipal = Components.classes["@mozilla.org/systemprincipal;1"]
                      .createInstance(Components.interfaces.nsIPrincipal); 
				parser.init(systemPrincipal);
				return parser.sanitize(htmlthis(aDiv,null,location,styles),0).replace (/([\s|\S]*)\<body\>([\s|\S]*)\<\/body\>([\s|\S]*)/,"$2");
			}
			else
				return htmlthis(aDiv,null,location,styles);
		else return null;
	}
	
	var htmlthis =( 
		function() {
		  var ELEMENT = this.Node?Node.ELEMENT_NODE:1,
				 TEXT = this.Node?Node.TEXT_NODE:   3;
		  return function html(el, outer, LOCALE, styles) {
					var i = 0, j = el.childNodes, k = outer?"<" + (m = el.nodeName.toLowerCase()) + attr(el,LOCALE) + ">":"",
						l = j.length, m, n;//els[i].setAttribute("style", content.getComputedStyle(els[i]).cssText);
					while(i !== l) switch((n = j[i++]).nodeType) {
					  case ELEMENT: {
						  if (styles) copyComputedStyles(n);
						  k += html(n, true, LOCALE); break;
						 }
					  case TEXT:    k += htmlEncode( n.nodeValue);
					} 
					if (m==='br') return k;
					return k + (outer?"</" + m + ">":"");
				}; 
		function attr(el,LOCALE) {
			var i = 0, j = el.attributes, k = new Array(l = j.length), l, nm,v;
			while(i !== l) {
				nm = j[i].nodeName ;
				v = j[i].value;
				k[i]='';
				//check to see if src is local, add path if it is 
				if ((nm==='src')||(nm==='href')){
					var pathStart = v.substring(0,4);
									
					if ((pathStart==='file') ||(pathStart === 'http'))
						k[i] +=nm + '="'+ v + '"'; 
					else {
						if (nm==='src') {
							var locale = LOCALE.split('//');
							locale = locale[0]+'//'+locale[1].split('/')[0];
							k[i] +=nm +  '="'+ locale+v + '"';
						}
						else
							k[i] +=nm +  '="'+ LOCALE+v + '"';	
					}
				}
				else
					k[i] +=nm + '="'+ v +'"';
				//alert(nm+" ="+v);
				i++;
			}
			return (l?" ":"") + k.join(" ");
	  }
	})();
//-------------------------------------------- cut tids ------------------------------------
	
tiddlycut.cuttids = (function(messageEvent) {
	// @param -id is tab id
	this.log("cuttids recieved");
	var rcvd = messageEvent.json.data;
	var callback = messageEvent.json.callback;
	try {
		if (rcvd.tid != this.tabN){
			this.log("cuttids not this ",this.tabN," yours ",rcvd.tid);
		}else {
			this.log("cuttids found",this.tabN);
			var tids = rcvd.useSelectTitle	?findTiddlerInPage_ByTitle(getSelectedAsText())
											:rcvd.title	?findTiddlerInPage_ByTitle(rcvd.title)
														:findTiddlersInPage_ByTag(rcvd.tag);
			if (!tids) content.alert("tiddler not found");											
			sendAsyncMessage('tcutrequest', 
				{callback: callback,
				 data:{req: 'cuttidrespond', id: tiddlycut.tabN, category:rcvd.category, text: getSelectedAsText(), 
					tids:tids
			}});	
			this.log("cuttids responded",this.tabN,findTiddlerInPage_ByTitle(rcvd.title));
			removeMessageListener('tcut',tiddlycut.cut);// remove listern  - one off request
			removeMessageListener('tcuttids',tiddlycut.cuttids);
			removeMessageListener('tchlight',tiddlycut.hlight);
			this.log("cut removed listen",this.tabN);
			return;
		}
	} catch (e) {
		this.log('callback error:', e);
		return;
	}
}).bind(tiddlycut);
//-------------------------------------------- cut  ------------------------------------
	
tiddlycut.cut = (function(messageEvent) {
	// @param -id is tab id
	this.log("cut recieved");
	var rcvd = messageEvent.json.data;
	var callback = messageEvent.json.callback;
	try {
		if (rcvd.tid != this.tabN){
			this.log("cut not this ",this.tabN," yours ",rcvd.tid);
		}else {
			this.log("cut found",this.tabN);
			sendAsyncMessage('tcutrequest', 
				{callback: callback,
				 data:{req: 'cutrespond', id: tiddlycut.tabN, category:rcvd.category, text: getSelectedAsText(), 
					snap: rcvd.doSnap?snap(rcvd.snapSize):"",html:getSelectedAsHtml()
			}});	
			this.log("cut responded",this.tabN);
			removeMessageListener('tcut',tiddlycut.cut);// remove listern  - one off request
			removeMessageListener('cuttids',tiddlycut.cuttids);
			removeMessageListener('tchlight',tiddlycut.hlight);
			this.log("cut removed listen",this.tabN);
			return;
		}
	} catch (e) {
		this.log('callback error:', e);
		return;
	}
}).bind(tiddlycut);
//--------------------------------------hlight-------------------------------------------
tiddlycut.hlight = (function(messageEvent) {
	// @param -id is tab id
	this.log("hlight recieved");
	var rcvd = messageEvent.json.data;
	try {
		if (rcvd.tid != this.tabN){
			this.log("hlight not this ",this.tabN," yours ",rcvd.tid);
		}else {
			this.log("hlight found",this.tabN);
			//set edit comand in document - this causes loss of selection of text - so remember here
			var range, sel = content.getSelection();
			if (sel.getRangeAt) {
				range = sel.getRangeAt(0);
			}
			content.document.designMode = "on";
			//restore selection of text
			if (range) {
				sel.removeAllRanges();
				sel.addRange(range);
			} 
			//content.setTimeout('document.designMode = "on"',1000);
			//here I should also add my own class and then use this in the application ".tchighlight"
			content.document.execCommand("backcolor", false, "#ffd700");
			content.document.execCommand("styleWithCSS",false,"false");
			content.document.execCommand("forecolor",false,"#fe0d0c");

			content.document.designMode = 'Off'; 
			removeMessageListener('tcut',tiddlycut.cut);// remove listern  - one off request
			removeMessageListener('tcuttids',tiddlycut.cuttids);
			removeMessageListener('tchlight',tiddlycut.hlight);
			return;
		}
	} catch (e) {
		this.log('callback error:', e);
		return;
	}
}).bind(tiddlycut);
//-----------------------------paste------------------------------------------
tiddlycut.paste = (function(messageEvent) {
	// @param -id is tab id
	//tiddlycut.focusedtab=request.id;
	this.log("paste recieved");
	try {
		if (messageEvent.json.data.tid != this.tabN)
		{
			this.log("paste wrong id mine yors",this.tabN,messageEvent.json.data.tid);	
			return;}


	} catch (e) {
		this.log('callback error:', e);
		return;
	}
	this.log("paste found",this.tabN);
	try{
	// Find the message box element
		var messageBox = content.document.getElementById("tiddlyclip-message-box");
		if(messageBox) {
			// Create the message element and put it in the message box
			var message = content.document.createElement("div");
			message.setAttribute("data-tiddlyclip-category",messageEvent.json.data.category);
			message.setAttribute("data-tiddlyclip-pageData",messageEvent.json.data.pageData);
			message.setAttribute("data-tiddlyclip-currentsection",messageEvent.json.data.currentsection);
			this.log("paste put in message box--", JSON.stringify(messageEvent.json.data.pageData),"---",JSON.stringify(messageEvent.json.data.category))
			messageBox.appendChild(message);
			// Create and dispatch the custom event to the extension
			var event = content.document.createEvent("Events");
			event.initEvent("tiddlyclip-save-file",true,false);
			this.log("paste event ready to sent to page");
			message.dispatchEvent(event);
			this.log("after paste event sent to page");
		}
		removeMessageListener('tcut',tiddlycut.cut);// remove listern  - one off request
		removeMessageListener('tcuttids',tiddlycut.cuttids);
		removeMessageListener('tchlight',tiddlycut.hlight);
	} catch (e) {this.log(e);};
}).bind(tiddlycut);
//----------------------------do dock--------------------------------
		//callback for dock	
tiddlycut.dock = (function(messageEvent) {
	// @param -id is tab id
	this.log("dock recieved");
	var rcvd = messageEvent.json.data;
	var callback = messageEvent.json.callback;
	try {
		if (rcvd.tid != this.tabN){
			this.log("dock not this ",this.tabN," yours ",rcvd.tid);
		}else {
			this.log("dock found",this.tabN);
			sendAsyncMessage('tcutrequest', 
				{callback: callback,
				 data:{req: 'dockrespond', config:findTiddlerInPage_ByTitle("TiddlyClipConfig")}});	
			this.log("dock responded",this.tabN,findTiddlerInPage_ByTitle("TiddlyClipConfig"));
			removeMessageListener('tcut',tiddlycut.cut);// remove listern  - one off request
			removeMessageListener('tcuttids',tiddlycut.cuttids);
			removeMessageListener('tchlight',tiddlycut.hlight);
			removeMessageListener('tcdock',tiddlycut.dock);
			this.log("dock removed listeners",this.tabN);
			return;
		}
	} catch (e) {
		this.log('callback error:', e);
		return;
	}
}).bind(tiddlycut)
//----------------do id------------------------------
tiddlycut.id= (function(messageEvent) { 
	this.log("id:",this.tabN,"page:",content.location.href);
}).bind(tiddlycut);
//--------------------------------------------------------------------	
tiddlycut.DOMLoaded= (function(ev) {
	// DOM ready. run on DOM page
	tiddlycut.docLoad(ev.originalTarget);
}).bind(tiddlycut);

tiddlycut.stop= (function() {
	removeMessageListener('tcutunload',tiddlycut.stop);
	removeEventListener('contextmenu',tiddlycut.contextListener,false );
	removeEventListener('DOMContentLoaded', tiddlycut.DOMLoaded,false);  
	removeMessageListener('tcutidentify',tiddlycut.id);
	removeMessageListener('tcutpaste',tiddlycut.paste);
	removeMessageListener('tcut',tiddlycut.cut);
	removeMessageListener('tchlight',tiddlycut.hlight);
	removeMessageListener('tcdock',tiddlycut.dock);
	tiddlycut.log("stop "+ tiddlycut.tabN); 
	tiddlycut = null; 
	delete tiddlycut;           
}).bind(tiddlycut);

tiddlycut.id= (function(messageEvent) { 
	this.log("id:",this.tabN,"page:",content.location.href);
}).bind(tiddlycut);

addMessageListener('tcutidentify',tiddlycut.id);
addMessageListener('tcutunload',tiddlycut.stop);
addEventListener('DOMContentLoaded', tiddlycut.DOMLoaded,false);
addEventListener('contextmenu',tiddlycut.contextListener,false);
}());
