var cancel;// = window.arguments [2];
function enterUserInput() {

    cancel = window.arguments [3];

    $("inputTitle").value = "";
    $("inputTags").value =  "";
}
function saveUserInput() {   
// values to pass back
   window.arguments[2].value =  false;
   window.arguments[1].value =  $("inputTags").value;
   window.arguments[0].value = $("inputTitle").value;
   window.close();
}

function $(param) {
	return document.getElementById(param);
}
