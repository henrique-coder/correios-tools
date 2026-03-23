const api = typeof browser !== 'undefined' ? browser : chrome;
const script = document.createElement('script');

script.src = api.runtime.getURL('injected.js');
script.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

window.addEventListener('message', async (event) => {
  if (
    event.source !== window ||
    !event.data ||
    event.data.type !== 'CT_FETCH_REQUEST'
  ) {
    return;
  }

  try {
    const response = await api.runtime.sendMessage({
      action: 'FETCH_SRO_MONITOR',
      url: event.data.url
    });

    window.postMessage(
      {
        type: 'CT_FETCH_RESPONSE',
        id: event.data.id,
        response: response || { success: false, error: 'Sem resposta' }
      },
      '*'
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
