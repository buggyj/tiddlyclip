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
			this.modifier = pref.Get("txtUserName")||'none';
			this.modified = (new  Date()).toJSON().replace(/(.*)\-(.*)\-(.*)[tT](.*)\:(.*)\:(.*)\.(.*)[zZ]/,"$1$2$3$4$5");
			//JSON dates have the same format as the ISO-8601 standard: YYYY-MM-DDTHH:mm:ss.sssZ
			this.created = this.modified;
			this.creator = this.modifier;
			this.attribs = ["title","modifier","modified","created","creator","tags"];
			return this;
		}
		if((typeof el) ==="string"){ //convert html to dom ;
			tiddlycut.log("conversion from json");
			this.attribs = [];
			var tid = JSON.parse(el);

			for (var i in tid) {
				if (i=="text") {
					this["body"]= tid[i];
				}else{
					this[i] = tid[i] ;
					this.attribs.push(i);
				}
			} 
			return this;
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
				tiddler += ' '+ this.attribs[i] + '="' +tcBrowser.htmlEncode(this[this.attribs[i]])+'"';
		}
		if (this.body)
		   tiddler += 	">\n<pre>" + tcBrowser.htmlEncode(this.body) + "</pre>\n</div>";
		else 
		   tiddler += 	">\n<\n</div>";
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

