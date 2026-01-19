!(function () {
  "use strict";

  const path = window.location.pathname.toLowerCase();

  if (path.includes("/lancamentoautomatico/")) {
    initInductionModule();
  } else if (path.includes("/loecsuspensa/")) {
    initLoecHudModule();
  }

  function initInductionModule() {
    const STR_WAIT = "AGUARDANDO...";
    const STR_PREV = "PREVISÃO";
    const STR_DATE = "--/--/----";
    const STR_EMPTY = "--";
    const KEY_POS = "correiostools-card-position";
    const KEY_PANEL = "correiostools-panel-mode";

    let state = {
      code: STR_EMPTY,
      status: STR_WAIT,
      mode: "loading",
      district: STR_EMPTY,
      domDist: null,
      initialDist: null,
      pendingDist: null,
      date: STR_DATE,
      exc: STR_EMPTY,
      val: STR_EMPTY,
      lastEvt: STR_EMPTY,
      addr: {
        log: STR_EMPTY,
        num: STR_EMPTY,
        comp: STR_EMPTY,
        bair: STR_EMPTY,
        mun: STR_EMPTY,
        uf: STR_EMPTY,
        cep: STR_EMPTY,
      },
      serv: { ar: "N", mp: "N", dd: "N" },
      contact: { tel: STR_EMPTY, email: STR_EMPTY },
      op: {
        list: STR_EMPTY,
        user: STR_EMPTY,
        postman: STR_EMPTY,
        st: STR_EMPTY,
        ts: STR_EMPTY,
        ord: STR_EMPTY,
        side: STR_EMPTY,
      },
      panelMode: false,
    };

    let drag = { active: false, cX: 0, cY: 0, iX: 0, iY: 0, xOff: 0, yOff: 0 };
    let lastErrVal = null;

    function autoDismissPrintPopup() {
      let attempts = 0;
      const interval = setInterval(() => {
        const btn = document.getElementById("btnImprimirEtiquetaNao");
        if (btn) {
          btn.click();
          clearInterval(interval);
          autoDismissOkAlert();
        }
        if (++attempts >= 100) clearInterval(interval);
      }, 50);
    }

    function autoDismissOkAlert() {
      let attempts = 0;
      const interval = setInterval(() => {
        const okBtn = document.querySelector("#alerta.aberto .act a");
        if (okBtn && okBtn.innerText === "OK") {
          okBtn.click();
          clearInterval(interval);
        }
        if (++attempts >= 100) clearInterval(interval);
      }, 50);
    }

    function focusErrorField(field) {
      if (document.activeElement === document.getElementById("selDistrito")) return;
      field.click();
      field.focus();
      lastErrVal = field.value;
    }

    function observeObjectInput() {
      const input = document.getElementById("txtObjeto");
      if (!input) return setTimeout(observeObjectInput, 1000);
      const container = input.closest(".campo") || input.parentElement;
      if (!container) return;

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          setTimeout(() => {
            const msg = container.querySelector(".mensagem");
            if (msg) {
              const text = msg.innerText || "";
              if (
                text.includes("Formato de objeto postal") ||
                text.includes("Preencha este campo")
              ) {
                focusErrorField(input);
              }
            }
          }, 300);
        }
      });

      new MutationObserver(() => {
        const msg = container.querySelector(".mensagem");
        if (msg) {
          const text = msg.innerText || "";
          if (
            (text.includes("Formato de objeto postal") || text.includes("Preencha este campo")) &&
            input.value !== lastErrVal
          ) {
            focusErrorField(input);
          }
        }
      }).observe(container, { childList: true, subtree: true, characterData: true });
    }

    function observeDistrictSelect() {
      const sel = document.getElementById("selDistrito");
      if (!sel) return setTimeout(observeDistrictSelect, 1000);
      const handler = (e) => {
        state.domDist = e.target.value;
        updateUI();
      };
      sel.addEventListener("change", handler);
      sel.addEventListener("input", handler);
    }

    function getVisualDistrict(panelStyle) {
      let dist = state.domDist && state.domDist !== "" ? state.domDist : state.district;
      if (dist) dist = dist.trim();
      const oldClass = panelStyle ? "sro-old-p" : "sro-old";
      const arrowClass = panelStyle ? "sro-arrow-p" : "sro-arrow";
      const newClass = panelStyle ? "sro-new-p" : "sro-new";
      const wrapStyle = panelStyle
        ? "display:flex;align-items:center;justify-content:center;flex-wrap:wrap;flex:1;"
        : "display:flex;align-items:center;justify-content:center";

      if (state.initialDist && state.initialDist !== STR_EMPTY) {
        if (dist && dist !== STR_EMPTY && dist !== state.initialDist) {
          return `<div style="${wrapStyle}"><span class="${oldClass}">${state.initialDist}</span><span class="${arrowClass}">➜</span><span class="${newClass}">${dist}</span></div>`;
        }
        return `<span class="${newClass}">${state.initialDist}</span>`;
      }
      return `<span class="${newClass}">${dist || STR_EMPTY}</span>`;
    }

    function togglePanelMode() {
      const mapDiv = document.getElementById("div-map");
      if (!mapDiv && !state.panelMode) return;
      state.panelMode = !state.panelMode;
      localStorage.setItem(KEY_PANEL, JSON.stringify(state.panelMode));
      updateUI();
      if (!state.panelMode) setTimeout(constrainToViewport, 50);
    }

    function injectStyles() {
      if (document.getElementById("sro-styles")) return;
      const style = document.createElement("style");
      style.id = "sro-styles";
      style.innerHTML = `
        #sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); will-change: transform; pointer-events: none; }
        .sro-snap { transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .sro-card { width: 360px; background: #fff; border-radius: 6px; font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; opacity: 0; transition: opacity 0.2s; border-left: 8px solid #999; display: none; pointer-events: auto; }
        .sro-card.visible { display: block; opacity: 1; }
        .sro-header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border-bottom: 1px solid #eee; cursor: grab; user-select: none; }
        .sro-status-text { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; color: #444; }
        .sro-btn-panel { cursor: pointer; font-size: 1.2rem; color: #555; transition: color 0.2s; margin-left: 10px; line-height: 1; }
        .sro-btn-panel:hover { color: #00416B; }
        .sro-body { padding: 12px; text-align: center; background: #fff; }
        .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: #00416B; margin: 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; justify-content: center; align-items: center; min-height: 50px; }
        .sro-old { font-size: 2rem; opacity: 0.35; font-weight: 700; color: #000; margin-right: 5px; }
        .sro-arrow { font-size: 2rem; margin: 0 10px; color: #444; font-weight: 400; }
        .sro-new { color: #00416B; font-size: 3rem; font-weight: 900; }
        #sro-panel-view { background: #fff; padding: 15px; text-align: center; border-radius: 4px; width: 100%; height: 100%; min-height: 450px; box-sizing: border-box; display: flex; flex-direction: column; box-shadow: inset 0 0 20px rgba(0,0,0,0.02); }
        .sro-panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 10px; width: 100%; }
        .sro-panel-content { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; }
        .sro-distrito-p { width: 100%; word-break: break-word; display: flex; justify-content: center; align-items: center; margin: 20px 0; }
        .sro-old-p { font-size: 2.5rem; opacity: 0.35; font-weight: 700; color: #000; margin-right: 15px; }
        .sro-arrow-p { font-size: 2.5rem; margin: 0 20px; color: #444; font-weight: 400; }
        .sro-new-p { color: #00416B; font-size: 5rem; font-weight: 900; line-height: 1; }
        .sro-status-p { font-size: 1.4rem; font-weight: 800; text-transform: uppercase; color: #444; letter-spacing: 1px; text-align: left; }
        .sro-restore-btn { font-size: 11px; text-decoration: none; color: #333; background: #f9f9f9; padding: 6px 12px; border-radius: 4px; cursor: pointer; border: 1px solid #ccc; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; justify-content: center; min-width: 110px; height: 32px; transition: all 0.2s; white-space: nowrap; line-height: 1; }
        .sro-restore-btn:hover { background: #e0e0e0; color: #000; border-color: #999; }
        .mode-loading { border-left-color: #7f8c8d; }
        .mode-success { border-left-color: #009688; } .mode-success .sro-header { background: #e0f2f1; } .mode-success .sro-status-text { color: #00695c; }
        .mode-error { border-left-color: #d32f2f; } .mode-error .sro-header { background: #ffebee; } .mode-error .sro-status-text { color: #c62828; }
        .mode-info { border-left-color: #1976d2; } .mode-info .sro-header { background: #e3f2fd; } .mode-info .sro-status-text { color: #0d47a1; }
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
      `;
      document.head.appendChild(style);
    }

    function injectFloatingCard() {
      injectStyles();
      const container = document.createElement("div");
      container.id = "sro-container";
      container.innerHTML = `
        <div id="sro-card" class="sro-card mode-loading">
          <div id="sro-header" class="sro-header" title="Clique duas vezes para resetar a posição">
            <span id="sro-status" class="sro-status-text">${STR_WAIT}</span>
            <div style="display:flex;align-items:center">
              <span id="sro-icon" class="sro-icon">⏳</span>
              <span id="btn-panel-toggle" class="sro-btn-panel" title="Mover para Painel">⤢</span>
            </div>
          </div>
          <div class="sro-body">
            <div id="sro-distrito" class="sro-distrito">${STR_EMPTY}</div>
            <div style="font-size:12px;color:#666;margin-top:4px">${STR_PREV}: <strong id="sro-previsao" style="color:#333">${STR_DATE}</strong></div>
          </div>
        </div>`;
      document.body.appendChild(container);
      document.getElementById("btn-panel-toggle").addEventListener("click", togglePanelMode);

      try {
        const pos = JSON.parse(localStorage.getItem(KEY_POS));
        if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
          drag.cX = pos.x;
          drag.cY = pos.y;
          drag.xOff = pos.x;
          drag.yOff = pos.y;
          container.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        }
        if (JSON.parse(localStorage.getItem(KEY_PANEL)) === true) state.panelMode = true;
      } catch {}

      const header = document.getElementById("sro-header");
      header.addEventListener("mousedown", handleDragStart);
      header.addEventListener("dblclick", resetPosition);
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("mousemove", handleDrag);
      window.addEventListener("resize", constrainToViewport);

      injectDataTable();
      observeObjectInput();
      observeDistrictSelect();
      if (!state.panelMode) constrainToViewport();
    }

    function injectDataTable() {
      if (document.getElementById("sro-table-wrapper")) return;
      const target = document.querySelector(".botoes");
      if (!target) return setTimeout(injectDataTable, 500);
      const wrapper = document.createElement("div");
      wrapper.id = "sro-table-wrapper";
      wrapper.innerHTML = `
        <div class="sro-table-header"><span style="color:#ffffff !important">DADOS OPERACIONAIS</span><span style="opacity:0.7;color:#fff">SRO EXT</span></div>
        <table class="sro-full-table">
          <tr><th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">${STR_EMPTY}</td><th>STATUS</th><td id="td-stt">${STR_EMPTY}</td><th>VALIDAÇÃO</th><td id="td-val">${STR_EMPTY}</td><th>DATA PREV.</th><td id="td-dat-prev">${STR_EMPTY}</td></tr>
          <tr id="row-exc" style="display:none"><th style="color:#c62828">EXCEÇÃO</th><td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">${STR_EMPTY}</td></tr>
          <tr><th>ENDEREÇO</th><td colspan="5" id="td-end-full">${STR_EMPTY}</td><th>CEP</th><td id="td-cep" style="font-weight:bold">${STR_EMPTY}</td></tr>
          <tr><th>CONTATO</th><td colspan="7" id="td-con">${STR_EMPTY}</td></tr>
          <tr><th>DISTRITO</th><td id="td-dis" class="hl-dist">${STR_EMPTY}</td><th>ORDEM</th><td id="td-ord">${STR_EMPTY}</td><th>LADO</th><td id="td-lad">${STR_EMPTY}</td><th>SERVIÇOS</th><td colspan="3" id="td-srv">${STR_EMPTY}</td></tr>
          <tr><th rowspan="2">INDUÇÃO</th><td colspan="7"><span style="color:#777">L:</span> <b id="td-lis">${STR_EMPTY}</b> &nbsp;|&nbsp; <span style="color:#777">E:</span> <b id="td-est">${STR_EMPTY}</b> &nbsp;|&nbsp; <span style="color:#777">U:</span> <b id="td-usu">${STR_EMPTY}</b> &nbsp;|&nbsp; <span style="color:#777">DATA:</span> <b id="td-dat">${STR_EMPTY}</b></td></tr>
          <tr><td colspan="7" style="background:#fffde7;border-left:3px solid #fbc02d"><span style="color:#f57f17;font-weight:bold;text-transform:uppercase">CARTEIRO:</span> <b id="td-postman" style="font-size:12px;color:#333;margin-left:5px">${STR_EMPTY}</b></td></tr>
        </table>`;
      target.insertAdjacentElement("afterend", wrapper);
    }

    function savePosition() {
      localStorage.setItem(KEY_POS, JSON.stringify({ x: drag.cX, y: drag.cY }));
    }

    function resetPosition() {
      const container = document.getElementById("sro-container");
      if (!container) return;
      drag.xOff = 0;
      drag.yOff = 0;
      drag.cX = 0;
      drag.cY = 0;
      container.classList.add("sro-snap");
      container.style.transform = "translate3d(0px, 0px, 0)";
      setTimeout(() => container.classList.remove("sro-snap"), 300);
      savePosition();
    }

    function handleDragStart(e) {
      drag.iX = e.clientX - drag.xOff;
      drag.iY = e.clientY - drag.yOff;
      drag.active = true;
    }

    function handleDragEnd() {
      drag.iX = drag.cX;
      drag.iY = drag.cY;
      drag.active = false;
      savePosition();
      constrainToViewport();
    }

    function handleDrag(e) {
      if (!drag.active) return;
      e.preventDefault();
      drag.cX = e.clientX - drag.iX;
      drag.cY = e.clientY - drag.iY;
      drag.xOff = drag.cX;
      drag.yOff = drag.cY;
      const container = document.getElementById("sro-container");
      if (container) container.style.transform = `translate3d(${drag.cX}px, ${drag.cY}px, 0)`;
    }

    function constrainToViewport() {
      const container = document.getElementById("sro-container");
      if (!container || state.panelMode) return;
      const rect = container.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let adjusted = false;

      if (rect.left < 0) {
        drag.cX += 0 - rect.left;
        adjusted = true;
      }
      if (rect.top < 0) {
        drag.cY += 0 - rect.top;
        adjusted = true;
      }
      if (rect.right > vw) {
        drag.cX -= rect.right - vw;
        adjusted = true;
      }
      if (rect.bottom > vh) {
        drag.cY -= rect.bottom - vh;
        adjusted = true;
      }

      if (adjusted) {
        container.classList.add("sro-snap");
        drag.xOff = drag.cX;
        drag.yOff = drag.cY;
        container.style.transform = `translate3d(${drag.cX}px, ${drag.cY}px, 0)`;
        setTimeout(() => container.classList.remove("sro-snap"), 300);
        savePosition();
      }
    }

    function formatTimestamp(ts) {
      if (!ts || ts.length < 18) return STR_EMPTY;
      const d = `${ts.substring(8, 10)}/${ts.substring(10, 12)}/${ts.substring(12, 16)}`;
      const t = `${ts.substring(16, 18)}:${ts.substring(18, 20)}`;
      return `${d} às ${t}`;
    }

    function updateUI() {
      injectFloatingCard();
      const card = document.getElementById("sro-card");
      const statusEl = document.getElementById("sro-status");
      const iconEl = document.getElementById("sro-icon");
      const distEl = document.getElementById("sro-distrito");
      const prevEl = document.getElementById("sro-previsao");

      let icon = "⏳";
      if (state.mode === "success") icon = "✅";
      else if (state.mode === "error") icon = "⛔";
      else if (state.mode === "info") icon = "⚠️";

      const mapDiv = document.getElementById("div-map");
      if (state.panelMode && !mapDiv) state.panelMode = false;

      if (state.panelMode) {
        card.className = `sro-card mode-${state.mode}`;
        if (mapDiv) {
          const painel = document.getElementById("painel");
          if (painel) painel.style.display = "none";
          let panelView = document.getElementById("sro-panel-view");
          if (!panelView) {
            panelView = document.createElement("div");
            panelView.id = "sro-panel-view";
            mapDiv.appendChild(panelView);
          }
          const color =
            state.mode === "success"
              ? "#009688"
              : state.mode === "error"
                ? "#d32f2f"
                : state.mode === "info"
                  ? "#1976d2"
                  : "#999";
          panelView.style.borderLeft = `10px solid ${color}`;
          panelView.innerHTML = `
            <div class="sro-panel-header">
              <span class="sro-status-p" style="color:${color}">${state.status}</span>
              <button id="btn-panel-restore" class="sro-restore-btn" title="Voltar ao modo Popup">Restaurar <span style="font-size:15px;margin-left:6px;line-height:1">⤡</span></button>
            </div>
            <div class="sro-panel-content">
              <div class="sro-distrito-p">${getVisualDistrict(true)}</div>
              <div style="font-size:16px;color:#666;margin-top:20px">${STR_PREV}: <strong>${state.date || STR_DATE}</strong></div>
            </div>`;
          document.getElementById("btn-panel-restore").addEventListener("click", togglePanelMode);
        }
      } else {
        card.className = `sro-card visible mode-${state.mode}`;
        statusEl.innerText = state.status;
        iconEl.innerText = icon;
        distEl.innerHTML = getVisualDistrict(false);
        prevEl.innerText = state.date || STR_DATE;
        if (mapDiv) {
          const panelView = document.getElementById("sro-panel-view");
          if (panelView) panelView.remove();
          const painel = document.getElementById("painel");
          if (painel) painel.style.display = "block";
        }
      }

      const el = (id) => document.getElementById(id);
      if (el("td-cod")) {
        el("td-cod").innerText = state.code;
        const val = state.val;
        el("td-val").innerHTML = val
          ? `<span class="${val.includes("V") ? "hl-val" : "hl-err"}">${val}</span>`
          : STR_EMPTY;
        el("td-stt").innerText = state.lastEvt;
        el("td-dat-prev").innerText = state.date;
        const exc = state.exc;
        if (exc && exc !== STR_EMPTY) {
          el("td-exc").innerText = exc;
          document.getElementById("row-exc").style.display = "table-row";
        } else {
          document.getElementById("row-exc").style.display = "none";
        }
        el("td-end-full").innerText =
          `${state.addr.log}, ${state.addr.num} ${state.addr.comp ? "- " + state.addr.comp : ""} - ${state.addr.bair}, ${state.addr.mun}/${state.addr.uf}`;
        el("td-cep").innerText = state.addr.cep;
        el("td-con").innerHTML =
          `TEL: <b>${state.contact.tel}</b> ${state.contact.email !== STR_EMPTY ? " | EMAIL: " + state.contact.email : ""}`;
        el("td-dis").innerHTML = getVisualDistrict(false);
        el("td-ord").innerText = state.op.ord;
        el("td-lad").innerText = state.op.side;
        const srvBadge = (key, label) =>
          `<span class="${state.serv[key] === "S" ? "hl-serv" : "hl-serv-off"}">${label}</span>`;
        el("td-srv").innerHTML = srvBadge("ar", "AR") + srvBadge("mp", "MP") + srvBadge("dd", "DD");
        el("td-lis").innerText = state.op.list;
        el("td-est").innerText = state.op.st;
        el("td-usu").innerText = state.op.user;
        el("td-dat").innerText = formatTimestamp(state.op.ts);
        el("td-postman").innerText = state.op.postman;
      }
    }

    function handleResponse(url, data) {
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
        const panelMode = JSON.parse(localStorage.getItem(KEY_PANEL) || "false");
        state = {
          code,
          status: STR_WAIT,
          mode: "loading",
          district: STR_EMPTY,
          domDist: null,
          initialDist: null,
          pendingDist: null,
          date: STR_DATE,
          exc: STR_EMPTY,
          val: STR_EMPTY,
          lastEvt: STR_EMPTY,
          addr: {
            log: STR_EMPTY,
            num: STR_EMPTY,
            comp: STR_EMPTY,
            bair: STR_EMPTY,
            mun: STR_EMPTY,
            uf: STR_EMPTY,
            cep: STR_EMPTY,
          },
          serv: { ar: "N", mp: "N", dd: "N" },
          contact: { tel: STR_EMPTY, email: STR_EMPTY },
          op: {
            list: STR_EMPTY,
            user: STR_EMPTY,
            postman: STR_EMPTY,
            st: STR_EMPTY,
            ts: STR_EMPTY,
            ord: STR_EMPTY,
            side: STR_EMPTY,
          },
          panelMode,
        };
        updateUI();
      }

      if (urlLower.includes("acao=validar")) {
        state.val = data.validacao || STR_EMPTY;
        state.exc = data.excecao || STR_EMPTY;
        state.lastEvt = data.ultimoEventoDescricao || STR_EMPTY;
        if (data.validacao) {
          if (state.mode !== "success" && state.mode !== "error") state.mode = "info";
          if (state.status !== "success" && state.status !== "error")
            state.status = "PRONTO P/ INDUZIR";
          state.date = data.previsaoEntrega?.data || STR_DATE;
        } else {
          state.mode = "error";
          state.status = "NÃO INDUZIDO";
          state.date = STR_DATE;
        }
      } else if (urlLower.includes("enderecocontroller.php")) {
        if (data.endereco) {
          state.addr = {
            log: data.endereco.logradouro || STR_EMPTY,
            num: data.endereco.numeroLogradouro || STR_EMPTY,
            comp: data.endereco.complementoLogradouro || STR_EMPTY,
            bair: data.endereco.bairro || STR_EMPTY,
            mun: data.endereco.municipio || STR_EMPTY,
            uf: data.endereco.uf || STR_EMPTY,
            cep: data.endereco.cep || STR_EMPTY,
          };
        }
        if (data.servico) {
          state.serv = { ar: data.servico.ar, mp: data.servico.mp, dd: data.servico.dd };
        }
        if (data.telefone) state.contact.tel = `(${data.telefone.ddd}) ${data.telefone.numero}`;
        state.contact.email = data.email || STR_EMPTY;
      } else if (urlLower.includes("distritamentotrechocontroller.php")) {
        if (Array.isArray(data) && data.length > 0) {
          state.district = `${data[0].rotuloDistrito} ${data[0].areaDistrito || ""}`.trim();
          state.op.ord = data[0].ordemPercorrida;
          state.op.side = data[0].lado;
        }
      } else if (urlLower.includes("acao=pesquisarloecobjeto")) {
        if (data.id) {
          state.mode = "success";
          state.status = "JÁ INDUZIDO";
          state.initialDist = `${data.numeroDistrito} ${data.distritoComplemento || ""}`.trim();
          state.district = state.initialDist;
          state.domDist = state.initialDist;
          state.op.list = data.idLancamento;
          state.op.user = data.carteiro?.nome || STR_EMPTY;
          state.op.postman = data.carteiro?.nome || STR_EMPTY;
        }
      } else if (urlLower.includes("acao=listar")) {
        if (Array.isArray(data) && state.op.list) {
          const match = data.find((d) => d.idLancamento === state.op.list);
          if (match?.nomeCarteiro) state.op.postman = match.nomeCarteiro;
        }
      } else if (urlLower.includes("acao=salvar")) {
        if (data.idLancamento) {
          state.mode = "success";
          state.status = "OBJETO INDUZIDO";
          state.op.list = data.numeroLista;
          state.op.user = data.usuario;
          state.op.st = data.estacao;
          state.op.ts = data.carimbo;
          if (data.dataPrevista) state.date = data.dataPrevista;
        }
        if (state.pendingDist) {
          state.district = state.pendingDist;
          state.initialDist = state.pendingDist;
          state.domDist = state.pendingDist;
        }
        if (data.distrito) {
          state.initialDist = data.distrito;
          state.domDist = data.distrito;
        }
      } else if (urlLower.includes("acao=excluir")) {
        state.mode = "error";
        state.status = "EXCLUÍDO";
        state.district = STR_EMPTY;
        state.domDist = null;
        state.date = STR_DATE;
        state.initialDist = null;
        state.pendingDist = null;
      }
      updateUI();
    }

    const origFetch = window.fetch;
    window.fetch = async function (...args) {
      const url = args[0] ? args[0].toString() : "";
      const urlLower = url.toLowerCase();
      const opts = args[1];

      if (urlLower.includes("acao=salvar") && opts && opts.body) {
        try {
          const payload = JSON.parse(opts.body);
          if (payload.distrito) state.pendingDist = payload.distrito;
        } catch {}
      }

      if (urlLower.includes("listar-impressoras-disponiveis")) autoDismissPrintPopup();

      const response = await origFetch.apply(this, args);
      try {
        if (urlLower.includes("controller.php")) {
          response
            .clone()
            .json()
            .then((data) => handleResponse(url, data))
            .catch(() => {});
        }
      } catch {}
      return response;
    };

    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;
      if (url && url.toLowerCase().includes("listar-impressoras-disponiveis"))
        autoDismissPrintPopup();
      return origXhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      const url = this._url ? this._url.toLowerCase() : "";
      if (url && url.includes("acao=salvar") && body) {
        try {
          const payload = JSON.parse(body);
          if (payload.distrito) state.pendingDist = payload.distrito;
        } catch {}
      }
      this.addEventListener("load", function () {
        const u = this._url ? this._url.toLowerCase() : "";
        if (u && u.includes("controller.php")) {
          try {
            const data = JSON.parse(this.responseText);
            handleResponse(this._url, data);
          } catch {}
        }
      });
      return origXhrSend.apply(this, arguments);
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", injectFloatingCard);
    } else {
      injectFloatingCard();
    }
  }

  function initLoecHudModule() {
    const HUD_ID = "sro-hud-dashboard";

    function injectStyles() {
      if (document.getElementById("sro-hud-styles")) return;
      const style = document.createElement("style");
      style.id = "sro-hud-styles";
      style.innerHTML = `
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
        .hud-full { grid-column: span 4; display: flex; justify-content: space-between; background: #fff; padding: 10px; border-radius: 4px; border: 1px dashed #ccc; align-items: center; flex-wrap: wrap; }
        .metric-box { text-align: center; flex: 1; border-right: 1px solid #eee; min-width: 80px; }
        .metric-box:last-child { border-right: none; }
        .metric-lbl { font-size: 0.65rem; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-val { font-weight: bold; font-size: 0.9rem; color: #333; }
        .hud-footer-time { position: absolute; bottom: 2px; right: 5px; font-size: 0.6rem; color: #aaa; font-style: italic; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `;
      document.head.appendChild(style);
    }

    const extractInt = (val) => {
      if (typeof val === "number") return val;
      if (!val) return 0;
      return parseInt(val.toString().replace(/<[^>]*>/g, ""), 10) || 0;
    };

    function calculateMetrics(data) {
      if (!Array.isArray(data) || data.length === 0) return null;
      let totalDistricts = data.length,
        totalObjects = 0,
        totalPoints = 0,
        totalExpired = 0,
        totalToday = 0,
        totalToExpire = 0,
        totalAR = 0;
      data.forEach((d) => {
        totalObjects += extractInt(d.qtde);
        totalPoints += extractInt(d.qtdePontos);
        totalExpired += extractInt(d.qtdeVencido);
        totalToday += extractInt(d.qtdeHoje);
        totalToExpire += extractInt(d.qtdeAVencer);
        totalAR += extractInt(d.qtdeAR);
      });
      const deliveryDensity = totalObjects > 0 ? (totalObjects / totalPoints).toFixed(2) : 0;
      const chaosIndex = totalObjects > 0 ? ((totalExpired / totalObjects) * 100).toFixed(1) : 0;
      const operationalPressure =
        totalObjects > 0 ? (((totalToday + totalToExpire) / totalObjects) * 100).toFixed(1) : 0;
      const arFactor = totalObjects > 0 ? ((totalAR / totalObjects) * 100).toFixed(1) : 0;
      const avgObjectsPerDistrict = (totalObjects / totalDistricts).toFixed(1);
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
        computed: {
          deliveryDensity,
          chaosIndex,
          operationalPressure,
          arFactor,
          avgObjectsPerDistrict,
        },
      };
    }

    function renderDashboard(metrics) {
      const old = document.getElementById(HUD_ID);
      if (old) old.remove();
      if (!metrics) return;
      const target = document.querySelector(".botoes");
      if (!target) return;
      const m = metrics.raw,
        c = metrics.computed;
      let statusColor = "border-success",
        statusText = "CONTROLADO";
      if (c.chaosIndex > 20) {
        statusColor = "border-warning";
        statusText = "ATENÇÃO";
      }
      if (c.chaosIndex > 50) {
        statusColor = "border-danger";
        statusText = "CRÍTICO";
      }
      const timeString = new Date().toLocaleTimeString("pt-BR");
      const container = document.createElement("div");
      container.id = HUD_ID;
      container.classList.add("hud-updated");
      container.innerHTML = `
        <div class="hud-card border-info"><div class="hud-title">Carga Total Suspensa</div><div class="hud-value">${m.totalObjects} <span style="font-size:0.8rem; color:#888;">objs</span></div><div class="hud-sub">📦 ${m.totalDistricts} distritos afetados</div></div>
        <div class="hud-card ${statusColor}"><div class="hud-title">Backlog (Vencidos)</div><div class="hud-value text-danger">${m.totalExpired}</div><div class="hud-sub">🔥 ${c.chaosIndex}% da carga total</div></div>
        <div class="hud-card border-warning"><div class="hud-title">Urgência (Hoje+Breve)</div><div class="hud-value">${m.totalToday + m.totalToExpire}</div><div class="hud-sub">⚠️ Pressão Operacional: ${c.operationalPressure}%</div></div>
        <div class="hud-card border-info"><div class="hud-title">Complexidade (ARs)</div><div class="hud-value">${m.totalAR}</div><div class="hud-sub">📝 Fator de Retenção: ${c.arFactor}%</div></div>
        <div class="hud-full"><div class="metric-box"><div class="metric-lbl">DENSIDADE DO CLUSTER</div><div class="metric-val">${c.deliveryDensity} objs/ponto</div></div><div class="metric-box"><div class="metric-lbl">TOTAL PONTOS FÍSICOS</div><div class="metric-val">📍 ${m.totalPoints}</div></div><div class="metric-box"><div class="metric-lbl">STATUS TÁTICO</div><div class="metric-val" style="font-weight:900;">${statusText}</div></div><div class="metric-box"><div class="metric-lbl">MÉDIA OBJS/DISTRITO</div><div class="metric-val">📊 ${c.avgObjectsPerDistrict}</div></div></div>
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
      } catch {}
    }

    const origFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await origFetch.apply(this, args);
      const url = args[0] ? args[0].toString() : "";
      if (url.includes("lancamentoController.php?acao=listar")) {
        response
          .clone()
          .json()
          .then((data) => processResponse(url, data))
          .catch(() => {});
      }
      return response;
    };

    const origXhrOpen = XMLHttpRequest.prototype.open;
    const origXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._sroUrl = url;
      return origXhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener("load", function () {
        if (this._sroUrl && this._sroUrl.includes("lancamentoController.php?acao=listar")) {
          try {
            processResponse(this._sroUrl, JSON.parse(this.responseText));
          } catch {}
        }
      });
      return origXhrSend.apply(this, arguments);
    };
  }
})();
