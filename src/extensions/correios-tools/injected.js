(function () {
  "use strict";

  const CURRENT_PATH = window.location.pathname.toLowerCase();

  if (CURRENT_PATH.includes("/lancamentoautomatico/")) {
    const STORAGE_KEYS = {
      POSITION: "correiostools_pos_v2",
      HISTORY: "correiostools_hist_v3",
      VIEW_MODE: "correiostools_view_mode",
      LAYOUT_INVERTED: "correiostools_layout_inv",
      PANEL_HIDDEN: "correiostools_panel_hide",
    };

    let appState = {
      code: "--",
      status: "AGUARDANDO...",
      mode: "loading",
      district: "--",
      domDistrict: null,
      initialDistrict: null,
      pendingDistrict: null,
      date: "--/--/----",
      exception: "--",
      validation: "--",
      lastEvent: "--",
      address: {
        street: "--",
        number: "--",
        complement: "--",
        neighborhood: "--",
        city: "--",
        state: "--",
        zip: "--",
      },
      services: { ar: "N", mp: "N", dd: "N" },
      contact: { phone: "--", email: "--" },
      operational: {
        list: "--",
        user: "--",
        postman: "--",
        station: "--",
        timestamp: "--",
        order: "--",
        side: "--",
      },
    };

    let dragState = {
      active: false,
      currentX: 0,
      currentY: 0,
      initialX: 0,
      initialY: 0,
      xOffset: 0,
      yOffset: 0,
    };

    let lastInputValue = null;

    const ACTIONS = {
      "CT-INDUZIROBJETO": () => {
        if (document.activeElement) document.activeElement.blur();
        const btnModal = document.getElementById("btnModalA");
        if (!btnModal) return;

        btnModal.click();

        let attempts = 0;
        const checkInterval = setInterval(() => {
          const txtNumber = document.getElementById("txtNumero");
          if (txtNumber) {
            clearInterval(checkInterval);
            setTimeout(() => {
              const val = txtNumber.value.trim();
              if (val !== "" && val !== "N/A") {
                if (document.activeElement) document.activeElement.blur();
                const btnInduce = document.getElementById("btnIncluirObjeto");
                if (btnInduce) btnInduce.click();
              }
            }, 500);
          } else {
            attempts++;
            if (attempts >= 30) clearInterval(checkInterval);
          }
        }, 100);
      },
      "CT-EXCLUIROBJETO": () => {
        if (document.activeElement) document.activeElement.blur();
        const btnExclude = document.getElementById("btnModalE");
        if (btnExclude) btnExclude.click();
      },
    };

    (function initKeyboardListener() {
      const TRIGGER_KEY = "#";
      const TIMEOUT_MS = 1000;
      let buffer = "";
      let isCapturing = false;
      let timeoutId = null;

      window.addEventListener(
        "keydown",
        (e) => {
          if (e.key === TRIGGER_KEY) {
            e.preventDefault();
            e.stopImmediatePropagation();

            if (isCapturing) {
              if (buffer.length > 0) {
                const cmd = buffer.toUpperCase();
                if (ACTIONS[cmd]) ACTIONS[cmd]();
              }
              isCapturing = false;
              buffer = "";
              if (timeoutId) clearTimeout(timeoutId);
            } else {
              isCapturing = true;
              buffer = "";
              timeoutId = setTimeout(() => {
                isCapturing = false;
                buffer = "";
              }, TIMEOUT_MS);
            }
            return;
          }

          if (isCapturing) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (e.key.length === 1) {
              buffer += e.key;
              if (timeoutId) clearTimeout(timeoutId);
              timeoutId = setTimeout(() => {
                isCapturing = false;
                buffer = "";
              }, TIMEOUT_MS);
            }
          }
        },
        true
      );
    })();

    function formatObjectCode(code) {
      return !code || code.length !== 13
        ? code
        : `${code.slice(0, 2)} ${code.slice(2, 5)} ${code.slice(5, 8)} ${code.slice(8, 11)} ${code.slice(11)}`;
    }

    function savePanelPosition() {
      localStorage.setItem(
        STORAGE_KEYS.POSITION,
        JSON.stringify({ x: dragState.xOffset, y: dragState.yOffset })
      );
    }

    function loadPanelPosition(element) {
      try {
        const pos = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSITION));
        if (pos && typeof pos.x === "number") {
          dragState.xOffset = pos.x;
          dragState.yOffset = pos.y;
          element.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
        }
      } catch (e) {}
    }

    function getDistrictHtml(isCompact) {
      let current =
        appState.domDistrict && appState.domDistrict !== ""
          ? appState.domDistrict
          : appState.district;
      current = current ? current.trim() : "";

      const style = isCompact
        ? "display:flex;align-items:center;justify-content:center"
        : "display:flex;align-items:center;justify-content:center;flex-wrap:wrap;flex:1;";

      if (
        appState.initialDistrict &&
        appState.initialDistrict !== "--" &&
        current &&
        current !== "--" &&
        current !== appState.initialDistrict
      ) {
        return `<div style="${style}">
                  <span class="${isCompact ? "sro-old" : "sro-old-p"}">${appState.initialDistrict}</span>
                  <span class="${isCompact ? "sro-arrow" : "sro-arrow-p"}">➜</span>
                  <span class="${isCompact ? "sro-new" : "sro-new-p"}">${current}</span>
                </div>`;
      }
      return `<span class="${isCompact ? "sro-new" : "sro-new-p"}">${current || "--"}</span>`;
    }

    function renderHistoryPanel() {
      if (localStorage.getItem(STORAGE_KEYS.PANEL_HIDDEN) === "true") return;

      const currentView = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || "map";
      const mapContainer = document.getElementById("div-map");
      if (!mapContainer) return;

      let ghostStorage = document.getElementById("sro-ghost-storage");
      if (!ghostStorage) {
        ghostStorage = document.createElement("div");
        ghostStorage.id = "sro-ghost-storage";
        ghostStorage.style.display = "none";
        document.body.appendChild(ghostStorage);
      }

      const originalPanel = document.getElementById("painel");

      if (currentView === "history") {
        if (originalPanel && mapContainer.contains(originalPanel))
          ghostStorage.appendChild(originalPanel);

        let historyUi = document.getElementById("sro-history-ui");
        if (!historyUi) {
          historyUi = document.createElement("div");
          historyUi.id = "sro-history-ui";
          mapContainer.appendChild(historyUi);
        }

        const historyList = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "[]");

        const historyItemsHtml = historyList
          .map(
            (item) => `
          <li class="sro-hist-li">
            <div class="sro-hist-head" onclick="this.parentElement.classList.toggle('expanded')">
              <div>
                <span class="sro-hist-badge ${item.status === "INDUZIDO" ? "badge-ind" : item.status === "EXCLUÍDO" ? "badge-exc" : "badge-lid"}">${item.status}</span>
                <strong style="color:#00416B;margin-left:5px;">${formatObjectCode(item.code)}</strong>
              </div>
              <div style="font-size:11px;color:#666;">${item.start.split(" ")[1]}</div>
            </div>
            <div class="sro-hist-body">
              <div class="sro-hist-addr">${item.address.street}, ${item.address.number}</div>
              <div class="sro-hist-res">Resultado: <strong>${item.finalDistrict || "--"}</strong></div>
              <div class="sro-hist-timeline">
                ${item.events.map((evt) => `<div class="sro-hist-evt"><span>${evt.time.split(" ")[1]}</span> ${evt.desc}</div>`).join("")}
              </div>
            </div>
          </li>
        `
          )
          .join("");

        historyUi.innerHTML = `
          <div class="sro-hist-container">
            <div class="sro-hist-top">Histórico Recente</div>
            ${historyList.length === 0 ? '<div style="padding:20px;text-align:center;color:#999;">Nenhum objeto</div>' : ""}
            <ul class="sro-hist-ul">${historyItemsHtml}</ul>
            <div class="sro-hist-end">▼ Fim do histórico (Máx 10)</div>
          </div>
        `;
      } else {
        const historyUi = document.getElementById("sro-history-ui");
        if (historyUi) historyUi.remove();
        if (originalPanel && !mapContainer.contains(originalPanel))
          mapContainer.appendChild(originalPanel);
      }
    }

    function applyViewVisibility() {
      const mapContainer = document.getElementById("div-map");
      if (!mapContainer) return;

      const isHidden = localStorage.getItem(STORAGE_KEYS.PANEL_HIDDEN) === "true";
      const controlButtons = [
        document.getElementById("btn-layout-toggle"),
        document.getElementById("btn-toggle-view"),
      ];
      const btnHide = document.getElementById("btn-hide-panel");

      let sibling = mapContainer.nextElementSibling;
      if (!sibling || sibling.id === "sro-ghost-storage")
        sibling = mapContainer.previousElementSibling;

      let ghostStorage = document.getElementById("sro-ghost-storage");
      if (!ghostStorage) {
        ghostStorage = document.createElement("div");
        ghostStorage.id = "sro-ghost-storage";
        ghostStorage.style.display = "none";
        document.body.appendChild(ghostStorage);
      }

      const originalPanel = document.getElementById("painel");

      if (isHidden) {
        if (originalPanel && mapContainer.contains(originalPanel))
          ghostStorage.appendChild(originalPanel);
        mapContainer.style.display = "none";

        if (btnHide) {
          btnHide.innerText = "+";
          btnHide.title = "Restaurar Painel";
        }

        controlButtons.forEach((btn) => btn && btn.classList.add("sro-btn-disabled"));

        if (sibling) {
          if (!sibling.originalClass) sibling.originalClass = sibling.className;
          sibling.classList.remove("col-9", "col-md-9", "col-lg-9");
          sibling.classList.add("col-12");
          sibling.style.maxWidth = "100%";
          sibling.style.flex = "0 0 100%";
        }
      } else {
        if (sibling && sibling.originalClass) {
          sibling.className = sibling.originalClass;
          sibling.style.maxWidth = "";
          sibling.style.flex = "";
        }
        mapContainer.style.display = "";

        if (btnHide) {
          btnHide.innerText = "-";
          btnHide.title = "Ocultar Painel";
        }

        controlButtons.forEach((btn) => btn && btn.classList.remove("sro-btn-disabled"));
        renderHistoryPanel();
      }
    }

    function toggleHiddenPanel() {
      const isHidden = localStorage.getItem(STORAGE_KEYS.PANEL_HIDDEN) === "true";
      localStorage.setItem(STORAGE_KEYS.PANEL_HIDDEN, !isHidden);
      applyViewVisibility();
    }

    function applyLayout() {
      const mapContainer = document.getElementById("div-map");
      if (!mapContainer) return;

      const parent = mapContainer.parentNode;
      const isInverted = localStorage.getItem(STORAGE_KEYS.LAYOUT_INVERTED) === "true";

      if (isInverted) parent.prepend(mapContainer);
      else parent.append(mapContainer);
    }

    function toggleLayout() {
      const isInverted = localStorage.getItem(STORAGE_KEYS.LAYOUT_INVERTED) === "true";
      localStorage.setItem(STORAGE_KEYS.LAYOUT_INVERTED, !isInverted);
      applyLayout();
    }

    function updateHistory(triggerType, eventName, eventDesc) {
      if (!appState.code || appState.code === "--" || appState.code.length < 13) return;

      try {
        let history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || "[]");
        const timestamp = new Date().toLocaleString("pt-BR");
        const finalDist = appState.domDistrict || appState.district || "--";
        const eventObj = { time: timestamp, action: eventName, desc: eventDesc };

        const lastItem = history[0];

        if (lastItem && lastItem.code === appState.code && lastItem.sessionActive) {
          const previousEvent = lastItem.events[lastItem.events.length - 1];
          if (
            !previousEvent ||
            previousEvent.action !== eventName ||
            previousEvent.desc !== eventDesc
          ) {
            lastItem.events.push(eventObj);
            lastItem.finalDistrict = finalDist;
            if (appState.address.street !== "--") lastItem.address = appState.address;

            if (triggerType === "induzir") {
              lastItem.status = "INDUZIDO";
              lastItem.sessionActive = false;
              lastItem.end = timestamp;
            } else if (triggerType === "excluir") {
              lastItem.status = "EXCLUÍDO";
              lastItem.sessionActive = false;
              lastItem.end = timestamp;
            }
          }
        } else {
          let status = "LIDO";
          let isActive = true;
          let endTime = null;

          if (triggerType === "induzir") {
            status = "INDUZIDO";
            isActive = false;
            endTime = timestamp;
          } else if (triggerType === "excluir") {
            status = "EXCLUÍDO";
            isActive = false;
            endTime = timestamp;
          }

          history.unshift({
            code: appState.code,
            start: timestamp,
            end: endTime,
            status: status,
            sessionActive: isActive,
            events: [eventObj],
            address: appState.address,
            finalDistrict: finalDist,
          });
        }

        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 10)));
        if (localStorage.getItem(STORAGE_KEYS.VIEW_MODE) === "history") renderHistoryPanel();
      } catch (e) {}
    }

    function injectOperationalTable() {
      if (document.getElementById("sro-table-wrapper")) return;

      const buttonsContainer = document.querySelector(".botoes");
      if (!buttonsContainer) return setTimeout(injectOperationalTable, 500);

      const div = document.createElement("div");
      div.id = "sro-table-wrapper";
      div.innerHTML = `
        <div class="sro-table-header">
          <span style="color:#ffffff !important">DADOS OPERACIONAIS</span>
        </div>
        <table class="sro-full-table">
          <tr>
            <th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">--</td>
            <th>STATUS</th><td id="td-stt">--</td>
            <th>VALIDAÇÃO</th><td id="td-val">--</td>
            <th>DATA PREV.</th><td id="td-dat-prev">--</td>
          </tr>
          <tr id="row-exc" style="display:none">
            <th style="color:#c62828">EXCEÇÃO</th>
            <td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">--</td>
          </tr>
          <tr>
            <th>ENDEREÇO</th><td colspan="5" id="td-end-full">--</td>
            <th>CEP</th><td id="td-cep" style="font-weight:bold">--</td>
          </tr>
          <tr>
            <th>CONTATO</th><td colspan="7" id="td-con">--</td>
          </tr>
          <tr>
            <th>DISTRITO</th><td id="td-dis" class="hl-dist">--</td>
            <th>ORDEM</th><td id="td-ord">--</td>
            <th>LADO</th><td id="td-lad">--</td>
            <th>SERVIÇOS</th><td colspan="3" id="td-srv">--</td>
          </tr>
          <tr>
            <th rowspan="2">INDUÇÃO</th>
            <td colspan="7">
              <span style="color:#777">L:</span> <b id="td-lis">--</b> &nbsp;|&nbsp;
              <span style="color:#777">E:</span> <b id="td-est">--</b> &nbsp;|&nbsp;
              <span style="color:#777">U:</span> <b id="td-usu">--</b> &nbsp;|&nbsp;
              <span style="color:#777">DATA:</span> <b id="td-dat">--</b>
            </td>
          </tr>
          <tr>
            <td colspan="7" style="background:#fffde7;border-left:3px solid #fbc02d">
              <span style="color:#f57f17;font-weight:bold;text-transform:uppercase">CARTEIRO:</span>
              <b id="td-postman" style="font-size:12px;color:#333;margin-left:5px">--</b>
            </td>
          </tr>
        </table>`;

      buttonsContainer.insertAdjacentElement("afterend", div);
    }

    function updateOperationalTable() {
      const getEl = (id) => document.getElementById(id);
      if (!getEl("td-cod")) return;

      getEl("td-cod").innerText = appState.code;

      const val = appState.validation;
      getEl("td-val").innerHTML = val
        ? `<span class="${val.includes("V") ? "hl-val" : "hl-err"}">${val}</span>`
        : "--";

      getEl("td-stt").innerText = appState.lastEvent;
      getEl("td-dat-prev").innerText = appState.date;

      if (appState.exception && appState.exception !== "--") {
        getEl("td-exc").innerText = appState.exception;
        document.getElementById("row-exc").style.display = "table-row";
      } else {
        document.getElementById("row-exc").style.display = "none";
      }

      getEl("td-end-full").innerText =
        `${appState.address.street}, ${appState.address.number} ${appState.address.complement ? "- " + appState.address.complement : ""} - ${appState.address.neighborhood}, ${appState.address.city}/${appState.address.state}`;

      getEl("td-cep").innerText = appState.address.zip;

      getEl("td-con").innerHTML =
        `TEL: <b>${appState.contact.phone}</b> ${appState.contact.email !== "--" ? " | EMAIL: " + appState.contact.email : ""}`;

      getEl("td-dis").innerHTML = getDistrictHtml(false);

      getEl("td-ord").innerText = appState.operational.order;
      getEl("td-lad").innerText = appState.operational.side;

      const getServiceHtml = (key, label) =>
        `<span class="${appState.services[key] === "S" ? "hl-serv" : "hl-serv-off"}">${label}</span>`;

      getEl("td-srv").innerHTML =
        getServiceHtml("ar", "AR") + getServiceHtml("mp", "MP") + getServiceHtml("dd", "DD");

      getEl("td-lis").innerText = appState.operational.list;
      getEl("td-est").innerText = appState.operational.station;
      getEl("td-usu").innerText = appState.operational.user;
      getEl("td-postman").innerText = appState.operational.postman;

      let ts = appState.operational.timestamp;
      getEl("td-dat").innerText =
        ts && ts.length >= 18
          ? `${ts.substring(8, 10)}/${ts.substring(10, 12)}/${ts.substring(12, 16)} às ${ts.substring(16, 18)}:${ts.substring(18, 20)}`
          : "--";
    }

    function injectStyles() {
      if (document.getElementById("sro-styles")) return;
      const style = document.createElement("style");
      style.id = "sro-styles";
      style.innerHTML = `
        #sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); will-change: transform; font-family: 'Segoe UI', sans-serif; }
        .sro-card { width: 360px; background: #fff; border-radius: 6px; overflow: hidden; border-left: 8px solid #999; display: block; }
        .sro-header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border-bottom: 1px solid #eee; cursor: grab; user-select: none; }
        .sro-status-block { display: flex; align-items: center; gap: 8px; flex: 1; }
        .sro-status-text { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; color: #444; }
        .sro-btn-group { display: flex; align-items: center; gap: 8px; }
        .sro-btn-panel { cursor: pointer; font-size: 1.2rem; color: #555; transition: all 0.2s; line-height: 1; font-weight:bold; padding: 2px 5px; border-radius: 4px; }
        .sro-btn-panel:hover { color: #00416B; background: #f0f0f0; }
        .sro-btn-disabled { opacity: 0.3; pointer-events: none; }
        .sro-body { padding: 12px; text-align: center; background: #fff; }
        .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: #00416B; margin: 6px 0; }
        .sro-new { color: #00416B; font-size: 3rem; font-weight: 900; }
        .sro-old { font-size: 2rem; opacity: 0.35; font-weight: 700; color: #000; margin-right: 5px; }
        .sro-arrow { font-size: 2rem; margin: 0 10px; color: #444; font-weight: 400; }
        .mode-loading { border-left-color: #7f8c8d; }
        .mode-success { border-left-color: #009688; }
        .mode-success .sro-header { background: #e0f2f1; }
        .mode-success .sro-status-text { color: #00695c; }
        .mode-error { border-left-color: #d32f2f; }
        .mode-error .sro-header { background: #ffebee; }
        .mode-error .sro-status-text { color: #c62828; }
        .mode-info { border-left-color: #1976d2; }
        .mode-info .sro-header { background: #e3f2fd; }
        .mode-info .sro-status-text { color: #0d47a1; }
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
        #sro-history-ui { width: 100%; height: 100%; background: #f9f9f9; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #ddd; border-radius: 4px; animation: fadeIn 0.3s; }
        .sro-hist-container { flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 10px; }
        .sro-hist-top { font-weight: bold; color: #555; text-transform: uppercase; font-size: 12px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #00416B; }
        .sro-hist-ul { list-style: none; padding: 0; margin: 0; }
        .sro-hist-li { background: #fff; border: 1px solid #eee; margin-bottom: 8px; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .sro-hist-head { padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: #fff; transition: background 0.2s; }
        .sro-hist-head:hover { background: #f4f8fb; }
        .sro-hist-body { display: none; padding: 8px 10px; border-top: 1px solid #f0f0f0; background: #fafafa; font-size: 11px; }
        .sro-hist-li.expanded .sro-hist-body { display: block; }
        .sro-hist-badge { font-size: 9px; padding: 2px 5px; border-radius: 3px; font-weight: bold; text-transform: uppercase; }
        .badge-ind { background: #e8f5e9; color: #2e7d32; }
        .badge-exc { background: #ffebee; color: #c62828; }
        .badge-lid { background: #e3f2fd; color: #1565c0; }
        .sro-hist-addr { font-weight: 600; color: #555; margin-bottom: 5px; }
        .sro-hist-res { display: inline-block; background: #eee; padding: 2px 6px; border-radius: 3px; margin-bottom: 6px; color: #333; font-weight: 600; }
        .sro-hist-evt { color: #777; margin-bottom: 2px; border-bottom: 1px dashed #eee; padding-bottom: 2px; }
        .sro-hist-evt span { font-weight: bold; color: #999; margin-right: 5px; font-size: 10px; }
        .sro-hist-end { text-align: center; color: #aaa; font-size: 10px; padding: 10px 0; border-top: 1px dashed #ddd; margin-top: 10px; text-transform: uppercase; font-weight: bold; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `;
      document.head.appendChild(style);
    }

    function setupDrag(handle, container) {
      handle.onmousedown = (e) => {
        if (e.target.closest(".sro-btn-group")) return;
        dragState.active = true;
        dragState.initialX = e.clientX - dragState.xOffset;
        dragState.initialY = e.clientY - dragState.yOffset;
      };

      handle.ondblclick = (e) => {
        if (e.target.closest(".sro-btn-group")) return;
        dragState.xOffset = 0;
        dragState.yOffset = 0;
        container.classList.add("sro-snap");
        container.style.transform = "translate3d(0,0,0)";
        setTimeout(() => container.classList.remove("sro-snap"), 300);
        savePanelPosition();
      };

      document.onmouseup = () => {
        if (dragState.active) {
          dragState.active = false;
          savePanelPosition();
          snapToEdges(container);
        }
      };

      document.onmousemove = (e) => {
        if (!dragState.active) return;
        e.preventDefault();
        dragState.currentX = e.clientX - dragState.initialX;
        dragState.currentY = e.clientY - dragState.initialY;
        dragState.xOffset = dragState.currentX;
        dragState.yOffset = dragState.currentY;
        container.style.transform = `translate3d(${dragState.currentX}px, ${dragState.currentY}px, 0)`;
      };
    }

    function snapToEdges(container) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      let snapped = false;

      if (rect.left < 0) {
        dragState.xOffset -= rect.left;
        snapped = true;
      }
      if (rect.top < 0) {
        dragState.yOffset -= rect.top;
        snapped = true;
      }
      if (rect.right > winW) {
        dragState.xOffset -= rect.right - winW;
        snapped = true;
      }
      if (rect.bottom > winH) {
        dragState.yOffset -= rect.bottom - winH;
        snapped = true;
      }

      if (snapped) {
        container.classList.add("sro-snap");
        container.style.transform = `translate3d(${dragState.xOffset}px, ${dragState.yOffset}px, 0)`;
        setTimeout(() => container.classList.remove("sro-snap"), 300);
        savePanelPosition();
      }
    }

    function renderFloatingPanel() {
      injectStyles();

      let container = document.getElementById("sro-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "sro-container";
        container.innerHTML = `
          <div id="sro-card" class="sro-card mode-loading">
            <div id="sro-header" class="sro-header" title="Segure para mover">
              <div class="sro-status-block">
                <span id="sro-icon" class="sro-icon">⏳</span>
                <span id="sro-status" class="sro-status-text">AGUARDANDO...</span>
              </div>
              <div class="sro-btn-group">
                <span id="btn-toggle-view" class="sro-btn-panel" title="Alternar Mapa/Histórico">🕒</span>
                <span id="btn-layout-toggle" class="sro-btn-panel" title="Inverter Layout">⇄</span>
                <span id="btn-hide-panel" class="sro-btn-panel" title="Ocultar Painel" style="font-size:1.6rem;margin-top:-3px;">-</span>
              </div>
            </div>
            <div class="sro-body">
              <div id="sro-distrito" class="sro-distrito">--</div>
              <div style="font-size:12px;color:#666;margin-top:4px">PREVISÃO: <strong id="sro-previsao" style="color:#333">--/--/----</strong></div>
            </div>
          </div>`;
        document.body.appendChild(container);

        loadPanelPosition(container);
        setupDrag(document.getElementById("sro-header"), container);

        document.getElementById("btn-layout-toggle").onclick = toggleLayout;
        document.getElementById("btn-hide-panel").onclick = toggleHiddenPanel;
        document.getElementById("btn-toggle-view").onclick = () => {
          const current = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || "map";
          localStorage.setItem(STORAGE_KEYS.VIEW_MODE, current === "map" ? "history" : "map");
          renderHistoryPanel();
        };
      }

      const card = document.getElementById("sro-card");
      if (card) {
        let icon = "⏳";
        if (appState.mode === "success") icon = "✅";
        if (appState.mode === "error") icon = "⛔";
        if (appState.mode === "info") icon = "⚠️";

        card.className = `sro-card visible mode-${appState.mode}`;
        document.getElementById("sro-status").innerText = appState.status;
        document.getElementById("sro-icon").innerText = icon;
        document.getElementById("sro-distrito").innerHTML = getDistrictHtml(true);
        document.getElementById("sro-previsao").innerText = appState.date || "--/--/----";
      }

      updateOperationalTable();
      renderHistoryPanel();
      applyViewVisibility();
    }

    function handleResponse(url, data) {
      const lowerUrl = url.toLowerCase();
      let shouldUpdate = false;
      const urlCode =
        new URL(url, window.location.origin).searchParams.get("codigo") ||
        new URL(url, window.location.origin).searchParams.get("objeto");

      if (
        urlCode &&
        urlCode !== appState.code &&
        (lowerUrl.includes("acao=validar") || lowerUrl.includes("acao=pesquisar"))
      ) {
        appState = {
          code: urlCode,
          status: "AGUARDANDO...",
          mode: "loading",
          district: "--",
          domDistrict: null,
          initialDistrict: null,
          pendingDistrict: null,
          date: "--/--/----",
          exception: "--",
          validation: "--",
          lastEvent: "--",
          address: {
            street: "--",
            number: "--",
            complement: "--",
            neighborhood: "--",
            city: "--",
            state: "--",
            zip: "--",
          },
          services: { ar: "N", mp: "N", dd: "N" },
          contact: { phone: "--", email: "--" },
          operational: {
            list: "--",
            user: "--",
            postman: "--",
            station: "--",
            timestamp: "--",
            order: "--",
            side: "--",
          },
        };
        shouldUpdate = true;
      }

      if (lowerUrl.includes("acao=validar")) {
        appState.validation = data.validacao || "--";
        appState.exception = data.excecao || "--";
        appState.lastEvent = data.ultimoEventoDescricao || "--";

        if (data.validacao) {
          appState.mode = "info";
          appState.status = "PRONTO P/ INDUZIR";
          appState.date = data.previsaoEntrega?.data || "--/--/----";
        } else {
          appState.mode = "error";
          appState.status = "NÃO INDUZIDO";
        }

        if (appState.code !== "--" && appState.mode !== "error")
          updateHistory("novo", "Leitura", "Objeto escaneado");
        shouldUpdate = true;
      } else if (lowerUrl.includes("enderecocontroller.php") && data.endereco) {
        appState.address = {
          street: data.endereco.logradouro || "--",
          number: data.endereco.numeroLogradouro || "--",
          complement: data.endereco.complementoLogradouro || "--",
          neighborhood: data.endereco.bairro || "--",
          city: data.endereco.municipio || "--",
          state: data.endereco.uf || "--",
          zip: data.endereco.cep || "--",
        };
        if (data.servico)
          appState.services = { ar: data.servico.ar, mp: data.servico.mp, dd: data.servico.dd };
        if (data.telefone)
          appState.contact.phone = `(${data.telefone.ddd}) ${data.telefone.numero}`;
        appState.contact.email = data.email || "--";
        shouldUpdate = true;
      } else if (
        lowerUrl.includes("distritamentotrechocontroller.php") &&
        Array.isArray(data) &&
        data.length > 0
      ) {
        appState.district = `${data[0].rotuloDistrito} ${data[0].areaDistrito || ""}`.trim();
        appState.operational.order = data[0].ordemPercorrida;
        appState.operational.side = data[0].lado;
        shouldUpdate = true;
      } else if (lowerUrl.includes("acao=salvar") && data.idLancamento) {
        appState.mode = "success";
        appState.status = "OBJETO INDUZIDO";
        appState.operational.list = data.numeroLista;
        appState.operational.user = data.usuario;
        appState.operational.station = data.estacao;
        appState.operational.timestamp = data.carimbo;
        if (data.dataPrevista) appState.date = data.dataPrevista;

        if (appState.pendingDistrict) {
          appState.district = appState.pendingDistrict;
          appState.initialDistrict = appState.pendingDistrict;
          appState.domDistrict = appState.pendingDistrict;
        }
        if (data.distrito) {
          appState.initialDistrict = data.distrito;
          appState.domDistrict = data.distrito;
        }

        updateHistory("induzir", "Indução", "Objeto induzido");
        shouldUpdate = true;
      } else if (lowerUrl.includes("acao=excluir")) {
        appState.mode = "error";
        appState.status = "EXCLUÍDO";
        updateHistory("excluir", "Exclusão", "Objeto excluído");
        shouldUpdate = true;
      }

      if (shouldUpdate) renderFloatingPanel();
    }

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const url = args[0] ? args[0].toString() : "";
      const lowerUrl = url.toLowerCase();

      if (lowerUrl.includes("acao=salvar") && args[1] && args[1].body) {
        try {
          const body = JSON.parse(args[1].body);
          if (body.distrito) appState.pendingDistrict = body.distrito;
        } catch (e) {}
      }

      if (lowerUrl.includes("listar-impressoras-disponiveis")) autoConfirmPrint();

      const response = await originalFetch.apply(this, args);

      try {
        if (lowerUrl.includes("controller.php")) {
          response
            .clone()
            .json()
            .then((json) => handleResponse(url, json))
            .catch(() => {});
        }
      } catch (e) {}

      return response;
    };

    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;
      if (url && url.toLowerCase().includes("listar-impressoras-disponiveis")) autoConfirmPrint();
      return originalXhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      if (this._url && this._url.toLowerCase().includes("acao=salvar") && body) {
        try {
          const json = JSON.parse(body);
          if (json.distrito) appState.pendingDistrict = json.distrito;
        } catch (e) {}
      }

      this.addEventListener("load", function () {
        if (this._url && this._url.toLowerCase().includes("controller.php")) {
          try {
            handleResponse(this._url, JSON.parse(this.responseText));
          } catch (e) {}
        }
      });
      return originalXhrSend.apply(this, arguments);
    };

    function autoConfirmPrint() {
      let attempts = 0;
      const interval = setInterval(() => {
        const btnNo = document.getElementById("btnImprimirEtiquetaNao");
        if (btnNo) {
          btnNo.click();
          clearInterval(interval);

          let subAttempts = 0;
          const subInterval = setInterval(() => {
            const btnOk = document.querySelector("#alerta.aberto .act a");
            if (btnOk && btnOk.innerText === "OK") {
              btnOk.click();
              clearInterval(subInterval);
            }
            if (++subAttempts >= 50) clearInterval(subInterval);
          }, 100);
        }
        if (++attempts >= 50) clearInterval(interval);
      }, 100);
    }

    function watchTextInput() {
      const input = document.getElementById("txtObjeto");
      if (!input) return setTimeout(watchTextInput, 1000);

      const parent = input.closest(".campo") || input.parentElement;
      if (parent) {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            setTimeout(() => {
              const msg = parent.querySelector(".mensagem");
              if (msg && msg.innerText.trim().length > 0) refocusInput(input);
            }, 300);
          }
        });

        new MutationObserver(() => {
          const msg = parent.querySelector(".mensagem");
          if (msg && msg.innerText.trim().length > 0 && input.value !== lastInputValue)
            refocusInput(input);
        }).observe(parent, { childList: true, subtree: true, characterData: true });
      }
    }

    function refocusInput(input) {
      if (document.activeElement !== document.getElementById("selDistrito")) {
        input.click();
        input.focus();
        lastInputValue = input.value;
      }
    }

    function watchSelectElement() {
      const select = document.getElementById("selDistrito");
      if (!select) return setTimeout(watchSelectElement, 1000);

      const handle = (e) => {
        appState.domDistrict = e.target.value;
        renderFloatingPanel();
      };
      select.addEventListener("change", handle);
      select.addEventListener("input", handle);
    }

    function initializeApp() {
      injectOperationalTable();
      watchTextInput();
      watchSelectElement();
      autoConfirmPrint();
      renderFloatingPanel();
      applyLayout();
      applyViewVisibility();
    }

    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", initializeApp);
    else initializeApp();
  } else if (CURRENT_PATH.includes("/loecsuspensa/")) {
    function injectHudStyles() {
      if (document.getElementById("sro-hud-styles")) return;
      const style = document.createElement("style");
      style.id = "sro-hud-styles";
      style.innerHTML = `
        #sro-hud-dashboard { box-sizing: border-box; width: 100%; max-width: 100%; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6; border-radius: 8px; margin: 0 auto 20px auto; padding: 15px; font-family: 'Segoe UI', system-ui, sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; animation: slideDown 0.4s ease-out; position: relative; }
        #sro-hud-dashboard * { box-sizing: border-box; }
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

    const parseNumber = (v) =>
      typeof v === "number" ? v : v ? parseInt(v.toString().replace(/<[^>]*>/g, ""), 10) || 0 : 0;

    function calculateMetrics(data) {
      if (!Array.isArray(data) || data.length === 0) return null;
      let totalDistricts = data.length,
        totalObjects = 0,
        totalPoints = 0,
        totalExpired = 0,
        totalToday = 0,
        totalFuture = 0,
        totalAR = 0;

      data.forEach((item) => {
        totalObjects += parseNumber(item.qtde);
        totalPoints += parseNumber(item.qtdePontos);
        totalExpired += parseNumber(item.qtdeVencido);
        totalToday += parseNumber(item.qtdeHoje);
        totalFuture += parseNumber(item.qtdeAVencer);
        totalAR += parseNumber(item.qtdeAR);
      });

      return {
        raw: {
          totalDistricts,
          totalObjects,
          totalPoints,
          totalExpired,
          totalToday,
          totalFuture,
          totalAR,
        },
        calc: {
          density: totalObjects > 0 ? (totalObjects / totalPoints).toFixed(2) : 0,
          criticalIndex: totalObjects > 0 ? ((totalExpired / totalObjects) * 100).toFixed(1) : 0,
          pressure:
            totalObjects > 0 ? (((totalToday + totalFuture) / totalObjects) * 100).toFixed(1) : 0,
          arFactor: totalObjects > 0 ? ((totalAR / totalObjects) * 100).toFixed(1) : 0,
          avgPerDistrict: (totalObjects / totalDistricts).toFixed(1),
        },
      };
    }

    function displayHudDashboard(metrics) {
      const HOOK_ID = "sro-hud-dashboard";
      const existing = document.getElementById(HOOK_ID);
      if (existing) existing.remove();
      if (!metrics) return;

      const anchor = document.querySelector(".botoes");
      if (!anchor) return;

      const r = metrics.raw;
      const c = metrics.calc;

      let colorClass = "border-success";
      let tacticalStatus = "CONTROLADO";

      if (c.criticalIndex > 20) {
        colorClass = "border-warning";
        tacticalStatus = "ATENÇÃO";
      }
      if (c.criticalIndex > 50) {
        colorClass = "border-danger";
        tacticalStatus = "CRÍTICO";
      }

      const hud = document.createElement("div");
      hud.id = HOOK_ID;
      hud.classList.add("hud-updated");
      hud.innerHTML = `
        <div class="hud-card border-info">
          <div class="hud-title">Carga Total Suspensa</div>
          <div class="hud-value">${r.totalObjects} <span style="font-size:0.8rem; color:#888;">objs</span></div>
          <div class="hud-sub">📦 ${r.totalDistricts} distritos afetados</div>
        </div>
        <div class="hud-card ${colorClass}">
          <div class="hud-title">Backlog (Vencidos)</div>
          <div class="hud-value text-danger">${r.totalExpired}</div>
          <div class="hud-sub">🔥 ${c.criticalIndex}% da carga total</div>
        </div>
        <div class="hud-card border-warning">
          <div class="hud-title">Urgência (Hoje+Breve)</div>
          <div class="hud-value">${r.totalToday + r.totalFuture}</div>
          <div class="hud-sub">⚠️ Pressão Operacional: ${c.pressure}%</div>
        </div>
        <div class="hud-card border-info">
          <div class="hud-title">Complexidade (ARs)</div>
          <div class="hud-value">${r.totalAR}</div>
          <div class="hud-sub">📝 Fator de Retenção: ${c.arFactor}%</div>
        </div>
        <div class="hud-full">
          <div class="metric-box">
            <div class="metric-lbl">DENSIDADE DO CLUSTER</div>
            <div class="metric-val">${c.density} objs/ponto</div>
          </div>
          <div class="metric-box">
            <div class="metric-lbl">TOTAL PONTOS FÍSICOS</div>
            <div class="metric-val">📍 ${r.totalPoints}</div>
          </div>
          <div class="metric-box">
            <div class="metric-lbl">STATUS TÁTICO</div>
            <div class="metric-val" style="font-weight:900;">${tacticalStatus}</div>
          </div>
          <div class="metric-box">
            <div class="metric-lbl">MÉDIA OBJS/DISTRITO</div>
            <div class="metric-val">📊 ${c.avgPerDistrict}</div>
          </div>
        </div>
        <div class="hud-footer-time">Atualizado às: ${new Date().toLocaleTimeString("pt-BR")}</div>
      `;

      anchor.parentNode.insertBefore(hud, anchor);
    }

    function processListResponse(url, data) {
      if (url && url.includes("lancamentoController.php?acao=listar")) {
        try {
          const json = typeof data === "string" ? JSON.parse(data) : data;
          if (Array.isArray(json)) {
            injectHudStyles();
            const metrics = calculateMetrics(json);
            setTimeout(() => displayHudDashboard(metrics), 300);
          }
        } catch (e) {}
      }
    }

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);
      try {
        const url = args[0] ? args[0].toString() : "";
        if (url.includes("lancamentoController.php?acao=listar")) {
          response
            .clone()
            .json()
            .then((json) => processListResponse(url, json))
            .catch(() => {});
        }
      } catch (e) {}
      return response;
    };

    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
      this._url = url;
      return originalXhrOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener("load", function () {
        if (this._url && this._url.includes("lancamentoController.php?acao=listar")) {
          try {
            processListResponse(this._url, JSON.parse(this.responseText));
          } catch (e) {}
        }
      });
      return originalXhrSend.apply(this, arguments);
    };
  }
})();
