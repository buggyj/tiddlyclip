tiddlycut.modules.tcBrowser= (function () {

	var api = 
	{
		onLoad:onLoad, 						getSelectedAsText:getSelectedAsText, 	
		getClipboardString:getClipboardString, 	
		getHtml:getHtml, 					hasCopiedText:hasCopiedText, 			hasSelectedText:hasSelectedText, 		
		getPageTitle:getPageTitle, 			getPageRef:getPageRef, 					snap:snap,
		getImageURL:getImageURL,			getLargestImgURL:getLargestImgURL,		winWrapper:winWrapper,
	    log:log,							htmlEncode:htmlEncode,					onImage:onImage,
	    onLink:onLink,						setSnapImage:setSnapImage,			
	    getSelectedAsHtml:getSelectedAsHtml,createDiv:createDiv,				getSnapImage:getSnapImage,
	    setDatafromCS:setDatafromCS,		UserInputDialog:UserInputDialog,	setDataFromBrowser:setDataFromBrowser,
		getlinkURL:getlinkURL,				onLinkLocal:onLinkLocal,			onLinkRemote:onLinkRemote,
		isTiddlyWikiClassic:isTiddlyWikiClassic, isTiddlyWiki5:isTiddlyWiki5
	}

    var convert,defaults;
    var _strings_bundle_default;
    var thechrome, browseris;
    const PREF_BRANCH = "extensions.tiddlyfox";

	function onLoad(browser, doc) {
		browseris 	= browser;
		thechrome=doc;
		defaults	= tiddlycut.modules.defaults;
	}
	
	function winWrapper (where) {
		return thechrome; //BJ FIXME not sure if this is correct		
	}
    //variables to store non-persistance broswer data  - set by call otherwise
    var onImage=false, onLink=false, image, linkUrl, selectionText, url, html ,title, twc=false, snapImage = "";
    
	function snap(size,sourcetab, callback){ //async in chrome

		var thumbnail = window.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
		var ctx = thumbnail.getContext("2d");
//-------------------------------------

//-------------------------------------			
chrome.tabs.get(sourcetab, function(tab){
	var h = tab.height, w = tab.width;
	thumbnail.width = w * size;
	thumbnail.height = h * size;
	ctx.scale(size, size);
          chrome.tabs.captureVisibleTab(null, {format: 'png', quality: 100}, function(dataURI) {
                if (dataURI) {
                    var image = new Image();
                    image.onload = function() {
                        ctx.drawImage(image,0, 0, w, h);
                        //Create a data url from the canvas
                        var data = thumbnail.toDataURL("image/png");
                        callback(data.substring(data.indexOf(',') + 1));
                    };
                    image.src = dataURI;
                }
            });		
//-----------------------------	

	});
}
    function setDataFromBrowser(info, tab) {
		onImage = (info.mediaType==="image");
		if (onImage)	imageUrl = info.srcUrl;
		else 	imageUrl ='';
		linkUrl =info.linkUrl;
		onLink = (!!linkUrl);
		selectionText=info.selectionText;
	};	
	function setDatafromCS( aurl, ahtml, atitle, atwc, atw5) {
		html = ahtml;
		title =atitle;
		url = aurl;
		twc = atwc; 
		tw5 = atw5;
	}
	function getImageURL() {
		return imageUrl;
	}
	function getSnapImage() { //snap is not alway called so set to blank for this case.
		var img = snapImage;
		//snapImage = "";
		return img;
	}
	function setSnapImage(img) { //snap is not alway called so set to blank for this case.
		
		snapImage = img;
	}
	function getLargestImgURL() {
		return '';
	}
	function onImage(){
		return onImage;
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
	function getlinkURL() {
		return linkUrl;
		return "";
	}
	function isTiddlyWiki5() {
		return tw5;
	}
		function onLinkLocal(){
		var local = /^file:/;
		return local.test(linkUrl);
		return false;
	}
	function onLinkRemote(){
		var local = /^file:/;
		return !local.test(linkUrl);
		return false;
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
						response.value = window.prompt(prompt);
	}
//function must go before     
	return api;
}());


