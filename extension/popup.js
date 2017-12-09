document.addEventListener('DOMContentLoaded', function () {

   document.querySelector('#xhairson').addEventListener('click', function() {
    chrome.runtime.sendMessage({action:"xhairsOn"});close();
  });
  document.querySelector('#xhairscancel').addEventListener('click', function() {
    chrome.runtime.sendMessage({action:"xhairsCancel"});close();
  });
  document.querySelector('#red').addEventListener('click', function() {
    chrome.runtime.sendMessage({action:"red"});close();
  });
   document.querySelector('#blue').addEventListener('click', function() {
    chrome.runtime.sendMessage({action:"lightblue"});close();
  });
   document.querySelector('#green').addEventListener('click', function() {
    chrome.runtime.sendMessage({action:"lightgreen"});close();
  });
   document.querySelector('#yellow').addEventListener('click', function() {
    chrome.runtime.sendMessage({action:"yellow"});close();
  });
    
main();

function clicked (tag){
	chrome.storage.local.get({tags:{}}, function(items){
		//alert("is "+tag);
		//alert(document.querySelector("#tags"+tag).checked);
		items.tags[tag] = document.querySelector("#tags"+tag).checked;
		
		chrome.storage.local.set({
			tags:items.tags
		  });
	});
}


function keypressed(){
	var textarea = document.getElementById("inputarea");
	chrome.storage.local.set({'notepad': textarea.value}, function() {});

}
function main(){
	var textarea = document.getElementById("inputarea");
	chrome.storage.local.get({notepad:"", tags:{}}, function(items){
		var text = items.notepad, i,j=0, html = "", closehtml = "", aretags=false;
		if(text != undefined){textarea.value=text;}
		else {textarea.value="";}
		
		html = '<table><tr><td>Extra tags: </td>';
		closehtml = '</tr></table>';
		
		for (i in items.tags) {
			aretags = true;
			j++;
			if (j === 5) html += '<tr></tr>';
			if (j === 11) html += '<tr></tr>';
			html += '<td align="right">'+i+'<input type="checkbox" id="tags'+i+'" ></td>';
		}	
		if (aretags) {
			html += closehtml;//alert(html)
			if (html !=="") {
				document.querySelector('#fortags').innerHTML = html;
			} 

			for (i in items.tags) {
				document.querySelector('#tags'+i).checked = items.tags[i];
				(function (j) {
					document.querySelector('#tags'+i).onchange = function(e){clicked(j);}
				})(i);
			}
		}
	});
	textarea.onkeyup = function(){keypressed();}
	
	
}

});
