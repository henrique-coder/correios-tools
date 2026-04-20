function runLancamentoAutomaticoRuntime(core) {
  const { __cwStore, fetchMonitor } = core;
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
              const inv = v === '' || v === 'N/A' || v === 'S/A' || v === 'S/N';

              if (inv) {
                if (__cwStore.sroBP !== S.code) {
                  __cwStore.sroBP = S.code;
                  txtNum.focus();
                  txtNum.select();
                  return;
                }
              } else {
                __cwStore.sroBP = null;
              }

              __cwStore.sroBP = null;
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

  const STORAGE_KEYS = {
    PANEL_POSITION: 'CORREIOS_WIZARD::PANEL_POSITION',
    AUTO_CLOSE_PRINT: 'CORREIOS_WIZARD::AUTO_CLOSE_PRINT'
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
  let autoClosePrintEnabled =
    window.localStorage.getItem(STORAGE_KEYS.AUTO_CLOSE_PRINT) !== '0';

  function isAutoClosePrintEnabled() {
    return autoClosePrintEnabled;
  }

  function setAutoClosePrintEnabled(enabled) {
    autoClosePrintEnabled = !!enabled;
    window.localStorage.setItem(
      STORAGE_KEYS.AUTO_CLOSE_PRINT,
      autoClosePrintEnabled ? '1' : '0'
    );
  }

  function stopAutoCloseWatcher() {
    if (atcInt) {
      clearInterval(atcInt);
      atcInt = null;
    }
    if (okInt) {
      clearInterval(okInt);
      okInt = null;
    }
  }

  function syncAutoCloseToggleUI() {
    const btn = document.getElementById('cw-auto-close-print-toggle');
    if (!btn) return;
    const enabled = isAutoClosePrintEnabled();
    btn.innerText = '🖨';
    btn.style.width = '24px';
    btn.style.height = '24px';
    btn.style.padding = '0';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.fontSize = '12px';
    btn.style.lineHeight = '1';
    btn.style.borderRadius = '999px';
    btn.style.transition =
      'transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease, background 120ms ease, border-color 120ms ease, color 120ms ease';
    btn.style.opacity = enabled ? '0.82' : '1';
    btn.style.background = enabled ? '#f1f5f9' : '#fef2f2';
    btn.style.borderColor = enabled ? '#cbd5e1' : '#fecaca';
    btn.style.color = enabled ? '#64748b' : '#b91c1c';
    btn.style.boxShadow = enabled
      ? 'inset 0 0 0 1px rgba(100,116,139,0.16)'
      : 'inset 0 0 0 1px rgba(220,38,38,0.14)';
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.title = enabled
      ? 'Fechamento automatico de popups de impressao: habilitado'
      : 'Fechamento automatico de popups de impressao: desabilitado';
  }

  function FC(c) {
    if (!c || c.length !== 13) return c || '';
    return `<strong style="color:#00416B">${c.slice(0, 2)}</strong> ${c.slice(2, 5)} ${c.slice(5, 8)} <strong style="color:#00416B">${c.slice(8, 11)}</strong> ${c.slice(11)}`;
  }

  function SP() {
    window.localStorage.setItem(
      STORAGE_KEYS.PANEL_POSITION,
      JSON.stringify({ x: D.xOff, y: D.yOff })
    );
  }

  function LP(el) {
    try {
      const p = JSON.parse(
        window.localStorage.getItem(STORAGE_KEYS.PANEL_POSITION) || '{x:0,y:0}'
      );
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
      c.innerHTML = `<div id="sro-card" class="sro-card mode-loading"><div id="sro-header" class="sro-header" title="Segure para mover"><div class="sro-status-block"><span id="sro-icon" class="sro-icon">⏳</span><span id="sro-status" class="sro-status-text">AGUARDANDO...</span></div><div class="sro-btn-group"><button id="cw-auto-close-print-toggle" type="button" style="width:24px;height:24px;padding:0;font-size:12px;border:1px solid #cbd5e1;border-radius:999px;background:#f1f5f9;color:#64748b;cursor:pointer;line-height:1;display:inline-flex;align-items:center;justify-content:center;">⎙</button></div></div><div class="sro-body"><div id="sro-tracking" style="font-size:13px;color:#888;font-weight:700;letter-spacing:0.5px;margin-bottom:2px;min-height:16px"></div><div id="sro-distrito" class="sro-distrito">--</div><div style="font-size:12px;color:#666;margin-top:4px">PREVISÃO: <strong id="sro-previsao" style="color:#333">--/--/----</strong></div></div></div>`;
      document.body.appendChild(c);

      const autoCloseBtn = document.getElementById(
        'cw-auto-close-print-toggle'
      );
      if (autoCloseBtn) {
        autoCloseBtn.addEventListener('mouseenter', () => {
          const enabled = isAutoClosePrintEnabled();
          autoCloseBtn.style.transform = 'translateY(-1px) scale(1.04)';
          autoCloseBtn.style.boxShadow = enabled
            ? '0 4px 10px rgba(100,116,139,0.22)'
            : '0 4px 10px rgba(220,38,38,0.18)';
          autoCloseBtn.style.opacity = '1';
        });

        autoCloseBtn.addEventListener('mouseleave', () => {
          autoCloseBtn.style.transform = 'none';
          syncAutoCloseToggleUI();
        });

        autoCloseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const enabled = !isAutoClosePrintEnabled();
          setAutoClosePrintEnabled(enabled);
          syncAutoCloseToggleUI();

          if (enabled) ATC();
          else stopAutoCloseWatcher();
        });
        syncAutoCloseToggleUI();
      }

      LP(c);
      STD(document.getElementById('sro-header'), c);
    }
    syncAutoCloseToggleUI();
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
    if (u && u.toLowerCase().includes('listar-impressoras-disponiveis')) ATC();
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
    if (!isAutoClosePrintEnabled()) {
      stopAutoCloseWatcher();
      return;
    }

    stopAutoCloseWatcher();
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
      if (v && v.includes(' - ')) v = v.split(' - ')[0];
      S.domDist = v && v.trim() !== '' && v !== 'Selecione...' ? v.trim() : '';
      RDP();
    };
    s.addEventListener('change', f);
    s.addEventListener('input', f);

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
}
