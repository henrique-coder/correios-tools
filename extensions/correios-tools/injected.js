!(function () {
  "use strict";
  const t = window.location.pathname.toLowerCase();
  if (t.includes("/lancamentoautomatico/")) {
    const e = {
      POS: "correiostools_pos_v2",
      HIST: "correiostools_hist_v3",
      VIEW: "correiostools_view_mode",
      LAYOUT: "correiostools_layout_inv",
      HIDDEN: "correiostools_panel_hide",
    };
    let o = {
        code: "--",
        status: "AGUARDANDO...",
        mode: "loading",
        district: "--",
        domDist: null,
        initialDist: null,
        pendingDist: null,
        date: "--/--/----",
        exc: "--",
        val: "--",
        lastEvt: "--",
        addr: {
          log: "--",
          num: "--",
          comp: "--",
          bair: "--",
          mun: "--",
          uf: "--",
          cep: "--",
        },
        serv: { ar: "N", mp: "N", dd: "N" },
        contact: { tel: "--", email: "--" },
        op: {
          list: "--",
          user: "--",
          postman: "--",
          st: "--",
          ts: "--",
          ord: "--",
          side: "--",
        },
      },
      s = { active: !1, cX: 0, cY: 0, iX: 0, iY: 0, xOff: 0, yOff: 0 },
      r = null;
    function i() {
      localStorage.setItem(e.POS, JSON.stringify({ x: s.xOff, y: s.yOff }));
    }
    function n(t) {
      try {
        const o = JSON.parse(localStorage.getItem(e.POS));
        o &&
          "number" == typeof o.x &&
          ((s.xOff = o.x),
          (s.yOff = o.y),
          (t.style.transform = `translate3d(${o.x}px, ${o.y}px, 0)`));
      } catch (t) {}
    }
    function d(t, s, r) {
      if (o.code && "--" !== o.code && !(o.code.length < 13))
        try {
          let i = JSON.parse(localStorage.getItem(e.HIST) || "[]"),
            n = new Date().toLocaleString("pt-BR"),
            d = o.domDist || o.district || "--";
          const a = { time: n, action: s, desc: r },
            l = i[0];
          if (l && l.code === o.code && l.sessionActive) {
            const e = l.events[l.events.length - 1];
            (e && e.action === s && e.desc === r) ||
              (l.events.push(a),
              (l.finalDist = d),
              "--" !== o.addr.log && (l.addr = o.addr),
              "induzir" === t
                ? ((l.status = "INDUZIDO"), (l.sessionActive = !1), (l.end = n))
                : "excluir" === t &&
                  ((l.status = "EXCLUÍDO"), (l.sessionActive = !1), (l.end = n)));
          } else {
            let e = "LIDO",
              s = !0,
              r = null;
            ("induzir" === t
              ? ((e = "INDUZIDO"), (s = !1), (r = n))
              : "excluir" === t && ((e = "EXCLUÍDO"), (s = !1), (r = n)),
              i.unshift({
                code: o.code,
                start: n,
                end: r,
                status: e,
                sessionActive: s,
                events: [a],
                addr: o.addr,
                finalDist: d,
              }));
          }
          (localStorage.setItem(e.HIST, JSON.stringify(i.slice(0, 10))),
            "history" === localStorage.getItem(e.VIEW) && u());
        } catch (t) {}
    }
    function a() {
      const t = "true" === localStorage.getItem(e.LAYOUT);
      (localStorage.setItem(e.LAYOUT, !t), l());
    }
    function l() {
      const t = document.getElementById("div-map");
      if (!t) return;
      const o = t.parentNode;
      "true" === localStorage.getItem(e.LAYOUT) ? o.prepend(t) : o.append(t);
    }
    function c() {
      const t = "true" === localStorage.getItem(e.HIDDEN);
      (localStorage.setItem(e.HIDDEN, !t), p());
    }
    function p() {
      const t = document.getElementById("div-map");
      if (!t) return;
      const o = "true" === localStorage.getItem(e.HIDDEN),
        s = [
          document.getElementById("btn-layout-toggle"),
          document.getElementById("btn-toggle-view"),
        ],
        r = document.getElementById("btn-hide-panel");
      let i = t.nextElementSibling;
      (i && "sro-ghost-storage" !== i.id) || (i = t.previousElementSibling);
      let n = document.getElementById("sro-ghost-storage");
      n ||
        ((n = document.createElement("div")),
        (n.id = "sro-ghost-storage"),
        (n.style.display = "none"),
        document.body.appendChild(n));
      const d = document.getElementById("painel");
      o
        ? (d && t.contains(d) && n.appendChild(d),
          (t.style.display = "none"),
          r && ((r.innerText = "+"), (r.title = "Restaurar Painel")),
          s.forEach((t) => t && t.classList.add("sro-btn-disabled")),
          i &&
            (i.dataset.oc || (i.dataset.oc = i.className),
            i.classList.remove("col-9", "col-md-9", "col-lg-9"),
            i.classList.add("col-12"),
            (i.style.maxWidth = "100%"),
            (i.style.flex = "0 0 100%")))
        : (i &&
            i.dataset.oc &&
            ((i.className = i.dataset.oc), (i.style.maxWidth = ""), (i.style.flex = "")),
          (t.style.display = ""),
          r && ((r.innerText = "-"), (r.title = "Ocultar Painel")),
          s.forEach((t) => t && t.classList.remove("sro-btn-disabled")),
          u());
    }
    function u() {
      if ("true" === localStorage.getItem(e.HIDDEN)) return;
      const t = localStorage.getItem(e.VIEW) || "map",
        o = document.getElementById("div-map");
      if (!o) return;
      let s = document.getElementById("sro-ghost-storage");
      s ||
        ((s = document.createElement("div")),
        (s.id = "sro-ghost-storage"),
        (s.style.display = "none"),
        document.body.appendChild(s));
      const r = document.getElementById("painel");
      if ("history" === t) {
        r && o.contains(r) && s.appendChild(r);
        let t = document.getElementById("sro-history-ui");
        t || ((t = document.createElement("div")), (t.id = "sro-history-ui"), o.appendChild(t));
        const i = JSON.parse(localStorage.getItem(e.HIST) || "[]");
        t.innerHTML = `<div class="sro-hist-container"><div class="sro-hist-top">Histórico Recente</div>${0 === i.length ? '<div style="padding:20px;text-align:center;color:#999;">Nenhum objeto</div>' : ""}<ul class="sro-hist-ul">${i
          .map((t) => {
            return `<li class="sro-hist-li"><div class="sro-hist-head" onclick="this.parentElement.classList.toggle('expanded')"><div><span class="sro-hist-badge ${"INDUZIDO" === t.status ? "badge-ind" : "EXCLUÍDO" === t.status ? "badge-exc" : "badge-lid"}">${t.status}</span><strong style="color:#00416B;margin-left:5px;">${((e = t.code), e && 13 === e.length ? `${e.slice(0, 2)} ${e.slice(2, 5)} ${e.slice(5, 8)} ${e.slice(8, 11)} ${e.slice(11)}` : e)}</strong></div><div style="font-size:11px;color:#666;">${t.start.split(" ")[1]}</div></div><div class="sro-hist-body"><div class="sro-hist-addr">${t.addr.log}, ${t.addr.num}</div><div class="sro-hist-res">Resultado: <strong>${t.finalDist || "--"}</strong></div><div class="sro-hist-timeline">${t.events.map((t) => `<div class="sro-hist-evt"><span>${t.time.split(" ")[1]}</span> ${t.desc}</div>`).join("")}</div></div></li>`;
            var e;
          })
          .join("")}</ul><div class="sro-hist-end">▼ Fim do histórico (Máx 10)</div></div>`;
      } else {
        const t = document.getElementById("sro-history-ui");
        (t && t.remove(), r && !o.contains(r) && o.appendChild(r));
      }
    }
    function f() {
      b();
      let t = document.getElementById("sro-container");
      t ||
        ((t = document.createElement("div")),
        (t.id = "sro-container"),
        (t.innerHTML =
          '<div id="sro-card" class="sro-card mode-loading"><div id="sro-header" class="sro-header" title="Segure para mover"><div class="sro-status-block"><span id="sro-icon" class="sro-icon">⏳</span><span id="sro-status" class="sro-status-text">AGUARDANDO...</span></div><div class="sro-btn-group"><span id="btn-toggle-view" class="sro-btn-panel" title="Alternar Mapa/Histórico">🕒</span><span id="btn-layout-toggle" class="sro-btn-panel" title="Inverter Layout">⇄</span><span id="btn-hide-panel" class="sro-btn-panel" title="Ocultar Painel" style="font-size:1.6rem;margin-top:-3px;">-</span></div></div><div class="sro-body"><div id="sro-distrito" class="sro-distrito">--</div><div style="font-size:12px;color:#666;margin-top:4px">PREVISÃO: <strong id="sro-previsao" style="color:#333">--/--/----</strong></div></div></div>'),
        document.body.appendChild(t),
        n(t),
        x(document.getElementById("sro-header"), t),
        (document.getElementById("btn-layout-toggle").onclick = a),
        (document.getElementById("btn-hide-panel").onclick = c),
        (document.getElementById("btn-toggle-view").onclick = () => {
          (localStorage.setItem(
            e.VIEW,
            "map" === (localStorage.getItem(e.VIEW) || "map") ? "history" : "map"
          ),
            u());
        }));
      const s = document.getElementById("sro-card");
      if (s) {
        let t = "⏳";
        ("success" === o.mode && (t = "✅"),
          "error" === o.mode && (t = "⛔"),
          "info" === o.mode && (t = "⚠️"),
          (s.className = `sro-card visible mode-${o.mode}`),
          (document.getElementById("sro-status").innerText = o.status),
          (document.getElementById("sro-icon").innerText = t),
          (document.getElementById("sro-distrito").innerHTML = m(!0)),
          (document.getElementById("sro-previsao").innerText = o.date || "--/--/----"));
      }
      (g(), u(), p());
    }
    function m(t) {
      let e = o.domDist && "" !== o.domDist ? o.domDist : o.district;
      e = e ? e.trim() : "";
      const s = t
        ? "display:flex;align-items:center;justify-content:center"
        : "display:flex;align-items:center;justify-content:center;flex-wrap:wrap;flex:1;";
      return o.initialDist && "--" !== o.initialDist && e && "--" !== e && e !== o.initialDist
        ? `<div style="${s}"><span class="${t ? "sro-old" : "sro-old-p"}">${o.initialDist}</span><span class="${t ? "sro-arrow" : "sro-arrow-p"}">➜</span><span class="${t ? "sro-new" : "sro-new-p"}">${e}</span></div>`
        : `<span class="${t ? "sro-new" : "sro-new-p"}">${e || "--"}</span>`;
    }
    function g() {
      const t = (t) => document.getElementById(t);
      if (!t("td-cod")) return;
      t("td-cod").innerText = o.code;
      const e = o.val;
      ((t("td-val").innerHTML = e
        ? `<span class="${e.includes("V") ? "hl-val" : "hl-err"}">${e}</span>`
        : "--"),
        (t("td-stt").innerText = o.lastEvt),
        (t("td-dat-prev").innerText = o.date),
        o.exc && "--" !== o.exc
          ? ((t("td-exc").innerText = o.exc),
            (document.getElementById("row-exc").style.display = "table-row"))
          : (document.getElementById("row-exc").style.display = "none"),
        (t("td-end-full").innerText =
          `${o.addr.log}, ${o.addr.num} ${o.addr.comp ? "- " + o.addr.comp : ""} - ${o.addr.bair}, ${o.addr.mun}/${o.addr.uf}`),
        (t("td-cep").innerText = o.addr.cep),
        (t("td-con").innerHTML =
          `TEL: <b>${o.contact.tel}</b> ${"--" !== o.contact.email ? " | EMAIL: " + o.contact.email : ""}`),
        (t("td-dis").innerHTML = m(!1)),
        (t("td-ord").innerText = o.op.ord),
        (t("td-lad").innerText = o.op.side));
      const s = (t, e) =>
        `<span class="${"S" === o.serv[t] ? "hl-serv" : "hl-serv-off"}">${e}</span>`;
      ((t("td-srv").innerHTML = s("ar", "AR") + s("mp", "MP") + s("dd", "DD")),
        (t("td-lis").innerText = o.op.list),
        (t("td-est").innerText = o.op.st),
        (t("td-usu").innerText = o.op.user),
        (t("td-postman").innerText = o.op.postman));
      let r = o.op.ts;
      t("td-dat").innerText =
        r && r.length >= 18
          ? `${r.substring(8, 10)}/${r.substring(10, 12)}/${r.substring(12, 16)} às ${r.substring(16, 18)}:${r.substring(18, 20)}`
          : "--";
    }
    function h() {
      if (document.getElementById("sro-table-wrapper")) return;
      const t = document.querySelector(".botoes");
      if (!t) return setTimeout(h, 500);
      const e = document.createElement("div");
      ((e.id = "sro-table-wrapper"),
        (e.innerHTML =
          '<div class="sro-table-header"><span style="color:#ffffff !important">DADOS OPERACIONAIS</span></div><table class="sro-full-table"><tr><th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">--</td><th>STATUS</th><td id="td-stt">--</td><th>VALIDAÇÃO</th><td id="td-val">--</td><th>DATA PREV.</th><td id="td-dat-prev">--</td></tr><tr id="row-exc" style="display:none"><th style="color:#c62828">EXCEÇÃO</th><td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">--</td></tr><tr><th>ENDEREÇO</th><td colspan="5" id="td-end-full">--</td><th>CEP</th><td id="td-cep" style="font-weight:bold">--</td></tr><tr><th>CONTATO</th><td colspan="7" id="td-con">--</td></tr><tr><th>DISTRITO</th><td id="td-dis" class="hl-dist">--</td><th>ORDEM</th><td id="td-ord">--</td><th>LADO</th><td id="td-lad">--</td><th>SERVIÇOS</th><td colspan="3" id="td-srv">--</td></tr><tr><th rowspan="2">INDUÇÃO</th><td colspan="7"><span style="color:#777">L:</span> <b id="td-lis">--</b> &nbsp;|&nbsp; <span style="color:#777">E:</span> <b id="td-est">--</b> &nbsp;|&nbsp; <span style="color:#777">U:</span> <b id="td-usu">--</b> &nbsp;|&nbsp; <span style="color:#777">DATA:</span> <b id="td-dat">--</b></td></tr><tr><td colspan="7" style="background:#fffde7;border-left:3px solid #fbc02d"><span style="color:#f57f17;font-weight:bold;text-transform:uppercase">CARTEIRO:</span> <b id="td-postman" style="font-size:12px;color:#333;margin-left:5px">--</b></td></tr></table>'),
        t.insertAdjacentElement("afterend", e));
    }
    function b() {
      if (document.getElementById("sro-styles")) return;
      const t = document.createElement("style");
      ((t.id = "sro-styles"),
        (t.innerHTML =
          "#sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); will-change: transform; font-family: 'Segoe UI', sans-serif; } .sro-card { width: 360px; background: #fff; border-radius: 6px; overflow: hidden; border-left: 8px solid #999; display: block; } .sro-header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border-bottom: 1px solid #eee; cursor: grab; user-select: none; } .sro-status-block { display: flex; align-items: center; gap: 8px; flex: 1; } .sro-status-text { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; color: #444; } .sro-btn-group { display: flex; align-items: center; gap: 8px; } .sro-btn-panel { cursor: pointer; font-size: 1.2rem; color: #555; transition: all 0.2s; line-height: 1; font-weight:bold; padding: 2px 5px; border-radius: 4px; } .sro-btn-panel:hover { color: #00416B; background: #f0f0f0; } .sro-btn-disabled { opacity: 0.3; pointer-events: none; } .sro-body { padding: 12px; text-align: center; background: #fff; } .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: #00416B; margin: 6px 0; } .sro-new { color: #00416B; font-size: 3rem; font-weight: 900; } .sro-old { font-size: 2rem; opacity: 0.35; font-weight: 700; color: #000; margin-right: 5px; } .sro-arrow { font-size: 2rem; margin: 0 10px; color: #444; font-weight: 400; } .mode-loading { border-left-color: #7f8c8d; } .mode-success { border-left-color: #009688; } .mode-success .sro-header { background: #e0f2f1; } .mode-success .sro-status-text { color: #00695c; } .mode-error { border-left-color: #d32f2f; } .mode-error .sro-header { background: #ffebee; } .mode-error .sro-status-text { color: #c62828; } .mode-info { border-left-color: #1976d2; } .mode-info .sro-header { background: #e3f2fd; } .mode-info .sro-status-text { color: #0d47a1; } #sro-table-wrapper { margin-top: 25px; font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #ccc; background: #fff; width: 100%; box-sizing: border-box; clear: both; pointer-events: auto; } .sro-table-header { background: #00416B; color: #ffffff !important; padding: 8px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; display: flex; justify-content: space-between; border-bottom: 3px solid #FFE600; } .sro-full-table { width: 100%; border-collapse: collapse; font-size: 11px; } .sro-full-table th { background: #f0f0f0; color: #333; text-align: left; padding: 5px 8px; border: 1px solid #ddd; font-weight: 700; white-space: nowrap; width: 1%; } .sro-full-table td { padding: 5px 8px; border: 1px solid #ddd; color: #000; word-break: break-word; } .hl-val { color: #2e7d32; font-weight: 800; background: #e8f5e9; padding: 1px 4px; border-radius: 3px; } .hl-err { color: #c62828; font-weight: 800; background: #ffebee; padding: 1px 4px; border-radius: 3px; } .hl-dist { font-size: 15px; font-weight: 800; color: #00416B; } .hl-serv { background: #fff8e1; color: #ff8f00; padding: 0 3px; border-radius: 2px; font-weight: bold; border: 1px solid #ffecb3; margin-right: 3px; } .hl-serv-off { opacity: 0.2; margin-right: 3px; } #sro-history-ui { width: 100%; height: 100%; background: #f9f9f9; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #ddd; border-radius: 4px; animation: fadeIn 0.3s; } .sro-hist-container { flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 10px; } .sro-hist-top { font-weight: bold; color: #555; text-transform: uppercase; font-size: 12px; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #00416B; } .sro-hist-ul { list-style: none; padding: 0; margin: 0; } .sro-hist-li { background: #fff; border: 1px solid #eee; margin-bottom: 8px; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); } .sro-hist-head { padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: #fff; transition: background 0.2s; } .sro-hist-head:hover { background: #f4f8fb; } .sro-hist-body { display: none; padding: 8px 10px; border-top: 1px solid #f0f0f0; background: #fafafa; font-size: 11px; } .sro-hist-li.expanded .sro-hist-body { display: block; } .sro-hist-badge { font-size: 9px; padding: 2px 5px; border-radius: 3px; font-weight: bold; text-transform: uppercase; } .badge-ind { background: #e8f5e9; color: #2e7d32; } .badge-exc { background: #ffebee; color: #c62828; } .badge-lid { background: #e3f2fd; color: #1565c0; } .sro-hist-addr { font-weight: 600; color: #555; margin-bottom: 5px; } .sro-hist-res { display: inline-block; background: #eee; padding: 2px 6px; border-radius: 3px; margin-bottom: 6px; color: #333; font-weight: 600; } .sro-hist-evt { color: #777; margin-bottom: 2px; border-bottom: 1px dashed #eee; padding-bottom: 2px; } .sro-hist-evt span { font-weight: bold; color: #999; margin-right: 5px; font-size: 10px; } .sro-hist-end { text-align: center; color: #aaa; font-size: 10px; padding: 10px 0; border-top: 1px dashed #ddd; margin-top: 10px; text-transform: uppercase; font-weight: bold; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }"),
        document.head.appendChild(t));
    }
    function x(t, e) {
      ((t.onmousedown = (t) => {
        t.target.closest(".sro-btn-group") ||
          ((s.active = !0), (s.iX = t.clientX - s.xOff), (s.iY = t.clientY - s.yOff));
      }),
        (t.ondblclick = (t) => {
          t.target.closest(".sro-btn-group") ||
            ((s.xOff = 0),
            (s.yOff = 0),
            e.classList.add("sro-snap"),
            (e.style.transform = "translate3d(0,0,0)"),
            setTimeout(() => e.classList.remove("sro-snap"), 300),
            i());
        }),
        (document.onmouseup = () => {
          s.active && ((s.active = !1), i(), v(e));
        }),
        (document.onmousemove = (t) => {
          s.active &&
            (t.preventDefault(),
            (s.cX = t.clientX - s.iX),
            (s.cY = t.clientY - s.iY),
            (s.xOff = s.cX),
            (s.yOff = s.cY),
            (e.style.transform = `translate3d(${s.cX}px, ${s.cY}px, 0)`));
        }));
    }
    function v(t) {
      if (!t) return;
      const e = t.getBoundingClientRect(),
        o = window.innerWidth,
        r = window.innerHeight;
      let n = !1;
      (e.left < 0 && ((s.xOff -= e.left), (n = !0)),
        e.top < 0 && ((s.yOff -= e.top), (n = !0)),
        e.right > o && ((s.xOff -= e.right - o), (n = !0)),
        e.bottom > r && ((s.yOff -= e.bottom - r), (n = !0)),
        n &&
          (t.classList.add("sro-snap"),
          (t.style.transform = `translate3d(${s.xOff}px, ${s.yOff}px, 0)`),
          setTimeout(() => t.classList.remove("sro-snap"), 300),
          i()));
    }
    function y(t, e) {
      const s = t.toLowerCase();
      let r = !1;
      const i =
        new URL(t, window.location.origin).searchParams.get("codigo") ||
        new URL(t, window.location.origin).searchParams.get("objeto");
      (i &&
        i !== o.code &&
        (s.includes("acao=validar") || s.includes("acao=pesquisar")) &&
        ((o = {
          code: i,
          status: "AGUARDANDO...",
          mode: "loading",
          district: "--",
          date: "--/--/----",
          exc: "--",
          val: "--",
          lastEvt: "--",
          addr: {
            log: "--",
            num: "--",
            comp: "--",
            bair: "--",
            mun: "--",
            uf: "--",
            cep: "--",
          },
          serv: { ar: "N", mp: "N", dd: "N" },
          contact: { tel: "--", email: "--" },
          op: {
            list: "--",
            user: "--",
            postman: "--",
            st: "--",
            ts: "--",
            ord: "--",
            side: "--",
          },
        }),
        (r = !0)),
        s.includes("acao=validar")
          ? ((o.val = e.validacao || "--"),
            (o.exc = e.excecao || "--"),
            (o.lastEvt = e.ultimoEventoDescricao || "--"),
            e.validacao
              ? ("success" !== o.mode && "error" !== o.mode && (o.mode = "info"),
                "success" !== o.status && "error" !== o.status && (o.status = "PRONTO P/ INDUZIR"),
                (o.date = e.previsaoEntrega?.data || "--/--/----"))
              : ((o.mode = "error"), (o.status = "NÃO INDUZIDO")),
            "--" !== o.code && "error" !== o.mode && d("novo", "Leitura", "Objeto escaneado"),
            (r = !0))
          : s.includes("enderecocontroller.php") && e.endereco
            ? ((o.addr = {
                log: e.endereco.logradouro || "--",
                num: e.endereco.numeroLogradouro || "--",
                comp: e.endereco.complementoLogradouro || "--",
                bair: e.endereco.bairro || "--",
                mun: e.endereco.municipio || "--",
                uf: e.endereco.uf || "--",
                cep: e.endereco.cep || "--",
              }),
              e.servico &&
                (o.serv = {
                  ar: e.servico.ar,
                  mp: e.servico.mp,
                  dd: e.servico.dd,
                }),
              e.telefone && (o.contact.tel = `(${e.telefone.ddd}) ${e.telefone.numero}`),
              (o.contact.email = e.email || "--"),
              (r = !0))
            : s.includes("distritamentotrechocontroller.php") && Array.isArray(e) && e.length > 0
              ? ((o.district = `${e[0].rotuloDistrito} ${e[0].areaDistrito || ""}`.trim()),
                (o.op.ord = e[0].ordemPercorrida),
                (o.op.side = e[0].lado),
                (r = !0))
              : s.includes("acao=salvar") && e.idLancamento
                ? ((o.mode = "success"),
                  (o.status = "OBJETO INDUZIDO"),
                  (o.op.list = e.numeroLista),
                  (o.op.user = e.usuario),
                  (o.op.st = e.estacao),
                  (o.op.ts = e.carimbo),
                  e.dataPrevista && (o.date = e.dataPrevista),
                  o.pendingDist &&
                    ((o.district = o.pendingDist),
                    (o.initialDist = o.pendingDist),
                    (o.domDist = o.pendingDist)),
                  e.distrito && ((o.initialDist = e.distrito), (o.domDist = e.distrito)),
                  d("induzir", "Indução", "Objeto induzido"),
                  (r = !0))
                : s.includes("acao=excluir") &&
                  ((o.mode = "error"),
                  (o.status = "EXCLUÍDO"),
                  d("excluir", "Exclusão", "Objeto excluído"),
                  (r = !0)),
        r && f());
    }
    const w = window.fetch;
    window.fetch = async function (...t) {
      const e = t[0] ? t[0].toString() : "",
        s = e.toLowerCase();
      if (s.includes("acao=salvar") && t[1] && t[1].body)
        try {
          const e = JSON.parse(t[1].body);
          e.distrito && (o.pendingDist = e.distrito);
        } catch (t) {}
      s.includes("listar-impressoras-disponiveis") && O();
      const r = await w.apply(this, t);
      try {
        s.includes("controller.php") &&
          r
            .clone()
            .json()
            .then((t) => y(e, t))
            .catch(() => {});
      } catch (t) {}
      return r;
    };
    const I = XMLHttpRequest.prototype.open,
      E = XMLHttpRequest.prototype.send;
    function O() {
      let t = 0;
      const e = setInterval(() => {
        const o = document.getElementById("btnImprimirEtiquetaNao");
        if (o) {
          (o.click(), clearInterval(e));
          let t = 0;
          const s = setInterval(() => {
            const e = document.querySelector("#alerta.aberto .act a");
            (e && "OK" === e.innerText && (e.click(), clearInterval(s)),
              ++t >= 50 && clearInterval(s));
          }, 100);
        }
        ++t >= 50 && clearInterval(e);
      }, 100);
    }
    function D() {
      const t = document.getElementById("txtObjeto");
      if (!t) return setTimeout(D, 1e3);
      const e = t.closest(".campo") || t.parentElement;
      e &&
        (t.addEventListener("keydown", (o) => {
          "Enter" === o.key &&
            setTimeout(() => {
              const o = e.querySelector(".mensagem");
              o && o.innerText.trim().length > 0 && T(t);
            }, 300);
        }),
        new MutationObserver(() => {
          const o = e.querySelector(".mensagem");
          o && o.innerText.trim().length > 0 && t.value !== r && T(t);
        }).observe(e, { childList: !0, subtree: !0, characterData: !0 }));
    }
    function T(t) {
      document.activeElement !== document.getElementById("selDistrito") &&
        (t.click(), t.focus(), (r = t.value));
    }
    function L() {
      const t = document.getElementById("selDistrito");
      if (!t) return setTimeout(L, 1e3);
      const e = (t) => {
        ((o.domDist = t.target.value), f());
      };
      (t.addEventListener("change", e), t.addEventListener("input", e));
    }
    function S() {
      (h(), D(), L(), O(), f(), l(), p());
    }
    ((XMLHttpRequest.prototype.open = function (t, e) {
      return (
        (this._u = e),
        e && e.toLowerCase().includes("listar-impressoras-disponiveis") && O(),
        I.apply(this, arguments)
      );
    }),
      (XMLHttpRequest.prototype.send = function (t) {
        if (this._u && this._u.toLowerCase().includes("acao=salvar") && t)
          try {
            const e = JSON.parse(t);
            e.distrito && (o.pendingDist = e.distrito);
          } catch (t) {}
        return (
          this.addEventListener("load", function () {
            if (this._u && this._u.toLowerCase().includes("controller.php"))
              try {
                y(this._u, JSON.parse(this.responseText));
              } catch (t) {}
          }),
          E.apply(this, arguments)
        );
      }),
      "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", S) : S());
  } else if (t.includes("/loecsuspensa/")) {
    function $() {
      if (document.getElementById("sro-hud-styles")) return;
      const t = document.createElement("style");
      ((t.id = "sro-hud-styles"),
        (t.innerHTML =
          "#sro-hud-dashboard { box-sizing: border-box; width: 100%; max-width: 100%; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6; border-radius: 8px; margin: 0 auto 20px auto; padding: 15px; font-family: 'Segoe UI', system-ui, sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; animation: slideDown 0.4s ease-out; position: relative; } #sro-hud-dashboard * { box-sizing: border-box; } @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } } .hud-updated { animation: pulse-green 1s; } .hud-card { background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #00416B; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; min-width: 0; } .hud-card:hover { transform: translateY(-2px); } .hud-title { font-size: 0.75rem; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .hud-value { font-size: 1.5rem; font-weight: 800; color: #111827; } .hud-sub { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .border-danger { border-left-color: #dc2626; } .border-warning { border-left-color: #f59e0b; } .border-success { border-left-color: #10b981; } .border-info { border-left-color: #3b82f6; } .text-danger { color: #dc2626; } .hud-full { grid-column: span 4; display: flex; justify-content: space-between; background: #fff; padding: 10px; border-radius: 4px; border: 1px dashed #ccc; align-items: center; flex-wrap: wrap; } .metric-box { text-align: center; flex: 1; border-right: 1px solid #eee; min-width: 80px; } .metric-box:last-child { border-right: none; } .metric-lbl { font-size: 0.65rem; color: #555; text-transform: uppercase; letter-spacing: 0.5px; } .metric-val { font-weight: bold; font-size: 0.9rem; color: #333; } .hud-footer-time { position: absolute; bottom: 2px; right: 5px; font-size: 0.6rem; color: #aaa; font-style: italic; } @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }"),
        document.head.appendChild(t));
    }
    const A = (t) =>
      "number" == typeof t ? t : (t && parseInt(t.toString().replace(/<[^>]*>/g, ""), 10)) || 0;
    function B(t) {
      if (!Array.isArray(t) || 0 === t.length) return null;
      let e = t.length,
        o = 0,
        s = 0,
        r = 0,
        i = 0,
        n = 0,
        d = 0;
      return (
        t.forEach((t) => {
          ((o += A(t.qtde)),
            (s += A(t.qtdePontos)),
            (r += A(t.qtdeVencido)),
            (i += A(t.qtdeHoje)),
            (n += A(t.qtdeAVencer)),
            (d += A(t.qtdeAR)));
        }),
        {
          raw: {
            totalDistricts: e,
            totalObjects: o,
            totalPoints: s,
            totalExpired: r,
            totalToday: i,
            totalToExpire: n,
            totalAR: d,
          },
          computed: {
            deliveryDensity: o > 0 ? (o / s).toFixed(2) : 0,
            chaosIndex: o > 0 ? ((r / o) * 100).toFixed(1) : 0,
            operationalPressure: o > 0 ? (((i + n) / o) * 100).toFixed(1) : 0,
            arFactor: o > 0 ? ((d / o) * 100).toFixed(1) : 0,
            avgObjectsPerDistrict: (o / e).toFixed(1),
          },
        }
      );
    }
    function k(t) {
      const e = "sro-hud-dashboard",
        o = document.getElementById(e);
      if ((o && o.remove(), !t)) return;
      const s = document.querySelector(".botoes");
      if (!s) return;
      const r = t.raw,
        i = t.computed;
      let n = "border-success",
        d = "CONTROLADO";
      (i.chaosIndex > 20 && ((n = "border-warning"), (d = "ATENÇÃO")),
        i.chaosIndex > 50 && ((n = "border-danger"), (d = "CRÍTICO")));
      const a = document.createElement("div");
      ((a.id = e),
        a.classList.add("hud-updated"),
        (a.innerHTML = `<div class="hud-card border-info"><div class="hud-title">Carga Total Suspensa</div><div class="hud-value">${r.totalObjects} <span style="font-size:0.8rem; color:#888;">objs</span></div><div class="hud-sub">📦 ${r.totalDistricts} distritos afetados</div></div><div class="hud-card ${n}"><div class="hud-title">Backlog (Vencidos)</div><div class="hud-value text-danger">${r.totalExpired}</div><div class="hud-sub">🔥 ${i.chaosIndex}% da carga total</div></div><div class="hud-card border-warning"><div class="hud-title">Urgência (Hoje+Breve)</div><div class="hud-value">${r.totalToday + r.totalToExpire}</div><div class="hud-sub">⚠️ Pressão Operacional: ${i.operationalPressure}%</div></div><div class="hud-card border-info"><div class="hud-title">Complexidade (ARs)</div><div class="hud-value">${r.totalAR}</div><div class="hud-sub">📝 Fator de Retenção: ${i.arFactor}%</div></div><div class="hud-full"><div class="metric-box"><div class="metric-lbl">DENSIDADE DO CLUSTER</div><div class="metric-val">${i.deliveryDensity} objs/ponto</div></div><div class="metric-box"><div class="metric-lbl">TOTAL PONTOS FÍSICOS</div><div class="metric-val">📍 ${r.totalPoints}</div></div><div class="metric-box"><div class="metric-lbl">STATUS TÁTICO</div><div class="metric-val" style="font-weight:900;">${d}</div></div><div class="metric-box"><div class="metric-lbl">MÉDIA OBJS/DISTRITO</div><div class="metric-val">📊 ${i.avgObjectsPerDistrict}</div></div></div><div class="hud-footer-time">Atualizado às: ${new Date().toLocaleTimeString("pt-BR")}</div>`),
        s.parentNode.insertBefore(a, s));
    }
    function N(t, e) {
      if (t && t.includes("lancamentoController.php?acao=listar"))
        try {
          const t = "string" == typeof e ? JSON.parse(e) : e;
          if (Array.isArray(t)) {
            $();
            const e = B(t);
            setTimeout(() => k(e), 300);
          }
        } catch (t) {}
    }
    const R = window.fetch;
    window.fetch = async function (...t) {
      const e = await R.apply(this, t);
      try {
        const o = t[0] ? t[0].toString() : "";
        o.includes("lancamentoController.php?acao=listar") &&
          e
            .clone()
            .json()
            .then((t) => N(o, t))
            .catch(() => {});
      } catch (t) {}
      return e;
    };
    const C = XMLHttpRequest.prototype.open,
      z = XMLHttpRequest.prototype.send;
    ((XMLHttpRequest.prototype.open = function (t, e) {
      return ((this._u = e), C.apply(this, arguments));
    }),
      (XMLHttpRequest.prototype.send = function (t) {
        return (
          this.addEventListener("load", function () {
            if (this._u && this._u.includes("lancamentoController.php?acao=listar"))
              try {
                N(this._u, JSON.parse(this.responseText));
              } catch (t) {}
          }),
          z.apply(this, arguments)
        );
      }));
  }
})();
