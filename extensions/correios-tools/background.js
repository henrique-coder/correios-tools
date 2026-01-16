import { URLS } from "./src/constants.js";

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: URLS.SROWEB_INDEX });
});
