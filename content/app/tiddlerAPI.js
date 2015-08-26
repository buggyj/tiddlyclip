tiddlycut.modules.tiddlerAPI = (function () {

	var api = 
	{
		onLoad:onLoad, Tiddler:Tiddler
	}
	var tcBrowser, pref, document, browseris;
	
	function onLoad(browser, doc) {
		browseris	= browser;
		document = doc;
		tcBrowser	= tiddlycut.modules.tcBrowser;
		pref	 	= tiddlycut.modules.pref;		
	}
	
	function Tiddler(el) {
		if (!el) { 
			this.title='';
			this.body ='';
			this.tags ='';
			this.modifier = pref.getCharPref("tiddlycut.txtUserName")||'none';
			this.modified = (new  Date()).toJSON().replace(/(.*)\-(.*)\-(.*)[tT](.*)\:(.*)\:(.*)\.(.*)[zZ]/,"$1$2$3$4$5");
			//JSON dates have the same format as the ISO-8601 standard: YYYY-MM-DDTHH:mm:ss.sssZ
			this.created = this.modified;
			this.creator = this.modifier;
			this.attribs = ["title","modifier","modified","created","creator","tags"];
			return this;
		}
		if((typeof el) ==="string"){ //convert html to dom ;
			tiddlycut.log("dom conversion not allowed")
		}
		this.attribs = [];
		this.body = undoHtmlEncode(el.innerHTML.
				replace(/\n<pre xmlns="http:\/\/www.w3.org\/1999\/xhtml">([\s|\S]*)<\/pre>\n/mg,"$1").
				replace(/\n<pre>([\s|\S]*)<\/pre>\n/mg,"$1"));
		var  j = el.attributes, m, extraTags='';
		for (var i = j.length; i!== 0; i--) {
			//BJ for older tw replace tidder with title
			m=j[i-1].nodeName; 
			v=j[i-1].value;
			this.attribs.push(m);
			this[m] = undoHtmlEncode(v) ;
		}
		return this;
	}
		
	Tiddler.prototype.EncodedDiv = function() {
		var tiddler = "<div";
		for (var i = 0; i<this.attribs.length; i++){
			//with the program tags and extraTags are combined - seperate them before writing to file
				tiddler += ' '+ this.attribs[i] + '="' +tcBrowser.htmlEncode(this[this.attribs[i]])+'"';
		}
		tiddler += 	">\n<pre>" + tcBrowser.htmlEncode(this.body) + "</pre>\n</div>";
		return tiddler;
	}
	
	function undoHtmlEncode( input ) {
		input =input
        .replace(/&bar;/g, '|')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
        return (input);
	}
	return api;

}());

