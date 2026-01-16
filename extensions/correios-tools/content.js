const script = document.createElement("script");
script.src = chrome.runtime.getURL("injected.js");
script.type = "module";
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);
