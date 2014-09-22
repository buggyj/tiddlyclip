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
		pref		= tiddlycut.modules.pref;
		tClip	 	= tiddlycut.modules.tClip;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		tiddlerAPI	= tiddlycut.modules.tiddlerAPI;

	}
	api.userExtensions = {};
	api.data = {};

	function SetTidlist(tidlist) {
		api.remoteTidArr=tidlist;
	}
	function makepercent (value) {
		if(/^[0-9][0-9]$/.test(value)) {
			return Number(value)/100;
		}
		return NaN;
	}

	function SetupVars(category,currentSection) {
		var title={}, tag={}, editMode={}, cancelled={};
			
		//expose parameters - used for userExtensions
		api.data ={};
		api.data.section  = tClip.getSectionNames()[currentSection];
		api.data.category = category;
		api.data.pageTitle= tcBrowser.getPageTitle();//replaces  %PageTitle%
		api.data.pageRef =  tcBrowser.getPageRef();  //replaces  %PageRef%
		api.data.text = 	tcBrowser.getSelectedAsText();
		api.data.clip = 	tcBrowser.getClipboardString();
		api.data.imageURL=	unescape(tcBrowser.getImageURL());
		api.data.largestImgURL=	unescape(tcBrowser.getLargestImgURL());
		api.data.hasText=	(tcBrowser.hasSelectedText()).toString();
		api.data.clipText=	(tcBrowser.hasCopiedText()).toString();
		api.data.onImage =	(tcBrowser.onImage()).toString();
		api.data.onLink=	(tcBrowser.onLink()).toString();
		api.data.classic =	(tcBrowser.isTiddlyWikiClassic()).toString();
		api.data.linkURL =	unescape(tcBrowser.getlinkURL());
		api.data.onLinkLocal=	(tcBrowser.onLinkLocal()).toString();		
		api.data.onLinkRemote=	(tcBrowser.onLinkRemote()).toString();
		api.data.tw5 =		(tcBrowser.isTiddlyWiki5()).toString();



		var locale = api.data.pageRef.split('/');
			locale.length--;
			locale = locale.join('/');
		var styles=false;
		var safety=true;
		    if (tClip.hasMode(tClip.getCategories()[category],"keepstyle") ) styles = true;
		    if (tClip.hasMode(tClip.getCategories()[category],"safetyoff") ) safety = false;
			api.data.web  = tcBrowser.getSelectedAsHtml(locale,styles,safety);

		// these are the structures for hold an array of tiddlers from a remote tw
		// that are to to be pasted into the local tw
		api.data.remoteTidTags = '';
		api.data.remoteTidText = '';
		api.data.remoteTidTitle = '';
		
		api.remoteTidArr  = [''];

		api.remoteTidIndex = 0;
        //////////end of remote data struct //////////////////
        
		//execute any user defined extensions
		if (tClip.hasModeBegining(tClip.getCategories()[category],"user") )  { 
		    var userString = {value:''};
		    var promptindex =tClip.getModeBegining(tClip.getCategories()[category],"user").split("user")[1];
			tcBrowser.UserInputDialog(pref.getCharPref("tiddlycut."+promptindex),userString);
			api.data["user"+promptindex]=userString.value;
		}
		if (tClip.hasModeBegining(tClip.getCategories()[category],"snap") )  { 
			//if any text is selected temporarly remove this while making the snap
			var range, sel = content.getSelection();
			try{
				if (sel.getRangeAt) {
					range = sel.getRangeAt(0);
				}
				if (range) {
					sel.removeAllRanges();
				} 
			} catch(e) {range=null;} 
			//make the snap
		    var size=makepercent(tClip.getModeBegining(tClip.getCategories()[category],"snap").split("snap")[1]);
			if (isNaN(size)) size =1;
			api.data.snap=tcBrowser.snap(size);
			//re-apply selected text (if any)
			if (range) {
				sel.addRange(range);
			} 
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

	 
