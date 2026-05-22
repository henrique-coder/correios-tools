import { RUNTIME_DEFAULTS } from '../../config/defaults.js';
import { SROINTRANET_ORIGIN } from '../constants/urls.js';
import type { FetchProxyOptions } from '../fetch/proxy.js';
import type { SroCache, TrackingEvent } from './intranet-parser.js';
import {
  parseIntranetHtml,
  parseTrackingDetails,
  parseTrackingHistory
} from './intranet-parser.js';

interface BatchFetchOptions {
  fetchFn: (url: string, options?: FetchProxyOptions) => Promise<string>;
  objects: string[];
  existingCache: SroCache;
  renderId: symbol;
  getRenderId: () => symbol;
  batchSize?: number;
  concurrency?: number;
  onBatchDone?: (resolved: SroCache, done: number, total: number) => void;
  onComplete?: () => void;
}

export async function fetchDetailedTracking(
  objCode: string,
  fetchFn: (url: string, options?: FetchProxyOptions) => Promise<string>
): Promise<{ events: TrackingEvent[]; detailsFailed: number }> {
  const url = `${SROINTRANET_ORIGIN}/rastreamento?objetos=${objCode}`;
  let html = '';
  try {
    html = await fetchFn(url);
  } catch {
    throw new Error('Tracking fetch failed');
  }

  const events = parseTrackingHistory(html);
  if (events.length === 0) return { events: [], detailsFailed: 0 };

  let detailsFailed = 0;

  const fetchDetail = async (event: TrackingEvent) => {
    if (!event.params) return;
    const p = event.params;
    const body = new URLSearchParams({
      opcao: p.opcao,
      idioma: '001',
      ambiente: 'INTRA',
      codItem: p.codItem,
      codOperacao: p.codOperacao,
      codRegistro: p.codRegistro,
      tipoRegistro: p.tipoRegistro,
      dataCriacao: p.dataCriacao,
      portal: p.portal,
      listaTituloObjetos: ''
    }).toString();

    try {
      const detailHtml = await fetchFn(`${SROINTRANET_ORIGIN}/rastreamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      });
      event.details = parseTrackingDetails(detailHtml);
    } catch {
      detailsFailed++;
    }
  };

  const limitConcurrency = async (items: TrackingEvent[], limit: number) => {
    let index = 0;
    const next = async (): Promise<void> => {
      if (index >= items.length) return;
      const current = items[index++];
      await fetchDetail(current);
      await next();
    };
    const workers = Array.from({ length: Math.min(limit, items.length) }, next);
    await Promise.all(workers);
  };

  await limitConcurrency(events, 5);

  return { events, detailsFailed };
}

export async function batchFetchSroIntranet(
  opts: BatchFetchOptions
): Promise<void> {
  const {
    fetchFn,
    objects,
    existingCache,
    renderId,
    getRenderId,
    batchSize = 50,
    concurrency = RUNTIME_DEFAULTS.LIMITS.SRO_BATCH_CONCURRENCY,
    onBatchDone,
    onComplete
  } = opts;

  const toFetch = [...new Set(objects.filter((o) => !existingCache[o]))];
  if (toFetch.length === 0) {
    onComplete?.();
    return;
  }

  const chunks: string[][] = [];
  for (let i = 0; i < toFetch.length; i += batchSize)
    chunks.push(toFetch.slice(i, i + batchSize));

  let chunkIdx = 0;
  let done = 0;
  const total = toFetch.length;

  const worker = async () => {
    while (chunkIdx < chunks.length) {
      if (getRenderId() !== renderId) return;

      const chunk = chunks[chunkIdx++];
      const url = `${SROINTRANET_ORIGIN}/rastreamento?objetos=${chunk.join(';')}`;
      let tries = 0;
      let resolved: SroCache = {};
      let success = false;

      while (tries < 3 && !success) {
        if (getRenderId() !== renderId) return;
        try {
          const text = await fetchFn(url);
          if (
            !text ||
            text.trim() === '' ||
            text.includes('Request Entity Too Large') ||
            text.includes('Method Not Allowed')
          )
            throw new Error('Invalid response');

          resolved = parseIntranetHtml(text);
          success =
            Object.keys(resolved).length > 0 ||
            text.includes('Nenhum objeto encontrado');

          if (!success && text.length < 500)
            throw new Error('Insufficient data');
        } catch {
          tries++;
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (success && getRenderId() === renderId) {
        done += chunk.length;
        onBatchDone?.(resolved, done, total);
      }
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, chunks.length) },
    worker
  );
  await Promise.all(workers);

  if (getRenderId() === renderId) onComplete?.();
}
