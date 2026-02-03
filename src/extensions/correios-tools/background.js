const SROWEB_INDEX_URL = "https://sroweb.correios.com.br/app/index.php";

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: SROWEB_INDEX_URL });
});
