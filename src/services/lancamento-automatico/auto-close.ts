import { DOM_IDS, DOM_SELECTORS } from '../../shared/constants/dom-elements.js';
import { STORAGE_KEYS } from '../../shared/constants/storage-keys.js';

let autoCloseEnabled =
  window.localStorage.getItem(STORAGE_KEYS.AUTO_CLOSE_PRINT) !== '0';

let observer: MutationObserver | null = null;
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
  if (enabled) {
    startObserver();
  } else {
    stopObserver();
  }
}

function stopObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (okTimer) {
    clearInterval(okTimer);
    okTimer = null;
  }
}

function clickOkButton() {
  if (okTimer) clearInterval(okTimer);
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

function startObserver(): void {
  if (observer || !document.body) return;

  observer = new MutationObserver(() => {
    if (!autoCloseEnabled) return;

    const btn = document.getElementById(DOM_IDS.PRINT_NO_BUTTON);
    if (btn && btn.offsetParent !== null) {
      btn.click();
      clickOkButton();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

export function triggerAutoClose(): void {
  if (!autoCloseEnabled) {
    stopObserver();
    return;
  }

  if (document.body) {
    startObserver();

    const btn = document.getElementById(DOM_IDS.PRINT_NO_BUTTON);
    if (btn && btn.offsetParent !== null) {
      btn.click();
      clickOkButton();
    }
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      triggerAutoClose();
    });
  }
}
