 tiddlycut.modules.pageData =(function ()
{
	var api = 
	{
		onLoad:onLoad,  					firstRemoteTid:firstRemoteTid, 
		hasNextRemoteTid:hasNextRemoteTid,	findTiddlerInPage_ByTitle:findTiddlerInPage_ByTitle,
		nextRemoteTid:nextRemoteTid,		loadTiddlerVarsFrom:loadTiddlerVarsFrom,
		SetupVars:SetupVars,				cutTids:cutTids,
		SetTidlist:SetTidlist
	}
	var tClip, tcBrowser, tiddlerAPI, browseris;	
	function onLoad(browser) {
		browseris 	= browser;
		tClip	 	= tiddlycut.modules.tClip;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		tiddlerAPI	= tiddlycut.modules.tiddlerAPI;

	}
	api.userExtensions = {};
	api.data = {};

	function SetTidlist(tidlist) {
		api.remoteTidArr=tidlist;
	}

	function SetupVars(category,currentSection) {
		var title={}, tag={}, editMode={}, cancelled={};
			
		//expose parameters - used for userExtensions
		api.data ={};
		api.data.Section  = tClip.getSectionNames()[currentSection];
		api.data.Category = category;
		api.data.PageTitle= tcBrowser.getPageTitle();//replaces  %PageTitle%
		api.data.PageRef =  tcBrowser.getPageRef();  //replaces  %PageRef%
		api.data.Text = 	tcBrowser.getSelectedAsText();
		api.data.Clip = 	tcBrowser.getClipboardString();
		api.data.ImageURL=	tcBrowser.getImageURL();
		api.data.hasText=	(tcBrowser.hasSelectedText()).toString();
		api.data.clipText=	(tcBrowser.hasCopiedText()).toString();
		api.data.onImage =	(tcBrowser.onImage()).toString();
		api.data.onLink=	(tcBrowser.onLink()).toString();
		api.data.Classic =	(tcBrowser.isTiddlyWikiClassic()).toString();
		api.data.linkUrl;



		var locale = api.data.PageRef.split('/');
			locale.length--;
			locale = locale.join('/');
		var styles=false;
		var safety=true;
		    if (tClip.hasMode(tClip.getCategories()[category],"keepstyle") ) styles = true;
		    if (tClip.hasMode(tClip.getCategories()[category],"safetyoff") ) safety = false;
			api.data.Web  = tcBrowser.getSelectedAsHtml(locale,styles,safety);

		// these are the structures for hold an array of tiddlers from a remote tw
		// that are to to be pasted into the local tw
		api.data.remoteTidTags = '';
		api.data.remoteTidText = '';
		api.data.remoteTidTitle = '';
		
		api.remoteTidArr  = [''];

		api.remoteTidIndex = 0;
        //////////end of remote data struct //////////////////
        
		//execute any user defined extensions
		if (tClip.hasMode(tClip.getCategories()[category],"addtext") )  { 	//tiddler mode try and retrieve as tiddler
		    var userString = {value:''};
			tcBrowser.UserInputDialog("Enter text",userString);
			api.data.userString=userString.value;
		}
		for (var userExtends in api.userExtensions) {

			api.userExtensions[userExtends]();
		}	
		return true;//no error
	}//end func

	function cutTids(category) {
		var title={}, tag={}, editMode={}, cancelled={};
			
		if (tClip.hasModeBegining(tClip.getCategories()[category],"tiddler") )  { 	//tiddler mode try and retrieve as tiddler

			if (tcBrowser.hasSelectedText()) {//BJ does this work in chrome?
				var tid=findTiddlerInPage_ByTitle(tcBrowser.getSelectedAsText());
				if (!tid){ 
					alert ("Not a tiddler");
					return false; //error
				}
				else api.remoteTidArr[0]= tid.EncodedDiv();
			} else {
				//put up a window for the user to enter the name and tag
				//of tiddlers then find matching tids in this page
				tcBrowser.EnterTidNameDialog (title, tag, cancelled);
				if (cancelled.value==true) {return false;}
				if (tag.value ==="") {				
					if (title.value == "") return false;
					var tid=findTiddlerInPage_ByTitle(title.value);
					if (!tid){ 
						alert ("No tiddler");
						return false; //error
					}
					else api.remoteTidArr[0]= tid.EncodedDiv();//string
				}
				else if (false===findTiddlersInPage_ByTag(tag.value)){ 
						alert ("No tiddlers");
						return false; //error
				}				
			}
			return true;	
		}
		return true;//no error
	}//end func
	
	function firstRemoteTid() {
		api.remoteTidIndex = 0;
		return api.remoteTidArr[0];
	}
	
	function hasNextRemoteTid() {//alert(api.remoteTidArr.length + " len "+api.remoteTidIndex );
		return (api.remoteTidIndex < api.remoteTidArr.length);
	}
	
	function nextRemoteTid() {
		api.remoteTidIndex += 1;
		if (api.remoteTidIndex === api.remoteTidArr.length) return null;
		return api.remoteTidArr[api.remoteTidIndex];	

	}		

	function loadTiddlerVarsFrom(tidObj) {
		//alert(twobj.title + 'title');
		api.data.remoteTidText= tidObj.body;
		api.data.remoteTidTags= tidObj.tags||" ";
		api.data.remoteTidTitle=tidObj.title;		
	}
	//////private area/////////


	function findTiddlerInPage_ByTitle(title) {
		var winWrapper = tcBrowser.winWrapper(content.document);
		var i,tid,nodes = winWrapper.getElementById("storeArea").getElementsByTagName('div');
		//try version 2.2 style store 
		for(i=0; i<nodes.length; i++) 
			if(title===nodes[i].getAttribute('title')) 
				break;

		if (i !== nodes.length) { 
			tid= new tiddlerAPI.Tiddler(nodes[i]);
			return tid;
		}
		//not found in a version 2.2 store, try 2.1 style
		for(i=0; i<nodes.length; i++) 
			if(title===nodes[i].getAttribute('tiddler')) 
				break;
				
		if (i !== nodes.length) { 
			tid= new tiddlerAPI.Tiddler( nodes[i]);
			return tid;
		}
		return null; //not found
	}

	function findTiddlersInPage_ByTag(tags) {
		var winWrapper = tcBrowser.winWrapper(content.document); 
		var i,tid, nodes = winWrapper.getElementById("storeArea").getElementsByTagName('div');
		var found=false;
		var tag = tags.split(" ");

		api.remoteTidArr= [];
		for(i=0; i<nodes.length; i++) 
			if (nodes[i].getAttribute("tags") != null) {
				var nodetags=nodes[i].getAttribute("tags");
				for (var l = 0; l < tag.length; l++) {
					var tid = null;
					if(nodetags.indexOf(tag[l]) !== -1) {
						var nodetag = nodetags.split(" ");
						for (var k = 0; k < nodetag.length; k++) {
							//BJ FIXME tags can have form [[tag string]]
							if (nodetag[k]==tag[l]) { 
								found = true;
								tid = new tiddlerAPI.Tiddler(nodes[i]);
								api.remoteTidArr.push(tid.EncodedDiv());
								break;//only copy tid once 
							}
						}
					}
					if (!!tid) break;//tag was matched
				}
			}

		return found; 
	}

	return api;
}());

	 
