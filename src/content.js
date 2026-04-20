const api = typeof browser !== 'undefined' ? browser : chrome;
const REMOTE_STATUS_URL =
  'https://raw.githubusercontent.com/henrique-coder/correios-wizard/refs/heads/prod/status.json';
const REMOTE_STATUS_TIMEOUT_MS = 3500;
const REMOTE_STATUS_CACHE_TTL_MS = 5 * 60 * 1000;
const REMOTE_STATUS_CACHE_KEY = 'CORREIOS_WIZARD::REMOTE_STATUS_CACHE';
const FETCH_REQ_EVENT = '_CW_FETCH_REQ_';
const FETCH_RES_EVENT = '_CW_FETCH_RES_';

function readRemoteStatusCache() {
  try {
    const raw = sessionStorage.getItem(REMOTE_STATUS_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed.enabled !== 'boolean' ||
      typeof parsed.ts !== 'number'
    ) {
      return null;
    }

    if (Date.now() - parsed.ts > REMOTE_STATUS_CACHE_TTL_MS) {
      sessionStorage.removeItem(REMOTE_STATUS_CACHE_KEY);
      return null;
    }

    return parsed.enabled;
  } catch {
    return null;
  }
}

function writeRemoteStatusCache(enabled) {
  try {
    sessionStorage.setItem(
      REMOTE_STATUS_CACHE_KEY,
      JSON.stringify({ enabled: !!enabled, ts: Date.now() })
    );
  } catch {}
}

async function fetchRemoteEnabledFlag() {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REMOTE_STATUS_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${REMOTE_STATUS_URL}?_t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    });
    if (!response.ok) return null;

    const json = await response.json();
    if (!json || typeof json.enabled !== 'boolean') return null;

    writeRemoteStatusCache(json.enabled);
    return json.enabled;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveStealthMode() {
  const cachedEnabled = readRemoteStatusCache();
  if (cachedEnabled !== null) {
    return cachedEnabled !== true;
  }

  const remoteEnabled = await fetchRemoteEnabledFlag();
  return remoteEnabled !== true;
}

function injectRuntimeScript() {
  const scriptId = 'correios-wizard-runtime-script';
  if (document.getElementById(scriptId)) return;

  const script = document.createElement('script');
  script.id = scriptId;
  script.src = api.runtime.getURL('injected.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

resolveStealthMode().then((stealthMode) => {
  if (stealthMode) {
    console.info(
      '[Correios Wizard] Modo stealth ativado remotamente. Extensão desabilitada nesta sessão.'
    );
  } else {
    injectRuntimeScript();
  }
});

window.addEventListener('message', async (event) => {
  if (
    event.origin !== window.location.origin ||
    event.source !== window ||
    !event.data ||
    event.data.type !== FETCH_REQ_EVENT ||
    typeof event.data.url !== 'string'
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
        type: FETCH_RES_EVENT,
        id: event.data.id,
        response: response || { success: false, error: 'Sem resposta' }
      },
      window.location.origin
    );
  } catch (e) {
    window.postMessage(
      {
        type: FETCH_RES_EVENT,
        id: event.data.id,
        response: { success: false, error: e.message }
      },
      window.location.origin
    );
  }
});
