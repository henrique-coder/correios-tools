const api = typeof browser !== 'undefined' ? browser : chrome;

let stealthMode = true;
try {
  const xhr = new XMLHttpRequest();
  xhr.open(
    'GET',
    'https://raw.githubusercontent.com/henrique-coder/correios-wizard/refs/heads/prod/status.json?_t=' +
      Date.now(),
    false
  );
  xhr.send();
  if (xhr.status === 200) {
    const config = JSON.parse(xhr.responseText);
    if (config.enabled === true) {
      stealthMode = false;
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
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

window.addEventListener('message', async (event) => {
  if (
    event.origin !== window.location.origin ||
    event.source !== window ||
    !event.data ||
    event.data.type !== '_CW_FETCH_REQ_'
  ) {
    return;
  }

  try {
    const response = await api.runtime.sendMessage({
      action: 'FETCH_PROXY',
      url: event.data.url
    });

    window.postMessage(
      {
        type: '_CW_FETCH_RES_',
        id: event.data.id,
        response: response || { success: false, error: 'Sem resposta' }
      },
      window.location.origin
    );
  } catch (e) {
    window.postMessage(
      {
        type: '_CW_FETCH_RES_',
        id: event.data.id,
        response: { success: false, error: e.message }
      },
      window.location.origin
    );
  }
});
