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
		reload:reload, adaptions:adaptions, changeFile:changeFile, dock:dock, tabchange:tabchange,
		onUnload:onUnload, Go:Go, gopaste:gopaste, dockRegister:dockRegister,getcallback:getcallback
	}
	var currentsection=0;
	var tabid = [], wikifile = [], wikititle = [];
	var tClip, tcBrowser, pref;
	var docu, browseris;
	var chromerefs ={};
	function onLoad(browser, doc) {
		browseris 	= browser;
		docu		= doc;	
		tClip		= tiddlycut.modules.tClip;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		pref	 	= tiddlycut.modules.pref;
		pageData	= tiddlycut.modules.pageData;
		tiddlerAPI	= tiddlycut.modules.tiddlerAPI;

		var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
             .createInstance(Components.interfaces.nsIDOMParser);
		var systemPrincipal = Components.classes["@mozilla.org/systemprincipal;1"]
                      .createInstance(Components.interfaces.nsIPrincipal); 
        parser.init(systemPrincipal);
		// contextmenu
		let popup =doc.getElementById('contentAreaContextMenu');
        src = '<menu xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" '+
        'id="contextTidCutFiles" label="Tiddlyclip Setup"  tooltiptext="Select tiddlywiki and Actions" >'+
	    '<menupopup id="contextTidCutFilesPopup" onpopupshowing="tiddlycut.modules.browserOverlay.createFilesPopups()"/>'+
        '</menu>';
 		var xul = parser.parseFromString(src, "application/xml");
		chromerefs.contextLinkItemB=xul.documentElement;
		popup.insertBefore(chromerefs.contextLinkItemB,
		                  doc.getElementById('context-paste').nextSibling);
		 
		src =  '<menu xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" '+
		'id="contextTidCutClip" label="Tiddlyclip  Using.." insertafter="context-stop">'+
	    '<menupopup id="contextTidCutClipPopup" onpopupshowing="tiddlycut.modules.browserOverlay.createCategoryPopups()"/>'+
        '</menu>';
		var xul = parser.parseFromString(src, "application/xml");
		chromerefs.contextLinkItem=xul.documentElement;
		popup.insertBefore(chromerefs.contextLinkItem,
		                  doc.getElementById('context-paste').nextSibling);
		     
			
		//var menu = doc.getElementById("contentAreaContextMenu");
		//if(menu) menu.addEventListener("popupshowing",toggleTCContextMenu,false);

		//execute any user definitions
		for (var method in api.adaptions) {

			api.adaptions[method]();
		}

		var e = doc.getElementById("contentAreaContextMenu")
		if(e) e.addEventListener("popupshowing",ContextMenuShowing, false);
	}
 
	function onUnload(doc) {
		let popup = doc.getElementById('contentAreaContextMenu');
		if (popup && chromerefs.contextLinkItem)
			popup.removeChild(chromerefs.contextLinkItem);
		if (popup && chromerefs.contextLinkItemB)
			popup.removeChild(chromerefs.contextLinkItemB);
		let menupopup = doc.getElementById('menu_ToolsPopup');

		//var menu = doc.getElementById("contentAreaContextMenu");
		//if(menu) menu.removeEventListener("popupshowing",toggleTCContextMenu,false);
		var e = doc.getElementById("contentAreaContextMenu")
		if(e) e.removeEventListener("popupshowing",ContextMenuShowing, false);
	}

	function setSelectModes(){
		tcBrowser.setOnImage();
		tcBrowser.setOnLink();
		tcBrowser.setImageURL();	
		tcBrowser.setlinkURL();	
		tcBrowser.setHasSelectedText();
	}	

	function currentSelectModes() {
		var curModes = [];
		if (tcBrowser.hasSelectedText())curModes.push(tClip.SELECTMODES.Text);
		if (tcBrowser.hasCopiedText()) 	curModes.push(tClip.SELECTMODES.Clip);
		if (tcBrowser.onImage()) 		curModes.push(tClip.SELECTMODES.Image);
		if (tcBrowser.onLink())			curModes.push(tClip.SELECTMODES.Link);	
		if (tcBrowser.isTiddlyWikiClassic()) 	curModes.push(tClip.SELECTMODES.TWC);	
		if (tcBrowser.onLinkLocal())			curModes.push(tClip.SELECTMODES.linkLocal);			
		if (tcBrowser.onLinkRemote())			curModes.push(tClip.SELECTMODES.linkRemote);	
		if (tcBrowser.isTiddlyWiki5()) 			curModes.push(tClip.SELECTMODES.TW5);	
			//alert(curModes);
		return 	curModes;
	}
	function ContextMenuShowing (event) {
		if (gContextMenu)	setSelectModes();
		
	}
	function reload (n) {
		tiddlycut.log("reload is ====", n);
		currentsection =n;
		tClip.loadSectionFromFile(n);//TODO what about tClip.defaultCategories()?
		contextMenuClipAs();	
	}
	function changeFile(n) {	
		tiddlycut.log("changeFile is ====", n);
		pref.Set('filechoiceclip',n);
		tClip.setClipConfig(n);
		currentsection = 0;
		tClip.loadSectionFromFile(0); //load default section
	}
	/* not used
	function toggleTCContextMenu(e)
	{
		//tiddlycut.log('event is',e);
		var doc = e.view.document;
				//tiddlycut.log('document is',document);
				//tiddlycut.log('e.view.document is',doc);
		var menuClipItem =  doc.getElementById("contextTidCutClip");

		//menu to switch files
		var menuFilesItem  =  doc.getElementById("contextTidCutFiles");
		var menus = [ menuClipItem, menuFilesItem];

		for (var i=0; i<menus.length; i++)
			{
				menus[i].setAttribute("disabled",false);
			}
	}
	* */
	function createFilesPopups()
		{
		// Get the menupopup element that we will be working with
		var menu = docu.getElementById("contextTidCutFilesPopup");

		// Remove all of the items currently in the popup menu
		for(var i=menu.childNodes.length - 1; i >= 0; i--) {
			menu.removeChild(menu.childNodes.item(i));
		}

		var fileLoc; 
		for(var m = 1; m <pref.Get('tabtot')+1;m++) {
			// Create a new menu item to be added
			var tempItem = docu.createElement("menuitem");
			if (wikititle[m]) { 
				fileLoc =  wikititle[m];
			} else {
				fileLoc  = wikifile[m];
				if (fileLoc.substr(fileLoc.length-1) =='/') fileLoc = fileLoc.substr(0,fileLoc.length-1);
				var startPos = fileLoc.lastIndexOf("/")+1;
				if ((fileLoc.length - startPos)> 4) fileLoc =fileLoc.substr(startPos)
			}				
			if (m== pref.getCharPref("tiddlycut.filechoiceclip"))
				tempItem.setAttribute("label",+m+"*"+fileLoc); //so we can see which section we are currently using
			else
				tempItem.setAttribute("label",m+" "+fileLoc);
				
			tiddlycut.log("filename is", wikifile[m]);
			tiddlycut.log("title is", wikititle[m]);			//Set the function to fire when clicked
			tempItem.addEventListener('command', (function(x){return(function(){var m = x;return function(e){changeFile(m);}}())})(m),false);

			// Add the item to our menu
			menu.appendChild(tempItem);	
		}
		//add dock 
		var tempItem = docu.createElement("menuseparator");
		menu.appendChild(tempItem);
		
		tempItem = docu.createElement("menuitem");
		tempItem.setAttribute("label","dock to this tiddlywiki");
		//tempItem.setAttribute("class","menu-iconic");
		//tempItem.setAttribute("image","resource://tiddlycut/skin/icon16.png");//BJ can't get this working
		tempItem.addEventListener('command', dock, false);

		
		menu.appendChild(tempItem);
		
		tempItem = docu.createElement("menuseparator");
		menu.appendChild(tempItem);
		
		var secName=tClip.getSectionNames();		
		for(var m = 0; m <secName.length;m++) {
			// Create a new menu item to be added
			var tempItem = docu.createElement("menuitem");

			// Set the new menu item's label
			if (currentsection===m)
				tempItem.setAttribute("label","*"+secName[m]); //so we can see which section we are currently using
			else
				tempItem.setAttribute("label"," "+secName[m]);

			//Set the function to fire when clicked
			tempItem.addEventListener('command', (function(x){return (function(){var m = x; return(function(e){reload(m);})}())})(m),false);

			// Add the item to our menu
			menu.appendChild(tempItem);
		}
	}
	
	function contextMenuClipAs() {
		var secName=tClip.getSectionNames();
		var menu = docu.getElementById("contextTidCutClip");		
			menu.setAttribute("label","Tiddlyclip using "+secName[currentsection]);
	}
	
	function createCategoryPopups()
	{
		
		// Get the menupopup element that we will be working with
		var menu = docu.getElementById("contextTidCutClipPopup");

		// Remove all of the items currently in the popup menu
		for(var i=menu.childNodes.length - 1; i >= 0; i--) {
			menu.removeChild(menu.childNodes.item(i));
		}

		var cat=tClip.getCategories();

		for(var m in cat) {
			// Create a new menu item to be added
			var tempItem = docu.createElement("menuitem");

            if (!tClip.hasAnyModes(cat[m].modes,tClip.ALLSELMODES) //this cat is not restricted to a mode so alway display
               || tClip.hasAnyModes(cat[m].modes,currentSelectModes())) //this cat is valid in the current modes
            {
				// Set the new menu item's label
				tempItem.setAttribute("label",m);

				// Set the new menu item's tip
				tempItem.setAttribute("tooltiptext",cat[m].tip);

				//Set the function to fire when clicked
				tempItem.addEventListener('command', (function(x){return (function(){var m = x; return function(e){Go(m);}}())})(m),false);

				if (cat[m].valid ===false) {
					tempItem.setAttribute("disabled",true);
					tempItem.setAttribute("tooltiptext",'format error');

				}
				else {
					tempItem.setAttribute("disabled",false);
					tempItem.setAttribute("tooltiptext",cat[m].tip);
					
				}	
				// Add the item to our menu
				menu.appendChild(tempItem);
			}
		}
		
	}
	
	function dock() {
		var id = gettiddlycutcur();
		var mm = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);

		setcallback("dockrespond",function(request) {
			tiddlycut.modules.tcBrowser.setDatafromCS(request.text, request.snap, request.html);
			tiddlycut.modules.browserOverlay.dockRegister(request.config);
			tiddlycut.log("dockrespond",request.config);
		});

		mm.broadcastAsyncMessage('tcdock', {data: {tid:id}, callback:"dockrespond"});
		tiddlycut.log("sent tcdock");		
	}
	
	
	function dockRegister(configtid, optid) {tiddlycut.log("docked ","docked called");
		if (gettiddlycutActive()===false) return;
		var i, tot =pref.Get('tabtot');
		for (i = 1; i < tot+1;i++) {
			if (wikifile[i] == gettiddlycutloc()) {return};//already on our list-do nothing
		}
		//else add to our list
		//gettiddlycutcur() is the global function defined in winN.jsm - current tab number
		tiddlycut.log("docked ",gettiddlycutloc(),gettiddlycutcur());
		var startPos = gettiddlycutloc().search(":")+1;
		var tot =pref.Get('tabtot')+1;
		pref.Set('tabtot',tot);
		wikifile[tot] = gettiddlycutloc();
		tabid[tot] = gettiddlycutcur();
		
        //record tab id in 'tab dom' used when we hear tab closed events to see if we need to respond - 
        gBrowser.selectedTab.setAttribute("tctabid",gettiddlycutcur()); //BJ change modus opos to one global collection of tabs?
        //load config ***** move to framescript and pass back as param to dock()
		pref.ClipConfig[tot] = new tiddlerAPI.Tiddler(configtid).body;//tClip.getTidContents("TiddlyClipConfig");
		tiddlycut.log("config",pref.ClipConfig[tot]);
		var opts=null;//optstid;//tClip.getTidContents(pref.getCharPref("tiddlycut.ConfigOptsTiddler"));
		// *****
		if (!!opts) pref.ClipOpts[tot] = opts;
		else pref.ClipOpts[tot] = null;
		changeFile(tot);//load configuration from this TW
		tiddlycut.log("ClipOpts",opts);
		if (pref.Get("menuShowTitle")) { 		
			wikititle[tot] = content.document.title;
			tiddlycut.log("menuShowTitle");
		} else {
			wikititle[tot] = "";
		}

		// BJ fix - injectMessageBox(content.document);
		contextMenuClipAs();
	}
	
	function injectMessageBox(doc) {
		// Inject the message box
		var messageBox = doc.getElementById("tiddlyclip-message-box");
		if(!messageBox) {
			messageBox = doc.createElement("div");
			messageBox.id = "tiddlyclip-message-box";
			messageBox.style.display = "none";
			doc.body.appendChild(messageBox);
		}
	}

	function tabchange(tabId) {
		tiddlycut.log("**tabchange**",tabId);
		var i, tab, found, tot =pref.Get('tabtot');
		for (i = 1; i < tot+1;i++) {
			if (tabid[i] ==tabId) {found = true; break;};
		}

		if (found) { //remove and bubble down those that follow
			if (i== pref.getCharPref("tiddlycut.filechoiceclip")) {
				if (tot ==1)  tClip.setClipConfig(0);//diable
				else {
					if (i < tot) changeFile(i+1);
					else changeFile(i-1);
				}
				currentsection =0;
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
		}	
	};
	function makepercent (value) {
		if(/^[0-9][0-9]$/.test(value)) {
			return Number(value)/100;
		}
		return NaN;
	}
	function Go(category)//ff only
	{ 
		var mm = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
		var title={}, tag={}, cancelled={};
		
		//-----debug control------
		if (tClip.hasMode(tClip.getCategories()[category],"status") ) {
			var i, tablist='', tot =pref.Get('tabtot');
			for (i = 1; i < tot+1;i++) {
				tablist = tablist +   tabid[i]+"=" 
						+ wikifile[i] + "\n";
			tiddlycut.log(tablist);
			}
			mm.broadcastAsyncMessage('tcutidentify',{});
			return;
		}

		//-----highlight control------
		if (tClip.hasModeBegining(tClip.getCategories()[category],"highlight") ) {
			
			var id = gettiddlycutcur();
					//send kick to content script
			tiddlycut.log("sending hlight request",id);
		
			mm.broadcastAsyncMessage('tchlight', {
									data: { tid:id, tchlight:true}});
			tiddlycut.log("sent hlight request");

			return;
		}
		//---------cut tiddlers------
		if (tClip.hasModeBegining(tClip.getCategories()[category],"tiddler") )  { 	//tiddler mode try and retrieve as tiddler
			var useSelectTitle = false;
			var atitle = "", atag = "";
			if (tcBrowser.hasSelectedText()) {
				useSelectTitle = true;
			} else {
				//put up a window for the user to enter the name and tag
				//of tiddlers then find matching tids in this page
				tcBrowser.EnterTidNameDialog (title, tag, cancelled);
				if (cancelled.value==true) {return false;}
				if (tag.value ==="") {				
					if (title.value == "") return false;
					atitle = title.value;
				}
				else { 
					atag = tag.value;
				}				
			}
			setcallback("cuttidrespond",function(request) {
				tiddlycut.modules.tcBrowser.setDatafromCS(request.text, request.snap, request.html);
				tiddlycut.modules.pageData.SetupVars(request.category,currentsection);
				tiddlycut.modules.pageData.SetTidlist(request.tids);
				tiddlycut.modules.browserOverlay.gopaste(request.category, request.id);
				tiddlycut.log("cuttidrespond",request.id," page ",request.loc);
			});
			var id = gettiddlycutcur();
			//send to content script
			tiddlycut.log("sending cuttid request",id);	
			mm.broadcastAsyncMessage('tcuttids', { 
				data: { tid:id, category:category, useSelectTitle:useSelectTitle, title:atitle, tag:atag},
				callback:"cuttidrespond"
			});
			tiddlycut.log("sent cuttid request");
			return;	
		}		
		//---------snap--------
		var doSnap = tClip.hasModeBegining(tClip.getCategories()[category],"snap") ;
		var snapSize = 1;

		if (doSnap)	{
			snapSize=makepercent(tClip.getModeBegining(tClip.getCategories()[category],"snap").split("snap")[1]);
			if (isNaN(snapSize)) snapSize =1;
		}	
		id = gettiddlycutcur();
				//send kick to content script
		tiddlycut.log("sending cut request",id);
		
		setcallback("cutrespond",function(request) {
				
			tiddlycut.modules.tcBrowser.setDatafromCS(request.text, request.snap, request.html);
			if (!pageData.SetupVars(request.category,currentsection)) return false;
			tiddlycut.log("befor cutrespond--",request.id," page ",request.loc);
			gopaste(request.category, request.id);
			tiddlycut.log("cutrespond--",request.id," page ",request.loc);
		});
		mm.broadcastAsyncMessage('tcut', {
				data: { tid:id, category:category, doSnap:doSnap, snapSize:snapSize}, 
				callback:"cutrespond"				
		});
		tiddlycut.log("sent cut request");
	}

	function gopaste(category) {
		//now we have the clip sent it to the docked tiddlywiki
		var mm = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
		var id = tabid[pref.Get('filechoiceclip')];
		//if (!pageData.SetupVars(category,currentsection)) return false;//sets mode - determines what is copied	
		//if (!pageData.cutTids(category)) return false
		//send kick to content script
		
		tiddlycut.log("sending paste",id);
	
		mm.broadcastAsyncMessage('tcutpaste', {
								data: { tid:id, 
								category:category, pageData:JSON.stringify(pageData),currentsection:currentsection}});
		tiddlycut.log("sent paste");
		
	}
	var callbacks=[];
	function setcallback(name, fn) {
		callbacks[name] = fn;
	}
	function getcallback(name) {
		return callbacks[name]?callbacks[name]:null;
	}
	function $(param) {
		return document.getElementById(param);
	}
	return api;
}());
