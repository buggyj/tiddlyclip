var prompt;// = window.arguments[0];
var userString;// = window.arguments [1];

function usrIN()
{ 
    prompt = window.arguments[0];
    userString = window.arguments[1];
    $("userprompt").value = prompt;
    $("userStr").value=userString.value;
}

function saveWindow()
{   
// values to pass back
    userString.value =  $("userStr").value;
    window.close();
    
}

function $(param) {
	return document.getElementById(param);
}
