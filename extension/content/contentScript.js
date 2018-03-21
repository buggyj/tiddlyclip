'use strict';
(function () {


	var remoteTidArr  = [''], install;
	
	function getHtml()
	{
		var focusedWindow = window;
		var selection = focusedWindow.getSelection();
		var range;	
		try {
			range = selection.getRangeAt(0);
			var documentFragment = range.cloneContents();
			var mydiv = document.createElement("div");
			mydiv.appendChild(documentFragment);
			return mydiv;
		}
		catch(e) { return null; }//if there is not selected
	}
	
	function isTiddlyWikiClassic() {
		//from tiddlyfox
		// Test whether the document is a TiddlyWiki (we don't have access to JS objects in it)
		
		var doc = document;
		var versionArea = doc.getElementById("versionArea");
		return doc.getElementById("storeArea") &&
			(versionArea && /TiddlyWiki/.test(versionArea.text));
	}

	function isTiddlyWiki5() {
		//from tiddlyfox
		// Test whether the document is a TiddlyWiki5 (we don't have access to JS objects in it)
		var doc = document;
		var metaTags = doc.getElementsByTagName("meta"),
			generator = false;
		for(var t=0; t<metaTags.length; t++) {
			if(metaTags[t].name === "application-name" && metaTags[t].content === "TiddlyWiki") {
				generator = true;
			}
		}
		return generator;
	}

	function extractToJson(node) {//based on tw5 boot
		var htmlDecode = function(s) {
				return s.toString().replace(/&lt;/mg,"<").replace(/&nbsp;/mg,"\xA0").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
			};
		var e = node.firstChild;
		while(e && e.nodeName.toLowerCase() !== "pre") {
			e = e.nextSibling;
		}
		var title = node.getAttribute ? node.getAttribute("title") : null;
		if(e && title) {
			var attrs = node.attributes,
				tiddler = {
					text: htmlDecode(e.innerHTML)
				};
			for(var i=attrs.length-1; i >= 0; i--) {
				tiddler[attrs[i].name] = attrs[i].value;
			}
			return JSON.stringify(tiddler);
		} else {
			return "";
		}
	}


//--------------------------------------hlight-------------------------------------------
var hlight = function(color) {
	var backcolor;
	tiddlycut.log("hlight recieved");
	//var rcvd = messageEvent.json.data;
	if (!color) {backcolor = "#ffd700"}
	else backcolor = color;
	try {
		var range, sel = getSelection();
		if (sel.getRangeAt) {
			range = sel.getRangeAt(0);
		}
		document.designMode = "on";
		//restore selection of text
		if (range) {
			sel.removeAllRanges();
			sel.addRange(range);
		} 
		//content.setTimeout('document.designMode = "on"',1000);
		
		document.execCommand("backcolor", false, backcolor);
		document.execCommand("styleWithCSS",false,"false");

		document.designMode = 'Off'; 
		return;

	} catch (e) {
		tiddlycut.log('callback error:', e);
		return;
	}
}


//------------------------------------xhairs----------------------------------------------
var range, sel;
var xhairs = (function() {
function setcss (el, styles) {
var i, style=el.getAttribute("style")||"";	
	
	for (i in styles) style +=i+":"+styles[i]+";";
	el.setAttribute("style", style);
}

var xoff= true, movex = 0, movey = 0, startx, starty, startWidth, startHeight, width, height;


function curser(el) {
    var cH = el.querySelector('#crosshair-h'),
        cV = el.querySelector('#crosshair-v'),
        cHstyle,cVstyle;
 

  el.onmousemove = function(e){
  cHstyle = cH.style;
  cVstyle = cV.style;
  cHstyle.top = e.clientY+"px";
  cVstyle.left = e.clientX+"px";
  movex = e.clientX;
  movey = e.clientY
  
}  

sel = getSelection();
				try{
					if (sel.getRangeAt) {
						range = sel.getRangeAt(0);
					}
					if (range) {				
						sel.removeAllRanges();
					} 
				} catch(e) {range=null;} 
el.addEventListener('mousedown', init);
  function init(e){
	  			//if any text is selected temporarly remove this while making the snap
				
				
				//------make the snap--------
  if (e.which != "1") return;
  el.removeEventListener('mousedown', init, false);
  console.log (e.clientY+":"+e.clientX);
  starty = e.clientY;
  startx = e.clientX;
  var boxcss = { width: "10px", height: "10px", "box-shadow":"0 0 5px rgb(100,100,100)", position:"absolute", left: startx+"px", top: starty+"px", cursor: "se-resize"}
  	setcss(box, boxcss); 
    //el.appendChild(outer);
    //var resizable = { background: "cyan", position: "absolute" ,width: "10px", height: "10px",right: -(e.clientX)+"px", bottom: -(e.clientY)+"px"}
    //setcss(outer, resizable); 
    if (!box.parent) el.appendChild(box);
    initDrag(e);
};



function initDrag(e) {
   startx = e.clientX;
   starty = e.clientY;
   startWidth = 1;//parseInt(document.defaultView.getComputedStyle(p).width, 10);
   startHeight = 1;//parseInt(document.defaultView.getComputedStyle(p).height, 10);
   document.documentElement.addEventListener('mousemove', doDrag, false);
   document.documentElement.addEventListener('mouseup', stopDrag, false);
}
function doDrag(e) {
   width = startWidth + e.clientX - startx;
   height = startHeight + e.clientY - starty;
   box.style.width = width + 'px';
   box.style.height = height + 'px';
}

function stopDrag(e) {
    document.documentElement.removeEventListener('mousemove', doDrag, false);    document.documentElement.removeEventListener('mouseup', stopDrag, false);
    //el.addEventListener('mousedown', init);
    xhairsOff();

}
}


var styles = {
	  height: "100%",
	  width: "100%",
	  top: "0",
	  left: "0",
	  position: "fixed",
	  background: "rgba(99, 99, 99, 0.07)",
	  "z-index": "16777271",
	  margin: "0"
	};
	
var xhairh = {
    width:"100%",
    height:"2px",
    "margin-top":"-1px"
}

var xhairv = {
    height:"100%",
    width:"2px",
    "margin-left":"-1px"
}

var xhair = {    
    position:"fixed",
    "background-color":"rgba(100,100,100,0.5)",
    "box-shadow":"0 0 5px rgb(100,100,100)",
    "pointer-events":"none"
}
var div = document.createElement('div'),diva = document.createElement('div'),
	divb = document.createElement('div'),box = document.createElement('div');
var On = function () {
	setcss(div, styles);
	div.id ="basexhair";
	setcss(diva, xhair);
	setcss(diva, xhairh);  
	diva.id ="crosshair-h";
	div.appendChild(diva);
	setcss(divb, xhair);
	setcss(divb, xhairv);
	divb.id ="crosshair-v";
	div.appendChild(divb); 
    document.body.appendChild(div);       
    curser(div);   
    xoff = false;
}
var Remove = function () {
	//if (xoff) return;
	xoff = true;
	xhairsOff();
	if (box.parentNode) div.removeChild( box );
	if (div.parentNode) div.parentNode.removeChild( div );    				//re-apply selected text (if any)

}

var xhairsOff = function () {
	if (diva.parentNode) div.removeChild( diva );
	if (divb.parentNode) div.removeChild( divb );
}

var restorescreen = function () {
				if (range) {				
					sel.removeAllRanges();
					sel.addRange(range);
				} 
}

var Coords = function() {
	if (xoff) return null;
	else {
		xoff = true;
		Remove();
		return {x0:startx, y0:starty, wdt:width, ht:height};
	}
}

return {Coords:Coords, On:On, xhairsOff:xhairsOff, Remove:Remove,restorescreen:restorescreen};  
})();                
/////////////////////////// get tiddler ///////////////////////////////                
	function findTiddlerInPage_ByTitle(title) {
		var winWrapper = document;
		var i,tid,nodes = winWrapper.getElementById("storeArea").getElementsByTagName('div');
		//try version 2.2 style store 
		for(i=0; i<nodes.length; i++) 
			if(title===nodes[i].getAttribute('title')) 
				break;

		if (i !== nodes.length) { 
			tid= extractToJson(nodes[i]);
			return tid;
		}
		//not found in a version 2.2 store, try 2.1 style
		for(i=0; i<nodes.length; i++) 
			if(title===nodes[i].getAttribute('tiddler')) 
				break;
				
		if (i !== nodes.length) { 
			tid= extractToJson(nodes[i]);
			return tid;
		}
		return null; //not found
	}
	function findTiddlersInPage_ByTag(tag) {
		var i,tid, nodes = document.getElementById("storeArea").getElementsByTagName('div');
		var found=false;
		remoteTidArr= [];
		for(i=0; i<nodes.length; i++) 
			if (nodes[i].getAttribute("tags") != null) {
				
				if(nodes[i].getAttribute("tags").indexOf(tag) !== -1) {
					found = true;
					tid = extractToJson(nodes[i]);
					remoteTidArr.push(tid); 
				}
			}	
		return found; 
	}
	function log(str){
		console.log(str);
    }
    function htmlEncode(param)
	{
		return(param.replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;"));
	}
   function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    }
    return text;
}
	function getSelectedAsHtml(location){
		var aDiv=getHtml();
		if (!!aDiv) 
			return htmlthis(aDiv,null,location);
		else 
			return null;
	}
	
	var htmlthis =( //TODO I can dd a switch to download and save local version of the 'src' files
		function() {
		  var ELEMENT = 1,
				 TEXT = 3;
		  return function html(el, outer, LOCALE) {
					var i = 0, j = el.childNodes, k = outer?"<" + (m = el.nodeName.toLowerCase()) + attr(el,LOCALE) + ">":"",
						l = j.length, m, n;
					while(i !== l) switch((n = j[i++]).nodeType) {
					  case ELEMENT: k += html(n, true, LOCALE); break;
					  case TEXT:    k += htmlEncode( n.nodeValue);
					} 
					if (m==='br') return k;
					return k + (outer?"</" + m + ">":"");
				}; 
		function attr(el,LOCALE) {
			var i = 0, j = el.attributes, k = new Array(l = j.length), l, nm,v;
			while(i !== l) {
				nm = j[i].nodeName ;
				v = j[i].value;
				k[i]='';
				//check to see if src is local, add path if it is 
				if ((nm==='src')||(nm==='href')){
					var pathStart = v.substring(0,4);
					
					if ((pathStart==='file') ||(pathStart === 'http'))
						k[i] +=nm + '="'+ v + '"'; 
					else {
						if (nm==='src') {
							var locale = LOCALE.split('//');
							locale = locale[0]+'//'+locale[1].split('/')[0];
							k[i] +=nm +  '="'+ locale+v + '"';
						}
						else
							k[i] +=nm +  '="'+ LOCALE+v + '"';	
					}
		
				}
				else
					k[i] +=nm + '="'+ v +'"';
				//alert(nm+" ="+v);
				i++;
			}
			return (l?" ":"") + k.join(" ");
	  }
	})();
	function  UserInputDialog(prompt) {
						return window.prompt(prompt);
	}
	function injectMessageBox(doc) {
		// Inject the message box
		var messageBox = doc.getElementById("tiddlyclip-message-box");
		if(!messageBox) {
			messageBox = doc.createElement("div");
			messageBox.id = "tiddlyclip-message-box";
			messageBox.style.display = "none";
			doc.body.appendChild(messageBox);
			//just for debug
			messageBox["data-install"] = "1";
			install = 1;
			tiddlycut.log ("install:" + install);
			// Attach the event handler to the message box
			
		}
		else {
			//just of debug
			if (messageBox["data-install"]) {
				install = parseInt (messageBox["data-install"])+1;
				messageBox["data-install"] = install;
				tiddlycut.log ("install:" + install);
			} else {
				install = "1";
				messageBox["data-install"] = install;
				tiddlycut.log ("install:" + install);
			}
			
		}
		messageBox.addEventListener("tc-send-event",function(event) {
				
				// Get the details from the message
				var message = event.target,
				 msg = {};
				
				msg.txt = message.getAttribute("data-text");
				msg.aux = message.getAttribute("data-aux");
				msg.extra = message.getAttribute("data-extra");
				msg.action = message.getAttribute("data-action");
				msg.url = window.location.href;
				tiddlycut.log ("got show" + msg.action );
				//event.currentTarget.parentNode.removeChild(message);
				// Save the file

				chrome.runtime.sendMessage(msg,function() {});
				return false;
			},false);
		
	};
    var docked= false;
	function docLoad(doc) {
	//	if (doc.nodeName != '#document')
	//		return;
		//addEventListener('contextmenu', function (e) {tiddlycut.log("cm",e)});

		//callback for dock
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'actiondock') {
					// first stage send back url
					tiddlycut.log("actiondock in cs");				
					if(!isTiddlyWikiClassic() && !isTiddlyWiki5()) {
						sendResponse({title:null});
						return;
					}
					injectMessageBox(document);tiddlycut.log("actiondock out cs");
					var docked = true;
					sendResponse({title:document.title, url:window.location.href, config:findTiddlerInPage_ByTitle("TiddlyClipConfig"),opts:findTiddlerInPage_ByTitle(request.data.opttid)});
				}
		});
		//callback for cut
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'cut') {
					// first stage send back url
					tiddlycut.log("cut  content cs");
					remoteTidArr  = [''];
					sendResponse({ url:window.location.href, html:getSelectedAsHtml(window.location.href), 
						title:document.title, twc:isTiddlyWikiClassic()||false, tw5:isTiddlyWiki5(), response: (request.prompt?UserInputDialog(request.prompt):null),
						coords:xhairs.Coords()});
				}
		});
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'cutTid') {
					// first stage send back url
					tiddlycut.log("cutTid  content cs");

					sendResponse({ url:window.location.href, tids:cutTids(), title:document.title, 
						twc:isTiddlyWikiClassic()||false, tw5:isTiddlyWiki5(),response: (request.prompt?UserInputDialog(request.prompt):null)});
				}
		});
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'restorescreen') {
					// first stage send back url
					tiddlycut.log("restorescreen  content cs");
					xhairs.restorescreen();
					sendResponse({ });
				}
		});
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'alert') {
					// first stage send back url
					tiddlycut.log("alert:"+request.txt+request.aux+request.extra);
					alert(request.txt+request.aux+request.extra);
					sendResponse({ });
				}
		});
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'beep') {
					tiddlycut.log("beep:");
					new Audio(chrome.extension.getURL('beep.mp3')).play();
					sendResponse({ });
				}
		});
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'highlight') {
					// first stage send back url
					tiddlycut.log("highlight  content cs");
					hlight(null);
					sendResponse({ });
				}
		});
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'red'||request.action == 'lightblue'||
					request.action == 'lightgreen'||request.action == 'yellow') {
					// first stage send back url
					tiddlycut.log("highlight  content cs");
					hlight(request.action);
					sendResponse({ });
				}
		});
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				tiddlycut.log("cs:action="+request.action);
				if (request.action == 'xhairsOn') {
					xhairs.On();
					sendResponse({ });
				} else if(request.action == 'xhairsCancel') {
					xhairs.Remove();
					xhairs.restorescreen();
					sendResponse({ });
				} 
		});
		//callback for paste
	   chrome.runtime.onMessage.addListener(
			  function(request, sender, sendResponse) {
				if (request.action == 'paste') {
					tiddlycut.log("paste content cs");
				// Find the message box element
				var messageBox = document.getElementById("tiddlyclip-message-box");
				if(messageBox) {
					// Create the message element and put it in the message box
					var message = document.createElement("div");
					message.setAttribute("data-tiddlyclip-category",request.data.category);
					message.setAttribute("data-tiddlyclip-pageData",request.data.pageData);
					message.setAttribute("data-tiddlyclip-currentsection",request.data.currentsection);
					messageBox.appendChild(message);
					tiddlycut.log("tid appended ",request.data.pageData);
					// Create and dispatch the custom event to the extension
					var event = document.createEvent("Events");
					event.initEvent("tiddlyclip-save-file",true,false);
					message.dispatchEvent(event);
					tiddlycut.log("paste event sent");
				}
			}
		});
		tiddlycut.log("we are inside"+window.location);
		// ensure #content is available
		var content = doc.getElementById('content');
		if (!content)
			return;
	};
	function cutTids() {
		var title={}, tag={}, cancelled={};
			var text =getSelectionText();
			if (text!='') {
				var tid=findTiddlerInPage_ByTitle(text);
				if (!tid){ 
					alert ("Not a tiddler");
					return ; //error
				}
				else remoteTidArr[0]= tid;//string
			} else {
				//put up a window for the user to enter the name and tag
				//of tiddlers then find matching tids in this page
				//tcBrowser.EnterTidNameDialog (title, tag, cancelled);
				var key = window.prompt('Enter tag');
				tag.value =key;
				if (cancelled.value==true) {return ;}
				if (tag.value ==="") {				
					if (title.value == "") return ;
					var tid=findTiddlerInPage_ByTitle(title.value);
					if (!tid){ 
						alert ("No tiddler");
						return ; //error
					}
					else remoteTidArr[0]= tid;
				}
				else if (false===findTiddlersInPage_ByTag(tag.value)){ 
						alert ("No tiddlers");
						return ; //error
				}				
			return remoteTidArr ;	
		}
		return remoteTidArr;//no error
	}//end func
docLoad(document);

}());
