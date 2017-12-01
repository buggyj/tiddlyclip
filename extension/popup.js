document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#clear').addEventListener('click', function() {
    var textarea = document.getElementById("inputarea");
    textarea.value="";
	chrome.storage.local.set({'notepad': ""}, function() {});
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
