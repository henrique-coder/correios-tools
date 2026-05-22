import { parseNumber } from '../../../shared/utils/format.js';
import type { DistrictData } from '../state.js';
import type { LoecStore } from '../state.js';

export function renderDistrictGrid(
  grid: HTMLElement,
  districts: DistrictData[],
  modal: HTMLElement,
  store: LoecStore,
  fetchProxy: (url: string) => Promise<string>,
  onCardClick: (district: DistrictData) => void
): void {
  grid.innerHTML = '';

  for (const d of districts) {
    const card = document.createElement('div');
    card.style.cssText =
      'background:#fff;border:1px solid #e2e8f0;padding:10px 15px;border-radius:6px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.05);transition:all .2s;display:flex;flex-direction:column;justify-content:center;';

    card.onmouseover = () => {
      card.style.borderColor = '#3b82f6';
      card.style.transform = 'translateY(-2px)';
    };
    card.onmouseout = () => {
      card.style.borderColor = '#e2e8f0';
      card.style.transform = 'translateY(0)';
    };

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:24px;font-weight:900;color:#0f172a;line-height:1">${d.correios_numeroDistrito}</div>
        <div style="display:flex;gap:6px;background:#f8fafc;padding:4px 8px;border-radius:4px;border:1px solid #f1f5f9">
          <span style="color:#ef4444;font-size:12px;font-weight:bold">ATR:${parseNumber(d.correios_qtdeVencido)}</span>
          <span style="color:#f97316;font-size:12px;font-weight:bold">HOJE:${parseNumber(d.correios_qtdeHoje)}</span>
          <span style="color:#10b981;font-size:12px;font-weight:bold">NO PRAZO:${parseNumber(d.correios_qtdeAVencer)}</span>
        </div>
      </div>
      <div style="font-size:13px;color:#333;font-weight:800;word-break:break-word;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden" title="${d.correios_nomeCarteiro ?? 'CARTEIRO NÃO INFORMADO'}">${d.correios_nomeCarteiro ?? 'CARTEIRO NÃO INFORMADO'}</div>`;

    card.onclick = () => onCardClick(d);
    grid.appendChild(card);
  }
}
