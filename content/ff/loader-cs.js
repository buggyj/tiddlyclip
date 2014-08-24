'use strict';
(function ()
{
	var tiddlycut = {};

if (typeof(tiddlycut.log) === 'undefined'){
	var consoleService = Components.classes['@mozilla.org/consoleservice;1']
								.getService(Components.interfaces.nsIConsoleService);
	tiddlycut.log = function() {
		var i, concated = '', hasError = false;
		var args = Array.prototype.slice.apply(arguments);
		concated=args.join(' ');
		consoleService.logStringMessage('tiddlycut: ' + concated);
	};
};

tiddlycut.entry = {};
Components.utils.import("chrome://tiddlycut/content/ff/tabId.jsm",tiddlycut);//just a common numbering for tabs
tiddlycut.tabN =tiddlycut.tiddlycutgettabN();

tiddlycut.log("cs" + tiddlycut.tabN);

tiddlycut.unloadpre = function() {
	if (!!content) content.removeEventListener('unload', this.unload);
	this.log("unload ev cs",this.tabN);
	try { 	// if the tab is closing then the source of the message can be invalid
			//- tabclose is watch for in background-server and sends this message when seen  
		sendAsyncMessage('tcutrequest', {data:{req: 'pageChanged', id: this.tabN}}); 
	} catch (e) {
	}
}	 
tiddlycut.unload=tiddlycut.unloadpre.bind(tiddlycut);

tiddlycut.docLoad = function(doc) {
	if (doc.nodeName != '#document') tiddlycut.log("in docload fail");
			//return?;
		tiddlycut.log("in docload");
		content.addEventListener('unload', tiddlycut.unload);
}

tiddlycut.contextListener= function(e) { 
   tiddlycut.log('contextmenu',tiddlycut.tabN, content.location.href);
   var messageBox = content.document.getElementById("tiddlyclip-message-box");
      if(messageBox) {	//this is a tw file in the 	
		  //BJ HACK - really we should only add paste listens to docked tws not all of them with the tc plugin
		  addMessageListener('tcutpaste',tiddlycut.paste);
			sendAsyncMessage('tcutrequest', {data:{req: 'focusedtab', id: tiddlycut.tabN}});
	  } else sendAsyncMessage('tcutrequest', {data:{req: 'focusedtab', id: 0}});
}

tiddlycut.Init = function() {
	//tiddlycut.log("2cs" + tiddlycut.tabN);


		tiddlycut.paste = function(messageEvent) {
			// @param -id is tab id
			//tiddlycut.focusedtab=request.id;
			tiddlycut.log("paste recieved");
			try {
				if (messageEvent.json.data.tid != tiddlycut.tabN)
				{
					tiddlycut.log("paste wrong id mine yors",tiddlycut.tabN,messageEvent.json.data.tid);	
					return;}


			} catch (e) {
				tiddlycut.log('callback error:', e);
				return;
			}
			tiddlycut.log("paste found",tiddlycut.tabN);
			try{
			// Find the message box element
			var messageBox = content.document.getElementById("tiddlyclip-message-box");
			if(messageBox) {
				// Create the message element and put it in the message box
				var message = content.document.createElement("div");
				message.setAttribute("data-tiddlyclip-category",messageEvent.json.data.category);
				message.setAttribute("data-tiddlyclip-pageData",messageEvent.json.data.pageData);
				message.setAttribute("data-tiddlyclip-currentsection",messageEvent.json.data.currentsection);
				tiddlycut.log("paste put in message box")
				messageBox.appendChild(message);
				// Create and dispatch the custom event to the extension
				var event = content.document.createEvent("Events");
				event.initEvent("tiddlyclip-save-file",true,false);
				tiddlycut.log("paste event ready to sent to page");
				message.dispatchEvent(event);
				tiddlycut.log("after paste event sent to page");
			}
			} catch (e) {tiddlycut.log(e);};
		}
	addMessageListener('tcutunload',tiddlycut.stop);
	addEventListener('DOMContentLoaded', tiddlycut.DOMLoaded, false);
	addEventListener('contextmenu',tiddlycut.contextListener );
};

tiddlycut.DOMLoaded= function(ev) {
	// DOM ready. run on DOM page
	tiddlycut.docLoad(ev.originalTarget);
};

tiddlycut.stop= function() {
	removeMessageListener('tcutunload',tiddlycut.stop);
	tiddlycut.log("stop "+ tiddlycut.tabN); 
	removeEventListener('contextmenu',tiddlycut.contextListener,false );
	removeEventListener('DOMContentLoaded', tiddlycut.DOMLoaded, false);  
	//delete tiddlycut;  delete window.tiddlycut; delete  browser.tiddlyclut;???? dont work
	tiddlycut = null;            

};

tiddlycut.Init();
}());

