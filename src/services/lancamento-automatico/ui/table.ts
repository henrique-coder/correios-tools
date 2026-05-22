import type { DispatchState } from '../state.js';
import { formatCarimbo, buildMapUrl } from '../../../shared/utils/format.js';

const TABLE_ID = 'sro-table-wrapper';

function buildDistrictHtmlInline(state: DispatchState): string {
  const current =
    (state.domDistrict && state.domDistrict !== ''
      ? state.domDistrict
      : state.district
    )?.trim() ?? '';
  if (
    state.initialDistrict &&
    state.initialDistrict !== current &&
    current !== '--'
  ) {
    return `<span class="sro-old-p" style="opacity:.5;font-weight:normal;margin-right:2px;font-size:.9em">${state.initialDistrict}</span><span class="sro-arrow-p" style="margin:0 4px;font-size:.9em;color:#666">&#10142;</span><span class="sro-new-p">${current}</span>`;
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
        <th>PREVISÃO</th><td id="td-dat-prev">--</td>
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
          <span style="color:#777">LISTA:</span> <b id="td-lis">--</b> &nbsp;|&nbsp;
          <span style="color:#777">ESTAÇÃO:</span> <b id="td-est">--</b> &nbsp;|&nbsp;
          <span style="color:#777">USUÁRIO:</span> <b id="td-usu">--</b> &nbsp;|&nbsp;
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

  const v = state.correios_validacao;
  el('td-val')!.innerHTML = v
    ? `<span class="${v.includes('V') ? 'hl-val' : 'hl-err'}">${v}</span>`
    : '--';

  el('td-stt')!.innerText = state.correios_ultimoEventoDescricao;
  el('td-dat-prev')!.innerText = state.correios_dataPrevista;

  const excRow = document.getElementById('row-exc')!;
  if (state.correios_excecao && state.correios_excecao !== '--') {
    el('td-exc')!.innerText = state.correios_excecao;
    excRow.style.display = 'table-row';
  } else {
    excRow.style.display = 'none';
  }

  const addr = state.address;
  if (addr.correios_logradouro === '--') {
    el('td-end-full')!.innerText = '--';
  } else {
    const url = buildMapUrl({
      correios_logradouro: addr.correios_logradouro,
      correios_numeroLogradouro: addr.correios_numeroLogradouro,
      correios_complementoLogradouro: addr.correios_complementoLogradouro,
      correios_bairro: addr.correios_bairro,
      correios_municipio: addr.correios_municipio,
      correios_uf: addr.correios_uf
    });
    const label = `${addr.correios_logradouro}, ${addr.correios_numeroLogradouro}${addr.correios_complementoLogradouro && addr.correios_complementoLogradouro !== '--' ? ' - ' + addr.correios_complementoLogradouro : ''} - ${addr.correios_bairro}, ${addr.correios_municipio}/${addr.correios_uf}`;
    el('td-end-full')!.innerHTML =
      `<a href="${url}" target="_blank" style="color:#00416B;text-decoration:none;font-weight:bold">${label}</a>`;
  }

  el('td-cep')!.innerText = addr.correios_cep;
  el('td-con')!.innerHTML =
    `TEL: <b>${state.contact.correios_telefone}</b>${state.contact.correios_email !== '--' ? ' | EMAIL: ' + state.contact.correios_email : ''}`;
  el('td-dis')!.innerHTML = buildDistrictHtmlInline(state);
  el('td-ord')!.innerText = state.opData.correios_ordemPercorrida;
  el('td-lad')!.innerText = state.opData.correios_lado;

  const srv = (k: keyof typeof state.services, l: string) =>
    `<span class="${state.services[k] === 'S' ? 'hl-serv' : 'hl-serv-off'}">${l}</span>`;
  el('td-srv')!.innerHTML =
    srv('correios_ar', 'AR') +
    srv('correios_mp', 'MP') +
    srv('correios_dd', 'DD');

  el('td-lis')!.innerText = state.opData.correios_numeroLista;
  el('td-est')!.innerText = state.opData.correios_estacao;
  el('td-usu')!.innerText = state.opData.correios_usuario;
  el('td-postman')!.innerText = state.opData.correios_carteiro_nome;
  el('td-dat')!.innerText = formatCarimbo(state.opData.correios_carimbo);
}
