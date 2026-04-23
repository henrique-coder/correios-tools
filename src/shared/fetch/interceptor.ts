type ResponseHandler = (url: string, data: unknown) => void;

function patchFetch(handler: ResponseHandler): void {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = args[0] ? args[0].toString() : '';
      if (url.toLowerCase().includes('controller.php')) {
        response
          .clone()
          .json()
          .then((data) => handler(url, data))
          .catch(() => {});
      }
    } catch {}
    return response;
  };
}

function patchXhr(handler: ResponseHandler): void {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
    (this as any)._cwUrl = url?.toString() ?? '';
    return originalOpen.apply(this, arguments as any);
  };

  XMLHttpRequest.prototype.send = function (body) {
    this.addEventListener('load', function () {
      const url = (this as any)._cwUrl as string;
      if (!url?.toLowerCase().includes('controller.php')) return;
      try {
        handler(url, JSON.parse(this.responseText));
      } catch {}
    });
    return originalSend.apply(this, arguments as any);
  };
}

export function registerFetchInterceptor(handler: ResponseHandler): void {
  patchFetch(handler);
  patchXhr(handler);
}

export function registerXhrTrigger(
  urlFragment: string,
  trigger: () => void
): void {
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
    if (url?.toString().toLowerCase().includes(urlFragment)) trigger();
    return originalOpen.apply(this, arguments as any);
  };
}
