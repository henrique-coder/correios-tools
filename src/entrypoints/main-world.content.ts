import { defineContentScript } from 'wxt/utils/define-content-script';
import { createFetchProxy } from '../shared/fetch/proxy.js';
import { runAutoDispatchService } from '../services/lancamento-automatico/index.js';
import { runSuspendedLoecService } from '../services/loec-suspensa/index.js';

export default defineContentScript({
  matches: [
    'https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamentoautomatico/*',
    'https://sroweb.correios.com.br/app/entregaexternaautomatica/loecsuspensa/*'
  ],
  runAt: 'document_start',
  world: 'MAIN',
  allFrames: false,
  main() {
    const fetchProxy = createFetchProxy();
    const path = window.location.pathname.toLowerCase();

    if (path.includes('/lancamentoautomatico/')) {
      runAutoDispatchService(fetchProxy);
    } else if (path.includes('/loecsuspensa/')) {
      runSuspendedLoecService(fetchProxy);
    }
  }
});
