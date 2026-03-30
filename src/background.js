const api = typeof browser !== 'undefined' ? browser : chrome;
const SROWEB_INDEX_URL = 'https://sroweb.correios.com.br/app/index.php';

let stealthModeCache = null;
let lastFetchTime = 0;

async function checkStealthMode() {
  if (stealthModeCache !== null && Date.now() - lastFetchTime < 60000) {
    return stealthModeCache;
  }
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/henrique-coder/correios-wizard/prod/status.json?_t=' +
        Date.now()
    );
    if (res.ok) {
      const config = await res.json();
      stealthModeCache = !(config.enabled === true);
    } else {
      stealthModeCache = true;
    }
  } catch (e) {
    stealthModeCache = true;
  }
  lastFetchTime = Date.now();
  return stealthModeCache;
}

api.action.onClicked.addListener(() => {
  api.tabs.create({ url: SROWEB_INDEX_URL });
});

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'CHECK_STEALTH') {
    checkStealthMode().then((isStealth) => {
      sendResponse({ stealthMode: isStealth });
    });
    return true;
  }

  if (request.action === 'FETCH_PROXY') {
    try {
      const urlObj = new URL(request.url);
      if (!urlObj.hostname.endsWith('correios.com.br')) {
        sendResponse({ success: false, error: 'Unauthorized URL' });
        return false;
      }
    } catch (e) {
      sendResponse({ success: false, error: 'Invalid URL' });
      return false;
    }

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
