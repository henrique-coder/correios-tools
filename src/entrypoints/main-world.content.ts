import { defineContentScript } from 'wxt/utils/define-content-script';
import { RUNTIME_DEFAULTS } from '../config/defaults.js';
import { runAutoDispatchService } from '../services/lancamento-automatico/index.js';
import { runSuspendedLoecService } from '../services/loec-suspensa/index.js';
import { DOM_SELECTORS } from '../shared/constants/dom-elements.js';
import { STORAGE_KEYS } from '../shared/constants/storage-keys.js';
import { createFetchProxy } from '../shared/fetch/proxy.js';
import { waitForElement } from '../shared/utils/dom.js';

interface BlocklistResponse {
  block_all?: boolean;
  blocked_units?: Array<{ id: string; reason?: string }>;
}

async function isCurrentUnitBlocked(): Promise<boolean> {
  try {
    const rawCache = sessionStorage.getItem(STORAGE_KEYS.BLOCKLIST_CACHE);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (
        parsed &&
        typeof parsed.ts === 'number' &&
        Date.now() - parsed.ts < RUNTIME_DEFAULTS.LIMITS.BLOCKLIST_CACHE_TTL_MS
      ) {
        return parsed.blocked === true;
      }
    }
  } catch {}

  let unitId: string | null = null;
  try {
    const el = await waitForElement<HTMLElement>(
      DOM_SELECTORS.UNIT_NAME,
      200,
      100
    );
    if (el && el.innerText) {
      const match = el.innerText.match(/^\s*(\d{8})/);
      unitId = match ? match[1] : null;
    }
  } catch {
    unitId = null;
  }

  if (!unitId) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      RUNTIME_DEFAULTS.LIMITS.BLOCKLIST_TIMEOUT_MS
    );
    const response = await fetch(
      `${RUNTIME_DEFAULTS.URLS.BLOCKLIST}?_t=${Date.now()}`,
      {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return false;
    const data: BlocklistResponse = await response.json();
    if (!data) return false;

    const blocked =
      data.block_all === true ||
      (Array.isArray(data.blocked_units) &&
        data.blocked_units.some((u) => u.id === unitId));

    try {
      sessionStorage.setItem(
        STORAGE_KEYS.BLOCKLIST_CACHE,
        JSON.stringify({ ts: Date.now(), unitId, blocked })
      );
    } catch {}

    return blocked;
  } catch {
    return false;
  }
}

export default defineContentScript({
  matches: [
    'https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamentoautomatico/*',
    'https://sroweb.correios.com.br/app/entregaexternaautomatica/loecsuspensa/*'
  ],
  runAt: 'document_start',
  world: 'MAIN',
  allFrames: false,
  async main() {
    const fetchProxy = createFetchProxy();
    let currentService: 'lancamento' | 'loec' | null = null;

    const checkRoute = async () => {
      const path = window.location.pathname.toLowerCase();

      if (path.includes('/lancamentoautomatico/')) {
        if (currentService === 'lancamento') return;
        currentService = 'lancamento';
        runAutoDispatchService(fetchProxy);
        if (await isCurrentUnitBlocked()) return;
      } else if (path.includes('/loecsuspensa/')) {
        if (currentService === 'loec') return;
        currentService = 'loec';
        if (await isCurrentUnitBlocked()) return;
        runSuspendedLoecService(fetchProxy);
      } else {
        currentService = null;
      }
    };

    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      checkRoute();
      return result;
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      checkRoute();
      return result;
    };

    window.addEventListener('popstate', checkRoute);
    checkRoute();
  }
});
