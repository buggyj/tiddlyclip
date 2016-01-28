if (!tiddlycut) var tiddlycut = {};
if (!tiddlycut.modules)	tiddlycut.modules = {};

tiddlycut.modules.browserOverlay = (function ()
{

	
    if(typeof tiddlycut.globaldock === 'undefined') var onemenu = false;
	else var onemenu = tiddlycut.globaldock;
	
	//api const must be defined before api structure (or else will be assigned null)

	var SELECTMODES ={Clip:'Clip', Image:'Image', Text:'Text', Link:'Link', linkLocal:"linkLocal", linkRemote:"linkRemote", TWC:'TWC', TW5:'TW5'};
	var ALLSELMODES =[SELECTMODES.Clip, SELECTMODES.Image, SELECTMODES.Text, SELECTMODES.Link, SELECTMODES.linkLocal, SELECTMODES.linkRemote, SELECTMODES.TWC, SELECTMODES.TW5];	
	
	var adaptions = {};
	
	//global states
	var filechoiceclip = 0, currentsection = 0;
	
	var api = {
		onLoad:onLoad, createCategoryPopups:createCategoryPopups, createFilesPopups:createFilesPopups,
		reload:reload, adaptions:adaptions, changeFile:changeFile, dock:dock, tabchange:tabchange,
		onUnload:onUnload, Go:Go, gopaste:gopaste, dockRegister:dockRegister,getcallback:getcallback,
		contextMenuClipAs:contextMenuClipAs
	}


	var tabid = onemenu?one.tabid:[], wikifile = onemenu?one.wikifile:[], wikititle = onemenu?one.wikititle:[], 
				ClipConfig = onemenu?one.ClipConfig:[], ClipOpts = onemenu?one.ClipOpts:[];
	
	var tabtot = 0;
	
	//overrides are for global contextmenu (state shared between windows using jsm module)
	var self = onemenu?one.bself:{
		tabtot:tabtot,
		selectedTW:filechoiceclip, 
		selectedSection:currentsection
	}
	
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
		
        src = 	'<menu xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" '+
				 'id="contextTidCutFiles" label="Tiddlyclip Setup"  tooltiptext="Select tiddlywiki and Actions" >'+
					'<menupopup id="contextTidCutFilesPopup" onpopupshowing="tiddlycut.modules.browserOverlay.createFilesPopups()"/>'+
				'</menu>';
				
 		var xul = parser.parseFromString(src, "application/xml");
		chromerefs.contextLinkItemB=xul.documentElement;
		popup.insertBefore(chromerefs.contextLinkItemB,
		                  doc.getElementById('context-paste').nextSibling);
		 
		src =  	'<menu xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" '+
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

	function hasAnyModes(sourcelist, targetlist){
		for (var m in sourcelist)
			for (var i = 0 ; i<targetlist.length; i++)
				if (sourcelist[m]===targetlist[i]) return true;
		return false;
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
		if (tcBrowser.hasSelectedText())curModes.push(SELECTMODES.Text);
		if (tcBrowser.hasCopiedText()) 	curModes.push(SELECTMODES.Clip);
		if (tcBrowser.onImage()) 		curModes.push(SELECTMODES.Image);
		if (tcBrowser.onLink())			curModes.push(SELECTMODES.Link);	
		if (tcBrowser.isTiddlyWikiClassic()) 	curModes.push(SELECTMODES.TWC);	
		if (tcBrowser.onLinkLocal())			curModes.push(SELECTMODES.linkLocal);			
		if (tcBrowser.onLinkRemote())			curModes.push(SELECTMODES.linkRemote);	
		if (tcBrowser.isTiddlyWiki5()) 			curModes.push(SELECTMODES.TW5);	
			//alert(curModes);
		return 	curModes;
	}
	function ContextMenuShowing (event) {
		if (gContextMenu)	setSelectModes();
		
	}
	function reload (n) {
		tiddlycut.log("reload is ====", n);
		self.selectedSection =n;
	}
	function changeFile(file) {	//repopualate with select tw config
		tiddlycut.log("changeFile is ====", file);
		self.selectedTW = file;
		self.selectedSection = 0;
		//contextMenuClipAs();
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
		pref.loadOpts(ClipOpts[self.selectedTW]);
		tClip.setClipConfig(ClipConfig[self.selectedTW]);
		tClip.loadSectionFromFile(self.selectedSection); //load default section
		// Get the menupopup element that we will be working with
		var menu = docu.getElementById("contextTidCutFilesPopup");

		// Remove all of the items currently in the popup menu
		for(var i=menu.childNodes.length - 1; i >= 0; i--) {
			menu.removeChild(menu.childNodes.item(i));
		}

		var fileLoc; 
		for(var m = 1; m < self.tabtot+1; m++) {
			// Create a new menu item to be added
			var tempItem = docu.createElement("menuitem");
			pref.loadOpts(ClipOpts[m]);
			if (pref.Get("menuShowTitle") == "true") { 
				fileLoc =  wikititle[m];
			} else {
				fileLoc  = wikifile[m];
				if (fileLoc.substr(fileLoc.length-1) =='/') fileLoc = fileLoc.substr(0,fileLoc.length-1);
				var startPos = fileLoc.lastIndexOf("/")+1;
				if ((fileLoc.length - startPos)> 4) fileLoc =fileLoc.substr(startPos)
			}				
			if (m == self.selectedTW)
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
		//tempItem.setAttribute("image","resource://tiddlycut/skin/icon16.png");//BJ can't get this working - check where the path must be with restart
		tempItem.addEventListener('command', dock, false);

		
		menu.appendChild(tempItem);
		
		tempItem = docu.createElement("menuseparator");
		menu.appendChild(tempItem);
		if (self.tabtot>0) {
			var secName=tClip.getSectionNames();		
			for(var m = 0; m <secName.length;m++) {
				// Create a new menu item to be added
				var tempItem = docu.createElement("menuitem");

				// Set the new menu item's label
				if (self.selectedSection===m)
					tempItem.setAttribute("label","*"+secName[m]); //so we can see which section we are currently using
				else
					tempItem.setAttribute("label"," "+secName[m]);

				//Set the function to fire when clicked
				tempItem.addEventListener('command', (function(x){return (function(){var m = x; return(function(e){reload(m);})}())})(m),false);

				// Add the item to our menu
				menu.appendChild(tempItem);
			}
		}
		
	}
	
	function contextMenuClipAs() {
		var secName=tClip.getSectionNames();
		var selected = secName[self.selectedSection] || "Default";
		var menu = docu.getElementById("contextTidCutClip");		
			menu.setAttribute("label","Tiddlyclip using "+selected);
	}
	
	function createCategoryPopups()
	{
		pref.loadOpts(ClipOpts[self.selectedTW]);
		tClip.setClipConfig(ClipConfig[self.selectedTW]);
		
		tClip.loadSectionFromFile(self.selectedSection);//TODO what about tClip.defaultCategories()?
		
		// Get the menupopup element that we will be working with
		var menu = docu.getElementById("contextTidCutClipPopup");

		// Remove all of the items currently in the popup menu
		for(var i=menu.childNodes.length - 1; i >= 0; i--) {
			menu.removeChild(menu.childNodes.item(i));
		}
		if (self.tabtot>0) {
			var cat=tClip.getCategories();

			for(var m in cat) {
				// Create a new menu item to be added
				var tempItem = docu.createElement("menuitem");

				if (!hasAnyModes(cat[m].modes,ALLSELMODES) //this cat is not restricted to a mode so alway display
				   || hasAnyModes(cat[m].modes,currentSelectModes())) //this cat is valid in the current modes
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
	}
	
	function dock() {
		var id = gettiddlycutcur();
		var mm = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);

		setcallback("dock-respond",function(request) {
			tiddlycut.modules.tcBrowser.setDatafromCS(request.text, request.snap, request.html);
			tiddlycut.modules.browserOverlay.dockRegister(request.config, request.opts);
			tiddlycut.log("from dock-respond config ",request.config);
			tiddlycut.log("from dock-respond opts",request.opts);
		});

		mm.broadcastAsyncMessage('tcdock', {data: {tid:id, opttid:pref.Get("ConfigOptsTiddler")}, callback:"dock-respond"});
		tiddlycut.log("sent tcdock");		
	}
	
	
	function dockRegister(configtid, optid) {tiddlycut.log("docked ","docked called");
		if (gettiddlycutActive()===false) return;
		var i, tot = self.tabtot;
		for (i = 1; i < tot+1;i++) {
			if (wikifile[i] == gettiddlycutloc()) {return};//already on our list-do nothing
		}
		//else add to our list
		//gettiddlycutcur() is the global function defined in winN.jsm - current tab number
		tiddlycut.log("docked ",gettiddlycutloc(),gettiddlycutcur());
		tot = self.tabtot + 1;
		self.tabtot = tot;
		wikifile[tot] = gettiddlycutloc();
		tabid[tot] = gettiddlycutcur();
		
        //record tab id in 'tab dom' used when we hear tab closed events to see if we need to respond - 
        gBrowser.selectedTab.setAttribute("tctabid",gettiddlycutcur()); //BJ change modus opos to one global collection of tabs?
        //load config ***** move to framescript and pass back as param to dock()
		ClipConfig[tot] = new tiddlerAPI.Tiddler(configtid).body;//tClip.getTidContents("TiddlyClipConfig");
		tiddlycut.log("config",ClipConfig[tot]);
		var opts=new tiddlerAPI.Tiddler(optid).body;//optstid;//tClip.getTidContents(pref.Get("ConfigOptsTiddler"));
		// *****
		if (!!opts) ClipOpts[tot] = opts;
		else ClipOpts[tot] = null;
		changeFile(tot);//load configuration from this TW
		tiddlycut.log("ClipOpts",opts);
		//if (pref.Get("menuShowTitle")) { 		
			//wikititle[tot] = content.document.title;
			//tiddlycut.log("menuShowTitle");
		//} else {
			//wikititle[tot] = "";
		//}
		wikititle[tot] = gettiddlycuttit();
		// BJ fix - injectMessageBox(content.document);
		//contextMenuClipAs();
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
		var i, tab, found, tot = self.tabtot;
		for (i = 1; i < tot+1;i++) {
			if (tabid[i] == tabId) {found = true; break;};
		}

		if (found) { //remove and bubble down those that follow
			if (i == self.selectedTW) {
				if (i < tot) changeFile(i+1);
				else changeFile(i-1);
				self.selectedSection = 0;
			} 
			for (tab = i; tab <tot; tab++) { 
				tabid[tab] = tabid[tab+1];
				wikifile[tab] = wikifile[tab + 1];
				wikititle[tab] = wikititle[tab + 1];		
				ClipConfig[tab] = ClipConfig[tab+1];
				ClipOpts[tab] = ClipOpts[tab+1];
			}
			self.tabtot = tot-1;
			
			if (i ==  self.selectedTW) self.selectedTW = 0;
			else if (i <self.selectedTW) self.selectedTW--;
			tiddlycut.log("choice n",self.selectedTW);
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
			var i, tablist='', tot = self.tabtot;
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
			setcallback("cuttid-respond",function(request) {
				tiddlycut.modules.tcBrowser.setDatafromCS(request.text, request.snap, request.html);
				tiddlycut.modules.pageData.SetupVars(request.category,self.selectedSection);
				tiddlycut.modules.pageData.SetTidlist(request.tids);
				tiddlycut.modules.browserOverlay.gopaste(request.category, request.id);
				tiddlycut.log("for cuttid-respond",request.id);
			});
			var id = gettiddlycutcur();
			//send to content script
			tiddlycut.log("sending cuttid request",id);	
			mm.broadcastAsyncMessage('tcuttids', { 
				data: { tid:id, category:category, useSelectTitle:useSelectTitle, title:atitle, tag:atag},
				callback:"cuttid-respond"
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
		
		setcallback("cut-respond",function(request) {
				
			tiddlycut.modules.tcBrowser.setDatafromCS(request.text, request.snap, request.html);
			if (!pageData.SetupVars(request.category,self.selectedSection)) return false;
			tiddlycut.log("from cut-respond-->",request.id);
			gopaste(request.category, request.id);
		});
		mm.broadcastAsyncMessage('tcut', {
				data: { tid:id, category:category, doSnap:doSnap, snapSize:snapSize}, 
				callback:"cut-respond"				
		});
		tiddlycut.log("sent cut request");
	}

	function gopaste(category) {
		//now we have the clip sent it to the docked tiddlywiki
		var mm = Cc["@mozilla.org/globalmessagemanager;1"].getService(Ci.nsIMessageListenerManager);
		var id = tabid[self.selectedTW];
		//if (!pageData.SetupVars(category,self.selectedSection)) return false;//sets mode - determines what is copied	
		//if (!pageData.cutTids(category)) return false
		//send kick to content script
		
		tiddlycut.log("sending paste",id);
	
		mm.broadcastAsyncMessage('tcutpaste', {
								data: { tid:id, 
								category:category, pageData:JSON.stringify(pageData),currentsection:self.selectedSection}});
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
