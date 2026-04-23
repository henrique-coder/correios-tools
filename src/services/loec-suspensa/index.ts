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
    const districts = (data as any[]).map(
      (d): DistrictData => ({
        dispatchId: d.idLancamento,
        districtNumber: d.numeroDistrito,
        districtArea: d.areaDistrito,
        districtLabel: d.rotuloDistrito,
        postmanName: d.nomeCarteiro,
        postmanId: d.matriculaCarteiro,
        sroCode: d.codigoSro,
        quantity: d.qtde,
        pointsQuantity: d.qtdePontos,
        overdueQuantity: d.qtdeVencido,
        todayQuantity: d.qtdeHoje,
        dueSoonQuantity: d.qtdeAVencer,
        arQuantity: d.qtdeAR
      })
    );
    setTimeout(() => renderDashboard(districts, store, fetchProxy), 350);
  }

  registerFetchInterceptor(handleResponse);
}
