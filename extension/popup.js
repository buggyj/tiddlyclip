document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#clear').addEventListener('click', function() {
    var textarea = document.getElementById("inputarea");
    textarea.value="";
	chrome.storage.local.set({'notepad': ""}, function() {});
  });
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


function keypressed(){
	var textarea = document.getElementById("inputarea");
	chrome.storage.local.set({'notepad': textarea.value}, function() {});

}
function main(){
	var textarea = document.getElementById("inputarea");
	chrome.storage.local.get("notepad", function(items){
	var text = items.notepad;
		if(text != undefined){textarea.value=text;}
		else {textarea.value="";}
	});
	textarea.onkeyup = function(){keypressed();}
	
	
}

});
