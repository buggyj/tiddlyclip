if (!tiddlycut)
	var tiddlycut = {};
if (!tiddlycut.modules)
	tiddlycut.modules = {};
tiddlycut.modules.browserOverlay = (function ()
{
	var adaptions = {};
	var api = 
	{
		onLoad:onLoad, createCategoryPopups:createCategoryPopups, createFilesPopups:createFilesPopups,
		reload:reload, adaptions:adaptions, changeFile:changeFile , pushData:pushData
	}
	var currentsection=0;
		
	var tabid = [], wikifile = [], wikititle = [];
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
			action : 'actiondock'
		}, function (source)
		{
			dockRegister(tab.id, source.url, source.config);
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

		tiddlycut.log("after menu mod",id);

		//execute any user definitions
		for (var method in api.adaptions) {

			api.adaptions[method]();
		}

	}

	chrome.tabs.onUpdated.addListener(tabchange);
	chrome.tabs.onRemoved.addListener(tabchange);
	function tabchange(tabId) {
		var i, tab, found, tot =pref.Get('tabtot');
		for (i = 1; i < tot+1;i++) {
			if (tabid[i] == tabId) {found = true; break;};
		}

		if (found) { //remove and bubble down those that follow
			if (i== pref.getCharPref("tiddlycut.filechoiceclip")) {
				tClip.setClipConfig(0);//if currently selected disable categories	
			}
			for (tab = i; tab <tot; tab++) { 
				tabid[tab] = tabid[tab+1];
				wikifile[tab] = wikifile[tab + 1];
				wikititle[tab] = wikititle[tab + 1];		
				pref.ClipConfig[tab] = pref.ClipConfig[tab+1];
				pref.ClipOpts[tab] = pref.ClipOpts[tab+1];
			}
			pref.Set('tabtot',tot-1);
			
			if (i==pref.Get('filechoiceclip')) pref.Set('filechoiceclip',0);
			else if (i <pref.Get('filechoiceclip')) pref.Set('filechoiceclip',-1 + pref.Get('filechoiceclip'));
			tiddlycut.log("choice n",pref.Get('filechoiceclip'));
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
	function changeFile(n) {
		pref.Set('filechoiceclip',n);
		tClip.setClipConfig(n);
		//tClip.setClipOpts(n)??????
		tClip.loadSectionFromFile(0); //load default section
		createFilesPopups();
	}
    var mytabs=[];
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
		mytabs=[];
		for(var m = 1; m <pref.Get('tabtot')+1;m++) {
			n++;
			// Create a new menu item to be added
			var select = (function(x) {
				return function() {
				changeFile(x);
				};
			})(m);
			var title = "";
		    fileLoc  = wikifile[+m];
		    tiddlycut.log('wikifile'+m,fileLoc);
		    if (fileLoc.substr(fileLoc.length-1) =='/') fileLoc = fileLoc.substr(0,fileLoc.length-1);
		    var startPos = fileLoc.lastIndexOf("/")+1;
		    if ((fileLoc.length - startPos)> 4) fileLoc =fileLoc.substr(startPos);
		    
             //fileLoc= fileLoc.replace(/([\s\S]*\/)/," "); //strip dir
             //if (fileLoc ==='') fileLoc  = pref.getCharPref("wikifile"+m);
            //fileLoc= fileLoc.replace(/([\s\S]*\/)/," "); //strip dir
			// Set the new menu item's label
			if (m== pref.getCharPref("tiddlycut.filechoiceclip"))
				title=" "+m+"*"+fileLoc; //so we can see which section we are currently using
			else
				title=" "+m+" "+fileLoc;
			//tiddlycut.log("filename is", pref.getCharPref("wikifile"+m));
			mytabs[n]=chrome.contextMenus.create({
								title: title,
								contexts: ['all'],
								onclick: select
							});			
		}

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
	function createCategoryPopups()
	{
		var n=0;
					// Create a new menu item to be added
	
		for(var m = 1; m <mytabscats.length ;m++){//tiddlycut.log("m",m); 
			chrome.contextMenus.remove(mytabscats[m])
		};
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

	}

	function dockRegister(id, url, config) {
		//ignore duplicate docks
		var tot =pref.Get('tabtot');
		for (var i=1; i< 1+pref.Get('tabtot');i++) 
					if (id == tabid[i]) return;
		tabid[tot]=id;
		tiddlycut.log("docked ",url);
		var startPos = url.search(":")+1;
		tot =pref.Get('tabtot')+1;
		pref.Set('tabtot',tot);
		var configtid =new tiddlerAPI.Tiddler(config);
		//pref.Set('wikifile'+tot,content.location.href.substr(startPos));
		wikifile[tot]=url; console.log('wikifile'+tot,url);//BJ
		tabid[tot]=id;
		pref.ClipConfig[tot] = configtid.body;
		//pref.Set('ClipConfig'+tot,configtid.body);
	    //pref.Set('ClipOpts'+tot,????????);//BJ fixme needs to be got when getting config??
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
		tcBrowser.setDataFromBrowser(info, tab) //enter data from chrome menu onclick;
		//request data from content script
		currentCat=category; //remember here for returning callback to pick it up
		tiddlycut.log("inpusdata id",tab.id);
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
				tcBrowser.snap(size,tab.id, function (dataURL) { 
					tcBrowser.setSnapImage(dataURL);
					chrome.tabs.sendMessage(tab.id,
						{
							action : 'cut'
						}, function (source)
						{ 
							tcBrowser.setDatafromCS( source.url, source.html, source.title, source.twc, source.tw5); //add data to tcbrowser object -retrived later
							tiddlycut.log ("currentCat",currentCat);
							GoChrome(currentCat, null, tab.id);
						}
					);
					
				});
				//re-apply selected text (if any)
				/*if (range) {
					sel.addRange(range);
				} 
				*/
				return;
			}	
			chrome.tabs.sendMessage(tab.id,
				{
					action : 'cut'
				}, function (source)
				{ 
					tiddlycut.log ("currentCat",currentCat,"tab.id",tab.id);
					tcBrowser.setDatafromCS( source.url, source.html, source.title, source.twc, source.tw5); //add data to tcbrowser object -retrived later

					GoChrome(currentCat, null, tab.id);
				}
			);
		}
		else
			chrome.tabs.sendMessage(tab.id,
				{
					action : 'cutTid'
				}, function (source)
				{
					tcBrowser.setDatafromCS( source.url, null, source.title, source.twc, source.tw5); //add data to tcbrowser object -retrived later
					tiddlycut.log ("cuttid reply tids",source.tids);
					GoChrome(currentCat, source.tids, tab.id);
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
		id = tabid[pref.Get('filechoiceclip')];
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
