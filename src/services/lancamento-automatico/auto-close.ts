import { DOM_IDS, DOM_SELECTORS } from '../../shared/constants/dom-elements.js';
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
  window.addEventListener('pagehide', stopWatchers, { once: true });
  let tries = 0;

  atcTimer = setInterval(() => {
    const btn = document.getElementById(DOM_IDS.PRINT_NO_BUTTON);
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
        const ok = document.querySelector<HTMLElement>(
          DOM_SELECTORS.ALERT_OK_BUTTON
        );
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
