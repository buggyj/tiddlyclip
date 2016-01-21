var EXPORTED_SYMBOLS = ["tiddlycutgetwinN","gettiddlycutcur","settiddlycutcur","gettiddlycutloc","settiddlycutloc","gettiddlycuttit","settiddlycuttit","gettiddlycutActive","settiddlycutActive"];


var winN=0;
function tiddlycutgetwinN(){ winN++; return winN;}

var tiddlycutActive = false;
function gettiddlycutActive() {return tiddlycutActive;}
function settiddlycutActive(x) {tiddlycutActive=x;}

var tiddlycutcur=0;
function gettiddlycutcur(){ return tiddlycutcur;}
function settiddlycutcur(x){  tiddlycutcur=x;}

var tiddlycutloc="";
function gettiddlycutloc(){ return tiddlycutloc;}
function settiddlycutloc(x){  tiddlycutloc=x;}

var tiddlycuttit="";
function gettiddlycuttit(){ return tiddlycuttit;}
function settiddlycuttit(x){  tiddlycuttit=x;}

