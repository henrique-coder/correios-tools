import type { SroCache } from './intranet-parser.js';
import { parseIntranetHtml, mergeSroCache } from './intranet-parser.js';
import { SROINTRANET_ORIGIN } from '../constants/urls.js';

interface BatchFetchOptions {
  fetchFn: (url: string) => Promise<string>;
  objects: string[];
  existingCache: SroCache;
  renderId: symbol;
  getRenderId: () => symbol;
  batchSize?: number;
  concurrency?: number;
  onBatchDone?: (resolved: SroCache, done: number, total: number) => void;
  onComplete?: () => void;
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
    concurrency = 2,
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
