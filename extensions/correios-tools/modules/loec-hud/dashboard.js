import { createElement, injectStylesheet } from "../../lib/dom.js";
import { getStatusLevel } from "./metrics.js";

const HUD_ID = "sro-hud-dashboard";

const STYLES = `
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
  #${HUD_ID} * { box-sizing: border-box; }
  @keyframes pulse-green {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  .hud-updated { animation: pulse-green 1s; }
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

export function renderDashboard(metrics) {
  const existing = document.getElementById(HUD_ID);
  if (existing) existing.remove();

  if (!metrics) return;

  const target = document.querySelector(".botoes");
  if (!target) return;

  const m = metrics.raw;
  const c = metrics.computed;
  const status = getStatusLevel(parseFloat(c.chaosIndex));
  const timeString = new Date().toLocaleTimeString("pt-BR");

  const container = createElement("div", {
    id: HUD_ID,
    className: "hud-updated",
  });

  container.innerHTML = `
    <div class="hud-card border-info">
      <div class="hud-title">Carga Total Suspensa</div>
      <div class="hud-value">${
        m.totalObjects
      } <span style="font-size:0.8rem; color:#888;">objs</span></div>
      <div class="hud-sub">📦 ${m.totalDistricts} distritos afetados</div>
    </div>
    <div class="hud-card ${status.color}">
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
        <div class="metric-val" style="font-weight:900;">${status.text}</div>
      </div>
      <div class="metric-box">
        <div class="metric-lbl">MÉDIA OBJS/DISTRITO</div>
        <div class="metric-val">📊 ${c.avgObjectsPerDistrict}</div>
      </div>
    </div>
    <div class="hud-footer-time">Atualizado às: ${timeString}</div>
  `;

  target.parentNode.insertBefore(container, target);
}

export function initStyles() {
  injectStylesheet("sro-hud-styles", STYLES);
}
