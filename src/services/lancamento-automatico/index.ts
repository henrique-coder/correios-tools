import {
  CEP_INPUT_SELECTORS,
  DOM_IDS,
  DOM_SELECTORS
} from '../../shared/constants/dom-elements.js';
import {
  registerFetchInterceptor,
  registerXhrTrigger
} from '../../shared/fetch/interceptor.js';
import { waitForElement } from '../../shared/utils/dom.js';
import {
  isAutoCloseEnabled,
  setAutoClose,
  triggerAutoClose
} from './auto-close.js';
import { isAutoInductionGuardActive } from './commands.js';
import { registerKeyboardCommands } from './keyboard.js';
import { handleControllerResponse } from './response-handler.js';
import { createDefaultState, type DispatchState } from './state.js';
import { showCepSearchOverlay } from './ui/cep-search-modal.js';
import { renderPanel, syncAutoCloseButton } from './ui/panel.js';
import { injectTable, updateTable } from './ui/table.js';
import { showTrackingOverlay } from './ui/tracking-modal.js';

export function runAutoDispatchService(
  fetchProxy: (url: string, options?: any) => Promise<string>
): void {
  const stateRef = { current: createDefaultState() };

  const render = () => {
    renderPanel(
      stateRef.current,
      () => {
        const newVal = !isAutoCloseEnabled();
        setAutoClose(newVal);
        syncAutoCloseButton(newVal);
        if (newVal) triggerAutoClose();
      },
      () => {
        const txtObj = document.getElementById(
          DOM_IDS.OBJECT_INPUT
        ) as HTMLInputElement;
        let obj = txtObj ? txtObj.value.trim().toUpperCase() : '';
        if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(obj) && !/^\d{9}$/.test(obj)) {
          obj = '';
        }

        let currentUnitName = '';
        const unitEl = document.querySelector<HTMLElement>(
          DOM_SELECTORS.UNIT_NAME
        );
        if (unitEl && unitEl.innerText) {
          const match = unitEl.innerText.match(/^\s*\d{8}\s*-\s*([^|/]+)/);
          if (match) currentUnitName = match[1].trim().toUpperCase();
        }

        showTrackingOverlay(obj, currentUnitName, fetchProxy);
      },
      () => {
        showCepSearchOverlay(fetchProxy);
      }
    );
    syncAutoCloseButton(isAutoCloseEnabled());
    updateTable(stateRef.current);
  };

  registerKeyboardCommands(stateRef);

  registerFetchInterceptor((url, data) => {
    handleControllerResponse(url, data, stateRef, render);
  });

  registerXhrTrigger('listar-impressoras-disponiveis', triggerAutoClose);

  async function setupWatchers(): Promise<void> {
    triggerAutoClose();
    injectTable();

    let inp: HTMLInputElement;
    try {
      inp = await waitForElement<HTMLInputElement>(
        `#${DOM_IDS.OBJECT_INPUT}`,
        200,
        150
      );
    } catch {
      setTimeout(() => {
        setupWatchers().catch(() => undefined);
      }, 1000);
      return;
    }

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

    waitForElement<HTMLSelectElement>(`#${DOM_IDS.DISTRICT_SELECT}`, 200, 150)
      .then((sel) => setupDistrictWatcher(stateRef, render, sel))
      .catch(() => undefined);

    render();

    document.body.addEventListener('change', (e) => {
      if ((e.target as HTMLElement)?.id === DOM_IDS.GRADE_SELECT)
        triggerAutoClose();
    });
  }

  setupWatchers().catch(() => undefined);
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
  if (isAutoInductionGuardActive()) return;
  if (document.activeElement?.id === DOM_IDS.ADDRESS_NUMBER_INPUT) return;
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
  render: () => void,
  sel: HTMLSelectElement
): void {
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
