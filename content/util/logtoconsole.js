'use strict';


//console.log("in log");
if (!tiddlycut)
	var tiddlycut = {};

tiddlycut.log = function() {
	if (!!tiddlycut.logoff) return;
	var i, concated = '';
	var args = Array.prototype.slice.apply(arguments);
	concated = args.join(' '); 
	if (typeof(console) != 'undefined'
			    && typeof(console.log) == 'function') {	
		console.log.apply(console, args);
	} 	
	var consoleService = Components.classes['@mozilla.org/consoleservice;1']
				.getService(Components.interfaces.nsIConsoleService);
	consoleService.logStringMessage('tiddlycut: ' + concated);

}
 
