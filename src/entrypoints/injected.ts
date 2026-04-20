import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { RUNTIME_DEFAULTS } from '../config/defaults.js';
import { runInjectedMain } from '../injected/index.js';

export default defineUnlistedScript(() => {
  if (typeof globalThis !== 'undefined') {
    globalThis.CW_DEFAULTS = RUNTIME_DEFAULTS;
  }

  runInjectedMain();
});
