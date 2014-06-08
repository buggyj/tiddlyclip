if (!tiddlycut)
	var tiddlycut = {};
if (!tiddlycut.modules)
	tiddlycut.modules = {};
tiddlycut.modules.pref = (function ()
{
	 var Map ={},
	  Save ={},
	  Other={},
	  userInput={},
	  Types = {"boolean" : "Bool", "string" : "Char", "number" : "Int"},
	 
		  Get = function (prefname) {
			return Map[prefname];
		 },
		 
		  Set = function (prefname,val,cache) {
			Map[prefname]=val;
			if (!!cache) Save[element] = cache; //save in browser
		 },
		 
		 initPrefs= function () {
			// load defaults - can be over written by the user
			var defs = defaults.getTWPrefs();
			for (var i in defs) {
				Map[i] = defs[i];
			}			
			Map['editMode'] =false;
			Map['tabtot'] =0;
			Map['filechoiceclip']=0;		
		},
		
		 SetFilePrefElements = function (element, index, array) {
			Map[element] = 		Map[element+SetFilePrefElements.num];
			Save[element] = false; 
		},

		  loadValFromTW= function() {
			 //load additional prefs from targetTW
			 var pieces = getTidContents(getCharPref("tiddlycut.ConfigOptsTiddler"));
			 if (!pieces) {
				  //loadDefaultTWPrefs();
				  return;
			 }
			 pieces = pieces.split('\n');
			 var item;
			 for (var i = 0; i< pieces.length; i++) {
				 item = pieces[i].split("=");
				 if (item.length!==2) continue;
				 Set(item[0].trim(), item[1].trim(),false);
				 //tiddlycut.log(item[0].trim(), item[1].trim());
			}	
		 },
		 getTidContents= function (tidname) {
			var tid = pageData.findTiddlerInPage_ByTitle(tidname);//find tid on current (infocus) page
			return tid?tid.body: null;
		};
		 


	var api = 
	{
		onLoad:onLoad,	getBoolPref:getBoolPref, 	getCharPref:getCharPref, 		
		Get:Get,		getFileNames:getFileNames, 	setBoolPref:setBoolPref, 
		Set:Set,			loadTheOpts:loadTheOpts,		SetPrefs:SetPrefs
	}

	var tcBrowser, defaults, pageData, browseris;
	function onLoad(browser) {
		browseris 	= browser;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		defaults	= tiddlycut.modules.defaults;
		pageData	= tiddlycut.modules.pageData;
		initPrefs();
	}
	
	function loadTheOpts(){
		SetFilePrefElements.num=getCharPref("tiddlycut.filechoiceclip");//num of set to copy
		["wikifile"].forEach(SetFilePrefElements);
	}

	function SetPrefs(){
			//tcBrowser.SetPrefsScreen();
}
	
	function getBoolPref(prefString) {
		var prefStringPart = prefString.split(".");
		if (prefStringPart.length ==1) {		
			return Get( prefStringPart[0]);
		}else {
			return Get( prefStringPart[1]);
		};
	}
	
	function getCharPref(prefString) {
		var prefStringPart = prefString.split(".");
		if (prefStringPart.length ==1) {		
			return Get( prefStringPart[0]);
		}else {
			return Get( prefStringPart[1]);
		};
	}
	
	function setCharPref(prefString,prefVal) {
		var prefStringPart = prefString.split(".");
		if (prefStringPart.length ==1) {		
			Set( prefStringPart[0],prefVal);
		}else {
		    Set( prefStringPart[1],prefVal);
		};
	}
	
	function setBoolPref(prefString,prefVal) {
		var prefStringPart = prefString.split(".");
		if (prefStringPart.length ==1) {		
			Set( prefStringPart[0],prefVal);
		}else {
		 Set( prefStringPart[1],prefVal);
		};
	}
	

	function SetFirstPrefElements(element, index, array) {

		Map[element] = 		Map[element+SetFirstPrefElements.num];
	}
	function getFileNames() {}
	return api;
}());


	
