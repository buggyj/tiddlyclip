tiddlycut.modules.tcBrowser= (function () {

	var api = 
	{
		onLoad:onLoad, 						getSelectedAsText:getSelectedAsText, 	
		setOnLink:setOnLink,				getClipboardString:getClipboardString, 	setImageURL:setImageURL,
		getHtml:getHtml, 					hasCopiedText:hasCopiedText, 			hasSelectedText:hasSelectedText, 		
		winWrapper:winWrapper,				EnterTidNameDialog:EnterTidNameDialog, 
		getPageTitle:getPageTitle, 			getPageRef:getPageRef, 					getStr:getStr, 
		getImageURL:getImageURL,			getLargestImgURL:getLargestImgURL,		snap:snap,
	    log:log,							htmlEncode:htmlEncode,					onImage:onImage,
	    onLink:onLink,						setOnImage:setOnImage,					
	    getSelectedAsHtml:getSelectedAsHtml,createDiv:createDiv,
	    isTiddlyWikiClassic:isTiddlyWikiClassic, UserInputDialog:UserInputDialog
	}
	var parser = Components.classes["@mozilla.org/parserutils;1"].
			getService(Components.interfaces.nsIParserUtils);  
    var defaults;
    var _strings_bundle_default;
    var chrome, browseris;
    const PREF_BRANCH = "extensions.tiddlyfox";

	function onLoad(browser, doc) {
		browseris 	= browser;
		chrome=doc;
		defaults	= tiddlycut.modules.defaults;
		_strings_bundle_default =
				Components.classes['@mozilla.org/intl/stringbundle;1']
				.getService(Components.interfaces.nsIStringBundleService)
				.createBundle('chrome://tiddlycut/locale/tiddlycut.properties');
	}
	function winWrapper (where) {
		return new XPCNativeWrapper(where);			
	}

    //variables to store non-persistance broswer data (from gContextMenu)
    var onImage, onLink, imageUrl;
    
	function snap(size){
		var tab = gBrowser.selectedTab;
		var thumbnail = window.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
		thumbnail.mozOpaque = true;
		var win = tab.linkedBrowser.contentWindow;
		var ctx = thumbnail.getContext("2d");
		thumbnail.width = win.innerWidth*size;
		thumbnail.height = win.innerHeight*size;
		ctx.scale(size, size);
		ctx.drawWindow(	win, win.scrollX, win.scrollY, win.innerWidth,
						win.innerHeight, "rgb(255,255,255)");
		//Create a data url from the canvas
		var data = thumbnail.toDataURL("image/png")
		return data.substring(data.indexOf(',') + 1);
	}
	function setImageURL() {
		imageUrl= gContextMenu.imageURL || gContextMenu.mediaURL;
	}
	function getImageURL() {
		return imageUrl;
	}
	function getLargestImgURL() {
		var isize=0, url='', imgs = content.document.querySelectorAll('img');	
		for (var img in imgs) {
			//var imgh = imgs[img].height?imgs[img].height|1;
			var imgsize = imgs[img].width;
			if (!imgsize) imgsize = 0;
			if (isize < imgsize) {
				isize = imgsize;
				url = imgs[img].src;
			}	
		}
		return url;
	}
	function setOnImage(){
		onImage= gContextMenu.onImage;
	}
	function onImage(){
		return onImage;
	}
	function setOnLink(){
		onLink= gContextMenu.onLink;
	}
	function onLink(){
		return onLink;
	}
	// Return plain text selection as a string.
	function getSelectedAsText()
	{
		var selectedText = "";
		var element = chrome.commandDispatcher.focusedElement;
		if(element) {// only allow input[type=text]/textarea
			if (element.tagName === "TEXTAREA" ||(element.tagName === "INPUT" && element.type === "text")) {
				return element.value.substring(element.selectionStart,element.selectionEnd);
			}
		} {

			var focusedWindow = chrome.commandDispatcher.focusedWindow;
			try
				{
					var selection = focusedWindow.getSelection();
					selectedText = selection.toString();
				}
			catch(e)
				{

				}
			
			}
		return selectedText;
	}

	// Remove certain characters from strings so that they don't interfere with tiddlyLink wikification.
	function tiddlyLinkEncode(str) {
		str = str.replace("|",":","gi");
		str = str.replace("[[","(","gi");
		str = str.replace("]]",")","gi");
		return str;
	}

    function createDiv(){
		return content.document.createElement("div");
	}
	
	// Returns plain text from clipboard if any, or ''.
	function getClipboardString()
	{
		var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
		if (!clip)
			return false;
		var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
		if (!trans)
			return false;
		trans.addDataFlavor("text/unicode");
		clip.getData(trans,clip.kGlobalClipboard);
		var str = new Object();
		var strLength = new Object();
		try
			{
			trans.getTransferData("text/unicode",str,strLength);
			}
		catch(e)
			{
			return '';
			}
		if(str)
			str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
		if (str)
			var text = str.data.substring(0,strLength.value / 2);
		return text;
	}

	function getPageTitle() {
		return tiddlyLinkEncode(content.document.title);
	}
	function getPageRef () {
		return  tiddlyLinkEncode(content.location.href); 
	}
	function getHtml(styles)
	{
		var focusedWindow = chrome.commandDispatcher.focusedWindow;
		var selection;
		try
			{
			selection = focusedWindow.getSelection();
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

	function hasCopiedText() {
		return getClipboardString().length > 0;
	}
	// Check if there is any selected text.
	function hasSelectedText(){
		try	{
			var text = getSelectedAsText();
			if(text != "") return true;
		}catch(e) {}
		return false;
	}
	
	function isTiddlyWikiClassic() {
		//from tiddlyfox
		// Test whether the document is a TiddlyWiki (we don't have access to JS objects in it)
		
		var doc =  winWrapper(content.document);
		var versionArea = doc.getElementById("versionArea");
		return !!(doc.getElementById("storeArea") &&
			(versionArea && /TiddlyWiki/.test(versionArea.text)));
	}

	function isTiddlyWiki5() {
		//from tiddlyfox
		// Test whether the document is a TiddlyWiki5 (we don't have access to JS objects in it)
		var doc =  winWrapper(content.document);
		var metaTags = doc.getElementsByTagName("meta"),
			generator = false;
		for(var t=0; t<metaTags.length; t++) {
			if(metaTags[t].name === "application-name" && metaTags[t].content === "TiddlyWiki") {
				generator = true;
			}
		}
		return (doc.location.protocol === "file:") && generator;
	}
	
 	function EnterTidNameDialog(title, tag, cancelled) {
		tiddlycut.log("tid diag");
		window.openDialog("chrome://tiddlycut/content/app/tiddlerSearch.xul",
						  "existWindow",
						  "chrome,centerscreen,modal=yes",title,tag,cancelled);
	}

	function getStr(name)
	{
		//return document.getElementById("tiddlycut-strings").getString(name);

		try {	
		return		_strings_bundle_default.getString(name);
	}
	catch (e) { return "not known"; }
				    
	}

	function log(str){
		console.log(str);
        aConsoleService.logStringMessage("tc: "+str);
    }
    function htmlEncode(param)
	{
		return(param.replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;"));
	}
	function getSelectedAsHtml(location,styles,safe){
		var aDiv=getHtml(styles);
		if (!!aDiv) 
			if (safe) 
				return parser.sanitize(htmlthis(aDiv,null,location,styles),0).replace (/([\s|\S]*)\<body\>([\s|\S]*)\<\/body\>([\s|\S]*)/,"$2");
			else
				return htmlthis(aDiv,null,location,styles);
		else return null;
	}
	
	var htmlthis =( 
		function() {
		  var ELEMENT = this.Node?Node.ELEMENT_NODE:1,
				 TEXT = this.Node?Node.TEXT_NODE:   3;
		  return function html(el, outer, LOCALE, styles) {
			  var focusedWindow = chrome.commandDispatcher.focusedWindow;
					var i = 0, j = el.childNodes, k = outer?"<" + (m = el.nodeName.toLowerCase()) + attr(el,LOCALE) + ">":"",
						l = j.length, m, n;//els[i].setAttribute("style", window.getComputedStyle(els[i]).cssText);
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
function dumpComputedStyles(elem,prop) {

  var cs = elem.ownerDocument.defaultView.getComputedStyle(elem,null);
  if (prop) {
    tiddlycut.log("    "+prop+" : "+cs.getPropertyValue(prop)+"\n");
    return;
  }
  var len = cs.length;
  for (var i=0;i<len;i++) {
 
    var style = cs[i];
    tiddlycut.log("    "+style+" : "+cs.getPropertyValue(style)+"\n");
  }

};
function copyComputedStyles(elem) {

  var cs = elem.ownerDocument.defaultView.getComputedStyle(elem,null);
  var xx='';
  var len = cs.length;
  for (var i=0;i<len;i++) {
    var style = cs[i];
     //tiddlycut.log("    "+style+" : "+cs.getPropertyValue(style)+"\n");

    var val = cs.getPropertyValue(style);
    var stl = style;
    
if (stl.substr(0,1) == '-') continue;//mozilla private styles
    //elem.setAttribute(stl,val);
    xx+=stl+':'+val+';';
  }
  elem.style.cssText = xx;

};

function  UserInputDialog(prompt, response) {
		window.openDialog("chrome://tiddlycut/content/app/userInput.xul",
					  "existWindow",
					  "chrome,centerscreen,modal=yes",prompt,response);
}
//function must go before     
	return api;
}());


