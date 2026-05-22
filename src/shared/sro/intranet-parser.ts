export interface SroEntry {
  dh: string;
  sit: string;
}

export type SroCache = Record<string, SroEntry>;

export interface TrackingEventParams {
  opcao: string;
  codItem: string;
  codOperacao: string;
  codRegistro: string;
  tipoRegistro: string;
  dataCriacao: string;
  portal: string;
}

export interface TrackingEvent {
  dh: string;
  local: string;
  sit: string;
  params: TrackingEventParams | null;
  details: Record<string, string>;
}

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

export function parseTrackingHistory(html: string): TrackingEvent[] {
  const cleaned = html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  const doc = new DOMParser().parseFromString(cleaned, 'text/html');
  const events: TrackingEvent[] = [];

  doc.querySelectorAll('a[Name="DetalhesPesquisa"]').forEach((anchor) => {
    const tr = anchor.closest('tr');
    if (!tr) return;

    const tds = tr.querySelectorAll('td');
    if (tds.length < 4) return;

    const href = anchor.getAttribute('href') || '';
    let params: TrackingEventParams | null = null;
    const match = href.match(
      /DetalhesPesquisa\('([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)','([^']+)'\)/
    );
    if (match) {
      params = {
        opcao: match[1],
        codItem: match[2],
        codOperacao: match[3],
        codRegistro: match[4],
        tipoRegistro: match[5],
        dataCriacao: match[6],
        portal: match[7]
      };
    }

    events.push({
      dh: (tds[1] as HTMLElement).innerText.trim(),
      local: (tds[2] as HTMLElement).innerText.trim(),
      sit: (tds[3] as HTMLElement).innerText.trim(),
      params,
      details: {}
    });
  });

  return events;
}

export function parseTrackingDetails(html: string): Record<string, string> {
  const cleaned = html
    .replace(/<img[^>]*>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  const doc = new DOMParser().parseFromString(cleaned, 'text/html');
  const details: Record<string, string> = {};

  const table = doc.getElementById('dados');
  if (!table) return details;

  table.querySelectorAll('tr').forEach((tr) => {
    const tds = tr.querySelectorAll('td');
    if (tds.length >= 2) {
      let mainKey = (tds[0] as HTMLElement).innerText.trim();
      mainKey = mainKey.replace(/:$/, '').trim();
      if (!mainKey) return;

      const valTd = tds[1] as HTMLElement;
      const clone = valTd.cloneNode(true) as HTMLElement;

      clone.querySelectorAll('b, strong').forEach((b) => {
        let nestedKey = b.textContent?.trim().replace(/:$/, '') || '';
        if (nestedKey) {
          let nextNode = b.nextSibling;
          let nestedVal = '';
          while (
            nextNode &&
            nextNode.nodeName !== 'B' &&
            nextNode.nodeName !== 'STRONG'
          ) {
            nestedVal += nextNode.textContent || '';
            const toRemove = nextNode;
            nextNode = nextNode.nextSibling;
            toRemove.parentElement?.removeChild(toRemove);
          }
          nestedVal = nestedVal
            .replace(/^[:\s]+/, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (nestedVal) {
            details[nestedKey] = nestedVal;
          }
        }
        b.parentElement?.removeChild(b);
      });

      const mainVal = clone.innerText.replace(/\s+/g, ' ').trim();
      if (mainVal) {
        details[mainKey] = mainVal;
      }
    }
  });

  return details;
}

export function mergeSroCache(
  existing: SroCache,
  incoming: SroCache
): SroCache {
  const merged = { ...existing, ...incoming };
  const keys = Object.keys(merged);
  if (keys.length > MAX_CACHE_SIZE) {
    const keysToRemove = keys.slice(0, keys.length - MAX_CACHE_SIZE);
    for (const key of keysToRemove) {
      delete merged[key];
    }
  }
  return merged;
}
