(function () {
  "use strict";

  let state = {
    trackingCode: null,
    launchId: null,
    status: "AGUARDANDO...",
    mode: "loading",
    district: "--",
    deliveryDate: "--/--/----",
    details: {},
  };

  let uiInitialized = false;
  let isDetailsOpen = localStorage.getItem("sro_details_open") === "true";
  let dragConfig = {
    active: false,
    currentX: 0,
    currentY: 0,
    initialX: 0,
    initialY: 0,
    xOffset: 0,
    yOffset: 0,
  };

  function initUI() {
    if (document.getElementById("sro-styles")) return;

    const style = document.createElement("style");
    style.id = "sro-styles";
    style.innerHTML = `
      #sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; }
      .sro-card { width: 280px; background: #fff; border-radius: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; opacity: 0; transform: translateY(-10px); transition: opacity 0.2s, transform 0.2s; border-left: 10px solid #999; display: none; }
      .sro-card.visible { display: block; opacity: 1; transform: translateY(0); }
      .sro-header { padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; background: #fff; cursor: grab; user-select: none; }
      .sro-header:active { cursor: grabbing; }
      .sro-status-text { font-size: 1rem; font-weight: 800; text-transform: uppercase; color: #444; letter-spacing: 0.5px; }
      .sro-icon { font-size: 1.3rem; }
      .sro-body { padding: 8px 12px; text-align: center; background: #fafafa; }
      .sro-label { font-size: 0.65rem; font-weight: 700; color: #999; text-transform: uppercase; margin-bottom: 0px; letter-spacing: 1px; }
      .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: #333; letter-spacing: -1px; margin: 2px 0 8px 0; pointer-events: none; }
      .sro-previsao-box { background: #eee; border-radius: 4px; padding: 4px; display: inline-block; min-width: 100%; }
      .sro-previsao-val { font-size: 0.9rem; font-weight: 700; color: #555; }
      .sro-details { background: #fff; border-top: 1px solid #eee; max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; }
      .sro-details.open { max-height: 400px; overflow-y: auto; }
      .sro-detail-content { padding: 8px 12px; font-size: 0.75rem; color: #666; }
      .sro-row { display: flex; justify-content: space-between; margin-bottom: 4px; border-bottom: 1px dashed #eee; padding-bottom: 2px; }
      .sro-key { font-weight: bold; color: #444; }
      .sro-val { text-align: right; max-width: 70%; word-wrap: break-word; }
      .sro-footer { background: #f4f4f4; padding: 5px; text-align: center; font-size: 0.65rem; font-weight: 700; color: #888; cursor: pointer; user-select: none; text-transform: uppercase; }
      .sro-footer:hover { background: #e9e9e9; color: #333; }
      .mode-loading { border-left-color: #95a5a6; }
      .mode-success { border-left-color: #2e7d32; }
      .mode-success .sro-header { background: #e8f5e9; }
      .mode-success .sro-status-text { color: #1b5e20; }
      .mode-success .sro-distrito { color: #1b5e20; }
      .mode-error { border-left-color: #c62828; }
      .mode-error .sro-header { background: #ffebee; }
      .mode-error .sro-status-text { color: #b71c1c; }
      .mode-info { border-left-color: #1565c0; }
      .mode-info .sro-header { background: #e3f2fd; }
      .mode-info .sro-status-text { color: #0d47a1; }
    `;
    document.head.appendChild(style);

    const container = document.createElement("div");
    container.id = "sro-container";

    container.innerHTML = `
      <div id="sro-card" class="sro-card mode-loading">
        <div id="sro-header" class="sro-header" title="Clique duas vezes para resetar a posição">
          <span id="sro-status" class="sro-status-text">AGUARDANDO...</span>
          <span id="sro-icon" class="sro-icon">⏳</span>
        </div>
        <div class="sro-body">
          <div class="sro-label">DISTRITO</div>
          <div id="sro-distrito" class="sro-distrito">--</div>
          <div class="sro-previsao-box">
            <div class="sro-label">PREVISÃO DE ENTREGA</div>
            <div id="sro-previsao" class="sro-previsao-val">--/--/----</div>
          </div>
        </div>
        <div id="sro-details" class="sro-details">
          <div id="sro-details-content" class="sro-detail-content"></div>
        </div>
        <div id="sro-footer" class="sro-footer">
          <span id="sro-footer-text">▼ MAIS INFORMAÇÕES</span>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    document
      .getElementById("sro-footer")
      .addEventListener("click", toggleDetails);
    const header = document.getElementById("sro-header");

    header.addEventListener("mousedown", dragStart, false);
    header.addEventListener("dblclick", resetPosition, false);
    document.addEventListener("mouseup", dragEnd, false);
    document.addEventListener("mousemove", drag, false);

    applyDetailsState();
    uiInitialized = true;
  }

  function resetPosition() {
    dragConfig.xOffset = 0;
    dragConfig.yOffset = 0;
    dragConfig.currentX = 0;
    dragConfig.currentY = 0;
    const container = document.getElementById("sro-container");
    if (container) setTranslate(0, 0, container);
  }

  function dragStart(e) {
    if (e.target.closest("#sro-footer")) return;
    dragConfig.initialX = e.clientX - dragConfig.xOffset;
    dragConfig.initialY = e.clientY - dragConfig.yOffset;
    if (
      e.target === document.getElementById("sro-header") ||
      e.target.parentNode === document.getElementById("sro-header")
    ) {
      dragConfig.active = true;
    }
  }

  function dragEnd() {
    dragConfig.initialX = dragConfig.currentX;
    dragConfig.initialY = dragConfig.currentY;
    dragConfig.active = false;
    adjustPositionInBounds();
  }

  function drag(e) {
    if (dragConfig.active) {
      e.preventDefault();
      dragConfig.currentX = e.clientX - dragConfig.initialX;
      dragConfig.currentY = e.clientY - dragConfig.initialY;
      dragConfig.xOffset = dragConfig.currentX;
      dragConfig.yOffset = dragConfig.currentY;
      setTranslate(
        dragConfig.currentX,
        dragConfig.currentY,
        document.getElementById("sro-container"),
      );
    }
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  function adjustPositionInBounds() {
    const container = document.getElementById("sro-container");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    let corrected = false;

    if (rect.right > winW) {
      dragConfig.currentX -= rect.right - winW + 10;
      corrected = true;
    }
    if (rect.left < 0) {
      dragConfig.currentX += Math.abs(rect.left) + 10;
      corrected = true;
    }
    if (rect.bottom > winH) {
      dragConfig.currentY -= rect.bottom - winH + 10;
      corrected = true;
    }
    if (rect.top < 0) {
      dragConfig.currentY += Math.abs(rect.top) + 10;
      corrected = true;
    }

    if (corrected) {
      dragConfig.xOffset = dragConfig.currentX;
      dragConfig.yOffset = dragConfig.currentY;
      dragConfig.initialX = dragConfig.currentX;
      dragConfig.initialY = dragConfig.currentY;
      setTranslate(dragConfig.currentX, dragConfig.currentY, container);
    }
  }

  function applyDetailsState() {
    const detailsEl = document.getElementById("sro-details");
    const footerTxt = document.getElementById("sro-footer-text");
    if (isDetailsOpen) {
      detailsEl.classList.add("open");
      footerTxt.innerText = "▲ MENOS INFORMAÇÕES";
    } else {
      detailsEl.classList.remove("open");
      footerTxt.innerText = "▼ MAIS INFORMAÇÕES";
    }
    setTimeout(adjustPositionInBounds, 310);
  }

  function toggleDetails() {
    isDetailsOpen = !isDetailsOpen;
    localStorage.setItem("sro_details_open", isDetailsOpen);
    applyDetailsState();
  }

  function render() {
    if (!uiInitialized) initUI();

    const card = document.getElementById("sro-card");
    const elStatus = document.getElementById("sro-status");
    const elIcon = document.getElementById("sro-icon");
    const elDistrito = document.getElementById("sro-distrito");
    const elPrevisao = document.getElementById("sro-previsao");
    const elContent = document.getElementById("sro-details-content");

    let icon = "⏳";
    if (state.mode === "success") icon = "✅";
    if (state.mode === "error") icon = "⛔";
    if (state.mode === "info") icon = "⚠️";

    card.className = `sro-card visible mode-${state.mode}`;
    elStatus.innerText = state.status;
    elIcon.innerText = icon;
    elDistrito.innerText = state.district;
    elPrevisao.innerText = state.deliveryDate || "--/--/----";

    let html = "";
    html += `<div class="sro-row"><span class="sro-key">Objeto:</span> <span class="sro-val">${state.trackingCode || "--"}</span></div>`;
    if (state.details.message)
      html += `<div class="sro-row"><span class="sro-key">Sistema:</span> <span class="sro-val">${state.details.message}</span></div>`;
    if (state.details.postman)
      html += `<div class="sro-row"><span class="sro-key">Carteiro:</span> <span class="sro-val">${state.details.postman}</span></div>`;
    if (state.details.services)
      html += `<div class="sro-row"><span class="sro-key">Serviços:</span> <span class="sro-val">${state.details.services}</span></div>`;

    elContent.innerHTML = html;
    setTimeout(adjustPositionInBounds, 100);
  }

  function resetState(newCode) {
    state = {
      trackingCode: newCode,
      launchId: null,
      status: "LENDO...",
      mode: "loading",
      district: "--",
      deliveryDate: "--/--/----",
      details: { message: "Processando..." },
    };
    render();
  }

  function processData(url, json) {
    let codeFromUrl = null;
    try {
      const u = new URL(url, window.location.origin);
      codeFromUrl =
        u.searchParams.get("codigo") ||
        u.searchParams.get("id") ||
        u.searchParams.get("objeto");
    } catch (e) {}

    if (
      url.includes("ObjetoController.php?acao=validar") &&
      codeFromUrl &&
      codeFromUrl !== state.trackingCode
    ) {
      resetState(codeFromUrl);
    }

    if (url.includes("ObjetoController.php?acao=validar")) {
      if (json.validacao) {
        if (state.mode !== "success" && state.mode !== "error") {
          state.mode = "info";
          state.status = "PRONTO P/ INDUZIR";
        }
        state.deliveryDate = json.previsaoEntrega?.data || "--/--/----";
        state.details.message = json.ultimoEventoDescricao || "Validado";
      } else {
        state.mode = "error";
        state.status = "NÃO INDUZIDO";
        state.details.message = json.excecao || "Objeto inválido";
        state.deliveryDate = "--/--/----";
      }
    } else if (url.includes("EnderecoController.php")) {
      if (json.servico) {
        let s = [];
        if (json.servico.ar === "S") s.push("AR");
        if (json.servico.mp === "S") s.push("MP");
        if (json.servico.dd === "S") s.push("DD");
        state.details.services = s.join(" + ");
      }
    } else if (url.includes("DistritamentoTrechoController.php")) {
      if (Array.isArray(json) && json.length > 0 && json[0].rotulo) {
        const parts = json[0].rotulo.split(" ");
        state.district =
          parts.length >= 2 ? `${parts[0]} ${parts[1]}` : json[0].rotulo;
      }
    } else if (
      url.includes("LancamentoController.php?acao=pesquisarLoecObjeto")
    ) {
      if (json.id) {
        state.mode = "success";
        state.status = "JÁ INDUZIDO";
        state.launchId = json.idLancamento;
        state.district = `${json.numeroDistrito} ${json.distritoComplemento}`;
        if (json.carteiro?.nome) state.details.postman = json.carteiro.nome;
        state.details.message = "Objeto já consta na lista.";
      }
    } else if (url.includes("LancamentoController.php?acao=salvar")) {
      if (json.idLancamento) {
        state.launchId = json.idLancamento;
        state.mode = "success";
        state.status = "OBJETO INDUZIDO";
        state.details.message = "Inclusão confirmada.";
        if (json.dataPrevista) state.deliveryDate = json.dataPrevista;
      }
    } else if (url.includes("LancamentoController.php?acao=listar")) {
      if (Array.isArray(json) && state.launchId) {
        const item = json.find((i) => i.idLancamento === state.launchId);
        if (item) {
          state.district = item.numeroDistrito;
          if (item.nomeCarteiro) state.details.postman = item.nomeCarteiro;
          render();
        }
      }
    } else if (url.includes("ObjetoController.php?acao=excluir")) {
      state.mode = "error";
      state.status = "EXCLUÍDO";
      state.district = "--";
      state.details.message = "Objeto removido da lista.";
      state.deliveryDate = "--/--/----";
    }
    render();
  }

  const nativeFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = args[0] ? args[0].toString() : "";
    const init = args[1];
    if (
      url.includes("LancamentoController.php?acao=salvar") &&
      init &&
      init.body
    ) {
      try {
        const payload = JSON.parse(init.body);
        if (payload.distrito) {
          state.district = payload.distrito;
          render();
        }
      } catch (e) {}
    }
    const response = await nativeFetch.apply(this, args);
    try {
      if (url.includes("Controller.php")) {
        const clone = response.clone();
        clone
          .json()
          .then((data) => processData(url, data))
          .catch(() => {});
      }
    } catch (e) {}
    return response;
  };

  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this._sroTargetUrl = url;
    return nativeOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    if (
      this._sroTargetUrl &&
      this._sroTargetUrl.includes("LancamentoController.php?acao=salvar") &&
      body
    ) {
      try {
        const payload = JSON.parse(body);
        if (payload.distrito) {
          state.district = payload.distrito;
          render();
        }
      } catch (e) {}
    }
    this.addEventListener("load", function () {
      if (this._sroTargetUrl && this._sroTargetUrl.includes("Controller.php")) {
        try {
          const data = JSON.parse(this.responseText);
          processData(this._sroTargetUrl, data);
        } catch (e) {}
      }
    });
    return nativeSend.apply(this, arguments);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI);
  } else {
    initUI();
  }
})();
