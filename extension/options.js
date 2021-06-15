// Saves options to chrome.storage.sync.
function save_options() {
  chrome.storage.local.set({
    nodups: document.getElementById("nodups").checked
  }, function() {
  });
}


var test;

// Restores select box and text fields
function restore_options() {
		
  chrome.storage.local.get({
	nag: true
  }, function(items) {
    document.getElementById("nodups").checked = items.nodups;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('nodups').addEventListener('click',
    save_options);
