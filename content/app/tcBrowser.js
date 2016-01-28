tiddlycut.modules.tcBrowser= (function () {
	
    if(typeof tiddlycut.globaldock === 'undefined') var onemenu = false;
	else var onemenu = tiddlycut.globaldock;
	

	var api = 
	{
		onLoad:onLoad, 						getSelectedAsText:getSelectedAsText, 	
		setOnLink:setOnLink,				getClipboardString:getClipboardString, 	setImageURL:setImageURL,
		getHtml:getHtml, 					hasCopiedText:hasCopiedText, 			hasSelectedText:hasSelectedText, 		
		winWrapper:winWrapper,				EnterTidNameDialog:EnterTidNameDialog, 	getSnapImage:getSnapImage,
		getPageTitle:getPageTitle, 			getPageRef:getPageRef, 					getStr:getStr, 
		getImageURL:getImageURL,			getLargestImgURL:getLargestImgURL,		snap:snap,
	    log:log,							htmlEncode:htmlEncode,					onImage:onImage,
	    onLink:onLink,						setOnImage:setOnImage,					
	    getSelectedAsHtml:getSelectedAsHtml,createDiv:createDiv,
	    isTiddlyWikiClassic:isTiddlyWikiClassic, UserInputDialog:UserInputDialog,
	    setlinkURL:setlinkURL,				getlinkURL:getlinkURL,
	    onLinkLocal:onLinkLocal,			onLinkRemote:onLinkRemote, 
	    isTiddlyWiki5:isTiddlyWiki5,		setDatafromCS:setDatafromCS,
	    setOnTw5:setOnTw5,					setOnTwclassic:setOnTwclassic,
	    setHasSelectedText:setHasSelectedText
	}
	var parser = Components.classes["@mozilla.org/parserutils;1"].
			getService(Components.interfaces.nsIParserUtils);  
			
	var local = onemenu?one.local:{vonImage:null, vonLink:null, imageUrl:null, vlinkURL:null, snapImage:"", selectedText:null, html:"", istwclassic:false, istw5:false, textselected:false};
    
    var _strings_bundle_default;
    
    var chrome, browseris;

	function onLoad(browser, doc) {
		browseris 	= browser;
		chrome = doc;
		_strings_bundle_default =
				Components.classes['@mozilla.org/intl/stringbundle;1']
				.getService(Components.interfaces.nsIStringBundleService)
				.createBundle('chrome://tiddlycut/locale/tiddlycut.properties');
	}
	function winWrapper (where) {
		return new XPCNativeWrapper(where);			
	}

    
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
		var data = thumbnail.toDataURL("image/png");
		local.snapImage = data.substring(data.indexOf(',') + 1);
	}
	function setImageURL() {
		local.imageUrl= gContextMenu.imageURL || gContextMenu.mediaURL;
	}
	function getImageURL() {
		return local.imageUrl;
	}
	function getSnapImage() { //snap is not alway called so set to blank for this case.
		var img = local.snapImage;
		local.snapImage = "";
		return img;
	}
	function getLargestImgURL() { return null;//BJ fix 
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
		local.vonImage= gContextMenu.onImage;
	}
	function onImage(){
		return local.vonImage;
	}
	function setOnLink(){
		local.vonLink= gContextMenu.onLink;
	}
	function onLink(){
		return  local.vonLink;
	}
	function onLinkLocal(){
		var pattern = /^file:/;
		return pattern.test(local.vlinkURL);
	}
	function onLinkRemote(){
		var pattern = /^file:/;
		return !pattern.test(local.vlinkURL);
	}
	function setlinkURL() {
		local.vlinkURL= gContextMenu.linkURL;
	}
	function getlinkURL() {
		return local.vlinkURL;
	}
	function getSelectedAsText(){
		return local.selectedText;
	}	
	function setOnTwclassic(twclassic) {
		local.istwclassic = twclassic;
	}
	function setOnTw5(tw5) {
		local.istw5 = tw5;
	}
	function setDatafromCS( text, snap, ahtml, atwc, atw5) {
		local.selectedText = text;
		local.snapImage =snap;
		local.html = ahtml
		//tw5 = atw5;
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
		return tiddlyLinkEncode(gettiddlycuttit()||"no title");
	}
	function getPageRef () {
		return  tiddlyLinkEncode(gettiddlycutloc()||"no location"); 
	}
	function getHtml(styles)
	{return null;//BJ fix
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
	function setHasSelectedText(){	
		local.textselected = gContextMenu.isTextSelected;
	}
	
	// Check if there is any selected text.
	function hasSelectedText(){	
		return local.textselected;
	}

// these function are used to control display in the context menus so must be fired before popup occurs so must be executed when context menu appears
	function isTiddlyWikiClassic() {
		return local.istwclassic;
	}

	function isTiddlyWiki5() {
		return local.istw5;
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
		return	_strings_bundle_default.getString(name);
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
	function getSelectedAsHtml(location,styles,safe) {return local.html}
	
function  UserInputDialog(prompt, response) {
		window.openDialog("chrome://tiddlycut/content/app/userInput.xul",
					  "existWindow",
					  "chrome,centerscreen,modal=yes",prompt,response);
}
//function must go before     
	return api;
}());


