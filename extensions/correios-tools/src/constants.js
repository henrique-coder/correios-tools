export const STRINGS = {
  WAIT: "AGUARDANDO...",
  PREVIEW: "PREVISÃO",
  DATE_EMPTY: "--/--/----",
  EMPTY: "--",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
};

export const CACHE_KEYS = {
  POSITION: "correiostools-card-position",
  VIEW_MODE: "correiostools-view-mode",
  PANORAMA_STORE: "correiostools-panorama-cache",
};

export const URLS = {
  BASE_SROWEB: "https://sroweb.correios.com.br",
  SROWEB_INDEX: "https://sroweb.correios.com.br/app/index.php",
  INDUCTION_PAGE:
    "https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamentoautomatico/index.php",
  LOEC_PAGE: "https://sroweb.correios.com.br/app/entregaexternaautomatica/loecsuspensa/index.php",
  STREETVIEW_API: "https://streetview-henriquecoder.vercel.app/api/panorama",
  PANNELLUM_CSS: "https://cdn.jsdelivr.net/npm/pannellum@latest/build/pannellum.css",
  PANNELLUM_JS: "https://cdn.jsdelivr.net/npm/pannellum@latest/build/pannellum.js",
};

export const URL_PATTERNS = {
  INDUCTION: "/lancamentoautomatico/",
  LOEC_SUSPENSA: "/loecsuspensa/",
  VALIDATE_ACTION: "acao=validar",
  SEARCH_ACTION: "acao=pesquisar",
  SAVE_ACTION: "acao=salvar",
  DELETE_ACTION: "acao=excluir",
  LIST_ACTION: "acao=listar",
  ADDRESS_CONTROLLER: "enderecocontroller.php",
  DISTRICT_CONTROLLER: "distritamentotrechocontroller.php",
  LAUNCH_CONTROLLER: "lancamentoController.php",
};

export const TIMEOUTS = {
  CACHE_PANORAMA_TTL: 604800000,
  REQUEST_TIMEOUT: 10000,
  RETRY_DELAY: 1500,
  DOM_OBSERVER_INTERVAL: 50,
  DOM_OBSERVER_MAX_ATTEMPTS: 100,
  INJECT_TABLE_DELAY: 500,
  DASHBOARD_RENDER_DELAY: 300,
};

export const LIMITS = {
  MAX_RETRIES: 3,
  HASH_LENGTH: 12,
};

export const COLORS = {
  PRIMARY: "#00416B",
  ACCENT: "#FFE600",
  SUCCESS: "#009688",
  ERROR: "#d32f2f",
  INFO: "#1976d2",
  WARNING: "#f59e0b",
};
