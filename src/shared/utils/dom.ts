export function waitForElement<T extends HTMLElement>(
  selector: string,
  interval = 500,
  maxTries = 60
): Promise<T> {
  return new Promise((resolve, reject) => {
    const el = document.querySelector<T>(selector);
    if (el) {
      resolve(el);
      return;
    }

    let tries = 0;
    const id = setInterval(() => {
      const found = document.querySelector<T>(selector);
      if (found) {
        clearInterval(id);
        resolve(found);
        return;
      }
      if (++tries >= maxTries) {
        clearInterval(id);
        reject(new Error(`Element not found: ${selector}`));
      }
    }, interval);
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
