import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { RUNTIME_DEFAULTS } from '../config/defaults.js';

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
  main() {
    window.addEventListener('message', async (event) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window ||
        !event.data ||
        event.data.type !== FETCH_REQ_EVENT ||
        typeof event.data.url !== 'string'
      )
        return;

      try {
        const response = await browser.runtime.sendMessage({
          action: FETCH_PROXY_ACTION,
          url: event.data.url,
          options: event.data.options
        });
        window.postMessage(
          {
            type: FETCH_RES_EVENT,
            id: event.data.id,
            response: response ?? { success: false, error: 'Sem resposta' }
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
