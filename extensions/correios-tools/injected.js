! function() {
    "use strict";
    const e = window.location.pathname.toLowerCase();
    e.includes("/lancamentoautomatico/") ? function() {
        const e = "AGUARDANDO...",
            t = "PREVISÃO",
            o = "--/--/----",
            n = "--",
            r = "correiostools-card-position";
        let s = {
                code: n,
                status: e,
                mode: "loading",
                district: n,
                domDist: null,
                initialDist: null,
                pendingDist: null,
                date: o,
                exc: n,
                val: n,
                lastEvt: n,
                addr: {
                    log: n,
                    num: n,
                    comp: n,
                    bair: n,
                    mun: n,
                    uf: n,
                    cep: n
                },
                serv: {
                    ar: "N",
                    mp: "N",
                    dd: "N"
                },
                contact: {
                    tel: n,
                    email: n
                },
                op: {
                    list: n,
                    user: n,
                    postman: n,
                    st: n,
                    ts: n,
                    ord: n,
                    side: n
                }
            },
            d = {
                active: !1,
                cX: 0,
                cY: 0,
                iX: 0,
                iY: 0,
                xOff: 0,
                yOff: 0
            },
            a = null;

        function l() {
            let e = 0;
            const t = setInterval(() => {
                const o = document.getElementById("btnImprimirEtiquetaNao");
                o && (o.click(), clearInterval(t), c()), ++e >= 100 && clearInterval(t)
            }, 50)
        }

        function c() {
            let e = 0;
            const t = setInterval(() => {
                const o = document.querySelector("#alerta.aberto .act a");
                o && "OK" === o.innerText && (o.click(), clearInterval(t)), ++e >= 100 && clearInterval(t)
            }, 50)
        }

        function i(e) {
            document.activeElement !== document.getElementById("selDistrito") && (e.click(), e.focus(), a = e.value)
        }

        function p() {
            const e = document.getElementById("txtObjeto");
            if (!e) return setTimeout(p, 1e3);
            const t = e.closest(".campo") || e.parentElement;
            t && (e.addEventListener("keydown", o => {
                "Enter" === o.key && setTimeout(() => {
                    const o = t.querySelector(".mensagem");
                    if (o) {
                        const t = o.innerText || "";
                        (t.includes("Formato de objeto postal") || t.includes("Preencha este campo")) && i(e)
                    }
                }, 300)
            }), new MutationObserver(() => {
                const o = t.querySelector(".mensagem");
                if (o) {
                    const t = o.innerText || "";
                    (t.includes("Formato de objeto postal") || t.includes("Preencha este campo")) && e.value !== a && i(e)
                }
            }).observe(t, {
                childList: !0,
                subtree: !0,
                characterData: !0
            }))
        }

        function u() {
            const e = document.getElementById("selDistrito");
            if (!e) return setTimeout(u, 1e3);
            const t = e => {
                s.domDist = e.target.value, g()
            };
            e.addEventListener("change", t), e.addEventListener("input", t)
        }

        function f() {
            const e = document.getElementById("div-map");
            if (!e || "none" === e.style.display) return;
            const t = e.parentNode,
                o = t.firstElementChild,
                n = t.lastElementChild;
            n === e ? (t.insertBefore(e, o), t.appendChild(o)) : (t.insertBefore(n, e), t.appendChild(e))
        }

        function m(e) {
            let t = s.domDist && "" !== s.domDist ? s.domDist : s.district;
            t && (t = t.trim());
            const o = e ? "sro-old-p" : "sro-old",
                r = e ? "sro-arrow-p" : "sro-arrow",
                d = e ? "sro-new-p" : "sro-new",
                a = e ? "display:flex;align-items:center;justify-content:center;flex-wrap:wrap;flex:1;" : "display:flex;align-items:center;justify-content:center";
            return s.initialDist && s.initialDist !== n ? t && t !== n && t !== s.initialDist ? `<div style="${a}"><span class="${o}">${s.initialDist}</span><span class="${r}">➜</span><span class="${d}">${t}</span></div>` : `<span class="${d}">${s.initialDist}</span>` : `<span class="${d}">${t||n}</span>`
        }

        function h(e) {
            const t = document.getElementById("div-map");
            if (!t) return;
            let o = document.getElementById("sro-ghost-storage");
            o || (o = document.createElement("div"), o.id = "sro-ghost-storage", o.style.display = "none", document.body.appendChild(o));
            const n = document.getElementById("painel"),
                r = t.previousElementSibling || t.nextElementSibling,
                a = document.getElementById("btn-layout-toggle");
            if (e) {
                n && o.appendChild(n), t.style.display = "none", a && (a.style.opacity = "0.3", a.style.pointerEvents = "none", a.title = "Indisponível enquanto oculto");
                if (r) {
                    r.dataset.origClass = r.className, r.classList.remove("col-9", "col-md-9", "col-lg-9"), r.classList.add("col-12"), r.style.maxWidth = "100%", r.style.flex = "0 0 100%"
                }
            } else {
                if (r && r.dataset.origClass) {
                    r.className = r.dataset.origClass, r.style.maxWidth = "", r.style.flex = ""
                }
                t.style.display = "", n && t.appendChild(n), a && (a.style.opacity = "1", a.style.pointerEvents = "auto", a.title = "Inverter Layout")
            }
        }

        function y() {
            if (document.getElementById("sro-styles")) return;
            const e = document.createElement("style");
            e.id = "sro-styles", e.innerHTML = "\n        #sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); will-change: transform; pointer-events: none; }\n        .sro-snap { transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }\n        .sro-card { width: 360px; background: #fff; border-radius: 6px; font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; opacity: 0; transition: opacity 0.2s; border-left: 8px solid #999; display: none; pointer-events: auto; }\n        .sro-card.visible { display: block; opacity: 1; }\n        .sro-header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border-bottom: 1px solid #eee; cursor: grab; user-select: none; }\n        .sro-status-text { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; color: #444; }\n        .sro-btn-panel { cursor: pointer; font-size: 1.4rem; color: #555; transition: color 0.2s; margin-left: 10px; line-height: 1; font-weight:bold; }\n        .sro-btn-panel:hover { color: #00416B; }\n        .sro-body { padding: 12px; text-align: center; background: #fff; }\n        .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: #00416B; margin: 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; justify-content: center; align-items: center; min-height: 50px; }\n        .sro-old { font-size: 2rem; opacity: 0.35; font-weight: 700; color: #000; margin-right: 5px; }\n        .sro-arrow { font-size: 2rem; margin: 0 10px; color: #444; font-weight: 400; }\n        .sro-new { color: #00416B; font-size: 3rem; font-weight: 900; }\n        .mode-loading { border-left-color: #7f8c8d; }\n        .mode-success { border-left-color: #009688; } .mode-success .sro-header { background: #e0f2f1; } .mode-success .sro-status-text { color: #00695c; }\n        .mode-error { border-left-color: #d32f2f; } .mode-error .sro-header { background: #ffebee; } .mode-error .sro-status-text { color: #c62828; }\n        .mode-info { border-left-color: #1976d2; } .mode-info .sro-header { background: #e3f2fd; } .mode-info .sro-status-text { color: #0d47a1; }\n        #sro-table-wrapper { margin-top: 25px; font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #ccc; background: #fff; width: 100%; box-sizing: border-box; clear: both; pointer-events: auto; }\n        .sro-table-header { background: #00416B; color: #ffffff !important; padding: 8px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; display: flex; justify-content: space-between; border-bottom: 3px solid #FFE600; }\n        .sro-full-table { width: 100%; border-collapse: collapse; font-size: 11px; }\n        .sro-full-table th { background: #f0f0f0; color: #333; text-align: left; padding: 5px 8px; border: 1px solid #ddd; font-weight: 700; white-space: nowrap; width: 1%; }\n        .sro-full-table td { padding: 5px 8px; border: 1px solid #ddd; color: #000; word-break: break-word; }\n        .hl-val { color: #2e7d32; font-weight: 800; background: #e8f5e9; padding: 1px 4px; border-radius: 3px; }\n        .hl-err { color: #c62828; font-weight: 800; background: #ffebee; padding: 1px 4px; border-radius: 3px; }\n        .hl-dist { font-size: 15px; font-weight: 800; color: #00416B; }\n        .hl-serv { background: #fff8e1; color: #ff8f00; padding: 0 3px; border-radius: 2px; font-weight: bold; border: 1px solid #ffecb3; margin-right: 3px; }\n        .hl-serv-off { opacity: 0.2; margin-right: 3px; }\n        #sro-restore-icon { position: fixed; bottom: 15px; right: 15px; z-index: 999998; width: 40px; height: 40px; background: #00416B; color: #fff; border-radius: 50%; display: none; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid #FFE600; transition: transform 0.2s; }\n        #sro-restore-icon:hover { transform: scale(1.1); }\n      ", document.head.appendChild(e)
        }

        function v() {
            y();
            const a = document.createElement("div");
            a.id = "sro-container", a.innerHTML = `\n        <div id="sro-card" class="sro-card mode-loading">\n          <div id="sro-header" class="sro-header" title="Clique duas vezes para resetar a posição">\n            <span id="sro-status" class="sro-status-text">${e}</span>\n            <div style="display:flex;align-items:center">\n              <span id="sro-icon" class="sro-icon">⏳</span>\n              <span id="btn-layout-toggle" class="sro-btn-panel" title="Inverter Layout">⇄</span>\n              <span id="btn-hide-panel" class="sro-btn-panel" title="Ocultar Painel Original" style="font-size:1.8rem;margin-top:-5px;">-</span>\n            </div>\n          </div>\n          <div class="sro-body">\n            <div id="sro-distrito" class="sro-distrito">${n}</div>\n            <div style="font-size:12px;color:#666;margin-top:4px">${t}: <strong id="sro-previsao" style="color:#333">${o}</strong></div>\n          </div>\n        </div>`, document.body.appendChild(a);
            const r = document.getElementById("btn-hide-panel");
            r.addEventListener("click", () => {
                const e = document.getElementById("div-map");
                if (e) {
                    const t = "none" === e.style.display;
                    h(!t), r.innerText = t ? "-" : "+", r.title = t ? "Ocultar Painel Original" : "Restaurar Painel Original"
                }
            }), document.getElementById("btn-layout-toggle").addEventListener("click", f);
            try {
                const e = JSON.parse(localStorage.getItem("correiostools-card-position"));
                e && "number" == typeof e.x && "number" == typeof e.y && (d.cX = e.x, d.cY = e.y, d.xOff = e.x, d.yOff = e.y, a.style.transform = `translate3d(${e.x}px, ${e.y}px, 0)`)
            } catch {}
            const l = document.getElementById("sro-header");
            l.addEventListener("mousedown", w), l.addEventListener("dblclick", b), document.addEventListener("mouseup", x), document.addEventListener("mousemove", E), window.addEventListener("resize", T), k(), p(), u(), g(), l()
        }

        function k() {
            if (document.getElementById("sro-table-wrapper")) return;
            const e = document.querySelector(".botoes");
            if (!e) return setTimeout(k, 500);
            const t = document.createElement("div");
            t.id = "sro-table-wrapper", t.innerHTML = `\n        <div class="sro-table-header"><span style="color:#ffffff !important">DADOS OPERACIONAIS</span><span style="opacity:0.7;color:#fff">SRO EXT</span></div>\n        <table class="sro-full-table">\n          <tr><th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">${n}</td><th>STATUS</th><td id="td-stt">${n}</td><th>VALIDAÇÃO</th><td id="td-val">${n}</td><th>DATA PREV.</th><td id="td-dat-prev">${n}</td></tr>\n          <tr id="row-exc" style="display:none"><th style="color:#c62828">EXCEÇÃO</th><td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">${n}</td></tr>\n          <tr><th>ENDEREÇO</th><td colspan="5" id="td-end-full">${n}</td><th>CEP</th><td id="td-cep" style="font-weight:bold">${n}</td></tr>\n          <tr><th>CONTATO</th><td colspan="7" id="td-con">${n}</td></tr>\n          <tr><th>DISTRITO</th><td id="td-dis" class="hl-dist">${n}</td><th>ORDEM</th><td id="td-ord">${n}</td><th>LADO</th><td id="td-lad">${n}</td><th>SERVIÇOS</th><td colspan="3" id="td-srv">${n}</td></tr>\n          <tr><th rowspan="2">INDUÇÃO</th><td colspan="7"><span style="color:#777">L:</span> <b id="td-lis">${n}</b> &nbsp;|&nbsp; <span style="color:#777">E:</span> <b id="td-est">${n}</b> &nbsp;|&nbsp; <span style="color:#777">U:</span> <b id="td-usu">${n}</b> &nbsp;|&nbsp; <span style="color:#777">DATA:</span> <b id="td-dat">${n}</b></td></tr>\n          <tr><td colspan="7" style="background:#fffde7;border-left:3px solid #fbc02d"><span style="color:#f57f17;font-weight:bold;text-transform:uppercase">CARTEIRO:</span> <b id="td-postman" style="font-size:12px;color:#333;margin-left:5px">${n}</b></td></tr>\n        </table>`, e.insertAdjacentElement("afterend", t)
        }

        function L() {
            localStorage.setItem(r, JSON.stringify({
                x: d.cX,
                y: d.cY
            }))
        }

        function b() {
            const e = document.getElementById("sro-container");
            e && (d.xOff = 0, d.yOff = 0, d.cX = 0, d.cY = 0, e.classList.add("sro-snap"), e.style.transform = "translate3d(0px, 0px, 0)", setTimeout(() => e.classList.remove("sro-snap"), 300), L())
        }

        function w(e) {
            d.iX = e.clientX - d.xOff, d.iY = e.clientY - d.yOff, d.active = !0
        }

        function x() {
            d.iX = d.cX, d.iY = d.cY, d.active = !1, L(), T()
        }

        function E(e) {
            if (!d.active) return;
            e.preventDefault(), d.cX = e.clientX - d.iX, d.cY = e.clientY - d.iY, d.xOff = d.cX, d.yOff = d.cY;
            const t = document.getElementById("sro-container");
            t && (t.style.transform = `translate3d(${d.cX}px, ${d.cY}px, 0)`)
        }

        function T() {
            const e = document.getElementById("sro-container");
            if (!e) return;
            const t = e.getBoundingClientRect(),
                o = window.innerWidth,
                n = window.innerHeight;
            let s = !1;
            t.left < 0 && (d.cX += 0 - t.left, s = !0), t.top < 0 && (d.cY += 0 - t.top, s = !0), t.right > o && (d.cX -= t.right - o, s = !0), t.bottom > n && (d.cY -= t.bottom - n, s = !0), s && (e.classList.add("sro-snap"), d.xOff = d.cX, d.yOff = d.cY, e.style.transform = `translate3d(${d.cX}px, ${d.cY}px, 0)`, setTimeout(() => e.classList.remove("sro-snap"), 300), L())
        }

        function I(e) {
            if (!e || e.length < 18) return n;
            return `${`${e.substring(8,10)}/${e.substring(10,12)}/${e.substring(12,16)}`} às ${`${e.substring(16,18)}:${e.substring(18,20)}`}`
        }

        function g() {
            y();
            const e = document.getElementById("sro-card"),
                r = document.getElementById("sro-status"),
                d = document.getElementById("sro-icon"),
                a = document.getElementById("sro-distrito"),
                l = document.getElementById("sro-previsao");
            let c = "⏳";
            "success" === s.mode ? c = "✅" : "error" === s.mode ? c = "⛔" : "info" === s.mode && (c = "⚠️");
            e.className = `sro-card visible mode-${s.mode}`, r.innerText = s.status, d.innerText = c, a.innerHTML = m(!1), l.innerText = s.date || o;
            const i = e => document.getElementById(e);
            if (i("td-cod")) {
                i("td-cod").innerText = s.code;
                const e = s.val;
                i("td-val").innerHTML = e ? `<span class="${e.includes("V")?"hl-val":"hl-err"}">${e}</span>` : n, i("td-stt").innerText = s.lastEvt, i("td-dat-prev").innerText = s.date;
                const t = s.exc;
                t && t !== n ? (i("td-exc").innerText = t, document.getElementById("row-exc").style.display = "table-row") : document.getElementById("row-exc").style.display = "none", i("td-end-full").innerText = `${s.addr.log}, ${s.addr.num} ${s.addr.comp?"- "+s.addr.comp:""} - ${s.addr.bair}, ${s.addr.mun}/${s.addr.uf}`, i("td-cep").innerText = s.addr.cep, i("td-con").innerHTML = `TEL: <b>${s.contact.tel}</b> ${s.contact.email!==n?" | EMAIL: "+s.contact.email:""}`, i("td-dis").innerHTML = m(!1), i("td-ord").innerText = s.op.ord, i("td-lad").innerText = s.op.side;
                const o = (e, t) => `<span class="${"S"===s.serv[e]?"hl-serv":"hl-serv-off"}">${t}</span>`;
                i("td-srv").innerHTML = o("ar", "AR") + o("mp", "MP") + o("dd", "DD"), i("td-lis").innerText = s.op.list, i("td-est").innerText = s.op.st, i("td-usu").innerText = s.op.user, i("td-dat").innerText = I(s.op.ts), i("td-postman").innerText = s.op.postman
            }
        }

        function D(e, t) {
            const r = e.toLowerCase();
            let d = null;
            try {
                const t = new URL(e, window.location.origin);
                d = t.searchParams.get("codigo") || t.searchParams.get("id") || t.searchParams.get("objeto")
            } catch {}
            if (d && d !== s.code && (r.includes("acao=validar") || r.includes("acao=pesquisar"))) {
                s = {
                    code: d,
                    status: e,
                    mode: "loading",
                    district: n,
                    domDist: null,
                    initialDist: null,
                    pendingDist: null,
                    date: o,
                    exc: n,
                    val: n,
                    lastEvt: n,
                    addr: {
                        log: n,
                        num: n,
                        comp: n,
                        bair: n,
                        mun: n,
                        uf: n,
                        cep: n
                    },
                    serv: {
                        ar: "N",
                        mp: "N",
                        dd: "N"
                    },
                    contact: {
                        tel: n,
                        email: n
                    },
                    op: {
                        list: n,
                        user: n,
                        postman: n,
                        st: n,
                        ts: n,
                        ord: n,
                        side: n
                    }
                }, g()
            }
            if (r.includes("acao=validar")) s.val = t.validacao || n, s.exc = t.excecao || n, s.lastEvt = t.ultimoEventoDescricao || n, t.validacao ? ("success" !== s.mode && "error" !== s.mode && (s.mode = "info"), "success" !== s.status && "error" !== s.status && (s.status = "PRONTO P/ INDUZIR"), s.date = t.previsaoEntrega?.data || o) : (s.mode = "error", s.status = "NÃO INDUZIDO", s.date = o);
            else if (r.includes("enderecocontroller.php")) t.endereco && (s.addr = {
                log: t.endereco.logradouro || n,
                num: t.endereco.numeroLogradouro || n,
                comp: t.endereco.complementoLogradouro || n,
                bair: t.endereco.bairro || n,
                mun: t.endereco.municipio || n,
                uf: t.endereco.uf || n,
                cep: t.endereco.cep || n
            }), t.servico && (s.serv = {
                ar: t.servico.ar,
                mp: t.servico.mp,
                dd: t.servico.dd
            }), t.telefone && (s.contact.tel = `(${t.telefone.ddd}) ${t.telefone.numero}`), s.contact.email = t.email || n;
            else if (r.includes("distritamentotrechocontroller.php")) Array.isArray(t) && t.length > 0 && (s.district = `${t[0].rotuloDistrito} ${t[0].areaDistrito||""}`.trim(), s.op.ord = t[0].ordemPercorrida, s.op.side = t[0].lado);
            else if (r.includes("acao=pesquisarloecobjeto")) t.id && (s.mode = "success", s.status = "JÁ INDUZIDO", s.initialDist = `${t.numeroDistrito} ${t.distritoComplemento||""}`.trim(), s.district = s.initialDist, s.domDist = s.initialDist, s.op.list = t.idLancamento, s.op.user = t.carteiro?.nome || n, s.op.postman = t.carteiro?.nome || n);
            else if (r.includes("acao=listar")) {
                if (Array.isArray(t) && s.op.list) {
                    const e = t.find(e => e.idLancamento === s.op.list);
                    e?.nomeCarteiro && (s.op.postman = e.nomeCarteiro)
                }
            } else r.includes("acao=salvar") ? (t.idLancamento && (s.mode = "success", s.status = "OBJETO INDUZIDO", s.op.list = t.numeroLista, s.op.user = t.usuario, s.op.st = t.estacao, s.op.ts = t.carimbo, t.dataPrevista && (s.date = t.dataPrevista)), s.pendingDist && (s.district = s.pendingDist, s.initialDist = s.pendingDist, s.domDist = s.pendingDist), t.distrito && (s.initialDist = t.distrito, s.domDist = t.distrito)) : r.includes("acao=excluir") && (s.mode = "error", s.status = "EXCLUÍDO", s.district = n, s.domDist = null, s.date = o, s.initialDist = null, s.pendingDist = null);
            g()
        }
        const S = window.fetch;
        window.fetch = async function(...e) {
            const t = e[0] ? e[0].toString() : "",
                o = t.toLowerCase(),
                n = e[1];
            if (o.includes("acao=salvar") && n && n.body) try {
                const e = JSON.parse(n.body);
                e.distrito && (s.pendingDist = e.distrito)
            } catch {}
            o.includes("listar-impressoras-disponiveis") && l();
            const r = await S.apply(this, e);
            try {
                o.includes("controller.php") && r.clone().json().then(e => D(t, e)).catch(() => {})
            } catch {}
            return r
        };
        const B = XMLHttpRequest.prototype.open,
            C = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(e, t) {
            return this._sroUrl = t, t && t.toLowerCase().includes("listar-impressoras-disponiveis") && l(), B.apply(this, arguments)
        }, XMLHttpRequest.prototype.send = function(e) {
            const t = this._sroUrl ? this._sroUrl.toLowerCase() : "";
            if (t && t.includes("acao=salvar") && e) try {
                const t = JSON.parse(e);
                t.distrito && (s.pendingDist = t.distrito)
            } catch {}
            return this.addEventListener("load", function() {
                const e = this._sroUrl ? this._sroUrl.toLowerCase() : "";
                if (e && e.includes("controller.php")) try {
                    const e = JSON.parse(this.responseText);
                    D(this._sroUrl, e)
                } catch {}
            }), C.apply(this, arguments)
        }, "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", v) : v()
    }() : e.includes("/loecsuspensa/") && function() {
        const e = "sro-hud-dashboard";

        function t() {
            if (document.getElementById("sro-hud-styles")) return;
            const t = document.createElement("style");
            t.id = "sro-hud-styles", t.innerHTML = `\n        #${e} { box-sizing: border-box; width: 100%; max-width: 100%; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 1px solid #dee2e6; border-radius: 8px; margin: 0 auto 20px auto; padding: 15px; font-family: 'Segoe UI', system-ui, sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; animation: slideDown 0.4s ease-out; position: relative; }\n        #${e} * { box-sizing: border-box; }\n        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }\n        .hud-updated { animation: pulse-green 1s; }\n        .hud-card { background: white; padding: 12px; border-radius: 6px; border-left: 4px solid #00416B; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.2s; min-width: 0; }\n        .hud-card:hover { transform: translateY(-2px); }\n        .hud-title { font-size: 0.75rem; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n        .hud-value { font-size: 1.5rem; font-weight: 800; color: #111827; }\n        .hud-sub { font-size: 0.7rem; color: #9ca3af; margin-top: 2px; display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n        .border-danger { border-left-color: #dc2626; }\n        .border-warning { border-left-color: #f59e0b; }\n        .border-success { border-left-color: #10b981; }\n        .border-info { border-left-color: #3b82f6; }\n        .text-danger { color: #dc2626; }\n        .hud-full { grid-column: span 4; display: flex; justify-content: space-between; background: #fff; padding: 10px; border-radius: 4px; border: 1px dashed #ccc; align-items: center; flex-wrap: wrap; }\n        .metric-box { text-align: center; flex: 1; border-right: 1px solid #eee; min-width: 80px; }\n        .metric-box:last-child { border-right: none; }\n        .metric-lbl { font-size: 0.65rem; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }\n        .metric-val { font-weight: bold; font-size: 0.9rem; color: #333; }\n        .hud-footer-time { position: absolute; bottom: 2px; right: 5px; font-size: 0.6rem; color: #aaa; font-style: italic; }\n        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }\n      `, document.head.appendChild(t)
        }
        const o = e => "number" == typeof e ? e : e && parseInt(e.toString().replace(/<[^>]*>/g, ""), 10) || 0;

        function n(e) {
            if (!Array.isArray(e) || 0 === e.length) return null;
            let t = e.length,
                n = 0,
                r = 0,
                s = 0,
                i = 0,
                d = 0,
                a = 0;
            e.forEach(e => {
                n += o(e.qtde), r += o(e.qtdePontos), s += o(e.qtdeVencido), i += o(e.qtdeHoje), d += o(e.qtdeAVencer), a += o(e.qtdeAR)
            });
            const l = n > 0 ? (n / r).toFixed(2) : 0,
                c = n > 0 ? (s / n * 100).toFixed(1) : 0,
                p = n > 0 ? ((i + d) / n * 100).toFixed(1) : 0,
                u = n > 0 ? (a / n * 100).toFixed(1) : 0,
                f = (n / t).toFixed(1);
            return {
                raw: {
                    totalDistricts: t,
                    totalObjects: n,
                    totalPoints: r,
                    totalExpired: s,
                    totalToday: i,
                    totalToExpire: d,
                    totalAR: a
                },
                computed: {
                    deliveryDensity: l,
                    chaosIndex: c,
                    operationalPressure: p,
                    arFactor: u,
                    avgObjectsPerDistrict: f
                }
            }
        }

        function r(t) {
            const o = document.getElementById(e);
            if (o && o.remove(), !t) return;
            const n = document.querySelector(".botoes");
            if (!n) return;
            const r = t.raw,
                s = t.computed;
            let i = "border-success",
                d = "CONTROLADO";
            s.chaosIndex > 20 && (i = "border-warning", d = "ATENÇÃO"), s.chaosIndex > 50 && (i = "border-danger", d = "CRÍTICO");
            const a = (new Date).toLocaleTimeString("pt-BR"),
                l = document.createElement("div");
            l.id = e, l.classList.add("hud-updated"), l.innerHTML = `\n        <div class="hud-card border-info"><div class="hud-title">Carga Total Suspensa</div><div class="hud-value">${r.totalObjects} <span style="font-size:0.8rem; color:#888;">objs</span></div><div class="hud-sub">📦 ${r.totalDistricts} distritos afetados</div></div>\n        <div class="hud-card ${i}"><div class="hud-title">Backlog (Vencidos)</div><div class="hud-value text-danger">${r.totalExpired}</div><div class="hud-sub">🔥 ${s.chaosIndex}% da carga total</div></div>\n        <div class="hud-card border-warning"><div class="hud-title">Urgência (Hoje+Breve)</div><div class="hud-value">${r.totalToday+r.totalToExpire}</div><div class="hud-sub">⚠️ Pressão Operacional: ${s.operationalPressure}%</div></div>\n        <div class="hud-card border-info"><div class="hud-title">Complexidade (ARs)</div><div class="hud-value">${r.totalAR}</div><div class="hud-sub">📝 Fator de Retenção: ${s.arFactor}%</div></div>\n        <div class="hud-full"><div class="metric-box"><div class="metric-lbl">DENSIDADE DO CLUSTER</div><div class="metric-val">${s.deliveryDensity} objs/ponto</div></div><div class="metric-box"><div class="metric-lbl">TOTAL PONTOS FÍSICOS</div><div class="metric-val">📍 ${r.totalPoints}</div></div><div class="metric-box"><div class="metric-lbl">STATUS TÁTICO</div><div class="metric-val" style="font-weight:900;">${d}</div></div><div class="metric-box"><div class="metric-lbl">MÉDIA OBJS/DISTRITO</div><div class="metric-val">📊 ${s.avgObjectsPerDistrict}</div></div></div>\n        <div class="hud-footer-time">Atualizado às: ${a}</div>\n      `, n.parentNode.insertBefore(l, n)
        }

        function s(e, o) {
            if (e && e.includes("lancamentoController.php?acao=listar")) try {
                const e = "string" == typeof o ? JSON.parse(o) : o;
                if (Array.isArray(e)) {
                    t();
                    const o = n(e);
                    setTimeout(() => r(o), 300)
                }
            } catch {}
        }
        const i = window.fetch;
        window.fetch = async function(...e) {
            const t = await i.apply(this, e),
                o = e[0] ? e[0].toString() : "";
            return o.includes("lancamentoController.php?acao=listar") && t.clone().json().then(e => s(o, e)).catch(() => {}), t
        };
        const d = XMLHttpRequest.prototype.open,
            a = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(e, t) {
            return this._sroUrl = t, d.apply(this, arguments)
        }, XMLHttpRequest.prototype.send = function(e) {
            return this.addEventListener("load", function() {
                if (this._sroUrl && this._sroUrl.includes("lancamentoController.php?acao=listar")) try {
                    s(this._sroUrl, JSON.parse(this.responseText))
                } catch {}
            }), a.apply(this, arguments)
        }
    }()
}();
