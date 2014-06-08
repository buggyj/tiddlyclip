tiddlycut.modules.tcBrowser= (function () {

	var api = 
	{
		onLoad:onLoad, 						getSelectedAsText:getSelectedAsText, 	
		setOnLink:setOnLink,				getClipboardString:getClipboardString, 	setImageURL:setImageURL,
		getHtml:getHtml, 					hasCopiedText:hasCopiedText, 			hasSelectedText:hasSelectedText, 		
		getPageTitle:getPageTitle, 			getPageRef:getPageRef, 					
		getImageURL:getImageURL,			winWrapper:winWrapper,
	    log:log,							htmlEncode:htmlEncode,					onImage:onImage,
	    onLink:onLink,						setOnImage:setOnImage,					
	    getSelectedAsHtml:getSelectedAsHtml,createDiv:createDiv,
	    setDatafromCS:setDatafromCS,		UserInputDialog:UserInputDialog,	setDataFromBrowser:setDataFromBrowser,
	   isTiddlyWikiClassic:isTiddlyWikiClassic
	}

    var convert,defaults;
    var _strings_bundle_default;
    var chrome, browseris;
    const PREF_BRANCH = "extensions.tiddlyfox";

	function onLoad(browser, doc) {
		browseris 	= browser;
		chrome=doc;
		defaults	= tiddlycut.modules.defaults;
	}
	
	function winWrapper (where) {
		return chrome; //BJ FIXME not sure if this is correct		
	}
    //variables to store non-persistance broswer data (from gContextMenu ff only - set by call otherwise
    var onImage=false, onLink=false, image, linkUrl, selectionText, url, html ,title, twc=false;

    function setDataFromBrowser(info, tab) {
		onImage = (info.mediaType==="image");
		if (onImage)	imageUrl = info.srcUrl;
		else 	imageUrl ='';
		linkUrl =info.linkUrl;
		onLink = (!!linkUrl);
		selectionText=info.selectionText;
	};	
	function setDatafromCS( aurl, ahtml, atitle, atwc) {
		html = ahtml;
		title =atitle;
		url = aurl;
		twc = atwc; 
	}
	function setImageURL() {
		imageUrl= gContextMenu.imageURL || gContextMenu.mediaURL;
	}
	function getImageURL() {
		return imageUrl;
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
     return selectionText;
	}

	// Remove certain characters from strings so that they don't interfere with tiddlyLink wikification.
	function tiddlyLinkEncode(str) {
		str = str.replace("|",":","gi");
		str = str.replace("[[","(","gi");
		str = str.replace("]]",")","gi");
		return str;
	}

    function createDiv(){
		return document.createElement("div");
	}
			
	// Returns plain text from clipboard if any, or ''.
	function getClipboardString()
	{
		var text = '';
		return text;
	}
	function getPageTitle() {
		return tiddlyLinkEncode(title);
	}
	function getPageRef () {
		return  tiddlyLinkEncode(url); 
	}
	function getHtml()
	{
		return html;
	}

	function hasCopiedText() {
		return getClipboardString().length > 0;
	}
	// Check if there is any selected text.
	function hasSelectedText(){
		try
			{
			var text = getSelectedAsText();
			if(text != null && text.length > 0)
				return true;
			}
		catch(err)
			{}
		return false;
	}
	
	function isTiddlyWikiClassic() {
		return twc;
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
		return (doc.location.protocol === "file:") && generator;
	}
	
	function log(str){
		console.log("tc: "+sstr);
    }
    function htmlEncode(param)
	{
		return(param.replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;"));
	}
	function getSelectedAsHtml(location,styles,safe){
				return html; //the getting of html is done by the content script asynchronously BUT sanitizing should be done here
		var aDiv=getHtml(styles);
		if (!!aDiv) 
			if (false) 
				return parser.sanitize(htmlthis(aDiv,null,location,styles),0).replace (/([\s|\S]*)\<body\>([\s|\S]*)\<\/body\>([\s|\S]*)/,"$2");
			else
				return htmlthis(aDiv,null,location,styles);
		else return null;
	}
	
	function  UserInputDialog(prompt, response) {
			window.openDialog("chrome://tiddlycut/content/app/userInput.xul",
						  "existWindow",
						  "chrome,centerscreen,modal=yes",prompt,response);
	}
//function must go before     
	return api;
}());


