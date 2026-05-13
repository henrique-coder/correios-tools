import {
  CEP_INPUT_SELECTORS,
  DOM_IDS,
  DOM_SELECTORS
} from '../../shared/constants/dom-elements.js';
import {
  registerFetchInterceptor,
  registerXhrTrigger
} from '../../shared/fetch/interceptor.js';
import {
  isAutoCloseEnabled,
  setAutoClose,
  triggerAutoClose
} from './auto-close.js';
import { registerKeyboardCommands } from './keyboard.js';
import { handleControllerResponse } from './response-handler.js';
import { createDefaultState, type DispatchState } from './state.js';
import { renderPanel, syncAutoCloseButton } from './ui/panel.js';
import { injectTable, updateTable } from './ui/table.js';
import { showTrackingOverlay } from './ui/tracking-modal.js';

export function runAutoDispatchService(
  fetchProxy: (url: string, options?: any) => Promise<string>
): void {
  const stateRef = { current: createDefaultState() };

  const render = () => {
    renderPanel(stateRef.current, () => {
      const newVal = !isAutoCloseEnabled();
      setAutoClose(newVal);
      syncAutoCloseButton(newVal);
      if (newVal) triggerAutoClose();
    });
    syncAutoCloseButton(isAutoCloseEnabled());
    updateTable(stateRef.current);
  };

  registerKeyboardCommands(stateRef);

  registerFetchInterceptor((url, data) => {
    handleControllerResponse(url, data, stateRef, render);
  });

  registerXhrTrigger('listar-impressoras-disponiveis', triggerAutoClose);

  function setupWatchers(): void {
    injectTable();

    const inp = document.getElementById(
      DOM_IDS.OBJECT_INPUT
    ) as HTMLInputElement | null;
    if (!inp) {
      setTimeout(setupWatchers, 1000);
      return;
    }

    let currentUnitName = '';
    const unitEl = document.querySelector<HTMLElement>(DOM_SELECTORS.UNIT_NAME);
    if (unitEl && unitEl.innerText) {
      const match = unitEl.innerText.match(/^\s*\d{8}\s*-\s*([^|/]+)/);
      if (match) currentUnitName = match[1].trim().toUpperCase();
    }

    window.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'ArrowUp') {
          if (isCepInputActive()) {
            return;
          }

          e.preventDefault();
          e.stopImmediatePropagation();

          let obj = inp.value.trim().toUpperCase();
          if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(obj) && !/^\d{9}$/.test(obj)) {
            obj = ''; // Empty or invalid, pass empty to open manual search
          }

          showTrackingOverlay(obj, currentUnitName, fetchProxy);
        }
      },
      true
    );
    let lastInputValue = inp.value;
    const parent =
      inp.closest(DOM_SELECTORS.FIELD_CONTAINER) ?? inp.parentElement;

    if (parent) {
      inp.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        setTimeout(() => {
          const msg = parent.querySelector<HTMLElement>(
            DOM_SELECTORS.FIELD_MESSAGE
          );
          if (msg && msg.innerText.trim().length > 0)
            refocusInput(inp, lastInputValue, (v) => {
              lastInputValue = v;
            });
        }, 300);
      });

      new MutationObserver(() => {
        const msg = parent.querySelector<HTMLElement>(
          DOM_SELECTORS.FIELD_MESSAGE
        );
        if (
          msg &&
          msg.innerText.trim().length > 0 &&
          inp.value !== lastInputValue
        )
          refocusInput(inp, lastInputValue, (v) => {
            lastInputValue = v;
          });
      }).observe(parent, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    const sel = document.getElementById(
      DOM_IDS.DISTRICT_SELECT
    ) as HTMLSelectElement | null;
    if (!sel) {
      setTimeout(() => setupDistrictWatcher(stateRef, render), 1000);
    } else setupDistrictWatcher(stateRef, render);

    triggerAutoClose();
    render();

    document.body.addEventListener('change', (e) => {
      if ((e.target as HTMLElement)?.id === DOM_IDS.GRADE_SELECT)
        triggerAutoClose();
    });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', setupWatchers);
  else setupWatchers();
}

function isCepInputActive(): boolean {
  const active = document.activeElement;
  if (!active || !(active instanceof Element)) return false;
  return CEP_INPUT_SELECTORS.some((selector) => active.matches(selector));
}

function refocusInput(
  input: HTMLInputElement,
  lastValue: string,
  setLast: (v: string) => void
): void {
  if (
    document.activeElement !== document.getElementById(DOM_IDS.DISTRICT_SELECT)
  ) {
    input.click();
    input.focus();
    setLast(input.value);
  }
}

function setupDistrictWatcher(
  stateRef: { current: DispatchState },
  render: () => void
): void {
  const sel = document.getElementById(
    DOM_IDS.DISTRICT_SELECT
  ) as HTMLSelectElement | null;
  if (!sel) {
    setTimeout(() => setupDistrictWatcher(stateRef, render), 1000);
    return;
  }

  const update = () => {
    const opt = sel.options?.[sel.selectedIndex];
    let v = opt ? opt.text : sel.value;
    if (v?.includes(' - ')) v = v.split(' - ')[0];
    stateRef.current.domDistrict =
      v && v.trim() !== '' && v !== 'Selecione...' ? v.trim() : '';
    render();
  };

  sel.addEventListener('change', update);
  sel.addEventListener('input', update);
  new MutationObserver(update).observe(sel, {
    childList: true,
    attributes: true,
    characterData: true,
    subtree: true
  });
}
