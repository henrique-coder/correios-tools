import type { SroCache } from '../../shared/sro/intranet-parser.js';

export interface LoecStore {
  loecObjectCache: Record<string, unknown[]>;
  sroIntranetCache: SroCache;
  sroIntranetCacheId: number;
  ctArchiveLastData: { cat: string; objs: DeliveryObject[] } | null;
  currentArchiveRenderId: symbol;
  currentModalRenderId: symbol;
}

export interface DistrictData {
  dispatchId: string | number;
  districtNumber: string;
  districtArea?: string;
  districtLabel?: string;
  postmanName?: string;
  postmanId?: string;
  sroCode?: string;
  quantity: number | string;
  pointsQuantity: number | string;
  overdueQuantity: number | string;
  todayQuantity: number | string;
  dueSoonQuantity: number | string;
  arQuantity: number | string;
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
    ctArchiveLastData: null,
    currentArchiveRenderId: Symbol(),
    currentModalRenderId: Symbol()
  };
}
