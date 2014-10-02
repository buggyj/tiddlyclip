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

Components.utils.import("chrome://tiddlycut/content/ff/tabId.jsm",tiddlycut);//just a common numbering for tabs
tiddlycut.tabN =tiddlycut.tiddlycutgettabN();

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
			removeMessageListener('tcutpaste',tiddlycut.paste);		
		} catch (e) {
		}

		content.addEventListener('unload', tiddlycut.unload);
}).bind(tiddlycut);

tiddlycut.contextListener = (function(e) { 
   tiddlycut.log('contextmenu',tiddlycut.tabN, content.location.href);
   var messageBox = content.document.getElementById("tiddlyclip-message-box");
      if(messageBox) {	//this is a tw file in the 	
		  //BJ HACK - really we should only add paste listens to docked tws not all of them with the tc plugin
		  addMessageListener('tcutpaste',tiddlycut.paste);
			sendAsyncMessage('tcutrequest', {data:{req: 'focusedtab', id: tiddlycut.tabN}});
	  } else sendAsyncMessage('tcutrequest', {data:{req: 'focusedtab', id: 0}});
}).bind(tiddlycut);

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
			this.log("paste put in message box")
			messageBox.appendChild(message);
			// Create and dispatch the custom event to the extension
			var event = content.document.createEvent("Events");
			event.initEvent("tiddlyclip-save-file",true,false);
			this.log("paste event ready to sent to page");
			message.dispatchEvent(event);
			this.log("after paste event sent to page");
		}
	} catch (e) {this.log(e);};
}).bind(tiddlycut);

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
