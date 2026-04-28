import type { DispatchState } from './state.js';
import { createDefaultState } from './state.js';
import { renderPanel, syncAutoCloseButton } from './ui/panel.js';
import { updateTable } from './ui/table.js';
import { triggerAutoClose, isAutoCloseEnabled } from './auto-close.js';

export function createRenderFn(stateRef: { current: DispatchState }) {
  return function render(): void {
    renderPanel(stateRef.current, () => {
      const { setAutoClose } = require('./auto-close.js');
      const newVal = !isAutoCloseEnabled();
      setAutoClose(newVal);
      syncAutoCloseButton(newVal);
      if (newVal) triggerAutoClose();
    });
    syncAutoCloseButton(isAutoCloseEnabled());
    updateTable(stateRef.current);
  };
}

export function handleControllerResponse(
  url: string,
  data: unknown,
  stateRef: { current: DispatchState },
  render: () => void
): void {
  const lc = url.toLowerCase();
  const d = data as any;
  let updated = false;

  const urlObj = new URL(url, window.location.origin);
  const cd =
    urlObj.searchParams.get('codigo') ||
    urlObj.searchParams.get('objeto') ||
    urlObj.searchParams.get('id');

  if (
    cd &&
    cd !== stateRef.current.code &&
    (lc.includes('acao=validar') || lc.includes('acao=pesquisar'))
  ) {
    stateRef.current = createDefaultState(cd);
    updated = true;
  }

  if (lc.includes('acao=validar')) {
    stateRef.current.correios_validacao = d.validacao || '--';
    stateRef.current.correios_excecao = d.excecao || '--';
    stateRef.current.correios_ultimoEventoDescricao =
      d.ultimoEventoDescricao || '--';
    if (d.validacao) {
      if (
        stateRef.current.mode !== 'success' &&
        stateRef.current.mode !== 'error'
      ) {
        stateRef.current.mode = 'info';
        stateRef.current.status = 'PRONTO P/ INDUZIR';
      }
      stateRef.current.correios_dataPrevista =
        d.previsaoEntrega?.data || '--/--/----';
    } else {
      stateRef.current.mode = 'error';
      stateRef.current.status = 'NÃO INDUZIDO';
    }
    updated = true;
  } else if (lc.includes('enderecocontroller.php') && d.endereco) {
    const e = d.endereco;
    stateRef.current.address = {
      correios_logradouro: e.logradouro || '--',
      correios_numeroLogradouro: e.numeroLogradouro || '--',
      correios_complementoLogradouro: e.complementoLogradouro || '--',
      correios_bairro: e.bairro || '--',
      correios_municipio: e.municipio || '--',
      correios_uf: e.uf || '--',
      correios_cep: e.cep || '--'
    };
    if (d.servico)
      stateRef.current.services = {
        correios_ar: d.servico.ar,
        correios_mp: d.servico.mp,
        correios_dd: d.servico.dd
      };
    if (d.telefone)
      stateRef.current.contact.correios_telefone = `(${d.telefone.ddd}) ${d.telefone.numero}`;
    stateRef.current.contact.correios_email = d.email || '--';
    updated = true;
  } else if (
    lc.includes('distritamentotrechocontroller.php') &&
    Array.isArray(d) &&
    d.length > 0
  ) {
    stateRef.current.district =
      `${d[0].rotuloDistrito} ${d[0].areaDistrito || ''}`.trim();
    const sel = document.getElementById(
      'selDistrito'
    ) as HTMLSelectElement | null;
    if (sel) {
      const opt = sel.options?.[sel.selectedIndex];
      const v = opt ? opt.text : sel.value;
      stateRef.current.domDistrict =
        v && v !== 'Selecione...' && v.trim() !== '' ? v.trim() : '';
    } else {
      stateRef.current.domDistrict = '';
    }
    stateRef.current.opData.correios_ordemPercorrida = d[0].ordemPercorrida;
    stateRef.current.opData.correios_lado = d[0].lado;
    updated = true;
  } else if (lc.includes('acao=pesquisarloecobjeto')) {
    if (d.id || d.idLancamento) {
      stateRef.current.mode = 'success';
      stateRef.current.status = 'JÁ INDUZIDO';
      stateRef.current.district =
        `${d.numeroDistrito || ''} ${d.distritoComplemento || ''}`.trim();
      stateRef.current.domDistrict = stateRef.current.district;
      stateRef.current.initialDistrict = stateRef.current.district;
      if (d.carteiro?.nome)
        stateRef.current.opData.correios_carteiro_nome = d.carteiro.nome;
      updated = true;
    }
  } else if (lc.includes('acao=salvar')) {
    if (d.idLancamento) {
      stateRef.current.mode = 'success';
      stateRef.current.status = 'OBJETO INDUZIDO';
      stateRef.current.opData.correios_numeroLista = d.numeroLista;
      stateRef.current.opData.correios_usuario = d.usuario;
      stateRef.current.opData.correios_estacao = d.estacao;
      stateRef.current.opData.correios_carimbo = d.carimbo;
      if (d.dataPrevista)
        stateRef.current.correios_dataPrevista = d.dataPrevista;

      [
        'txtCep',
        'txtNumero',
        'txtComplemento',
        'txtLogradouro',
        'txtBairro',
        'txtMunicipio'
      ].forEach((id) => {
        const input = document.getElementById(id) as HTMLInputElement | null;
        if (!input?.value) return;
        const k = id.replace('txt', '').toLowerCase();
        const map: Record<string, keyof typeof stateRef.current.address> = {
          cep: 'correios_cep',
          numero: 'correios_numeroLogradouro',
          complemento: 'correios_complementoLogradouro',
          logradouro: 'correios_logradouro',
          bairro: 'correios_bairro',
          municipio: 'correios_municipio'
        };
        if (map[k]) stateRef.current.address[map[k]] = input.value.trim();
      });
      const selUf = document.getElementById(
        'selUf'
      ) as HTMLSelectElement | null;
      if (selUf?.value) stateRef.current.address.correios_uf = selUf.value;

      try {
        const fetchUrl =
          new URL(url, window.location.origin).pathname +
          '?acao=pesquisarloecobjeto&objeto=' +
          stateRef.current.code;
        window
          .fetch(fetchUrl)
          .then((r) => r.json())
          .then((res: any) => {
            if (res?.id || res?.idLancamento) {
              stateRef.current.district =
                `${res.numeroDistrito || ''} ${res.distritoComplemento || ''}`.trim();
              stateRef.current.domDistrict = stateRef.current.district;
              stateRef.current.initialDistrict = stateRef.current.district;
              if (res.carteiro?.nome)
                stateRef.current.opData.correios_carteiro_nome =
                  res.carteiro.nome;
              render();
            }
          })
          .catch(() => {});
      } catch {}
      updated = true;
    } else if (d.excecao) {
      stateRef.current.mode = 'error';
      stateRef.current.status = 'ERRO NA INDUÇÃO';
      stateRef.current.correios_excecao = d.excecao;
      updated = true;
    }
  } else if (lc.includes('acao=excluir')) {
    stateRef.current.mode = 'error';
    stateRef.current.status = 'EXCLUÍDO';
    updated = true;
  }

  if (updated) render();
}
