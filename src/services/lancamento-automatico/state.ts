export interface Address {
  log: string;
  num: string;
  comp: string;
  bair: string;
  mun: string;
  uf: string;
  cep: string;
}

export interface Services {
  ar: string;
  mp: string;
  dd: string;
}

export interface Contact {
  tel: string;
  email: string;
}

export interface OpData {
  list: string;
  user: string;
  postman: string;
  st: string;
  ts: string;
  ord: string;
  side: string;
}

export type ServiceMode = 'loading' | 'success' | 'error' | 'info';

export interface DispatchState {
  code: string;
  status: string;
  mode: ServiceMode;
  district: string;
  domDist: string | null;
  initialDist: string | null;
  pendingDist: string | null;
  date: string;
  exc: string;
  val: string;
  lastEvt: string;
  addr: Address;
  serv: Services;
  contact: Contact;
  op: OpData;
}

export function createDefaultState(code = '--'): DispatchState {
  return {
    code,
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
}
