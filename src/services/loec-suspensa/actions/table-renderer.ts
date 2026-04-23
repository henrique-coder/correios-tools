import type { LoecStore, LoecObject } from '../state.js';
import { getSroStatusColor } from '../../../shared/utils/color.js';
import { batchFetchSroIntranet } from '../../../shared/sro/intranet-fetcher.js';
import { mergeSroCache } from '../../../shared/sro/intranet-parser.js';
import { SROINTRANET_ORIGIN } from '../../../shared/constants/urls.js';
import { getArqFilters, getFilteredObjs } from './fetch-objects.js';

export function renderArqTable(
  store: LoecStore,
  fetchProxy: (url: string) => Promise<string>
): void {
  const resultEl = document.getElementById('ct-arq-result');
  if (!resultEl) return;

  const data = store.ctArqLastData;
  if (!data?.objs?.length) {
    resultEl.innerHTML =
      '<div style="padding:10px;text-align:center;color:#ef4444">Nenhum objeto encontrado na categoria especificada!</div>';
    return;
  }

  const filters = getArqFilters();
  const filteredObjs = getFilteredObjs(data, filters, store);

  if (!filteredObjs.length) {
    resultEl.innerHTML =
      '<div style="padding:10px;text-align:center;color:#ef4444">Nenhum objeto retornado para este filtro.</div>';
    return;
  }

  const mode = filters.mode;
  let html = buildTableHeader(filteredObjs.length, mode);

  const objsToFetch: string[] = [];
  for (const o of filteredObjs) {
    const sroData = store.sroIntranetCache[o.objeto ?? ''];
    const sroVal = sroData?.sit ?? null;
    if (!sroVal && o.objeto && mode !== '2') objsToFetch.push(o.objeto);
    html += buildTableRow(o, mode, sroVal, SROINTRANET_ORIGIN);
  }

  html += '</tbody></table>';
  resultEl.innerHTML = html;

  if (!objsToFetch.length) return;

  const renderId = Symbol();
  store.currentArqRenderId = renderId;
  const cacheId = store.sroIntranetCacheId;
  const prog = document.getElementById('ct-arq-sro-progress');
  if (prog) prog.style.display = 'block';

  batchFetchSroIntranet({
    fetchFn: fetchProxy,
    objects: objsToFetch,
    existingCache: store.sroIntranetCache,
    renderId,
    getRenderId: () => store.currentArqRenderId,
    onBatchDone: (resolved, done, total) => {
      if (
        store.currentArqRenderId !== renderId ||
        store.sroIntranetCacheId !== cacheId
      )
        return;
      store.sroIntranetCache = mergeSroCache(store.sroIntranetCache, resolved);
      for (const [obj, entry] of Object.entries(resolved)) {
        const td = document.getElementById(`sro-st-${obj}`);
        if (td)
          td.innerHTML = `<span style="color:${getSroStatusColor(entry.sit)};font-weight:bold;font-size:10px;text-transform:uppercase">${entry.sit}</span>`;
      }
      if (prog)
        prog.innerText = `Sincronizando SRO Intranet... ${done}/${total}`;
    },
    onComplete: () => {
      if (store.currentArqRenderId !== renderId) return;
      if (prog) {
        prog.innerText = 'Sincronizado';
        setTimeout(() => {
          if (prog && store.currentArqRenderId === renderId)
            prog.style.display = 'none';
        }, 3000);
      }
    }
  });
}

function buildTableHeader(count: number, mode: string): string {
  const modeHeaders: Record<string, string> = {
    '1': '<th style="padding:8px;border-bottom:2px solid #cbd5e1">Distrito</th><th style="padding:8px;border-bottom:2px solid #cbd5e1">Objeto</th><th style="padding:8px;border-bottom:2px solid #cbd5e1">Situação SRO</th>',
    '2': '<th style="padding:8px;border-bottom:2px solid #cbd5e1">Distrito</th><th style="padding:8px;border-bottom:2px solid #cbd5e1">Endereço</th>',
    '3': '<th style="padding:8px;border-bottom:2px solid #cbd5e1">Distrito</th><th style="padding:8px;border-bottom:2px solid #cbd5e1">Objeto</th><th style="padding:8px;border-bottom:2px solid #cbd5e1">Demais Dados</th><th style="padding:8px;border-bottom:2px solid #cbd5e1">Situação SRO</th>'
  };
  return `<div style="margin-bottom:12px;font-weight:bold;color:#334155;border-bottom:1px solid #e2e8f0;padding-bottom:8px;display:flex;justify-content:space-between;align-items:center">
    <span>Pré-visualização: ${count} objetos</span>
    <span id="ct-arq-sro-progress" style="font-size:11px;color:#10b981;font-weight:600;display:none">Sincronizando SRO Intranet...</span>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left">
  <thead><tr style="color:#64748b">${modeHeaders[mode] ?? modeHeaders['3']}</tr></thead><tbody>`;
}

function buildTableRow(
  o: LoecObject,
  mode: string,
  sroVal: string | null,
  baseUrl: string
): string {
  const sroDisplay = sroVal
    ? `<span style="color:${getSroStatusColor(sroVal)};font-weight:bold;font-size:10px;text-transform:uppercase">${sroVal}</span>`
    : `<span style="color:#94a3b8;font-size:10px">Buscando...</span>`;

  const objLink = o.objeto
    ? `<a href="${baseUrl}/rastreamento?objetos=${o.objeto}" target="_blank" style="text-decoration:none;color:${o.cor ?? 'inherit'}">${o.objeto}</a>`
    : '--';

  let cells = `<td style="padding:8px;font-weight:bold;width:80px">${o.dist}</td>`;
  if (mode === '1') {
    cells += `<td style="padding:8px;color:${o.cor ?? 'inherit'};font-weight:bold">${objLink}</td><td style="padding:8px" id="sro-st-${o.objeto}">${sroDisplay}</td>`;
  } else if (mode === '2') {
    cells += `<td style="padding:8px;color:#475569">${o.endereco ?? ''} - ${o.cep ?? ''}</td>`;
  } else {
    cells += `<td style="padding:8px;color:${o.cor ?? 'inherit'};font-weight:bold;width:140px">${objLink}</td>
      <td style="padding:8px;color:#475569">
        <div style="margin-bottom:4px">${o.endereco ?? ''} - ${o.cep ?? ''}</div>
        <div style="font-size:11px;color:#94a3b8">Max. Entrega: ${o.dataMaximaEntrega?.replace('T', ' ') ?? ''}</div>
      </td>
      <td style="padding:8px;width:160px" id="sro-st-${o.objeto}">${sroDisplay}</td>`;
  }

  return `<tr style="border-bottom:1px solid #f1f5f9">${cells}</tr>`;
}
