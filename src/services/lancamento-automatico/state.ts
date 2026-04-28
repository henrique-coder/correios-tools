export interface Address {
  correios_logradouro: string;
  correios_numeroLogradouro: string;
  correios_complementoLogradouro: string;
  correios_bairro: string;
  correios_municipio: string;
  correios_uf: string;
  correios_cep: string;
}

export interface Services {
  correios_ar: string;
  correios_mp: string;
  correios_dd: string;
}

export interface Contact {
  correios_telefone: string;
  correios_email: string;
}

export interface OpData {
  correios_numeroLista: string;
  correios_usuario: string;
  correios_carteiro_nome: string;
  correios_estacao: string;
  correios_carimbo: string;
  correios_ordemPercorrida: string;
  correios_lado: string;
}

export type ServiceMode = 'loading' | 'success' | 'error' | 'info';

export interface DispatchState {
  code: string;
  status: string;
  mode: ServiceMode;
  district: string;
  domDistrict: string | null;
  initialDistrict: string | null;
  pendingDistrict: string | null;
  correios_dataPrevista: string;
  correios_excecao: string;
  correios_validacao: string;
  correios_ultimoEventoDescricao: string;
  address: Address;
  services: Services;
  contact: Contact;
  opData: OpData;
}

export function createDefaultState(code = '--'): DispatchState {
  return {
    code,
    status: 'AGUARDANDO...',
    mode: 'loading',
    district: '--',
    domDistrict: null,
    initialDistrict: null,
    pendingDistrict: null,
    correios_dataPrevista: '--/--/----',
    correios_excecao: '--',
    correios_validacao: '--',
    correios_ultimoEventoDescricao: '--',
    address: {
      correios_logradouro: '--',
      correios_numeroLogradouro: '--',
      correios_complementoLogradouro: '--',
      correios_bairro: '--',
      correios_municipio: '--',
      correios_uf: '--',
      correios_cep: '--'
    },
    services: { correios_ar: 'N', correios_mp: 'N', correios_dd: 'N' },
    contact: { correios_telefone: '--', correios_email: '--' },
    opData: {
      correios_numeroLista: '--',
      correios_usuario: '--',
      correios_carteiro_nome: '--',
      correios_estacao: '--',
      correios_carimbo: '--',
      correios_ordemPercorrida: '--',
      correios_lado: '--'
    }
  };
}
