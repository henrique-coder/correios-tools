(function () {
  'use strict';
  const PATH = window.location.pathname.toLowerCase();

  function fetchMonitor(url) {
    return new Promise((resolve, reject) => {
      const reqId = Date.now() + Math.random();
      const listener = (e) => {
        if (
          e.source !== window ||
          !e.data ||
          e.data.type !== 'CT_FETCH_RESPONSE' ||
          e.data.id !== reqId
        )
          return;
        window.removeEventListener('message', listener);
        if (e.data.response && e.data.response.success)
          resolve(e.data.response.data);
        else
          reject(
            new Error(e.data.response ? e.data.response.error : 'Sem resposta')
          );
      };
      window.addEventListener('message', listener);
      window.postMessage(
        { type: 'CT_FETCH_REQUEST', id: reqId, url: url },
        '*'
      );
    });
  }

  if (PATH.includes('/lancamentoautomatico/')) {
    const ACTIONS = {
      'CT-INDUZIROBJETO': () => {
        const btnInc = document.getElementById('btnIncluirObjeto');
        const txtObj = document.getElementById('txtObjeto');

        if (!btnInc || btnInc.offsetParent === null) {
          if (txtObj) txtObj.focus();
          return;
        }

        if (document.activeElement) document.activeElement.blur();

        const a = document.getElementById('btnModalA');
        let d = 0;
        if (a && a.offsetParent !== null) {
          a.click();
          d = 300;
        }

        setTimeout(() => {
          let t = 0;
          const c = setInterval(() => {
            const txtNum = document.getElementById('txtNumero');
            if (txtNum) {
              clearInterval(c);
              setTimeout(() => {
                const v = txtNum.value.trim().toUpperCase();
                const inv =
                  v === '' || v === 'N/A' || v === 'S/A' || v === 'S/N';

                if (inv) {
                  if (window._sroBP !== S.code) {
                    window._sroBP = S.code;
                    txtNum.focus();
                    txtNum.select();
                    return;
                  }
                } else {
                  window._sroBP = null;
                }

                window._sroBP = null;
                txtNum.blur();
                if (document.activeElement) document.activeElement.blur();

                setTimeout(() => {
                  if (btnInc) {
                    btnInc.click();
                    let w = 0;
                    const wc = setInterval(() => {
                      if (txtObj && txtObj.value === '') {
                        clearInterval(wc);
                        txtObj.focus();
                        LIV = txtObj.value;
                      }
                      if (++w > 100) clearInterval(wc);
                    }, 100);
                  }
                }, 200);
              }, 200);
            }
            if (++t > 60) clearInterval(c);
          }, 50);
        }, d);
      }
    };

    (function () {
      const T = '#',
        O = 1000;
      let b = '',
        c = !1,
        tm = null;

      function exec() {
        if (b.length > 0) {
          const cmd = b.toUpperCase();
          if (ACTIONS[cmd]) ACTIONS[cmd]();
        }
        b = '';
        if (tm) clearTimeout(tm);
        tm = setTimeout(() => {
          c = !1;
        }, 200);
      }

      window.addEventListener(
        'keydown',
        (e) => {
          if (e.key === T) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (c) exec();
            else {
              c = !0;
              b = '';
              if (tm) clearTimeout(tm);
              tm = setTimeout(() => {
                c = !1;
                b = '';
              }, O);
            }
            return;
          }
          if (c) {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (e.key === 'Enter') exec();
            else if (e.key.length === 1) {
              b += e.key;
              if (tm) clearTimeout(tm);
              tm = setTimeout(() => {
                c = !1;
                b = '';
              }, O);
            }
          }
        },
        !0
      );
    })();

    const K = {
      POS: 'correiostools_pos_v2',
      HIDDEN: 'correiostools_panel_hide'
    };

    let S = {
      code: '--',
      status: 'AGUARDANDO...',
      mode: 'loading',
      district: '--',
      domDist: null,
      initialDist: null,
      pendingDist: null,
      date: '--/--/----',
      exc: '--',
      val: '--',
      lastEvt: '--',
      addr: {
        log: '--',
        num: '--',
        comp: '--',
        bair: '--',
        mun: '--',
        uf: '--',
        cep: '--'
      },
      serv: { ar: 'N', mp: 'N', dd: 'N' },
      contact: { tel: '--', email: '--' },
      op: {
        list: '--',
        user: '--',
        postman: '--',
        st: '--',
        ts: '--',
        ord: '--',
        side: '--'
      }
    };

    let D = { active: !1, cX: 0, cY: 0, iX: 0, iY: 0, xOff: 0, yOff: 0 };
    let LIV = null;

    function FC(c) {
      if (!c || c.length !== 13) return c || '';
      return `<strong style="color:#00416B">${c.slice(0, 2)}</strong> ${c.slice(2, 5)} ${c.slice(5, 8)} <strong style="color:#00416B">${c.slice(8, 11)}</strong> ${c.slice(11)}`;
    }

    function SP() {
      window.localStorage.setItem(
        K.POS,
        JSON.stringify({ x: D.xOff, y: D.yOff })
      );
    }

    function LP(el) {
      try {
        const p = JSON.parse(window.localStorage.getItem(K.POS) || '{x:0,y:0}');
        if (p && typeof p.x === 'number') {
          D.xOff = p.x;
          D.yOff = p.y;
          el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        }
      } catch (e) {}
    }

    function GDH(ic) {
      let c = S.domDist && S.domDist !== '' ? S.domDist : S.district;
      c = c ? c.trim() : '';
      if (S.initialDist && S.initialDist !== c && c !== '--') {
        const o = S.initialDist;
        return `<span class="${ic ? 'sro-old' : 'sro-old-p'}" style="${!ic ? 'opacity:0.5;font-weight:normal;margin-right:2px;font-size:0.9em' : ''}">${o}</span><span class="${ic ? 'sro-arrow' : 'sro-arrow-p'}" style="${!ic ? 'margin:0 4px;font-size:0.9em;color:#666' : ''}">&#10142;</span><span class="${ic ? 'sro-new' : 'sro-new-p'}">${c}</span>`;
      }
      return `<span class="${ic ? 'sro-new' : 'sro-new-p'}">${c || '--'}</span>`;
    }

    function IJT() {
      if (document.getElementById('sro-table-wrapper')) return;
      const b = document.querySelector('.botoes');
      if (!b) return setTimeout(IJT, 500);
      const d = document.createElement('div');
      d.id = 'sro-table-wrapper';
      d.innerHTML = `<div class="sro-table-header"><span style="color:#ffffff !important">DADOS OPERACIONAIS</span></div><table class="sro-full-table"><tr><th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">--</td><th>STATUS</th><td id="td-stt">--</td><th>VALIDAÇÃO</th><td id="td-val">--</td><th>DATA PREV.</th><td id="td-dat-prev">--</td></tr><tr id="row-exc" style="display:none"><th style="color:#c62828">EXCEÇÃO</th><td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">--</td></tr><tr><th>ENDEREÇO</th><td colspan="5" id="td-end-full">--</td><th>CEP</th><td id="td-cep" style="font-weight:bold">--</td></tr><tr><th>CONTATO</th><td colspan="7" id="td-con">--</td></tr><tr><th>DISTRITO</th><td id="td-dis" class="hl-dist">--</td><th>ORDEM</th><td id="td-ord">--</td><th>LADO</th><td id="td-lad">--</td><th>SERVIÇOS</th><td colspan="3" id="td-srv">--</td></tr><tr><th rowspan="2">INDUÇÃO</th><td colspan="7"><span style="color:#777">L:</span> <b id="td-lis">--</b>  |  <span style="color:#777">E:</span> <b id="td-est">--</b>  |  <span style="color:#777">U:</span> <b id="td-usu">--</b>  |  <span style="color:#777">DATA:</span> <b id="td-dat">--</b></td></tr><tr><td colspan="7" style="background:#fffde7;border-left:3px solid #fbc02d"><span style="color:#f57f17;font-weight:bold;text-transform:uppercase">CARTEIRO:</span> <b id="td-postman" style="font-size:12px;color:#333;margin-left:5px">--</b></td></tr></table>`;
      b.insertAdjacentElement('afterend', d);
    }

    function UPT() {
      const el = (id) => document.getElementById(id);
      if (!el('td-cod')) return;
      el('td-cod').innerText = S.code;
      const v = S.val;
      el('td-val').innerHTML = v
        ? `<span class="${v.includes('V') ? 'hl-val' : 'hl-err'}">${v}</span>`
        : '--';
      el('td-stt').innerText = S.lastEvt;
      el('td-dat-prev').innerText = S.date;
      if (S.exc && S.exc !== '--') {
        el('td-exc').innerText = S.exc;
        document.getElementById('row-exc').style.display = 'table-row';
      } else document.getElementById('row-exc').style.display = 'none';

      const fullAddr = `${S.addr.log}, ${S.addr.num} ${S.addr.comp && S.addr.comp !== '--' ? '- ' + S.addr.comp : ''} - ${S.addr.bair}, ${S.addr.mun}/${S.addr.uf}`;
      if (S.addr.log === '--' || fullAddr.startsWith('--')) {
        el('td-end-full').innerText = fullAddr;
      } else {
        const encodedAddr = encodeURIComponent(fullAddr)
          .replace(/%20/g, '+')
          .replace(/%2C/g, ',');
        el('td-end-full').innerHTML =
          `<a href="https://www.google.com/maps/search/${encodedAddr}" target="_blank" style="color:#00416B;text-decoration:none;font-weight:bold;">${fullAddr}</a>`;
      }

      el('td-cep').innerText = S.addr.cep;
      el('td-con').innerHTML =
        `TEL: <b>${S.contact.tel}</b> ${S.contact.email !== '--' ? ' | EMAIL: ' + S.contact.email : ''}`;
      el('td-dis').innerHTML = GDH(!1);
      el('td-ord').innerText = S.op.ord;
      el('td-lad').innerText = S.op.side;
      const sh = (k, l) =>
        `<span class="${S.serv[k] === 'S' ? 'hl-serv' : 'hl-serv-off'}">${l}</span>`;
      el('td-srv').innerHTML = sh('ar', 'AR') + sh('mp', 'MP') + sh('dd', 'DD');
      el('td-lis').innerText = S.op.list;
      el('td-est').innerText = S.op.st;
      el('td-usu').innerText = S.op.user;
      el('td-postman').innerText = S.op.postman;
      let ts = S.op.ts;
      el('td-dat').innerText =
        ts && ts.length >= 18
          ? `${ts.substring(8, 10)}/${ts.substring(10, 12)}/${ts.substring(12, 16)} às ${ts.substring(16, 18)}:${ts.substring(18, 20)}`
          : '--';
    }

    function IJS() {
      if (document.getElementById('sro-styles')) return;
      const s = document.createElement('style');
      s.id = 'sro-styles';
      s.innerHTML = `#sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); will-change: transform; font-family: 'Segoe UI', sans-serif; } .sro-card { width: 360px; background: #fff; border-radius: 6px; overflow: hidden; border-left: 8px solid #999; display: block; } .sro-header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border-bottom: 1px solid #eee; cursor: grab; user-select: none; } .sro-status-block { display: flex; align-items: center; gap: 8px; flex: 1; } .sro-status-text { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; color: #444; } .sro-btn-group { display: flex; align-items: center; gap: 8px; } .sro-btn-panel { cursor: pointer; font-size: 1.2rem; color: #555; transition: all 0.2s; line-height: 1; font-weight:bold; padding: 2px 5px; border-radius: 4px; } .sro-btn-panel:hover { color: #00416B; background: #f0f0f0; } .sro-btn-disabled { opacity: 0.3; pointer-events: none; } .sro-body { padding: 12px; text-align: center; background: #fff; } .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: #00416B; margin: 6px 0; } .sro-new { color: #00416B; font-size: 3rem; font-weight: 900; } .sro-old { font-size: 2rem; opacity: 0.35; font-weight: 700; color: #000; margin-right: 5px; } .sro-arrow { font-size: 2rem; margin: 0 10px; color: #444; font-weight: 400; } .mode-loading { border-left-color: #7f8c8d; } .mode-success { border-left-color: #009688; } .mode-success .sro-header { background: #e0f2f1; } .mode-success .sro-status-text { color: #00695c; } .mode-error { border-left-color: #d32f2f; } .mode-error .sro-header { background: #ffebee; } .mode-error .sro-status-text { color: #c62828; } .mode-info { border-left-color: #1976d2; } .mode-info .sro-header { background: #e3f2fd; } .mode-info .sro-status-text { color: #0d47a1; } #sro-table-wrapper { margin-top: 25px; font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #ccc; background: #fff; width: 100%; box-sizing: border-box; clear: both; pointer-events: auto; } .sro-table-header { background: #00416B; color: #ffffff !important; padding: 8px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; display: flex; justify-content: space-between; border-bottom: 3px solid #FFE600; } .sro-full-table { width: 100%; border-collapse: collapse; font-size: 11px; } .sro-full-table th { background: #f0f0f0; color: #333; text-align: left; padding: 5px 8px; border: 1px solid #ddd; font-weight: 700; white-space: nowrap; width: 1%; } .sro-full-table td { padding: 5px 8px; border: 1px solid #ddd; color: #000; word-break: break-word; } .hl-val { color: #2e7d32; font-weight: 800; background: #e8f5e9; padding: 1px 4px; border-radius: 3px; } .hl-err { color: #c62828; font-weight: 800; background: #ffebee; padding: 1px 4px; border-radius: 3px; } .hl-dist { font-size: 15px; font-weight: 800; color: #00416B; } .hl-serv { background: #fff8e1; color: #ff8f00; padding: 0 3px; border-radius: 2px; font-weight: bold; border: 1px solid #ffecb3; margin-right: 3px; } .hl-serv-off { opacity: 0.2; margin-right: 3px; }`;
      document.head.appendChild(s);
    }

    function STD(h, c) {
      h.onmousedown = (e) => {
        if (e.target.closest('.sro-btn-group')) return;
        D.active = !0;
        D.iX = e.clientX - D.xOff;
        D.iY = e.clientY - D.yOff;
      };
      h.ondblclick = (e) => {
        if (e.target.closest('.sro-btn-group')) return;
        D.xOff = 0;
        D.yOff = 0;
        c.style.transform = 'translate3d(0,0,0)';
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
        c.style.transform = `translate3d(${D.xOff}px, ${D.yOff}px, 0)`;
        SP();
      }
    }

    function RDP() {
      IJS();
      let c = document.getElementById('sro-container');
      if (!c) {
        c = document.createElement('div');
        c.id = 'sro-container';
        c.innerHTML = `<div id="sro-card" class="sro-card mode-loading"><div id="sro-header" class="sro-header" title="Segure para mover"><div class="sro-status-block"><span id="sro-icon" class="sro-icon">⏳</span><span id="sro-status" class="sro-status-text">AGUARDANDO...</span></div><div class="sro-btn-group"></div></div><div class="sro-body"><div id="sro-tracking" style="font-size:13px;color:#888;font-weight:700;letter-spacing:0.5px;margin-bottom:2px;min-height:16px"></div><div id="sro-distrito" class="sro-distrito">--</div><div style="font-size:12px;color:#666;margin-top:4px">PREVISÃO: <strong id="sro-previsao" style="color:#333">--/--/----</strong></div></div></div>`;
        document.body.appendChild(c);
        LP(c);
        STD(document.getElementById('sro-header'), c);
      }
      const cd = document.getElementById('sro-card');
      if (cd) {
        let i = '⏳';
        if (S.mode === 'success') i = '✅';
        if (S.mode === 'error') i = '⛔';
        if (S.mode === 'info') i = '⚠️';
        cd.className = `sro-card visible mode-${S.mode}`;
        document.getElementById('sro-status').innerText = S.status;
        document.getElementById('sro-icon').innerText = i;
        document.getElementById('sro-tracking').innerHTML =
          S.code && S.code !== '--' ? FC(S.code) : '';
        document.getElementById('sro-distrito').innerHTML = GDH(!0);
        document.getElementById('sro-previsao').innerText =
          S.date || '--/--/----';
      }
      UPT();
    }

    function HRE(u, d) {
      const lc = u.toLowerCase();
      let up = !1;
      const cd =
        new URL(u, window.location.origin).searchParams.get('codigo') ||
        new URL(u, window.location.origin).searchParams.get('objeto') ||
        new URL(u, window.location.origin).searchParams.get('id');

      if (
        cd &&
        cd !== S.code &&
        (lc.includes('acao=validar') || lc.includes('acao=pesquisar'))
      ) {
        S = {
          code: cd,
          status: 'AGUARDANDO...',
          mode: 'loading',
          district: '--',
          domDist: null,
          initialDist: null,
          pendingDist: null,
          date: '--/--/----',
          exc: '--',
          val: '--',
          lastEvt: '--',
          addr: {
            log: '--',
            num: '--',
            comp: '--',
            bair: '--',
            mun: '--',
            uf: '--',
            cep: '--'
          },
          serv: { ar: 'N', mp: 'N', dd: 'N' },
          contact: { tel: '--', email: '--' },
          op: {
            list: '--',
            user: '--',
            postman: '--',
            st: '--',
            ts: '--',
            ord: '--',
            side: '--'
          }
        };
        up = !0;
      }

      if (lc.includes('acao=validar')) {
        S.val = d.validacao || '--';
        S.exc = d.excecao || '--';
        S.lastEvt = d.ultimoEventoDescricao || '--';
        if (d.validacao) {
          if (S.mode !== 'success' && S.mode !== 'error') {
            S.mode = 'info';
            S.status = 'PRONTO P/ INDUZIR';
          }
          S.date = d.previsaoEntrega?.data || '--/--/----';
        } else {
          S.mode = 'error';
          S.status = 'NÃO INDUZIDO';
        }
        up = !0;
      } else if (lc.includes('enderecocontroller.php') && d.endereco) {
        S.addr = {
          log: d.endereco.logradouro || '--',
          num: d.endereco.numeroLogradouro || '--',
          comp: d.endereco.complementoLogradouro || '--',
          bair: d.endereco.bairro || '--',
          mun: d.endereco.municipio || '--',
          uf: d.endereco.uf || '--',
          cep: d.endereco.cep || '--'
        };
        if (d.servico)
          S.serv = { ar: d.servico.ar, mp: d.servico.mp, dd: d.servico.dd };
        if (d.telefone)
          S.contact.tel = `(${d.telefone.ddd}) ${d.telefone.numero}`;
        S.contact.email = d.email || '--';
        up = !0;
      } else if (
        lc.includes('distritamentotrechocontroller.php') &&
        Array.isArray(d) &&
        d.length > 0
      ) {
        S.district = `${d[0].rotuloDistrito} ${d[0].areaDistrito || ''}`.trim();
        const s = document.getElementById('selDistrito');
        if (s) {
          const o = s.options ? s.options[s.selectedIndex] : null;
          const v = o ? o.text : s.value;
          if (v && v !== 'Selecione...' && v.trim() !== '') {
            S.domDist = v.trim();
          } else {
            S.domDist = '';
          }
        } else {
          S.domDist = '';
        }
        S.op.ord = d[0].ordemPercorrida;
        S.op.side = d[0].lado;
        up = !0;
      } else if (lc.includes('acao=pesquisarloecobjeto')) {
        if (d.id || d.idLancamento) {
          S.mode = 'success';
          S.status = 'JÁ INDUZIDO';
          S.district =
            `${d.numeroDistrito || ''} ${d.distritoComplemento || ''}`.trim();
          S.domDist = S.district;
          S.initialDist = S.district;
          if (d.carteiro && d.carteiro.nome) S.op.postman = d.carteiro.nome;
          up = !0;
        }
      } else if (lc.includes('acao=salvar')) {
        if (d.idLancamento) {
          S.mode = 'success';
          S.status = 'OBJETO INDUZIDO';
          S.op.list = d.numeroLista;
          S.op.user = d.usuario;
          S.op.st = d.estacao;
          S.op.ts = d.carimbo;
          if (d.dataPrevista) S.date = d.dataPrevista;

          try {
            const urlObj = new URL(u, window.location.origin);
            const fetchUrl =
              urlObj.pathname + '?acao=pesquisarloecobjeto&objeto=' + S.code;
            window
              .fetch(fetchUrl)
              .then((r) => r.json())
              .then((res) => {
                if (res && (res.id || res.idLancamento)) {
                  S.district =
                    `${res.numeroDistrito || ''} ${res.distritoComplemento || ''}`.trim();
                  S.domDist = S.district;
                  S.initialDist = S.district;
                  if (res.carteiro && res.carteiro.nome)
                    S.op.postman = res.carteiro.nome;
                  RDP();
                }
              })
              .catch(() => {});
          } catch (e) {}

          [
            'txtCep',
            'txtNumero',
            'txtComplemento',
            'txtLogradouro',
            'txtBairro',
            'txtMunicipio'
          ].forEach((id) => {
            const el = document.getElementById(id);
            if (el && el.value) {
              const k = id.replace('txt', '').toLowerCase();
              if (k === 'cep') S.addr.cep = el.value.trim();
              if (k === 'numero') S.addr.num = el.value.trim();
              if (k === 'complemento') S.addr.comp = el.value.trim();
              if (k === 'logradouro') S.addr.log = el.value.trim();
              if (k === 'bairro') S.addr.bair = el.value.trim();
              if (k === 'municipio') S.addr.mun = el.value.trim();
            }
          });
          const selUf = document.getElementById('selUf');
          if (selUf && selUf.value) S.addr.uf = selUf.value;
          up = !0;
        } else if (d.excecao) {
          S.mode = 'error';
          S.status = 'ERRO NA INDUÇÃO';
          S.exc = d.excecao;
          up = !0;
        }
      } else if (lc.includes('acao=excluir')) {
        S.mode = 'error';
        S.status = 'EXCLUÍDO';
        up = !0;
      }
      if (up) RDP();
    }

    const oF = window.fetch;
    window.fetch = async function (...a) {
      const r = await oF.apply(this, a);
      try {
        const u = a[0] ? a[0].toString() : '';
        if (u.toLowerCase().includes('controller.php'))
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
      if (u && u.toLowerCase().includes('listar-impressoras-disponiveis'))
        ATC();
      return oO.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (b) {
      this.addEventListener('load', function () {
        if (this._u) {
          if (this._u.toLowerCase().includes('controller.php'))
            try {
              HRE(this._u, JSON.parse(this.responseText));
            } catch (e) {}
        }
      });
      return oS.apply(this, arguments);
    };

    let atcInt = null;
    let okInt = null;
    function ATC() {
      if (atcInt) clearInterval(atcInt);
      if (okInt) clearInterval(okInt);
      let t = 0;
      atcInt = setInterval(() => {
        const b = document.getElementById('btnImprimirEtiquetaNao');
        if (b && b.offsetParent !== null) {
          b.click();
          b.dispatchEvent(
            new MouseEvent('click', {
              bubbles: !0,
              cancelable: !0,
              view: window
            })
          );
          if (atcInt) {
            clearInterval(atcInt);
            atcInt = null;
          }
          let t2 = 0;
          okInt = setInterval(() => {
            const ok = document.querySelector('#alerta.aberto .act a');
            if (ok && ok.innerText === 'OK') {
              ok.click();
              clearInterval(okInt);
              okInt = null;
            }
            if (++t2 >= 50 && okInt) {
              clearInterval(okInt);
              okInt = null;
            }
          }, 100);
        }
        if (++t >= 50 && atcInt) {
          clearInterval(atcInt);
          atcInt = null;
        }
      }, 200);
    }

    function WTI() {
      const inp = document.getElementById('txtObjeto');
      if (!inp) return setTimeout(WTI, 1000);
      const p = inp.closest('.campo') || inp.parentElement;
      if (p) {
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter')
            setTimeout(() => {
              const m = p.querySelector('.mensagem');
              if (m && m.innerText.trim().length > 0) RFC(inp);
            }, 300);
        });
        new MutationObserver(() => {
          const m = p.querySelector('.mensagem');
          if (m && m.innerText.trim().length > 0 && inp.value !== LIV) RFC(inp);
        }).observe(p, { childList: true, subtree: true, characterData: true });
      }
    }

    function RFC(i) {
      if (document.activeElement !== document.getElementById('selDistrito')) {
        i.click();
        i.focus();
        LIV = i.value;
      }
    }

    function WSE() {
      const s = document.getElementById('selDistrito');
      if (!s) return setTimeout(WSE, 1000);
      const f = () => {
        if (!s) return;
        const o = s.options ? s.options[s.selectedIndex] : null;
        let v = o ? o.text : s.value;
        if (v && v.includes(' - ')) v = v.split(' - ')[0]; // Em caso de formatações
        S.domDist =
          v && v.trim() !== '' && v !== 'Selecione...' ? v.trim() : '';
        RDP();
      };
      s.addEventListener('change', f);
      s.addEventListener('input', f);

      // Observar mutações no select caso o site o atualize via JS sem disparar eventos
      const mo = new MutationObserver(f);
      mo.observe(s, {
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true
      });
    }

    function IAP() {
      IJT();
      WTI();
      WSE();
      ATC();
      RDP();
      document.body.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'selGrade') ATC();
      });
    }

    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', IAP);
    else IAP();
  } else if (PATH.includes('/loecsuspensa/')) {
    const PN = (v) =>
      typeof v === 'number'
        ? v
        : v
          ? parseInt(v.toString().replace(/<[^>]*>/g, ''), 10) || 0
          : 0;

    async function RCD(data) {
      if (!Array.isArray(data) || data.length === 0) return;

      if (!window['Chart']) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/chart.js@4/dist/chart.umd.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      let mod = document.getElementById('ct-mon-modal');
      if (!mod) {
        mod = document.createElement('div');
        mod.id = 'ct-mon-modal';
        mod.style.cssText =
          'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);z-index:9999999;display:none;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
        document.body.appendChild(mod);
      }

      let totalObjs = 0,
        totalPts = 0,
        totalVencidos = 0,
        totalHoje = 0,
        totalAVencer = 0,
        totalARs = 0;
      const distritosList = [];

      data.forEach((item, idx) => {
        const qtde = PN(item.qtde);
        const qtdePontos = PN(item.qtdePontos);
        const qtdeVencido = PN(item.qtdeVencido);
        const qtdeHoje = PN(item.qtdeHoje);
        const qtdeAVencer = PN(item.qtdeAVencer);
        const qtdeAR = PN(item.qtdeAR);

        totalObjs += qtde;
        totalPts += qtdePontos;
        totalVencidos += qtdeVencido;
        totalHoje += qtdeHoje;
        totalAVencer += qtdeAVencer;
        totalARs += qtdeAR;

        distritosList.push({ ...item, qtde, _origIndex: idx });
      });

      distritosList.sort((a, b) => {
        const numA = parseInt(a.numeroDistrito, 10) || 0;
        const numB = parseInt(b.numeroDistrito, 10) || 0;
        if (numA !== numB) return numA - numB;
        const letA = (a.numeroDistrito || '').replace(/[0-9\s]/g, '').trim();
        const letB = (b.numeroDistrito || '').replace(/[0-9\s]/g, '').trim();
        if (letA === 'N' && letB !== 'N') return -1;
        if (letB === 'N' && letA !== 'N') return 1;
        return letA.localeCompare(letB);
      });

      const topDistritos = [...distritosList]
        .sort((a, b) => b.qtde - a.qtde)
        .slice(0, 10);
      const containerId = 'loec-pro-dashboard';
      let container = document.getElementById(containerId);

      if (container) container.remove();

      const refNode = document.querySelector('.botoes');
      if (!refNode) return;
      refNode.style.marginTop = '25px';

      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText =
        'width:100%;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:20px;margin-bottom:25px;clear:both;display:block;box-sizing:border-box;font-family:system-ui,-apple-system,sans-serif;';
      container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px;">
          <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #3b82f6;">
            <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">Carga Total</div>
            <div style="font-size:28px;font-weight:800;color:#0f172a;line-height:1;">${totalObjs} <span style="font-size:14px;color:#64748b;font-weight:500;">objs</span></div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px;">📍 ${totalPts} pontos | 📝 ${totalARs} ARs</div>
          </div>
          <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #ef4444;">
            <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">Vencidos</div>
            <div style="font-size:28px;font-weight:800;color:#ef4444;line-height:1;">${totalVencidos}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px;">Prioridade Máxima</div>
          </div>
          <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #f97316;">
            <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">Vencem Hoje</div>
            <div style="font-size:28px;font-weight:800;color:#f97316;line-height:1;">${totalHoje}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px;">SLA Diário</div>
          </div>
          <div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #10b981;">
            <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px;">A Vencer</div>
            <div style="font-size:28px;font-weight:800;color:#10b981;line-height:1;">${totalAVencer}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px;">Fluxo Controlado</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:16px;">
          <div style="flex:1;min-width:300px;background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);position:relative;height:320px;">
            <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155;">Distribuição de Status</h4>
            <div style="position:relative;height:calc(100% - 35px);width:100%;"><canvas id="chartjs-status"></canvas></div>
          </div>
          <div style="flex:2;min-width:400px;background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);position:relative;height:320px;">
            <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155;">Top 10 Distritos (Volume)</h4>
            <div style="position:relative;height:calc(100% - 35px);width:100%;"><canvas id="chartjs-volume"></canvas></div>
          </div>
        </div>
        <div style="margin-top:24px;">
          <h4 style="margin:0 0 16px 0;font-size:16px;color:#334155;">Detalhamento por Distrito (Clique para ver o relatório completo de entregas)</h4>
          <div id="ct-dist-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;"></div>
        </div>
        <div style="margin-top:24px;background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <h4 style="margin:0 0 16px 0;font-size:14px;color:#334155;">Ações Rápidas (Listar Objetos)</h4>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button id="btn-arq-hoje" style="flex:1;min-width:180px;white-space:normal;padding:8px 16px;background:#f97316;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">Vencem Hoje (Laranja)</button>
            <button id="btn-arq-vencidos" style="flex:1;min-width:180px;white-space:normal;padding:8px 16px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">Vencidos (Vermelho)</button>
            <button id="btn-arq-avencer" style="flex:1;min-width:180px;white-space:normal;padding:8px 16px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">A Vencer (Verde)</button>
          </div>
          <div id="ct-arq-export" style="margin-top:16px;display:none;border-top:1px solid #e2e8f0;padding-top:16px;">
            <h4 style="margin:0 0 12px 0;font-size:13px;color:#475569;">Filtros e Exportação:</h4>
            <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:16px;">
              <select id="ct-arq-grade-filter" style="flex:1;min-width:140px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:13px;outline:none;">
                <option value="">Todas as Grades</option>
              </select>
              <select id="ct-arq-side-filter" style="flex:1;min-width:140px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:13px;outline:none;">
                <option value="">Todos os Lados</option>
              </select>
              <select id="ct-arq-dist-filter" style="flex:1;min-width:160px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:13px;outline:none;">
                <option value="">Todos os Distritos</option>
              </select>
              <select id="ct-arq-export-mode" style="flex:1;min-width:200px;padding:6px 12px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:13px;outline:none;">
                <option value="3" selected>📦 Objetos e Endereços</option>
                <option value="1">📋 Apenas Objetos</option>
                <option value="2">📍 Apenas Endereços</option>
              </select>
              <div style="display:flex;gap:8px;flex:1;min-width:260px;">
                <button id="ct-arq-btn-copy" style="flex:1;white-space:nowrap;padding:8px 12px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;transition:0.2s;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">📋 Copiar Conteúdo</button>
                <button id="ct-arq-btn-txt" style="flex:1;white-space:nowrap;padding:8px 12px;background:#334155;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;transition:0.2s;" onmouseover="this.style.background='#1e293b'" onmouseout="this.style.background='#334155'">📥 Salvar TXT</button>
              </div>
            </div>
          </div>
          <div id="ct-arq-result" style="margin-top:16px;display:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;max-height:400px;overflow-y:auto;">
          </div>
        </div>
      `;
      refNode.parentNode.insertBefore(container, refNode);

      const arqFetch = async (catType) => {
        const btn = document.getElementById('btn-arq-' + catType);
        const oldText = btn.innerText;
        btn.innerText = 'Buscando...';
        btn.disabled = true;

        const EXPORT_CAT = catType.toUpperCase();
        window._ctArqLastData = null;

        const resultEl = document.getElementById('ct-arq-result');
        const exportEl = document.getElementById('ct-arq-export');
        resultEl.style.display = 'block';
        exportEl.style.display = 'none';
        resultEl.innerHTML =
          '<div style="text-align:center;padding:20px;color:#3b82f6;font-weight:bold;">⏳ Inicializando busca...<br><div style="font-size:12px;color:#64748b;margin-top:8px;" id="ct-arq-progress">0 / 0 distritos consultados</div></div>';

        const origTable = document.getElementById('tabela-rotulos');
        let targetColor = null;
        if (origTable) {
          const rows = origTable.querySelectorAll('tbody tr');
          let colIdx = catType === 'hoje' ? 4 : catType === 'vencidos' ? 3 : 5;
          for (const tr of rows) {
            const tds = tr.querySelectorAll('td');
            if (tds.length > colIdx) {
              const cell = tds[colIdx];
              const span = cell.querySelector('span') || cell;
              const valText = span.innerText || cell.innerText || '0';
              const val = parseInt(valText.replace(/[^0-9]/g, ''), 10) || 0;
              if (val > 0) {
                targetColor =
                  span.style && span.style.color
                    ? span.style.color
                    : window.getComputedStyle
                      ? window.getComputedStyle(span).color
                      : null;
                break;
              }
            }
          }
        }

        const normalizeColor = (c) =>
          c ? c.toString().replace(/\s+/g, '').toLowerCase() : '';
        targetColor = normalizeColor(targetColor);

        let distsToQuery = distritosList.filter((d) => {
          if (catType === 'hoje') return PN(d.qtdeHoje) > 0;
          if (catType === 'vencidos') return PN(d.qtdeVencido) > 0;
          return PN(d.qtdeAVencer) > 0;
        });

        let allObjs = [];
        let done = 0;
        let success = 0;
        let failed = 0;
        const total = distsToQuery.length;
        const maxEntPlaceholder = document.getElementById('ct-arq-progress');

        for (const dist of distsToQuery) {
          try {
            const rsp = await fetch(
              `https://sroweb.correios.com.br/app/entregaexternaautomatica/loecsuspensa/controllers/objetoController.php?acao=listar&idLancamento=${dist.idLancamento}`
            );
            const arr = await rsp.json();
            success++;

            for (const obj of arr) {
              const c = normalizeColor(obj.cor);
              let match = false;
              if (targetColor && c) {
                if (c === targetColor) match = true;
                else if (
                  c.includes('rgb') &&
                  targetColor.includes('rgb') &&
                  c.replace(/[^0-9,]/g, '') ===
                    targetColor.replace(/[^0-9,]/g, '')
                )
                  match = true;
                else if (catType === 'hoje' && c.includes('196,94,24'))
                  match = true;
              } else {
                if (
                  catType === 'hoje' &&
                  (c.includes('196,94,24') ||
                    c.includes('orange') ||
                    c.includes('#c45e18') ||
                    c.includes('#f97316'))
                )
                  match = true;
                if (
                  catType === 'vencidos' &&
                  (c === 'red' ||
                    c.includes('#ef4444') ||
                    c.includes('255,0,0'))
                )
                  match = true;
                if (
                  catType === 'avencer' &&
                  (c === 'green' ||
                    c.includes('#10b981') ||
                    c.includes('0,128,0'))
                )
                  match = true;
              }

              if (match) {
                allObjs.push({
                  dist: dist.numeroDistrito,
                  mat: dist.matriculaCarteiro,
                  nom: dist.nomeCarteiro,
                  sro: dist.codigoSro,
                  ...obj
                });
              }
            }
          } catch (e) {
            failed++;
          }
          done++;
          if (maxEntPlaceholder) {
            maxEntPlaceholder.innerHTML = `Consultando: ${done} / ${total} concluídos <br><span style="color:#10b981;">Sucesso: ${success}</span> | <span style="color:#ef4444;">Falha: ${failed}</span>`;
          }
        }

        if (allObjs.length === 0) {
          resultEl.innerHTML =
            '<div style="padding:10px;text-align:center;color:#ef4444;">Nenhum objeto encontrado na categoria especificada! Tente buscar manualmente nas listas expandidas.</div>';
          exportEl.style.display = 'none';
        } else {
          window._ctArqLastData = { cat: EXPORT_CAT, objs: allObjs };
          exportEl.style.display = 'block';

          window._parseDist = (dStr) => {
            const match = (dStr || '').match(/^(\d)(\d*)\s*([a-zA-Z]*)/i);
            if (match)
              return {
                grade: match[1],
                side: match[3] ? match[3].toUpperCase() : ''
              };
            return { grade: '', side: '' };
          };

          const distFilterEl = document.getElementById('ct-arq-dist-filter');
          const gradeFilterEl = document.getElementById('ct-arq-grade-filter');
          const sideFilterEl = document.getElementById('ct-arq-side-filter');

          const dists = [...new Set(allObjs.map((o) => o.dist))].sort();
          const grades = [
            ...new Set(
              allObjs
                .map((o) => window._parseDist(o.dist).grade)
                .filter(Boolean)
            )
          ].sort();
          const sides = [
            ...new Set(
              allObjs.map((o) => window._parseDist(o.dist).side).filter(Boolean)
            )
          ].sort();

          if (distFilterEl)
            distFilterEl.innerHTML =
              '<option value="">Todos os Distritos</option>' +
              dists.map((d) => `<option value="${d}">${d}</option>`).join('');
          if (gradeFilterEl)
            gradeFilterEl.innerHTML =
              '<option value="">Todas as Grades</option>' +
              grades
                .map((g) => `<option value="${g}">Grade ${g}</option>`)
                .join('');
          if (sideFilterEl)
            sideFilterEl.innerHTML =
              '<option value="">Todos os Lados</option>' +
              sides
                .map((s) => `<option value="${s}">Lado ${s}</option>`)
                .join('');

          exportEl.style.display = 'block';
          renderArqTable();
        }

        btn.innerText = oldText;
        btn.disabled = false;
      };

            const getArqFilters = () => ({
        mode: document.getElementById('ct-arq-export-mode')?.value || '3',
        dist: document.getElementById('ct-arq-dist-filter')?.value,
        grade: document.getElementById('ct-arq-grade-filter')?.value,
        side: document.getElementById('ct-arq-side-filter')?.value
      });

      const getFilteredObjs = (data, filters) => {
        if (!data || !data.objs) return [];
        return data.objs.filter((o) => {
          if (filters.dist && o.dist !== filters.dist) return false;
          if (filters.grade || filters.side) {
            const parsed = window._parseDist ? window._parseDist(o.dist) : { grade: '', side: '' };
            if (filters.grade && parsed.grade !== filters.grade) return false;
            if (filters.side && parsed.side !== filters.side) return false;
          }
          return true;
        });
      };

      const renderArqTable = () => {
        const resultEl = document.getElementById('ct-arq-result');
        const d = window._ctArqLastData;
        if (!d || !d.objs || d.objs.length === 0) {
          resultEl.innerHTML =
            '<div style="padding:10px;text-align:center;color:#ef4444;">Nenhum objeto encontrado na categoria especificada!</div>';
          return;
        }

        const filters = getArqFilters();
        const mode = filters.mode;
        const filteredObjs = getFilteredObjs(d, filters);

        if (filteredObjs.length === 0) {
          resultEl.innerHTML =
            '<div style="padding:10px;text-align:center;color:#ef4444;">Nenhum objeto retornado para este filtro.</div>';
          return;
        }

        let html = `<div style="margin-bottom:12px;font-weight:bold;color:#334155;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">Pré-visualização: ${filteredObjs.length} objetos</div>`;
        html +=
          '<table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">';

        if (mode === '1') {
          html +=
            '<thead><tr style="color:#64748b;"><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Distrito</th><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Objeto</th></tr></thead><tbody>';
        } else if (mode === '2') {
          html +=
            '<thead><tr style="color:#64748b;"><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Distrito</th><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Endereço</th></tr></thead><tbody>';
        } else {
          html +=
            '<thead><tr style="color:#64748b;"><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Distrito</th><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Objeto</th><th style="padding:8px;border-bottom:2px solid #cbd5e1;">Demais Dados</th></tr></thead><tbody>';
        }

        for (const o of filteredObjs) {
          html += `<tr style="border-bottom:1px solid #f1f5f9;">
               <td style="padding:8px;font-weight:bold;width:80px;">${o.dist}</td>`;
          if (mode === '1') {
            html += `<td style="padding:8px;color:${o.cor || 'inherit'};font-weight:bold;">${o.objeto || '--'}</td>`;
          } else if (mode === '2') {
            html += `<td style="padding:8px;color:#475569;">${o.endereco || ''} - ${o.cep || ''}</td>`;
          } else {
            html += `<td style="padding:8px;color:${o.cor || 'inherit'};font-weight:bold;width:140px;">${o.objeto || '--'}</td>
               <td style="padding:8px;color:#475569;">
                 <div style="margin-bottom:4px;">${o.endereco || ''} - ${o.cep || ''}</div>
                 <div style="font-size:11px;color:#94a3b8;">Max. Entrega: ${o.dataMaximaEntrega ? o.dataMaximaEntrega.replace('T', ' ') : ''}</div>
               </td>`;
          }
          html += `</tr>`;
        }
        html += '</tbody></table>';
        resultEl.innerHTML = html;
      };

      document
        .getElementById('ct-arq-export-mode')
        ?.addEventListener('change', renderArqTable);
      document
        .getElementById('ct-arq-dist-filter')
        ?.addEventListener('change', renderArqTable);

      const formatExport = (data, filters) => {
        if (!data || !data.objs || data.objs.length === 0) return '';
        const mode = filters.mode;
        const filteredObjs = getFilteredObjs(data, filters);

        if (filteredObjs.length === 0) return '';

        const groups = {};
        for (const o of filteredObjs) {
          const k =
            o.dist +
            '-' +
            (o.sro || '') +
            '-' +
            (o.nom || '') +
            '-' +
            (o.mat || '');
          if (!groups[k]) groups[k] = [];
          groups[k].push(o);
        }

        let out = [];
        let isFirstGroup = true;
        for (const k in groups) {
          if (!isFirstGroup) out.push('');
          isFirstGroup = false;

          const groupObjs = groups[k];
          const first = groupObjs[0];
          const mat = first.mat || '00000000';
          const nom = first.nom || 'N/A';
          const sro = first.sro || '00000000';

          out.push(
            `Nome: ${nom} - Matrícula: ${mat} - Unidade: ${sro} - Quantidade: ${groupObjs.length} - Categoria: ${data.cat} - Distrito: ${first.dist}`
          );

          for (const o of groupObjs) {
            let line = '';
            if (mode === '1') {
              line = o.objeto || '--';
            } else if (mode === '2') {
              line = `${o.endereco || ''} ${o.cep || ''}`.trim();
            } else {
              line =
                `${o.objeto || '--'} - ${o.endereco || ''} ${o.cep || ''}`.trim();
            }
            out.push(line);
          }
        }
        return out.join('\r\n');
      };

      document
        .getElementById('ct-arq-export-mode')
        ?.addEventListener('change', renderArqTable);
      document
        .getElementById('ct-arq-dist-filter')
        ?.addEventListener('change', renderArqTable);
      document
        .getElementById('ct-arq-grade-filter')
        ?.addEventListener('change', renderArqTable);
      document
        .getElementById('ct-arq-side-filter')
        ?.addEventListener('change', renderArqTable);

      document
        .getElementById('ct-arq-btn-copy')
        ?.addEventListener('click', () => {
          const filters = getArqFilters();
          const txt = formatExport(window._ctArqLastData, filters);
          if (!txt) return;
          navigator.clipboard.writeText(txt);
        });

      document
        .getElementById('ct-arq-btn-txt')
        ?.addEventListener('click', () => {
          const filters = getArqFilters();
          const txt = formatExport(window._ctArqLastData, filters);
          if (!txt) return;

          const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);

          let n = `Export_${window._ctArqLastData.cat}`;
          if (filters.grade) n += '_G' + filters.grade;
          if (filters.side) n += '_L' + filters.side;
          if (filters.dist) n += '_' + filters.dist.replace(/\s+/g, '_');

          link.download = n + '.txt';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });

      document
        .getElementById('btn-arq-hoje')
        ?.addEventListener('click', () => arqFetch('hoje'));
      document
        .getElementById('btn-arq-vencidos')
        ?.addEventListener('click', () => arqFetch('vencidos'));
      document
        .getElementById('btn-arq-avencer')
        ?.addEventListener('click', () => arqFetch('avencer'));

      new window['Chart'](document.getElementById('chartjs-status'), {
        type: 'doughnut',
        data: {
          labels: ['Vencidos', 'Vencem Hoje', 'A Vencer'],
          datasets: [
            {
              data: [totalVencidos, totalHoje, totalAVencer],
              backgroundColor: ['#ef4444', '#f97316', '#10b981'],
              borderWidth: 0,
              hoverOffset: 4
            }
          ]
        },
        options: {
          responsive: !0,
          maintainAspectRatio: !1,
          cutout: '50%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: !0,
                font: { family: 'system-ui' }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(15,23,42,0.9)',
              padding: 12,
              cornerRadius: 8
            }
          }
        }
      });

      new window['Chart'](document.getElementById('chartjs-volume'), {
        type: 'bar',
        data: {
          labels: topDistritos.map((d) => d.numeroDistrito),
          datasets: [
            {
              label: 'Volume',
              data: topDistritos.map((d) => d.qtde),
              backgroundColor: '#3b82f6',
              borderRadius: 4,
              barPercentage: 0.85,
              categoryPercentage: 0.9
            }
          ]
        },
        options: {
          responsive: !0,
          maintainAspectRatio: !1,
          plugins: {
            legend: { display: !1 },
            tooltip: {
              backgroundColor: 'rgba(15,23,42,0.9)',
              padding: 12,
              cornerRadius: 8
            }
          },
          scales: {
            y: {
              beginAtZero: !0,
              grid: { color: '#e2e8f0' },
              border: { display: !1 },
              ticks: { font: { family: 'system-ui' }, color: '#64748b' }
            },
            x: {
              grid: { display: !1 },
              border: { display: !1 },
              ticks: { font: { family: 'system-ui' }, color: '#64748b' }
            }
          }
        }
      });

      const grid = document.getElementById('ct-dist-grid');
      distritosList.forEach((d) => {
        const card = document.createElement('div');
        card.style.cssText =
          'background:#fff;border:1px solid #e2e8f0;padding:10px 15px;border-radius:6px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:all 0.2s;display:flex;flex-direction:column;justify-content:center;';
        card.onmouseover = () => {
          card.style.borderColor = '#3b82f6';
          card.style.transform = 'translateY(-2px)';
        };
        card.onmouseout = () => {
          card.style.borderColor = '#e2e8f0';
          card.style.transform = 'translateY(0)';
        };
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-size:24px;font-weight:900;color:#0f172a;line-height:1;">${d.numeroDistrito}</div>
            <div style="display:flex;gap:6px;background:#f8fafc;padding:4px 8px;border-radius:4px;border:1px solid #f1f5f9;">
              <span style="color:#ef4444;font-size:12px;font-weight:bold;">V:${PN(d.qtdeVencido)}</span>
              <span style="color:#f97316;font-size:12px;font-weight:bold;">H:${PN(d.qtdeHoje)}</span>
              <span style="color:#10b981;font-size:12px;font-weight:bold;">A:${PN(d.qtdeAVencer)}</span>
            </div>
          </div>
          <div style="font-size:13px;color:#333;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${d.nomeCarteiro || 'NÃO ATRIBUÍDO'}">${d.nomeCarteiro || 'NÃO ATRIBUÍDO'}</div>
        `;

        card.onclick = () => {
          const dt = new Date();
          dt.setHours(dt.getHours() - 24);
          const defDate = dt.toISOString().slice(0, 10);

          mod.style.display = 'flex';
          mod.innerHTML = `
            <div style="background:#fff;width:95%;max-width:1100px;height:85vh;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
              <div style="background-color:#00416B !important;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:4px solid #FFE600 !important;">
                <div style="color:#ffffff !important;">
                  <h2 style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.5px;color:#ffffff !important;">DISTRITO ${d.numeroDistrito}</h2>
                  <div style="font-size:14px;color:#FFE600 !important;font-weight:700;margin-top:4px;text-transform:uppercase;">${d.nomeCarteiro || 'SEM NOME'} &nbsp;|&nbsp; MATRÍCULA: ${d.matriculaCarteiro || '--'}</div>
                </div>
                <button id="ct-close-mod" style="background:transparent !important;border:none !important;color:#ffffff !important;font-size:28px;cursor:pointer;padding:0;line-height:1;transition:0.2s;" onmouseover="this.style.color='#FFE600'" onmouseout="this.style.color='#fff'">×</button>
              </div>
              <div style="padding:16px 24px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;gap:16px;align-items:center;">
                <div style="display:flex;flex-direction:column;flex:1;max-width:300px;">
                  <label style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Data do Relatório SRO Monitor</label>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <button id="ct-mod-prev" style="background:#e2e8f0;border:1px solid #cbd5e1;color:#334155;border-radius:6px;width:34px;height:34px;cursor:pointer;font-weight:bold;font-size:16px;display:flex;align-items:center;justify-content:center;transition:0.2s;" onmouseover="this.style.background='#cbd5e1'" onmouseout="this.style.background='#e2e8f0'">◄</button>
                    <input type="date" id="ct-mod-date" value="${defDate}" style="padding:0 12px;height:34px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:14px;color:#334155;outline:none;cursor:pointer;font-weight:600;flex:1;">
                    <button id="ct-mod-next" style="background:#e2e8f0;border:1px solid #cbd5e1;color:#334155;border-radius:6px;width:34px;height:34px;cursor:pointer;font-weight:bold;font-size:16px;display:flex;align-items:center;justify-content:center;transition:0.2s;" onmouseover="this.style.background='#cbd5e1'" onmouseout="this.style.background='#e2e8f0'">►</button>
                  </div>
                </div>
                <div style="flex:1;display:flex;justify-content:flex-end;align-items:center;">
                  <button id="ct-mod-reload" style="background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:0 20px;height:34px;line-height:34px;font-weight:600;font-size:13px;cursor:pointer;display:inline-block;box-shadow:0 1px 3px rgba(0,0,0,0.1);transition:background 0.2s;white-space:nowrap;width:max-content;" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">↻ Atualizar Relatório</button>
                </div>
              </div>
              <div id="ct-mod-body" style="flex:1;overflow-y:auto;padding:24px;background:#f1f5f9;"></div>
            </div>
          `;

          document.getElementById('ct-close-mod').onclick = () =>
            (mod.style.display = 'none');

          const dtInput = document.getElementById('ct-mod-date');
          const btnPrev = document.getElementById('ct-mod-prev');
          const btnNext = document.getElementById('ct-mod-next');
          const btnReload = document.getElementById('ct-mod-reload');
          const body = document.getElementById('ct-mod-body');

          const fetchAndRender = async () => {
            const date = dtInput.value;
            body.innerHTML =
              '<div style="text-align:center;padding:40px;color:#3b82f6;font-weight:700;font-size:16px;">Acessando SRO Monitor e processando dados...</div>';
            try {
              const u = `https://sromonitor.correios.com.br/app/analitico-unidade-se/index.php?data=${date}&unidade=${d.codigoSro}&matricula=${d.matriculaCarteiro}`;

              const t = await fetchMonitor(u);

              const p = new DOMParser();
              const doc = p.parseFromString(t, 'text/html');
              const rows = doc.querySelectorAll('#analiticounidadese tbody tr');

              if (
                rows.length === 0 ||
                (rows.length === 1 && rows[0].innerText.includes('Nenhum'))
              ) {
                body.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;font-weight:bold;font-size:16px;">Nenhum registro de distribuição em ${date.split('-').reverse().join('/')}.</div>`;
                return;
              }

              const stats = {};
              const listMap = {};
              rows.forEach((tr) => {
                const tds = tr.querySelectorAll('td');
                if (tds.length >= 7) {
                  const obj = tds[4].innerText.trim();
                  const mot = tds[6].innerText.trim();
                  listMap[obj] = mot;
                }
              });

              const list = [];
              Object.entries(listMap).forEach(([obj, mot]) => {
                if (!stats[mot]) stats[mot] = 0;
                stats[mot]++;
                list.push({ obj, mot });
              });

              let filteredList = [...list];
              const cid = 'ct-pie-' + Date.now();
              const cats = Object.keys(stats).sort();

              body.innerHTML = `
                <div style="display:flex;flex-wrap:wrap;gap:20px;margin-bottom:24px;">
                  <div style="flex:1;min-width:300px;background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);border:1px solid #e2e8f0;height:300px;position:relative;">
                    <canvas id="${cid}"></canvas>
                  </div>
                  <div style="flex:1;min-width:300px;display:flex;flex-direction:column;gap:12px;height:300px;overflow-y:auto;padding-right:10px;">
                    ${Object.entries(stats)
                      .sort((a, b) => b[1] - a[1])
                      .map(
                        (s) => `
                      <div style="background:#fff;padding:14px 18px;border-radius:6px;border-left:5px solid #3b82f6;display:flex;justify-content:space-between;align-items:center;box-shadow:0 1px 2px rgba(0,0,0,0.05);border:1px solid #e2e8f0;">
                        <span style="font-size:12px;font-weight:800;color:#334155;text-transform:uppercase;">${s[0]}</span>
                        <div style="display:flex;align-items:center;gap:12px;">
                          <button class="ct-btn-copy" data-cat="${s[0]}" style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;color:#3b82f6;padding:4px 8px;cursor:pointer;font-weight:bold;font-size:10px;transition:0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'" title="Copiar para a Área de Transferência">📋</button>
                          <button class="ct-btn-export" data-cat="${s[0]}" style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;color:#334155;padding:4px 8px;cursor:pointer;font-weight:bold;font-size:10px;transition:0.2s;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'" title="Baixar lista em .txt">📥 TXT</button>                         <span style="font-size:18px;font-weight:900;color:#0f172a;width:40px;text-align:right;display:inline-block;">${s[1]}</span>
                        </div>
                      </div>`
                      )
                      .join('')}
                  </div>
                </div>

                <div id="ct-sro-progress" style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;font-weight:bold;color:#3b82f6;display:flex;align-items:center;gap:12px;">
                  ⏳ Sincronizando com SRO Intranet: <span id="ct-sro-count">0</span> / ${list.length} objetos carregados...
                </div>

                <div style="background:#fff;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:16px;display:flex;flex-direction:column;gap:16px;">
                   <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
                     <div style="flex:1;min-width:200px;">
                        <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:6px;">Pesquisa de Objeto:</span>
                        <input type="text" id="ct-filter-obj" placeholder="Ex: NX123456789BR..." style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;outline:none;">
                     </div>
                     <div style="flex:1;min-width:200px;">
                        <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;display:block;margin-bottom:6px;">Ordenação:</span>
                        <select id="ct-sort-by" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;outline:none;cursor:pointer;background:#fff;">
                          <option value="default">Padrão</option>
                          <option value="motivo_asc">Motivo (A-Z)</option>
                          <option value="motivo_desc">Motivo (Z-A)</option>
                          <option value="objeto">Objeto (A-Z)</option>
                        </select>
                     </div>
                   </div>

                   <div>
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Filtro por Categorias (Motivos Inseridos):</span>
                          <div style="display:flex;gap:8px;flex-wrap:wrap;">
                              <button id="ct-cat-all" style="padding:6px 12px;font-size:11px;border-radius:4px;border:1px solid #cbd5e1;background:#f8fafc;cursor:pointer;font-weight:600;color:#334155;transition:0.2s;white-space:nowrap;width:auto;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f8fafc'">Selecionar Tudo</button>
                              <button id="ct-cat-none" style="padding:6px 12px;font-size:11px;border-radius:4px;border:1px solid #cbd5e1;background:#f8fafc;cursor:pointer;font-weight:600;color:#334155;transition:0.2s;white-space:nowrap;width:auto;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f8fafc'">Remover Seleção</button>
                          </div>
                      </div>
                      <div id="ct-filter-cat" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                          ${cats
                            .map(
                              (k, idx) => `
                             <label style="background:#f1f5f9;padding:6px 12px;border-radius:20px;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:6px;border:1px solid #cbd5e1;color:#334155;font-weight:600;transition:0.2s;white-space:nowrap;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                                <input type="checkbox" value="${k}" checked id="ct-chk-${idx}" style="cursor:pointer;margin:0;"> ${k}
                             </label>
                          `
                            )
                            .join('')}
                      </div>
                   </div>
                </div>

                <div style="background:#fff;border-radius:8px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);overflow:hidden;" id="ct-table-wrapper">
                  <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
                    <thead style="background-color:#00416B !important;border-bottom:3px solid #FFE600 !important;position:sticky;top:0;z-index:10;">
                      <tr>
                         <th style="padding:12px 20px;color:#ffffff !important;font-weight:800;text-transform:uppercase;width:150px;background-color:#00416B !important;">Objeto</th>
                         <th style="padding:12px 20px;color:#ffffff !important;font-weight:800;text-transform:uppercase;background-color:#00416B !important;">Motivo Registrado</th>
                         <th style="padding:12px 20px;color:#ffffff !important;font-weight:800;text-transform:uppercase;background-color:#00416B !important;width:160px;">Situação SRO Intranet</th>
                         <th style="padding:12px 20px;color:#ffffff !important;font-weight:800;text-transform:uppercase;background-color:#00416B !important;width:140px;">Data/Hora</th>
                         <th style="padding:12px 20px;color:#ffffff !important;font-weight:800;text-transform:uppercase;background-color:#00416B !important;width:120px;text-align:center;">Comprovante</th>
                      </tr>
                    </thead>
                    <tbody id="ct-tbody"></tbody>
                  </table>
                  <div id="ct-empty-msg" style="padding:24px;text-align:center;color:#64748b;font-weight:bold;font-size:13px;background:#f8fafc;border-top:1px solid #e2e8f0;display:none;">Nenhum objeto corresponde aos filtros.</div>
                </div>
              `;

              const tbody = document.getElementById('ct-tbody');
              const emptyMsg = document.getElementById('ct-empty-msg');
              const txtFilter = document.getElementById('ct-filter-obj');
              const sortFilter = document.getElementById('ct-sort-by');
              const chks = Array.from(
                document.querySelectorAll(
                  '#ct-filter-cat input[type="checkbox"]'
                )
              );

              const renderTable = () => {
                const txt = txtFilter.value.toLowerCase().trim();
                const selCats = chks
                  .filter((i) => i.checked)
                  .map((i) => i.value);
                const sort = sortFilter.value;

                if (selCats.length === 0) {
                  tbody.innerHTML = '';
                  emptyMsg.style.display = 'block';
                  emptyMsg.innerText =
                    'Nenhuma categoria selecionada. Marque alguma para exibir.';
                  return;
                }

                filteredList = list.filter((i) => {
                  if (txt && !i.obj.toLowerCase().includes(txt)) return false;
                  if (!selCats.includes(i.mot)) return false;
                  return true;
                });

                if (sort === 'motivo_asc') {
                  filteredList.sort((a, b) => a.mot.localeCompare(b.mot));
                } else if (sort === 'motivo_desc') {
                  filteredList.sort((a, b) => b.mot.localeCompare(a.mot));
                } else if (sort === 'objeto') {
                  filteredList.sort((a, b) => a.obj.localeCompare(b.obj));
                }

                if (filteredList.length === 0) {
                  tbody.innerHTML = '';
                  emptyMsg.style.display = 'block';
                  emptyMsg.innerText =
                    'Nenhum objeto corresponde aos filtros de texto/categoria.';
                } else {
                  emptyMsg.style.display = 'none';

                  let html = '';
                  filteredList.forEach((item, idx) => {
                    let isoDh = '';
                    if (item.dhSro) {
                      const [dPart, tPart] = item.dhSro.split(' ');
                      if (dPart && tPart) {
                        const [dia, mes, ano] = dPart.split('/');
                        isoDh = `${ano}-${mes}-${dia}T${tPart}`;
                      }
                    }

                    html += `
                      <tr style="border-bottom:1px solid #e2e8f0;background-color:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'} !important;transition:0.1s;">
                          <td style="padding:12px 20px;font-weight:bold;letter-spacing:0.5px;font-size:13px;color:#00416B !important;">
                             <a href="https://srointranet.correios.com.br/rastreamento?objetos=${item.obj}" target="_blank" style="text-decoration:none;color:#00416B !important;">${item.obj}</a>
                          </td>
                          <td style="padding:12px 20px;color:#000000 !important;font-weight:700;font-size:12px;">${item.mot}</td>
                          <td style="padding:12px 20px;color:${item.sitSro ? '#ef4444' : '#94a3b8'} !important;font-weight:${item.sitSro ? '800' : '500'};font-size:11px;text-transform:uppercase;">${item.sitSro || 'Aguardando SRO...'}</td>
                          <td style="padding:12px 20px;color:#64748b !important;font-weight:600;font-size:12px;">${item.dhSro || '--'}</td>
                          <td style="padding:12px 20px;text-align:center;">
                             ${isoDh ? `<button class="ct-btn-img" data-obj="${item.obj}" data-dh="${isoDh}" style="background:#10b981;border:none;border-radius:4px;color:#fff;padding:6px 10px;cursor:pointer;font-weight:bold;font-size:11px;transition:0.2s;" onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'" title="Ver Comprovante">VER</button>` : '--'}
                          </td>
                      </tr>
                    `;
                  });
                  tbody.innerHTML = html;
                }
              };

              txtFilter.addEventListener('input', renderTable);
              sortFilter.addEventListener('change', renderTable);
              chks.forEach((chk) =>
                chk.addEventListener('change', renderTable)
              );

              document
                .getElementById('ct-cat-all')
                .addEventListener('click', () => {
                  chks.forEach((c) => (c.checked = true));
                  renderTable();
                });
              document
                .getElementById('ct-cat-none')
                .addEventListener('click', () => {
                  chks.forEach((c) => (c.checked = false));
                  renderTable();
                });

              renderTable();

              if (body._hasCtClick)
                body.removeEventListener('click', body._hasCtClick);
              let lastTxt = 0;
              body._hasCtClick = (e) => {
                const btnImg = e.target.closest('.ct-btn-img');
                const btnExport = e.target.closest('.ct-btn-export');
                const btnCopy = e.target.closest('.ct-btn-copy');

                if (btnExport || btnCopy) {
                  if (Date.now() - lastTxt < 1000) return;
                  lastTxt = Date.now();
                  const targetBtn = btnExport || btnCopy;
                  const cat = targetBtn.dataset.cat;
                  const catList = list
                    .filter((i) => i.mot === cat)
                    .map((i) => i.obj);
                  const mat = d.matriculaCarteiro || '00000000';
                  const nom = d.nomeCarteiro || 'N/A';
                  const sro = d.codigoSro || '00000000';

                  const headerLine = `Nome: ${nom} - Matrícula: ${mat} - Unidade: ${sro} - Quantidade: ${catList.length} - Categoria: ${cat}`;
                  const content = [headerLine, ...catList].join('\r\n');

                  if (btnCopy) {
                    navigator.clipboard.writeText(content);
                  } else {
                    const blob = new Blob([content], {
                      type: 'text/plain;charset=utf-8'
                    });
                    const filename = `${sro}_${mat}_${cat.replace(/\s+/g, '_')}.txt`;
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }

                if (btnImg) {
                  const obj = btnImg.dataset.obj;
                  const dh = btnImg.dataset.dh;

                  const rand = Math.floor(Math.random() * 1000000);
                  const url = `https://srointranet.correios.com.br/imagem?objeto=${obj}&dataHora=${dh}&_t=${Date.now()}_${rand}`;
                  const m = document.createElement('div');
                  m.id = 'ct-img-modal-' + Date.now();
                  m.style.cssText =
                    'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.9);z-index:999999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);perspective:1000px;';

                  m.innerHTML = `
                      <div style="background:#1e293b;padding:16px;border-radius:12px;position:relative;width:auto;height:auto;min-width:300px;min-height:300px;max-width:85vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);border:1px solid #334155;">

                          <div style="position:absolute;bottom:24px;right:24px;display:flex;gap:12px;z-index:11;">
                            <button id="${m.id}-rotL" style="background:rgba(15,23,42,0.85);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:12px;width:54px;height:54px;cursor:pointer;font-size:24px;box-shadow:0 10px 15px rgba(0,0,0,0.3);backdrop-filter:blur(4px);transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.9)';this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(15,23,42,0.85)';this.style.transform='translateY(0)'" title="Rotacionar Esquerda">↺</button>
                            <button id="${m.id}-rotR" style="background:rgba(15,23,42,0.85);color:#fff;border:1px solid rgba(255,255,255,0.2);border-radius:12px;width:54px;height:54px;cursor:pointer;font-size:24px;box-shadow:0 10px 15px rgba(0,0,0,0.3);backdrop-filter:blur(4px);transition:all 0.2s;" onmouseover="this.style.background='rgba(59,130,246,0.9)';this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(15,23,42,0.85)';this.style.transform='translateY(0)'" title="Rotacionar Direita">↻</button>
                          </div>

                          <button id="${m.id}-close" style="position:absolute;top:-16px;right:-16px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-weight:bold;z-index:11;font-size:18px;box-shadow:0 4px 6px rgba(0,0,0,0.2);transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">✕</button>

                          <div id="${m.id}-ld" style="padding:50px;text-align:center;font-weight:bold;color:#60a5fa;font-size:15px;width:100%;height:100%;flex:1;display:flex;align-items:center;justify-content:center;">Buscando imagem no servidor...</div>

                          <div style="overflow:hidden;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#0f172a;flex:1;width:100%;min-height:200px;" id="${m.id}-img-wrap">
                            <img src="${url}" id="${m.id}-img" style="max-width:100%;max-height:calc(85vh - 32px);object-fit:contain;transition:transform 0.15s ease-out;display:none;transform-origin:center;" onload="this.style.display='block';document.getElementById('${m.id}-ld').style.display='none';this.parentElement.style.background='transparent';" onerror="document.getElementById('${m.id}-ld').innerHTML='<span style=&quot;font-size:24px;&quot;>⚠️</span><br><br>Imagem inexistente ou indisponível.';document.getElementById('${m.id}-ld').style.color='#ef4444';this.parentElement.style.display='none';">
                          </div>
                      </div>
                  `;

                  document.body.appendChild(m);

                  document
                    .getElementById(m.id + '-close')
                    .addEventListener('click', () => m.remove());

                  const img = document.getElementById(m.id + '-img');
                  let rotation = 0;

                  document
                    .getElementById(m.id + '-rotL')
                    .addEventListener('click', () => {
                      rotation -= 90;
                      img.style.transform = `rotate(${rotation}deg)`;
                    });
                  document
                    .getElementById(m.id + '-rotR')
                    .addEventListener('click', () => {
                      rotation += 90;
                      img.style.transform = `rotate(${rotation}deg)`;
                    });
                }
              };
              body.addEventListener('click', body._hasCtClick);

              const fetchSRO = async () => {
                let loadedSRO = 0;
                const batchSize = 50;
                const countLbl = document.getElementById('ct-sro-count');
                const progDiv = document.getElementById('ct-sro-progress');

                const maxConcurrent = 3;
                const chunks = [];
                for (let i = 0; i < list.length; i += batchSize) {
                  chunks.push(list.slice(i, i + batchSize));
                }

                let currentChunk = 0;
                const worker = async () => {
                  while (currentChunk < chunks.length) {
                    const chunk = chunks[currentChunk++];
                    const objs = chunk.map((c) => c.obj).join(';');
                    try {
                      const r = await fetchMonitor(
                        'https://srointranet.correios.com.br/rastreamento?objetos=' +
                          objs
                      );
                      const d2 = new DOMParser().parseFromString(
                        r,
                        'text/html'
                      );
                      const mapMap = {};
                      chunk.forEach((c) => (mapMap[c.obj] = c));

                      d2.querySelectorAll('a[Name="Detalhes"]').forEach((a) => {
                        const o = a.innerText.trim();
                        if (mapMap[o]) {
                          const td = a.closest('td');
                          if (td && td.parentElement) {
                            const tds = td.parentElement.querySelectorAll('td');
                            if (tds.length >= 4) {
                              mapMap[o].dhSro = tds[1].innerText.trim();
                              mapMap[o].sitSro = tds[3].innerText.trim();
                            }
                          }
                        }
                      });
                    } catch (e) {
                      console.error('Batch err', e);
                    }
                    loadedSRO += chunk.length;
                    if (countLbl) countLbl.innerText = loadedSRO;
                    renderTable();
                  }
                };

                const workers = Array.from(
                  { length: Math.min(maxConcurrent, chunks.length) },
                  () => worker()
                );
                await Promise.all(workers);

                if (progDiv) {
                  progDiv.style.backgroundColor = '#f0fdf4';
                  progDiv.style.color = '#15803d';
                  progDiv.style.borderColor = '#bbf7d0';
                  progDiv.innerHTML =
                    'Download de SRO Concluído: Todos os ' +
                    list.length +
                    ' objetos carregados.';
                }
              };

              new window['Chart'](document.getElementById(cid), {
                type: 'pie',
                data: {
                  labels: Object.keys(stats),
                  datasets: [
                    {
                      data: Object.values(stats),
                      backgroundColor: [
                        '#3b82f6',
                        '#ef4444',
                        '#10b981',
                        '#f97316',
                        '#8b5cf6',
                        '#ec4899',
                        '#14b8a6',
                        '#eab308'
                      ],
                      borderWidth: 0
                    }
                  ]
                },
                options: {
                  responsive: !0,
                  maintainAspectRatio: !1,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 12,
                        font: { family: 'system-ui', size: 11 }
                      }
                    }
                  }
                }
              });

              await fetchSRO();
            } catch (err) {
              body.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444;font-weight:bold;font-size:16px;">Falha ao consultar SRO Monitor.<br><br><span style="font-size:13px;color:#64748b;font-weight:normal;">Motivo Técnico: ${err.message}</span></div>`;
            }
          };

          const triggerUpdate = () => {
            dtInput.style.pointerEvents = 'none';
            dtInput.style.opacity = '0.5';
            btnPrev.style.pointerEvents = 'none';
            btnNext.style.pointerEvents = 'none';
            btnReload.style.pointerEvents = 'none';
            btnReload.style.opacity = '0.5';
            btnReload.innerHTML = '⏳ Aguardando...';

            fetchAndRender().finally(() => {
              dtInput.style.pointerEvents = 'auto';
              dtInput.style.opacity = '1';
              btnPrev.style.pointerEvents = 'auto';
              btnNext.style.pointerEvents = 'auto';

              let left = 5;
              btnReload.innerHTML = `⏳ Aguarde ${left}s`;
              const iv = setInterval(() => {
                left--;
                if (left <= 0) {
                  clearInterval(iv);
                  btnReload.style.pointerEvents = 'auto';
                  btnReload.style.opacity = '1';
                  btnReload.innerHTML = '↻ Atualizar Relatório';
                } else {
                  btnReload.innerHTML = `⏳ Aguarde ${left}s`;
                }
              }, 1000);
            });
          };

          const changeDate = (offset) => {
            const curr = new Date(dtInput.value);
            if (isNaN(curr)) return;
            curr.setDate(curr.getDate() + offset);
            dtInput.value = curr.toISOString().slice(0, 10);
            triggerUpdate();
          };

          dtInput.onchange = triggerUpdate;
          btnPrev.onclick = () => changeDate(-1);
          btnNext.onclick = () => changeDate(1);
          btnReload.onclick = triggerUpdate;

          fetchAndRender().finally(() => {
            // After initial render, disable reload button for 5 seconds to prevent spam
            btnReload.style.pointerEvents = 'none';
            btnReload.style.opacity = '0.5';
            let left = 5;
            btnReload.innerHTML = `⏳ Aguarde ${left}s`;
            const iv = setInterval(() => {
              left--;
              if (left <= 0) {
                clearInterval(iv);
                btnReload.style.pointerEvents = 'auto';
                btnReload.style.opacity = '1';
                btnReload.innerHTML = '↻ Atualizar Relatório';
              } else {
                btnReload.innerHTML = `⏳ Aguarde ${left}s`;
              }
            }, 1000);
          });
        };
        grid.appendChild(card);
      });
    }

    function PRL(u, t) {
      if (u && u.includes('lancamentoController.php?acao=listar'))
        try {
          const j = typeof t === 'string' ? JSON.parse(t) : t;
          if (Array.isArray(j)) setTimeout(() => RCD(j), 350);
        } catch (e) {}
    }

    const oF = window.fetch;
    window.fetch = async function (...a) {
      const r = await oF.apply(this, a);
      try {
        const u = a[0] ? a[0].toString() : '';
        if (u.includes('lancamentoController.php?acao=listar'))
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
      this.addEventListener('load', function () {
        if (this._u && this._u.includes('lancamentoController.php?acao=listar'))
          try {
            PRL(this._u, JSON.parse(this.responseText));
          } catch (e) {}
      });
      return oS.apply(this, arguments);
    };
  }
})();
