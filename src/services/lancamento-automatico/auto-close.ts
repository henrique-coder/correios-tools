import { STORAGE_KEYS } from '../../shared/constants/storage-keys.js';

let autoCloseEnabled =
  window.localStorage.getItem(STORAGE_KEYS.AUTO_CLOSE_PRINT) !== '0';
let atcTimer: ReturnType<typeof setInterval> | null = null;
let okTimer: ReturnType<typeof setInterval> | null = null;

export function isAutoCloseEnabled(): boolean {
  return autoCloseEnabled;
}

export function setAutoClose(enabled: boolean): void {
  autoCloseEnabled = enabled;
  window.localStorage.setItem(
    STORAGE_KEYS.AUTO_CLOSE_PRINT,
    enabled ? '1' : '0'
  );
}

function stopWatchers(): void {
  if (atcTimer) {
    clearInterval(atcTimer);
    atcTimer = null;
  }
  if (okTimer) {
    clearInterval(okTimer);
    okTimer = null;
  }
}

export function triggerAutoClose(): void {
  if (!autoCloseEnabled) {
    stopWatchers();
    return;
  }

  stopWatchers();
  let tries = 0;

  atcTimer = setInterval(() => {
    const btn = document.getElementById('btnImprimirEtiquetaNao');
    if (btn && btn.offsetParent !== null) {
      btn.click();
      btn.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        })
      );
      clearInterval(atcTimer!);
      atcTimer = null;

      let waitTries = 0;
      okTimer = setInterval(() => {
        const ok = document.querySelector<HTMLElement>('#alerta.aberto .act a');
        if (ok?.innerText === 'OK') {
          ok.click();
          clearInterval(okTimer!);
          okTimer = null;
        }
        if (++waitTries >= 50 && okTimer) {
          clearInterval(okTimer!);
          okTimer = null;
        }
      }, 100);
    }
    if (++tries >= 50 && atcTimer) {
      clearInterval(atcTimer!);
      atcTimer = null;
    }
  }, 200);
}
