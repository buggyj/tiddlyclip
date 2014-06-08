var EXPORTED_SYMBOLS = ["tiddlycutgetwinN","gettiddlycutcur","settiddlycutcur"];


var winN=0;
function tiddlycutgetwinN(){ winN++; return winN;}

var tiddlycutcur=0;
function gettiddlycutcur(){ return tiddlycutcur;}
function settiddlycutcur(x){  tiddlycutcur=x;}
