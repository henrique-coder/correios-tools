export const DOM_IDS = Object.freeze({
  CEP_INPUT: 'txtCEP',
  OBJECT_INPUT: 'txtObjeto',
  DISTRICT_SELECT: 'selDistrito',
  GRADE_SELECT: 'selGrade',
  ADDRESS_NUMBER_INPUT: 'txtNumero',
  ADDRESS_COMPLEMENT_INPUT: 'txtComplemento',
  ADDRESS_STREET_INPUT: 'txtLogradouro',
  ADDRESS_NEIGHBORHOOD_INPUT: 'txtBairro',
  ADDRESS_CITY_INPUT: 'txtMunicipio',
  UF_SELECT: 'selUf',
  INCLUDE_OBJECT_BUTTON: 'btnIncluirObjeto',
  MODAL_A_BUTTON: 'btnModalA',
  PRINT_NO_BUTTON: 'btnImprimirEtiquetaNao',
  ALERT_CONTAINER: 'alerta'
});

export const ADDRESS_INPUT_IDS = Object.freeze([
  DOM_IDS.CEP_INPUT,
  DOM_IDS.ADDRESS_NUMBER_INPUT,
  DOM_IDS.ADDRESS_COMPLEMENT_INPUT,
  DOM_IDS.ADDRESS_STREET_INPUT,
  DOM_IDS.ADDRESS_NEIGHBORHOOD_INPUT,
  DOM_IDS.ADDRESS_CITY_INPUT
]);

export const CEP_INPUT_SELECTORS = Object.freeze([
  `input#${DOM_IDS.CEP_INPUT}[name="${DOM_IDS.CEP_INPUT}"][type="search"]`,
  `input#${DOM_IDS.CEP_INPUT}[name="${DOM_IDS.CEP_INPUT}"][type="search"].invalid`,
  `input#${DOM_IDS.CEP_INPUT}[name="${DOM_IDS.CEP_INPUT}"][type="search"]:not(.invalid)`
]);

export const DOM_SELECTORS = Object.freeze({
  UNIT_NAME: '.nome[tabindex="1"]',
  FIELD_CONTAINER: '.campo',
  FIELD_MESSAGE: '.mensagem',
  ALERT_OK_BUTTON: `#${DOM_IDS.ALERT_CONTAINER}.aberto .act a`
});

export const LOEC_DOM_IDS = Object.freeze({
  TARGET_TABLE: 'tabela-rotulos',
  DASHBOARD_CONTAINER: 'loec-pro-dashboard',
  CHART_STATUS: 'chartjs-status',
  CHART_VOLUME: 'chartjs-volume',
  DISTRICT_GRID: 'ct-dist-grid',
  MONITOR_MODAL: 'ct-mon-modal',
  ARCHIVE_RESULT: 'ct-arq-result',
  ARCHIVE_EXPORT: 'ct-arq-export',
  ARCHIVE_PROGRESS: 'ct-arq-progress',
  ARCHIVE_BUTTON_TODAY: 'btn-arq-hoje',
  ARCHIVE_BUTTON_OVERDUE: 'btn-arq-vencidos',
  ARCHIVE_BUTTON_DUE_SOON: 'btn-arq-avencer',
  ARCHIVE_EXPORT_MODE: 'ct-arq-export-mode',
  ARCHIVE_DIST_FILTER: 'ct-arq-dist-filter',
  ARCHIVE_GRADE_FILTER: 'ct-arq-grade-filter',
  ARCHIVE_SIDE_FILTER: 'ct-arq-side-filter',
  ARCHIVE_SRO_IGNORE_TEXT: 'ct-arq-sro-ignore-text',
  ARCHIVE_SRO_MULTI_SELECT: 'ct-arq-sro-multi-select',
  ARCHIVE_SRO_MULTI_SELECT_LABEL: 'ct-arq-sro-multi-select-label',
  ARCHIVE_SRO_MULTI_LIST: 'ct-arq-sro-multi-list',
  ARCHIVE_SRO_DROPDOWN_CONTAINER: 'ct-arq-sro-dropdown-container',
  ARCHIVE_BTN_RELOAD_SRO: 'ct-arq-btn-reload-sro',
  ARCHIVE_BTN_PRINT: 'ct-arq-btn-print',
  ARCHIVE_BTN_COPY: 'ct-arq-btn-copy',
  ARCHIVE_BTN_TXT: 'ct-arq-btn-txt'
});

export const LOEC_DOM_SELECTORS = Object.freeze({
  BUTTONS_CONTAINER: '.botoes'
});
