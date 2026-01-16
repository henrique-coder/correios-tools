!(function () {
  "use strict";

  const STRINGS = {
    WAIT: "AGUARDANDO...",
    PREVIEW: "PREVISÃO",
    DATE_EMPTY: "--/--/----",
    EMPTY: "--",
    LOADING: "loading",
    SUCCESS: "success",
    ERROR: "error",
    INFO: "info",
  };

  const CACHE_KEYS = {
    POSITION: "correiostools-card-position",
    VIEW_MODE: "correiostools-view-mode",
    PANORAMA_STORE: "correiostools-panorama-cache",
  };

  const URLS = {
    STREETVIEW_API: "https://streetview-henriquecoder.vercel.app/api/panorama",
    PANNELLUM_CSS: "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css",
    PANNELLUM_JS: "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js",
  };

  const URL_PATTERNS = {
    INDUCTION: "/lancamentoautomatico/",
    LOEC_SUSPENSA: "/loecsuspensa/",
  };

  const TIMEOUTS = {
    CACHE_PANORAMA_TTL: 604800000,
    REQUEST_TIMEOUT: 10000,
    RETRY_DELAY: 1500,
    DOM_OBSERVER_INTERVAL: 50,
    DOM_OBSERVER_MAX_ATTEMPTS: 100,
    DASHBOARD_RENDER_DELAY: 300,
  };

  const LIMITS = { MAX_RETRIES: 3, HASH_LENGTH: 12 };

  const CONFIG = {
    panorama: {
      defaultHfov: 100,
      defaultPitch: 0,
      defaultYaw: 0,
      backgroundColor: [240, 240, 240],
      showControls: true,
      mouseZoom: true,
      autoLoad: true,
      compass: false,
    },
  };

  const networkHandlers = new Map();
  let networkInitialized = false;

  const NetworkInterceptor = {
    init() {
      if (networkInitialized) return;
      networkInitialized = true;
      this.patchFetch();
      this.patchXHR();
    },

    on(urlPattern, callback) {
      if (!networkHandlers.has(urlPattern)) {
        networkHandlers.set(urlPattern, []);
      }
      networkHandlers.get(urlPattern).push(callback);
    },

    emit(url, data, options = {}) {
      const urlLower = url.toLowerCase();
      for (const [pattern, callbacks] of networkHandlers) {
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

  async function generateHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .slice(0, LIMITS.HASH_LENGTH / 2)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function parseTimestampFromKey(key) {
    const match = key.match(/_(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  }

  function isExpired(timestamp) {
    if (!timestamp) return true;
    return Date.now() - timestamp >= TIMEOUTS.CACHE_PANORAMA_TTL;
  }

  const Cache = {
    async getPanorama(address) {
      try {
        const hash = await generateHash(address);
        const cache = await caches.open(CACHE_KEYS.PANORAMA_STORE);
        const keys = await cache.keys();

        for (const request of keys) {
          const url = new URL(request.url);
          const filename = url.pathname.split("/").pop();

          if (filename.startsWith(hash)) {
            const timestamp = parseTimestampFromKey(filename);

            if (isExpired(timestamp)) {
              await cache.delete(request);
              continue;
            }

            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              return URL.createObjectURL(blob);
            }
          }
        }
      } catch {}
      return null;
    },

    async setPanorama(address, blob) {
      try {
        const hash = await generateHash(address);
        const timestamp = Date.now();
        const cacheKey = `${hash}_${timestamp}`;

        const cache = await caches.open(CACHE_KEYS.PANORAMA_STORE);

        const keys = await cache.keys();
        for (const request of keys) {
          const url = new URL(request.url);
          const filename = url.pathname.split("/").pop();
          if (filename.startsWith(hash)) {
            await cache.delete(request);
          }
        }

        const fakeUrl = `https://cache.local/${cacheKey}`;
        await cache.put(fakeUrl, new Response(blob));

        return true;
      } catch {}
      return false;
    },
  };

  const Position = {
    get() {
      try {
        const data = localStorage.getItem(CACHE_KEYS.POSITION);
        if (data) {
          const parsed = JSON.parse(data);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            return parsed;
          }
        }
      } catch {}
      return { x: 0, y: 0 };
    },

    set(x, y) {
      try {
        localStorage.setItem(CACHE_KEYS.POSITION, JSON.stringify({ x, y }));
        return true;
      } catch {}
      return false;
    },
  };

  const ViewMode = {
    get() {
      return localStorage.getItem(CACHE_KEYS.VIEW_MODE) || "default";
    },
    set(mode) {
      try {
        localStorage.setItem(CACHE_KEYS.VIEW_MODE, mode);
        return true;
      } catch {}
      return false;
    },
  };

  function injectStylesheet(id, css) {
    if (document.getElementById(id)) return false;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    return true;
  }

  function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
      if (key === "style" && typeof value === "object") {
        Object.assign(element.style, value);
      } else if (key === "className") {
        element.className = value;
      } else if (key === "innerHTML") {
        element.innerHTML = value;
      } else if (key === "innerText") {
        element.innerText = value;
      } else if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    }
    for (const child of children) {
      if (typeof child === "string") {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    }
    return element;
  }

  async function waitForElement(selector, maxAttempts = TIMEOUTS.DOM_OBSERVER_MAX_ATTEMPTS) {
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(interval);
          resolve(element);
          return;
        }
        if (++attempts >= maxAttempts) {
          clearInterval(interval);
          resolve(null);
        }
      }, TIMEOUTS.DOM_OBSERVER_INTERVAL);
    });
  }

  function observeElement(element, callback) {
    const observer = new MutationObserver(callback);
    observer.observe(element, { childList: true, subtree: true, characterData: true });
    return observer;
  }

  const path = window.location.pathname;

  if (path.includes(URL_PATTERNS.INDUCTION)) {
    initInductionModule();
  } else if (path.includes(URL_PATTERNS.LOEC_SUSPENSA)) {
    initLoecHudModule();
  }

  function initInductionModule() {
    const DEFAULT_STATE = {
      code: STRINGS.EMPTY,
      status: STRINGS.WAIT,
      mode: STRINGS.LOADING,
      district: STRINGS.EMPTY,
      domDist: null,
      initialDist: null,
      pendingDist: null,
      date: STRINGS.DATE_EMPTY,
      exception: STRINGS.EMPTY,
      validation: STRINGS.EMPTY,
      lastEvent: STRINGS.EMPTY,
      address: {
        street: STRINGS.EMPTY,
        number: STRINGS.EMPTY,
        complement: STRINGS.EMPTY,
        neighborhood: STRINGS.EMPTY,
        city: STRINGS.EMPTY,
        state: STRINGS.EMPTY,
        zipCode: STRINGS.EMPTY,
      },
      services: { ar: "N", mp: "N", dd: "N" },
      contact: { phone: STRINGS.EMPTY, email: STRINGS.EMPTY },
      operation: {
        list: STRINGS.EMPTY,
        user: STRINGS.EMPTY,
        postman: STRINGS.EMPTY,
        station: STRINGS.EMPTY,
        timestamp: STRINGS.EMPTY,
        order: STRINGS.EMPTY,
        side: STRINGS.EMPTY,
      },
    };

    let state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    let lastErrorValue = null;
    let dragState = {
      active: false,
      currentX: 0,
      currentY: 0,
      initialX: 0,
      initialY: 0,
      offsetX: 0,
      offsetY: 0,
    };

    const STYLES = `
      #sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); will-change: transform; }
      .sro-snap { transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
      .sro-card { width: 360px; background: #fff; border-radius: 6px; font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; border-left: 8px solid #999; display: block; }
      .sro-header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border-bottom: 1px solid #eee; cursor: grab; user-select: none; }
      .sro-body { padding: 12px; text-align: center; background: #fff; }
      .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: #00416B; margin: 6px 0; }
      .sro-new { color: #00416B; font-size: 3rem; font-weight: 900; }
      .sro-sm-old { font-size: 13px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .sro-sm-arr { font-size: 12px; color: #ccc; margin: 2px 0; }
      .sro-loader { width: 30px; height: 30px; border: 3px solid rgba(0,0,0,0.1); border-left-color: #555; border-radius: 50%; animation: sro-spin 0.8s linear infinite; position: absolute; top: 50%; left: 50%; margin-top: -15px; margin-left: -15px; z-index: 20; }
      @keyframes sro-spin { 100% { transform: rotate(360deg); } }
      .mode-loading { border-left-color: #7f8c8d; }
      .mode-success { border-left-color: #009688; } .mode-success .sro-header { background: #e0f2f1; }
      .mode-error { border-left-color: #d32f2f; } .mode-error .sro-header { background: #ffebee; }
      .mode-info { border-left-color: #1976d2; } .mode-info .sro-header { background: #e3f2fd; }
      #sro-table-wrapper { margin-top: 25px; font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #ccc; background: #fff; width: 100%; box-sizing: border-box; clear: both; pointer-events: auto; }
      .sro-table-header { background: #00416B; color: #ffffff !important; padding: 8px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; display: flex; justify-content: space-between; border-bottom: 3px solid #FFE600; }
      .sro-full-table { width: 100%; border-collapse: collapse; font-size: 11px; }
      .sro-full-table th { background: #f0f0f0; color: #333; text-align: left; padding: 5px 8px; border: 1px solid #ddd; font-weight: 700; white-space: nowrap; width: 1%; }
      .sro-full-table td { padding: 5px 8px; border: 1px solid #ddd; color: #000; word-break: break-word; }
      .hl-val { color: #2e7d32; font-weight: 800; background: #e8f5e9; padding: 1px 4px; border-radius: 3px; }
      .hl-err { color: #c62828; font-weight: 800; background: #ffebee; padding: 1px 4px; border-radius: 3px; }
      .hl-dist { font-size: 15px; font-weight: 800; color: #00416B; }
      .hl-serv { background: #fff8e1; color: #ff8f00; padding: 0 3px; border-radius: 2px; font-weight: bold; border: 1px solid #ffecb3; margin-right: 3px; }
      .hl-serv-off { opacity: 0.2; margin-right: 3px; }
      .pnlm-container { width: 100% !important; height: 100% !important; background: #f4f4f4; }
    `;

    function getIcon(mode) {
      switch (mode) {
        case STRINGS.SUCCESS:
          return "✅";
        case STRINGS.ERROR:
          return "⛔";
        case STRINGS.INFO:
          return "⚠️";
        default:
          return "⏳";
      }
    }

    function formatTimestamp(ts) {
      if (!ts || ts.length < 18) return STRINGS.EMPTY;
      const d = `${ts.substring(8, 10)}/${ts.substring(10, 12)}/${ts.substring(12, 16)}`;
      const t = `${ts.substring(16, 18)}:${ts.substring(18, 20)}`;
      return `${d} às ${t}`;
    }

    function getVisualDistrict() {
      let dist = state.domDist && state.domDist !== "" ? state.domDist : state.district;
      if (dist) dist = dist.trim();
      if (
        state.initialDist &&
        state.initialDist !== STRINGS.EMPTY &&
        dist &&
        dist !== STRINGS.EMPTY &&
        dist !== state.initialDist
      ) {
        return `<div style="display:flex;align-items:center;justify-content:center;"><span class="sro-sm-old" style="margin-right:6px">${state.initialDist}</span><span class="sro-sm-arr" style="margin-right:6px">➜</span><span class="sro-new">${dist}</span></div>`;
      }
      return `<span class="sro-new">${dist || STRINGS.EMPTY}</span>`;
    }

    function getFullAddress() {
      const addr = state.address;
      if (addr.street === STRINGS.EMPTY) return null;
      const comp = addr.complement ? ` - ${addr.complement}` : "";
      return `${addr.street}, ${addr.number}${comp} - ${addr.neighborhood}, ${addr.city}/${addr.state}`;
    }

    function renderServiceBadge(name, key) {
      const active = state.services[key] === "S";
      return `<span class="${active ? "hl-serv" : "hl-serv-off"}">${name}</span>`;
    }

    function savePosition() {
      Position.set(dragState.currentX, dragState.currentY);
    }

    function applyPosition(container) {
      const pos = Position.get();
      dragState.currentX = pos.x;
      dragState.currentY = pos.y;
      dragState.offsetX = pos.x;
      dragState.offsetY = pos.y;
      container.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    }

    function resetPosition(container) {
      dragState.offsetX = 0;
      dragState.offsetY = 0;
      dragState.currentX = 0;
      dragState.currentY = 0;
      container.classList.add("sro-snap");
      container.style.transform = "translate3d(0px, 0px, 0)";
      setTimeout(() => container.classList.remove("sro-snap"), 300);
      savePosition();
    }

    function handleDragStart(e) {
      dragState.initialX = e.clientX - dragState.offsetX;
      dragState.initialY = e.clientY - dragState.offsetY;
      dragState.active = true;
    }

    function handleDragEnd() {
      dragState.initialX = dragState.currentX;
      dragState.initialY = dragState.currentY;
      dragState.active = false;
      savePosition();
      constrainToViewport();
    }

    function handleDrag(e) {
      if (!dragState.active) return;
      e.preventDefault();
      dragState.currentX = e.clientX - dragState.initialX;
      dragState.currentY = e.clientY - dragState.initialY;
      dragState.offsetX = dragState.currentX;
      dragState.offsetY = dragState.currentY;
      const container = document.getElementById("sro-container");
      if (container)
        container.style.transform = `translate3d(${dragState.currentX}px, ${dragState.currentY}px, 0)`;
    }

    function constrainToViewport() {
      const container = document.getElementById("sro-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let adjusted = false;
      if (rect.left < 0) {
        dragState.currentX += 0 - rect.left;
        adjusted = true;
      }
      if (rect.top < 0) {
        dragState.currentY += 0 - rect.top;
        adjusted = true;
      }
      if (rect.right > vw) {
        dragState.currentX -= rect.right - vw;
        adjusted = true;
      }
      if (rect.bottom > vh) {
        dragState.currentY -= rect.bottom - vh;
        adjusted = true;
      }
      if (adjusted) {
        container.classList.add("sro-snap");
        dragState.offsetX = dragState.currentX;
        dragState.offsetY = dragState.currentY;
        container.style.transform = `translate3d(${dragState.currentX}px, ${dragState.currentY}px, 0)`;
        setTimeout(() => container.classList.remove("sro-snap"), 300);
        savePosition();
      }
    }

    async function loadPannellum() {
      if (window.pannellum) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = URLS.PANNELLUM_CSS;
      document.head.appendChild(link);
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = URLS.PANNELLUM_JS;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    async function fetchImageWithRetry(url, retries = LIMITS.MAX_RETRIES) {
      for (let i = 0; i < retries; i++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.REQUEST_TIMEOUT);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) return await res.blob();
        } catch {}
        if (i < retries - 1) await new Promise((r) => setTimeout(r, TIMEOUTS.RETRY_DELAY));
      }
      return null;
    }

    async function loadPanorama(containerId, loaderId) {
      const address = getFullAddress();
      if (!address || address.length < 5) return false;
      const loader = document.getElementById(loaderId);
      let blobUrl = await Cache.getPanorama(address);
      if (!blobUrl) {
        const apiUrl = `${URLS.STREETVIEW_API}?address=${encodeURIComponent(address)}`;
        const blob = await fetchImageWithRetry(apiUrl);
        if (blob) {
          blobUrl = URL.createObjectURL(blob);
          await Cache.setPanorama(address, blob);
        }
      }
      if (blobUrl) {
        if (loader) loader.remove();
        const cfg = CONFIG.panorama;
        window.pannellum.viewer(containerId, {
          type: "equirectangular",
          panorama: blobUrl,
          autoLoad: cfg.autoLoad,
          compass: cfg.compass,
          showControls: cfg.showControls,
          mouseZoom: cfg.mouseZoom,
          hfov: cfg.defaultHfov,
          pitch: cfg.defaultPitch,
          yaw: cfg.defaultYaw,
          backgroundColor: cfg.backgroundColor,
        });
        return true;
      }
      if (loader) loader.remove();
      return false;
    }

    function createLoader() {
      const l = document.createElement("div");
      l.className = "sro-loader";
      return l;
    }

    function renderPanoramaView(container) {
      const address = getFullAddress();
      Array.from(container.children).forEach((c) => {
        if (!c.classList.contains("sro-pano-wrapper")) c.style.display = "none";
      });
      let wrapper = document.getElementById("sro-pano-wrapper");
      if (!wrapper) {
        wrapper = createElement("div", {
          id: "sro-pano-wrapper",
          className: "sro-pano-wrapper",
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: "100",
            background: "#fff",
          },
        });
        container.appendChild(wrapper);
      }
      wrapper.style.display = "flex";
      wrapper.innerHTML = "";
      const header = createElement("div", {
        style: {
          padding: "10px 15px",
          background: "#00416B",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "14px",
          fontWeight: "bold",
          flexShrink: "0",
        },
        innerHTML:
          '<span style="color:#fff !important;">🌐 Panorama 360° - Arraste para interagir</span>',
      });
      const closeBtn = createElement("button", {
        innerHTML: "×",
        title: "Fechar Panorama",
        style: {
          background: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "28px",
          lineHeight: "20px",
          cursor: "pointer",
          padding: "0 5px",
          fontWeight: "bold",
          opacity: "0.9",
        },
        onMouseOver: (e) => (e.target.style.opacity = "1"),
        onClick: () => {
          ViewMode.set("default");
          renderRightPanel(container);
        },
      });
      header.appendChild(closeBtn);
      wrapper.appendChild(header);
      const viewerBox = createElement("div", {
        id: "sro-pano-viewer-box",
        style: { flex: "1", position: "relative", background: "#f4f4f4", width: "100%" },
      });
      wrapper.appendChild(viewerBox);
      const loader = createLoader();
      loader.id = "sro-loader-main";
      viewerBox.appendChild(loader);
      if (address && address.length > 5) {
        loadPannellum().then(() => {
          loadPanorama("sro-pano-viewer-box", "sro-loader-main").then((success) => {
            if (!success) renderPanoramaError(viewerBox, container);
          });
        });
      } else {
        loader.remove();
        viewerBox.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-weight:bold;">AGUARDANDO ENDEREÇO...</div>';
      }
    }

    function renderPanoramaError(viewerBox, container) {
      viewerBox.innerHTML = "";
      const errorDiv = createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#888",
        },
      });
      const errorText = createElement("span", {
        style: { fontSize: "12px", fontWeight: "bold", marginBottom: "8px" },
        innerText: "VISUALIZAÇÃO INDISPONÍVEL",
      });
      const retryBtn = createElement("button", {
        innerText: "Tentar Novamente",
        style: {
          padding: "6px 12px",
          border: "1px solid #ccc",
          background: "#fff",
          cursor: "pointer",
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: "bold",
          color: "#555",
        },
        onClick: () => {
          viewerBox.innerHTML = "";
          const newLoader = createLoader();
          newLoader.id = "sro-loader-main";
          viewerBox.appendChild(newLoader);
          loadPanorama("sro-pano-viewer-box", "sro-loader-main").then((success) => {
            if (!success) renderPanoramaError(viewerBox, container);
          });
        },
      });
      errorDiv.appendChild(errorText);
      errorDiv.appendChild(retryBtn);
      viewerBox.appendChild(errorDiv);
    }

    function renderDefaultView(container) {
      const wrapper = document.getElementById("sro-pano-wrapper");
      if (wrapper) wrapper.style.display = "none";
      Array.from(container.children).forEach((c) => {
        if (!c.classList.contains("sro-pano-wrapper") && c.id !== "sro-btn-toggle")
          c.style.display = "";
      });
      let toggleBtn = document.getElementById("sro-btn-toggle");
      if (!toggleBtn) {
        toggleBtn = createElement("button", {
          id: "sro-btn-toggle",
          style: {
            position: "absolute",
            top: "25px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: "999",
            background: "#fff",
            border: "1px solid #00416B",
            color: "#00416B",
            fontWeight: "bold",
            padding: "8px 20px",
            borderRadius: "20px",
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            fontSize: "13px",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minWidth: "160px",
          },
          innerHTML: "<span>📷</span><span>Visualizar 360º</span>",
          onMouseOver: (e) => {
            e.currentTarget.style.background = "#00416B";
            e.currentTarget.style.color = "#fff";
          },
          onMouseOut: (e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = "#00416B";
          },
          onClick: () => {
            ViewMode.set("pano");
            renderRightPanel(container);
          },
        });
        container.appendChild(toggleBtn);
      }
      toggleBtn.style.display = "flex";
    }

    function renderRightPanel(container) {
      if (!container) return;
      if (getComputedStyle(container).position === "static") container.style.position = "relative";
      const mode = ViewMode.get();
      if (mode === "pano") renderPanoramaView(container);
      else renderDefaultView(container);
    }

    function handleApiResponse(url, data) {
      const urlLower = url.toLowerCase();
      let code = null;
      try {
        const u = new URL(url, window.location.origin);
        code =
          u.searchParams.get("codigo") || u.searchParams.get("id") || u.searchParams.get("objeto");
      } catch {}
      if (
        code &&
        code !== state.code &&
        (urlLower.includes("acao=validar") || urlLower.includes("acao=pesquisar"))
      ) {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        state.code = code;
        state.status = STRINGS.WAIT;
        updateUI();
      }
      if (urlLower.includes("acao=validar")) {
        state.validation = data.validacao || STRINGS.EMPTY;
        state.exception = data.excecao || STRINGS.EMPTY;
        state.lastEvent = data.ultimoEventoDescricao || STRINGS.EMPTY;
        if (data.validacao) {
          if (state.mode !== STRINGS.SUCCESS && state.mode !== STRINGS.ERROR)
            state.mode = STRINGS.INFO;
          if (state.status !== STRINGS.SUCCESS && state.status !== STRINGS.ERROR)
            state.status = "PRONTO P/ INDUZIR";
          state.date = data.previsaoEntrega?.data || STRINGS.DATE_EMPTY;
        } else {
          state.mode = STRINGS.ERROR;
          state.status = "NÃO INDUZIDO";
          state.date = STRINGS.DATE_EMPTY;
        }
      } else if (urlLower.includes("enderecocontroller.php")) {
        if (data.endereco) {
          state.address = {
            street: data.endereco.logradouro || STRINGS.EMPTY,
            number: data.endereco.numeroLogradouro || STRINGS.EMPTY,
            complement: data.endereco.complementoLogradouro || STRINGS.EMPTY,
            neighborhood: data.endereco.bairro || STRINGS.EMPTY,
            city: data.endereco.municipio || STRINGS.EMPTY,
            state: data.endereco.uf || STRINGS.EMPTY,
            zipCode: data.endereco.cep || STRINGS.EMPTY,
          };
        }
        if (data.servico)
          state.services = {
            ar: data.servico.ar || "N",
            mp: data.servico.mp || "N",
            dd: data.servico.dd || "N",
          };
        if (data.telefone) state.contact.phone = `(${data.telefone.ddd}) ${data.telefone.numero}`;
        if (data.email) state.contact.email = data.email;
      } else if (urlLower.includes("distritamentotrechocontroller.php")) {
        if (Array.isArray(data) && data.length > 0) {
          const first = data[0];
          state.district = `${first.rotuloDistrito} ${first.areaDistrito || ""}`.trim();
          state.operation.order = first.ordemPercorrida;
          state.operation.side = first.lado;
        }
      } else if (urlLower.includes("acao=pesquisarloecobjeto")) {
        if (data.id) {
          const dist = `${data.numeroDistrito} ${data.distritoComplemento || ""}`.trim();
          state.mode = STRINGS.SUCCESS;
          state.status = "JÁ INDUZIDO";
          state.initialDist = dist;
          state.district = dist;
          state.domDist = dist;
          state.operation.list = data.idLancamento;
          state.operation.user = data.carteiro?.nome || STRINGS.EMPTY;
          state.operation.postman = data.carteiro?.nome || STRINGS.EMPTY;
        }
      } else if (urlLower.includes("acao=listar") && !urlLower.includes("loecobjeto")) {
        if (Array.isArray(data) && state.operation.list) {
          const found = data.find((item) => item.idLancamento === state.operation.list);
          if (found && found.nomeCarteiro) state.operation.postman = found.nomeCarteiro;
        }
      } else if (urlLower.includes("acao=salvar")) {
        if (data.idLancamento) {
          state.mode = STRINGS.SUCCESS;
          state.status = "OBJETO INDUZIDO";
          state.operation.list = data.numeroLista;
          state.operation.user = data.usuario;
          state.operation.station = data.estacao;
          state.operation.timestamp = data.carimbo;
          if (data.dataPrevista) state.date = data.dataPrevista;
        }
        if (state.pendingDist) {
          state.district = state.pendingDist;
          state.initialDist = state.pendingDist;
          state.domDist = state.pendingDist;
          state.pendingDist = null;
        }
        if (data.distrito) {
          state.initialDist = data.distrito;
          state.domDist = data.distrito;
        }
      } else if (urlLower.includes("acao=excluir")) {
        state.mode = STRINGS.ERROR;
        state.status = "EXCLUÍDO";
        state.district = STRINGS.EMPTY;
        state.domDist = null;
        state.date = STRINGS.DATE_EMPTY;
        state.initialDist = null;
        state.pendingDist = null;
      }
      updateUI();
    }

    function handleSaveRequest(url, data) {
      if (data && data.distrito) state.pendingDist = data.distrito;
    }

    function createFloatingCard() {
      if (document.getElementById("sro-container")) return;
      const container = createElement("div", { id: "sro-container" });
      container.innerHTML = `
        <div class="sro-layout-row">
          <div id="sro-card" class="sro-card mode-loading">
            <div id="sro-header" class="sro-header" title="Segure para mover">
              <span id="sro-status" class="sro-status-text">${STRINGS.WAIT}</span>
              <div style="display:flex;align-items:center"><span id="sro-icon" class="sro-icon">⏳</span></div>
            </div>
            <div class="sro-body">
              <div id="sro-distrito" class="sro-distrito">${STRINGS.EMPTY}</div>
              <div style="font-size:12px;color:#666;margin-top:4px">${STRINGS.PREVIEW}: <strong id="sro-previsao" style="color:#333">${STRINGS.DATE_EMPTY}</strong></div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
      applyPosition(container);
      const header = document.getElementById("sro-header");
      header.addEventListener("mousedown", handleDragStart);
      header.addEventListener("dblclick", () => resetPosition(container));
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("mousemove", handleDrag);
      window.addEventListener("resize", constrainToViewport);
    }

    async function createDataTable() {
      const target = await waitForElement(".botoes");
      if (!target || document.getElementById("sro-table-wrapper")) return;
      const wrapper = createElement("div", { id: "sro-table-wrapper" });
      wrapper.innerHTML = `
        <div class="sro-table-header"><span style="color:#ffffff !important">DADOS OPERACIONAIS</span><span style="opacity:0.7;color:#fff">SRO EXT</span></div>
        <table class="sro-full-table">
          <tr><th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">${STRINGS.EMPTY}</td><th>STATUS</th><td id="td-stt">${STRINGS.EMPTY}</td><th>VALIDAÇÃO</th><td id="td-val">${STRINGS.EMPTY}</td><th>DATA PREV.</th><td id="td-dat-prev">${STRINGS.EMPTY}</td></tr>
          <tr id="row-exc" style="display:none"><th style="color:#c62828">EXCEÇÃO</th><td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">${STRINGS.EMPTY}</td></tr>
          <tr><th>ENDEREÇO</th><td colspan="5" id="td-end-full">${STRINGS.EMPTY}</td><th>CEP</th><td id="td-cep" style="font-weight:bold">${STRINGS.EMPTY}</td></tr>
          <tr><th>CONTATO</th><td colspan="7" id="td-con">${STRINGS.EMPTY}</td></tr>
          <tr><th>DISTRITO</th><td id="td-dis" class="hl-dist">${STRINGS.EMPTY}</td><th>ORDEM</th><td id="td-ord">${STRINGS.EMPTY}</td><th>LADO</th><td id="td-lad">${STRINGS.EMPTY}</td><th>SERVIÇOS</th><td colspan="3" id="td-srv">${STRINGS.EMPTY}</td></tr>
          <tr><th rowspan="2">INDUÇÃO</th><td colspan="7"><span style="color:#777">L:</span> <b id="td-lis">${STRINGS.EMPTY}</b>  | <span style="color:#777">E:</span> <b id="td-est">${STRINGS.EMPTY}</b>  | <span style="color:#777">U:</span> <b id="td-usu">${STRINGS.EMPTY}</b>  | <span style="color:#777">DATA:</span> <b id="td-dat">${STRINGS.EMPTY}</b></td></tr>
          <tr><td colspan="7" style="background:#fffde7;border-left:3px solid #fbc02d"><span style="color:#f57f17;font-weight:bold;text-transform:uppercase">CARTEIRO:</span><b id="td-postman" style="font-size:12px;color:#333;margin-left:5px">${STRINGS.EMPTY}</b></td></tr>
        </table>
      `;
      target.insertAdjacentElement("afterend", wrapper);
    }

    async function setupInputObserver() {
      const input = await waitForElement("#txtObjeto");
      if (!input) return;
      const field = input.closest(".campo") || input.parentElement;
      if (!field) return;
      const handleError = () => {
        if (document.activeElement === document.getElementById("selDistrito")) return;
        input.click();
        input.focus();
        lastErrorValue = input.value;
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          setTimeout(() => {
            const msg = field.querySelector(".mensagem");
            if (msg) {
              const txt = msg.innerText || "";
              if (txt.includes("Formato de objeto postal") || txt.includes("Preencha este campo"))
                handleError();
            }
          }, 300);
        }
      });
      observeElement(field, () => {
        const msg = field.querySelector(".mensagem");
        if (msg) {
          const txt = msg.innerText || "";
          if (txt.includes("Formato de objeto postal") || txt.includes("Preencha este campo")) {
            if (input.value !== lastErrorValue) handleError();
          }
        }
      });
    }

    async function setupDistrictSelector() {
      const selector = await waitForElement("#selDistrito");
      if (!selector) return;
      const update = (e) => {
        state.domDist = e.target.value;
        updateUI();
      };
      selector.addEventListener("change", update);
      selector.addEventListener("input", update);
    }

    function updateUI() {
      const card = document.getElementById("sro-card");
      const status = document.getElementById("sro-status");
      const icon = document.getElementById("sro-icon");
      const distrito = document.getElementById("sro-distrito");
      const previsao = document.getElementById("sro-previsao");
      if (card) card.className = `sro-card visible mode-${state.mode}`;
      if (status) status.innerText = state.status;
      if (icon) icon.innerText = getIcon(state.mode);
      if (distrito) distrito.innerHTML = getVisualDistrict();
      if (previsao) previsao.innerText = state.date || STRINGS.DATE_EMPTY;
      updateDataTable();
      const mapContainer = document.getElementById("div-map");
      if (mapContainer) renderRightPanel(mapContainer);
    }

    function updateDataTable() {
      const $ = (id) => document.getElementById(id);
      const tdCod = $("td-cod");
      if (tdCod) tdCod.innerText = state.code;
      const tdVal = $("td-val");
      if (tdVal) {
        const val = state.validation;
        tdVal.innerHTML = val
          ? `<span class="${val.includes("V") ? "hl-val" : "hl-err"}">${val}</span>`
          : STRINGS.EMPTY;
      }
      const tdStt = $("td-stt");
      if (tdStt) tdStt.innerText = state.lastEvent;
      const tdDatPrev = $("td-dat-prev");
      if (tdDatPrev) tdDatPrev.innerText = state.date;
      const rowExc = $("row-exc");
      const tdExc = $("td-exc");
      if (rowExc && tdExc) {
        if (state.exception && state.exception !== STRINGS.EMPTY) {
          tdExc.innerText = state.exception;
          rowExc.style.display = "table-row";
        } else {
          rowExc.style.display = "none";
        }
      }
      const tdEndFull = $("td-end-full");
      if (tdEndFull) {
        const addr = state.address;
        const comp = addr.complement ? ` - ${addr.complement}` : "";
        tdEndFull.innerText = `${addr.street}, ${addr.number}${comp} - ${addr.neighborhood}, ${addr.city}/${addr.state}`;
      }
      const tdCep = $("td-cep");
      if (tdCep) tdCep.innerText = state.address.zipCode;
      const tdCon = $("td-con");
      if (tdCon) {
        const emailPart =
          state.contact.email !== STRINGS.EMPTY ? ` | EMAIL: ${state.contact.email}` : "";
        tdCon.innerHTML = `TEL: <b>${state.contact.phone}</b>${emailPart}`;
      }
      const tdDis = $("td-dis");
      if (tdDis) tdDis.innerHTML = getVisualDistrict();
      const tdOrd = $("td-ord");
      if (tdOrd) tdOrd.innerText = state.operation.order;
      const tdLad = $("td-lad");
      if (tdLad) tdLad.innerText = state.operation.side;
      const tdSrv = $("td-srv");
      if (tdSrv)
        tdSrv.innerHTML =
          renderServiceBadge("AR", "ar") +
          renderServiceBadge("MP", "mp") +
          renderServiceBadge("DD", "dd");
      const tdLis = $("td-lis");
      if (tdLis) tdLis.innerText = state.operation.list;
      const tdEst = $("td-est");
      if (tdEst) tdEst.innerText = state.operation.station;
      const tdUsu = $("td-usu");
      if (tdUsu) tdUsu.innerText = state.operation.user;
      const tdDat = $("td-dat");
      if (tdDat) tdDat.innerText = formatTimestamp(state.operation.timestamp);
      const tdPostman = $("td-postman");
      if (tdPostman) tdPostman.innerText = state.operation.postman;
    }

    function autoDismissPrintDialog() {
      let attempts = 0;
      const interval = setInterval(() => {
        const button = document.getElementById("btnImprimirEtiquetaNao");
        if (button) {
          button.click();
          clearInterval(interval);
          autoDismissAlert();
          return;
        }
        if (++attempts >= 100) clearInterval(interval);
      }, 50);
    }

    function autoDismissAlert() {
      let attempts = 0;
      const interval = setInterval(() => {
        const okBtn = document.querySelector("#alerta.aberto .act a");
        if (okBtn && okBtn.innerText === "OK") {
          okBtn.click();
          clearInterval(interval);
          return;
        }
        if (++attempts >= 100) clearInterval(interval);
      }, 50);
    }

    function initUI() {
      injectStylesheet("sro-styles", STYLES);
      createFloatingCard();
      createDataTable();
      setupInputObserver();
      setupDistrictSelector();
    }

    NetworkInterceptor.init();
    NetworkInterceptor.on("acao=validar", handleApiResponse);
    NetworkInterceptor.on("enderecocontroller.php", handleApiResponse);
    NetworkInterceptor.on("distritamentotrechocontroller.php", handleApiResponse);
    NetworkInterceptor.on("acao=pesquisarloecobjeto", handleApiResponse);
    NetworkInterceptor.on("acao=listar", handleApiResponse);
    NetworkInterceptor.on("acao=salvar", handleApiResponse);
    NetworkInterceptor.on("acao=excluir", handleApiResponse);
    NetworkInterceptor.on("acao=salvar", (url, data, opts) => {
      if (opts.type === "request") handleSaveRequest(url, data);
    });
    NetworkInterceptor.on("listar-impressoras-disponiveis", autoDismissPrintDialog);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initUI);
    } else {
      initUI();
    }
  }

  function initLoecHudModule() {
    const HUD_ID = "sro-hud-dashboard";
    const STYLES = `
      #${HUD_ID} { box-sizing: border-box; width: 100%; max-width: 100%; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6; border-radius: 8px; margin: 0 auto 20px auto; padding: 15px; font-family: 'Segoe UI', system-ui, sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; animation: slideDown 0.4s ease-out; position: relative; }
      #${HUD_ID} * { box-sizing: border-box; }
      @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
      .hud-updated { animation: pulse-green 1s; }
      .hud-card { background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #00416B; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; min-width: 0; }
      .hud-card:hover { transform: translateY(-2px); }
      .hud-title { font-size: 0.75rem; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .hud-value { font-size: 1.5rem; font-weight: 800; color: #111827; }
      .hud-sub { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .border-danger { border-left-color: #dc2626; }
      .border-warning { border-left-color: #f59e0b; }
      .border-success { border-left-color: #10b981; }
      .border-info { border-left-color: #3b82f6; }
      .text-danger { color: #dc2626; }
      .text-success { color: #10b981; }
      .hud-full { grid-column: span 4; display: flex; justify-content: space-between; background: #fff; padding: 10px; border-radius: 4px; border: 1px dashed #ccc; align-items: center; flex-wrap: wrap; }
      .metric-box { text-align: center; flex: 1; border-right: 1px solid #eee; min-width: 80px; }
      .metric-box:last-child { border-right: none; }
      .metric-lbl { font-size: 0.65rem; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
      .metric-val { font-weight: bold; font-size: 0.9rem; color: #333; }
      .hud-footer-time { position: absolute; bottom: 2px; right: 5px; font-size: 0.6rem; color: #aaa; font-style: italic; }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    `;

    function extractInt(val) {
      if (typeof val === "number") return val;
      if (!val) return 0;
      const cleaned = val.toString().replace(/<[^>]*>/g, "");
      return parseInt(cleaned, 10) || 0;
    }

    function calculateMetrics(data) {
      if (!Array.isArray(data) || data.length === 0) return null;
      const raw = {
        totalDistricts: data.length,
        totalObjects: 0,
        totalPoints: 0,
        totalExpired: 0,
        totalToday: 0,
        totalToExpire: 0,
        totalAR: 0,
      };
      data.forEach((d) => {
        raw.totalObjects += extractInt(d.qtde);
        raw.totalPoints += extractInt(d.qtdePontos);
        raw.totalExpired += extractInt(d.qtdeVencido);
        raw.totalToday += extractInt(d.qtdeHoje);
        raw.totalToExpire += extractInt(d.qtdeAVencer);
        raw.totalAR += extractInt(d.qtdeAR);
      });
      const computed = {
        deliveryDensity: raw.totalObjects > 0 ? (raw.totalObjects / raw.totalPoints).toFixed(2) : 0,
        chaosIndex:
          raw.totalObjects > 0 ? ((raw.totalExpired / raw.totalObjects) * 100).toFixed(1) : 0,
        operationalPressure:
          raw.totalObjects > 0
            ? (((raw.totalToday + raw.totalToExpire) / raw.totalObjects) * 100).toFixed(1)
            : 0,
        arFactor: raw.totalObjects > 0 ? ((raw.totalAR / raw.totalObjects) * 100).toFixed(1) : 0,
        avgObjectsPerDistrict:
          raw.totalDistricts > 0 ? (raw.totalObjects / raw.totalDistricts).toFixed(1) : 0,
      };
      return { raw, computed };
    }

    function getStatusLevel(chaosIndex) {
      if (chaosIndex > 50) return { color: "border-danger", text: "CRÍTICO", icon: "🔴" };
      if (chaosIndex > 20) return { color: "border-warning", text: "ATENÇÃO", icon: "🟡" };
      return { color: "border-success", text: "CONTROLADO", icon: "🟢" };
    }

    function renderDashboard(metrics) {
      const existing = document.getElementById(HUD_ID);
      if (existing) existing.remove();
      if (!metrics) return;
      const target = document.querySelector(".botoes");
      if (!target) return;
      const m = metrics.raw;
      const c = metrics.computed;
      const status = getStatusLevel(parseFloat(c.chaosIndex));
      const timeString = new Date().toLocaleTimeString("pt-BR");
      const container = createElement("div", { id: HUD_ID, className: "hud-updated" });
      container.innerHTML = `
        <div class="hud-card border-info"><div class="hud-title">Carga Total Suspensa</div><div class="hud-value">${
          m.totalObjects
        } <span style="font-size:0.8rem; color:#888;">objs</span></div><div class="hud-sub">📦 ${
          m.totalDistricts
        } distritos afetados</div></div>
        <div class="hud-card ${
          status.color
        }"><div class="hud-title">Backlog (Vencidos)</div><div class="hud-value text-danger">${
          m.totalExpired
        }</div><div class="hud-sub">🔥 ${c.chaosIndex}% da carga total</div></div>
        <div class="hud-card border-warning"><div class="hud-title">Urgência (Hoje+Breve)</div><div class="hud-value">${
          m.totalToday + m.totalToExpire
        }</div><div class="hud-sub">⚠️ Pressão Operacional: ${c.operationalPressure}%</div></div>
        <div class="hud-card border-info"><div class="hud-title">Complexidade (ARs)</div><div class="hud-value">${
          m.totalAR
        }</div><div class="hud-sub">📝 Fator de Retenção: ${c.arFactor}%</div></div>
        <div class="hud-full"><div class="metric-box"><div class="metric-lbl">DENSIDADE DO CLUSTER</div><div class="metric-val">${
          c.deliveryDensity
        } objs/ponto</div></div><div class="metric-box"><div class="metric-lbl">TOTAL PONTOS FÍSICOS</div><div class="metric-val">📍 ${
          m.totalPoints
        }</div></div><div class="metric-box"><div class="metric-lbl">STATUS TÁTICO</div><div class="metric-val" style="font-weight:900;">${
          status.text
        }</div></div><div class="metric-box"><div class="metric-lbl">MÉDIA OBJS/DISTRITO</div><div class="metric-val">📊 ${
          c.avgObjectsPerDistrict
        }</div></div></div>
        <div class="hud-footer-time">Atualizado às: ${timeString}</div>
      `;
      target.parentNode.insertBefore(container, target);
    }

    function handleLoecData(url, data) {
      if (!url.includes("lancamentoController.php?acao=listar")) return;
      try {
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;
        if (Array.isArray(parsedData)) {
          const metrics = calculateMetrics(parsedData);
          setTimeout(() => renderDashboard(metrics), TIMEOUTS.DASHBOARD_RENDER_DELAY);
        }
      } catch {}
    }

    injectStylesheet("sro-hud-styles", STYLES);
    NetworkInterceptor.init();
    NetworkInterceptor.on("lancamentoController.php?acao=listar", handleLoecData);
  }
})();
