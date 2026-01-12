!(function () {
  "use strict";

  const DOM_TARGET_SELECTOR = ".botoes";
  const HUD_ID = "sro-hud-dashboard";

  function injectStyles() {
    if (document.getElementById("sro-hud-styles")) return;
    const style = document.createElement("style");
    style.id = "sro-hud-styles";
    style.innerHTML = `
            #${HUD_ID} {
                box-sizing: border-box;
                width: 100%;
                max-width: 100%;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                border: 1px solid #dee2e6;
                border-radius: 8px;
                margin: 0 auto 20px auto;
                padding: 15px;
                font-family: 'Segoe UI', system-ui, sans-serif;
                box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                animation: slideDown 0.4s ease-out;
                position: relative;
            }
            #${HUD_ID} * {
                box-sizing: border-box;
            }
            @keyframes pulse-green {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            .hud-updated {
                animation: pulse-green 1s;
            }
            .hud-card {
                background: white;
                padding: 12px;
                border-radius: 6px;
                border-left: 4px solid #00416B;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                transition: transform 0.2s;
                min-width: 0;
            }
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
            .hud-footer-time {
                position: absolute;
                bottom: 2px;
                right: 5px;
                font-size: 0.6rem;
                color: #aaa;
                font-style: italic;
            }
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
    document.head.appendChild(style);
  }

  const extractInt = (val) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const clean = val.toString().replace(/<[^>]*>/g, "");
    return parseInt(clean, 10) || 0;
  };

  const calculateMetrics = (data) => {
    if (!Array.isArray(data) || data.length === 0) return null;

    let totalDistricts = data.length;
    let totalObjects = 0;
    let totalPoints = 0;
    let totalExpired = 0;
    let totalToday = 0;
    let totalToExpire = 0;
    let totalAR = 0;

    data.forEach((d) => {
      totalObjects += extractInt(d.qtde);
      totalPoints += extractInt(d.qtdePontos);
      totalExpired += extractInt(d.qtdeVencido);
      totalToday += extractInt(d.qtdeHoje);
      totalToExpire += extractInt(d.qtdeAVencer);
      totalAR += extractInt(d.qtdeAR);
    });

    const deliveryDensity =
      totalObjects > 0 ? (totalObjects / totalPoints).toFixed(2) : 0;
    const chaosIndex =
      totalObjects > 0 ? ((totalExpired / totalObjects) * 100).toFixed(1) : 0;
    const operationalPressure =
      totalObjects > 0
        ? (((totalToday + totalToExpire) / totalObjects) * 100).toFixed(1)
        : 0;
    const arFactor =
      totalObjects > 0 ? ((totalAR / totalObjects) * 100).toFixed(1) : 0;

    return {
      raw: {
        totalDistricts,
        totalObjects,
        totalPoints,
        totalExpired,
        totalToday,
        totalToExpire,
        totalAR,
      },
      computed: { deliveryDensity, chaosIndex, operationalPressure, arFactor },
    };
  };

  function renderDashboard(metrics) {
    const oldDash = document.getElementById(HUD_ID);
    if (oldDash) oldDash.remove();

    if (!metrics) return;

    const target = document.querySelector(DOM_TARGET_SELECTOR);
    if (!target) return;

    const m = metrics.raw;
    const c = metrics.computed;

    let statusColor = "border-success";
    let statusText = "CONTROLADO";
    if (c.chaosIndex > 20) {
      statusColor = "border-warning";
      statusText = "ATENÇÃO";
    }
    if (c.chaosIndex > 50) {
      statusColor = "border-danger";
      statusText = "CRÍTICO";
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString("pt-BR");

    const container = document.createElement("div");
    container.id = HUD_ID;
    container.classList.add("hud-updated");

    container.innerHTML = `
            <div class="hud-card border-info">
                <div class="hud-title">Carga Total Suspensa</div>
                <div class="hud-value">${m.totalObjects} <span style="font-size:0.8rem; color:#888;">objs</span></div>
                <div class="hud-sub">📦 ${m.totalDistricts} distritos afetados</div>
            </div>
            <div class="hud-card ${statusColor}">
                <div class="hud-title">Backlog (Vencidos)</div>
                <div class="hud-value text-danger">${m.totalExpired}</div>
                <div class="hud-sub">🔥 ${c.chaosIndex}% da carga total</div>
            </div>
            <div class="hud-card border-warning">
                <div class="hud-title">Urgência (Hoje+Breve)</div>
                <div class="hud-value">${m.totalToday + m.totalToExpire}</div>
                <div class="hud-sub">⚠️ Pressão Operacional: ${c.operationalPressure}%</div>
            </div>
            <div class="hud-card border-info">
                <div class="hud-title">Complexidade (ARs)</div>
                <div class="hud-value">${m.totalAR}</div>
                <div class="hud-sub">📝 Fator de Retenção: ${c.arFactor}%</div>
            </div>
            <div class="hud-full">
                <div class="metric-box">
                    <div class="metric-lbl">DENSIDADE DO CLUSTER</div>
                    <div class="metric-val">${c.deliveryDensity} objs/ponto</div>
                </div>
                <div class="metric-box">
                    <div class="metric-lbl">TOTAL PONTOS FÍSICOS</div>
                    <div class="metric-val">📍 ${m.totalPoints}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-lbl">STATUS TÁTICO</div>
                    <div class="metric-val" style="font-weight:900;">${statusText}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-lbl">MÉDIA OBJS/DISTRITO</div>
                    <div class="metric-val">📊 ${(m.totalObjects / m.totalDistricts).toFixed(1)}</div>
                </div>
            </div>
            <div class="hud-footer-time">Atualizado às: ${timeString}</div>
        `;

    target.parentNode.insertBefore(container, target);
  }

  function processResponse(url, body) {
    if (!url || !url.includes("lancamentoController.php?acao=listar")) return;
    try {
      const data = typeof body === "string" ? JSON.parse(body) : body;
      if (Array.isArray(data)) {
        injectStyles();
        const metrics = calculateMetrics(data);
        setTimeout(() => renderDashboard(metrics), 300);
      }
    } catch (e) {}
  }

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const clone = response.clone();
    const url = args[0] ? args[0].toString() : "";
    if (url.includes("lancamentoController.php?acao=listar")) {
      clone
        .json()
        .then((data) => processResponse(url, data))
        .catch((e) => {});
    }
    return response;
  };

  const XHR = XMLHttpRequest.prototype;
  const open = XHR.open;
  const send = XHR.send;

  XHR.open = function (method, url) {
    this._sroUrl = url;
    return open.apply(this, arguments);
  };

  XHR.send = function (postData) {
    this.addEventListener("load", function () {
      if (
        this._sroUrl &&
        this._sroUrl.includes("lancamentoController.php?acao=listar")
      ) {
        try {
          const data = JSON.parse(this.responseText);
          processResponse(this._sroUrl, data);
        } catch (e) {}
      }
    });
    return send.apply(this, arguments);
  };
})();
