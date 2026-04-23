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
  const d = data as Record<string, any>;
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
    stateRef.current.val = d.validacao || '--';
    stateRef.current.exc = d.excecao || '--';
    stateRef.current.lastEvt = d.ultimoEventoDescricao || '--';
    if (d.validacao) {
      if (
        stateRef.current.mode !== 'success' &&
        stateRef.current.mode !== 'error'
      ) {
        stateRef.current.mode = 'info';
        stateRef.current.status = 'PRONTO P/ INDUZIR';
      }
      stateRef.current.date = d.previsaoEntrega?.data || '--/--/----';
    } else {
      stateRef.current.mode = 'error';
      stateRef.current.status = 'NÃO INDUZIDO';
    }
    updated = true;
  } else if (lc.includes('enderecocontroller.php') && d.endereco) {
    const e = d.endereco;
    stateRef.current.addr = {
      log: e.logradouro || '--',
      num: e.numeroLogradouro || '--',
      comp: e.complementoLogradouro || '--',
      bair: e.bairro || '--',
      mun: e.municipio || '--',
      uf: e.uf || '--',
      cep: e.cep || '--'
    };
    if (d.servico)
      stateRef.current.serv = {
        ar: d.servico.ar,
        mp: d.servico.mp,
        dd: d.servico.dd
      };
    if (d.telefone)
      stateRef.current.contact.tel = `(${d.telefone.ddd}) ${d.telefone.numero}`;
    stateRef.current.contact.email = d.email || '--';
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
      stateRef.current.domDist =
        v && v !== 'Selecione...' && v.trim() !== '' ? v.trim() : '';
    } else {
      stateRef.current.domDist = '';
    }
    stateRef.current.op.ord = d[0].ordemPercorrida;
    stateRef.current.op.side = d[0].lado;
    updated = true;
  } else if (lc.includes('acao=pesquisarloecobjeto')) {
    if (d.id || d.idLancamento) {
      stateRef.current.mode = 'success';
      stateRef.current.status = 'JÁ INDUZIDO';
      stateRef.current.district =
        `${d.numeroDistrito || ''} ${d.distritoComplemento || ''}`.trim();
      stateRef.current.domDist = stateRef.current.district;
      stateRef.current.initialDist = stateRef.current.district;
      if (d.carteiro?.nome) stateRef.current.op.postman = d.carteiro.nome;
      updated = true;
    }
  } else if (lc.includes('acao=salvar')) {
    if (d.idLancamento) {
      stateRef.current.mode = 'success';
      stateRef.current.status = 'OBJETO INDUZIDO';
      stateRef.current.op.list = d.numeroLista;
      stateRef.current.op.user = d.usuario;
      stateRef.current.op.st = d.estacao;
      stateRef.current.op.ts = d.carimbo;
      if (d.dataPrevista) stateRef.current.date = d.dataPrevista;

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
        const map: Record<string, keyof typeof stateRef.current.addr> = {
          cep: 'cep',
          numero: 'num',
          complemento: 'comp',
          logradouro: 'log',
          bairro: 'bair',
          municipio: 'mun'
        };
        if (map[k]) stateRef.current.addr[map[k]] = input.value.trim();
      });
      const selUf = document.getElementById(
        'selUf'
      ) as HTMLSelectElement | null;
      if (selUf?.value) stateRef.current.addr.uf = selUf.value;

      try {
        const fetchUrl =
          new URL(url, window.location.origin).pathname +
          '?acao=pesquisarloecobjeto&objeto=' +
          stateRef.current.code;
        window
          .fetch(fetchUrl)
          .then((r) => r.json())
          .then((res) => {
            if (res?.id || res?.idLancamento) {
              stateRef.current.district =
                `${res.numeroDistrito || ''} ${res.distritoComplemento || ''}`.trim();
              stateRef.current.domDist = stateRef.current.district;
              stateRef.current.initialDist = stateRef.current.district;
              if (res.carteiro?.nome)
                stateRef.current.op.postman = res.carteiro.nome;
              render();
            }
          })
          .catch(() => {});
      } catch {}
      updated = true;
    } else if (d.excecao) {
      stateRef.current.mode = 'error';
      stateRef.current.status = 'ERRO NA INDUÇÃO';
      stateRef.current.exc = d.excecao;
      updated = true;
    }
  } else if (lc.includes('acao=excluir')) {
    stateRef.current.mode = 'error';
    stateRef.current.status = 'EXCLUÍDO';
    updated = true;
  }

  if (updated) render();
}
