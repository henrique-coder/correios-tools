if (typeof browser === "undefined") {
  var browser = chrome;
}

const SROWEB_INDEX_URL = "https://sroweb.correios.com.br/app/index.php";

browser.action.onClicked.addListener(() => {
  browser.tabs.create({ url: SROWEB_INDEX_URL });
});
