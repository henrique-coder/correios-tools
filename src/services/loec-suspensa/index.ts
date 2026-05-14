import { LOEC_DOM_SELECTORS } from '../../shared/constants/dom-elements.js';
import { registerFetchInterceptor } from '../../shared/fetch/interceptor.js';
import { waitForElement } from '../../shared/utils/dom.js';
import { renderDashboard } from './dashboard/index.js';
import type { DistrictData } from './state.js';
import { createLoecStore } from './state.js';

export function runSuspendedLoecService(
  fetchProxy: (url: string) => Promise<string>
): void {
  const store = createLoecStore();
  let cachedDistricts: DistrictData[] | null = null;
  let buttonsReady = false;
  let pendingRender = false;

  const tryRender = () => {
    if (!buttonsReady || !cachedDistricts || pendingRender) return;
    pendingRender = true;
    renderDashboard(cachedDistricts, store, fetchProxy).finally(() => {
      pendingRender = false;
    });
  };

  waitForElement<HTMLElement>(LOEC_DOM_SELECTORS.BUTTONS_CONTAINER, 200, 150)
    .then(() => {
      buttonsReady = true;
      tryRender();
    })
    .catch(() => undefined);

  function handleResponse(url: string, data: unknown): void {
    if (!url.includes('lancamentoController.php?acao=listar')) return;
    if (!Array.isArray(data)) return;
    store.loecObjectCache = {};
    const districts = (data as any[]).map((rawItem): DistrictData => {
      return {
        correios_idLancamento: rawItem.idLancamento,
        correios_numeroDistrito: rawItem.numeroDistrito,
        correios_areaDistrito: rawItem.areaDistrito,
        correios_rotuloDistrito: rawItem.rotuloDistrito,
        correios_nomeCarteiro: rawItem.nomeCarteiro,
        correios_matriculaCarteiro: rawItem.matriculaCarteiro,
        correios_codigoSro: rawItem.codigoSro,
        correios_qtde: rawItem.qtde,
        correios_qtdePontos: rawItem.qtdePontos,
        correios_qtdeVencido: rawItem.qtdeVencido,
        correios_qtdeHoje: rawItem.qtdeHoje,
        correios_qtdeAVencer: rawItem.qtdeAVencer,
        correios_qtdeAR: rawItem.qtdeAR
      };
    });
    cachedDistricts = districts;
    if (buttonsReady) {
      tryRender();
    } else {
      waitForElement<HTMLElement>(
        LOEC_DOM_SELECTORS.BUTTONS_CONTAINER,
        200,
        150
      )
        .then(() => {
          buttonsReady = true;
          tryRender();
        })
        .catch(() => undefined);
    }
  }

  registerFetchInterceptor(handleResponse);
}
