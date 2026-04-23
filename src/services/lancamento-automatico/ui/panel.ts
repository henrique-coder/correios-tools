import type { DispatchState } from '../state.js';
import {
  formatTrackingCode,
  formatCarimbo,
  buildMapUrl
} from '../../../shared/utils/format.js';
import { injectStyles } from '../../../shared/utils/dom.js';
import { PANEL_STYLES_ID, PANEL_CSS } from './panel-styles.js';
import {
  createDragState,
  attachDraggable,
  applyPosition,
  clampToBounds
} from '../../../shared/ui/draggable.js';
import { STORAGE_KEYS } from '../../../shared/constants/storage-keys.js';

let dragState = createDragState();

function buildDistrictHtml(state: DispatchState, inline: boolean): string {
  const current =
    (state.domDist && state.domDist !== ''
      ? state.domDist
      : state.district
    )?.trim() ?? '';
  if (state.initialDist && state.initialDist !== current && current !== '--') {
    const cls = inline
      ? ['sro-old', 'sro-arrow', 'sro-new']
      : ['sro-old-p', 'sro-arrow-p', 'sro-new-p'];
    const pStyle = inline
      ? ''
      : 'opacity:.5;font-weight:normal;margin-right:2px;font-size:.9em';
    const aStyle = inline ? '' : 'margin:0 4px;font-size:.9em;color:#666';
    return `<span class="${cls[0]}" style="${pStyle}">${state.initialDist}</span><span class="${cls[1]}" style="${aStyle}">&#10142;</span><span class="${cls[2]}">${current}</span>`;
  }
  const cls = inline ? 'sro-new' : 'sro-new-p';
  return `<span class="${cls}">${current || '--'}</span>`;
}

function savePosition(): void {
  window.localStorage.setItem(
    STORAGE_KEYS.PANEL_POSITION,
    JSON.stringify({ x: dragState.offsetX, y: dragState.offsetY })
  );
}

function loadPosition(container: HTMLElement): void {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS.PANEL_POSITION) ?? '{}'
    );
    if (parsed && typeof parsed.x === 'number') {
      dragState.offsetX = parsed.x;
      dragState.offsetY = parsed.y;
      applyPosition(container, dragState);
    }
  } catch {}
}

export function renderPanel(
  state: DispatchState,
  onAutoClose?: () => void
): void {
  injectStyles(PANEL_STYLES_ID, PANEL_CSS);

  let container = document.getElementById('sro-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'sro-container';
    container.innerHTML = `
      <div id="sro-card" class="sro-card mode-loading">
        <div id="sro-header" class="sro-header" title="Segure para mover">
          <div class="sro-status-block">
            <span id="sro-icon" class="sro-icon">⏳</span>
            <span id="sro-status" class="sro-status-text">AGUARDANDO...</span>
          </div>
          <div class="sro-btn-group">
            <button id="cw-auto-close-print-toggle" type="button"
              style="width:24px;height:24px;padding:0;font-size:12px;border:1px solid #cbd5e1;border-radius:999px;background:#f1f5f9;color:#64748b;cursor:pointer;line-height:1;display:inline-flex;align-items:center;justify-content:center;">⎙</button>
          </div>
        </div>
        <div class="sro-body">
          <div id="sro-tracking" style="font-size:13px;color:#888;font-weight:700;letter-spacing:.5px;margin-bottom:2px;min-height:16px"></div>
          <div id="sro-distrito" class="sro-distrito">--</div>
          <div style="font-size:12px;color:#666;margin-top:4px">PREVISÃO: <strong id="sro-previsao" style="color:#333">--/--/----</strong></div>
        </div>
      </div>`;
    document.body.appendChild(container);

    loadPosition(container);
    attachDraggable(
      document.getElementById('sro-header')!,
      container,
      dragState,
      savePosition,
      savePosition
    );

    const toggleBtn = document.getElementById('cw-auto-close-print-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('mouseenter', () => {
        toggleBtn.style.transform = 'translateY(-1px) scale(1.04)';
      });
      toggleBtn.addEventListener('mouseleave', () => {
        toggleBtn.style.transform = 'none';
      });
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onAutoClose?.();
      });
    }
  }

  const card = document.getElementById('sro-card');
  if (!card) return;

  const iconMap: Record<string, string> = {
    success: '✅',
    error: '⛔',
    info: '⚠️'
  };
  card.className = `sro-card visible mode-${state.mode}`;
  document.getElementById('sro-status')!.innerText = state.status;
  document.getElementById('sro-icon')!.innerText = iconMap[state.mode] ?? '⏳';
  document.getElementById('sro-tracking')!.innerHTML =
    state.code !== '--' ? formatTrackingCode(state.code) : '';
  document.getElementById('sro-distrito')!.innerHTML = buildDistrictHtml(
    state,
    true
  );
  document.getElementById('sro-previsao')!.innerText =
    state.date || '--/--/----';
}

export function syncAutoCloseButton(enabled: boolean): void {
  const btn = document.getElementById(
    'cw-auto-close-print-toggle'
  ) as HTMLButtonElement | null;
  if (!btn) return;

  btn.innerText = '🖨';
  btn.style.opacity = enabled ? '0.82' : '1';
  btn.style.background = enabled ? '#f1f5f9' : '#fef2f2';
  btn.style.borderColor = enabled ? '#cbd5e1' : '#fecaca';
  btn.style.color = enabled ? '#64748b' : '#b91c1c';
  btn.style.boxShadow = enabled
    ? 'inset 0 0 0 1px rgba(100,116,139,.16)'
    : 'inset 0 0 0 1px rgba(220,38,38,.14)';
  btn.style.transition =
    'transform 120ms ease,box-shadow 120ms ease,opacity 120ms ease,background 120ms ease,border-color 120ms ease,color 120ms ease';
  btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  btn.title = enabled
    ? 'Fechamento automático de popups de impressão: habilitado'
    : 'Fechamento automático de popups de impressão: desabilitado';
}
