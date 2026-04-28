import type { SroCache } from '../../shared/sro/intranet-parser.js';

export interface LoecStore {
  loecObjectCache: Record<string, unknown[]>;
  sroIntranetCache: SroCache;
  sroIntranetCacheId: number;
  archiveLastData: { cat: string; objs: DeliveryObject[] } | null;
  archiveRenderId: symbol;
  modalRenderId: symbol;
}

export interface DistrictData {
  correios_idLancamento: string | number;
  correios_numeroDistrito: string;
  correios_areaDistrito?: string;
  correios_rotuloDistrito?: string;
  correios_nomeCarteiro?: string;
  correios_matriculaCarteiro?: string;
  correios_codigoSro?: string;
  correios_qtde: number | string;
  correios_qtdePontos: number | string;
  correios_qtdeVencido: number | string;
  correios_qtdeHoje: number | string;
  correios_qtdeAVencer: number | string;
  correios_qtdeAR: number | string;
}

export interface DeliveryObject {
  trackingCode?: string;
  address?: string;
  zipCode?: string;
  maxDeliveryDate?: string;
  color?: string;
  district?: string;
  postmanId?: string;
  postmanName?: string;
  sroCode?: string;
}

export function createLoecStore(): LoecStore {
  return {
    loecObjectCache: {},
    sroIntranetCache: {},
    sroIntranetCacheId: Date.now(),
    archiveLastData: null,
    archiveRenderId: Symbol(),
    modalRenderId: Symbol()
  };
}
