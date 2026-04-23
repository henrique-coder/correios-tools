import type { DispatchState } from '../state.js';
import { formatCarimbo, buildMapUrl } from '../../../shared/utils/format.js';

const TABLE_ID = 'sro-table-wrapper';

function buildDistrictHtmlInline(state: DispatchState): string {
  const current =
    (state.domDist && state.domDist !== ''
      ? state.domDist
      : state.district
    )?.trim() ?? '';
  if (state.initialDist && state.initialDist !== current && current !== '--') {
    return `<span class="sro-old-p" style="opacity:.5;font-weight:normal;margin-right:2px;font-size:.9em">${state.initialDist}</span><span class="sro-arrow-p" style="margin:0 4px;font-size:.9em;color:#666">&#10142;</span><span class="sro-new-p">${current}</span>`;
  }
  return `<span class="sro-new-p">${current || '--'}</span>`;
}

export function injectTable(): void {
  if (document.getElementById(TABLE_ID)) return;

  const anchor = document.querySelector('.botoes');
  if (!anchor) {
    setTimeout(injectTable, 500);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.id = TABLE_ID;
  wrapper.innerHTML = `
    <div class="sro-table-header"><span style="color:#fff!important">DADOS OPERACIONAIS</span></div>
    <table class="sro-full-table">
      <tr>
        <th>OBJETO</th><td id="td-cod" style="font-weight:bold;font-size:12px">--</td>
        <th>STATUS</th><td id="td-stt">--</td>
        <th>VALIDAÇÃO</th><td id="td-val">--</td>
        <th>DATA PREV.</th><td id="td-dat-prev">--</td>
      </tr>
      <tr id="row-exc" style="display:none">
        <th style="color:#c62828">EXCEÇÃO</th><td colspan="7" id="td-exc" style="color:#c62828;font-weight:bold">--</td>
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

  anchor.insertAdjacentElement('afterend', wrapper);
}

export function updateTable(state: DispatchState): void {
  const el = (id: string) => document.getElementById(id);
  if (!el('td-cod')) return;

  el('td-cod')!.innerText = state.code;

  const v = state.val;
  el('td-val')!.innerHTML = v
    ? `<span class="${v.includes('V') ? 'hl-val' : 'hl-err'}">${v}</span>`
    : '--';

  el('td-stt')!.innerText = state.lastEvt;
  el('td-dat-prev')!.innerText = state.date;

  const excRow = document.getElementById('row-exc')!;
  if (state.exc && state.exc !== '--') {
    el('td-exc')!.innerText = state.exc;
    excRow.style.display = 'table-row';
  } else {
    excRow.style.display = 'none';
  }

  const { addr } = state;
  if (addr.log === '--') {
    el('td-end-full')!.innerText = '--';
  } else {
    const url = buildMapUrl(addr);
    const label = `${addr.log}, ${addr.num}${addr.comp && addr.comp !== '--' ? ' - ' + addr.comp : ''} - ${addr.bair}, ${addr.mun}/${addr.uf}`;
    el('td-end-full')!.innerHTML =
      `<a href="${url}" target="_blank" style="color:#00416B;text-decoration:none;font-weight:bold">${label}</a>`;
  }

  el('td-cep')!.innerText = addr.cep;
  el('td-con')!.innerHTML =
    `TEL: <b>${state.contact.tel}</b>${state.contact.email !== '--' ? ' | EMAIL: ' + state.contact.email : ''}`;
  el('td-dis')!.innerHTML = buildDistrictHtmlInline(state);
  el('td-ord')!.innerText = state.op.ord;
  el('td-lad')!.innerText = state.op.side;

  const srv = (k: keyof typeof state.serv, l: string) =>
    `<span class="${state.serv[k] === 'S' ? 'hl-serv' : 'hl-serv-off'}">${l}</span>`;
  el('td-srv')!.innerHTML = srv('ar', 'AR') + srv('mp', 'MP') + srv('dd', 'DD');

  el('td-lis')!.innerText = state.op.list;
  el('td-est')!.innerText = state.op.st;
  el('td-usu')!.innerText = state.op.user;
  el('td-postman')!.innerText = state.op.postman;
  el('td-dat')!.innerText = formatCarimbo(state.op.ts);
}
