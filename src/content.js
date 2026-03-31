const api = typeof browser !== 'undefined' ? browser : chrome;

(async function init() {
  let stealth = false;
  try {
    const res = await api.runtime.sendMessage({ action: 'CHECK_STEALTH' });
    if (res && res.stealthMode) stealth = true;
  } catch (e) {}

  let lastUrl = window.location.href;
  setInterval(async () => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      try {
        const check = await api.runtime.sendMessage({
          action: 'CHECK_STEALTH'
        });
        const currentStealth = check ? !!check.stealthMode : stealth;

        if (stealth !== currentStealth) {
          window.location.reload();
          return;
        }

        if (!currentStealth) {
          const l = lastUrl.toLowerCase();
          if (
            l.includes('/loecsuspensa') ||
            l.includes('/lancamentoautomatico')
          ) {
            window.location.reload();
          }
        }
      } catch (e) {}
    }
  }, 500);

  if (stealth) return;

  try {
    const script = document.createElement('script');
    script.src = api.runtime.getURL('injected.js');
    script.onload = function () {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  } catch (e) {}
})();

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
      action: 'FETCH_PROXY',
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
