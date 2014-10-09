if (!tiddlycut)
	var tiddlycut = {};
if (!tiddlycut.modules)
	tiddlycut.modules = {};
tiddlycut.modules.pref = (function ()
{
	 var Map ={},
	 Global ={editMode:false,tabtot:0,filechoiceclip:0},
	  Types = {"boolean" : "Bool", "string" : "Char", "number" : "Int"},
	 
		  Get = function (prefname) {
			if (prefname === 'editMode' || prefname === 'tabtot' || prefname === 'filechoiceclip') return Global[prefname];
			return Map[prefname];
		 },
		 
		  Set = function (prefname,val) {
			if (prefname === 'editMode' || prefname === 'tabtot' || prefname === 'filechoiceclip') Global[prefname]=val;			  
			else Map[prefname]=val;

		 },
		 
		 initPrefs= function () {
			 Map={}; //remove old values
			// load defaults - can be over written by the user
			var defs = defaults.getTWPrefs();
			for (var i in defs) {
				Map[i] = defs[i];
			}					
		},
		
		loadOpts = function(num) {
			//load additional prefs from targetTW
			var pieces = pref.ClipOpts[num];
			if (!pieces) {
			var defs = defaults.getTWPrefs();
			for (var i in defs) 
				Map[i] = defs[i];
			return;
			}

			pieces.split(/\r?\n/mg).forEach(function(line) {
				if(line.charAt(0) !== "#") {
					var p = line.indexOf(":");
					if(p !== -1) {
						var field = line.substr(0, p).trim(),
							value = line.substr(p+1).trim();
						Set(field,value,false);
					}
				}
			});
		 },
		 getTidContents= function (tidname) {
			var tid = pageData.findTiddlerInPage_ByTitle(tidname);//find tid on current (infocus) page
			return tid?tid.body: null;
		};
		 

	var tcBrowser, defaults, pageData, browseris, ClipConfig = [], ClipOpts = [];
	
	var api = 
	{
		onLoad:onLoad,	getBoolPref:getBoolPref, 	getCharPref:getCharPref, 		
		Get:Get,		getFileNames:getFileNames, 	setBoolPref:setBoolPref, 
		Set:Set,		SetPrefs:SetPrefs,			ClipConfig:ClipConfig,
		initPrefs:initPrefs, loadOpts:loadOpts,		ClipOpts:ClipOpts
	}


	function onLoad(browser) {
		browseris 	= browser;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		defaults	= tiddlycut.modules.defaults;
		pageData	= tiddlycut.modules.pageData;
		initPrefs();
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


	
