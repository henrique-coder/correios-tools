import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { injectScript } from 'wxt/utils/inject-script';
import { RUNTIME_DEFAULTS } from '../config/defaults.js';

const REMOTE_STATUS_URL = RUNTIME_DEFAULTS.URLS.REMOTE_STATUS;
const REMOTE_STATUS_TIMEOUT_MS =
  RUNTIME_DEFAULTS.LIMITS.REMOTE_STATUS_TIMEOUT_MS;
const REMOTE_STATUS_CACHE_TTL_MS =
  RUNTIME_DEFAULTS.LIMITS.REMOTE_STATUS_CACHE_TTL_MS;
const REMOTE_STATUS_CACHE_KEY = `${RUNTIME_DEFAULTS.PROJECT_CODE}::REMOTE_STATUS_CACHE`;
const FETCH_REQ_EVENT = RUNTIME_DEFAULTS.EVENTS.FETCH_REQ;
const FETCH_RES_EVENT = RUNTIME_DEFAULTS.EVENTS.FETCH_RES;
const FETCH_PROXY_ACTION = RUNTIME_DEFAULTS.ACTIONS.FETCH_PROXY;

export default defineContentScript({
  matches: [
    'https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamentoautomatico/*',
    'https://sroweb.correios.com.br/app/entregaexternaautomatica/loecsuspensa/*'
  ],
  runAt: 'document_start',
  allFrames: false,
  async main() {
    function readRemoteStatusCache(): boolean | null {
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

    function writeRemoteStatusCache(enabled: boolean): void {
      try {
        sessionStorage.setItem(
          REMOTE_STATUS_CACHE_KEY,
          JSON.stringify({ enabled: !!enabled, ts: Date.now() })
        );
      } catch {}
    }

    async function fetchRemoteEnabledFlag(): Promise<boolean | null> {
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

    async function resolveStealthMode(): Promise<boolean> {
      const cachedEnabled = readRemoteStatusCache();
      if (cachedEnabled !== null) {
        return cachedEnabled !== true;
      }

      const remoteEnabled = await fetchRemoteEnabledFlag();
      return remoteEnabled !== true;
    }

    async function injectRuntimeScript(): Promise<void> {
      const scriptId = 'correios-wizard-runtime-script';
      if (document.getElementById(scriptId)) return;

      const { script } = await injectScript('/injected.js', {
        keepInDom: true,
        modifyScript(element) {
          element.id = scriptId;
        }
      });

      script.remove();
    }

    const stealthMode = await resolveStealthMode();
    if (stealthMode) {
      console.info(
        '[Correios Wizard] Modo stealth ativado remotamente. Extensao desabilitada nesta sessao.'
      );
    } else {
      await injectRuntimeScript();
    }

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
        const response = await browser.runtime.sendMessage({
          action: FETCH_PROXY_ACTION,
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
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha no envio da mensagem';
        window.postMessage(
          {
            type: FETCH_RES_EVENT,
            id: event.data.id,
            response: { success: false, error: message }
          },
          window.location.origin
        );
      }
    });
  }
});
