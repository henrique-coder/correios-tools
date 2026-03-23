const api = typeof browser !== 'undefined' ? browser : chrome;

let stealthMode = false;
try {
  const xhr = new XMLHttpRequest();
  xhr.open(
    'GET',
    'https://raw.githubusercontent.com/henrique-coder/correios-wizard/prod/status.json?_t=' +
      Date.now(),
    false
  );
  xhr.send();
  if (xhr.status === 200) {
    const config = JSON.parse(xhr.responseText);
    if (config.enabled === false) {
      stealthMode = true;
    }
  }
} catch (e) {}

if (stealthMode) {
  console.log(
    '[Correios Wizard] Modo stealth ativado remotamente. Extensão desabilitada nesta sessão.'
  );
} else {
  const script = document.createElement('script');
  script.src = api.runtime.getURL('injected.js');
  script.onload = function () {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

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
