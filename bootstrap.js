//boiler plate from https://developer.mozilla.org

const Cc = Components.classes;
const Ci = Components.interfaces;

function isNativeUI() {
  let appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
  return (appInfo.ID == "{aa3c5121-dab2-40e2-81ca-7ea25febc110}");
}

var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function onLoad() {
      domWindow.removeEventListener("load", onLoad, false);
      loadIntoWindow(domWindow);
    }, false);
  },
 
  onCloseWindow: function(aWindow) {},
  onWindowTitleChange: function(aWindow, aTitle) {}
};

var obs = {
  observe: function(aSubject, aTopic, aData) {
	if ("nsPref:changed" != aTopic) return;
	if (aData === "extensions.tiddly-cut.globaldock") {
		//resart app by disabling then re-enabling
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		AddonManager.getAddonByID("buggyjeftidclip@gmail.com", function(addon) {
		  if (addon.isActive) addon.userDisabled = addon.isActive;
		});
		//re-enable after a small delay to allow disable to become effective
		Components.utils.import("resource://gre/modules/Timer.jsm");
		let intervalID = setInterval(function() { 
			AddonManager.getAddonByID("buggyjeftidclip@gmail.com", function(addon) {
				if (!addon.isActive) addon.userDisabled = addon.isActive;
			})
		; }, 500);
	}
  }
}

function startup(aData, aReason) {
	//BJ addition
	Components.utils.import('resource://gre/modules/Services.jsm');

	//BJ end addition

	let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

	const Cu = Components.utils;
	Cu.import('resource://gre/modules/Services.jsm');
	const prefbranch = "extensions.tiddly-cut.";
		//a common object override for all windows
		
	
	//BJ - jsm seem to persist a disable and re-enable - so we need to ref it here
	var here = {};
	Components.utils.import("chrome://tiddlycut/content/ff/winOne.jsm",here);
	
	//BJ - code for setting default preferences
	var branch = Services.prefs.getDefaultBranch(prefbranch);
	branch.setBoolPref("globaldock", true);
	
	//BJ - install obsever pref that controls apps context menu shared/unshared across windows 
	var prefs = Services.prefs.getBranch("");
	//BJ - we are observing all config strings - then filter for our strings - dosnt work otherwise
	prefs.addObserver("extensions.tiddly-cut.",obs,false);

	if (isNativeUI()) {
		Services.scriptloader.loadSubScript('chrome://TiddlyCut/content/bootstrap-fennec.js');
	} else {
		Services.scriptloader.loadSubScript('chrome://TiddlyCut/content/ff/bootstrap-firefox.js');
	}
	// Load into any existing windows
	let windows = wm.getEnumerator("navigator:browser");
	while (windows.hasMoreElements()) {
		let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
		loadIntoWindow(domWindow);
	}

	// Load into any new windows
	wm.addListener(windowListener);

	//BJ additon
	let mm = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
	//setup message manager to inject loader-cs.js into all 'browsers' (browser instance in each tab)
	mm.loadFrameScript('chrome://tiddlycut/content/ff/loader-cs.js', true);	
}

function shutdown(aData, aReason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
 const prefbranch = "extensions.tiddly-cut.";
  if (aReason == APP_SHUTDOWN)
    return;
  //BJ addition
  let mm = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
  //send message to all script to remove listens from their dom
  mm.broadcastAsyncMessage('tcutunload', {data: "none"});
  // unload content scripts
  mm.removeDelayedFrameScript('chrome://tiddlycut/content/ff/loader-cs.js');
  //BJ addition end
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Stop listening for new windows
  wm.removeListener(windowListener);

  // Unload from any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
 var prefs = Services.prefs.getBranch(prefbranch);
  prefs.removeObserver("", obs);
  //BJ - this will delete the common javascript object
  Components.utils.unload("chrome://tiddlycut/content/ff/winOne.jsm");
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
