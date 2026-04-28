import { parseNumber } from '../../../shared/utils/format.js';
import type { DistrictData, LoecStore } from '../state.js';
import { buildSummaryCards } from './summary-cards.js';
import { renderCharts, ensureChartJs } from './charts.js';
import { renderDistrictGrid } from './district-grid.js';
import { openDistrictModal } from '../modal/district-modal.js';
import {
  fetchObjectsByCategory,
  getArchiveFilters
} from '../actions/fetch-objects.js';
import { renderArqTable } from '../actions/table-renderer.js';
import {
  refreshSroMasterFilters,
  populateFilterDropdowns
} from '../actions/filters.js';
import {
  triggerCopyToClipboard,
  triggerSaveTxt,
  printReport
} from '../actions/export.js';

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

  const containerId = 'loec-pro-dashboard';
  document.getElementById(containerId)?.remove();

  const refNode = document.querySelector<HTMLElement>('.botoes');
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
      <div style="position:relative;height:calc(100% - 35px);width:100%"><canvas id="chartjs-status"></canvas></div>
    </div>
    <div style="flex:2;min-width:400px;background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);position:relative;height:320px">
      <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155">Top 10 Distritos (Volume)</h4>
      <div style="position:relative;height:calc(100% - 35px);width:100%"><canvas id="chartjs-volume"></canvas></div>
    </div>
  </div>
  <div style="margin-top:24px">
    <h4 style="margin:0 0 16px 0;font-size:16px;color:#334155">Detalhamento por Distrito (Clique para ver o relatório completo de entregas)</h4>
    <div id="ct-dist-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px"></div>
  </div>
  <div style="margin-top:24px;background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155">Ações Rápidas (Listar Objetos)</h4>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <button id="btn-arq-hoje" style="flex:1;min-width:120px;padding:8px 16px;background:#f97316;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">Vencem Hoje</button>
      <button id="btn-arq-vencidos" style="flex:1;min-width:120px;padding:8px 16px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">Vencidos</button>
      <button id="btn-arq-avencer" style="flex:1;min-width:120px;padding:8px 16px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">A Vencer</button>
    </div>
    <div id="ct-arq-export" style="margin-top:16px;display:none;border-top:1px solid #e2e8f0;padding-top:16px">
      <h4 style="margin:0 0 12px 0;font-size:13px;color:#475569">Filtros e Exportação:</h4>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:16px">
        <select id="ct-arq-grade-filter" style="flex:1;min-width:130px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px"><option value="">Todas as Grades</option></select>
        <select id="ct-arq-side-filter" style="flex:1;min-width:130px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px"><option value="">Todos os Lados</option></select>
        <select id="ct-arq-dist-filter" style="flex:1;min-width:130px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px"><option value="">Todos os Distritos</option></select>
        <select id="ct-arq-export-mode" style="flex:1;min-width:180px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px">
          <option value="3" selected>📦 Objetos e Endereços</option>
          <option value="1">📋 Apenas Objetos</option>
          <option value="2">📍 Apenas Endereços</option>
        </select>
        <button id="ct-arq-btn-reload-sro" style="flex:1;min-width:150px;padding:8px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">↻ Recarregar SRO</button>
        <div style="display:flex;gap:8px;flex:1;min-width:100%;flex-wrap:wrap;margin-top:4px;">
          <button id="ct-arq-btn-print" style="white-space:normal;flex:1;min-width:140px;padding:8px 12px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">🖨️ Imprimir</button>
          <button id="ct-arq-btn-copy" style="white-space:normal;flex:1;min-width:140px;padding:8px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">📋 Copiar Conteúdo</button>
          <button id="ct-arq-btn-txt" style="white-space:normal;flex:1;min-width:140px;padding:8px 12px;background:#334155;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px">📥 Salvar TXT</button>
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:16px;border-top:1px dashed #cbd5e1;padding-top:12px">
        <div style="flex:2;min-width:250px;position:relative" id="ct-arq-sro-dropdown-container">
          <label style="display:block;font-size:11px;color:#64748b;font-weight:bold;margin-bottom:4px;text-transform:uppercase">Filtro SRO (Excluir Situações):</label>
          <div id="ct-arq-sro-multi-select" style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;background:#f8fafc;cursor:pointer;user-select:none;color:#475569;display:flex;justify-content:space-between;align-items:center">
            <span id="ct-arq-sro-multi-select-label">Carregando situações...</span><span style="font-size:10px">▼</span>
          </div>
          <div id="ct-arq-sro-multi-list" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #cbd5e1;box-shadow:0 4px 6px rgba(0,0,0,.1);border-radius:6px;z-index:99;max-height:200px;overflow-y:auto;margin-top:4px;padding:8px"></div>
        </div>
        <div style="flex:1;min-width:200px">
          <label style="display:block;font-size:11px;color:#64748b;font-weight:bold;margin-bottom:4px;text-transform:uppercase">Ignorar Texto SRO (Regex simples / vírgula):</label>
          <input type="text" id="ct-arq-sro-ignore-text" placeholder="Ex: ausente, entregue" style="width:100%;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;outline:none;box-sizing:border-box">
        </div>
      </div>
    </div>
    <div id="ct-arq-result" style="margin-top:16px;display:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;max-height:400px;overflow-y:auto"></div>
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

  const grid = document.getElementById('ct-dist-grid')!;
  renderDistrictGrid(
    grid,
    sorted,
    document.getElementById('ct-mon-modal')!,
    store,
    fetchProxy,
    (d) => openDistrictModal(d, store, fetchProxy)
  );

  const arqFetch = async (
    cat: 'today' | 'overdue' | 'dueSoon',
    label: string
  ) => {
    const btnId =
      cat === 'today' ? 'hoje' : cat === 'overdue' ? 'vencidos' : 'avencer';
    const btn = document.getElementById(
      `btn-arq-${btnId}`
    ) as HTMLButtonElement;
    const oldText = btn.innerText;
    btn.innerText = 'Buscando...';
    btn.disabled = true;
    store.archiveLastData = null;
    const currentFetchId = Symbol();
    (window as any).lastArqFetchId = currentFetchId;

    const resultEl = document.getElementById('ct-arq-result')!;
    const exportEl = document.getElementById('ct-arq-export')!;
    resultEl.style.display = 'block';
    exportEl.style.display = 'none';
    resultEl.innerHTML =
      '<div style="text-align:center;padding:20px;color:#3b82f6;font-weight:bold">⏳ Inicializando busca...<br><div style="font-size:12px;color:#64748b;margin-top:8px" id="ct-arq-progress">0 / 0 distritos consultados</div></div>';

    const objs = await fetchObjectsByCategory(
      cat,
      sorted,
      store,
      fetchProxy,
      (done, total, success, failed) => {
        const p = document.getElementById('ct-arq-progress');
        if (p)
          p.innerHTML = `Consultando: ${done} / ${total} distritos concluídos <br><span style="color:#10b981">Sucesso: ${success}</span> | <span style="color:#ef4444">Falha: ${failed}</span>`;
      }
    );

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
    .getElementById('btn-arq-hoje')!
    .addEventListener('click', () => arqFetch('today', 'VENCEM HOJE'));
  document
    .getElementById('btn-arq-vencidos')!
    .addEventListener('click', () => arqFetch('overdue', 'VENCIDOS'));
  document
    .getElementById('btn-arq-avencer')!
    .addEventListener('click', () => arqFetch('dueSoon', 'A VENCER'));

  document
    .getElementById('ct-arq-export-mode')!
    .addEventListener('change', () => renderArqTable(store, fetchProxy));

  (window as any).renderArqTable = renderArqTable;

  document
    .getElementById('ct-arq-dist-filter')!
    .addEventListener('change', () => {
      refreshSroMasterFilters(store, true);
      renderArqTable(store, fetchProxy);
    });
  document
    .getElementById('ct-arq-grade-filter')!
    .addEventListener('change', () => {
      refreshSroMasterFilters(store, true);
      renderArqTable(store, fetchProxy);
    });
  document
    .getElementById('ct-arq-side-filter')!
    .addEventListener('change', () => {
      refreshSroMasterFilters(store, true);
      renderArqTable(store, fetchProxy);
    });
  document
    .getElementById('ct-arq-sro-ignore-text')!
    .addEventListener('input', () => renderArqTable(store, fetchProxy));
  document
    .getElementById('ct-arq-sro-multi-select')!
    .addEventListener('click', () => {
      const list = document.getElementById('ct-arq-sro-multi-list')!;
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });

  window.addEventListener('loec-sro-filter-changed', () => {
    renderArqTable(store, fetchProxy);
  });

  document.addEventListener('click', (e) => {
    const c = document.getElementById('ct-arq-sro-dropdown-container');
    if (c && !c.contains(e.target as Node)) {
      const l = document.getElementById('ct-arq-sro-multi-list');
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
