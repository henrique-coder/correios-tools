(function () {
  'use strict';

  const core = createInjectedCore();
  const path = core.PATH;

  if (path.includes('/lancamentoautomatico/')) {
    runLancamentoAutomaticoService(core);
  } else if (path.includes('/loecsuspensa/')) {
    runLoecSuspensaService(core);
  }
})();
