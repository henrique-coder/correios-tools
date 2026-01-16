const handlers = new Map();
let initialized = false;

export const NetworkInterceptor = {
  init() {
    if (initialized) return;
    initialized = true;

    this.patchFetch();
    this.patchXHR();
  },

  on(urlPattern, callback) {
    if (!handlers.has(urlPattern)) {
      handlers.set(urlPattern, []);
    }
    handlers.get(urlPattern).push(callback);
  },

  off(urlPattern, callback) {
    if (!handlers.has(urlPattern)) return;

    const callbacks = handlers.get(urlPattern);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  },

  emit(url, data, options = {}) {
    const urlLower = url.toLowerCase();

    for (const [pattern, callbacks] of handlers) {
      if (urlLower.includes(pattern.toLowerCase())) {
        callbacks.forEach((callback) => {
          try {
            callback(url, data, options);
          } catch {}
        });
      }
    }
  },

  patchFetch() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (...args) {
      const url = args[0] ? args[0].toString() : "";
      const urlLower = url.toLowerCase();
      const options = args[1] || {};

      if (urlLower.includes("acao=salvar") && options.body) {
        try {
          const payload = JSON.parse(options.body);
          self.emit(url, payload, { type: "request", method: "POST" });
        } catch {}
      }

      try {
        const response = await originalFetch.apply(this, args);

        if (urlLower.includes("controller.php")) {
          response
            .clone()
            .json()
            .then((data) => self.emit(url, data, { type: "response" }))
            .catch(() => {});
        }

        return response;
      } catch (error) {
        if (urlLower.includes("listar-impressoras-disponiveis")) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        throw error;
      }
    };
  },

  patchXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const self = this;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._sroUrl = url;
      this._sroMethod = method;
      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      const url = this._sroUrl || "";
      const urlLower = url.toLowerCase();

      if (urlLower.includes("acao=salvar") && body) {
        try {
          const payload = JSON.parse(body);
          self.emit(url, payload, { type: "request", method: "POST" });
        } catch {}
      }

      this.addEventListener("load", function () {
        if (this._sroUrl && this._sroUrl.toLowerCase().includes("controller.php")) {
          try {
            const data = JSON.parse(this.responseText);
            self.emit(this._sroUrl, data, { type: "response" });
          } catch {}
        }
      });

      return originalSend.apply(this, arguments);
    };
  },
};
