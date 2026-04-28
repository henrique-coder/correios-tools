import type { LoecStore, DeliveryObject } from '../state.js';
import { parseDistrito } from '../../../shared/utils/format.js';
import { normalizeColor, colorsMatch } from '../../../shared/utils/color.js';
import { getLoecObjectsByLancamento } from '../api.js';
import type { DistrictData } from '../state.js';

export type FetchCategory = 'today' | 'overdue' | 'dueSoon';

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
  ) => void
): Promise<DeliveryObject[]> {
  const targetTable = document.getElementById('tabela-rotulos');
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

  for (const dist of distsToQuery) {
    try {
      const arr = await getLoecObjectsByLancamento(
        dist.correios_idLancamento,
        store,
        fetchProxy
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
