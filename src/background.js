const api = typeof browser !== 'undefined' ? browser : chrome;
const SROWEB_INDEX_URL = 'https://sroweb.correios.com.br/app/index.php';

api.action.onClicked.addListener(() => {
  api.tabs.create({ url: SROWEB_INDEX_URL });
});

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FETCH_PROXY') {
    fetch(request.url)
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then((text) => sendResponse({ success: true, data: text }))
      .catch((err) =>
        sendResponse({
          success: false,
          error: err.message || 'Failed to fetch'
        })
      );
    return true;
  }
});
