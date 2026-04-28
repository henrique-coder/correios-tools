import { createLoecStore } from './state.js';
import { registerFetchInterceptor } from '../../shared/fetch/interceptor.js';
import { renderDashboard } from './dashboard/index.js';
import type { DistrictData } from './state.js';

export function runSuspendedLoecService(
  fetchProxy: (url: string) => Promise<string>
): void {
  const store = createLoecStore();

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
    setTimeout(() => renderDashboard(districts, store, fetchProxy), 350);
  }

  registerFetchInterceptor(handleResponse);
}
