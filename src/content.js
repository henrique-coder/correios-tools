const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

window.addEventListener('message', (event) => {
  if (
    event.source !== window ||
    !event.data ||
    event.data.type !== 'CT_FETCH_REQUEST'
  )
    return;

  try {
    chrome.runtime.sendMessage(
      { action: 'FETCH_SRO_MONITOR', url: event.data.url },
      (response) => {
        if (chrome.runtime.lastError) {
          window.postMessage(
            {
              type: 'CT_FETCH_RESPONSE',
              id: event.data.id,
              response: {
                success: false,
                error: chrome.runtime.lastError.message
              }
            },
            '*'
          );
        } else {
          window.postMessage(
            {
              type: 'CT_FETCH_RESPONSE',
              id: event.data.id,
              response: response
            },
            '*'
          );
        }
      }
    );
  } catch (e) {
    window.postMessage(
      {
        type: 'CT_FETCH_RESPONSE',
        id: event.data.id,
        response: { success: false, error: e.message }
      },
      '*'
    );
  }
});
