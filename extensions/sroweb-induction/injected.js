!(function () {
  "use strict";
  const e = "AGUARDANDO...",
    t = "PREVISÃO",
    n = "Clique duas vezes para resetar a posição",
    o = "--/--/----",
    s = "--",
    r = "sro_position",
    i = "sro_panel_mode";
  let d = {
      code: s,
      status: e,
      mode: "loading",
      district: s,
      domDist: null,
      initialDist: null,
      pendingDist: null,
      date: o,
      exc: s,
      val: s,
      lastEvt: s,
      addr: { log: s, num: s, comp: s, bair: s, mun: s, uf: s, cep: s },
      serv: { ar: "N", mp: "N", dd: "N" },
      contact: { tel: s, email: s },
      op: { list: s, user: s, postman: s, st: s, ts: s, ord: s, side: s },
      panelMode: !1,
    },
    a = { active: !1, cX: 0, cY: 0, iX: 0, iY: 0, xOff: 0, yOff: 0 },
    l = null;
  function c() {
    let e = 0;
    const t = setInterval(() => {
      const n = document.getElementById("btnImprimirEtiquetaNao");
      (n &&
        (n.click(),
        clearInterval(t),
        (function () {
          let e = 0;
          const t = setInterval(() => {
            const n = document.querySelector("#alerta.aberto .act a");
            (n && "OK" === n.innerText && (n.click(), clearInterval(t)),
              ++e >= 100 && clearInterval(t));
          }, 50);
        })()),
        ++e >= 100 && clearInterval(t));
    }, 50);
  }
  function p(e) {
    document.activeElement !== document.getElementById("selDistrito") &&
      (e.click(), e.focus(), (l = e.value));
  }
  function m() {
    const e = document.getElementById("txtObjeto");
    if (!e) return setTimeout(m, 1e3);
    const t = e.closest(".campo") || e.parentElement;
    t &&
      (e.addEventListener("keydown", (n) => {
        "Enter" === n.key &&
          setTimeout(() => {
            const n = t.querySelector(".mensagem");
            if (n) {
              const t = n.innerText || "";
              (t.includes("Formato de objeto postal") || t.includes("Preencha este campo")) && p(e);
            }
          }, 300);
      }),
      new MutationObserver(() => {
        const n = t.querySelector(".mensagem");
        if (n) {
          const t = n.innerText || "";
          (t.includes("Formato de objeto postal") || t.includes("Preencha este campo")) &&
            e.value !== l &&
            p(e);
        }
      }).observe(t, { childList: !0, subtree: !0, characterData: !0 }));
  }
  function u() {
    const e = document.getElementById("selDistrito");
    if (!e) return setTimeout(u, 1e3);
    const t = (e) => {
      ((d.domDist = e.target.value), I());
    };
    (e.addEventListener("change", t), e.addEventListener("input", t));
  }
  function f(e) {
    let t = d.domDist && "" !== d.domDist ? d.domDist : d.district;
    t && (t = t.trim());
    const n = e ? "sro-old-p" : "sro-old",
      o = e ? "sro-arrow-p" : "sro-arrow",
      r = e ? "sro-new-p" : "sro-new",
      i = e
        ? "display:flex;align-items:center;justify-content:center;flex-wrap:wrap;flex:1;"
        : "display:flex;align-items:center;justify-content:center";
    return d.initialDist && d.initialDist !== s
      ? t && t !== s && t !== d.initialDist
        ? `<div style="${i}"><span class="${n}">${d.initialDist}</span><span class="${o}">➜</span><span class="${r}">${t}</span></div>`
        : `<span class="${r}">${d.initialDist}</span>`
      : `<span class="${r}">${t || s}</span>`;
  }
  function g() {
    (document.getElementById("div-map") || d.panelMode) &&
      ((d.panelMode = !d.panelMode),
      localStorage.setItem(i, JSON.stringify(d.panelMode)),
      I(),
      d.panelMode || setTimeout(D, 50));
  }
  function x() {
    if (document.getElementById("sro-styles")) return;
    const l = document.createElement("style");
    ((l.id = "sro-styles"),
      (l.innerHTML =
        "\n      #sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); will-change: transform; pointer-events: none; }\n      .sro-snap { transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }\n      .sro-card { width: 360px; background: #fff; border-radius: 6px; font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; opacity: 0; transition: opacity 0.2s; border-left: 8px solid #999; display: none; pointer-events: auto; }\n      .sro-card.visible { display: block; opacity: 1; }\n      .sro-header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border-bottom: 1px solid #eee; cursor: grab; user-select: none; }\n      .sro-status-text { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; color: #444; }\n      .sro-btn-panel { cursor: pointer; font-size: 1.2rem; color: #555; transition: color 0.2s; margin-left: 10px; line-height: 1; }\n      .sro-btn-panel:hover { color: #00416B; }\n      .sro-body { padding: 12px; text-align: center; background: #fff; }\n      .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: #00416B; margin: 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; justify-content: center; align-items: center; min-height: 50px; }\n      .sro-old { font-size: 2rem; opacity: 0.35; font-weight: 700; color: #000; margin-right: 5px; }\n      .sro-arrow { font-size: 2rem; margin: 0 10px; color: #444; font-weight: 400; }\n      .sro-new { color: #00416B; font-size: 3rem; font-weight: 900; }\n\n      #sro-panel-view { \n          background: #fff; \n          padding: 15px; \n          text-align: center; \n          border-radius: 4px; \n          width: 100%; \n          height: 100%; \n          min-height: 450px;\n          box-sizing: border-box;\n          display: flex;\n          flex-direction: column;\n          box-shadow: inset 0 0 20px rgba(0,0,0,0.02);\n      }\n      .sro-panel-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 10px; width: 100%; }\n      .sro-panel-content { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; }\n      .sro-distrito-p { width: 100%; word-break: break-word; display: flex; justify-content: center; align-items: center; margin: 20px 0; }\n      .sro-old-p { font-size: 2.5rem; opacity: 0.35; font-weight: 700; color: #000; margin-right: 15px; }\n      .sro-arrow-p { font-size: 2.5rem; margin: 0 20px; color: #444; font-weight: 400; }\n      .sro-new-p { color: #00416B; font-size: 5rem; font-weight: 900; line-height: 1; }\n      .sro-status-p { font-size: 1.4rem; font-weight: 800; text-transform: uppercase; color: #444; letter-spacing: 1px; text-align: left; }\n      \n      .sro-restore-btn { \n          font-size: 11px; \n          text-decoration: none; \n          color: #333; \n          background: #f9f9f9; \n          padding: 6px 12px; \n          border-radius: 4px; \n          cursor: pointer; \n          border: 1px solid #ccc; \n          font-weight: 700; \n          text-transform: uppercase; \n          display: inline-flex; \n          align-items: center; \n          justify-content: center;\n          min-width: 110px;\n          height: 32px;\n          transition: all 0.2s; \n          white-space: nowrap;\n          line-height: 1;\n      }\n      .sro-restore-btn:hover { background: #e0e0e0; color: #000; border-color: #999; }\n\n      .mode-loading { border-left-color: #7f8c8d; } \n      .mode-success { border-left-color: #009688; } .mode-success .sro-header { background: #e0f2f1; } .mode-success .sro-status-text { color: #00695c; }\n      .mode-error { border-left-color: #d32f2f; } .mode-error .sro-header { background: #ffebee; } .mode-error .sro-status-text { color: #c62828; }\n      .mode-info { border-left-color: #1976d2; } .mode-info .sro-header { background: #e3f2fd; } .mode-info .sro-status-text { color: #0d47a1; }\n      \n      #sro-table-wrapper { margin-top: 25px; font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #ccc; background: #fff; width: 100%; box-sizing: border-box; clear: both; pointer-events: auto; }\n      .sro-table-header { background: #00416B; color: #ffffff !important; padding: 8px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; display: flex; justify-content: space-between; border-bottom: 3px solid #FFE600; }\n      .sro-full-table { width: 100%; border-collapse: collapse; font-size: 11px; }\n      .sro-full-table th { background: #f0f0f0; color: #333; text-align: left; padding: 5px 8px; border: 1px solid #ddd; font-weight: 700; white-space: nowrap; width: 1%; }\n      .sro-full-table td { padding: 5px 8px; border: 1px solid #ddd; color: #000; word-break: break-word; }\n      .hl-val { color: #2e7d32; font-weight: 800; background: #e8f5e9; padding: 1px 4px; border-radius: 3px; }\n      .hl-err { color: #c62828; font-weight: 800; background: #ffebee; padding: 1px 4px; border-radius: 3px; }\n      .hl-dist { font-size: 15px; font-weight: 800; color: #00416B; }\n      .hl-serv { background: #fff8e1; color: #ff8f00; padding: 0 3px; border-radius: 2px; font-weight: bold; border: 1px solid #ffecb3; margin-right: 3px; }\n      .hl-serv-off { opacity: 0.2; margin-right: 3px; }\n    "),
      document.head.appendChild(l));
    const c = document.createElement("div");
    ((c.id = "sro-container"),
      (c.innerHTML = `\n      <div id="sro-card" class="sro-card mode-loading">\n        <div id="sro-header" class="sro-header" title="${n}">\n          <span id="sro-status" class="sro-status-text">${e}</span>\n          <div style="display:flex;align-items:center">\n             <span id="sro-icon" class="sro-icon">⏳</span>\n             <span id="btn-panel-toggle" class="sro-btn-panel" title="Mover para Painel">⤢</span>\n          </div>\n        </div>\n        <div class="sro-body">\n          <div id="sro-distrito" class="sro-distrito">${s}</div>\n          <div style="font-size:12px;color:#666;margin-top:4px">${t}: <strong id="sro-previsao" style="color:#333">${o}</strong></div>\n        </div>\n      </div>`),
      document.body.appendChild(c),
      document.getElementById("btn-panel-toggle").addEventListener("click", g));
    try {
      const e = JSON.parse(localStorage.getItem(r));
      e &&
        "number" == typeof e.x &&
        "number" == typeof e.y &&
        ((a.cX = e.x),
        (a.cY = e.y),
        (a.xOff = e.x),
        (a.yOff = e.y),
        (c.style.transform = `translate3d(${e.x}px, ${e.y}px, 0)`));
      !0 === JSON.parse(localStorage.getItem(i)) && (d.panelMode = !0);
    } catch (e) {}
    const p = document.getElementById("sro-header");
    (p.addEventListener("mousedown", v, !1),
      p.addEventListener("dblclick", y, !1),
      document.addEventListener("mouseup", w, !1),
      document.addEventListener("mousemove", E, !1),
      window.addEventListener("resize", D),
      h(),
      m(),
      u(),
      d.panelMode || D());
  }
  function h() {
    if (document.getElementById("sro-table-wrapper")) return;
    const e = document.querySelector(".botoes");
    if (!e) return setTimeout(h, 500);
    const t = document.createElement("div");
    ((t.id = "sro-table-wrapper"),
      (t.innerHTML = `\n        <div class="sro-table-header"><span style="color:#ffffff !important">DADOS OPERACIONAIS</span><span style="opacity:0.7;color:#fff">SRO EXT</span></div>\n        <table class="sro-full-table">\n            <tr>\n                <th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">${s}</td>\n                <th>STATUS</th><td id="td-stt">${s}</td>\n                <th>VALIDAÇÃO</th><td id="td-val">${s}</td>\n                <th>DATA PREV.</th><td id="td-dat-prev">${s}</td>\n            </tr>\n            <tr id="row-exc" style="display:none">\n                <th style="color:#c62828">EXCEÇÃO</th><td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">${s}</td>\n            </tr>\n            <tr>\n                <th>ENDEREÇO</th><td colspan="5" id="td-end-full">${s}</td>\n                <th>CEP</th><td id="td-cep" style="font-weight:bold">${s}</td>\n            </tr>\n            <tr>\n                 <th>CONTATO</th><td colspan="7" id="td-con">${s}</td>\n            </tr>\n            <tr>\n                <th>DISTRITO</th><td id="td-dis" class="hl-dist">${s}</td>\n                <th>ORDEM</th><td id="td-ord">${s}</td>\n                <th>LADO</th><td id="td-lad">${s}</td>\n                <th>SERVIÇOS</th><td colspan="3" id="td-srv">${s}</td>\n            </tr>\n            <tr>\n                <th rowspan="2">INDUÇÃO</th>\n                <td colspan="7">\n                    <span style="color:#777">L:</span> <b id="td-lis">${s}</b> &nbsp;|&nbsp; \n                    <span style="color:#777">E:</span> <b id="td-est">${s}</b> &nbsp;|&nbsp; \n                    <span style="color:#777">U:</span> <b id="td-usu">${s}</b> &nbsp;|&nbsp; \n                    <span style="color:#777">DATA:</span> <b id="td-dat">${s}</b>\n                </td>\n            </tr>\n            <tr>\n                <td colspan="7" style="background:#fffde7;border-left:3px solid #fbc02d">\n                    <span style="color:#f57f17;font-weight:bold;text-transform:uppercase">CARTEIRO:</span> \n                    <b id="td-postman" style="font-size:12px;color:#333;margin-left:5px">${s}</b>\n                </td>\n            </tr>\n        </table>\n    `),
      e.insertAdjacentElement("afterend", t));
  }
  function b() {
    localStorage.setItem(r, JSON.stringify({ x: a.cX, y: a.cY }));
  }
  function y() {
    const e = document.getElementById("sro-container");
    e &&
      ((a.xOff = 0),
      (a.yOff = 0),
      (a.cX = 0),
      (a.cY = 0),
      e.classList.add("sro-snap"),
      (e.style.transform = "translate3d(0px, 0px, 0)"),
      setTimeout(() => e.classList.remove("sro-snap"), 300),
      b());
  }
  function v(e) {
    ((a.iX = e.clientX - a.xOff), (a.iY = e.clientY - a.yOff), (a.active = !0));
  }
  function w() {
    ((a.iX = a.cX), (a.iY = a.cY), (a.active = !1), b(), D());
  }
  function E(e) {
    a.active &&
      (e.preventDefault(),
      (a.cX = e.clientX - a.iX),
      (a.cY = e.clientY - a.iY),
      (a.xOff = a.cX),
      (a.yOff = a.cY),
      $(a.cX, a.cY, document.getElementById("sro-container")));
  }
  function $(e, t, n) {
    n.style.transform = `translate3d(${e}px, ${t}px, 0)`;
  }
  function D() {
    const e = document.getElementById("sro-container");
    if (!e || d.panelMode) return;
    const t = e.getBoundingClientRect(),
      n = window.innerWidth,
      o = window.innerHeight;
    let s = !1;
    (t.left < 0 && ((a.cX += 0 - t.left), (s = !0)),
      t.top < 0 && ((a.cY += 0 - t.top), (s = !0)),
      t.right > n && ((a.cX -= t.right - n), (s = !0)),
      t.bottom > o && ((a.cY -= t.bottom - o), (s = !0)),
      s &&
        (e.classList.add("sro-snap"),
        (a.xOff = a.cX),
        (a.yOff = a.cY),
        $(a.cX, a.cY, e),
        setTimeout(() => e.classList.remove("sro-snap"), 300),
        b()));
  }
  function I() {
    x();
    const e = document.getElementById("sro-card"),
      n = document.getElementById("sro-status"),
      r = document.getElementById("sro-icon"),
      i = document.getElementById("sro-distrito"),
      a = document.getElementById("sro-previsao");
    let l = "⏳";
    ("success" === d.mode && (l = "✅"),
      "error" === d.mode && (l = "⛔"),
      "info" === d.mode && (l = "⚠️"));
    const c = document.getElementById("div-map");
    if ((d.panelMode && !c && (d.panelMode = !1), d.panelMode)) {
      if (((e.className = `sro-card mode-${d.mode}`), c)) {
        const e = document.getElementById("painel");
        e && (e.style.display = "none");
        let n = document.getElementById("sro-panel-view");
        n || ((n = document.createElement("div")), (n.id = "sro-panel-view"), c.appendChild(n));
        const s =
          "success" === d.mode
            ? "#009688"
            : "error" === d.mode
              ? "#d32f2f"
              : "info" === d.mode
                ? "#1976d2"
                : "#999";
        ((n.style.borderLeft = `10px solid ${s}`),
          (n.innerHTML = `\n                <div class="sro-panel-header">\n                    <span class="sro-status-p" style="color:${s}">${d.status}</span>\n                    <button id="btn-panel-restore" class="sro-restore-btn" title="Voltar ao modo Popup">Restaurar <span style="font-size:15px;margin-left:6px;line-height:1">⤡</span></button>\n                </div>\n                <div class="sro-panel-content">\n                    <div class="sro-distrito-p">${f(!0)}</div>\n                    <div style="font-size:16px;color:#666;margin-top:20px">${t}: <strong>${d.date || o}</strong></div>\n                </div>\n            `),
          document.getElementById("btn-panel-restore").addEventListener("click", g));
      }
    } else if (
      ((e.className = `sro-card visible mode-${d.mode}`),
      (n.innerText = d.status),
      (r.innerText = l),
      (i.innerHTML = f(!1)),
      (a.innerText = d.date || o),
      c)
    ) {
      const e = document.getElementById("sro-panel-view");
      e && e.remove();
      const t = document.getElementById("painel");
      t && (t.style.display = "block");
    }
    const p = (e) => document.getElementById(e);
    if (p("td-cod")) {
      p("td-cod").innerText = d.code;
      const e = d.val;
      ((p("td-val").innerHTML = e
        ? `<span class="${e.includes("V") ? "hl-val" : "hl-err"}">${e}</span>`
        : s),
        (p("td-stt").innerText = d.lastEvt),
        (p("td-dat-prev").innerText = d.date));
      const t = d.exc;
      (t && t !== s
        ? ((p("td-exc").innerText = t),
          (document.getElementById("row-exc").style.display = "table-row"))
        : (document.getElementById("row-exc").style.display = "none"),
        (p("td-end-full").innerText =
          `${d.addr.log}, ${d.addr.num} ${d.addr.comp ? "- " + d.addr.comp : ""} - ${d.addr.bair}, ${d.addr.mun}/${d.addr.uf}`),
        (p("td-cep").innerText = d.addr.cep),
        (p("td-con").innerHTML =
          `TEL: <b>${d.contact.tel}</b> ${d.contact.email !== s ? " | EMAIL: " + d.contact.email : ""}`),
        (p("td-dis").innerHTML = f(!1)),
        (p("td-ord").innerText = d.op.ord),
        (p("td-lad").innerText = d.op.side));
      const n = (e, t) =>
        `<span class="${"S" === d.serv[e] ? "hl-serv" : "hl-serv-off"}">${t}</span>`;
      ((p("td-srv").innerHTML = n("ar", "AR") + n("mp", "MP") + n("dd", "DD")),
        (p("td-lis").innerText = d.op.list),
        (p("td-est").innerText = d.op.st),
        (p("td-usu").innerText = d.op.user),
        (p("td-dat").innerText = (function (e) {
          return !e || e.length < 18
            ? s
            : `${e.substring(8, 10) + "/" + e.substring(10, 12) + "/" + e.substring(12, 16)} às ${e.substring(16, 18) + ":" + e.substring(18, 20)}`;
        })(d.op.ts)),
        (p("td-postman").innerText = d.op.postman));
    }
  }
  function O(e, t) {
    const n = e.toLowerCase();
    let r = null;
    try {
      const t = new URL(e, window.location.origin);
      r = t.searchParams.get("codigo") || t.searchParams.get("id") || t.searchParams.get("objeto");
    } catch (e) {}
    if (r && r !== d.code && (n.includes("acao=validar") || n.includes("acao=pesquisar"))) {
      const e = JSON.parse(localStorage.getItem(i) || "false");
      ((d = {
        code: r,
        status: t,
        mode: "loading",
        district: s,
        domDist: null,
        initialDist: null,
        pendingDist: null,
        date: o,
        exc: s,
        val: s,
        lastEvt: s,
        addr: { log: s, num: s, comp: s, bair: s, mun: s, uf: s, cep: s },
        serv: { ar: "N", mp: "N", dd: "N" },
        contact: { tel: s, email: s },
        op: { list: s, user: s, postman: s, st: s, ts: s, ord: s, side: s },
        panelMode: e,
      }),
        I());
    }
    (n.includes("acao=validar")
      ? ((d.val = t.validacao || s),
        (d.exc = t.excecao || s),
        (d.lastEvt = t.ultimoEventoDescricao || s),
        t.validacao
          ? ((d.mode = "success" !== d.mode && "error" !== d.mode ? "info" : d.mode),
            (d.status =
              "success" !== d.status && "error" !== d.status ? "PRONTO P/ INDUZIR" : d.status),
            (d.date = t.previsaoEntrega?.data || o))
          : ((d.mode = "error"), (d.status = "NÃO INDUZIDO"), (d.date = o)))
      : n.includes("enderecocontroller.php")
        ? (t.endereco &&
            ((d.addr.log = t.endereco.logradouro),
            (d.addr.num = t.endereco.numeroLogradouro),
            (d.addr.comp = t.endereco.complementoLogradouro),
            (d.addr.bair = t.endereco.bairro),
            (d.addr.mun = t.endereco.municipio),
            (d.addr.uf = t.endereco.uf),
            (d.addr.cep = t.endereco.cep)),
          t.servico &&
            ((d.serv.ar = t.servico.ar), (d.serv.mp = t.servico.mp), (d.serv.dd = t.servico.dd)),
          t.telefone && (d.contact.tel = `(${t.telefone.ddd}) ${t.telefone.numero}`),
          (d.contact.email = t.email || s))
        : n.includes("distritamentotrechocontroller.php")
          ? Array.isArray(t) &&
            t.length > 0 &&
            ((d.district = `${t[0].rotuloDistrito} ${t[0].areaDistrito || ""}`.trim()),
            (d.op.ord = t[0].ordemPercorrida),
            (d.op.side = t[0].lado))
          : n.includes("acao=pesquisarloecobjeto")
            ? t.id &&
              ((d.mode = "success"),
              (d.status = "JÁ INDUZIDO"),
              (d.initialDist = `${t.numeroDistrito} ${t.distritoComplemento || ""}`.trim()),
              (d.district = d.initialDist),
              (d.domDist = d.initialDist),
              (d.op.list = t.idLancamento),
              (d.op.user = t.carteiro?.nome || s),
              (d.op.postman = t.carteiro?.nome || s))
            : n.includes("acao=listar")
              ? Array.isArray(t) &&
                d.op.list &&
                t.find((e) => e.idLancamento === d.op.list)?.nomeCarteiro &&
                (d.op.postman = t.find((e) => e.idLancamento === d.op.list).nomeCarteiro)
              : n.includes("acao=salvar")
                ? (t.idLancamento &&
                    ((d.mode = "success"),
                    (d.status = "OBJETO INDUZIDO"),
                    (d.op.list = t.numeroLista),
                    (d.op.user = t.usuario),
                    (d.op.st = t.estacao),
                    (d.op.ts = t.carimbo),
                    t.dataPrevista && (d.date = t.dataPrevista)),
                  d.pendingDist &&
                    ((d.district = d.pendingDist),
                    (d.initialDist = d.pendingDist),
                    (d.domDist = d.pendingDist)),
                  t.distrito && ((d.initialDist = t.distrito), (d.domDist = t.distrito)))
                : n.includes("acao=excluir") &&
                  ((d.mode = "error"),
                  (d.status = "EXCLUÍDO"),
                  (d.district = s),
                  (d.domDist = null),
                  (d.date = o),
                  (d.initialDist = null),
                  (d.pendingDist = null)),
      I());
  }
  const T = window.fetch;
  window.fetch = async function (...e) {
    const t = e[0] ? e[0].toString() : "",
      n = t.toLowerCase(),
      o = e[1];
    if (n.includes("acao=salvar") && o && o.body)
      try {
        const e = JSON.parse(o.body);
        e.distrito && (d.pendingDist = e.distrito);
      } catch (e) {}
    n.includes("listar-impressoras-disponiveis") && c();
    const s = await T.apply(this, e);
    try {
      n.includes("controller.php") &&
        s
          .clone()
          .json()
          .then((e) => O(t, e))
          .catch(() => {});
    } catch (e) {}
    return s;
  };
  const L = XMLHttpRequest.prototype.open,
    B = XMLHttpRequest.prototype.send;
  ((XMLHttpRequest.prototype.open = function (e, t) {
    return (
      (this._url = t),
      t && t.toLowerCase().includes("listar-impressoras-disponiveis") && c(),
      L.apply(this, arguments)
    );
  }),
    (XMLHttpRequest.prototype.send = function (e) {
      const t = this._url ? this._url.toLowerCase() : "";
      return (
        t &&
          t.includes("acao=salvar") &&
          e &&
          JSON.parse(e).distrito &&
          (d.pendingDist = JSON.parse(e).distrito),
        this.addEventListener("load", function () {
          const e = this._url ? this._url.toLowerCase() : "";
          e &&
            e.includes("controller.php") &&
            JSON.parse(this.responseText) &&
            O(this._url, JSON.parse(this.responseText));
        }),
        B.apply(this, arguments)
      );
    }),
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", x) : x());
})();
