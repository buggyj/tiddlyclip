if (!tiddlycut)
	var tiddlycut = {};
if (!tiddlycut.modules)
	tiddlycut.modules = {};
	
	
tiddlycut.modules.pref = (function ()
{
	
    if(typeof tiddlycut.globaldock === 'undefined') var onemenu = false;
	else var onemenu = tiddlycut.globaldock;
	
	 var Map =onemenu?one.Map:{},
	  Types = {"boolean" : "Bool", "string" : "Char", "number" : "Int"},
	 
		  Get = function (prefname) {
			return Map[prefname];
		 },
		 
		  Set = function (prefname,val) {
			Map[prefname]=val;

		 },
		 
		 initPrefs= function () {
			 Map={}; //remove old values
			// load defaults - can be over written by the user
			var defs = defaults.getTWPrefs();
			for (var i in defs) {
				Map[i] = defs[i];
			}					
		},
		
		loadOpts = function(ClipOpts) {
			//load additional prefs from targetTW
			
			var pieces =ClipOpts;
			initPrefs();
			if (!pieces) {
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
		 };
		 

	var defaults,  browseris, ClipConfig = [], ClipOpts = [];
	
	var api = 
	{
		onLoad:onLoad,	 		
		Get:Get,	 
		Set:Set,
		loadOpts:loadOpts
	}


	function onLoad(browser) {
		browseris 	= browser;
		defaults	= tiddlycut.modules.defaults;
		initPrefs();
	}
	

	return api;
}());


	
