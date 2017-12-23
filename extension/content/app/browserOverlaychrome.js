if (!tiddlycut)
	var tiddlycut = {};
if (!tiddlycut.modules)
	tiddlycut.modules = {};
	
chrome.runtime.onInstalled.addListener(function(details){console.log ("oninstall "+details.reason)
    if(details.reason == "install" ||details.reason == "update"){ 
  chrome.windows.getAll({'populate': true}, function(windows) {
    for (var i = 0; i < windows.length; i++) {
      var tabs = windows[i].tabs;
      for (var j = 0; j < tabs.length; j++) {console.log ("loadcs "+j);
        chrome.tabs.executeScript(
            tabs[j].id,
            {file: 'content/util/logsimple.js', allFrames: false});
        chrome.tabs.executeScript(
            tabs[j].id,
            {file: 'content/contentScript.js', allFrames: false});
      }
    }
  });
 }});



tiddlycut.modules.browserOverlay = (function ()
{
	var adaptions = {};
	var api = 
	{
		onLoad:onLoad, createCategoryPopups:createCategoryPopups, createFilesPopups:createFilesPopups,
		reload:reload, adaptions:adaptions, changeFile:changeFile , pushData:pushData
	}
	var currentsection=0;
		
	var tabid = [], wikifile = [], wikititle = [], ClipConfig = [], ClipOpts = [];
	
	var filechoiceclip = 0, tabtot = 0;
	
	
	var tClip, tcBrowser, pref;
	var docu, browseris;
	function onLoad(browser, doc) {
		browseris 	= browser;
		docu 		= doc;	
		tClip		= tiddlycut.modules.tClip;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		pref	 	= tiddlycut.modules.pref;
		tiddlerAPI	=tiddlycut.modules.tiddlerAPI;
		pageData	= tiddlycut.modules.pageData;	
			
		function dock(info, tab) {
			console.log("item dock " + info.menuItemId + " was clicked " +tab.id);
			chrome.tabs.sendMessage(tab.id, 
			{
				action : 'actiondock', data:{opttid:pref.Get("ConfigOptsTiddler")}
			}, function (source)
			{
				if (!source.title) return;
				dockRegister(tab.id, source.url, source.config, source.title, source.opts);
				console.log("item dock " + source.config);
			}
			);
		};

	
		var id = chrome.contextMenus.create(
			{
				"title" : "dock here",
				"contexts" : ["page","selection"],
				"onclick" : dock
			}
		);
		var id = chrome.contextMenus.create({"type" : "separator"});

		tiddlycut.log("after menu mod",id);

		//execute any user definitions
		for (var method in api.adaptions) {

			api.adaptions[method]();
		}
		
    chrome.storage.local.set({'tags': {}}, function() {console.log("bg: reset taglist")});
	}
	
	
	chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
		console.log("tiddlyclipbg: got request: "+msg.action);
		if (true) {
			chrome.tabs.query({
				active: true,
				currentWindow: true
				}, function(tabs) {
					tiddlycut.log("going to send "+msg.action+"  request");
					var tab = tabs[0];
					chrome.tabs.sendMessage(tab.id,
					{
						action : msg.action
					}, 
					function (source){});
					tiddlycut.log("sent "+msg.action+" request");
				}
			);
			return;
		}
	});
	chrome.tabs.onUpdated.addListener(tabchange);
	chrome.tabs.onRemoved.addListener(tabchange);
	function tabchange(tabId) {
		tiddlycut.log("**tabchanged**",tabId);
		var i, tab, found, tot = tabtot;
		for (i = 1; i < tot+1;i++) {
			if (tabid[i] == tabId) {found = true; break;};
		}

		if (found) { //remove and bubble down those that follow
			if (i == filechoiceclip) {
				if (i < tot) changeFile(i+1);
				else changeFile(i-1);
				//self.selectedSection = 0;
			}
			for (tab = i; tab <tot; tab++) { 
				tabid[tab] = tabid[tab+1];
				wikifile[tab] = wikifile[tab + 1];
				wikititle[tab] = wikititle[tab + 1];		
				ClipConfig[tab] = ClipConfig[tab+1];
				ClipOpts[tab] = ClipOpts[tab+1];
			}
			tabtot = tot-1;
			
			if (tabtot === 0) chrome.storage.local.set({'tags': {}}, function() {console.log("bg: reset taglist")});
			
			if (i == filechoiceclip) filechoiceclip = 0;
			else if (i <filechoiceclip) filechoiceclip--;
			tiddlycut.log("choice n",filechoiceclip);
			createFilesPopups();
		}	
	}
	function setSelectModes(){
		tcBrowser.setOnImage();
		tcBrowser.setOnLink();
		tcBrowser.setImageURL();		
	}	

	function currentSelectModes() {
		var curModes = [];
		if (tcBrowser.hasSelectedText())curModes.push(tClip.SELECTMODES.Text);
		if (tcBrowser.hasCopiedText()) 	curModes.push(tClip.SELECTMODES.Clip);
		if (tcBrowser.onImage()) 		curModes.push(tClip.SELECTMODES.Image);
		if (tcBrowser.onLink())			curModes.push(tClip.SELECTMODES.Link);	
		if (tcBrowser.isTiddlyWikiClassic()) curModes.push(tClip.SELECTMODES.TWC);	
			//alert(curModes);
		return 	curModes;
	}

	function reload (n) {
		currentsection =n;
		tClip.loadSectionFromFile(n);//TODO what about tClip.defaultCategories()?
		createFilesPopups();
	}
	function changeFile(file) {
		filechoiceclip = file;
		pref.loadOpts(ClipOpts[file]);
		tClip.setClipConfig(ClipConfig[file]);
		currentsection = 0;//bj added after compared with browserOverlay.js
		tClip.loadSectionFromFile(0); //load default section
		createFilesPopups();
	}
    var mytabs=[];
    var separate;
	function createFilesPopups()
		{
			/*;
		// Get the menupopup element that we will be working with
		var menu = docu.getElementById("contextTidCutFilesPopup");

		// Remove all of the items currently in the popup menu
		for(var i=menu.childNodes.length - 1; i >= 0; i--) {
			menu.removeChild(menu.childNodes.item(i));
		}*/
		createCategoryPopups();
		var secName=tClip.getSectionNames();
		var fileLoc; 
		var n=0;
		for(var m = 1; m <mytabs.length ;m++){//tiddlycut.log("m",m); 
			chrome.contextMenus.remove(mytabs[m])
		};
		if (separate)chrome.contextMenus.remove(separate);
		mytabs=[];
		for(var m = 1; m < tabtot+1;m++) {
			n++;
			// Create a new menu item to be added
			var select = (function(x) {
				return function() {
				changeFile(x);
				};
			})(m);
			var title = "";
			pref.loadOpts(ClipOpts[m]);
			tiddlycut.log("**menuShowTitle**",pref.Get("menuShowTitle"));
			if (pref.Get("menuShowTitle") == "true") { 
				fileLoc =  wikititle[m];
			} else {
				fileLoc  = wikifile[m];
				tiddlycut.log('wikifile'+m,fileLoc);
				if (fileLoc.substr(fileLoc.length-1) =='/') fileLoc = fileLoc.substr(0,fileLoc.length-1);
				var startPos = fileLoc.lastIndexOf("/")+1;
				if ((fileLoc.length - startPos)> 4) fileLoc =fileLoc.substr(startPos);
		    }

             //fileLoc= fileLoc.replace(/([\s\S]*\/)/," "); //strip dir
             //if (fileLoc ==='') fileLoc  = pref.Get("wikifile"+m);
            //fileLoc= fileLoc.replace(/([\s\S]*\/)/," "); //strip dir
			// Set the new menu item's label
			if (m == filechoiceclip) {
				title=" "+m+"*"+fileLoc; //so we can see which section we are currently using
				var tags = null, taglist = {};
				tags=pref.Get("tags");
				if (tags) {
					tags = tags.split(/\s*,\s*/);
					for (var nn = 0; nn < tags.length; nn++) {
						taglist[tags[nn]] = false;
					}				
				}
				chrome.storage.local.set({'tags': taglist}, function() {console.log("bg: set from taglist")});
			}
			else
				title=" "+m+" "+fileLoc;
			//tiddlycut.log("filename is", pref.Get("wikifile"+m));
			mytabs[n]=chrome.contextMenus.create({
								title: title,
								contexts: ['all'],
								onclick: select
							});			
		}
		separate = chrome.contextMenus.create({"type" : "separator"});
        if (tabtot>0)
		for(var m = 0; m <secName.length;m++) {
			n++;
			// Create a new menu item to be added
			var doReload = (function(x) {
				return function() {
				reload(x);
				};
			})(m);

			var sec  ;

			// Set the new menu item's label
			if (currentsection===m)
				sec="*"+secName[m]; //so we can see which section we are currently using
			else
				sec=" "+secName[m];
			mytabs[n]=chrome.contextMenus.create({
								title: sec,
								contexts: ['all'],
								onclick: doReload
							});
		}
		
		
	}
	var mytabscats=[];
	var separator ;
	function createCategoryPopups()
	{
		var n=0;
					// Create a new menu item to be added
	
		for(var m = 1; m <mytabscats.length ;m++){//tiddlycut.log("m",m); 
			chrome.contextMenus.remove(mytabscats[m])
		};
		if (separator)chrome.contextMenus.remove(separator);
		if (tabtot>0) {
		mytabscats=[];

		var cat=tClip.getCategories();

		for(var m in cat) {
			n++;
			var catsel = (function(x) {
				return function(info, tab){
				pushData(x,info, tab);
				};
			})(m);
			mytabscats[n]=chrome.contextMenus.create({
								title: m,
								contexts: ['all'],
								onclick: catsel
							});
		}
		
		 separator = chrome.contextMenus.create({"type" : "separator"});
	}

	}

	function dockRegister(id, url, config, title, optid) {
		//ignore duplicate docks
		var tot = tabtot;
		for (var i=1; i < tabtot+1; i++) 
					if (id == tabid[i]) return;

		tiddlycut.log("docked ",url);
		tot = tabtot + 1;
		tabtot = tot;
		var configtid =new tiddlerAPI.Tiddler(config);
		var opts=new tiddlerAPI.Tiddler(optid).body;//optstid;//tClip.getTidContents(pref.Get("ConfigOptsTiddler"));
		// *****
		if (!!opts) ClipOpts[tot] = opts;
		else ClipOpts[tot] = null;
		tiddlycut.log("--opts-- ",opts);
		//pref.Set('wikifile'+tot,content.location.href.substr(startPos));
		wikifile[tot]=url; console.log('wikifile'+tot,url);//BJ
		wikititle[tot] = title;
		tabid[tot]=id;
		if (config != null) ClipConfig[tot] = configtid.body;
		else ClipConfig[tot] = null;
		//pref.Set('ClipConfig'+tot,configtid.body);
	    //pref.Set('ClipOpts'+tot,????????);//BJ fixme needs to be got when getting config??
	    changeFile(tabtot);	    
		createFilesPopups();
	};
	function injectMessageBox(doc) {
		// Inject the message box
		var messageBox = doc.getElementById("tiddlyclip-message-box");
		if(!messageBox) {
			messageBox = doc.createElement("div");
			messageBox.id = "tiddlyclip-message-box";
			messageBox.style.display = "none";
			doc.body.appendChild(messageBox);
		}
	};
	function makepercent (value) {
		if(/^[0-9][0-9]$/.test(value)) {
			return Number(value)/100;
		}
		return NaN;
	}
	

	
	function pushData(category, info, tab) //chrome only
	{
		var promptindex;
		tcBrowser.setDataFromBrowser(info, tab) //enter data from chrome menu onclick;
		//request data from content script
		//execute any user defined extensions
		if (tClip.hasModeBegining(tClip.getCategories()[category],"user") )  { 
		    promptindex =tClip.getModeBegining(tClip.getCategories()[category],"user").split("user")[1];
		} else promptindex = null;
		var currentCat=category; //remember here for returning callback to pick it up
		tiddlycut.log("inpusdata id",tab.id);
		
		//-----highlight control------
		if (tClip.hasModeBegining(tClip.getCategories()[category],"highlight") ) {
			
			chrome.tabs.sendMessage(tab.id,
				{
					action : 'highlight'
				}, 
				function (source){});
	

			tiddlycut.log("sent hlight request");

			return;
		}

		//-----xhairs------
		if (tClip.hasMode(tClip.getCategories()[category],"xhairs") ) {
			
			chrome.tabs.sendMessage(tab.id,
				{
					action : 'xhairs'
				}, 
				function (source){});
	

			tiddlycut.log("sent xhairs request");

			return;
		}
		
		if (!tClip.hasMode(tClip.getCategories()[category],"tiddlers") ) {
			if (tClip.hasModeBegining(	tClip.getCategories()[category],"snap") )  { 
				//if any text is selected temporarly remove this while making the snap
				/*var range, sel = content.getSelection();
				try{
					if (sel.getRangeAt) {
						range = sel.getRangeAt(0);
					}
					if (range) {
						sel.removeAllRanges();
					} 
				} catch(e) {range=null;} */
				//------make the snap--------
				var size=makepercent(tClip.getModeBegining(tClip.getCategories()[category],"snap").split("snap")[1]);
				if (isNaN(size)) size =1;
				
					chrome.tabs.sendMessage(tab.id,
						{
							action : 'cut', prompt:(promptindex?pref.Get(promptindex):null)
						}, function (source)
						{ 
							tcBrowser.setDatafromCS( source.url, source.html, source.title, source.twc, source.tw5, source.response, source.coords); //add data to tcbrowser object -retrived later
							tiddlycut.log ("currentCat",currentCat);
							var coords  = source.coords||{x0:null,y0:null,wdt:null,ht:null};
							tcBrowser.snap(size,tab.id, function (dataURL) { 
								chrome.tabs.sendMessage(tab.id,
								{
									action : 'restorescreen'
								}, function (source)
								{ 
										tcBrowser.setSnapImage(dataURL);
										chrome.storage.local.get({tags:{}}, function(items){
											tcBrowser.setExtraTags(items.tags);
											if (tClip.hasMode(tClip.getCategories()[category],"note") ) {
												chrome.storage.local.get("notepad", function(items){
													tcBrowser.setNote(items.notepad);
													GoChrome(currentCat, null, tab.id);
													chrome.storage.local.set({'notepad': ""}, function() {console.log("bg: rm note")});
												});
											} else {
												GoChrome(currentCat, null, tab.id);
											}
										})
								});
							},coords.x0,coords.y0,coords.wdt,coords.ht);
							
						}
					);
					
				
				//re-apply selected text (if any)
				/*if (range) {
					sel.addRange(range);
				} 
				*/
				return;
			}	
			chrome.tabs.sendMessage(tab.id,
				{
					action : 'cut',prompt:(promptindex?pref.Get(promptindex):null)
				}, function (source)
				{ 
					tiddlycut.log ("currentCat",currentCat,"tab.id",tab.id);
					tcBrowser.setDatafromCS( source.url, source.html, source.title, source.twc, source.tw5, source.response); //add data to tcbrowser object -retrived later
					chrome.storage.local.get({tags:{}}, function(items){
						tcBrowser.setExtraTags(items.tags);
						if (tClip.hasMode(tClip.getCategories()[category],"note") ) {
							chrome.storage.local.get("notepad", function(items){
								tcBrowser.setNote(items.notepad);
								GoChrome(currentCat, null, tab.id);
								chrome.storage.local.set({'notepad': ""}, function() {console.log("bg: rm note")});							
							});
						} else {
							GoChrome(currentCat, null, tab.id);
						}
					})
				}
			);
		}
		else
			chrome.tabs.sendMessage(tab.id,
				{
					action : 'cutTid', prompt:(promptindex?pref.Get(promptindex):null)
				}, function (source)
				{
					tcBrowser.setDatafromCS( source.url, null, source.title, source.twc, source.tw5,source.response); //add data to tcbrowser object -retrived later
					tiddlycut.log ("cuttid reply tids",source.tids);
					if (tClip.hasMode(tClip.getCategories()[category],"note") ) {
						chrome.storage.local.get("notepad", function(items){
							tcBrowser.setNote(items.notepad);
							GoChrome(currentCat, source.tids, tab.id);
							chrome.storage.local.set({'notepad': ""}, function() {console.log("bg: rm note")});
						});
					} else {
						GoChrome(currentCat, source.tids, tab.id);
					}
				}
			);
	}
	
	function GoChrome(category, tidlist, sourcetab)
	{
		tiddlycut.log("go1");
		if (false == pageData.SetupVars(category,currentsection,sourcetab)) return; //sets mode - determines what is copied
				tiddlycut.log("go2");
		pageData.SetTidlist(tidlist);
				tiddlycut.log("go3");
		id = tabid[filechoiceclip];
		//send kick to content script
		tiddlycut.log("sending paste",id);
		chrome.tabs.sendMessage(id,
		{ action: 'paste', data:{category:category, pageData:JSON.stringify(pageData),currentsection:currentsection}});
		tiddlycut.log("sent paste");	
	}

	function $(param) {
		return document.getElementById(param);
	}
	return api;
}());


// background script 
(function() {
		// calls module.onLoad() after the extension is loaded
	var i;
	for (i in tiddlycut.modules) {
		var module = tiddlycut.modules[i];
		if (typeof(module.onLoad) === 'function') {
			try {
				tiddlycut.log('onload  module ', i);
				module.onLoad("chrome",document);
			}
			catch (e) {

				tiddlycut.log('Error caught in module ', i, ':', e);
			}
		}
	}
})();
