var EXPORTED_SYMBOLS = ["one", "tiddlycutOnemenu"];

var one = {
//tcbrowser
	 local : {vonImage:null, vonLink:null, imageUrl:null, vlinkURL:null, snapImage:"", selectedText:null, html:"", istwclassic:false, istw5:false, textselected:false},
//prefs
	Map :{},
//tClip
	activeCategories: {}, sectionNames:[],    self : {ClipConfig:null},
//browserOverlay
	 tabid : [], wikifile : [], wikititle : [], ClipConfig : [], ClipOpts : [],  bself : {selectedTW : 0, selectedSection : 0, tabtot:0}
},
tiddlycutOnemenu = false;
