import type { LoecStore } from '../state.js';
import { getArchiveFilters, getFilteredObjs } from './fetch-objects.js';
import { parseDistrito } from '../../../shared/utils/format.js';

export function refreshSroMasterFilters(
  store: LoecStore,
  resetAll = false
): void {
  const data = store.archiveLastData;
  if (!data?.objs) return;

  const filters = getArchiveFilters();
  const preFiltered = data.objs.filter((o) => {
    if (filters.dist && o.district !== filters.dist) return false;
    if (filters.grade || filters.side) {
      const p = parseDistrito(o.district ?? '');
      if (filters.grade && p.grade !== filters.grade) return false;
      if (filters.side && p.side !== filters.side) return false;
    }
    return true;
  });

  const availableSits = new Set<string>();
  preFiltered.forEach((o) => {
    const s = store.sroIntranetCache[o.trackingCode ?? ''];
    if (s?.sit) availableSits.add(s.sit.toUpperCase());
  });

  const listEl = document.getElementById('ct-arq-sro-multi-list');
  const labelEl = document.getElementById('ct-arq-sro-multi-select-label');
  if (!listEl || !labelEl) return;

  const sorted = Array.from(availableSits).sort();
  const sortedJoined = sorted.join('|');
  const currentJoined = listEl.dataset.sits || '';

  const currentUnchecked = new Set<string>();
  if (!resetAll) {
    document
      .querySelectorAll<HTMLInputElement>('.ct-arq-sro-chk')
      .forEach((c) => {
        if (!c.checked) currentUnchecked.add(c.value);
      });
  }

  const updateLabel = () => {
    const boxes =
      document.querySelectorAll<HTMLInputElement>('.ct-arq-sro-chk');
    const total = boxes.length;
    const checked = Array.from(boxes).filter((b) => b.checked).length;
    if (!total) labelEl.innerText = 'Nenhuma situação carregada';
    else if (checked === total)
      labelEl.innerText = `Todas as ${total} situações selecionadas`;
    else labelEl.innerText = `${checked} de ${total} situações selecionadas`;
  };

  if (!sorted.length) {
    labelEl.innerText = 'Nenhuma situação SRO carregada.';
    listEl.innerHTML =
      '<div style="padding:4px 8px;font-size:12px;color:#94a3b8">Nenhuma situação SRO carregada.</div>';
    listEl.dataset.sits = '';
    return;
  }

  if (sortedJoined !== currentJoined || resetAll) {
    listEl.innerHTML = sorted
      .map((sit) => {
        const checked = !currentUnchecked.has(sit) ? 'checked' : '';
        return `<label style="display:flex;align-items:center;gap:6px;padding:4px 8px;cursor:pointer;font-size:12px;color:#334155;transition:.1s" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='transparent'">
        <input type="checkbox" class="ct-arq-sro-chk" value="${sit}" ${checked}><span>${sit}</span></label>`;
      })
      .join('');
    listEl.dataset.sits = sortedJoined;

    document
      .querySelectorAll<HTMLInputElement>('.ct-arq-sro-chk')
      .forEach((c) => {
        c.addEventListener('change', () => {
          updateLabel();
          renderArqTable(store, async () => '');
        });
      });
  }

  updateLabel();
}

export function populateFilterDropdowns(store: LoecStore): void {
  const data = store.archiveLastData;
  if (!data?.objs) return;

  const allObjs = data.objs;
  const dists = [...new Set(allObjs.map((o) => o.district ?? ''))].sort();
  const grades = [
    ...new Set(
      allObjs.map((o) => parseDistrito(o.district ?? '').grade).filter(Boolean)
    )
  ].sort();
  const sides = [
    ...new Set(
      allObjs.map((o) => parseDistrito(o.district ?? '').side).filter(Boolean)
    )
  ].sort();

  const distEl = document.getElementById(
    'ct-arq-dist-filter'
  ) as HTMLSelectElement | null;
  const gradeEl = document.getElementById(
    'ct-arq-grade-filter'
  ) as HTMLSelectElement | null;
  const sideEl = document.getElementById(
    'ct-arq-side-filter'
  ) as HTMLSelectElement | null;

  if (distEl)
    distEl.innerHTML =
      '<option value="">Todos os Distritos</option>' +
      dists.map((d) => `<option value="${d}">${d}</option>`).join('');
  if (gradeEl)
    gradeEl.innerHTML =
      '<option value="">Todas as Grades</option>' +
      grades.map((g) => `<option value="${g}">Grade ${g}</option>`).join('');
  if (sideEl)
    sideEl.innerHTML =
      '<option value="">Todos os Lados</option>' +
      sides.map((s) => `<option value="${s}">Lado ${s}</option>`).join('');
}
