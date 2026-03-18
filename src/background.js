const SROWEB_INDEX_URL = 'https://sroweb.correios.com.br/app/index.php';

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: SROWEB_INDEX_URL });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FETCH_SRO_MONITOR') {
    fetch(request.url)
      .then((res) => {
        if (!res.ok)
          throw new Error('HTTP ' + res.status + ' ' + res.statusText);
        return res.text();
      })
      .then((text) => sendResponse({ success: true, data: text }))
      .catch((err) =>
        sendResponse({ success: false, error: err.message || 'Erro de rede' })
      );

    return true;
  }
});
