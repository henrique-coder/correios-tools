import {
  LOEC_DOM_IDS,
  LOEC_DOM_SELECTORS
} from '../../../shared/constants/dom-elements.js';
import { parseNumber } from '../../../shared/utils/format.js';
import {
  printReport,
  triggerCopyToClipboard,
  triggerSaveTxt
} from '../actions/export.js';
import { fetchObjectsByCategory } from '../actions/fetch-objects.js';
import {
  populateFilterDropdowns,
  refreshSroMasterFilters
} from '../actions/filters.js';
import { renderArqTable } from '../actions/table-renderer.js';
import { openDistrictModal } from '../modal/district-modal.js';
import type { DistrictData, LoecStore } from '../state.js';
import { ensureChartJs, renderCharts } from './charts.js';
import { renderDistrictGrid } from './district-grid.js';
import { buildSummaryCards } from './summary-cards.js';

export async function renderDashboard(
  data: DistrictData[],
  store: LoecStore,
  fetchProxy: (url: string) => Promise<string>
): Promise<void> {
  if (!data.length) return;
  await ensureChartJs();

  const sorted = [...data].sort((a, b) => {
    const na = parseInt(a.correios_numeroDistrito as string, 10) || 0;
    const nb = parseInt(b.correios_numeroDistrito as string, 10) || 0;
    if (na !== nb) return na - nb;
    const la = (a.correios_numeroDistrito ?? '').replace(/[0-9\s]/g, '').trim();
    const lb = (b.correios_numeroDistrito ?? '').replace(/[0-9\s]/g, '').trim();
    if (la === 'N' && lb !== 'N') return -1;
    if (lb === 'N' && la !== 'N') return 1;
    return la.localeCompare(lb);
  });

  const topTen = [...sorted]
    .sort((a, b) => parseNumber(b.correios_qtde) - parseNumber(a.correios_qtde))
    .slice(0, 10);
  const {
    totalVencidos,
    totalToday,
    totalDueSoon,
    html: cardsHtml
  } = buildSummaryCards(sorted);

  const containerId = LOEC_DOM_IDS.DASHBOARD_CONTAINER;
  document.getElementById(containerId)?.remove();

  const refNode = document.querySelector<HTMLElement>(
    LOEC_DOM_SELECTORS.BUTTONS_CONTAINER
  );
  if (!refNode) return;
  refNode.style.marginTop = '25px';

  const container = document.createElement('div');
  container.id = containerId;
  container.style.cssText =
    'width:100%;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:20px;margin-bottom:25px;clear:both;display:block;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif';
  container.innerHTML = `${cardsHtml}
  <div style="display:flex;flex-wrap:wrap;gap:16px">
    <div style="flex:1;min-width:300px;background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);position:relative;height:320px">
      <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155">Distribuição de Status</h4>
      <div style="position:relative;height:calc(100% - 35px);width:100%"><canvas id="${LOEC_DOM_IDS.CHART_STATUS}"></canvas></div>
    </div>
    <div style="flex:2;min-width:400px;background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);position:relative;height:320px">
      <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155">Top 10 Distritos (Volume)</h4>
      <div style="position:relative;height:calc(100% - 35px);width:100%"><canvas id="${LOEC_DOM_IDS.CHART_VOLUME}"></canvas></div>
    </div>
  </div>
  <div style="margin-top:24px">
    <h4 style="margin:0 0 16px 0;font-size:16px;color:#334155">Detalhamento por Distrito (Clique para ver o relatório completo de entregas)</h4>
    <div id="${LOEC_DOM_IDS.DISTRICT_GRID}" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px"></div>
  </div>
  <div style="margin-top:24px;background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155">Ações Rápidas (Listar Objetos)</h4>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <button id="${LOEC_DOM_IDS.ARCHIVE_BUTTON_TODAY}" style="flex:1;min-width:120px;padding:8px 16px;background:#f97316;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">Vencem Hoje</button>
      <button id="${LOEC_DOM_IDS.ARCHIVE_BUTTON_OVERDUE}" style="flex:1;min-width:120px;padding:8px 16px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">Vencidos</button>
      <button id="${LOEC_DOM_IDS.ARCHIVE_BUTTON_DUE_SOON}" style="flex:1;min-width:120px;padding:8px 16px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">A Vencer</button>
    </div>
    <div id="${LOEC_DOM_IDS.ARCHIVE_EXPORT}" style="margin-top:16px;display:none;border-top:1px solid #e2e8f0;padding-top:16px">
      <h4 style="margin:0 0 12px 0;font-size:13px;color:#475569">Filtros e Exportação:</h4>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:16px">
        <select id="${LOEC_DOM_IDS.ARCHIVE_GRADE_FILTER}" style="flex:1;min-width:130px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px"><option value="">Todas as Grades</option></select>
        <select id="${LOEC_DOM_IDS.ARCHIVE_SIDE_FILTER}" style="flex:1;min-width:130px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px"><option value="">Todos os Lados</option></select>
        <select id="${LOEC_DOM_IDS.ARCHIVE_DIST_FILTER}" style="flex:1;min-width:130px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px"><option value="">Todos os Distritos</option></select>
        <select id="${LOEC_DOM_IDS.ARCHIVE_EXPORT_MODE}" style="flex:1;min-width:180px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px">
          <option value="3" selected>📦 Objetos e Endereços</option>
          <option value="1">📋 Apenas Objetos</option>
          <option value="2">📍 Apenas Endereços</option>
        </select>
        <button id="${LOEC_DOM_IDS.ARCHIVE_BTN_RELOAD_SRO}" style="flex:1;min-width:150px;padding:8px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">↻ Recarregar SRO</button>
        <div style="display:flex;gap:8px;flex:1;min-width:100%;flex-wrap:wrap;margin-top:4px;">
          <button id="${LOEC_DOM_IDS.ARCHIVE_BTN_PRINT}" style="white-space:normal;flex:1;min-width:140px;padding:8px 12px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">🖨️ Imprimir</button>
          <button id="${LOEC_DOM_IDS.ARCHIVE_BTN_COPY}" style="white-space:normal;flex:1;min-width:140px;padding:8px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">📋 Copiar Conteúdo</button>
          <button id="${LOEC_DOM_IDS.ARCHIVE_BTN_TXT}" style="white-space:normal;flex:1;min-width:140px;padding:8px 12px;background:#334155;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">📥 Salvar TXT</button>
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:16px;border-top:1px dashed #cbd5e1;padding-top:12px">
        <div style="flex:2;min-width:250px;position:relative" id="${LOEC_DOM_IDS.ARCHIVE_SRO_DROPDOWN_CONTAINER}">
          <label style="display:block;font-size:11px;color:#64748b;font-weight:bold;margin-bottom:4px;text-transform:uppercase">Filtro SRO (Excluir Situações):</label>
          <div id="${LOEC_DOM_IDS.ARCHIVE_SRO_MULTI_SELECT}" style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;background:#f8fafc;cursor:pointer;user-select:none;color:#475569;display:flex;justify-content:space-between;align-items:center">
            <span id="${LOEC_DOM_IDS.ARCHIVE_SRO_MULTI_SELECT_LABEL}">Carregando situações...</span><span style="font-size:10px">▼</span>
          </div>
          <div id="${LOEC_DOM_IDS.ARCHIVE_SRO_MULTI_LIST}" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #cbd5e1;box-shadow:0 4px 6px rgba(0,0,0,.1);border-radius:6px;z-index:99;max-height:200px;overflow-y:auto;margin-top:4px;padding:8px"></div>
        </div>
        <div style="flex:1;min-width:200px">
          <label style="display:block;font-size:11px;color:#64748b;font-weight:bold;margin-bottom:4px;text-transform:uppercase">Ignorar Texto SRO (Regex simples / vírgula):</label>
          <input type="text" id="${LOEC_DOM_IDS.ARCHIVE_SRO_IGNORE_TEXT}" placeholder="Ex: ausente, entregue" style="width:100%;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;outline:none;box-sizing:border-box">
        </div>
      </div>
    </div>
    <div id="${LOEC_DOM_IDS.ARCHIVE_RESULT}" style="margin-top:16px;display:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;max-height:400px;overflow-y:auto"></div>
  </div>`;

  refNode.parentNode!.insertBefore(container, refNode);

  renderCharts(
    totalVencidos,
    totalToday,
    totalDueSoon,
    topTen.map((d) => ({
      districtNumber: d.correios_numeroDistrito,
      quantity: parseNumber(d.correios_qtde)
    }))
  );

  const grid = document.getElementById(LOEC_DOM_IDS.DISTRICT_GRID)!;
  renderDistrictGrid(
    grid,
    sorted,
    document.getElementById(LOEC_DOM_IDS.MONITOR_MODAL)!,
    store,
    fetchProxy,
    (d) => openDistrictModal(d, store, fetchProxy)
  );

  const arqFetch = async (
    cat: 'today' | 'overdue' | 'dueSoon',
    label: string
  ) => {
    const btnId =
      cat === 'today'
        ? LOEC_DOM_IDS.ARCHIVE_BUTTON_TODAY
        : cat === 'overdue'
          ? LOEC_DOM_IDS.ARCHIVE_BUTTON_OVERDUE
          : LOEC_DOM_IDS.ARCHIVE_BUTTON_DUE_SOON;
    const btn = document.getElementById(btnId) as HTMLButtonElement;
    const oldText = btn.innerText;
    btn.innerText = 'Buscando...';
    btn.disabled = true;
    store.archiveLastData = null;
    const currentFetchId = Symbol();
    (window as any).lastArqFetchId = currentFetchId;

    const resultEl = document.getElementById(LOEC_DOM_IDS.ARCHIVE_RESULT)!;
    const exportEl = document.getElementById(LOEC_DOM_IDS.ARCHIVE_EXPORT)!;
    resultEl.style.display = 'block';
    exportEl.style.display = 'none';
    resultEl.innerHTML = `<div style="text-align:center;padding:20px;color:#3b82f6;font-weight:bold">⏳ Inicializando busca...<br><div style="font-size:12px;color:#64748b;margin-top:8px" id="${LOEC_DOM_IDS.ARCHIVE_PROGRESS}">0 / 0 distritos consultados</div></div>`;

    let lastErrorLabel = '';
    let lastProgress = { done: 0, total: 0, success: 0, failed: 0 };

    const formatErrorLabel = (districtId: string, reason: string) => {
      const district = districtId
        ? `Distrito ${districtId}`
        : 'Distrito desconhecido';
      const reasonLabel =
        reason === 'timeout' ? 'tempo limite na consulta' : 'falha na consulta';
      return `Última falha: ${district} (${reasonLabel})`;
    };

    const renderProgress = () => {
      const p = document.getElementById(LOEC_DOM_IDS.ARCHIVE_PROGRESS);
      if (!p) return;
      const extra = lastErrorLabel
        ? `<br><span style="color:#ef4444">${lastErrorLabel}</span>`
        : '';
      p.innerHTML = `Consultando: ${lastProgress.done} / ${lastProgress.total} distritos concluídos <br><span style="color:#10b981">Sucesso: ${lastProgress.success}</span> | <span style="color:#ef4444">Falha: ${lastProgress.failed}</span>${extra}`;
    };

    const objs = await fetchObjectsByCategory(
      cat,
      sorted,
      store,
      fetchProxy,
      (done, total, success, failed) => {
        lastProgress = { done, total, success, failed };
        renderProgress();
      },
      (info) => {
        lastErrorLabel = formatErrorLabel(info.districtId, info.reason);
        renderProgress();
      },
      () => (window as any).lastArqFetchId !== currentFetchId
    );

    if ((window as any).lastArqFetchId !== currentFetchId) return;

    if (!objs.length) {
      resultEl.innerHTML =
        '<div style="padding:10px;text-align:center;color:#ef4444">Nenhum objeto encontrado na categoria especificada!</div>';
      btn.innerText = oldText;
      btn.disabled = false;
    } else {
      store.archiveLastData = { cat: label, objs };
      exportEl.style.display = 'block';
      populateFilterDropdowns(store);
      refreshSroMasterFilters(store);
      await renderArqTable(store, fetchProxy);

      if ((window as any).lastArqFetchId !== currentFetchId) return;

      let left = 10;
      btn.innerText = `Aguarde ${left}s`;
      const iv = setInterval(() => {
        if ((window as any).lastArqFetchId !== currentFetchId) {
          clearInterval(iv);
          return;
        }
        left--;
        if (left <= 0) {
          clearInterval(iv);
          btn.innerText = oldText;
          btn.disabled = false;
        } else {
          btn.innerText = `Aguarde ${left}s`;
        }
      }, 1000);
    }
  };

  document
    .getElementById(LOEC_DOM_IDS.ARCHIVE_BUTTON_TODAY)!
    .addEventListener('click', () => arqFetch('today', 'VENCEM HOJE'));
  document
    .getElementById(LOEC_DOM_IDS.ARCHIVE_BUTTON_OVERDUE)!
    .addEventListener('click', () => arqFetch('overdue', 'VENCIDOS'));
  document
    .getElementById(LOEC_DOM_IDS.ARCHIVE_BUTTON_DUE_SOON)!
    .addEventListener('click', () => arqFetch('dueSoon', 'A VENCER'));

  document
    .getElementById(LOEC_DOM_IDS.ARCHIVE_EXPORT_MODE)!
    .addEventListener('change', () => renderArqTable(store, fetchProxy));

  (window as any).renderArqTable = renderArqTable;

  document
    .getElementById(LOEC_DOM_IDS.ARCHIVE_DIST_FILTER)!
    .addEventListener('change', () => {
      refreshSroMasterFilters(store, true);
      renderArqTable(store, fetchProxy);
    });
  document
    .getElementById(LOEC_DOM_IDS.ARCHIVE_GRADE_FILTER)!
    .addEventListener('change', () => {
      refreshSroMasterFilters(store, true);
      renderArqTable(store, fetchProxy);
    });
  document
    .getElementById(LOEC_DOM_IDS.ARCHIVE_SIDE_FILTER)!
    .addEventListener('change', () => {
      refreshSroMasterFilters(store, true);
      renderArqTable(store, fetchProxy);
    });
  document
    .getElementById(LOEC_DOM_IDS.ARCHIVE_SRO_IGNORE_TEXT)!
    .addEventListener('input', () => renderArqTable(store, fetchProxy));
  document
    .getElementById(LOEC_DOM_IDS.ARCHIVE_SRO_MULTI_SELECT)!
    .addEventListener('click', () => {
      const list = document.getElementById(
        LOEC_DOM_IDS.ARCHIVE_SRO_MULTI_LIST
      )!;
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });

  window.addEventListener('loec-sro-filter-changed', () => {
    renderArqTable(store, fetchProxy);
  });

  document.addEventListener('click', (e) => {
    const c = document.getElementById(
      LOEC_DOM_IDS.ARCHIVE_SRO_DROPDOWN_CONTAINER
    );
    if (c && !c.contains(e.target as Node)) {
      const l = document.getElementById(LOEC_DOM_IDS.ARCHIVE_SRO_MULTI_LIST);
      if (l) l.style.display = 'none';
    }
  });
  document
    .getElementById('ct-arq-btn-reload-sro')!
    .addEventListener('click', () => {
      store.sroIntranetCache = {};
      store.sroIntranetCacheId = Date.now();
      refreshSroMasterFilters(store);
      renderArqTable(store, fetchProxy);
    });
  document
    .getElementById('ct-arq-btn-copy')!
    .addEventListener('click', () => triggerCopyToClipboard(store));
  document
    .getElementById('ct-arq-btn-txt')!
    .addEventListener('click', () => triggerSaveTxt(store));
  document
    .getElementById('ct-arq-btn-print')!
    .addEventListener('click', () => printReport(store));
}
