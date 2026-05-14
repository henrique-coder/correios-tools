import { RUNTIME_DEFAULTS } from '../../../config/defaults.js';
import { LOEC_DOM_IDS } from '../../../shared/constants/dom-elements.js';
import { colorsMatch, normalizeColor } from '../../../shared/utils/color.js';
import { parseDistrito } from '../../../shared/utils/format.js';
import { getLoecObjectsByLancamento } from '../api.js';
import type { DeliveryObject, DistrictData, LoecStore } from '../state.js';

export type FetchCategory = 'today' | 'overdue' | 'dueSoon';

const FETCH_TIMEOUT_MS = RUNTIME_DEFAULTS.LIMITS.FETCH_TIMEOUT_MS;
const TIMEOUT_ERROR_MESSAGE = 'Request timed out';

export type FetchErrorReason = 'timeout' | 'request';

export interface FetchErrorInfo {
  districtId: string;
  reason: FetchErrorReason;
}

export interface ArchiveFilters {
  mode: string;
  dist: string;
  grade: string;
  side: string;
  sroExcludes: string[];
  sroIgnoreText: string;
}

export function getArchiveFilters(): ArchiveFilters {
  const excludes: string[] = [];
  document
    .querySelectorAll<HTMLInputElement>('.ct-arq-sro-chk')
    .forEach((c) => {
      if (!c.checked) excludes.push(c.value);
    });
  return {
    mode:
      (
        document.getElementById(
          LOEC_DOM_IDS.ARCHIVE_EXPORT_MODE
        ) as HTMLSelectElement
      )?.value ?? '3',
    dist:
      (
        document.getElementById(
          LOEC_DOM_IDS.ARCHIVE_DIST_FILTER
        ) as HTMLSelectElement
      )?.value ?? '',
    grade:
      (
        document.getElementById(
          LOEC_DOM_IDS.ARCHIVE_GRADE_FILTER
        ) as HTMLSelectElement
      )?.value ?? '',
    side:
      (
        document.getElementById(
          LOEC_DOM_IDS.ARCHIVE_SIDE_FILTER
        ) as HTMLSelectElement
      )?.value ?? '',
    sroExcludes: excludes,
    sroIgnoreText:
      (
        document.getElementById(
          LOEC_DOM_IDS.ARCHIVE_SRO_IGNORE_TEXT
        ) as HTMLInputElement
      )?.value ?? ''
  };
}

export function getFilteredObjs(
  data: { cat: string; objs: DeliveryObject[] } | null,
  filters: ArchiveFilters,
  store: LoecStore
): DeliveryObject[] {
  if (!data?.objs) return [];

  const ignoreList = filters.sroIgnoreText
    ? filters.sroIgnoreText
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
    : [];

  return data.objs.filter((o) => {
    if (filters.dist && o.district !== filters.dist) return false;
    if (filters.grade || filters.side) {
      const parsed = parseDistrito(o.district ?? '');
      if (filters.grade && parsed.grade !== filters.grade) return false;
      if (filters.side && parsed.side !== filters.side) return false;
    }
    if (filters.mode !== '2') {
      const sroVal = store.sroIntranetCache[o.trackingCode ?? ''];
      if (sroVal?.sit) {
        if (filters.sroExcludes.includes(sroVal.sit.toUpperCase()))
          return false;
        if (ignoreList.length > 0) {
          const lower = sroVal.sit.toLowerCase();
          for (const ig of ignoreList) if (lower.includes(ig)) return false;
        }
      }
    }
    return true;
  });
}

export async function fetchObjectsByCategory(
  catType: FetchCategory,
  districts: DistrictData[],
  store: LoecStore,
  fetchProxy: (url: string) => Promise<string>,
  onProgress: (
    done: number,
    total: number,
    success: number,
    failed: number
  ) => void,
  onError?: (info: FetchErrorInfo) => void,
  shouldAbort?: () => boolean,
  concurrency = RUNTIME_DEFAULTS.LIMITS.LOEC_CONCURRENCY
): Promise<DeliveryObject[]> {
  const targetTable = document.getElementById(LOEC_DOM_IDS.TARGET_TABLE);
  let targetColor: string | null = null;

  if (targetTable) {
    const colIdx = catType === 'today' ? 4 : catType === 'overdue' ? 3 : 5;
    const rows = targetTable.querySelectorAll<HTMLTableRowElement>('tbody tr');
    for (const tr of rows) {
      const tds = tr.querySelectorAll('td');
      if (tds.length > colIdx) {
        const cell = tds[colIdx];
        const span = cell.querySelector('span') ?? cell;
        const val =
          parseInt(
            (span as HTMLElement).innerText?.replace(/[^0-9]/g, '') ?? '0',
            10
          ) || 0;
        if (val > 0) {
          targetColor = normalizeColor(
            (span as HTMLElement).style?.color ||
              (window.getComputedStyle
                ? window.getComputedStyle(span as HTMLElement).color
                : null)
          );
          break;
        }
      }
    }
  }

  const distsToQuery = districts.filter((d) => {
    if (catType === 'today') return parseNumber(d.correios_qtdeHoje) > 0;
    if (catType === 'overdue') return parseNumber(d.correios_qtdeVencido) > 0;
    return parseNumber(d.correios_qtdeAVencer) > 0;
  });

  const allObjs: DeliveryObject[] = [];
  let done = 0,
    success = 0,
    failed = 0;
  const total = distsToQuery.length;

  const queue = [...distsToQuery];
  const limit = Math.max(1, Math.min(concurrency, queue.length));

  const runWorker = async () => {
    while (queue.length > 0) {
      if (shouldAbort?.()) return;
      const dist = queue.shift();
      if (!dist) return;
      try {
        const arr = await withTimeout(
          getLoecObjectsByLancamento(
            dist.correios_idLancamento,
            store,
            fetchProxy
          ),
          FETCH_TIMEOUT_MS
        );
        success++;
        for (const rawObj of arr as any[]) {
          const obj = {
            correios_cor: rawObj.cor,
            correios_objeto: rawObj.objeto,
            correios_endereco: rawObj.endereco,
            correios_cep: rawObj.cep,
            correios_dataMaximaEntrega: rawObj.dataMaximaEntrega
          };
          if (
            matchesCategory(
              obj,
              catType,
              normalizeColor(obj.correios_cor),
              targetColor
            )
          ) {
            allObjs.push({
              trackingCode: obj.correios_objeto,
              address: obj.correios_endereco,
              zipCode: obj.correios_cep,
              maxDeliveryDate: obj.correios_dataMaximaEntrega,
              color: obj.correios_cor,
              district: dist.correios_numeroDistrito,
              postmanId: dist.correios_matriculaCarteiro,
              postmanName: dist.correios_nomeCarteiro,
              sroCode: dist.correios_codigoSro
            });
          }
        }
      } catch (err) {
        failed++;
        const districtId = (dist.correios_numeroDistrito ?? '').toString();
        onError?.({
          districtId,
          reason: isTimeoutError(err) ? 'timeout' : 'request'
        });
      } finally {
        done++;
        onProgress(done, total, success, failed);
      }
    }
  };

  const workers = Array.from({ length: limit }, runWorker);
  await Promise.all(workers);

  return allObjs;
}

function matchesCategory(
  obj: any,
  catType: FetchCategory,
  color: string,
  targetColor: string | null
): boolean {
  if (targetColor && color)
    return (
      colorsMatch(color, targetColor) ||
      (catType === 'today' && color.includes('196,94,24'))
    );
  if (catType === 'today')
    return (
      color.includes('196,94,24') ||
      color.includes('orange') ||
      color.includes('#c45e18') ||
      color.includes('#f97316')
    );
  if (catType === 'overdue')
    return (
      color === 'red' || color.includes('#ef4444') || color.includes('255,0,0')
    );
  return (
    color === 'green' || color.includes('#10b981') || color.includes('0,128,0')
  );
}

function parseNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  return parseInt((v ?? '').toString().replace(/<[^>]*>/g, ''), 10) || 0;
}

function isTimeoutError(err: unknown): boolean {
  return err instanceof Error && err.message === TIMEOUT_ERROR_MESSAGE;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(TIMEOUT_ERROR_MESSAGE));
    }, timeoutMs);

    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        reject(err);
      });
  });
}
