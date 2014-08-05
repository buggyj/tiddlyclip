 tiddlycut.modules.defaults = (function ()
{
	var api = 
	{
		onLoad:onLoad, 
		getDefaultCategories:getDefaultCategories,
		getTWPrefs:getTWPrefs,
	}
	var defaultCategories = [
		"|tid|copy tids|||tiddlerscopy|",
		"|text|save text||||",
		"|web|save html||||"
	];

	var defaultPrefs = {
		ConfigOptsTiddler:'ConfigOptions',
		filechoiceclip:1,
		txtUserName:'default'
	}
	
	function getTWPrefs(){ return defaultPrefs;}
	var browseris;
	function onLoad(browser) {
		browseris 	= browser;
    }
	function getDefaultCategories() {
		return defaultCategories;
	}		
 
	function getDefaultRule(ruleName) {
		return defaultRules[ruleName];
	}
 	return api;
}());
