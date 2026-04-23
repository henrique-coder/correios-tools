import { createDefaultState, type DispatchState } from './state.js';
import { registerKeyboardCommands } from './keyboard.js';
import { handleControllerResponse } from './response-handler.js';
import {
  registerFetchInterceptor,
  registerXhrTrigger
} from '../../shared/fetch/interceptor.js';
import { renderPanel, syncAutoCloseButton } from './ui/panel.js';
import { injectTable, updateTable } from './ui/table.js';
import {
  triggerAutoClose,
  isAutoCloseEnabled,
  setAutoClose
} from './auto-close.js';
import { STORAGE_KEYS } from '../../shared/constants/storage-keys.js';

export function runAutoDispatchService(
  fetchProxy: (url: string) => Promise<string>
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

    const inp = document.getElementById('txtObjeto') as HTMLInputElement | null;
    if (!inp) {
      setTimeout(setupWatchers, 1000);
      return;
    }

    let lastInputValue = inp.value;
    const parent = inp.closest('.campo') ?? inp.parentElement;

    if (parent) {
      inp.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        setTimeout(() => {
          const msg = parent.querySelector<HTMLElement>('.mensagem');
          if (msg && msg.innerText.trim().length > 0)
            refocusInput(inp, lastInputValue, (v) => {
              lastInputValue = v;
            });
        }, 300);
      });

      new MutationObserver(() => {
        const msg = parent.querySelector<HTMLElement>('.mensagem');
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
      'selDistrito'
    ) as HTMLSelectElement | null;
    if (!sel) {
      setTimeout(() => setupDistrictWatcher(stateRef, render), 1000);
    } else setupDistrictWatcher(stateRef, render);

    triggerAutoClose();
    render();

    document.body.addEventListener('change', (e) => {
      if ((e.target as HTMLElement)?.id === 'selGrade') triggerAutoClose();
    });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', setupWatchers);
  else setupWatchers();
}

function refocusInput(
  input: HTMLInputElement,
  lastValue: string,
  setLast: (v: string) => void
): void {
  if (document.activeElement !== document.getElementById('selDistrito')) {
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
    'selDistrito'
  ) as HTMLSelectElement | null;
  if (!sel) {
    setTimeout(() => setupDistrictWatcher(stateRef, render), 1000);
    return;
  }

  const update = () => {
    const opt = sel.options?.[sel.selectedIndex];
    let v = opt ? opt.text : sel.value;
    if (v?.includes(' - ')) v = v.split(' - ')[0];
    stateRef.current.domDist =
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
