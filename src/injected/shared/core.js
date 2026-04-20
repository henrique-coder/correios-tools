function createInjectedCore() {
  const PATH = window.location.pathname.toLowerCase();
  const DEFAULTS = globalThis.CW_DEFAULTS || {
    EVENTS: {
      FETCH_REQ: '_CW_FETCH_REQ_',
      FETCH_RES: '_CW_FETCH_RES_'
    }
  };

  const __cwStore = {
    sroBP: null,
    ctArqLastData: null,
    sroIntranetCache: {},
    sroIntranetCacheId: Date.now(),
    loecObjectCache: {},
    isFetchingArqSro: false,
    parseDist: (dStr) => {
      const match = (dStr || '').match(/^(\d)(\d*)\s*([a-zA-Z]*)/i);
      if (match)
        return {
          grade: match[1],
          side: match[3] ? match[3].toUpperCase() : ''
        };
      return { grade: '', side: '' };
    }
  };

  function fetchMonitor(url) {
    return new Promise((resolve, reject) => {
      const reqId = Date.now() + Math.random();
      const listener = (e) => {
        if (
          e.origin !== window.location.origin ||
          e.source !== window ||
          !e.data ||
          e.data.type !== DEFAULTS.EVENTS.FETCH_RES ||
          e.data.id !== reqId
        )
          return;
        window.removeEventListener('message', listener);
        if (e.data.response && e.data.response.success)
          resolve(e.data.response.data);
        else
          reject(
            new Error(e.data.response ? e.data.response.error : 'Sem resposta')
          );
      };
      window.addEventListener('message', listener);
      window.postMessage(
        { type: DEFAULTS.EVENTS.FETCH_REQ, id: reqId, url: url },
        window.location.origin
      );
    });
  }

  return { PATH, DEFAULTS, __cwStore, fetchMonitor };
}
