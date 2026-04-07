const api = typeof browser !== 'undefined' ? browser : chrome;
const SROWEB_INDEX_URL = 'https://sroweb.correios.com.br/app/index.php';

api.action.onClicked.addListener(() => {
  api.tabs.create({ url: SROWEB_INDEX_URL });
});

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FETCH_PROXY') {
    fetch(request.url)
      .then(async (res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const cType = res.headers.get('content-type') || '';
        let charset = 'utf-8';
        if (cType.toLowerCase().includes('charset=')) {
          charset = cType.match(/charset=([^\s;]+)/i)[1];
        } else if (request.url.includes('correios.com.br')) {
          charset = 'iso-8859-1';
        }
        const buffer = await res.arrayBuffer();
        try {
          return new TextDecoder(charset).decode(buffer);
        } catch (e) {
          return new TextDecoder('iso-8859-1').decode(buffer);
        }
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
