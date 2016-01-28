'use strict';
/*
 * background-server.js
 * handles the details of requests from content scripts, 
 * executed on extension load (on activate, reload and browser start)
 * Also if a tab is closed there maybe not enough time for the contentscript to
 * send a 'pageChanged' message so we listen for tab close here and send the message
 */


if (!tiddlycut.CSserver)
	tiddlycut.CSserver = {};

// listener for request from content script
tiddlycut.CSserver.contentRequestsListener = function(messageEvent) {
	//tiddlycut.log("enter bg listern",messageEvent.json.callbackToken);
	var request = messageEvent.json.data;
	var callback = messageEvent.data.callback;
	var action = messageEvent.data.action;
	tiddlycut.log("bg recv",request.id);
	try {
        if (callback) {
			tiddlycut.modules.browserOverlay.getcallback(callback)(request); return
		}
		if ('focusedtab' == action) {
			tiddlycut.log("focusedtab in win  ",tiddlycut.winN, request.id);
			settiddlycutActive(request.istarget);//if the content contains a tc message box.
			settiddlycutcur(request.id);//BJ use tiddlycut.modules.browserOverlay.setcur()?? maybe I put this to enable one global background??
			settiddlycutloc(request.loc);//Changes for e10s - maybe use gBrowser.selectedBrowser.currentURI.spec
			settiddlycuttit(request.tit);//Changes for e10s - gBrowser.selectedBrowser.contentTitle
			tiddlycut.modules.tcBrowser.setOnTwclassic(request.twc);
			tiddlycut.modules.tcBrowser.setOnTw5(request.tw5);
			//used by dock to set the tabid of docked tw in browserOverlay
			//and also recorded in the tab-dom to decide when a tabclose 
			//causes a change to the context menu (removal of tw from the list)
			tiddlycut.log("focusedtab fin in win  ",tiddlycut.winN, request.id,"target",request.istarget,request.loc,request.tit,request.twc,request.tw5);
			//this is caused when the contextmenu to appear - so we have to append this now
			tiddlycut.modules.browserOverlay.contextMenuClipAs();
		};
		if ('pageChanged' == action) {
			tiddlycut.modules.browserOverlay.tabchange(request.id);
			tiddlycut.log("pageChanged",request.id);
		};	
	}
	catch (e) {
		tiddlycut.log('tiddlycut - background onRequest error: ', e);
		tiddlycut.log(request.req);
	}
};

//this ensures that when a tab containing a docked tw closes, it is removed from the content menu
tiddlycut.CSserver.findtab =function (ev) {
    var id;
    if (ev.target.hasAttribute("tctabid")) {
		tiddlycut.log("tctabid closeTab",ev.target.getAttribute("tctabid"));
		id = ev.target.getAttribute("tctabid"); //this was set  by dock();
		tiddlycut.modules.browserOverlay.tabchange(id);
	}; 
}
// background script unload function
tiddlycut.CSserver.browserUnload = function() {
	messageManager.removeMessageListener('tcutrequest', tiddlycut.CSserver.contentRequestsListener);
	gBrowser.tabContainer.removeEventListener("TabClose",  tiddlycut.CSserver.findtab, false);
};

// background script starter load function
tiddlycut.CSserver.browserLoad = function() {
	gBrowser.tabContainer.addEventListener("TabClose", tiddlycut.CSserver.findtab, false);
	messageManager.addMessageListener('tcutrequest', tiddlycut.CSserver.contentRequestsListener);
};






