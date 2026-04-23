import { renderPanel } from './ui/panel.js';
import { updateTable } from './ui/table.js';

let lastInputValue: string | null = null;

function refocusInput(input: HTMLInputElement): void {
  if (document.activeElement !== document.getElementById('selDistrito')) {
    input.click();
    input.focus();
    lastInputValue = input.value;
  }
}

export function watchObjectInput(render: () => void): void {
  const inp = document.getElementById('txtObjeto') as HTMLInputElement | null;
  if (!inp) {
    setTimeout(() => watchObjectInput(render), 1000);
    return;
  }

  lastInputValue = inp.value;
  const parent = inp.closest('.campo') ?? inp.parentElement;
  if (!parent) return;

  inp.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    setTimeout(() => {
      const msg = parent.querySelector('.mensagem') as HTMLElement | null;
      if (msg && msg.innerText.trim().length > 0) refocusInput(inp);
    }, 300);
  });

  new MutationObserver(() => {
    const msg = parent.querySelector('.mensagem') as HTMLElement | null;
    if (msg && msg.innerText.trim().length > 0 && inp.value !== lastInputValue)
      refocusInput(inp);
  }).observe(parent, { childList: true, subtree: true, characterData: true });
}

export function watchDistrictSelect(render: () => void): void {
  const sel = document.getElementById(
    'selDistrito'
  ) as HTMLSelectElement | null;
  if (!sel) {
    setTimeout(() => watchDistrictSelect(render), 1000);
    return;
  }

  const updateDomDist = (stateRef: { domDist: string | null }) => {
    const opt = sel.options?.[sel.selectedIndex];
    let v = opt ? opt.text : sel.value;
    if (v?.includes(' - ')) v = v.split(' - ')[0];
    stateRef.domDist =
      v && v.trim() !== '' && v !== 'Selecione...' ? v.trim() : '';
    render();
  };

  return;
}

export function getLastInputValue(): string | null {
  return lastInputValue;
}
