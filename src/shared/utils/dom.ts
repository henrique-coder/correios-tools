export function waitForElement<T extends HTMLElement>(
  selector: string,
  interval = 500,
  maxTries = 60
): Promise<T> {
  const timeoutMs = interval * maxTries;
  return new Promise((resolve, reject) => {
    const found = document.querySelector<T>(selector);
    if (found) {
      resolve(found);
      return;
    }

    let done = false;
    const observer = new MutationObserver(() => {
      const el = document.querySelector<T>(selector);
      if (!el) return;
      done = true;
      observer.disconnect();
      clearTimeout(timeoutId);
      resolve(el);
    });

    const timeoutId = setTimeout(() => {
      if (done) return;
      observer.disconnect();
      reject(new Error(`Element not found: ${selector}`));
    }, timeoutMs);

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  });
}

export function ensureElement(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function injectStyles(id: string, css: string): void {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function openTextInNewTab(content: string, revokeDelayMs = 30000): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), revokeDelayMs);
}

export function startButtonCooldown(
  button: HTMLButtonElement,
  seconds: number,
  formatLabel: (left: number) => string,
  finalLabel: string
): void {
  let left = seconds;
  button.disabled = true;
  button.innerText = formatLabel(left);
  const iv = setInterval(() => {
    left--;
    if (left <= 0) {
      clearInterval(iv);
      button.disabled = false;
      button.innerText = finalLabel;
      return;
    }
    button.innerText = formatLabel(left);
  }, 1000);
}
