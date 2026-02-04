!(function () {
  "use strict";
  const PATH = window.location.pathname.toLowerCase();
  if (PATH.includes("/lancamentoautomatico/")) {
    const ACTIONS = {
      "CT-INDUZIROBJETO": () => {
        if (document.activeElement) document.activeElement.blur();
        const a = document.getElementById("btnModalA");
        if (!a) return;
        a.click();
        let t = 0;
        const c = setInterval(() => {
          const i = document.getElementById("txtNumero");
          if (i) {
            clearInterval(c);
            setTimeout(() => {
              const v = i.value.trim();
              if (v !== "" && v !== "N/A") {
                if (document.activeElement) document.activeElement.blur();
                const b = document.getElementById("btnIncluirObjeto");
                if (b) {
                  b.click();
                  let w = 0;
                  const wc = setInterval(() => {
                    const mi = document.getElementById("txtObjeto");
                    if (mi && mi.value.trim() === "") {
                      clearInterval(wc);
                      mi.focus();
                    }
                    if (++w > 50) clearInterval(wc);
                  }, 100);
                }
              }
            }, 500);
          } else {
            t++;
            if (t >= 30) clearInterval(c);
          }
        }, 100);
      },
      "CT-EXCLUIROBJETO": () => {
        if (document.activeElement) document.activeElement.blur();
        const b = document.getElementById("btnModalE");
        if (b) b.click();
      },
    };
    (function () {
      const T = "#",
        O = 1e3;
      let b = "",
        c = !1,
        tm = null;
      window.addEventListener(
        "keydown",
        (e) => {
          if (e.key === T) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (c) {
              if (b.length > 0) {
                const cmd = b.toUpperCase();
                if (ACTIONS[cmd]) ACTIONS[cmd]();
              }
              c = !1;
              b = "";
              if (tm) clearTimeout(tm);
            } else {
              c = !0;
              b = "";
              tm = setTimeout(() => {
                c = !1;
                b = "";
              }, O);
            }
            return;
          }
          if (c) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (e.key.length === 1) {
              b += e.key;
              if (tm) clearTimeout(tm);
              tm = setTimeout(() => {
                c = !1;
                b = "";
              }, O);
            }
          }
        },
        !0,
      );
    })();
    const K = {
      POS: "correiostools_pos_v2",
      LAYOUT: "correiostools_layout_inv",
    };
    let S = {
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
    };
    let D = { active: !1, cX: 0, cY: 0, iX: 0, iY: 0, xOff: 0, yOff: 0 };
    let LIV = null;
    function FC(c) {
      return !c || c.length !== 13
        ? c
        : `${c.slice(0, 2)} ${c.slice(2, 5)} ${c.slice(5, 8)} ${c.slice(8, 11)} ${c.slice(11)}`;
    }
    function SP() {
      localStorage.setItem(K.POS, JSON.stringify({ x: D.xOff, y: D.yOff }));
    }
    function LP(el) {
      try {
        const p = JSON.parse(localStorage.getItem(K.POS));
        if (p && typeof p.x === "number") {
          D.xOff = p.x;
          D.yOff = p.y;
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        }
      } catch (e) {}
    }
    function GDH(ic) {
      let c = S.domDist && S.domDist !== "" ? S.domDist : S.district;
      c = c ? c.trim() : "";
      const st = ic
        ? "display:flex;align-items:center;justify-content:center"
        : "display:flex;align-items:center;justify-content:center;flex-wrap:wrap;flex:1;";
      if (
        S.initialDist &&
        S.initialDist !== "--" &&
        c &&
        c !== "--" &&
        c !== S.initialDist
      )
        return `<div style="${st}"><span class="${ic ? "sro-old" : "sro-old-p"}">${S.initialDist}</span><span class="${ic ? "sro-arrow" : "sro-arrow-p"}">➜</span><span class="${ic ? "sro-new" : "sro-new-p"}">${c}</span></div>`;
      return `<span class="${ic ? "sro-new" : "sro-new-p"}">${c || "--"}</span>`;
    }
    function APL() {
      const b = document.getElementById("div-map");
      if (!b) return;
      const p = b.parentNode;
      const i = localStorage.getItem(K.LAYOUT) === "true";
      if (i) p.prepend(b);
      else p.append(b);
    }
    function TGL() {
      const v = localStorage.getItem(K.LAYOUT) === "true";
      localStorage.setItem(K.LAYOUT, !v);
      APL();
    }
    function IJT() {
      if (document.getElementById("sro-table-wrapper")) return;
      const b = document.querySelector(".botoes");
      if (!b) return setTimeout(IJT, 500);
      const d = document.createElement("div");
      d.id = "sro-table-wrapper";
      d.innerHTML = `<div class="sro-table-header"><span style="color:#ffffff !important">DADOS OPERACIONAIS</span></div><table class="sro-full-table"><tr><th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">--</td><th>STATUS</th><td id="td-stt">--</td><th>VALIDAÇÃO</th><td id="td-val">--</td><th>DATA PREV.</th><td id="td-dat-prev">--</td></tr><tr id="row-exc" style="display:none"><th style="color:#c62828">EXCEÇÃO</th><td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">--</td></tr><tr><th>ENDEREÇO</th><td colspan="5" id="td-end-full">--</td><th>CEP</th><td id="td-cep" style="font-weight:bold">--</td></tr><tr><th>CONTATO</th><td colspan="7" id="td-con">--</td></tr><tr><th>DISTRITO</th><td id="td-dis" class="hl-dist">--</td><th>ORDEM</th><td id="td-ord">--</td><th>LADO</th><td id="td-lad">--</td><th>SERVIÇOS</th><td colspan="3" id="td-srv">--</td></tr><tr><th rowspan="2">INDUÇÃO</th><td colspan="7"><span style="color:#777">L:</span> <b id="td-lis">--</b> &nbsp;|&nbsp; <span style="color:#777">E:</span> <b id="td-est">--</b> &nbsp;|&nbsp; <span style="color:#777">U:</span> <b id="td-usu">--</b> &nbsp;|&nbsp; <span style="color:#777">DATA:</span> <b id="td-dat">--</b></td></tr><tr><td colspan="7" style="background:#fffde7;border-left:3px solid #fbc02d"><span style="color:#f57f17;font-weight:bold;text-transform:uppercase">CARTEIRO:</span> <b id="td-postman" style="font-size:12px;color:#333;margin-left:5px">--</b></td></tr></table>`;
      b.insertAdjacentElement("afterend", d);
    }
    function UPT() {
      const el = (id) => document.getElementById(id);
      if (!el("td-cod")) return;
      el("td-cod").innerText = S.code;
      const v = S.val;
      el("td-val").innerHTML = v
        ? `<span class="${v.includes("V") ? "hl-val" : "hl-err"}">${v}</span>`
        : "--";
      el("td-stt").innerText = S.lastEvt;
      el("td-dat-prev").innerText = S.date;
      if (S.exc && S.exc !== "--") {
        el("td-exc").innerText = S.exc;
        document.getElementById("row-exc").style.display = "table-row";
      } else document.getElementById("row-exc").style.display = "none";
      el("td-end-full").innerText =
        `${S.addr.log}, ${S.addr.num} ${S.addr.comp ? "- " + S.addr.comp : ""} - ${S.addr.bair}, ${S.addr.mun}/${S.addr.uf}`;
      el("td-cep").innerText = S.addr.cep;
      el("td-con").innerHTML =
        `TEL: <b>${S.contact.tel}</b> ${S.contact.email !== "--" ? " | EMAIL: " + S.contact.email : ""}`;
      el("td-dis").innerHTML = GDH(!1);
      el("td-ord").innerText = S.op.ord;
      el("td-lad").innerText = S.op.side;
      const sh = (k, l) =>
        `<span class="${S.serv[k] === "S" ? "hl-serv" : "hl-serv-off"}">${l}</span>`;
      el("td-srv").innerHTML = sh("ar", "AR") + sh("mp", "MP") + sh("dd", "DD");
      el("td-lis").innerText = S.op.list;
      el("td-est").innerText = S.op.st;
      el("td-usu").innerText = S.op.user;
      el("td-postman").innerText = S.op.postman;
      let ts = S.op.ts;
      el("td-dat").innerText =
        ts && ts.length >= 18
          ? `${ts.substring(8, 10)}/${ts.substring(10, 12)}/${ts.substring(12, 16)} às ${ts.substring(16, 18)}:${ts.substring(18, 20)}`
          : "--";
    }
    function IJS() {
      if (document.getElementById("sro-styles")) return;
      const s = document.createElement("style");
      s.id = "sro-styles";
      s.innerHTML = `#sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); will-change: transform; font-family: 'Segoe UI', sans-serif; } .sro-card { width: 360px; background: #fff; border-radius: 6px; overflow: hidden; border-left: 8px solid #999; display: block; } .sro-header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border-bottom: 1px solid #eee; cursor: grab; user-select: none; } .sro-status-block { display: flex; align-items: center; gap: 8px; flex: 1; } .sro-status-text { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; color: #444; } .sro-btn-group { display: flex; align-items: center; gap: 8px; } .sro-btn-panel { cursor: pointer; font-size: 1.2rem; color: #555; transition: all 0.2s; line-height: 1; font-weight:bold; padding: 2px 5px; border-radius: 4px; } .sro-btn-panel:hover { color: #00416B; background: #f0f0f0; } .sro-btn-disabled { opacity: 0.3; pointer-events: none; } .sro-body { padding: 12px; text-align: center; background: #fff; } .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: #00416B; margin: 6px 0; } .sro-new { color: #00416B; font-size: 3rem; font-weight: 900; } .sro-old { font-size: 2rem; opacity: 0.35; font-weight: 700; color: #000; margin-right: 5px; } .sro-arrow { font-size: 2rem; margin: 0 10px; color: #444; font-weight: 400; } .mode-loading { border-left-color: #7f8c8d; } .mode-success { border-left-color: #009688; } .mode-success .sro-header { background: #e0f2f1; } .mode-success .sro-status-text { color: #00695c; } .mode-error { border-left-color: #d32f2f; } .mode-error .sro-header { background: #ffebee; } .mode-error .sro-status-text { color: #c62828; } .mode-info { border-left-color: #1976d2; } .mode-info .sro-header { background: #e3f2fd; } .mode-info .sro-status-text { color: #0d47a1; } #sro-table-wrapper { margin-top: 25px; font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #ccc; background: #fff; width: 100%; box-sizing: border-box; clear: both; pointer-events: auto; } .sro-table-header { background: #00416B; color: #ffffff !important; padding: 8px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; display: flex; justify-content: space-between; border-bottom: 3px solid #FFE600; } .sro-full-table { width: 100%; border-collapse: collapse; font-size: 11px; } .sro-full-table th { background: #f0f0f0; color: #333; text-align: left; padding: 5px 8px; border: 1px solid #ddd; font-weight: 700; white-space: nowrap; width: 1%; } .sro-full-table td { padding: 5px 8px; border: 1px solid #ddd; color: #000; word-break: break-word; } .hl-val { color: #2e7d32; font-weight: 800; background: #e8f5e9; padding: 1px 4px; border-radius: 3px; } .hl-err { color: #c62828; font-weight: 800; background: #ffebee; padding: 1px 4px; border-radius: 3px; } .hl-dist { font-size: 15px; font-weight: 800; color: #00416B; } .hl-serv { background: #fff8e1; color: #ff8f00; padding: 0 3px; border-radius: 2px; font-weight: bold; border: 1px solid #ffecb3; margin-right: 3px; } .hl-serv-off { opacity: 0.2; margin-right: 3px; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`;
      document.head.appendChild(s);
    }
    function STD(h, c) {
      h.onmousedown = (e) => {
        if (e.target.closest(".sro-btn-group")) return;
        D.active = !0;
        D.iX = e.clientX - D.xOff;
        D.iY = e.clientY - D.yOff;
      };
      h.ondblclick = (e) => {
        if (e.target.closest(".sro-btn-group")) return;
        D.xOff = 0;
        D.yOff = 0;
        c.classList.add("sro-snap");
        c.style.transform = "translate3d(0,0,0)";
        setTimeout(() => c.classList.remove("sro-snap"), 300);
        SP();
      };
      document.onmouseup = () => {
        if (D.active) {
          D.active = !1;
          SP();
          SNP(c);
        }
      };
      document.onmousemove = (e) => {
        if (!D.active) return;
        e.preventDefault();
        D.cX = e.clientX - D.iX;
        D.cY = e.clientY - D.iY;
        D.xOff = D.cX;
        D.yOff = D.cY;
        c.style.transform = `translate3d(${D.cX}px, ${D.cY}px, 0)`;
      };
    }
    function SNP(c) {
      if (!c) return;
      const r = c.getBoundingClientRect();
      const w = window.innerWidth;
      const h = window.innerHeight;
      let s = !1;
      if (r.left < 0) {
        D.xOff -= r.left;
        s = !0;
      }
      if (r.top < 0) {
        D.yOff -= r.top;
        s = !0;
      }
      if (r.right > w) {
        D.xOff -= r.right - w;
        s = !0;
      }
      if (r.bottom > h) {
        D.yOff -= r.bottom - h;
        s = !0;
      }
      if (s) {
        c.classList.add("sro-snap");
        c.style.transform = `translate3d(${D.xOff}px, ${D.yOff}px, 0)`;
        setTimeout(() => c.classList.remove("sro-snap"), 300);
        SP();
      }
    }
    function RDP() {
      IJS();
      let c = document.getElementById("sro-container");
      if (!c) {
        c = document.createElement("div");
        c.id = "sro-container";
        c.innerHTML = `<div id="sro-card" class="sro-card mode-loading"><div id="sro-header" class="sro-header" title="Segure para mover"><div class="sro-status-block"><span id="sro-icon" class="sro-icon">⏳</span><span id="sro-status" class="sro-status-text">AGUARDANDO...</span></div><div class="sro-btn-group"><span id="btn-layout-toggle" class="sro-btn-panel" title="Inverter Layout">⇄</span></div></div><div class="sro-body"><div id="sro-distrito" class="sro-distrito">--</div><div style="font-size:12px;color:#666;margin-top:4px">PREVISÃO: <strong id="sro-previsao" style="color:#333">--/--/----</strong></div></div></div>`;
        document.body.appendChild(c);
        LP(c);
        STD(document.getElementById("sro-header"), c);
        document.getElementById("btn-layout-toggle").onclick = TGL;
      }
      const cd = document.getElementById("sro-card");
      if (cd) {
        let i = "⏳";
        if (S.mode === "success") i = "✅";
        if (S.mode === "error") i = "⛔";
        if (S.mode === "info") i = "⚠️";
        cd.className = `sro-card visible mode-${S.mode}`;
        document.getElementById("sro-status").innerText = S.status;
        document.getElementById("sro-icon").innerText = i;
        document.getElementById("sro-distrito").innerHTML = GDH(!0);
        document.getElementById("sro-previsao").innerText =
          S.date || "--/--/----";
      }
      UPT();
    }
    function HRE(u, d) {
      const lc = u.toLowerCase();
      let up = !1;
      const cd =
        new URL(u, window.location.origin).searchParams.get("codigo") ||
        new URL(u, window.location.origin).searchParams.get("objeto");
      if (
        cd &&
        cd !== S.code &&
        (lc.includes("acao=validar") || lc.includes("acao=pesquisar"))
      ) {
        S = {
          code: cd,
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
        };
        up = !0;
      }
      if (lc.includes("acao=validar")) {
        S.val = d.validacao || "--";
        S.exc = d.excecao || "--";
        S.lastEvt = d.ultimoEventoDescricao || "--";
        if (d.validacao) {
          S.mode = "info";
          S.status = "PRONTO P/ INDUZIR";
          S.date = d.previsaoEntrega?.data || "--/--/----";
        } else {
          S.mode = "error";
          S.status = "NÃO INDUZIDO";
        }
        up = !0;
      } else if (lc.includes("enderecocontroller.php") && d.endereco) {
        S.addr = {
          log: d.endereco.logradouro || "--",
          num: d.endereco.numeroLogradouro || "--",
          comp: d.endereco.complementoLogradouro || "--",
          bair: d.endereco.bairro || "--",
          mun: d.endereco.municipio || "--",
          uf: d.endereco.uf || "--",
          cep: d.endereco.cep || "--",
        };
        if (d.servico)
          S.serv = { ar: d.servico.ar, mp: d.servico.mp, dd: d.servico.dd };
        if (d.telefone)
          S.contact.tel = `(${d.telefone.ddd}) ${d.telefone.numero}`;
        S.contact.email = d.email || "--";
        up = !0;
      } else if (
        lc.includes("distritamentotrechocontroller.php") &&
        Array.isArray(d) &&
        d.length > 0
      ) {
        S.district = `${d[0].rotuloDistrito} ${d[0].areaDistrito || ""}`.trim();
        S.op.ord = d[0].ordemPercorrida;
        S.op.side = d[0].lado;
        up = !0;
      } else if (lc.includes("acao=salvar") && d.idLancamento) {
        S.mode = "success";
        S.status = "OBJETO INDUZIDO";
        S.op.list = d.numeroLista;
        S.op.user = d.usuario;
        S.op.st = d.estacao;
        S.op.ts = d.carimbo;
        if (d.dataPrevista) S.date = d.dataPrevista;
        if (S.pendingDist) {
          S.district = S.pendingDist;
          S.initialDist = S.pendingDist;
          S.domDist = S.pendingDist;
        }
        if (d.distrito) {
          S.initialDist = d.distrito;
          S.domDist = d.distrito;
        }
        up = !0;
      } else if (lc.includes("acao=excluir")) {
        S.mode = "error";
        S.status = "EXCLUÍDO";
        up = !0;
      }
      if (up) RDP();
    }
    const oF = window.fetch;
    window.fetch = async function (...a) {
      const u = a[0] ? a[0].toString() : "";
      const l = u.toLowerCase();
      if (l.includes("acao=salvar") && a[1] && a[1].body) {
        try {
          const b = JSON.parse(a[1].body);
          if (b.distrito) S.pendingDist = b.distrito;
        } catch (e) {}
      }
      if (l.includes("listar-impressoras-disponiveis")) ATC();
      const r = await oF.apply(this, a);
      try {
        if (l.includes("controller.php"))
          r.clone()
            .json()
            .then((j) => HRE(u, j))
            .catch(() => {});
      } catch (e) {}
      return r;
    };
    const oO = XMLHttpRequest.prototype.open;
    const oS = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u) {
      this._u = u;
      if (u && u.toLowerCase().includes("listar-impressoras-disponiveis"))
        ATC();
      return oO.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (b) {
      if (this._u && this._u.toLowerCase().includes("acao=salvar") && b) {
        try {
          const j = JSON.parse(b);
          if (j.distrito) S.pendingDist = j.distrito;
        } catch (e) {}
      }
      this.addEventListener("load", function () {
        if (this._u && this._u.toLowerCase().includes("controller.php")) {
          try {
            HRE(this._u, JSON.parse(this.responseText));
          } catch (e) {}
        }
      });
      return oS.apply(this, arguments);
    };
    function ATC() {
      let t = 0;
      const i = setInterval(() => {
        const b = document.getElementById("btnImprimirEtiquetaNao");
        if (b) {
          b.click();
          clearInterval(i);
          let t2 = 0;
          const i2 = setInterval(() => {
            const ok = document.querySelector("#alerta.aberto .act a");
            if (ok && ok.innerText === "OK") {
              ok.click();
              clearInterval(i2);
            }
            if (++t2 >= 50) clearInterval(i2);
          }, 100);
        }
        if (++t >= 50) clearInterval(i);
      }, 100);
    }
    function WTI() {
      const inp = document.getElementById("txtObjeto");
      if (!inp) return setTimeout(WTI, 1000);
      const p = inp.closest(".campo") || inp.parentElement;
      if (p) {
        inp.addEventListener("keydown", (e) => {
          if (e.key === "Enter")
            setTimeout(() => {
              const m = p.querySelector(".mensagem");
              if (m && m.innerText.trim().length > 0) RFC(inp);
            }, 300);
        });
        new MutationObserver(() => {
          const m = p.querySelector(".mensagem");
          if (m && m.innerText.trim().length > 0 && inp.value !== LIV) RFC(inp);
        }).observe(p, { childList: true, subtree: true, characterData: true });
      }
    }
    function RFC(i) {
      if (document.activeElement !== document.getElementById("selDistrito")) {
        i.click();
        i.focus();
        LIV = i.value;
        S.code = "--";
        S.district = "--";
        S.domDist = null;
        S.status = "AGUARDANDO...";
        S.mode = "loading";
        RDP();
      }
    }
    function WSE() {
      const s = document.getElementById("selDistrito");
      if (!s) return setTimeout(WSE, 1000);
      const f = (e) => {
        S.domDist = e.target.value;
        RDP();
      };
      s.addEventListener("change", f);
      s.addEventListener("input", f);
    }
    function IAP() {
      IJT();
      WTI();
      WSE();
      ATC();
      RDP();
      APL();
    }
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", IAP);
    else IAP();
  } else if (PATH.includes("/loecsuspensa/")) {
    function IHS() {
      if (document.getElementById("sro-hud-styles")) return;
      const s = document.createElement("style");
      s.id = "sro-hud-styles";
      s.innerHTML = `#sro-hud-dashboard { box-sizing: border-box; width: 100%; max-width: 100%; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6; border-radius: 8px; margin: 0 auto 20px auto; padding: 15px; font-family: 'Segoe UI', system-ui, sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; animation: slideDown 0.4s ease-out; position: relative; } #sro-hud-dashboard * { box-sizing: border-box; } @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } } .hud-updated { animation: pulse-green 1s; } .hud-card { background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #00416B; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; min-width: 0; } .hud-card:hover { transform: translateY(-2px); } .hud-title { font-size: 0.75rem; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .hud-value { font-size: 1.5rem; font-weight: 800; color: #111827; } .hud-sub { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .border-danger { border-left-color: #dc2626; } .border-warning { border-left-color: #f59e0b; } .border-success { border-left-color: #10b981; } .border-info { border-left-color: #3b82f6; } .text-danger { color: #dc2626; } .hud-full { grid-column: span 4; display: flex; justify-content: space-between; background: #fff; padding: 10px; border-radius: 4px; border: 1px dashed #ccc; align-items: center; flex-wrap: wrap; } .metric-box { text-align: center; flex: 1; border-right: 1px solid #eee; min-width: 80px; } .metric-box:last-child { border-right: none; } .metric-lbl { font-size: 0.65rem; color: #555; text-transform: uppercase; letter-spacing: 0.5px; } .metric-val { font-weight: bold; font-size: 0.9rem; color: #333; } .hud-footer-time { position: absolute; bottom: 2px; right: 5px; font-size: 0.6rem; color: #aaa; font-style: italic; } @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`;
      document.head.appendChild(s);
    }
    const PN = (v) =>
      typeof v === "number"
        ? v
        : v
          ? parseInt(v.toString().replace(/<[^>]*>/g, ""), 10) || 0
          : 0;
    function CL(d) {
      if (!Array.isArray(d) || d.length === 0) return null;
      let tD = d.length,
        tO = 0,
        tP = 0,
        tE = 0,
        tT = 0,
        tF = 0,
        tA = 0;
      d.forEach((i) => {
        tO += PN(i.qtde);
        tP += PN(i.qtdePontos);
        tE += PN(i.qtdeVencido);
        tT += PN(i.qtdeHoje);
        tF += PN(i.qtdeAVencer);
        tA += PN(i.qtdeAR);
      });
      return {
        r: { tD, tO, tP, tE, tT, tF, tA },
        c: {
          dd: tO > 0 ? (tO / tP).toFixed(2) : 0,
          ci: tO > 0 ? ((tE / tO) * 100).toFixed(1) : 0,
          op: tO > 0 ? (((tT + tF) / tO) * 100).toFixed(1) : 0,
          af: tO > 0 ? ((tA / tO) * 100).toFixed(1) : 0,
          ad: (tO / tD).toFixed(1),
        },
      };
    }
    function DHD(m) {
      const id = "sro-hud-dashboard";
      const od = document.getElementById(id);
      if (od) od.remove();
      if (!m) return;
      const an = document.querySelector(".botoes");
      if (!an) return;
      const r = m.r,
        c = m.c;
      let cl = "border-success",
        st = "CONTROLADO";
      if (c.ci > 20) {
        cl = "border-warning";
        st = "ATENÇÃO";
      }
      if (c.ci > 50) {
        cl = "border-danger";
        st = "CRÍTICO";
      }
      const h = document.createElement("div");
      h.id = id;
      h.classList.add("hud-updated");
      h.innerHTML = `<div class="hud-card border-info"><div class="hud-title">Carga Total Suspensa</div><div class="hud-value">${r.tO} <span style="font-size:0.8rem; color:#888;">objs</span></div><div class="hud-sub">📦 ${r.tD} distritos afetados</div></div><div class="hud-card ${cl}"><div class="hud-title">Backlog (Vencidos)</div><div class="hud-value text-danger">${r.tE}</div><div class="hud-sub">🔥 ${c.ci}% da carga total</div></div><div class="hud-card border-warning"><div class="hud-title">Urgência (Hoje+Breve)</div><div class="hud-value">${r.tT + r.tF}</div><div class="hud-sub">⚠️ Pressão Operacional: ${c.op}%</div></div><div class="hud-card border-info"><div class="hud-title">Complexidade (ARs)</div><div class="hud-value">${r.tA}</div><div class="hud-sub">📝 Fator de Retenção: ${c.af}%</div></div><div class="hud-full"><div class="metric-box"><div class="metric-lbl">DENSIDADE DO CLUSTER</div><div class="metric-val">${c.dd} objs/ponto</div></div><div class="metric-box"><div class="metric-lbl">TOTAL PONTOS FÍSICOS</div><div class="metric-val">📍 ${r.tP}</div></div><div class="metric-box"><div class="metric-lbl">STATUS TÁTICO</div><div class="metric-val" style="font-weight:900;">${st}</div></div><div class="metric-box"><div class="metric-lbl">MÉDIA OBJS/DISTRITO</div><div class="metric-val">📊 ${c.ad}</div></div></div><div class="hud-footer-time">Atualizado às: ${new Date().toLocaleTimeString("pt-BR")}</div>`;
      an.parentNode.insertBefore(h, an);
    }
    function PRL(u, t) {
      if (u && u.includes("lancamentoController.php?acao=listar"))
        try {
          const j = typeof t === "string" ? JSON.parse(t) : t;
          if (Array.isArray(j)) {
            IHS();
            const m = CL(j);
            setTimeout(() => DHD(m), 300);
          }
        } catch (e) {}
    }
    const oF = window.fetch;
    window.fetch = async function (...a) {
      const r = await oF.apply(this, a);
      try {
        const u = a[0] ? a[0].toString() : "";
        if (u.includes("lancamentoController.php?acao=listar"))
          r.clone()
            .json()
            .then((j) => PRL(u, j))
            .catch(() => {});
      } catch (e) {}
      return r;
    };
    const oO = XMLHttpRequest.prototype.open;
    const oS = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u) {
      this._u = u;
      return oO.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function (b) {
      this.addEventListener("load", function () {
        if (this._u && this._u.includes("lancamentoController.php?acao=listar"))
          try {
            PRL(this._u, JSON.parse(this.responseText));
          } catch (e) {}
      });
      return oS.apply(this, arguments);
    };
  }
})();
