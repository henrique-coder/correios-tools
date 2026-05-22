type ResponseHandler = (url: string, data: unknown) => void;

const DEBUG_STORAGE_KEY = 'cw-debug';

function logDebug(message: string, error?: unknown): void {
  if (window.localStorage.getItem(DEBUG_STORAGE_KEY) !== '1') return;
  if (error) console.warn('[Correios Wizard]', message, error);
  else console.warn('[Correios Wizard]', message);
}

const handlers: ResponseHandler[] = [];
let isPatched = false;

function patchFetch(): void {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = args[0] ? args[0].toString() : '';
      if (url.toLowerCase().includes('controller.php')) {
        response
          .clone()
          .json()
          .then((data) => handlers.forEach((h) => h(url, data)))
          .catch((err) => logDebug('Failed to parse fetch response', err));
      }
    } catch {}
    return response;
  };
}

function patchXhr(): void {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
    const u = url?.toString() ?? '';
    (this as any)._cwUrl = u;

    // Trigger hooks
    const lowerUrl = u.toLowerCase();
    triggers.forEach(({ fragment, cb }) => {
      if (lowerUrl.includes(fragment)) cb();
    });

    return originalOpen.apply(this, arguments as any);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (!this._cwLoadListenerAdded) {
      this.addEventListener('load', function () {
        const url = (this as any)._cwUrl as string;
        if (!url?.toLowerCase().includes('controller.php')) return;
        try {
          const parsed = JSON.parse(this.responseText);
          handlers.forEach((h) => h(url, parsed));
        } catch (err) {
          logDebug('Failed to parse XHR response', err);
        }
      });
      this._cwLoadListenerAdded = true;
    }
    return originalSend.apply(this, arguments as any);
  };
}

export function registerFetchInterceptor(handler: ResponseHandler): void {
  if (!handlers.includes(handler)) {
    handlers.push(handler);
  }

  if (!isPatched) {
    patchFetch();
    patchXhr();
    isPatched = true;
  }
}

const triggers: { fragment: string; cb: () => void }[] = [];

export function registerXhrTrigger(
  urlFragment: string,
  trigger: () => void
): void {
  triggers.push({ fragment: urlFragment.toLowerCase(), cb: trigger });

  // Se o patch ainda não foi aplicado (ex: chamou trigger antes do interceptor),
  // aplica agora. Os hooks do trigger já estão incluídos no patchXhr.
  if (!isPatched) {
    patchFetch();
    patchXhr();
    isPatched = true;
  }
}
