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

function startup(aData, aReason) {
//BJ addition
  Components.utils.import('resource://gre/modules/Services.jsm');
  if (isNativeUI()) {
	Services.scriptloader.loadSubScript('chrome://TiddlyCut/content/bootstrap-fennec.js');
  } else {
	Services.scriptloader.loadSubScript('chrome://TiddlyCut/content/ff/bootstrap-firefox.js');
  }
//BJ end addition

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

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
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}
