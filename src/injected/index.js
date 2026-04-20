import { runLancamentoAutomaticoService } from './services/lancamentoautomatico/index.js';
import { runLoecSuspensaService } from './services/loecsuspensa/index.js';
import { createInjectedCore } from './shared/core.js';

export function runInjectedMain() {
  const core = createInjectedCore();
  const path = core.PATH;

  if (path.includes('/lancamentoautomatico/')) {
    runLancamentoAutomaticoService(core);
  } else if (path.includes('/loecsuspensa/')) {
    runLoecSuspensaService(core);
  }
}
