tiddlycut.modules.tClip = (function () {
	//api const must be defined before api structure (or else will be assigned null)

	var SELECTMODES ={Clip:'Clip', Image:'Image', Text:'Text', Link:'Link', linkLocal:"linkLocal", linkRemote:"linkRemote", TWC:'TWC', TW5:'TW5'};
	var ALLSELMODES =[SELECTMODES.Clip, SELECTMODES.Image, SELECTMODES.Text, SELECTMODES.Link, SELECTMODES.linkLocal, SELECTMODES.linkRemote, SELECTMODES.TWC, SELECTMODES.TW5];	
	

	var api = 
	{
		onLoad:onLoad,				getSectionNames:getSectionNames,
		getCategories:getCategories,getTidContents:getTidContents,				
		hasMode:hasMode,			loadSectionFromFile:loadSectionFromFile, 	
		hasAnyModes:hasAnyModes,	setClipConfig:setClipConfig,
		SELECTMODES:SELECTMODES,	getCurentSection:getCurentSection,
		ALLSELMODES:ALLSELMODES,	getModeBegining:getModeBegining,
		hasModeBegining:hasModeBegining	

	};
	var pageData, pref, tcBrowser,   defaults, browseris;

	function onLoad(browser) {
		browseris	= browser;
		pageData 	= tiddlycut.modules.pageData;
		pref	 	= tiddlycut.modules.pref;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		defaults	= tiddlycut.modules.defaults;
	}
	api.BeforeSave = {};
	api.AfterSub = {};
	
	var activeCategories= {};
	var sectionNames=[];
    var currentsection;
    var ClipConfig;
 
	// we are over or have highlighted an image(Image), 
	// we have highlighted text(Text)
    //SELECTMODES are ignored if Tiddler mode is set, - either text is select and a tiddler is 
    //searched for, or a dialog box is shown.
//////////public section/////////////////////

	function hasAnyModes(sourcelist, targetlist){
		for (var m in sourcelist)
			for (var i = 0 ; i<targetlist.length; i++)
				if (sourcelist[m]===targetlist[i]) return true;
		return false;
	}
	var currentCat; 

	function loadActiveSectionCategories(table, defaultRule) {
		var categoryRows = table.split("\n");
		var cat = {};
		var tagsAndModes;
		var pieces;;
		for (var i=0; i<categoryRows.length; i++) {
			cat = {rules:null,valid:true};
			pieces = categoryRows[i].split("|");// form |Category|Tip|Tags|Rules Tid|Modes|
			if (pieces.length==1) continue; //ingore blanklines
			if (pieces.length < 5) {alert('config table format error no of row incorrect'); return;}
			if (pieces[1].substring(0,1)==='!') continue; //first row is column headings
			var catName = pieces[1]; 
			if (pieces.length > 5) { //extension -remember that we expect a final blank piece and blank start piece;
                 cat.valid = true;
			} else return;//error
			
			cat.modes= extractModes(pieces[5]);
			cat.tags = pieces[3];
			cat.tip  = pieces[2];
			if (hasModeBegining(cat,"debug")) {
				debugcontrol(cat);
			} else {
				activeCategories[catName] = cat;
			}
		} 
		return;
	}

	function extractModes(tagString) {
		var modes =[], tList = tagString.split(' ');
		for (var i=0; i< tList.length; i++) {
			modes[i] = tList[i].trim();
		}pref
		return modes;
	}

	function hasMode (cat,mode) {
			if (!cat.modes) return false;
		for (var i=0; i< cat.modes.length;i++)
			if (mode === cat.modes[i]) return true;
		return false;
	}
	
	function hasModeBegining (cat,mode) {
			if (!cat.modes) return false;
		for (var i=0; i< cat.modes.length;i++)
			if (mode === cat.modes[i].substr(0,mode.length)) return true;
		return false;
	}
	function getModeBegining (cat,mode) {
			if (!cat.modes) return "";
		for (var i=0; i< cat.modes.length;i++)
			if (mode === cat.modes[i].substr(0,mode.length)) return cat.modes[i];
	}
//////////////////////////////////////		




	function defaultCategories() {
		var defaultcats  =defaults.getDefaultCategories();
		for (var i= 0; i< defaultcats.length; i++) {
			loadActiveSectionCategories(defaultcats[i]);
		}
	}
		
	function getCategories()	{   
		return activeCategories;
	}	
	function getSectionNames()	{ 
		return sectionNames;
	}
	function getCurentSection()	{ 
		return currentsection;
	}
	function loadSectionFromFile(activeSection) {
		//sets currentsection
		activeCategories= {};
        sectionNames=['Default'];
        var sectionStrgs;

		//if (activeSection===0) defaultCategories();//load default rules defined by this program 

		var content = ClipConfig;//where all sections are defined
		if (content != null) {
			sectionStrgs = content.split('ᏜᏜᏜᏜ*['); //sections begin with a title, , followed by a table of categories
			if(sectionStrgs.length>1) { //clip list format			 
				sectionStrgs.shift();
				//remember all section names - used to allow the user to see sections and change which is active
				for (var  j =0; j< sectionStrgs.length;  j++) {
							var temp =(sectionStrgs[j].split(']\n')[0]).split('-');
							temp.shift();
							sectionNames[j] = temp.join('-');
				}	
				//only load active categories 
				loadActiveSectionCategories(sectionStrgs[activeSection].split('!/%%/\n')[1]);//strip of section name from first line
				currentsection = activeSection;
			} else { //straight text table
				sectionStrgs = content.split('\n!'); //sections begin with a title, eg !mysection, followed by a table of categories
				//the ! has not be removed by the split in the case of the first section
				sectionStrgs[0] = sectionStrgs[0].substr(1);
				//remember all section names - used to allow the user to see sections and change which is active
				for (var  j =0; j< sectionStrgs.length;  j++) { 
					
							sectionNames[j] = sectionStrgs[j].split('\n')[0];//first line is name
				}	
				//only load active categories
				loadActiveSectionCategories(sectionStrgs[activeSection].replace(/(^\|)*\n/,''));//strip of section name from first line
				currentsection = activeSection;
			}
		}else {
			defaultCategories();
			currentsection=0;
			//alert("config tiddler not found");
		}
	}

////////private section///////////////

//  TODO ADD A LOG THAT IS ONLY WRITTEN WHEN SAVING THE TW
	function debugcontrol(cat) {
		if (hasMode(cat,"debugoff")) {
				tiddlycut.logoff =true;
		} 
	}
	function getTidContents(tidname) {
		var tid = pageData.findTiddlerInPage_ByTitle(tidname);//find tid on current (infocus) page
		return tid?tid.body: null;
	}
    function setClipConfig(filen){
		pref.initPrefs();
		if (0==filen) { //disable
			activeCategories={}; //no section so no categories
			sectionNames=[];
			tiddlycut.log("activeCategories set to {}");
		} else {
			ClipConfig = pref.ClipConfig[filen];
			pref.loadOpts(filen);
			tiddlycut.log("setclipconfig ",ClipConfig);
		}
	}
	function getFileStuff() {
        //BJ FIXME - remove redundent
		return true;
	}
	return api;
}());
