import type { LoecStore, DeliveryObject } from '../state.js';
import { parseDistrito } from '../../../shared/utils/format.js';
import { normalizeColor, colorsMatch } from '../../../shared/utils/color.js';
import { getLoecObjectsByLancamento } from '../api.js';
import type { DistrictData } from '../state.js';

export type FetchCategory = 'hoje' | 'vencidos' | 'avencer';

export interface ArqFilters {
  mode: string;
  dist: string;
  grade: string;
  side: string;
  sroExcludes: string[];
  sroIgnoreText: string;
}

export function getArqFilters(): ArqFilters {
  const excludes: string[] = [];
  document
    .querySelectorAll<HTMLInputElement>('.ct-arq-sro-chk')
    .forEach((c) => {
      if (!c.checked) excludes.push(c.value);
    });
  return {
    mode:
      (document.getElementById('ct-arq-export-mode') as HTMLSelectElement)
        ?.value ?? '3',
    dist:
      (document.getElementById('ct-arq-dist-filter') as HTMLSelectElement)
        ?.value ?? '',
    grade:
      (document.getElementById('ct-arq-grade-filter') as HTMLSelectElement)
        ?.value ?? '',
    side:
      (document.getElementById('ct-arq-side-filter') as HTMLSelectElement)
        ?.value ?? '',
    sroExcludes: excludes,
    sroIgnoreText:
      (document.getElementById('ct-arq-sro-ignore-text') as HTMLInputElement)
        ?.value ?? ''
  };
}

export function getFilteredObjs(
  data: { cat: string; objs: DeliveryObject[] } | null,
  filters: ArqFilters,
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
  ) => void
): Promise<DeliveryObject[]> {
  const targetTable = document.getElementById('tabela-rotulos');
  let targetColor: string | null = null;

  if (targetTable) {
    const colIdx = catType === 'hoje' ? 4 : catType === 'vencidos' ? 3 : 5;
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
    if (catType === 'hoje') return parseNumber(d.todayQuantity) > 0;
    if (catType === 'vencidos') return parseNumber(d.overdueQuantity) > 0;
    return parseNumber(d.dueSoonQuantity) > 0;
  });

  const allObjs: DeliveryObject[] = [];
  let done = 0,
    success = 0,
    failed = 0;
  const total = distsToQuery.length;

  for (const dist of distsToQuery) {
    try {
      const arr = await getLoecObjectsByLancamento(
        dist.dispatchId,
        store,
        fetchProxy
      );
      success++;
      for (const obj of arr as any[]) {
        if (
          matchesCategory(obj, catType, normalizeColor(obj.cor), targetColor)
        ) {
          allObjs.push({
            ...obj,
            district: dist.districtNumber,
            postmanId: dist.postmanId,
            postmanName: dist.postmanName,
            sroCode: dist.sroCode
          });
        }
      }
    } catch {
      failed++;
    }
    done++;
    onProgress(done, total, success, failed);
  }

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
      (catType === 'hoje' && color.includes('196,94,24'))
    );
  if (catType === 'hoje')
    return (
      color.includes('196,94,24') ||
      color.includes('orange') ||
      color.includes('#c45e18') ||
      color.includes('#f97316')
    );
  if (catType === 'vencidos')
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
