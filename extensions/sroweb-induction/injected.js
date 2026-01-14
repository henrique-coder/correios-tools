!function(){"use strict";const e="AGUARDANDO...",t="LENDO...",o="PRONTO P/ INDUZIR",r="NÃO INDUZIDO",s="JÁ INDUZIDO",n="OBJETO INDUZIDO",i="EXCLUÍDO",a="DISTRITO",c="PREVISÃO",u="Clique duas vezes para resetar a posição",p="Processando...",m="Validado",f="Objeto inválido",g="Objeto já consta na lista.",v="Inclusão confirmada.",h="Objeto removido da lista.",y="--/--/----",x="--",O="sro_position";
let L={code:x,status:e,mode:"loading",district:x,domDist:null,initialDist:null,date:y,exc:x,val:x,lastEvt:x,addr:{log:x,num:x,comp:x,bair:x,mun:x,uf:x,cep:x},serv:{ar:"N",mp:"N",dd:"N"},contact:{tel:x,email:x},op:{list:x,user:x,postman:x,st:x,ts:x,ord:x,side:x}},k={active:!1,cX:0,cY:0,iX:0,iY:0,xOff:0,yOff:0},igF=0;

function _ok(){let e=0;const t=setInterval(()=>{const o=document.querySelector("#alerta.aberto .act a");o&&"OK"===o.innerText&&(o.click(),clearInterval(t)),++e>=100&&clearInterval(t)},50)}
function _(){let e=0;const t=setInterval(()=>{const o=document.getElementById("btnImprimirEtiquetaNao");o&&(o.click(),clearInterval(t),_ok()),++e>=100&&clearInterval(t)},50)}

function ObsInp(){
    const t=document.getElementById("txtObjeto");
    if(!t)return setTimeout(ObsInp,1000);
    const c=t.closest(".campo")||t.parentElement;
    if(!c)return;
    new MutationObserver(()=>{
        if(Date.now()<igF)return;
        const o=c.querySelector(".mensagem");
        if(o){
            const r=o.innerText;
            (r.includes("Formato de objeto postal")||r.includes("Preencha este campo"))&&document.activeElement!==t&&(t.click(),t.focus())
        }
    }).observe(c,{childList:!0,subtree:!0,characterData:!0})
}

function EvtSel(){
    const t=document.getElementById("selDistrito");
    if(!t)return setTimeout(EvtSel,1000);
    const n=()=>{igF=Date.now()+1500};
    t.addEventListener("mousedown",n),t.addEventListener("focus",n),t.addEventListener("change",e=>{L.domDist=e.target.value,U()})
}

function fmtTime(e){if(!e||e.length<18)return x;const t=e.substring(8,10)+"/"+e.substring(10,12)+"/"+e.substring(12,16),o=e.substring(16,18)+":"+e.substring(18,20);return`${t} às ${o}`}

function getVisualDist(){
    let e=L.domDist&&""!==L.domDist?L.domDist:L.district;
    return e&&(e=e.trim()),L.initialDist&&L.initialDist!==x?e&&e!==x&&e!==L.initialDist?`<div style="display:flex;align-items:center;justify-content:center"><span class="sro-old">${L.initialDist}</span><span class="sro-arrow">➜</span><span class="sro-new">${e}</span></div>`:`<span class="sro-new">${L.initialDist}</span>`:`<span class="sro-new">${e||x}</span>`
}

function T(){
    if(document.getElementById("sro-styles"))return;
    const t=document.createElement("style");
    t.id="sro-styles",t.innerHTML=`
      #sro-container { position: fixed; top: 15px; right: 15px; z-index: 999999; display: flex; flex-direction: column; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); will-change: transform; pointer-events: none; }
      .sro-card { width: 360px; background: #fff; border-radius: 6px; font-family: 'Segoe UI', Arial, sans-serif; overflow: hidden; opacity: 0; transition: opacity 0.2s; border-left: 8px solid #999; display: none; pointer-events: auto; }
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
    try{const e=JSON.parse(localStorage.getItem(O));e&&"number"==typeof e.x&&"number"==typeof e.y&&(k.cX=e.x,k.cY=e.y,k.xOff=e.x,k.yOff=e.y,o.style.transform=`translate3d(${e.x}px, ${e.y}px, 0)`)}catch(e){}
    const r=document.getElementById("sro-header");r.addEventListener("mousedown",S,!1),r.addEventListener("dblclick",$,!1),document.addEventListener("mouseup",B,!1),document.addEventListener("mousemove",N,!1),InjT(),ObsInp(),EvtSel()
}

function InjT(){
    if(document.getElementById("sro-table-wrapper"))return;
    const t=document.querySelector(".botoes");
    if(!t)return setTimeout(InjT,500);
    const o=document.createElement("div");o.id="sro-table-wrapper",o.innerHTML=`
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
    `,t.insertAdjacentElement("afterend",o)
}

function Y(){localStorage.setItem(O,JSON.stringify({x:k.cX,y:k.cY}))}
function $(){const e=document.getElementById("sro-container");e&&(k.xOff=0,k.yOff=0,k.cX=0,k.cY=0,e.style.transform="translate3d(0px, 0px, 0)",Y())}
function S(e){k.iX=e.clientX-k.xOff,k.iY=e.clientY-k.yOff,k.active=!0}
function B(){k.iX=k.cX,k.iY=k.cY,k.active=!1,Y()}
function N(e){k.active&&(e.preventDefault(),k.cX=e.clientX-k.iX,k.cY=e.clientY-k.iY,k.xOff=k.cX,k.yOff=k.cY,C(k.cX,k.cY,document.getElementById("sro-container")))}
function C(e,t,o){o.style.transform=`translate3d(${e}px, ${t}px, 0)`}

function U(){T();
    const e=document.getElementById("sro-card"),t=document.getElementById("sro-status"),o=document.getElementById("sro-icon"),r=document.getElementById("sro-distrito"),s=document.getElementById("sro-previsao");
    let i="⏳";"success"===L.mode&&(i="✅"),"error"===L.mode&&(i="⛔"),"info"===L.mode&&(i="⚠️");
    e.className=`sro-card visible mode-${L.mode}`,t.innerText=L.status,o.innerText=i,r.innerHTML=getVisualDist(),s.innerText=L.date||y;
    const l=e=>document.getElementById(e);
    if(l("td-cod")){
        l("td-cod").innerText=L.code;
        const e=L.val;l("td-val").innerHTML=e?`<span class="${e.includes("V")?"hl-val":"hl-err"}">${e}</span>`:x;
        l("td-stt").innerText=L.lastEvt,l("td-dat-prev").innerText=L.date;
        const t=L.exc;t&&t!==x?(l("td-exc").innerText=t,document.getElementById("row-exc").style.display="table-row"):document.getElementById("row-exc").style.display="none";
        l("td-end-full").innerText=`${L.addr.log}, ${L.addr.num} ${L.addr.comp?"- "+L.addr.comp:""} - ${L.addr.bair}, ${L.addr.mun}/${L.addr.uf}`,l("td-cep").innerText=L.addr.cep;
        l("td-con").innerHTML=`TEL: <b>${L.contact.tel}</b> ${L.contact.email!==x?" | EMAIL: "+L.contact.email:""}`;
        l("td-dis").innerHTML=getVisualDist(),l("td-ord").innerText=L.op.ord,l("td-lad").innerText=L.op.side;
        const o=(e,t)=>`<span class="${"S"===L.serv[e]?"hl-serv":"hl-serv-off"}">${t}</span>`;
        l("td-srv").innerHTML=o("ar","AR")+o("mp","MP")+o("dd","DD"),l("td-lis").innerText=L.op.list,l("td-est").innerText=L.op.st,l("td-usu").innerText=L.op.user,l("td-dat").innerText=fmtTime(L.op.ts),l("td-postman").innerText=L.op.postman
    }
}

function A(e,t){
    const o=e.toLowerCase();let r=null;try{const t=new URL(e,window.location.origin);r=t.searchParams.get("codigo")||t.searchParams.get("id")||t.searchParams.get("objeto")}catch(e){}
    r&&r!==L.code&&(o.includes("acao=validar")||o.includes("acao=pesquisar"))&&(L={code:r,status:t,mode:"loading",district:x,domDist:null,initialDist:null,date:y,exc:x,val:x,lastEvt:x,addr:{log:x,num:x,comp:x,bair:x,mun:x,uf:x,cep:x},serv:{ar:"N",mp:"N",dd:"N"},contact:{tel:x,email:x},op:{list:x,user:x,postman:x,st:x,ts:x,ord:x,side:x}},U());
    o.includes("acao=validar")?(L.val=t.validacao||x,L.exc=t.excecao||x,L.lastEvt=t.ultimoEventoDescricao||x,t.validacao?(L.mode="success"!==L.mode&&"error"!==L.mode?"info":L.mode,L.status="success"!==L.status&&"error"!==L.status?"PRONTO P/ INDUZIR":L.status,L.date=t.previsaoEntrega?.data||y):(L.mode="error",L.status="NÃO INDUZIDO",L.date=y)):o.includes("enderecocontroller.php")?(t.endereco&&(L.addr.log=t.endereco.logradouro,L.addr.num=t.endereco.numeroLogradouro,L.addr.comp=t.endereco.complementoLogradouro,L.addr.bair=t.endereco.bairro,L.addr.mun=t.endereco.municipio,L.addr.uf=t.endereco.uf,L.addr.cep=t.endereco.cep),t.servico&&(L.serv.ar=t.servico.ar,L.serv.mp=t.servico.mp,L.serv.dd=t.servico.dd),t.telefone&&(L.contact.tel=`(${t.telefone.ddd}) ${t.telefone.numero}`),L.contact.email=t.email||x):o.includes("distritamentotrechocontroller.php")?Array.isArray(t)&&t.length>0&&(L.district=`${t[0].rotuloDistrito} ${t[0].areaDistrito||""}`.trim(),L.op.ord=t[0].ordemPercorrida,L.op.side=t[0].lado):o.includes("acao=pesquisarloecobjeto")?t.id&&(L.mode="success",L.status="JÁ INDUZIDO",L.initialDist=`${t.numeroDistrito} ${t.distritoComplemento||""}`.trim(),L.district=L.initialDist,L.domDist=L.initialDist,L.op.list=t.idLancamento,L.op.user=t.carteiro?.nome||x,L.op.postman=t.carteiro?.nome||x):o.includes("acao=listar")?Array.isArray(t)&&L.op.list&&t.find(e=>e.idLancamento===L.op.list)?.nomeCarteiro&&(L.op.postman=t.find(e=>e.idLancamento===L.op.list).nomeCarteiro):o.includes("acao=salvar")?(t.idLancamento&&(L.mode="success",L.status="OBJETO INDUZIDO",L.op.list=t.numeroLista,L.op.user=t.usuario,L.op.st=t.estacao,L.op.ts=t.carimbo,t.dataPrevista&&(L.date=t.dataPrevista)),t.distrito&&(L.initialDist=t.distrito,L.domDist=t.distrito)):o.includes("acao=excluir")&&(L.mode="error",L.status="EXCLUÍDO",L.district=x,L.domDist=null,L.date=y,L.initialDist=null),U()
}

const P=window.fetch;window.fetch=async function(...e){const t=e[0]?e[0].toString():"",o=t.toLowerCase(),r=e[1];o.includes("acao=salvar")&&r&&r.body&&JSON.parse(r.body).distrito&&(L.district=JSON.parse(r.body).distrito),o.includes("listar-impressoras-disponiveis")&&_();const s=await P.apply(this,e);try{o.includes("controller.php")&&s.clone().json().then(e=>A(t,e)).catch(()=>{})}catch(e){}return s};
const z=XMLHttpRequest.prototype.open,H=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(e,t){return this._url=t,t&&t.toLowerCase().includes("listar-impressoras-disponiveis")&&_(),z.apply(this,arguments)},XMLHttpRequest.prototype.send=function(e){const t=this._url?this._url.toLowerCase():"";return t&&t.includes("acao=salvar")&&e&&JSON.parse(e).distrito&&(L.district=JSON.parse(e).distrito),this.addEventListener("load",function(){const e=this._url?this._url.toLowerCase():"";e&&e.includes("controller.php")&&JSON.parse(this.responseText)&&A(this._url,JSON.parse(this.responseText))}),H.apply(this,arguments)};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",T):T()}();
