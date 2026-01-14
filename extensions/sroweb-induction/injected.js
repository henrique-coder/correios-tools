!function(){"use strict";const e="AGUARDANDO...",t="LENDO...",o="PRONTO P/ INDUZIR",r="NÃO INDUZIDO",s="JÁ INDUZIDO",n="OBJETO INDUZIDO",i="EXCLUÍDO",a="DISTRITO",c="PREVISÃO",u="Clique duas vezes para resetar a posição",p="Processando...",m="Validado",f="Objeto inválido",g="Objeto já consta na lista.",v="Inclusão confirmada.",h="Objeto removido da lista.",y="--/--/----",x="--",O="sro_position";
let L={code:x,status:e,mode:"loading",district:x,domDist:null,initialDist:null,date:y,exc:x,val:x,lastEvt:x,addr:{log:x,num:x,comp:x,bair:x,mun:x,uf:x,cep:x},serv:{ar:"N",mp:"N",dd:"N"},contact:{tel:x,email:x},op:{list:x,user:x,postman:x,st:x,ts:x,ord:x,side:x}},D=!1,k={active:!1,cX:0,cY:0,iX:0,iY:0,xOff:0,yOff:0};

function _ok(){let e=0;const t=setInterval(()=>{const o=document.querySelector("#alerta.aberto .act a");o&&"OK"===o.innerText&&(o.click(),clearInterval(t)),++e>=100&&clearInterval(t)},50)}
function _(){let e=0;const t=setInterval(()=>{const o=document.getElementById("btnImprimirEtiquetaNao");o&&(o.click(),clearInterval(t),_ok()),++e>=100&&clearInterval(t)},50)}

function MonInp(){
    setInterval(()=>{
        const msgs = document.querySelectorAll(".mensagem");
        const inp = document.getElementById("txtObjeto");
        if(inp && msgs.length > 0) {
            for(let m of msgs) {
                const txt = m.innerText || "";
                if(txt.includes("Formato de objeto postal inválido") || txt.includes("Preencha este campo")) {
                    inp.click(); inp.focus(); break;
                }
            }
        }
    }, 300);
}

function MonSel(){
    setInterval(()=>{
        const sel = document.getElementById("selDistrito");
        if(sel){
            const val = sel.value;
            if(val !== L.domDist){
                L.domDist = val;
                U();
            }
        }
    }, 200);
}

function fmtTime(e){if(!e||e.length<18)return x;const t=e.substring(8,10)+"/"+e.substring(10,12)+"/"+e.substring(12,16),o=e.substring(16,18)+":"+e.substring(18,20);return`${t} às ${o}`}

function getVisualDist(){
    let current = L.domDist && L.domDist !== "" ? L.domDist : L.district;
    if(current) current = current.trim();
    
    if(L.initialDist && L.initialDist !== x) {
        if(current && current !== x && current !== L.initialDist) {
            return `<div style="display:flex;align-items:center;justify-content:center"><span class="sro-old">${L.initialDist}</span><span class="sro-arrow">➜</span><span class="sro-new">${current}</span></div>`;
        } else {
            return `<span class="sro-new">${L.initialDist}</span>`;
        }
    }
    return `<span class="sro-new">${current||x}</span>`;
}

function T(){
    if(document.getElementById("sro-styles"))return;
    const t=document.createElement("style");
    t.id="sro-styles",t.innerHTML=`
      #sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); will-change: transform; }
      .sro-card { width: 360px; background: #fff; border-radius: 6px; font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; opacity: 0; transition: opacity 0.2s; border-left: 8px solid #999; display: none; }
      .sro-card.visible { display: block; opacity: 1; }
      .sro-header { padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; background: #fdfdfd; border-bottom: 1px solid #eee; cursor: grab; user-select: none; }
      .sro-status-text { font-size: 0.95rem; font-weight: 800; text-transform: uppercase; color: #444; }
      .sro-body { padding: 12px; text-align: center; background: #fff; }
      .sro-distrito { font-size: 3rem; font-weight: 900; line-height: 1; color: #00416B; margin: 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; justify-content: center; align-items: center; min-height: 50px; }
      .sro-old { font-size: 2rem; opacity: 0.35; font-weight: 700; color: #000; margin-right: 5px; }
      .sro-arrow { font-size: 2rem; margin: 0 10px; color: #444; font-weight: 400; }
      .sro-new { color: #00416B; font-size: 3rem; font-weight: 900; }
      
      .mode-loading { border-left-color: #7f8c8d; } 
      .mode-success { border-left-color: #009688; } .mode-success .sro-header { background: #e0f2f1; } .mode-success .sro-status-text { color: #00695c; }
      .mode-error { border-left-color: #d32f2f; } .mode-error .sro-header { background: #ffebee; } .mode-error .sro-status-text { color: #c62828; }
      .mode-info { border-left-color: #1976d2; } .mode-info .sro-header { background: #e3f2fd; } .mode-info .sro-status-text { color: #0d47a1; }

      #sro-table-wrapper { margin-top: 25px; font-family: 'Segoe UI', Tahoma, sans-serif; border: 1px solid #ccc; background: #fff; width: 100%; box-sizing: border-box; clear: both; }
      .sro-table-header { background: #00416B; color: #ffffff !important; padding: 8px 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; display: flex; justify-content: space-between; border-bottom: 3px solid #FFE600; }
      
      .sro-full-table { width: 100%; border-collapse: collapse; font-size: 11px; }
      .sro-full-table th { background: #f0f0f0; color: #333; text-align: left; padding: 5px 8px; border: 1px solid #ddd; font-weight: 700; white-space: nowrap; width: 1%; }
      .sro-full-table td { padding: 5px 8px; border: 1px solid #ddd; color: #000; word-break: break-word; }
      
      .hl-val { color: #2e7d32; font-weight: 800; background: #e8f5e9; padding: 1px 4px; border-radius: 3px; }
      .hl-err { color: #c62828; font-weight: 800; background: #ffebee; padding: 1px 4px; border-radius: 3px; }
      .hl-dist { font-size: 15px; font-weight: 800; color: #00416B; }
      .hl-serv { background: #fff8e1; color: #ff8f00; padding: 0 3px; border-radius: 2px; font-weight: bold; border: 1px solid #ffecb3; margin-right: 3px; }
      .hl-serv-off { opacity: 0.2; margin-right: 3px; }
    `,document.head.appendChild(t);
    
    const o=document.createElement("div");o.id="sro-container",o.innerHTML=`
      <div id="sro-card" class="sro-card mode-loading">
        <div id="sro-header" class="sro-header" title="${u}">
          <span id="sro-status" class="sro-status-text">${e}</span>
          <span id="sro-icon" class="sro-icon">⏳</span>
        </div>
        <div class="sro-body">
          <div id="sro-distrito" class="sro-distrito">${x}</div>
          <div style="font-size:12px;color:#666;margin-top:4px">${c}: <strong id="sro-previsao" style="color:#333">${y}</strong></div>
        </div>
      </div>`,document.body.appendChild(o);

    // Initial Position Load (Immediate)
    try {
        const stored = JSON.parse(localStorage.getItem(O));
        if(stored && typeof stored.x === "number" && typeof stored.y === "number") {
            k.cX = stored.x; k.cY = stored.y; k.xOff = stored.x; k.yOff = stored.y;
            o.style.transform = `translate3d(${stored.x}px, ${stored.y}px, 0)`;
        }
    } catch(e){}

    const r=document.getElementById("sro-header");r.addEventListener("mousedown",S,!1),r.addEventListener("dblclick",$,!1),document.addEventListener("mouseup",B,!1),document.addEventListener("mousemove",N,!1),
    D=!0,InjT(),MonInp(),MonSel()
}

function InjT(){
    if(document.getElementById("sro-table-wrapper")) return;
    const b = document.querySelector(".botoes");
    if(!b) { setTimeout(InjT, 500); return; }
    const w = document.createElement("div"); w.id="sro-table-wrapper";
    w.innerHTML = `
        <div class="sro-table-header"><span style="color:#ffffff !important">DADOS OPERACIONAIS</span><span style="opacity:0.7;color:#fff">SRO EXT</span></div>
        <table class="sro-full-table">
            <tr>
                <th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">${x}</td>
                <th>STATUS</th><td id="td-stt">${x}</td>
                <th>VALIDAÇÃO</th><td id="td-val">${x}</td>
                <th>DATA PREV.</th><td id="td-dat-prev">${x}</td>
            </tr>
            <tr id="row-exc" style="display:none">
                <th style="color:#c62828">EXCEÇÃO</th><td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">${x}</td>
            </tr>
            <tr>
                <th>ENDEREÇO</th><td colspan="5" id="td-end-full">${x}</td>
                <th>CEP</th><td id="td-cep" style="font-weight:bold">${x}</td>
            </tr>
            <tr>
                 <th>CONTATO</th><td colspan="7" id="td-con">${x}</td>
            </tr>
            <tr>
                <th>DISTRITO</th><td id="td-dis" class="hl-dist">${x}</td>
                <th>ORDEM</th><td id="td-ord">${x}</td>
                <th>LADO</th><td id="td-lad">${x}</td>
                <th>SERVIÇOS</th><td colspan="3" id="td-srv">${x}</td>
            </tr>
            <tr>
                <th rowspan="2">INDUÇÃO</th>
                <td colspan="7">
                    <span style="color:#777">L:</span> <b id="td-lis">${x}</b> &nbsp;|&nbsp; 
                    <span style="color:#777">E:</span> <b id="td-est">${x}</b> &nbsp;|&nbsp; 
                    <span style="color:#777">U:</span> <b id="td-usu">${x}</b> &nbsp;|&nbsp; 
                    <span style="color:#777">DATA:</span> <b id="td-dat">${x}</b>
                </td>
            </tr>
            <tr>
                <td colspan="7" style="background:#fffde7;border-left:3px solid #fbc02d">
                    <span style="color:#f57f17;font-weight:bold;text-transform:uppercase">CARTEIRO:</span> 
                    <b id="td-postman" style="font-size:12px;color:#333;margin-left:5px">${x}</b>
                </td>
            </tr>
        </table>
    `;
    b.insertAdjacentElement('afterend', w);
}

function Y(){localStorage.setItem(O,JSON.stringify({x:k.cX,y:k.cY}))}
function $(){k.xOff=0,k.yOff=0,k.cX=0,k.cY=0;const e=document.getElementById("sro-container");e&&(e.style.transform=`translate3d(0px, 0px, 0)`,Y())}
function S(e){k.iX=e.clientX-k.xOff,k.iY=e.clientY-k.yOff,k.active=!0}
function B(){k.iX=k.cX,k.iY=k.cY,k.active=!1,Y()}
function N(e){k.active&&(e.preventDefault(),k.cX=e.clientX-k.iX,k.cY=e.clientY-k.iY,k.xOff=k.cX,k.yOff=k.cY,C(k.cX,k.cY,document.getElementById("sro-container")))}
function C(e,t,o){o.style.transform=`translate3d(${e}px, ${t}px, 0)`}

function U(){D||T();
    const e=document.getElementById("sro-card"),t=document.getElementById("sro-status"),o=document.getElementById("sro-icon"),r=document.getElementById("sro-distrito"),s=document.getElementById("sro-previsao");
    let i="⏳";"success"===L.mode&&(i="✅"),"error"===L.mode&&(i="⛔"),"info"===L.mode&&(i="⚠️");
    e.className=`sro-card visible mode-${L.mode}`,t.innerText=L.status,o.innerText=i,r.innerHTML=getVisualDist(),s.innerText=L.date||y;
    
    const el=i=>document.getElementById(i);
    if(el("td-cod")){
        el("td-cod").innerText=L.code; 
        const v = L.val; el("td-val").innerHTML = v ? `<span class="${v.includes('V')?'hl-val':'hl-err'}">${v}</span>` : x;
        el("td-stt").innerText=L.lastEvt; 
        el("td-dat-prev").innerText=L.date;
        const exc = L.exc; 
        if(exc && exc !== x) {
            el("td-exc").innerText = exc;
            document.getElementById("row-exc").style.display = "table-row";
        } else {
            document.getElementById("row-exc").style.display = "none";
        }
        el("td-end-full").innerText = `${L.addr.log}, ${L.addr.num} ${L.addr.comp?'- '+L.addr.comp:''} - ${L.addr.bair}, ${L.addr.mun}/${L.addr.uf}`;
        el("td-cep").innerText=L.addr.cep;
        el("td-con").innerHTML=`TEL: <b>${L.contact.tel}</b> ${L.contact.email!==x?' | EMAIL: '+L.contact.email:''}`;
        el("td-dis").innerHTML=getVisualDist();
        el("td-ord").innerText=L.op.ord; el("td-lad").innerText=L.op.side;
        const srv = (k, l) => `<span class="${L.serv[k]==='S'?'hl-serv':'hl-serv-off'}">${l}</span>`;
        el("td-srv").innerHTML= srv('ar','AR') + srv('mp','MP') + srv('dd','DD');
        el("td-lis").innerText=L.op.list; el("td-est").innerText=L.op.st; el("td-usu").innerText=L.op.user; el("td-dat").innerText=fmtTime(L.op.ts);
        el("td-postman").innerText=L.op.postman;
    }
}

function A(e,a){
    const c=e.toLowerCase();let d=null;try{const t=new URL(e,window.location.origin);d=t.searchParams.get("codigo")||t.searchParams.get("id")||t.searchParams.get("objeto")}catch(e){}
    if(d && d!==L.code && (c.includes("acao=validar") || c.includes("acao=pesquisar"))) {
        L={code:d,status:t,mode:"loading",district:x,domDist:null,initialDist:null,date:y,exc:x,val:x,lastEvt:x,addr:{log:x,num:x,comp:x,bair:x,mun:x,uf:x,cep:x},serv:{ar:"N",mp:"N",dd:"N"},contact:{tel:x,email:x},op:{list:x,user:x,postman:x,st:x,ts:x,ord:x,side:x}}; U();
    }

    if(c.includes("acao=validar")){
        L.val=a.validacao||x; L.exc=a.excecao||x; L.lastEvt=a.ultimoEventoDescricao||x;
        a.validacao?("success"!==L.mode&&"error"!==L.mode&&(L.mode="info",L.status=o),L.date=a.previsaoEntrega?.data||y):(L.mode="error",L.status=r,L.date=y);
    }else if(c.includes("enderecocontroller.php")){
        if(a.endereco){L.addr.log=a.endereco.logradouro;L.addr.num=a.endereco.numeroLogradouro;L.addr.comp=a.endereco.complementoLogradouro;L.addr.bair=a.endereco.bairro;L.addr.mun=a.endereco.municipio;L.addr.uf=a.endereco.uf;L.addr.cep=a.endereco.cep;}
        if(a.servico){L.serv.ar=a.servico.ar;L.serv.mp=a.servico.mp;L.serv.dd=a.servico.dd;}
        if(a.telefone){L.contact.tel=`(${a.telefone.ddd}) ${a.telefone.numero}`;} L.contact.email=a.email||x;
    }else if(c.includes("distritamentotrechocontroller.php")){
        if(Array.isArray(a)&&a.length>0){
            const d=a[0]; 
            L.district = `${d.rotuloDistrito} ${d.areaDistrito||''}`.trim();
            L.op.ord=d.ordemPercorrida; L.op.side=d.lado;
        }
    }else if(c.includes("acao=pesquisarloecobjeto")){
        if(a.id){
            L.mode="success";L.status=s;
            const dist = `${a.numeroDistrito} ${a.distritoComplemento||''}`.trim();
            L.initialDist = dist; L.district = dist; 
            L.domDist = dist; 
            L.op.list=a.idLancamento;L.op.st=x;L.op.user=a.carteiro?.nome||x;L.op.postman=a.carteiro?.nome||x;
        }
    }else if(c.includes("acao=listar")){
        if(Array.isArray(a)&&L.op.list){
            const found = a.find(i=>i.idLancamento===L.op.list);
            if(found && found.nomeCarteiro) { L.op.postman = found.nomeCarteiro; }
        }
    }else if(c.includes("acao=salvar")){
        a.idLancamento&&(L.mode="success",L.status=n,L.op.list=a.numeroLista,L.op.user=a.usuario,L.op.st=a.estacao,L.op.ts=a.carimbo,a.dataPrevista&&(L.date=a.dataPrevista));
        if(a.distrito) { L.initialDist = a.distrito; L.domDist = a.distrito; }
    }else if(c.includes("acao=excluir")){L.mode="error",L.status=i,L.district=x;L.domDist=null;L.date=y;L.initialDist=null;}
    U();
}

const P=window.fetch;window.fetch=async function(...e){const t=e[0]?e[0].toString():"",o=t.toLowerCase(),r=e[1];
    if(o.includes("acao=salvar")&&r&&r.body)try{const e=JSON.parse(r.body);e.distrito&&(L.district=e.distrito)}catch(e){}
    if(o.includes("listar-impressoras-disponiveis"))_();
    const s=await P.apply(this,e);
    try{if(o.includes("controller.php")){s.clone().json().then(e=>A(t,e)).catch(()=>{})}}catch(e){}return s
};
const z=XMLHttpRequest.prototype.open,H=XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open=function(e,t){return this._url=t,t&&t.toLowerCase().includes("listar-impressoras-disponiveis")&&_(),z.apply(this,arguments)};
XMLHttpRequest.prototype.send=function(e){
    const t=this._url?this._url.toLowerCase():"";
    if(t&&t.includes("acao=salvar")&&e)try{const t=JSON.parse(e);t.distrito&&(L.district=t.distrito)}catch(e){}
    return this.addEventListener("load",function(){const e=this._url?this._url.toLowerCase():"";if(e&&e.includes("controller.php"))try{const e=JSON.parse(this.responseText);A(this._url,e)}catch(e){}}),H.apply(this,arguments)
},
"loading"===document.readyState?document.addEventListener("DOMContentLoaded",T):T()}();
