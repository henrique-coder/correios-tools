import { RUNTIME_DEFAULTS } from '../../config/defaults.js';
import { FETCH_REQ_EVENT, FETCH_RES_EVENT } from '../constants/urls.js';

export interface FetchProxyOptions {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  concurrencyHint?: number;
  retries?: number;
}

interface QueueItem {
  url: string;
  options?: FetchProxyOptions;
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
  attempt: number;
}

const hostQueues = new Map<string, QueueItem[]>();
const activeRequests = new Map<string, number>();

function getHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

async function executeProxyRequest(
  url: string,
  options?: FetchProxyOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (options?.signal?.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'));
    }

    const reqId = Date.now() + Math.random();
    const timeoutMs =
      options?.timeoutMs ?? RUNTIME_DEFAULTS.LIMITS.FETCH_TIMEOUT_MS;
    let timeoutId: ReturnType<typeof setTimeout>;

    const onAbort = () => {
      window.removeEventListener('message', listener);
      clearTimeout(timeoutId);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    if (options?.signal) {
      options.signal.addEventListener('abort', onAbort);
    }

    const listener = (e: MessageEvent) => {
      if (
        e.origin !== window.location.origin ||
        e.source !== window ||
        !e.data ||
        e.data.type !== FETCH_RES_EVENT ||
        e.data.id !== reqId
      )
        return;

      window.removeEventListener('message', listener);
      clearTimeout(timeoutId);
      if (options?.signal) options.signal.removeEventListener('abort', onAbort);

      if (e.data.response?.success) resolve(e.data.response.data);
      else reject(new Error(e.data.response?.error ?? 'Sem resposta'));
    };

    timeoutId = setTimeout(() => {
      window.removeEventListener('message', listener);
      if (options?.signal) options.signal.removeEventListener('abort', onAbort);
      reject(new Error('Fetch proxy timed out'));
    }, timeoutMs);

    window.addEventListener('message', listener);

    const safeOptions = options
      ? {
          method: options.method,
          body: options.body,
          headers: options.headers
        }
      : undefined;

    window.postMessage(
      { type: FETCH_REQ_EVENT, id: reqId, url, options: safeOptions },
      window.location.origin
    );
  });
}

function processQueue(host: string, maxConcurrency: number) {
  const queue = hostQueues.get(host) || [];
  const active = activeRequests.get(host) || 0;

  if (queue.length === 0 || active >= maxConcurrency) return;

  const item = queue.shift()!;
  activeRequests.set(host, active + 1);

  const delay = item.attempt > 0 ? Math.pow(2, item.attempt) * 500 : 0;

  setTimeout(async () => {
    try {
      if (item.options?.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      const data = await executeProxyRequest(item.url, item.options);
      item.resolve(data);
    } catch (err: any) {
      const isAbort = err.name === 'AbortError';
      const maxRetries = item.options?.retries ?? 3;
      if (!isAbort && item.attempt < maxRetries) {
        item.attempt++;
        queue.push(item);
      } else {
        item.reject(err);
      }
    } finally {
      activeRequests.set(host, (activeRequests.get(host) || 1) - 1);
      processQueue(host, maxConcurrency);
    }
  }, delay);

  processQueue(host, maxConcurrency);
}

export function createFetchProxy(): (
  url: string,
  options?: FetchProxyOptions
) => Promise<string> {
  return function fetchProxy(
    url: string,
    options?: FetchProxyOptions
  ): Promise<string> {
    const host = getHost(url);
    const limit = options?.concurrencyHint ?? 6;

    return new Promise((resolve, reject) => {
      const queue = hostQueues.get(host) || [];
      queue.push({ url, options, resolve, reject, attempt: 0 });
      hostQueues.set(host, queue);

      processQueue(host, limit);
    });
  };
}
