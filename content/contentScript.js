'use strict';
(function () {

	var api = 
	{
	    docLoad:docLoad
	};
	var remoteTidArr  = [''];
	
	function getHtml()
	{
		var focusedWindow = window;
		var selection = focusedWindow.getSelection();
		var range;	
		try {
			range = selection.getRangeAt(0);
			var documentFragment = range.cloneContents();
			var mydiv = document.createElement("div");
			mydiv.appendChild(documentFragment);
			return mydiv;
		}
		catch(e) { return null; }//if there is not selected
	}
	
	function isTiddlyWikiClassic() {
		//from tiddlyfox
		// Test whether the document is a TiddlyWiki (we don't have access to JS objects in it)
		
		var doc = document;
		var versionArea = doc.getElementById("versionArea");
		return doc.getElementById("storeArea") &&
			(versionArea && /TiddlyWiki/.test(versionArea.text));
	}

	function isTiddlyWiki5() {
		//from tiddlyfox
		// Test whether the document is a TiddlyWiki5 (we don't have access to JS objects in it)
		var doc = document;
		var metaTags = doc.getElementsByTagName("meta"),
			generator = false;
		for(var t=0; t<metaTags.length; t++) {
			if(metaTags[t].name === "application-name" && metaTags[t].content === "TiddlyWiki") {
				generator = true;
			}
		}
		return (doc.location.protocol === "file:") && generator;
	}

	function extractToJson(node) {//based on tw5 boot
		var htmlDecode = function(s) {
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

	function findTiddlerInPage_ByTitle(title) {
		var winWrapper = document;
		var i,tid,nodes = winWrapper.getElementById("storeArea").getElementsByTagName('div');
		//try version 2.2 style store 
		for(i=0; i<nodes.length; i++) 
			if(title===nodes[i].getAttribute('title')) 
				break;

		if (i !== nodes.length) { 
			tid= extractToJson(nodes[i]);
			return tid;
		}
		//not found in a version 2.2 store, try 2.1 style
		for(i=0; i<nodes.length; i++) 
			if(title===nodes[i].getAttribute('tiddler')) 
				break;
				
		if (i !== nodes.length) { 
			tid= extractToJson(nodes[i]);
			return tid;
		}
		return null; //not found
	}
	function findTiddlersInPage_ByTag(tag) {
		var i,tid, nodes = document.getElementById("storeArea").getElementsByTagName('div');
		var found=false;
		remoteTidArr= [];
		for(i=0; i<nodes.length; i++) 
			if (nodes[i].getAttribute("tags") != null) {
				
				if(nodes[i].getAttribute("tags").indexOf(tag) !== -1) {
					found = true;
					tid = extractToJson(nodes[i]);
					remoteTidArr.push(tid); 
				}
			}	
		return found; 
	}
	function log(str){
		console.log(str);
    }
    function htmlEncode(param)
	{
		return(param.replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;"));
	}
   function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    }
    return text;
}
	function getSelectedAsHtml(location){
		var aDiv=getHtml();
		if (!!aDiv) 
			if (false) //maybe have a config parmeter for this //BJ!! need a sanitizer for chrome
				return parser.sanitize(htmlthis(aDiv,null,location),0);//0 is the flags
			else
				return htmlthis(aDiv,null,location);
		else return null;
	}
	
	var htmlthis =( //TODO I can dd a switch to download and save local version of the 'src' files
		function() {
		  var ELEMENT = 1,
				 TEXT = 3;
		  return function html(el, outer, LOCALE) {
					var i = 0, j = el.childNodes, k = outer?"<" + (m = el.nodeName.toLowerCase()) + attr(el,LOCALE) + ">":"",
						l = j.length, m, n;
					while(i !== l) switch((n = j[i++]).nodeType) {
					  case ELEMENT: k += html(n, true, LOCALE); break;
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

	function injectMessageBox(doc) {
		// Inject the message box
		var messageBox = doc.getElementById("tiddlyclip-message-box");
		if(!messageBox) {
			messageBox = doc.createElement("div");
			messageBox.id = "tiddlyclip-message-box";
			messageBox.style.display = "none";
			doc.body.appendChild(messageBox);
		}
	};
    var docked= false;
	function docLoad(doc) {
	//	if (doc.nodeName != '#document')
	//		return;
		//addEventListener('contextmenu', function (e) {tiddlycut.log("cm",e)});

		//callback for dock
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'actiondock') {
					// first stage send back url
					tiddlycut.log("actiondock cs");
					injectMessageBox(document);
					var docked = true;
					sendResponse({title:document.title, url:window.location.href, config:findTiddlerInPage_ByTitle("TiddlyClipConfig"),opts:findTiddlerInPage_ByTitle(request.data.opttid)});
				}
		});
		//callback for cut
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'cut') {
					// first stage send back url
					tiddlycut.log("cut  content cs");
					remoteTidArr  = [''];
					sendResponse({ url:window.location.href, html:getSelectedAsHtml(window.location.href), 
						title:document.title, twc:isTiddlyWikiClassic()||false, tw5:isTiddlyWiki5()});
				}
		});
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'cutTid') {
					// first stage send back url
					tiddlycut.log("cutTid  content cs");

					sendResponse({ url:window.location.href, tids:cutTids(), title:document.title, 
						twc:isTiddlyWikiClassic()||false, tw5:isTiddlyWiki5()});
				}
		});
		//callback for paste
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'paste') {
					tiddlycut.log("paste content cs");
				// Find the message box element
				var messageBox = document.getElementById("tiddlyclip-message-box");
				if(messageBox) {
					// Create the message element and put it in the message box
					var message = document.createElement("div");
					message.setAttribute("data-tiddlyclip-category",request.data.category);
					message.setAttribute("data-tiddlyclip-pageData",request.data.pageData);
					message.setAttribute("data-tiddlyclip-currentsection",request.data.currentsection);
					messageBox.appendChild(message);
					tiddlycut.log("tid appended ",request.data.pageData);
					// Create and dispatch the custom event to the extension
					var event = document.createEvent("Events");
					event.initEvent("tiddlyclip-save-file",true,false);
					message.dispatchEvent(event);
					tiddlycut.log("paste event sent");
				}
			}
		});
		tiddlycut.log("we are inside"+window.location);
		// ensure #content is available
		var content = doc.getElementById('content');
		if (!content)
			return;
	};
	function cutTids() {
		var title={}, tag={}, cancelled={};
			var text =getSelectionText();
			if (text!='') {
				var tid=findTiddlerInPage_ByTitle(text);
				if (!tid){ 
					alert ("Not a tiddler");
					return ; //error
				}
				else remoteTidArr[0]= tid;//string
			} else {
				//put up a window for the user to enter the name and tag
				//of tiddlers then find matching tids in this page
				//tcBrowser.EnterTidNameDialog (title, tag, cancelled);
				var key = window.prompt('Enter tag');
				tag.value =key;
				if (cancelled.value==true) {return ;}
				if (tag.value ==="") {				
					if (title.value == "") return ;
					var tid=findTiddlerInPage_ByTitle(title.value);
					if (!tid){ 
						alert ("No tiddler");
						return ; //error
					}
					else remoteTidArr[0]= tid;
				}
				else if (false===findTiddlersInPage_ByTag(tag.value)){ 
						alert ("No tiddlers");
						return ; //error
				}				
			return remoteTidArr ;	
		}
		return remoteTidArr;//no error
	}//end func
//window.onbeforeunload = function() { if (docked) {alert("I'm going dooooon");}};
window.addEventListener('DOMContentLoaded', function() {
		docLoad(document);
}, false);

}());
