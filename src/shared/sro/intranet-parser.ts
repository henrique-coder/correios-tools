export interface SroEntry {
  dh: string;
  sit: string;
}

export type SroCache = Record<string, SroEntry>;

const MAX_CACHE_SIZE = 5000;

export function parseIntranetHtml(html: string): SroCache {
  const cleaned = html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  const doc = new DOMParser().parseFromString(cleaned, 'text/html');
  const result: SroCache = {};

  doc.querySelectorAll('a[Name="Detalhes"]').forEach((anchor) => {
    const objCode = (anchor as HTMLElement).innerText.trim();
    const td = anchor.closest('td');
    if (!td?.parentElement) return;

    const tds = td.parentElement.querySelectorAll('td');
    if (tds.length < 4) return;

    result[objCode] = {
      dh: (tds[1] as HTMLElement).innerText.trim(),
      sit: (tds[3] as HTMLElement).innerText.trim()
    };
  });

  return result;
}

export function mergeSroCache(
  existing: SroCache,
  incoming: SroCache
): SroCache {
  const merged = { ...existing, ...incoming };
  if (Object.keys(merged).length > MAX_CACHE_SIZE) return {};
  return merged;
}
