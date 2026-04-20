function runLoecSuspensaRuntime(core) {
  const { __cwStore, fetchMonitor } = core;
  const URLS = core.DEFAULTS?.URLS || {
    SROWEB_ORIGIN: 'https://sroweb.correios.com.br',
    SROINTRANET_ORIGIN: 'https://srointranet.correios.com.br',
    SROMONITOR_ORIGIN: 'https://sromonitor.correios.com.br'
  };

  const PN = (v) =>
    typeof v === 'number'
      ? v
      : v
        ? parseInt(v.toString().replace(/<[^>]*>/g, ''), 10) || 0
        : 0;

  async function getLoecObjectsByLancamento(idLancamento) {
    const key = (idLancamento || '').toString();
    if (!key) return [];

    const cached = __cwStore.loecObjectCache[key];
    if (Array.isArray(cached)) return cached;

    const t = await fetchMonitor(
      `${URLS.SROWEB_ORIGIN}/app/entregaexternaautomatica/loecsuspensa/controllers/objetoController.php?acao=listar&idLancamento=${idLancamento}`
    );
    const arr = JSON.parse(t);
    const safeArr = Array.isArray(arr) ? arr : [];

    __cwStore.loecObjectCache[key] = safeArr;

    if (Object.keys(__cwStore.loecObjectCache).length > 300) {
      __cwStore.loecObjectCache = {};
    }

    return safeArr;
  }

  async function RCD(data) {
    if (!Array.isArray(data) || data.length === 0) return;

    if (!window['Chart']) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/chart.js@4/dist/chart.umd.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    let mod = document.getElementById('ct-mon-modal');
    if (!mod) {
      mod = document.createElement('div');
      mod.id = 'ct-mon-modal';
      mod.style.cssText =
        'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);z-index:9999999;display:none;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
      document.body.appendChild(mod);
    }

    let totalObjs = 0,
      totalPts = 0,
      totalVencidos = 0,
      totalHoje = 0,
      totalAVencer = 0,
      totalARs = 0;
    const distritosList = [];

    data.forEach((item, idx) => {
      const qtde = PN(item.qtde);
      const qtdePontos = PN(item.qtdePontos);
      const qtdeVencido = PN(item.qtdeVencido);
      const qtdeHoje = PN(item.qtdeHoje);
      const qtdeAVencer = PN(item.qtdeAVencer);
      const qtdeAR = PN(item.qtdeAR);

      totalObjs += qtde;
      totalPts += qtdePontos;
      totalVencidos += qtdeVencido;
      totalHoje += qtdeHoje;
      totalAVencer += qtdeAVencer;
      totalARs += qtdeAR;

      distritosList.push({ ...item, qtde, _origIndex: idx });
    });

    distritosList.sort((a, b) => {
      const numA = parseInt(a.numeroDistrito, 10) || 0;
      const numB = parseInt(b.numeroDistrito, 10) || 0;
      if (numA !== numB) return numA - numB;
      const letA = (a.numeroDistrito || '').replace(/[0-9\s]/g, '').trim();
      const letB = (b.numeroDistrito || '').replace(/[0-9\s]/g, '').trim();
      if (letA === 'N' && letB !== 'N') return -1;
      if (letB === 'N' && letA !== 'N') return 1;
      return letA.localeCompare(letB);
    });

    const topDistritos = [...distritosList]
      .sort((a, b) => b.qtde - a.qtde)
      .slice(0, 10);
    const containerId = 'loec-pro-dashboard';
    let container = document.getElementById(containerId);

    if (container) container.remove();

    const refNode = document.querySelector('.botoes');
    if (!refNode) return;
    refNode.style.marginTop = '25px';

    container = document.createElement('div');
    container.id = containerId;
    container.style.cssText =
      'width:100%;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:20px;margin-bottom:25px;clear:both;display:block;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;';
    container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px;">
          <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #3b82f6;">
            <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">Carga Total</div>
            <div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1;">${totalObjs} <span style="font-size:14px;color:#64748b;font-weight:500;">objs</span></div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px;">📍 ${totalPts} pontos | 📝 ${totalARs} ARs</div>
          </div>
          <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #ef4444;">
            <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">Vencidos</div>
            <div style="font-size:28px;font-weight:800;color:#ef4444;line-height:1;">${totalVencidos}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px;">Prioridade Máxima</div>
          </div>
          <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #f97316;">
            <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">Vencem Hoje</div>
            <div style="font-size:28px;font-weight:800;color:#f97316;line-height:1;">${totalHoje}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px;">SLA Diário</div>
          </div>
          <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #10b981;">
            <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">A Vencer</div>
            <div style="font-size:28px;font-weight:800;color:#10b981;line-height:1;">${totalAVencer}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px;">Fluxo Controlado</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:16px;">
          <div style="flex:1;min-width:300px;background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);position:relative;height:320px;">
            <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155;">Distribuição de Status</h4>
            <div style="position:relative;height:calc(100% - 35px);width:100%;"><canvas id="chartjs-status"></canvas></div>
          </div>
          <div style="flex:2;min-width:400px;background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);position:relative;height:320px;">
            <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155;">Top 10 Distritos (Volume)</h4>
            <div style="position:relative;height:calc(100% - 35px);width:100%;"><canvas id="chartjs-volume"></canvas></div>
          </div>
        </div>
        <div style="margin-top:24px;">
          <h4 style="margin:0 0 16px 0;font-size:16px;color:#334155;">Detalhamento por Distrito (Clique para ver o relatório completo de entregas)</h4>
          <div id="ct-dist-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;"></div>
        </div>
        <div style="margin-top:24px;background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155;">Ações Rápidas (Listar Objetos)</h4>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button id="btn-arq-hoje" style="flex:1;padding:8px 16px;background:#f97316;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">Vencem Hoje</button>
            <button id="btn-arq-vencidos" style="flex:1;padding:8px 16px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">Vencidos</button>
            <button id="btn-arq-avencer" style="flex:1;padding:8px 16px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">A Vencer</button>
          </div>
          <div id="ct-arq-export" style="margin-top:16px;display:none;border-top:1px solid #e2e8f0;padding-top:16px;">
            <h4 style="margin:0 0 12px 0;font-size:13px;color:#475569;">Filtros e Exportação:</h4>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px;">
              <select id="ct-arq-grade-filter" style="flex:1;min-width:100px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:13px;outline:none;">
                <option value="">Todas as Grades</option>
              </select>
              <select id="ct-arq-side-filter" style="flex:1;min-width:100px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:13px;outline:none;">
                <option value="">Todos os Lados</option>
              </select>
              <select id="ct-arq-dist-filter" style="flex:1;min-width:120px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:13px;outline:none;">
                <option value="">Todos os Distritos</option>
              </select>
              <select id="ct-arq-export-mode" style="flex:1;min-width:150px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:13px;outline:none;">
                <option value="3" selected>📦 Objetos e Endereços</option>
                <option value="1">📋 Apenas Objetos</option>
                <option value="2">📍 Apenas Endereços</option>
              </select>
              <button id="ct-arq-btn-reload-sro" style="flex:1;min-width:max-content;padding:8px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;transition:0.2s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">↻ Recarregar SRO</button>
              <div style="display:flex;gap:8px;flex:1;min-width:max-content;flex-wrap:nowrap;">
                <button id="ct-arq-btn-print" style="white-space:nowrap;flex:1;min-width:max-content;padding:8px 12px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;transition:0.2s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">🖨️ Imprimir</button>
                <button id="ct-arq-btn-copy" style="white-space:nowrap;flex:1;min-width:max-content;padding:8px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;transition:0.2s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">📋 Copiar Conteúdo</button>
                <button id="ct-arq-btn-txt" style="white-space:nowrap;flex:1;min-width:max-content;padding:8px 12px;background:#334155;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;transition:0.2s;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#334155'">📥 Salvar TXT</button>
              </div>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:16px;border-top:1px dashed #cbd5e1;padding-top:12px;">
              <div style="flex:2;min-width:250px;position:relative;" id="ct-arq-sro-dropdown-container">
                <label style="display:block;font-size:11px;color:#64748b;font-weight:bold;margin-bottom:4px;text-transform:uppercase;">Filtro SRO (Excluir Situações):</label>
                <div id="ct-arq-sro-multi-select" style="padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;background:#f8fafc;cursor:pointer;user-select:none;color:#475569;display:flex;justify-content:space-between;align-items:center;">
                  <span id="ct-arq-sro-multi-select-label">Carregando situações...</span>
                  <span style="font-size:10px;">▼</span>
                </div>
                <div id="ct-arq-sro-multi-list" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #cbd5e1;box-shadow:0 4px 6px rgba(0,0,0,0.1);border-radius:6px;z-index:99;max-height:200px;overflow-y:auto;margin-top:4px;padding:8px;"></div>
              </div>
              <div style="flex:1;min-width:200px;">
                <label style="display:block;font-size:11px;color:#64748b;font-weight:bold;margin-bottom:4px;text-transform:uppercase;">Ignorar Texto SRO (Regex simples / vírgula):</label>
                <input type="text" id="ct-arq-sro-ignore-text" placeholder="Ex: ausente, entregue" style="width:100%;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:13px;outline:none;box-sizing:border-box;">
              </div>
            </div>
          </div>
          <div id="ct-arq-result" style="margin-top:16px;display:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;max-height:400px;overflow-y:auto;">
          </div>
        </div>
      `;
    refNode.parentNode.insertBefore(container, refNode);

    const arqFetch = async (catType) => {
      const btn = document.getElementById('btn-arq-' + catType);
      const oldText = btn.innerText;
      btn.innerText = 'Buscando...';
      btn.disabled = true;

      if (document.getElementById('ct-arq-grade-filter'))
        document.getElementById('ct-arq-grade-filter').value = '';
      if (document.getElementById('ct-arq-side-filter'))
        document.getElementById('ct-arq-side-filter').value = '';
      if (document.getElementById('ct-arq-dist-filter'))
        document.getElementById('ct-arq-dist-filter').value = '';
      if (document.getElementById('ct-arq-export-mode'))
        document.getElementById('ct-arq-export-mode').value = '3';

      const EXPORT_CAT = catType.toUpperCase();
      __cwStore.ctArqLastData = null;

      const resultEl = document.getElementById('ct-arq-result');
      const exportEl = document.getElementById('ct-arq-export');
      resultEl.style.display = 'block';
      exportEl.style.display = 'none';
      resultEl.innerHTML =
        '<div style="text-align:center;padding:20px;color:#3b82f6;font-weight:bold;">⏳ Inicializando busca...<br><div style="font-size:12px;color:#64748b;margin-top:8px;" id="ct-arq-progress">0 / 0 distritos consultados</div></div>';

      const origTable = document.getElementById('tabela-rotulos');
      let targetColor = null;
      if (origTable) {
        const rows = origTable.querySelectorAll('tbody tr');
        let colIdx = catType === 'hoje' ? 4 : catType === 'vencidos' ? 3 : 5;
        for (const tr of rows) {
          const tds = tr.querySelectorAll('td');
          if (tds.length > colIdx) {
            const cell = tds[colIdx];
            const span = cell.querySelector('span') || cell;
            const valText = span.innerText || cell.innerText || '0';
            const val = parseInt(valText.replace(/[^0-9]/g, ''), 10) || 0;
            if (val > 0) {
              targetColor =
                span.style && span.style.color
                  ? span.style.color
                  : window.getComputedStyle
                    ? window.getComputedStyle(span).color
                    : null;
              break;
            }
          }
        }
      }

      const normalizeColor = (c) =>
        c ? c.toString().replace(/\s+/g, '').toLowerCase() : '';
      targetColor = normalizeColor(targetColor);

      let distsToQuery = distritosList.filter((d) => {
        if (catType === 'hoje') return PN(d.qtdeHoje) > 0;
        if (catType === 'vencidos') return PN(d.qtdeVencido) > 0;
        return PN(d.qtdeAVencer) > 0;
      });

      let allObjs = [];
      let done = 0;
      let success = 0;
      let failed = 0;
      const total = distsToQuery.length;
      const maxEntPlaceholder = document.getElementById('ct-arq-progress');

      for (const dist of distsToQuery) {
        try {
          const arr = await getLoecObjectsByLancamento(dist.idLancamento);
          success++;

          for (const obj of arr) {
            const c = normalizeColor(obj.cor);
            let match = false;
            if (targetColor && c) {
              if (c === targetColor) match = true;
              else if (
                c.includes('rgb') &&
                targetColor.includes('rgb') &&
                c.replace(/[^0-9,]/g, '') ===
                  targetColor.replace(/[^0-9,]/g, '')
              )
                match = true;
              else if (catType === 'hoje' && c.includes('196,94,24'))
                match = true;
            } else {
              if (
                catType === 'hoje' &&
                (c.includes('196,94,24') ||
                  c.includes('orange') ||
                  c.includes('#c45e18') ||
                  c.includes('#f97316'))
              )
                match = true;
              if (
                catType === 'vencidos' &&
                (c === 'red' || c.includes('#ef4444') || c.includes('255,0,0'))
              )
                match = true;
              if (
                catType === 'avencer' &&
                (c === 'green' ||
                  c.includes('#10b981') ||
                  c.includes('0,128,0'))
              )
                match = true;
            }

            if (match) {
              allObjs.push({
                dist: dist.numeroDistrito,
                mat: dist.matriculaCarteiro,
                nom: dist.nomeCarteiro,
                sro: dist.codigoSro,
                ...obj
              });
            }
          }
        } catch (e) {
          failed++;
        }
        done++;
        if (maxEntPlaceholder) {
          maxEntPlaceholder.innerHTML = `Consultando: ${done} / ${total} concluídos <br><span style="color:#10b981;">Sucesso: ${success}</span> | <span style="color:#ef4444;">Falha: ${failed}</span>`;
        }
      }

      if (allObjs.length === 0) {
        resultEl.innerHTML =
          '<div style="padding:10px;text-align:center;color:#ef4444;">Nenhum objeto encontrado na categoria especificada! Tente buscar manualmente nas listas expandidas.</div>';
        exportEl.style.display = 'none';
      } else {
        __cwStore.ctArqLastData = { cat: EXPORT_CAT, objs: allObjs };
        exportEl.style.display = 'block';

        __cwStore.parseDist = (dStr) => {
          const match = (dStr || '').match(/^(\d)(\d*)\s*([a-zA-Z]*)/i);
          if (match)
            return {
              grade: match[1],
              side: match[3] ? match[3].toUpperCase() : ''
            };
          return { grade: '', side: '' };
        };

        const distFilterEl = document.getElementById('ct-arq-dist-filter');
        const gradeFilterEl = document.getElementById('ct-arq-grade-filter');
        const sideFilterEl = document.getElementById('ct-arq-side-filter');

        const dists = [...new Set(allObjs.map((o) => o.dist))].sort();
        const grades = [
          ...new Set(
            allObjs
              .map((o) => __cwStore.parseDist(o.dist).grade)
              .filter(Boolean)
          )
        ].sort();
        const sides = [
          ...new Set(
            allObjs.map((o) => __cwStore.parseDist(o.dist).side).filter(Boolean)
          )
        ].sort();

        if (distFilterEl)
          distFilterEl.innerHTML =
            '<option value="">Todos os Distritos</option>' +
            dists.map((d) => `<option value="${d}">${d}</option>`).join('');
        if (gradeFilterEl)
          gradeFilterEl.innerHTML =
            '<option value="">Todas as Grades</option>' +
            grades
              .map((g) => `<option value="${g}">Grade ${g}</option>`)
              .join('');
        if (sideFilterEl)
          sideFilterEl.innerHTML =
            '<option value="">Todos os Lados</option>' +
            sides
              .map((s) => `<option value="${s}">Lado ${s}</option>`)
              .join('');

        exportEl.style.display = 'block';
        __cwStore.sroIntranetCache = __cwStore.sroIntranetCache || {};
        __cwStore.sroIntranetCacheId =
          __cwStore.sroIntranetCacheId || Date.now();
        refreshSroMasterFilters();
        renderArqTable();
      }

      btn.innerText = oldText;
      btn.disabled = false;
    };

    const getArqFilters = () => {
      let excludes = [];
      document.querySelectorAll('.ct-arq-sro-chk').forEach((c) => {
        if (!c.checked) excludes.push(c.value);
      });
      return {
        mode: document.getElementById('ct-arq-export-mode')?.value || '3',
        dist: document.getElementById('ct-arq-dist-filter')?.value,
        grade: document.getElementById('ct-arq-grade-filter')?.value,
        side: document.getElementById('ct-arq-side-filter')?.value,
        sroExcludes: excludes,
        sroIgnoreText:
          document.getElementById('ct-arq-sro-ignore-text')?.value || ''
      };
    };

    const getFilteredObjs = (data, filters) => {
      if (!data || !data.objs) return [];

      let ignoreList = [];
      if (filters.sroIgnoreText) {
        ignoreList = filters.sroIgnoreText
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
      }

      return data.objs.filter((o) => {
        if (filters.dist && o.dist !== filters.dist) return false;
        if (filters.grade || filters.side) {
          const parsed = __cwStore.parseDist
            ? __cwStore.parseDist(o.dist)
            : { grade: '', side: '' };
          if (filters.grade && parsed.grade !== filters.grade) return false;
          if (filters.side && parsed.side !== filters.side) return false;
        }

        if (filters.mode !== '2') {
          const sroVal = __cwStore.sroIntranetCache?.[o.objeto];
          if (sroVal && sroVal.sit) {
            const sitStr = sroVal.sit.toUpperCase();
            if (filters.sroExcludes.includes(sitStr)) return false;

            if (ignoreList.length > 0) {
              const lowerSit = sroVal.sit.toLowerCase();
              for (const ig of ignoreList) {
                if (lowerSit.includes(ig)) return false;
              }
            }
          }
        }

        return true;
      });
    };

    const refreshSroMasterFilters = (resetAll = false) => {
      const d = __cwStore.ctArqLastData;
      if (!d || !d.objs) return;

      const filters = getArqFilters();

      const preFilteredObjs = d.objs.filter((o) => {
        if (filters.dist && o.dist !== filters.dist) return false;
        if (filters.grade || filters.side) {
          const parsed = __cwStore.parseDist
            ? __cwStore.parseDist(o.dist)
            : { grade: '', side: '' };
          if (filters.grade && parsed.grade !== filters.grade) return false;
          if (filters.side && parsed.side !== filters.side) return false;
        }
        return true;
      });

      const availableSits = new Set();
      preFilteredObjs.forEach((o) => {
        const s = __cwStore.sroIntranetCache?.[o.objeto];
        if (s && s.sit) availableSits.add(s.sit.toUpperCase());
      });

      const listEl = document.getElementById('ct-arq-sro-multi-list');
      const labelEl = document.getElementById('ct-arq-sro-multi-select-label');
      if (!listEl || !labelEl) return;

      const sorted = Array.from(availableSits).sort();

      const currentUnchecked = new Set();
      if (!resetAll) {
        document.querySelectorAll('.ct-arq-sro-chk').forEach((c) => {
          if (!c.checked) currentUnchecked.add(c.value);
        });
      }

      if (sorted.length === 0) {
        labelEl.innerText = 'Carregando situações.../Nenhuma visível';
        listEl.innerHTML =
          '<div style="padding:4px 8px;font-size:12px;color:#94a3b8;">Nenhuma situação SRO carregada.</div>';
        return;
      }

      let html = '';
      sorted.forEach((sit) => {
        const isChecked = !currentUnchecked.has(sit) ? 'checked' : '';
        html += `<label style="display:flex;align-items:center;gap:6px;padding:4px 8px;cursor:pointer;font-size:12px;color:#334155;transition:0.1s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
                <input type="checkbox" class="ct-arq-sro-chk" value="${sit}" ${isChecked}>
                <span>${sit}</span>
            </label>`;
      });
      listEl.innerHTML = html;

      const updateLabel = () => {
        const boxes = document.querySelectorAll('.ct-arq-sro-chk');
        const total = boxes.length;
        const checked = Array.from(boxes).filter((b) => b.checked).length;
        if (total === 0) labelEl.innerText = 'Nenhuma situação carregada';
        else if (checked === total)
          labelEl.innerText = `Todas as ${total} situações selecionadas`;
        else
          labelEl.innerText = `${checked} de ${total} situações selecionadas`;
      };
      updateLabel();

      document.querySelectorAll('.ct-arq-sro-chk').forEach((c) => {
        c.addEventListener('change', () => {
          updateLabel();
          renderArqTable();
        });
      });
    };

    const renderArqTable = () => {
      const resultEl = document.getElementById('ct-arq-result');
      const d = __cwStore.ctArqLastData;
      if (!d || !d.objs || d.objs.length === 0) {
        resultEl.innerHTML =
          '<div style="padding:10px;text-align:center;color:#ef4444;">Nenhum objeto encontrado na categoria especificada!</div>';
        return;
      }

      const filters = getArqFilters();
      const mode = filters.mode;
      const filteredObjs = getFilteredObjs(d, filters);

      if (filteredObjs.length === 0) {
        resultEl.innerHTML =
          '<div style="padding:10px;text-align:center;color:#ef4444;">Nenhum objeto retornado para este filtro.</div>';
        return;
      }

      let html = `<div style="margin-bottom:12px;font-weight:bold;color:#334155;border-bottom:1px solid #e2e8f0;padding-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <span>Pré-visualização: ${filteredObjs.length} objetos</span>
            <span id="ct-arq-sro-progress" style="font-size:11px;color:#10b981;font-weight:600;display:none;">Sincronizando SRO Intranet...</span>
          </div>`;
      html +=
        '<table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">';

      if (mode === '1') {
        html +=
          '<thead><tr style="color:#64748b;"><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Distrito</th><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Objeto</th><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Situação SRO</th></tr></thead><tbody>';
      } else if (mode === '2') {
        html +=
          '<thead><tr style="color:#64748b;"><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Distrito</th><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Endereço</th></tr></thead><tbody>';
      } else {
        html +=
          '<thead><tr style="color:#64748b;"><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Distrito</th><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Objeto</th><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Demais Dados</th><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Situação SRO</th></tr></thead><tbody>';
      }

      const objsToFetch = [];

      for (const o of filteredObjs) {
        const sroData = __cwStore.sroIntranetCache?.[o.objeto] || null;
        const sroVal = sroData ? sroData.sit : null;
        if (!sroVal && o.objeto && mode !== '2') {
          objsToFetch.push(o.objeto);
        }
        const sroDisplay = sroVal
          ? `<span style="color:${sroVal.includes('Entregue') ? '#10b981' : sroVal.includes('Saiu') ? '#f97316' : '#64748b'};font-weight:bold;font-size:10px;text-transform:uppercase;">${sroVal}</span>`
          : `<span style="color:#94a3b8;font-size:10px;">Buscando...</span>`;

        const objLink = o.objeto
          ? `<a href="${URLS.SROINTRANET_ORIGIN}/rastreamento?objetos=${o.objeto}" target="_blank" style="text-decoration:none;color:${o.cor || 'inherit'};">${o.objeto}</a>`
          : '--';

        html += `<tr style="border-bottom:1px solid #f1f5f9;">
               <td style="padding:8px;font-weight:bold;width:80px;">${o.dist}</td>`;
        if (mode === '1') {
          html += `<td style="padding:8px;color:${o.cor || 'inherit'};font-weight:bold;">${objLink}</td>
                     <td style="padding:8px;" id="sro-st-${o.objeto}">${sroDisplay}</td>`;
        } else if (mode === '2') {
          html += `<td style="padding:8px;color:#475569;">${o.endereco || ''} - ${o.cep || ''}</td>`;
        } else {
          html += `<td style="padding:8px;color:${o.cor || 'inherit'};font-weight:bold;width:140px;">${objLink}</td>
               <td style="padding:8px;color:#475569;">
                 <div style="margin-bottom:4px;">${o.endereco || ''} - ${o.cep || ''}</div>
                 <div style="font-size:11px;color:#94a3b8;">Max. Entrega: ${o.dataMaximaEntrega ? o.dataMaximaEntrega.replace('T', ' ') : ''}</div>
               </td>
               <td style="padding:8px;width:160px;" id="sro-st-${o.objeto}">${sroDisplay}</td>`;
        }
        html += `</tr>`;
      }
      html += '</tbody></table>';
      resultEl.innerHTML = html;

      __cwStore.currentArqRenderId = Symbol();
      const myRenderId = __cwStore.currentArqRenderId;

      if (objsToFetch.length > 0) {
        const prog = document.getElementById('ct-arq-sro-progress');
        if (prog) prog.style.display = 'block';
        const myId = __cwStore.sroIntranetCacheId;

        (async () => {
          try {
            const batchSize = 50;
            const list = [...new Set(objsToFetch)];
            const chunks = [];
            for (let i = 0; i < list.length; i += batchSize)
              chunks.push(list.slice(i, i + batchSize));

            let chunkIdx = 0;
            let doneList = 0;

            const worker = async () => {
              while (chunkIdx < chunks.length) {
                if (
                  __cwStore.currentArqRenderId !== myRenderId ||
                  __cwStore.sroIntranetCacheId !== myId
                )
                  break;

                const chunk = chunks[chunkIdx++];
                const objs = chunk.join(';');
                let tries = 0;
                let success = false;

                while (tries < 3 && !success) {
                  if (
                    __cwStore.currentArqRenderId !== myRenderId ||
                    __cwStore.sroIntranetCacheId !== myId
                  )
                    break;
                  try {
                    const t = await fetchMonitor(
                      URLS.SROINTRANET_ORIGIN + '/rastreamento?objetos=' + objs
                    );
                    if (
                      !t ||
                      t.trim() === '' ||
                      t.includes('Request Entity Too Large') ||
                      t.includes('Method Not Allowed')
                    )
                      throw new Error('Invalid response');

                    const cleanHTML = t
                      .replace(/<img[^>]*>/gi, '')
                      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                    const d2 = new DOMParser().parseFromString(
                      cleanHTML,
                      'text/html'
                    );
                    let foundAny = false;

                    d2.querySelectorAll('a[Name="Detalhes"]').forEach((a) => {
                      const objCode = a.innerText.trim();
                      const td = a.closest('td');
                      if (td && td.parentElement) {
                        const tds = td.parentElement.querySelectorAll('td');
                        if (tds.length >= 4) {
                          foundAny = true;
                          const dh = tds[1].innerText.trim();
                          const sit = tds[3].innerText.trim();
                          __cwStore.sroIntranetCache[objCode] = { dh, sit };
                          if (
                            Object.keys(__cwStore.sroIntranetCache).length >
                            5000
                          )
                            __cwStore.sroIntranetCache = {};
                        }
                      }
                    });

                    if (!foundAny && t.includes('Nenhum objeto encontrado')) {
                      success = true;
                    } else if (!foundAny && cleanHTML.length < 500) {
                      throw new Error('Insufficient data');
                    } else {
                      success = true;
                    }
                  } catch (ex) {
                    tries++;
                    await new Promise((r) => setTimeout(r, 1000));
                  }
                }

                if (
                  success &&
                  __cwStore.currentArqRenderId === myRenderId &&
                  __cwStore.sroIntranetCacheId === myId
                ) {
                  for (const o of chunk) {
                    const tdEl = document.getElementById('sro-st-' + o);
                    if (tdEl && __cwStore.sroIntranetCache[o]) {
                      const sit = __cwStore.sroIntranetCache[o].sit;
                      tdEl.innerHTML = `<span style="color:${sit.includes('Entregue') ? '#10b981' : sit.includes('Saiu') ? '#f97316' : '#64748b'};font-weight:bold;font-size:10px;text-transform:uppercase;">${sit}</span>`;
                    }
                  }
                }

                doneList += chunk.length;
                if (
                  prog &&
                  __cwStore.currentArqRenderId === myRenderId &&
                  __cwStore.sroIntranetCacheId === myId
                ) {
                  prog.innerText = `Sincronizando SRO Intranet... ${doneList}/${list.length}`;
                }
              }
            };

            const workers = Array.from(
              { length: Math.min(2, chunks.length) },
              () => worker()
            );
            await Promise.all(workers);

            if (
              __cwStore.currentArqRenderId === myRenderId &&
              __cwStore.sroIntranetCacheId === myId
            ) {
              refreshSroMasterFilters();
            }
          } finally {
            if (__cwStore.currentArqRenderId === myRenderId) {
              if (prog) {
                prog.innerText = 'Sincronizado';
                setTimeout(() => {
                  if (prog && __cwStore.currentArqRenderId === myRenderId)
                    prog.style.display = 'none';
                }, 3000);
              }
            }
          }
        })();
      }
    };

    document
      .getElementById('ct-arq-export-mode')
      ?.addEventListener('change', renderArqTable);
    document
      .getElementById('ct-arq-dist-filter')
      ?.addEventListener('change', renderArqTable);

    document
      .getElementById('ct-arq-btn-reload-sro')
      ?.addEventListener('click', () => {
        __cwStore.sroIntranetCache = {};
        __cwStore.sroIntranetCacheId = Date.now();
        refreshSroMasterFilters();
        renderArqTable();
      });

    const formatExport = (data, filters) => {
      if (!data || !data.objs || data.objs.length === 0) return '';
      const mode = filters.mode;
      const filteredObjs = getFilteredObjs(data, filters);

      if (filteredObjs.length === 0) return '';

      const groups = {};
      for (const o of filteredObjs) {
        const k =
          o.dist +
          '-' +
          (o.sro || '') +
          '-' +
          (o.nom || '') +
          '-' +
          (o.mat || '');
        if (!groups[k]) groups[k] = [];
        groups[k].push(o);
      }

      let out = [];
      let isFirstGroup = true;
      for (const k in groups) {
        if (!isFirstGroup) out.push('');
        isFirstGroup = false;

        const groupObjs = groups[k];
        const first = groupObjs[0];
        const mat = first.mat || '00000000';
        const nom = first.nom || 'N/A';
        const sro = first.sro || '00000000';

        out.push(
          `Nome: ${nom} - Matrícula: ${mat} - Unidade: ${sro} - Quantidade: ${groupObjs.length} - Categoria: ${data.cat} - Distrito: ${first.dist}`
        );

        for (const o of groupObjs) {
          let line = '';
          if (mode === '1') {
            line = o.objeto || '--';
          } else if (mode === '2') {
            line = `${o.endereco || ''} ${o.cep || ''}`.trim();
          } else {
            line =
              `${o.objeto || '--'} - ${o.endereco || ''} ${o.cep || ''}`.trim();
          }
          out.push(line);
        }
      }
      return out.join('\r\n');
    };

    document
      .getElementById('ct-arq-export-mode')
      ?.addEventListener('change', renderArqTable);
    document
      .getElementById('ct-arq-dist-filter')
      ?.addEventListener('change', () => {
        refreshSroMasterFilters(true);
        renderArqTable();
      });
    document
      .getElementById('ct-arq-grade-filter')
      ?.addEventListener('change', () => {
        refreshSroMasterFilters(true);
        renderArqTable();
      });
    document
      .getElementById('ct-arq-side-filter')
      ?.addEventListener('change', () => {
        refreshSroMasterFilters(true);
        renderArqTable();
      });
    document
      .getElementById('ct-arq-sro-ignore-text')
      ?.addEventListener('input', renderArqTable);

    document
      .getElementById('ct-arq-sro-multi-select')
      ?.addEventListener('click', (e) => {
        const list = document.getElementById('ct-arq-sro-multi-list');
        if (list) {
          list.style.display = list.style.display === 'none' ? 'block' : 'none';
        }
      });
    document.addEventListener('click', (e) => {
      const container = document.getElementById(
        'ct-arq-sro-dropdown-container'
      );
      if (container && !container.contains(e.target)) {
        const list = document.getElementById('ct-arq-sro-multi-list');
        if (list) list.style.display = 'none';
      }
    });

    document
      .getElementById('ct-arq-btn-copy')
      ?.addEventListener('click', () => {
        const filters = getArqFilters();
        const txt = formatExport(__cwStore.ctArqLastData, filters);
        if (!txt) return;
        navigator.clipboard.writeText(txt);
      });

    if (!document.getElementById('printjs-lib')) {
      const sc = document.createElement('script');
      sc.id = 'printjs-lib';
      sc.src = 'https://unpkg.com/print-js@1/dist/print.js';
      document.head.appendChild(sc);
      const lk = document.createElement('link');
      lk.rel = 'stylesheet';
      lk.href = 'https://unpkg.com/print-js@1/dist/print.css';
      document.head.appendChild(lk);
    }

    document
      .getElementById('ct-arq-btn-print')
      ?.addEventListener('click', () => {
        const filters = getArqFilters();
        const data = __cwStore.ctArqLastData;
        const filteredObjs = getFilteredObjs(data, filters);
        if (filteredObjs.length === 0) return;

        const distGroups = {};
        for (const o of filteredObjs) {
          if (!distGroups[o.dist]) distGroups[o.dist] = [];
          distGroups[o.dist].push(o);
        }

        const sortedDists = Object.keys(distGroups).sort((a, b) =>
          a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: 'base'
          })
        );

        let printContent = `
            <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 45px; align-items: stretch;">
              <div style="flex: 1.5; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fafafa; display: flex; flex-direction: column;">
                <p style="margin:0; color:#0f172a; font-size:13px; font-weight:bold;">Observações:</p>
                <div style="border-bottom:1px solid #cbd5e1; margin-top: 18px;"></div>
                <div style="border-bottom:1px solid #cbd5e1; margin-top: 16px;"></div>
              </div>
              <div style="flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fafafa; display: flex; flex-direction: column; justify-content: space-around;">
                <p style="margin:0 0 10px 0; color:#0f172a; font-size:13px; font-weight:bold; white-space:nowrap;">Resultado da busca:</p>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 6px; white-space:nowrap;">
                    <div style="width: 14px; height: 14px; border: 1px solid #94a3b8; background: #fff;"></div>
                    <span style="font-size:12px; color:#334155; font-weight:600;">100% Encontrados</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px; white-space:nowrap;">
                    <div style="width: 14px; height: 14px; border: 1px solid #94a3b8; background: #fff;"></div>
                    <span style="font-size:12px; color:#334155; font-weight:600;">Faltou objetos, Qtd:</span>
                    <div style="width: 30px; border-bottom: 1px solid #94a3b8; height: 14px;"></div>
                  </div>
                </div>
              </div>
            </div>
          `;

        for (const dist of sortedDists) {
          const groupObjs = distGroups[dist];
          groupObjs.sort((a, b) =>
            (a.objeto || '').localeCompare(b.objeto || '')
          );

          const first = groupObjs[0];

          printContent += `
            <div class="print-dist-group" style="margin-bottom: 45px; page-break-inside: auto; width: 100%;">
              <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 12px; font-size: 13px; color: #334155; display: block; text-align: center; page-break-inside: avoid; break-inside: avoid;">
                <div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; align-items: center; width: 100%; margin-bottom: 8px;">
                  <div style="font-size: 16px; font-weight: bold; color: #0f172a;">Distrito: ${dist}</div>
                  <div style="display:flex; gap: 15px; font-size: 12px;">
                    <span><strong>Mat:</strong> ${first.mat || '--'}</span>
                    <span><strong>Und:</strong> ${first.sro || '--'}</span>
                    <span style="background:#e2e8f0; padding:2px 8px; border-radius:20px; font-weight:bold;">Total: ${groupObjs.length}</span>
                  </div>
                </div>
                <div style="font-size: 12px; border-top: 1px dashed #cbd5e1; padding-top: 8px; width: 100%;">
                  <span><strong>Carteiro:</strong> ${first.nom || 'N/A'}</span>
                </div>
              </div>
              <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 25px; page-break-inside: auto; break-inside: auto;">
          `;

          for (const o of groupObjs) {
            let objDisplay = o.objeto || '--';
            const m = objDisplay.match(
              /^([A-Z]{2})(\d{3})(\d{3})(\d{3})([A-Z]{2})$/i
            );
            if (m) {
              objDisplay = `
                <span style="background:#dbeafe;color:#1e3a8a;border-radius:3px;padding:1px 3px;font-weight:bold;">${m[1]}</span>
                <span style="letter-spacing:-0.5px;"> ${m[2]} ${m[3]} </span>
                <span style="background:#fef9c3;color:#1e40af;border-radius:3px;padding:1px 3px;font-weight:bold;">${m[4]}</span>
                <span> ${m[5]}</span>
              `;
            } else {
              objDisplay = `<span style="font-weight:bold;">${objDisplay}</span>`;
            }

            printContent += `
                <div style="display: flex; align-items: center; gap: 6px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; font-family: monospace; font-size: 14px; min-width: 180px; justify-content: center; page-break-inside: avoid; break-inside: avoid;">
                  <div style="width:16px;height:16px;border:2px solid #94a3b8;border-radius:3px;vertical-align:middle;box-sizing:border-box;"></div>
                  <div>${objDisplay}</div>
                </div>
            `;
          }
          printContent += `</div></div>`;
        }

        const dateStr = new Date().toLocaleString('pt-BR');

        const overlayHtml = `
          <div id="print-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.8);z-index:999999;backdrop-filter:blur(4px);display:flex;flex-direction:column;align-items:center;padding:20px;overflow-y:auto;font-family:Arial,sans-serif;">
            <div style="width: 100%; max-width: 230mm; display:flex; flex-direction:column; gap: 10px; justify-content:center; align-items:center; text-align:center; margin-bottom: 15px; position: sticky; top: 0; z-index: 10; background: #fff; padding: 15px 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div>
                <h3 style="margin:0;color:#0f172a;font-size:18px;">Pré-visualização de Impressão</h3>
                <div style="font-size:12px;color:#64748b;margin-top:4px;">Verifique os dados antes de gerar o PDF/A4.</div>
              </div>
              <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
                <button id="btn-do-print" style="white-space:nowrap;padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:14px;box-shadow:0 2px 4px rgba(37,99,235,0.3);transition:0.2s; box-sizing:border-box; min-width: max-content;">🖨️ Enviar para Impressão</button>
                <button id="btn-close-print" style="white-space:nowrap;padding:10px 16px;background:#ef4444;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer;font-size:14px;box-shadow:0 2px 4px rgba(239,68,68,0.3); box-sizing:border-box; min-width: max-content;">❌ Fechar</button>
              </div>
            </div>

            <div style="box-shadow:0 10px 25px rgba(0,0,0,0.3); border-radius:4px; background:#fff; overflow:hidden; max-height:297mm; min-height: 297mm; margin-bottom: 50px;">
            <div id="print-a4-surface" style="width:210mm; min-height:297mm; background-color:#fff; padding:10mm 15mm; box-sizing:border-box; position:relative;">
              <div style="text-align:center; border-bottom: 3px solid #0f172a; border-top: 3px solid #0f172a; padding-top: 10px; padding-bottom: 10px; margin-top: -10px; margin-bottom: 20px;">
                <h1 style="margin:0; color:#0f172a; font-size:24px; text-transform:uppercase; letter-spacing:1px;">Relatório Analítico de Objetos - ${data.cat}</h1>
                <p style="margin:8px 0 0 0; color:#475569; font-size:14px;"><strong>Gerado em:</strong> ${dateStr} | <strong>Total de Objetos:</strong> ${filteredObjs.length}</p>
              </div>
              ${printContent}
            </div>
            </div>
          </div>
        `;

        const div = document.createElement('div');
        div.innerHTML = overlayHtml;
        document.body.appendChild(div.firstElementChild);

        document
          .getElementById('btn-close-print')
          .addEventListener('click', () => {
            document.getElementById('print-overlay').remove();
          });

        document
          .getElementById('btn-do-print')
          .addEventListener('click', () => {
            const surfaceContainer =
              document.getElementById('print-a4-surface').parentElement;
            surfaceContainer.style.maxHeight = 'none';
            surfaceContainer.style.overflow = 'visible';

            const prtHtml =
              document.getElementById('print-a4-surface').outerHTML;

            surfaceContainer.style.maxHeight = '297mm';
            surfaceContainer.style.overflow = 'hidden';

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(`
                  <html>
                  <head>
                      <title>Correios Wizard - Relatório A4</title>
                      <style>
                          @page { size: A4 portrait; margin: 10mm; }
                          body { margin: 0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #fff; }
                          .print-dist-group { page-break-after: auto; break-after: auto; }
                          .print-dist-group > div:first-child { page-break-after: avoid; break-after: avoid; }
                      </style>
                  </head>
                  <body>
                      ${prtHtml}
                  </body>
                  </html>
              `);
            doc.close();

            setTimeout(() => {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
              setTimeout(() => document.body.removeChild(iframe), 2000);
            }, 400);
          });
      });

    document.getElementById('ct-arq-btn-txt')?.addEventListener('click', () => {
      const filters = getArqFilters();
      const txt = formatExport(__cwStore.ctArqLastData, filters);
      if (!txt) return;

      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      let n = `Export_${__cwStore.ctArqLastData.cat}`;
      if (filters.grade) n += '_G' + filters.grade;
      if (filters.side) n += '_L' + filters.side;
      if (filters.dist) n += '_' + filters.dist.replace(/\s+/g, '_');

      link.download = n + '.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    document
      .getElementById('btn-arq-hoje')
      ?.addEventListener('click', () => arqFetch('hoje'));
    document
      .getElementById('btn-arq-vencidos')
      ?.addEventListener('click', () => arqFetch('vencidos'));
    document
      .getElementById('btn-arq-avencer')
      ?.addEventListener('click', () => arqFetch('avencer'));

    new window['Chart'](document.getElementById('chartjs-status'), {
      type: 'doughnut',
      data: {
        labels: ['Vencidos', 'Vencem Hoje', 'A Vencer'],
        datasets: [
          {
            data: [totalVencidos, totalHoje, totalAVencer],
            backgroundColor: ['#ef4444', '#f97316', '#10b981'],
            borderWidth: 0,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: !0,
        maintainAspectRatio: !1,
        cutout: '50%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: !0,
              font: { family: 'system-ui' }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.9)',
            padding: 12,
            cornerRadius: 8
          }
        }
      }
    });

    new window['Chart'](document.getElementById('chartjs-volume'), {
      type: 'bar',
      data: {
        labels: topDistritos.map((d) => d.numeroDistrito),
        datasets: [
          {
            label: 'Volume',
            data: topDistritos.map((d) => d.qtde),
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            barPercentage: 0.85,
            categoryPercentage: 0.9
          }
        ]
      },
      options: {
        responsive: !0,
        maintainAspectRatio: !1,
        plugins: {
          legend: { display: !1 },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.9)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: !0,
            grid: { color: '#e2e8f0' },
            border: { display: !1 },
            ticks: { font: { family: 'system-ui' }, color: '#64748b' }
          },
          x: {
            grid: { display: !1 },
            border: { display: !1 },
            ticks: { font: { family: 'system-ui' }, color: '#64748b' }
          }
        }
      }
    });

    const grid = document.getElementById('ct-dist-grid');
    distritosList.forEach((d) => {
      const card = document.createElement('div');
      card.style.cssText =
        'background:#fff;border:1px solid #e2e8f0;padding:10px 15px;border-radius:6px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:all 0.2s;display:flex;flex-direction:column;justify-content:center;';
      card.onmouseover = () => {
        card.style.borderColor = '#3b82f6';
        card.style.transform = 'translateY(-2px)';
      };
      card.onmouseout = () => {
        card.style.borderColor = '#e2e8f0';
        card.style.transform = 'translateY(0)';
      };
      card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-size:24px;font-weight:900;color:#0f172a;line-height:1;">${d.numeroDistrito}</div>
            <div style="display:flex;gap:6px;background:#f8fafc;padding:4px 8px;border-radius:4px;border:1px solid #f1f5f9;">
              <span style="color:#ef4444;font-size:12px;font-weight:bold;">V:${PN(d.qtdeVencido)}</span>
              <span style="color:#f97316;font-size:12px;font-weight:bold;">H:${PN(d.qtdeHoje)}</span>
              <span style="color:#10b981;font-size:12px;font-weight:bold;">A:${PN(d.qtdeAVencer)}</span>
            </div>
          </div>
          <div style="font-size:13px;color:#333;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${d.nomeCarteiro || 'NÃO ATRIBUÍDO'}">${d.nomeCarteiro || 'NÃO ATRIBUÍDO'}</div>
        `;

      card.onclick = () => {
        const dt = new Date();
        dt.setHours(dt.getHours() - 24);
        const defDate = dt.toISOString().slice(0, 10);

        mod.style.display = 'flex';
        mod.innerHTML = `
            <div style="background:#fff;width:95%;max-width:1100px;height:85vh;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
              <div style="background-color:#00416B !important;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #FFE600 !important;">
                <div style="color:#ffffff !important;">
                  <h2 style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.5px;color:#ffffff !important;">DISTRITO ${d.numeroDistrito}</h2>
                  <div style="font-size:14px;color:#FFE600 !important;font-weight:700;margin-top:4px;text-transform:uppercase;">${d.nomeCarteiro || 'SEM NOME'} &nbsp;|&nbsp; MATRÍCULA: ${d.matriculaCarteiro || '--'}</div>
                </div>
                <button id="ct-close-mod" style="background:transparent !important;border:none !important;color:#ffffff !important;font-size:28px;cursor:pointer;padding:0;line-height:1;transition:0.2s;" onmouseover="this.style.color='#FFE600'" onmouseout="this.style.color='#fff'">×</button>
              </div>
              <div style="padding:16px 24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;gap:16px;align-items:center;">
                <div style="display:flex;flex-direction:column;flex:1;max-width:300px;">
                  <label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Data do Relatório SRO Monitor</label>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <button id="ct-mod-prev" style="background:#e2e8f0;border:1px solid #cbd5e1;color:#334155;border-radius:6px;width:34px;height:34px;cursor:pointer;font-weight:bold;font-size:16px;display:flex;align-items:center;justify-content:center;transition:0.2s;" onmouseover="this.style.background='#cbd5e1'" onmouseout="this.style.background='#e2e8f0'">◄</button>
                    <input type="date" id="ct-mod-date" value="${defDate}" style="padding:0 12px;height:34px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:14px;color:#334155;outline:none;cursor:pointer;font-weight:600;flex:1;">
                    <button id="ct-mod-next" style="background:#e2e8f0;border:1px solid #cbd5e1;color:#334155;border-radius:6px;width:34px;height:34px;cursor:pointer;font-weight:bold;font-size:16px;display:flex;align-items:center;justify-content:center;transition:0.2s;" onmouseover="this.style.background='#cbd5e1'" onmouseout="this.style.background='#e2e8f0'">►</button>
                  </div>
                </div>
                <div style="flex:1;display:flex;justify-content:flex-end;align-items:center;">
                  <button id="ct-mod-reload" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:0 20px;height:34px;line-height:34px;font-weight:600;font-size:13px;cursor:pointer;display:inline-block;box-shadow:0 1px 3px rgba(0,0,0,0.1);transition:background 0.2s;white-space:nowrap;width:max-content;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">↻ Atualizar Relatório</button>
                </div>
              </div>
              <div id="ct-mod-body" style="flex:1;overflow-y:auto;padding:24px;background:#f1f5f9;"></div>
            </div>
          `;

        document.getElementById('ct-close-mod').onclick = () =>
          (mod.style.display = 'none');

        const dtInput = document.getElementById('ct-mod-date');
        const btnPrev = document.getElementById('ct-mod-prev');
        const btnNext = document.getElementById('ct-mod-next');
        const btnReload = document.getElementById('ct-mod-reload');
        const body = document.getElementById('ct-mod-body');

        const fetchAndRender = async () => {
          const date = dtInput.value;
          body.innerHTML =
            '<div style="text-align:center;padding:40px;color:#3b82f6;font-weight:700;font-size:16px;">Acessando SRO Monitor e processando dados...</div>';
          try {
            const u = `${URLS.SROMONITOR_ORIGIN}/app/analitico-unidade-se/index.php?data=${date}&unidade=${d.codigoSro}&matricula=${d.matriculaCarteiro}`;

            const t = await fetchMonitor(u);

            const p = new DOMParser();
            const doc = p.parseFromString(t, 'text/html');
            const rows = doc.querySelectorAll('#analiticounidadese tbody tr');

            if (
              rows.length === 0 ||
              (rows.length === 1 && rows[0].innerText.includes('Nenhum'))
            ) {
              body.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;font-weight:bold;font-size:16px;">Nenhum registro de distribuição em ${date.split('-').reverse().join('/')}.</div>`;
              return;
            }

            const stats = {};
            const listMap = {};
            rows.forEach((tr) => {
              const tds = tr.querySelectorAll('td');
              if (tds.length >= 7) {
                const obj = tds[4].innerText.trim();
                const mot = tds[6].innerText.trim();
                listMap[obj] = mot;
              }
            });

            const list = [];
            Object.entries(listMap).forEach(([obj, mot]) => {
              if (!stats[mot]) stats[mot] = 0;
              stats[mot]++;
              list.push({ obj, mot });
            });

            let filteredList = [...list];
            const cid = 'ct-pie-' + Date.now();
            const cats = Object.keys(stats).sort();

            body.innerHTML = `
                <div style="display:flex;flex-wrap:wrap;gap:20px;margin-bottom:24px;">
                  <div style="flex:1;min-width:300px;background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);border:1px solid #e2e8f0;height:300px;position:relative;">
                    <canvas id="${cid}"></canvas>
                  </div>
                  <div style="flex:1;min-width:300px;display:flex;flex-direction:column;gap:12px;height:300px;overflow-y:auto;padding-right:10px;">
                    ${Object.entries(stats)
                      .sort((a, b) => b[1] - a[1])
                      .map(
                        (s) => `
                      <div style="background:#fff;padding:14px 18px;border-radius:6px;border-left:5px solid #3b82f6;display:flex;justify-content:space-between;align-items:center;box-shadow:0 1px 2px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
                        <span style="font-size:12px;font-weight:800;color:#334155;text-transform:uppercase;">${s[0]}</span>
                        <div style="display:flex;align-items:center;gap:12px;">
                          <button class="ct-btn-copy" data-cat="${s[0]}" style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;color:#3b82f6;padding:4px 8px;cursor:pointer;font-weight:bold;font-size:10px;transition:0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'" title="Copiar para a Área de Transferência">📋</button>
                          <button class="ct-btn-export" data-cat="${s[0]}" style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;color:#334155;padding:4px 8px;cursor:pointer;font-weight:bold;font-size:10px;transition:0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'" title="Baixar lista em .txt">📥 TXT</button>                         <span style="font-size:18px;font-weight:900;color:#0f172a;width:40px;text-align:right;display:inline-block;">${s[1]}</span>
                        </div>
                      </div>`
                      )
                      .join('')}
                  </div>
                </div>

                <div id="ct-sro-progress" style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;font-weight:bold;color:#3b82f6;display:flex;align-items:center;gap:12px;">
                  ⏳ Sincronizando com SRO Intranet: <span id="ct-sro-count">0</span> / ${list.length} objetos carregados...
                </div>

                <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;display:flex;flex-direction:column;gap:16px;">
                   <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
                     <div style="flex:1;min-width:150px;">
                        <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:6px;">Pesquisa de Objeto:</span>
                        <input type="text" id="ct-filter-obj" placeholder="Ex: NX123456789BR..." style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;outline:none;">
                     </div>
                     <div style="flex:1;min-width:150px;">
                        <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:6px;">Ordenação:</span>
                        <select id="ct-sort-by" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;outline:none;cursor:pointer;background:#fff;">
                          <option value="default">Padrão</option>
                          <option value="motivo_asc">Motivo (A-Z)</option>
                          <option value="motivo_desc">Motivo (Z-A)</option>
                          <option value="objeto">Objeto (A-Z)</option>
                        </select>
                     </div>
                   </div>

                   <div>
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Filtro por Categorias (Motivos Inseridos):</span>
                          <div style="display:flex;gap:8px;flex-wrap:wrap;">
                              <button id="ct-cat-all" style="padding:6px 12px;font-size:11px;border-radius:4px;border:1px solid #cbd5e1;background:#f8fafc;cursor:pointer;font-weight:600;color:#334155;transition:0.2s;white-space:nowrap;width:auto;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f8fafc'">Selecionar Tudo</button>
                              <button id="ct-cat-none" style="padding:6px 12px;font-size:11px;border-radius:4px;border:1px solid #cbd5e1;background:#f8fafc;cursor:pointer;font-weight:600;color:#334155;transition:0.2s;white-space:nowrap;width:auto;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f8fafc'">Remover Seleção</button>
                          </div>
                      </div>
                      <div id="ct-filter-cat" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                          ${cats
                            .map(
                              (k, idx) => `
                             <label style="background:#f1f5f9;padding:6px 12px;border-radius:20px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:6px;border:1px solid #cbd5e1;color:#334155;font-weight:600;transition:0.2s;white-space:nowrap;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                                <input type="checkbox" value="${k}" checked id="ct-chk-${idx}" style="cursor:pointer;margin:0;"> ${k}
                             </label>
                          `
                            )
                            .join('')}
                      </div>
                   </div>
                </div>

                <div style="background:#fff;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);overflow:hidden;" id="ct-table-wrapper">
                  <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
                    <thead style="background-color:#00416B !important;border-bottom:3px solid #FFE600 !important;position:sticky;top:0;z-index:10;">
                      <tr>
                         <th style="padding:12px 20px;color:#ffffff !important;font-weight:800;text-transform:uppercase;width:150px;background-color:#00416B !important;">Objeto</th>
                         <th style="padding:12px 20px;color:#ffffff !important;font-weight:800;text-transform:uppercase;background-color:#00416B !important;">Motivo Registrado</th>
                         <th style="padding:12px 20px;color:#ffffff !important;font-weight:800;text-transform:uppercase;background-color:#00416B !important;width:160px;">Situação SRO Intranet</th>
                         <th style="padding:12px 20px;color:#ffffff !important;font-weight:800;text-transform:uppercase;background-color:#00416B !important;width:140px;">Data/Hora</th>
                         <th style="padding:12px 20px;color:#ffffff !important;font-weight:800;text-transform:uppercase;background-color:#00416B !important;width:120px;text-align:center;">Comprovante</th>
                      </tr>
                    </thead>
                    <tbody id="ct-tbody"></tbody>
                  </table>
                  <div id="ct-empty-msg" style="padding:24px;text-align:center;color:#64748b;font-weight:bold;font-size:13px;background:#f8fafc;border-top:1px solid #e2e8f0;display:none;">Nenhum objeto corresponde aos filtros.</div>
                </div>
              `;

            const tbody = document.getElementById('ct-tbody');
            const emptyMsg = document.getElementById('ct-empty-msg');
            const txtFilter = document.getElementById('ct-filter-obj');
            const sortFilter = document.getElementById('ct-sort-by');
            const chks = Array.from(
              document.querySelectorAll('#ct-filter-cat input[type="checkbox"]')
            );

            const renderTable = () => {
              const txt = txtFilter.value.toLowerCase().trim();
              const selCats = chks.filter((i) => i.checked).map((i) => i.value);
              const sort = sortFilter.value;

              if (selCats.length === 0) {
                tbody.innerHTML = '';
                emptyMsg.style.display = 'block';
                emptyMsg.innerText =
                  'Nenhuma categoria selecionada. Marque alguma para exibir.';
                return;
              }

              filteredList = list.filter((i) => {
                if (txt && !i.obj.toLowerCase().includes(txt)) return false;
                if (!selCats.includes(i.mot)) return false;
                return true;
              });

              if (sort === 'motivo_asc') {
                filteredList.sort((a, b) => a.mot.localeCompare(b.mot));
              } else if (sort === 'motivo_desc') {
                filteredList.sort((a, b) => b.mot.localeCompare(a.mot));
              } else if (sort === 'objeto') {
                filteredList.sort((a, b) => a.obj.localeCompare(b.obj));
              }

              if (filteredList.length === 0) {
                tbody.innerHTML = '';
                emptyMsg.style.display = 'block';
                emptyMsg.innerText =
                  'Nenhum objeto corresponde aos filtros de texto/categoria.';
              } else {
                emptyMsg.style.display = 'none';

                let html = '';
                filteredList.forEach((item, idx) => {
                  let isoDh = '';
                  if (item.dhSro) {
                    const [dPart, tPart] = item.dhSro.split(' ');
                    if (dPart && tPart) {
                      const [dia, mes, ano] = dPart.split('/');
                      isoDh = `${ano}-${mes}-${dia}T${tPart}`;
                    }
                  }

                  html += `
                      <tr data-obj="${item.obj}" style="border-bottom:1px solid #e2e8f0;background-color:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'} !important;transition:0.1s;">
                          <td style="padding:12px 20px;font-weight:bold;letter-spacing:0.5px;font-size:13px;color:#00416B !important;">
                             <a href="${URLS.SROINTRANET_ORIGIN}/rastreamento?objetos=${item.obj}" target="_blank" style="text-decoration:none;color:#00416B !important;">${item.obj}</a>
                          </td>
                          <td style="padding:12px 20px;color:#000000 !important;font-weight:700;font-size:12px;">${item.mot}</td>
                          <td style="padding:12px 20px;color:${item.sitSro ? '#ef4444' : '#94a3b8'} !important;font-weight:${item.sitSro ? '800' : '500'};font-size:11px;text-transform:uppercase;">${item.sitSro || 'Aguardando SRO...'}</td>
                          <td style="padding:12px 20px;color:#64748b !important;font-weight:600;font-size:12px;">${item.dhSro || '--'}</td>
                          <td style="padding:12px 20px;text-align:center;">
                             ${isoDh ? `<button class="ct-btn-img" data-obj="${item.obj}" data-dh="${isoDh}" style="background:#10b981;border:none;border-radius:4px;color:#fff;padding:6px 10px;cursor:pointer;font-weight:bold;font-size:11px;transition:0.2s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'" title="Ver Comprovante">VER</button>` : '--'}
                          </td>
                      </tr>
                    `;
                });
                tbody.innerHTML = html;
              }

              __cwStore.currentModRenderId = Symbol();
              const myRenderId = __cwStore.currentModRenderId;

              const progDiv = document.getElementById('ct-sro-progress');

              const objsToFetch = filteredList.filter((i) => {
                const ck = __cwStore.sroIntranetCache?.[i.obj];
                if (ck && ck.sit) {
                  i.sitSro = ck.sit;
                  i.dhSro = ck.dh;
                  return false;
                }
                return true;
              });

              if (objsToFetch.length === 0) {
                if (progDiv) {
                  progDiv.style.backgroundColor = '#f0fdf4';
                  progDiv.style.color = '#15803d';
                  progDiv.style.borderColor = '#bbf7d0';
                  progDiv.innerHTML = `✅ Todos os ${filteredList.length} objetos visíveis carregados.`;
                }
              } else {
                if (progDiv) {
                  progDiv.style.backgroundColor = '#fff';
                  progDiv.style.color = '#3b82f6';
                  progDiv.style.borderColor = '#e2e8f0';
                  progDiv.innerHTML = `⏳ Sincronizando com SRO Intranet: <span id="ct-sro-count">0</span> / ${objsToFetch.length} novos objetos...`;
                }

                (async () => {
                  const batches = [];
                  for (let i = 0; i < objsToFetch.length; i += 50)
                    batches.push(objsToFetch.slice(i, i + 50));
                  let chunkIdx = 0;
                  let doneCount = 0;

                  const worker = async () => {
                    while (chunkIdx < batches.length) {
                      if (__cwStore.currentModRenderId !== myRenderId) break;
                      const batch = batches[chunkIdx++];
                      const objs = batch.map((c) => c.obj).join(';');
                      let tries = 0,
                        success = false;

                      while (tries < 3 && !success) {
                        if (__cwStore.currentModRenderId !== myRenderId) break;
                        try {
                          const r = await fetchMonitor(
                            URLS.SROINTRANET_ORIGIN +
                              '/rastreamento?objetos=' +
                              objs
                          );
                          if (
                            !r ||
                            r.trim() === '' ||
                            r.includes('Request Entity Too Large') ||
                            r.includes('Method Not Allowed')
                          )
                            throw new Error('Invalid');
                          const cleanHTML = r
                            .replace(/<img[^>]*>/gi, '')
                            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
                          const d2 = new DOMParser().parseFromString(
                            cleanHTML,
                            'text/html'
                          );
                          let foundAny = false;

                          d2.querySelectorAll('a[Name="Detalhes"]').forEach(
                            (a) => {
                              const objCode = a.innerText.trim();
                              const td = a.closest('td');
                              if (td && td.parentElement) {
                                const tds =
                                  td.parentElement.querySelectorAll('td');
                                if (tds.length >= 4) {
                                  foundAny = true;
                                  const dh = tds[1].innerText.trim();
                                  const sit = tds[3].innerText.trim();
                                  __cwStore.sroIntranetCache[objCode] = {
                                    dh,
                                    sit
                                  };
                                }
                              }
                            }
                          );

                          if (
                            Object.keys(__cwStore.sroIntranetCache).length >
                            5000
                          )
                            __cwStore.sroIntranetCache = {};
                          if (
                            !foundAny &&
                            r.includes('Nenhum objeto encontrado')
                          ) {
                            success = true;
                          } else if (!foundAny && cleanHTML.length < 500) {
                            throw new Error('Insufficient');
                          } else {
                            success = true;
                          }
                        } catch (e) {
                          tries++;
                          await new Promise((res) => setTimeout(res, 1000));
                        }
                      }

                      if (
                        success &&
                        __cwStore.currentModRenderId === myRenderId
                      ) {
                        for (const o of batch) {
                          if (__cwStore.sroIntranetCache[o.obj]) {
                            const tr = tbody.querySelector(
                              `tr[data-obj="${o.obj}"]`
                            );
                            if (tr) {
                              const tds = tr.querySelectorAll('td');
                              if (tds.length >= 4) {
                                const sitStr =
                                  __cwStore.sroIntranetCache[o.obj].sit;
                                tds[2].innerHTML = sitStr;
                                tds[2].style.color = sitStr.includes('Entregue')
                                  ? '#10b981'
                                  : sitStr.includes('Saiu')
                                    ? '#f97316'
                                    : '#64748b';
                                tds[2].style.cssText += ' !important';
                                tds[3].innerText =
                                  __cwStore.sroIntranetCache[o.obj].dh;
                              }
                            }
                          }
                        }
                      }

                      doneCount += batch.length;
                      if (__cwStore.currentModRenderId === myRenderId) {
                        const curLbl = document.getElementById('ct-sro-count');
                        if (curLbl) curLbl.innerText = doneCount;
                      }
                    }
                  };

                  const workers = Array.from(
                    { length: Math.min(2, batches.length) },
                    () => worker()
                  );
                  await Promise.all(workers);

                  if (__cwStore.currentModRenderId === myRenderId) {
                    if (progDiv) {
                      progDiv.style.backgroundColor = '#f0fdf4';
                      progDiv.style.color = '#15803d';
                      progDiv.style.borderColor = '#bbf7d0';
                      progDiv.innerHTML = `✅ Todos os ${filteredList.length} objetos visíveis carregados.`;
                    }
                  }
                })();
              }
            };

            txtFilter.addEventListener('input', renderTable);
            sortFilter.addEventListener('change', renderTable);
            chks.forEach((chk) => chk.addEventListener('change', renderTable));

            document
              .getElementById('ct-cat-all')
              .addEventListener('click', () => {
                chks.forEach((c) => (c.checked = true));
                renderTable();
              });
            document
              .getElementById('ct-cat-none')
              .addEventListener('click', () => {
                chks.forEach((c) => (c.checked = false));
                renderTable();
              });

            renderTable();

            if (body._hasCtClick)
              body.removeEventListener('click', body._hasCtClick);
            let lastTxt = 0;
            body._hasCtClick = (e) => {
              const btnImg = e.target.closest('.ct-btn-img');
              const btnExport = e.target.closest('.ct-btn-export');
              const btnCopy = e.target.closest('.ct-btn-copy');

              if (btnExport || btnCopy) {
                if (Date.now() - lastTxt < 1000) return;
                lastTxt = Date.now();
                const targetBtn = btnExport || btnCopy;
                const cat = targetBtn.dataset.cat;
                const catList = list
                  .filter((i) => i.mot === cat)
                  .map((i) => i.obj);
                const mat = d.matriculaCarteiro || '00000000';
                const nom = d.nomeCarteiro || 'N/A';
                const sro = d.codigoSro || '00000000';

                const headerLine = `Nome: ${nom} - Matrícula: ${mat} - Unidade: ${sro} - Quantidade: ${catList.length} - Categoria: ${cat}`;
                const content = [headerLine, ...catList].join('\r\n');

                if (btnCopy) {
                  navigator.clipboard.writeText(content);
                } else {
                  const blob = new Blob([content], {
                    type: 'text/plain;charset=utf-8'
                  });
                  const filename = `${sro}_${mat}_${cat.replace(/\s+/g, '_')}.txt`;
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }

              if (btnImg) {
                const obj = btnImg.dataset.obj;
                const dh = btnImg.dataset.dh;

                const rand = Math.floor(Math.random() * 1000000);
                const url = `${URLS.SROINTRANET_ORIGIN}/imagem?objeto=${obj}&dataHora=${dh}&_t=${Date.now()}_${rand}`;
                const m = document.createElement('div');
                m.id = 'ct-img-modal-' + Date.now();
                m.style.cssText =
                  'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.9);z-index:999999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);perspective:1000px;';

                m.innerHTML = `
                      <div style="background:#1e293b;padding:16px;border-radius:12px;position:relative;width:auto;height:auto;min-width:300px;min-height:300px;max-width:85vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border:1px solid #334155;">

                          <div style="position:absolute;bottom:24px;right:24px;display:flex;gap:12px;z-index:11;">
                            <button id="${m.id}-rotL" style="background:rgba(15,23,42,0.85);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:12px;width:54px;height:54px;cursor:pointer;font-size:24px;box-shadow:0 10px 15px rgba(0,0,0,0.3);backdrop-filter:blur(4px);transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.9)';this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(15,23,42,0.85)';this.style.transform='translateY(0)'" title="Rotacionar Esquerda">↺</button>
                            <button id="${m.id}-rotR" style="background:rgba(15,23,42,0.85);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:12px;width:54px;height:54px;cursor:pointer;font-size:24px;box-shadow:0 10px 15px rgba(0,0,0,0.3);backdrop-filter:blur(4px);transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.9)';this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(15,23,42,0.85)';this.style.transform='translateY(0)'" title="Rotacionar Direita">↻</button>
                          </div>

                          <button id="${m.id}-close" style="position:absolute;top:-16px;right:-16px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-weight:bold;z-index:11;font-size:18px;box-shadow:0 4px 6px rgba(0,0,0,0.2);transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">✕</button>

                          <div id="${m.id}-ld" style="padding:50px;text-align:center;font-weight:bold;color:#60a5fa;font-size:15px;width:100%;height:100%;flex:1;display:flex;align-items:center;justify-content:center;">Buscando imagem no servidor...</div>

                          <div style="overflow:hidden;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#0f172a;flex:1;width:100%;min-height:200px;" id="${m.id}-img-wrap">
                            <img src="${url}" id="${m.id}-img" style="max-width:100%;max-height:calc(85vh - 32px);object-fit:contain;transition:transform 0.15s ease-out;display:none;transform-origin:center;" onload="this.style.display='block';document.getElementById('${m.id}-ld').style.display='none';this.parentElement.style.background='transparent';" onerror="document.getElementById('${m.id}-ld').innerHTML='<span style=&quot;font-size:24px;&quot;>⚠️</span><br><br>Imagem inexistente ou indisponível.';document.getElementById('${m.id}-ld').style.color='#ef4444';this.parentElement.style.display='none';">
                          </div>
                      </div>
                  `;

                document.body.appendChild(m);

                document
                  .getElementById(m.id + '-close')
                  .addEventListener('click', () => m.remove());

                const img = document.getElementById(m.id + '-img');
                let rotation = 0;

                document
                  .getElementById(m.id + '-rotL')
                  .addEventListener('click', () => {
                    rotation -= 90;
                    img.style.transform = `rotate(${rotation}deg)`;
                  });
                document
                  .getElementById(m.id + '-rotR')
                  .addEventListener('click', () => {
                    rotation += 90;
                    img.style.transform = `rotate(${rotation}deg)`;
                  });
              }
            };
            body.addEventListener('click', body._hasCtClick);

            new window['Chart'](document.getElementById(cid), {
              type: 'pie',
              data: {
                labels: Object.keys(stats),
                datasets: [
                  {
                    data: Object.values(stats),
                    backgroundColor: [
                      '#3b82f6',
                      '#ef4444',
                      '#10b981',
                      '#f97316',
                      '#8b5cf6',
                      '#ec4899',
                      '#14b8a6',
                      '#eab308'
                    ],
                    borderWidth: 0
                  }
                ]
              },
              options: {
                responsive: !0,
                maintainAspectRatio: !1,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      boxWidth: 12,
                      font: { family: 'system-ui', size: 11 }
                    }
                  }
                }
              }
            });
          } catch (err) {
            body.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;font-weight:bold;font-size:16px;">Falha ao consultar SRO Monitor.<br><br><span style="font-size:13px;color:#64748b;font-weight:normal;">Motivo Técnico: ${err.message}</span></div>`;
          }
        };

        const triggerUpdate = () => {
          dtInput.style.pointerEvents = 'none';
          dtInput.style.opacity = '0.5';
          btnPrev.style.pointerEvents = 'none';
          btnNext.style.pointerEvents = 'none';
          btnReload.style.pointerEvents = 'none';
          btnReload.style.opacity = '0.5';
          btnReload.innerHTML = '⏳ Aguardando...';

          fetchAndRender().finally(() => {
            dtInput.style.pointerEvents = 'auto';
            dtInput.style.opacity = '1';
            btnPrev.style.pointerEvents = 'auto';
            btnNext.style.pointerEvents = 'auto';

            let left = 5;
            btnReload.innerHTML = `⏳ Aguarde ${left}s`;
            const iv = setInterval(() => {
              left--;
              if (left <= 0) {
                clearInterval(iv);
                btnReload.style.pointerEvents = 'auto';
                btnReload.style.opacity = '1';
                btnReload.innerHTML = '↻ Atualizar Relatório';
              } else {
                btnReload.innerHTML = `⏳ Aguarde ${left}s`;
              }
            }, 1000);
          });
        };

        const changeDate = (offset) => {
          const curr = new Date(dtInput.value);
          if (isNaN(curr)) return;
          curr.setDate(curr.getDate() + offset);
          dtInput.value = curr.toISOString().slice(0, 10);
          triggerUpdate();
        };

        dtInput.onchange = triggerUpdate;
        btnPrev.onclick = () => changeDate(-1);
        btnNext.onclick = () => changeDate(1);
        btnReload.onclick = triggerUpdate;

        fetchAndRender().finally(() => {
          btnReload.style.pointerEvents = 'none';
          btnReload.style.opacity = '0.5';
          let left = 5;
          btnReload.innerHTML = `⏳ Aguarde ${left}s`;
          const iv = setInterval(() => {
            left--;
            if (left <= 0) {
              clearInterval(iv);
              btnReload.style.pointerEvents = 'auto';
              btnReload.style.opacity = '1';
              btnReload.innerHTML = '↻ Atualizar Relatório';
            } else {
              btnReload.innerHTML = `⏳ Aguarde ${left}s`;
            }
          }, 1000);
        });
      };
      grid.appendChild(card);
    });
  }

  function PRL(u, t) {
    if (u && u.includes('lancamentoController.php?acao=listar'))
      try {
        const j = typeof t === 'string' ? JSON.parse(t) : t;
        if (Array.isArray(j)) {
          __cwStore.loecObjectCache = {};
          setTimeout(() => RCD(j), 350);
        }
      } catch (e) {}
  }

  const oF = window.fetch;
  window.fetch = async function (...a) {
    const r = await oF.apply(this, a);
    try {
      const u = a[0] ? a[0].toString() : '';
      if (u.includes('lancamentoController.php?acao=listar'))
        r.clone()
          .json()
          .then((j) => PRL(u, j))
          .catch(() => {});
    } catch (e) {}
    return r;
  };

  const oO = XMLHttpRequest.prototype.open;
  const oS = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u) {
    this._u = u;
    return oO.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (b) {
    this.addEventListener('load', function () {
      if (this._u && this._u.includes('lancamentoController.php?acao=listar'))
        try {
          PRL(this._u, JSON.parse(this.responseText));
        } catch (e) {}
    });
    return oS.apply(this, arguments);
  };
}
