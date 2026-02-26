const script = document.createElement('script');

script.src = browser.runtime.getURL('injected.js');
script.type = 'module';
script.onload = function () {
  this.remove();
};

(document.head || document.documentElement).appendChild(script);
