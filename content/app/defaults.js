 tiddlycut.modules.defaults = (function ()
{
	var api = 
	{
		onLoad:onLoad, getDefaultRule:getDefaultRule, 
		getDefaultCategories:getDefaultCategories,
		getTWPrefs:getTWPrefs,
	}
	var defaultCategories = [
		"|tid|copy tids||defaultTid|tiddlers|",
		"|text|save text||defaultText||",
		"|web|save html||defaultWeb||"
	];
	var defaultRules = {
		defaultTid:'|{{{%($remoteTidTitle)%}}}|{{{%($remoteTidText)%}}}|{{{%($remoteTidTags)%}}}|||append|',
		defaultText:'|{{{%($PageTitle)%}}}|{{{%($PageRef)% <br>date="%($DateTimeLong)%", <html>%($Text)%</html>}}}||||append|',
		defaultWeb: '|{{{%($PageTitle)%}}}|{{{%($PageRef)% <br>date="%($DateTimeLong)%", <html>%($Web)%</html>}}}||||append|'
	}
	var defaultPrefs = {
		ConfigOptsTiddler:'ConfigOptions',
		filechoiceclip:1,
		txtUserName:'default',
		txtBackupFolder:'x'
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
