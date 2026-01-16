import { Cache, ViewMode } from "../../lib/cache.js";
import { createElement, loadExternalScript, loadExternalStylesheet } from "../../lib/dom.js";
import { CONFIG } from "../../src/config.js";
import { LIMITS, TIMEOUTS, URLS } from "../../src/constants.js";
import { InductionState } from "./state.js";

let pannellumLoaded = false;

export async function loadPannellum() {
  if (pannellumLoaded || window.pannellum) {
    pannellumLoaded = true;
    return;
  }

  await loadExternalStylesheet(URLS.PANNELLUM_CSS);
  await loadExternalScript(URLS.PANNELLUM_JS);
  pannellumLoaded = true;
}

async function fetchImageWithRetry(url, retries = LIMITS.MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.REQUEST_TIMEOUT);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.blob();
      }
    } catch {
      // Retry on error
    }

    if (attempt < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, TIMEOUTS.RETRY_DELAY));
    }
  }
  return null;
}

export async function loadPanorama(containerId, loaderId) {
  const address = InductionState.getFullAddress();
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

    const panoramaConfig = CONFIG.panorama;
    window.pannellum.viewer(containerId, {
      type: "equirectangular",
      panorama: blobUrl,
      autoLoad: panoramaConfig.autoLoad,
      compass: panoramaConfig.compass,
      showControls: panoramaConfig.showControls,
      mouseZoom: panoramaConfig.mouseZoom,
      hfov: panoramaConfig.defaultHfov,
      pitch: panoramaConfig.defaultPitch,
      yaw: panoramaConfig.defaultYaw,
      backgroundColor: panoramaConfig.backgroundColor,
    });
    return true;
  }

  if (loader) loader.remove();
  return false;
}

export function createLoader() {
  const loader = createElement("div", { className: "sro-loader" });
  return loader;
}

export function renderPanoramaView(container) {
  const address = InductionState.getFullAddress();

  Array.from(container.children).forEach((child) => {
    if (!child.classList.contains("sro-pano-wrapper")) {
      child.style.display = "none";
    }
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
    style: {
      flex: "1",
      position: "relative",
      background: "#f4f4f4",
      width: "100%",
    },
  });
  wrapper.appendChild(viewerBox);

  const loader = createLoader();
  loader.id = "sro-loader-main";
  viewerBox.appendChild(loader);

  if (address && address.length > 5) {
    loadPannellum().then(() => {
      loadPanorama("sro-pano-viewer-box", "sro-loader-main").then((success) => {
        if (!success) {
          renderPanoramaError(viewerBox, container);
        }
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

export function renderDefaultView(container) {
  const wrapper = document.getElementById("sro-pano-wrapper");
  if (wrapper) wrapper.style.display = "none";

  Array.from(container.children).forEach((child) => {
    if (!child.classList.contains("sro-pano-wrapper") && child.id !== "sro-btn-toggle") {
      child.style.display = "";
    }
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

export function renderRightPanel(container) {
  if (!container) return;

  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  const mode = ViewMode.get();

  if (mode === "pano") {
    renderPanoramaView(container);
  } else {
    renderDefaultView(container);
  }
}
