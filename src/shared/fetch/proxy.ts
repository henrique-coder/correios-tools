import { FETCH_REQ_EVENT, FETCH_RES_EVENT } from '../constants/urls.js';

export function createFetchProxy(): (url: string) => Promise<string> {
  return function fetchProxy(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reqId = Date.now() + Math.random();

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

        if (e.data.response?.success) resolve(e.data.response.data);
        else reject(new Error(e.data.response?.error ?? 'Sem resposta'));
      };

      window.addEventListener('message', listener);
      window.postMessage(
        { type: FETCH_REQ_EVENT, id: reqId, url },
        window.location.origin
      );
    });
  };
}
