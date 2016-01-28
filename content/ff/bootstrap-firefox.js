// wrapper for firefox bootstrap

const prefsb = "extensions.tiddly-cut.";
const Cu = Components.utils;
Cu.import('resource://gre/modules/Services.jsm');

// called from main bootstrap.js for each browser window
function loadIntoWindow(window) {
	if (!window || !window.document) return;
	// only in content windows (not menupopups etc)
	if (!window.document.getElementById('appcontent')) return;
	window.tiddlycut={};
	window.tiddlycut.modules = {};
	
var prefs = Services.prefs.getBranch(prefsb);

window.tiddlycut.globaldock= prefs.getBoolPref("globaldock");

	   
    var lograw=function(str){
		Components.classes["@mozilla.org/consoleservice;1"].
           getService(Components.interfaces.nsIConsoleService).logStringMessage("tc: "+str);
	};

	var scripts= [
    'util/logtoconsole.js',

	"app/defaults.js",
	"app/tcBrowser.js",
	"app/pref.js",
	"app/pageData.js",
	"app/tiddlerAPI.js",
	"app/tClip.js",
	"app/userExtensions.js",
	"app/browserOverlay.js",

	"ff/background-server.js"//listens for content scripts -starts on defintion
	];
	//a common object override for all windows
    Components.utils.import("chrome://tiddlycut/content/ff/winOne.jsm",window);
    //a common numbering for windows
	Components.utils.import("chrome://tiddlycut/content/ff/winN.jsm",window);
	
	window.tiddlycut.winN =window.tiddlycutgetwinN();
	for (var i = 0; i < scripts.length; ++i) {
		Services.scriptloader.loadSubScript('chrome://tiddlycut/content/' +
											scripts[i], window, 'UTF-8');
		lograw('loaded '+ scripts[i]);
	};
	// call inits
	for (i in window.tiddlycut.modules) {
		var module = window.tiddlycut.modules[i];
		if (typeof(module.onLoad) === 'function') {
			window.tiddlycut.log('onload '+ i);
			module.onLoad("firefox", window.document);
		}
	}
	//init and add listeners
	window.tiddlycut.CSserver.browserLoad();
}

function unloadFromWindow(window) {
	if (!window || !window.document) return;
	// only in content windows (not menupopups etc)
	if (!window.document.getElementById('appcontent'))
		return;

	// stop and delete
	//window.tiddlycut.cleanup(window);
	window.tiddlycut.CSserver.browserUnload();
	
	for (var i in window.tiddlycut.modules) {
		var module = window.tiddlycut.modules[i];
		if (typeof(module.onUnload) === 'function') {
			window.tiddlycut.log('onUnload '+ i);
			module.onUnload(window.document);
		}
	} 
	Components.utils.unload("chrome://tiddlycut/content/ff/winN.jsm");  
	Components.utils.unload("chrome://tiddlycut/content/ff/tabId.jsm");
    // HACK WARNING: The Addon Manager does not properly clear all addon related caches on update;
    //               in order to fully update images and locales, their caches need clearing here
    Services.obs.notifyObservers(null, "chrome-flush-caches", null);
	delete window.tiddlycut;
}
