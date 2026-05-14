import { RUNTIME_DEFAULTS } from '../../../config/defaults.js';
import { LOEC_DOM_IDS } from '../../../shared/constants/dom-elements.js';
import { SROINTRANET_ORIGIN } from '../../../shared/constants/urls.js';
import { batchFetchSroIntranet } from '../../../shared/sro/intranet-fetcher.js';
import { mergeSroCache } from '../../../shared/sro/intranet-parser.js';
import { getSroStatusColor } from '../../../shared/utils/color.js';
import {
  getTrackingPrefix,
  normalizeAddressForSort,
  normalizeTextForCompare
} from '../../../shared/utils/format.js';
import type { DeliveryObject, LoecStore } from '../state.js';
import { getArchiveFilters, getFilteredObjs } from './fetch-objects.js';
import { refreshSroMasterFilters } from './filters.js';

export function renderArqTable(
  store: LoecStore,
  fetchProxy: (url: string) => Promise<string>
): Promise<void> {
  return new Promise((resolve) => {
    const resultEl = document.getElementById(LOEC_DOM_IDS.ARCHIVE_RESULT);
    if (!resultEl) {
      resolve();
      return;
    }

    const data = store.archiveLastData;
    if (!data?.objs?.length) {
      resultEl.innerHTML =
        '<div style="padding:10px;text-align:center;color:#ef4444">Nenhum objeto encontrado na categoria especificada!</div>';
      resolve();
      return;
    }

    const filters = getArchiveFilters();
    const mode = filters.mode;
    const filteredObjs = getFilteredObjs(data, filters, store);
    const collator = new Intl.Collator('pt-BR', {
      numeric: true,
      sensitivity: 'base'
    });
    const sortedObjs = [...filteredObjs].sort((a, b) => {
      if (mode === '1') {
        const pa = getTrackingPrefix(a.trackingCode ?? '');
        const pb = getTrackingPrefix(b.trackingCode ?? '');
        const byPrefix = collator.compare(pa, pb);
        if (byPrefix !== 0) return byPrefix;
        return collator.compare(a.trackingCode ?? '', b.trackingCode ?? '');
      }
      if (mode === '2') {
        const ka = normalizeAddressForSort(a.address ?? '');
        const kb = normalizeAddressForSort(b.address ?? '');
        const byAddr = collator.compare(ka, kb);
        if (byAddr !== 0) return byAddr;
        const fa = normalizeTextForCompare(
          `${a.address ?? ''} ${a.zipCode ?? ''}`
        );
        const fb = normalizeTextForCompare(
          `${b.address ?? ''} ${b.zipCode ?? ''}`
        );
        return collator.compare(fa, fb);
      }
      return 0;
    });

    if (!sortedObjs.length) {
      resultEl.innerHTML =
        '<div style="padding:10px;text-align:center;color:#ef4444">Nenhum objeto retornado para este filtro.</div>';
      resolve();
      return;
    }

    let html = buildTableHeader(sortedObjs.length, mode);

    const objsToFetch: string[] = [];
    for (const o of sortedObjs) {
      const sroData = store.sroIntranetCache[o.trackingCode ?? ''];
      const sroVal = sroData?.sit ?? null;
      if (!sroVal && o.trackingCode && mode !== '2')
        objsToFetch.push(o.trackingCode);
      html += buildTableRow(o, mode, sroVal, SROINTRANET_ORIGIN);
    }

    html += '</tbody></table>';
    resultEl.innerHTML = html;

    if (!objsToFetch.length) {
      resolve();
      return;
    }

    const renderId = Symbol();
    store.archiveRenderId = renderId;
    const cacheId = store.sroIntranetCacheId;
    const prog = document.getElementById(LOEC_DOM_IDS.ARCHIVE_SRO_PROGRESS);
    if (prog) prog.style.display = 'block';

    batchFetchSroIntranet({
      fetchFn: fetchProxy,
      objects: objsToFetch,
      existingCache: store.sroIntranetCache,
      renderId,
      getRenderId: () => store.archiveRenderId,
      concurrency: RUNTIME_DEFAULTS.LIMITS.SRO_BATCH_CONCURRENCY,
      onBatchDone: (resolved, done, total) => {
        if (
          store.archiveRenderId !== renderId ||
          store.sroIntranetCacheId !== cacheId
        )
          return;
        store.sroIntranetCache = mergeSroCache(
          store.sroIntranetCache,
          resolved
        );
        for (const [obj, entry] of Object.entries(resolved)) {
          const td = document.getElementById(`sro-st-${obj}`);
          if (td)
            td.innerHTML = `<span style="color:${getSroStatusColor(entry.sit)};font-weight:bold;font-size:10px;text-transform:uppercase">${entry.sit}</span>`;
        }

        refreshSroMasterFilters(store);

        const filters = getArchiveFilters();
        const ignoreList = filters.sroIgnoreText
          ? filters.sroIgnoreText
              .split(',')
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean)
          : [];

        for (const [obj, entry] of Object.entries(resolved)) {
          const tr = document.getElementById(`arq-row-${obj}`);
          if (tr) {
            let hide = false;
            if (filters.sroExcludes.includes(entry.sit.toUpperCase()))
              hide = true;
            if (!hide && ignoreList.length > 0) {
              const lower = entry.sit.toLowerCase();
              for (const ig of ignoreList) if (lower.includes(ig)) hide = true;
            }
            if (hide) tr.style.display = 'none';
          }
        }

        if (prog)
          prog.innerText = `Sincronizando SRO Intranet... ${done}/${total}`;
      },
      onComplete: () => {
        if (store.archiveRenderId !== renderId) {
          resolve();
          return;
        }
        if (prog) {
          prog.innerText = 'Sincronizado';
          setTimeout(() => {
            if (prog && store.archiveRenderId === renderId)
              prog.style.display = 'none';
          }, 3000);
        }
        resolve();
      }
    });
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
    <span id="${LOEC_DOM_IDS.ARCHIVE_SRO_PROGRESS}" style="font-size:11px;color:#10b981;font-weight:600;display:none">Sincronizando SRO Intranet...</span>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left">
  <thead><tr style="color:#64748b">${modeHeaders[mode] ?? modeHeaders['3']}</tr></thead><tbody>`;
}

function buildTableRow(
  o: DeliveryObject,
  mode: string,
  sroVal: string | null,
  baseUrl: string
): string {
  const sroDisplay = sroVal
    ? `<span style="color:${getSroStatusColor(sroVal)};font-weight:bold;font-size:10px;text-transform:uppercase">${sroVal}</span>`
    : `<span style="color:#94a3b8;font-size:10px">Buscando...</span>`;

  const objLink = o.trackingCode
    ? `<a href="${baseUrl}/rastreamento?objetos=${o.trackingCode}" target="_blank" style="text-decoration:none;color:${o.color ?? 'inherit'}">${o.trackingCode}</a>`
    : '--';

  let cells = `<td style="padding:8px;font-weight:bold;width:80px">${o.district}</td>`;
  if (mode === '1') {
    cells += `<td style="padding:8px;color:${o.color ?? 'inherit'};font-weight:bold">${objLink}</td><td style="padding:8px" id="sro-st-${o.trackingCode}">${sroDisplay}</td>`;
  } else if (mode === '2') {
    cells += `<td style="padding:8px;color:#475569">${o.address ?? ''} - ${o.zipCode ?? ''}</td>`;
  } else {
    cells += `<td style="padding:8px;color:${o.color ?? 'inherit'};font-weight:bold;width:140px">${objLink}</td>
      <td style="padding:8px;color:#475569">
        <div style="margin-bottom:4px">${o.address ?? ''} - ${o.zipCode ?? ''}</div>
        <div style="font-size:11px;color:#94a3b8">Max. Entrega: ${o.maxDeliveryDate?.replace('T', ' ') ?? ''}</div>
      </td>
      <td style="padding:8px;width:160px" id="sro-st-${o.trackingCode}">${sroDisplay}</td>`;
  }

  return `<tr style="border-bottom:1px solid #f1f5f9">${cells}</tr>`;
}
