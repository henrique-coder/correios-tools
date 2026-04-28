import type { LoecStore } from '../state.js';
import type { DistrictData } from '../state.js';
import {
  SROMONITOR_ORIGIN,
  SROINTRANET_ORIGIN
} from '../../../shared/constants/urls.js';
import { batchFetchSroIntranet } from '../../../shared/sro/intranet-fetcher.js';
import { mergeSroCache } from '../../../shared/sro/intranet-parser.js';
import { getSroStatusColor } from '../../../shared/utils/color.js';
import { openImageViewer } from './image-viewer.js';

export function openDistrictModal(
  d: DistrictData,
  store: LoecStore,
  fetchProxy: (url: string) => Promise<string>
): void {
  let modal = document.getElementById('ct-mon-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ct-mon-modal';
    modal.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,.6);z-index:9999999;display:none;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
    document.body.appendChild(modal);
  }

  const dt = new Date();
  dt.setHours(dt.getHours() - 24);
  const defDate = dt.toISOString().slice(0, 10);

  modal.style.display = 'flex';
  modal.innerHTML = `<div style="background:#fff;width:95%;max-width:1100px;height:85vh;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,.5)">
    <div style="background:#00416B;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #FFE600">
      <div style="color:#fff"><h2 style="margin:0;font-size:22px;font-weight:800;color:#fff">DISTRITO ${d.correios_numeroDistrito}</h2>
      <div style="font-size:14px;color:#FFE600;font-weight:700;margin-top:4px;text-transform:uppercase">${d.correios_nomeCarteiro ?? 'SEM NOME'} &nbsp;|&nbsp; MATRÍCULA: ${d.correios_matriculaCarteiro ?? '--'}</div></div>
      <button id="ct-close-mod" style="background:transparent;border:none;color:#fff;font-size:28px;cursor:pointer;padding:0;line-height:1" onmouseover="this.style.color='#FFE600'" onmouseout="this.style.color='#fff'">×</button>
    </div>
    <div style="padding:16px 24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;gap:16px;align-items:center">
      <div style="display:flex;flex-direction:column;flex:1;max-width:300px">
        <label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Data do Relatório SRO Monitor</label>
        <div style="display:flex;align-items:center;gap:8px">
          <button id="ct-mod-prev" style="background:#e2e8f0;border:1px solid #cbd5e1;color:#334155;border-radius:6px;width:34px;height:34px;cursor:pointer;font-weight:bold;font-size:16px;display:flex;align-items:center;justify-content:center">◄</button>
          <input type="date" id="ct-mod-date" value="${defDate}" style="padding:0 12px;height:34px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:14px;color:#334155;outline:none;flex:1">
          <button id="ct-mod-next" style="background:#e2e8f0;border:1px solid #cbd5e1;color:#334155;border-radius:6px;width:34px;height:34px;cursor:pointer;font-weight:bold;font-size:16px;display:flex;align-items:center;justify-content:center">►</button>
        </div>
      </div>
      <div style="flex:1;display:flex;justify-content:flex-end;align-items:center">
        <button id="ct-mod-reload" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:0 20px;height:34px;font-weight:600;font-size:13px;cursor:pointer;min-width:180px;white-space:nowrap;transition:all 0.2s;display:flex;justify-content:center;align-items:center">↻ Atualizar Relatório</button>
      </div>
    </div>
    <div id="ct-mod-body" style="flex:1;overflow-y:auto;padding:24px;background:#f1f5f9"></div>
  </div>`;

  document.getElementById('ct-close-mod')!.onclick = () => {
    modal!.style.display = 'none';
  };

  const dtInput = document.getElementById('ct-mod-date') as HTMLInputElement;
  const btnPrev = document.getElementById('ct-mod-prev')!;
  const btnNext = document.getElementById('ct-mod-next')!;
  const btnReload = document.getElementById('ct-mod-reload')!;
  const body = document.getElementById('ct-mod-body')!;

  const setLoading = () => {
    [dtInput, btnPrev, btnNext, btnReload].forEach((el) => {
      (el as HTMLElement).style.pointerEvents = 'none';
    });
    (dtInput as HTMLInputElement).style.opacity = '0.5';
    (btnReload as HTMLElement).style.opacity = '0.5';
    (btnReload as HTMLElement).innerHTML = '⏳ Aguardando...';
  };

  const setReady = () => {
    [dtInput, btnPrev, btnNext].forEach((el) => {
      (el as HTMLElement).style.pointerEvents = 'auto';
    });
    (dtInput as HTMLInputElement).style.opacity = '1';
    let left = 5;
    (btnReload as HTMLElement).innerHTML = `⏳ Aguarde ${left}s`;
    const iv = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(iv);
        (btnReload as HTMLElement).style.pointerEvents = 'auto';
        (btnReload as HTMLElement).style.opacity = '1';
        (btnReload as HTMLElement).innerHTML = '↻ Atualizar Relatório';
      } else {
        (btnReload as HTMLElement).innerHTML = `⏳ Aguarde ${left}s`;
      }
    }, 1000);
  };

  const run = () => {
    setLoading();
    fetchAndRender(d, body, dtInput.value, store, fetchProxy).finally(setReady);
  };

  dtInput.onchange = run;
  btnPrev.onclick = () => {
    const c = new Date(dtInput.value);
    if (!isNaN(+c)) {
      c.setDate(c.getDate() - 1);
      dtInput.value = c.toISOString().slice(0, 10);
      run();
    }
  };
  btnNext.onclick = () => {
    const c = new Date(dtInput.value);
    if (!isNaN(+c)) {
      c.setDate(c.getDate() + 1);
      dtInput.value = c.toISOString().slice(0, 10);
      run();
    }
  };
  btnReload.onclick = run;

  setLoading();
  fetchAndRender(d, body, defDate, store, fetchProxy).finally(setReady);
}

async function fetchAndRender(
  d: DistrictData,
  body: HTMLElement,
  date: string,
  store: LoecStore,
  fetchProxy: (url: string) => Promise<string>
): Promise<void> {
  body.innerHTML =
    '<div style="text-align:center;padding:40px;color:#3b82f6;font-weight:700;font-size:16px">Acessando SRO Monitor e processando dados...</div>';

  try {
    const url = `${SROMONITOR_ORIGIN}/app/analitico-unidade-se/index.php?data=${date}&unidade=${d.correios_codigoSro}&matricula=${d.correios_matriculaCarteiro}`;
    const text = await fetchProxy(url);
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const rows = doc.querySelectorAll('#analiticounidadese tbody tr');

    if (
      !rows.length ||
      (rows.length === 1 &&
        (rows[0] as HTMLElement).innerText.includes('Nenhum'))
    ) {
      body.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;font-weight:bold;font-size:16px">Nenhum registro em ${date.split('-').reverse().join('/')}.</div>`;
      return;
    }

    const listMap: Record<string, string> = {};
    rows.forEach((tr) => {
      const tds = tr.querySelectorAll('td');
      if (tds.length >= 7)
        listMap[(tds[4] as HTMLElement).innerText.trim()] = (
          tds[6] as HTMLElement
        ).innerText.trim();
    });

    const stats: Record<string, number> = {};
    const list: Array<{
      obj: string;
      mot: string;
      sitSro?: string;
      dhSro?: string;
    }> = [];
    Object.entries(listMap).forEach(([obj, mot]) => {
      stats[mot] = (stats[mot] ?? 0) + 1;
      list.push({ obj, mot });
    });

    renderModalBody(body, d, list, stats, date, store, fetchProxy);
  } catch (err: any) {
    body.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;font-weight:bold;font-size:16px">Falha ao consultar SRO Monitor.<br><br><span style="font-size:13px;color:#64748b;font-weight:normal">Motivo Técnico: ${err.message}</span></div>`;
  }
}

function renderModalBody(
  body: HTMLElement,
  d: DistrictData,
  list: Array<{ obj: string; mot: string; sitSro?: string; dhSro?: string }>,
  stats: Record<string, number>,
  date: string,
  store: LoecStore,
  fetchProxy: (url: string) => Promise<string>
): void {
  const cid = 'ct-pie-' + Date.now();
  const cats = Object.keys(stats).sort();

  const statsHtml = Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([cat, count]) =>
        `<div style="background:#fff;padding:14px 18px;border-radius:6px;border-left:5px solid #3b82f6;display:flex;justify-content:space-between;align-items:center;box-shadow:0 1px 2px rgba(0,0,0,.05);border:1px solid #e2e8f0">
      <span style="font-size:12px;font-weight:800;color:#334155;text-transform:uppercase">${cat}</span>
      <div style="display:flex;align-items:center;gap:12px">
        <button class="ct-btn-copy" data-cat="${cat}" style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;color:#3b82f6;padding:4px 8px;cursor:pointer;font-weight:bold;font-size:10px">📋</button>
        <button class="ct-btn-export" data-cat="${cat}" style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;color:#334155;padding:4px 8px;cursor:pointer;font-weight:bold;font-size:10px">📥 TXT</button>
        <span style="font-size:18px;font-weight:900;color:#0f172a;width:40px;text-align:right">${count}</span>
      </div>
    </div>`
    )
    .join('');

  body.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:20px;margin-bottom:24px">
      <div style="flex:1;min-width:300px;background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.05);border:1px solid #e2e8f0;height:300px;position:relative"><canvas id="${cid}"></canvas></div>
      <div style="flex:1;min-width:300px;display:flex;flex-direction:column;gap:12px;height:300px;overflow-y:auto;padding-right:10px">${statsHtml}</div>
    </div>
    <div id="ct-sro-progress" style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;font-weight:bold;color:#3b82f6;display:flex;align-items:center;gap:12px">
      ⏳ Sincronizando com SRO Intranet: <span id="ct-sro-count">0</span> / ${list.length} objetos carregados...
    </div>
    <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px">
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        <div style="flex:1;min-width:150px">
          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:6px">Pesquisa de Objeto:</span>
          <input type="text" id="ct-filter-obj" placeholder="Ex: NX123456789BR..." style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;outline:none">
        </div>
        <div style="flex:1;min-width:150px">
          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:6px">Ordenação:</span>
          <select id="ct-sort-by" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;outline:none;background:#fff">
            <option value="default">Padrão</option>
            <option value="motivo_asc">Motivo (A-Z)</option>
            <option value="motivo_desc">Motivo (Z-A)</option>
            <option value="objeto">Objeto (A-Z)</option>
          </select>
        </div>
      </div>
      <div style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase">Filtro por Categorias:</span>
          <div style="display:flex;gap:8px">
            <button id="ct-cat-all" style="padding:6px 12px;font-size:11px;border-radius:4px;border:1px solid #cbd5e1;background:#f8fafc;cursor:pointer;font-weight:600;color:#334155;white-space:nowrap;min-width:max-content">Selecionar Tudo</button>
            <button id="ct-cat-none" style="padding:6px 12px;font-size:11px;border-radius:4px;border:1px solid #cbd5e1;background:#f8fafc;cursor:pointer;font-weight:600;color:#334155;white-space:nowrap;min-width:max-content">Remover Seleção</button>
          </div>
        </div>
        <div id="ct-filter-cat" style="display:flex;gap:8px;flex-wrap:wrap">
          ${cats.map((k, idx) => `<label style="background:#f1f5f9;padding:6px 12px;border-radius:20px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:6px;border:1px solid #cbd5e1;color:#334155;font-weight:600"><input type="checkbox" value="${k}" checked id="ct-chk-${idx}" style="cursor:pointer;margin:0"> ${k}</label>`).join('')}
        </div>
      </div>
    </div>
    <div style="background:#fff;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden" id="ct-table-wrapper">
      <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left">
        <thead style="background:#00416B;border-bottom:3px solid #FFE600;position:sticky;top:0;z-index:10">
          <tr>
            <th style="padding:12px 20px;color:#fff;font-weight:800;text-transform:uppercase;width:150px">Objeto</th>
            <th style="padding:12px 20px;color:#fff;font-weight:800;text-transform:uppercase">Motivo Registrado</th>
            <th style="padding:12px 20px;color:#fff;font-weight:800;text-transform:uppercase;width:160px">Situação SRO Intranet</th>
            <th style="padding:12px 20px;color:#fff;font-weight:800;text-transform:uppercase;width:140px">Data/Hora</th>
            <th style="padding:12px 20px;color:#fff;font-weight:800;text-transform:uppercase;width:120px;text-align:center">Comprovante</th>
          </tr>
        </thead>
        <tbody id="ct-tbody"></tbody>
      </table>
      <div id="ct-empty-msg" style="padding:24px;text-align:center;color:#64748b;font-weight:bold;font-size:13px;background:#f8fafc;border-top:1px solid #e2e8f0;display:none">Nenhum objeto corresponde aos filtros.</div>
    </div>`;

  const tbody = document.getElementById('ct-tbody')!;
  const emptyMsg = document.getElementById('ct-empty-msg')!;
  const txtFilter = document.getElementById(
    'ct-filter-obj'
  ) as HTMLInputElement;
  const sortFilter = document.getElementById('ct-sort-by') as HTMLSelectElement;
  const chks = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      '#ct-filter-cat input[type="checkbox"]'
    )
  );
  let filteredList = [...list];

  const renderTable = () => {
    const txt = txtFilter.value.toLowerCase().trim();
    const selCats = chks.filter((i) => i.checked).map((i) => i.value);
    const sort = sortFilter.value;

    if (!selCats.length) {
      tbody.innerHTML = '';
      emptyMsg.style.display = 'block';
      emptyMsg.innerText = 'Nenhuma categoria selecionada.';
      return;
    }

    filteredList = list.filter(
      (i) =>
        (!txt || i.obj.toLowerCase().includes(txt)) && selCats.includes(i.mot)
    );
    if (sort === 'motivo_asc')
      filteredList.sort((a, b) => a.mot.localeCompare(b.mot));
    else if (sort === 'motivo_desc')
      filteredList.sort((a, b) => b.mot.localeCompare(a.mot));
    else if (sort === 'objeto')
      filteredList.sort((a, b) => a.obj.localeCompare(b.obj));

    if (!filteredList.length) {
      tbody.innerHTML = '';
      emptyMsg.style.display = 'block';
      emptyMsg.innerText = 'Nenhum objeto corresponde aos filtros.';
      return;
    }

    emptyMsg.style.display = 'none';
    tbody.innerHTML = filteredList
      .map((item, idx) => {
        let isoDh = '';
        if (item.dhSro) {
          const [dPart, tPart] = item.dhSro.split(' ');
          if (dPart && tPart) {
            const [dia, mes, ano] = dPart.split('/');
            isoDh = `${ano}-${mes}-${dia}T${tPart}`;
          }
        }
        const sitColor = item.sitSro
          ? getSroStatusColor(item.sitSro)
          : '#94a3b8';
        return `<tr data-obj="${item.obj}" style="border-bottom:1px solid #e2e8f0;background:${idx % 2 === 0 ? '#fff' : '#f8fafc'}">
        <td style="padding:12px 20px;font-weight:bold;font-size:13px"><a href="${SROINTRANET_ORIGIN}/rastreamento?objetos=${item.obj}" target="_blank" style="text-decoration:none;color:#00416B">${item.obj}</a></td>
        <td style="padding:12px 20px;font-weight:700;font-size:12px">${item.mot}</td>
        <td style="padding:12px 20px;color:${sitColor};font-weight:${item.sitSro ? '800' : '500'};font-size:11px;text-transform:uppercase">${item.sitSro ?? 'Aguardando SRO...'}</td>
        <td style="padding:12px 20px;color:#64748b;font-weight:600;font-size:12px">${item.dhSro ?? '--'}</td>
        <td style="padding:12px 20px;text-align:center">${isoDh ? `<button class="ct-btn-img" data-obj="${item.obj}" data-dh="${isoDh}" style="background:#10b981;border:none;border-radius:4px;color:#fff;padding:6px 10px;cursor:pointer;font-weight:bold;font-size:11px">VER</button>` : '--'}</td>
      </tr>`;
      })
      .join('');

    store.modalRenderId = Symbol();
    const myRenderId = store.modalRenderId;
    const progDiv = document.getElementById('ct-sro-progress');
    const toFetch = filteredList.filter((i) => {
      const ck = store.sroIntranetCache[i.obj];
      if (ck?.sit) {
        i.sitSro = ck.sit;
        i.dhSro = ck.dh;
        return false;
      }
      return true;
    });

    return new Promise<void>((resolve) => {
      if (!toFetch.length) {
        if (progDiv) {
          progDiv.style.cssText +=
            'background:#f0fdf4;color:#15803d;border-color:#bbf7d0';
          progDiv.innerHTML = `✅ Todos os ${filteredList.length} objetos visíveis carregados.`;
        }
        resolve();
        return;
      }

      if (progDiv)
        progDiv.innerHTML = `⏳ Sincronizando com SRO Intranet: <span id="ct-sro-count">0</span> / ${toFetch.length} novos objetos...`;

      batchFetchSroIntranet({
        fetchFn: fetchProxy,
        objects: toFetch.map((i) => i.obj),
        existingCache: store.sroIntranetCache,
        renderId: myRenderId,
        getRenderId: () => store.modalRenderId,
        onBatchDone: (resolved, done) => {
          if (store.modalRenderId !== myRenderId) return;
          store.sroIntranetCache = mergeSroCache(
            store.sroIntranetCache,
            resolved
          );
          for (const [obj, entry] of Object.entries(resolved)) {
            const tr = tbody.querySelector<HTMLElement>(
              `tr[data-obj="${obj}"]`
            );
            if (tr) {
              const tds = tr.querySelectorAll('td');
              if (tds.length >= 4) {
                (tds[2] as HTMLElement).innerText = entry.sit;
                (tds[2] as HTMLElement).style.color = getSroStatusColor(
                  entry.sit
                );
                (tds[3] as HTMLElement).innerText = entry.dh;
              }
            }
          }
          const lbl = document.getElementById('ct-sro-count');
          if (lbl) lbl.innerText = String(done);
        },
        onComplete: () => {
          if (store.modalRenderId === myRenderId && progDiv) {
            progDiv.style.cssText +=
              'background:#f0fdf4;color:#15803d;border-color:#bbf7d0';
            progDiv.innerHTML = `✅ Todos os ${filteredList.length} objetos visíveis carregados.`;
          }
          resolve();
        }
      });
    });
  };

  txtFilter.addEventListener('input', () => {
    renderTable();
  });
  sortFilter.addEventListener('change', () => {
    renderTable();
  });
  chks.forEach((chk) =>
    chk.addEventListener('change', () => {
      renderTable();
    })
  );
  document.getElementById('ct-cat-all')!.addEventListener('click', () => {
    chks.forEach((c) => (c.checked = true));
    renderTable();
  });
  document.getElementById('ct-cat-none')!.addEventListener('click', () => {
    chks.forEach((c) => (c.checked = false));
    renderTable();
  });
  renderTable();

  let lastExportClick = 0;
  body.addEventListener('click', (e) => {
    const btnImg = (e.target as HTMLElement).closest<HTMLElement>(
      '.ct-btn-img'
    );
    const btnExport = (e.target as HTMLElement).closest<HTMLElement>(
      '.ct-btn-export'
    );
    const btnCopy = (e.target as HTMLElement).closest<HTMLElement>(
      '.ct-btn-copy'
    );

    if (btnImg) {
      openImageViewer(btnImg.dataset.obj!, btnImg.dataset.dh!);
      return;
    }

    if (btnExport || btnCopy) {
      if (Date.now() - lastExportClick < 1000) return;
      lastExportClick = Date.now();
      const target = btnExport ?? btnCopy!;
      const cat = target.dataset.cat!;
      const catList = list.filter((i) => i.mot === cat).map((i) => i.obj);
      const header = `Nome: ${d.correios_nomeCarteiro ?? 'N/A'} - Matrícula: ${d.correios_matriculaCarteiro ?? '00000000'} - Unidade: ${d.correios_codigoSro ?? '00000000'} - Quantidade: ${catList.length} - Categoria: ${cat}`;
      const content = [header, ...catList].join('\r\n');
      if (btnCopy) {
        navigator.clipboard.writeText(content);
      } else {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${d.correios_codigoSro ?? '00000000'}_${d.correios_matriculaCarteiro ?? '00000000'}_${cat.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  });

  const Chart = (window as any)['Chart'];
  if (Chart) {
    new Chart(document.getElementById(cid), {
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
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, font: { family: 'system-ui', size: 11 } }
          }
        }
      }
    });
  }
}
