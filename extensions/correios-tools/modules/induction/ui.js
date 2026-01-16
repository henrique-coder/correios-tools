import { Position } from "../../lib/cache.js";
import { createElement, injectStylesheet, observeElement, waitForElement } from "../../lib/dom.js";
import { COLORS, STRINGS } from "../../src/constants.js";
import { renderRightPanel } from "./panorama.js";
import { InductionState } from "./state.js";

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
  .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: ${COLORS.PRIMARY}; margin: 6px 0; }
  .sro-new { color: ${COLORS.PRIMARY}; font-size: 3rem; font-weight: 900; }
  .sro-sm-old { font-size: 13px; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .sro-sm-arr { font-size: 12px; color: #ccc; margin: 2px 0; }
  .sro-loader { width: 30px; height: 30px; border: 3px solid rgba(0,0,0,0.1); border-left-color: #555; border-radius: 50%; animation: sro-spin 0.8s linear infinite; position: absolute; top: 50%; left: 50%; margin-top: -15px; margin-left: -15px; z-index: 20; }
  @keyframes sro-spin { 100% { transform: rotate(360deg); } }
  .mode-loading { border-left-color: #7f8c8d; }
  .mode-success { border-left-color: ${COLORS.SUCCESS}; } .mode-success .sro-header { background: #e0f2f1; }
  .mode-error { border-left-color: ${COLORS.ERROR}; } .mode-error .sro-header { background: #ffebee; }
  .mode-info { border-left-color: ${COLORS.INFO}; } .mode-info .sro-header { background: #e3f2fd; }
  #sro-table-wrapper { margin-top: 25px; font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #ccc; background: #fff; width: 100%; box-sizing: border-box; clear: both; pointer-events: auto; }
  .sro-table-header { background: ${COLORS.PRIMARY}; color: #ffffff !important; padding: 8px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; display: flex; justify-content: space-between; border-bottom: 3px solid ${COLORS.ACCENT}; }
  .sro-full-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .sro-full-table th { background: #f0f0f0; color: #333; text-align: left; padding: 5px 8px; border: 1px solid #ddd; font-weight: 700; white-space: nowrap; width: 1%; }
  .sro-full-table td { padding: 5px 8px; border: 1px solid #ddd; color: #000; word-break: break-word; }
  .hl-val { color: #2e7d32; font-weight: 800; background: #e8f5e9; padding: 1px 4px; border-radius: 3px; }
  .hl-err { color: #c62828; font-weight: 800; background: #ffebee; padding: 1px 4px; border-radius: 3px; }
  .hl-dist { font-size: 15px; font-weight: 800; color: ${COLORS.PRIMARY}; }
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

function formatTimestamp(timestamp) {
  if (!timestamp || timestamp.length < 18) return STRINGS.EMPTY;
  const date = `${timestamp.substring(8, 10)}/${timestamp.substring(10, 12)}/${timestamp.substring(
    12,
    16
  )}`;
  const time = `${timestamp.substring(16, 18)}:${timestamp.substring(18, 20)}`;
  return `${date} às ${time}`;
}

function renderDistrictVisual() {
  const visual = InductionState.getVisualDistrict();

  if (visual.type === "changed") {
    return `<div style="display:flex;align-items:center;justify-content:center;">
      <span class="sro-sm-old" style="margin-right:6px">${visual.old}</span>
      <span class="sro-sm-arr" style="margin-right:6px">➜</span>
      <span class="sro-new">${visual.new}</span>
    </div>`;
  }

  return `<span class="sro-new">${visual.value}</span>`;
}

function renderServiceBadge(serviceName, serviceKey) {
  const state = InductionState.get();
  const active = state.services[serviceKey] === "S";
  return `<span class="${active ? "hl-serv" : "hl-serv-off"}">${serviceName}</span>`;
}

function applyPosition(container) {
  const pos = Position.get();
  dragState.currentX = pos.x;
  dragState.currentY = pos.y;
  dragState.offsetX = pos.x;
  dragState.offsetY = pos.y;
  container.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
}

function savePosition() {
  Position.set(dragState.currentX, dragState.currentY);
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

function handleDragStart(event) {
  dragState.initialX = event.clientX - dragState.offsetX;
  dragState.initialY = event.clientY - dragState.offsetY;
  dragState.active = true;
}

function handleDragEnd() {
  dragState.initialX = dragState.currentX;
  dragState.initialY = dragState.currentY;
  dragState.active = false;
  savePosition();
  constrainToViewport();
}

function handleDrag(event) {
  if (!dragState.active) return;
  event.preventDefault();

  dragState.currentX = event.clientX - dragState.initialX;
  dragState.currentY = event.clientY - dragState.initialY;
  dragState.offsetX = dragState.currentX;
  dragState.offsetY = dragState.currentY;

  const container = document.getElementById("sro-container");
  if (container) {
    container.style.transform = `translate3d(${dragState.currentX}px, ${dragState.currentY}px, 0)`;
  }
}

function constrainToViewport() {
  const container = document.getElementById("sro-container");
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let adjusted = false;

  if (rect.left < 0) {
    dragState.currentX += 0 - rect.left;
    adjusted = true;
  }
  if (rect.top < 0) {
    dragState.currentY += 0 - rect.top;
    adjusted = true;
  }
  if (rect.right > viewportWidth) {
    dragState.currentX -= rect.right - viewportWidth;
    adjusted = true;
  }
  if (rect.bottom > viewportHeight) {
    dragState.currentY -= rect.bottom - viewportHeight;
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

export function initUI() {
  injectStylesheet("sro-styles", STYLES);
  createFloatingCard();
  createDataTable();
  setupInputObserver();
  setupDistrictSelector();

  InductionState.onChange(() => updateUI());
}

function createFloatingCard() {
  if (document.getElementById("sro-container")) return;

  const container = createElement("div", { id: "sro-container" });
  container.innerHTML = `
    <div class="sro-layout-row">
      <div id="sro-card" class="sro-card mode-loading">
        <div id="sro-header" class="sro-header" title="Segure para mover">
          <span id="sro-status" class="sro-status-text">${STRINGS.WAIT}</span>
          <div style="display:flex;align-items:center">
            <span id="sro-icon" class="sro-icon">⏳</span>
          </div>
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
      <tr>
        <th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">${STRINGS.EMPTY}</td>
        <th>STATUS</th><td id="td-stt">${STRINGS.EMPTY}</td>
        <th>VALIDAÇÃO</th><td id="td-val">${STRINGS.EMPTY}</td>
        <th>DATA PREV.</th><td id="td-dat-prev">${STRINGS.EMPTY}</td>
      </tr>
      <tr id="row-exc" style="display:none">
        <th style="color:#c62828">EXCEÇÃO</th><td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">${STRINGS.EMPTY}</td>
      </tr>
      <tr>
        <th>ENDEREÇO</th><td colspan="5" id="td-end-full">${STRINGS.EMPTY}</td>
        <th>CEP</th><td id="td-cep" style="font-weight:bold">${STRINGS.EMPTY}</td>
      </tr>
      <tr>
        <th>CONTATO</th><td colspan="7" id="td-con">${STRINGS.EMPTY}</td>
      </tr>
      <tr>
        <th>DISTRITO</th><td id="td-dis" class="hl-dist">${STRINGS.EMPTY}</td>
        <th>ORDEM</th><td id="td-ord">${STRINGS.EMPTY}</td>
        <th>LADO</th><td id="td-lad">${STRINGS.EMPTY}</td>
        <th>SERVIÇOS</th><td colspan="3" id="td-srv">${STRINGS.EMPTY}</td>
      </tr>
      <tr>
        <th rowspan="2">INDUÇÃO</th>
        <td colspan="7">
          <span style="color:#777">L:</span> <b id="td-lis">${STRINGS.EMPTY}</b>  |
          <span style="color:#777">E:</span> <b id="td-est">${STRINGS.EMPTY}</b>  |
          <span style="color:#777">U:</span> <b id="td-usu">${STRINGS.EMPTY}</b>  |
          <span style="color:#777">DATA:</span> <b id="td-dat">${STRINGS.EMPTY}</b>
        </td>
      </tr>
      <tr>
        <td colspan="7" style="background:#fffde7;border-left:3px solid #fbc02d">
          <span style="color:#f57f17;font-weight:bold;text-transform:uppercase">CARTEIRO:</span>
          <b id="td-postman" style="font-size:12px;color:#333;margin-left:5px">${STRINGS.EMPTY}</b>
        </td>
      </tr>
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
    InductionState.setLastErrorValue(input.value);
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      setTimeout(() => {
        const message = field.querySelector(".mensagem");
        if (message) {
          const text = message.innerText || "";
          if (text.includes("Formato de objeto postal") || text.includes("Preencha este campo")) {
            handleError();
          }
        }
      }, 300);
    }
  });

  observeElement(field, () => {
    const message = field.querySelector(".mensagem");
    if (message) {
      const text = message.innerText || "";
      if (text.includes("Formato de objeto postal") || text.includes("Preencha este campo")) {
        if (input.value !== InductionState.getLastErrorValue()) {
          handleError();
        }
      }
    }
  });
}

async function setupDistrictSelector() {
  const selector = await waitForElement("#selDistrito");
  if (!selector) return;

  const updateDistrict = (event) => {
    InductionState.setField("domDist", event.target.value);
  };

  selector.addEventListener("change", updateDistrict);
  selector.addEventListener("input", updateDistrict);
}

export function updateUI() {
  const state = InductionState.get();

  const card = document.getElementById("sro-card");
  const status = document.getElementById("sro-status");
  const icon = document.getElementById("sro-icon");
  const distrito = document.getElementById("sro-distrito");
  const previsao = document.getElementById("sro-previsao");

  if (card) card.className = `sro-card visible mode-${state.mode}`;
  if (status) status.innerText = state.status;
  if (icon) icon.innerText = getIcon(state.mode);
  if (distrito) distrito.innerHTML = renderDistrictVisual();
  if (previsao) previsao.innerText = state.date || STRINGS.DATE_EMPTY;

  updateDataTable();

  const mapContainer = document.getElementById("div-map");
  if (mapContainer) renderRightPanel(mapContainer);
}

function updateDataTable() {
  const state = InductionState.get();
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
    const complement = addr.complement ? ` - ${addr.complement}` : "";
    tdEndFull.innerText = `${addr.street}, ${addr.number}${complement} - ${addr.neighborhood}, ${addr.city}/${addr.state}`;
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
  if (tdDis) tdDis.innerHTML = renderDistrictVisual();

  const tdOrd = $("td-ord");
  if (tdOrd) tdOrd.innerText = state.operation.order;

  const tdLad = $("td-lad");
  if (tdLad) tdLad.innerText = state.operation.side;

  const tdSrv = $("td-srv");
  if (tdSrv) {
    tdSrv.innerHTML =
      renderServiceBadge("AR", "ar") +
      renderServiceBadge("MP", "mp") +
      renderServiceBadge("DD", "dd");
  }

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
