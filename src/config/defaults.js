const ALLOWED_PROXY_HOSTS = Object.freeze([
  'sroweb.correios.com.br',
  'srointranet.correios.com.br',
  'sromonitor.correios.com.br'
]);

export const RUNTIME_DEFAULTS = Object.freeze({
  PROJECT_CODE: 'CORREIOS_WIZARD',
  ACTIONS: Object.freeze({
    FETCH_PROXY: 'FETCH_PROXY'
  }),
  EVENTS: Object.freeze({
    FETCH_REQ: '_CW_FETCH_REQ_',
    FETCH_RES: '_CW_FETCH_RES_'
  }),
  LIMITS: Object.freeze({
    FETCH_TIMEOUT_MS: 10000,
    REMOTE_STATUS_TIMEOUT_MS: 3500,
    REMOTE_STATUS_CACHE_TTL_MS: 300000
  }),
  URLS: Object.freeze({
    SROWEB_ORIGIN: 'https://sroweb.correios.com.br',
    SROINTRANET_ORIGIN: 'https://srointranet.correios.com.br',
    SROMONITOR_ORIGIN: 'https://sromonitor.correios.com.br',
    SROWEB_INDEX: 'https://sroweb.correios.com.br/app/index.php',
    REMOTE_STATUS:
      'https://raw.githubusercontent.com/henrique-coder/correios-wizard/refs/heads/prod/status.json'
  }),
  SECURITY: Object.freeze({
    ALLOWED_PROXY_HOSTS
  })
});
