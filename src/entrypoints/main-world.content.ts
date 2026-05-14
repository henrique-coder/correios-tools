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
  // 1. Try to get unitId from session cache first (fastest)
  try {
    const rawCache = sessionStorage.getItem(STORAGE_KEYS.BLOCKLIST_CACHE);
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (
        parsed &&
        typeof parsed.ts === 'number' &&
        Date.now() - parsed.ts < RUNTIME_DEFAULTS.LIMITS.BLOCKLIST_CACHE_TTL_MS
      ) {
        // If we have a cached result, we can trust it for this session/unit
        return parsed.blocked === true;
      }
    }
  } catch {}

  // 2. Need to find the unitId from the page
  let unitId: string | null = null;
  try {
    // We wait for the element, but with a reasonable timeout
    const el = await waitForElement<HTMLElement>(
      DOM_SELECTORS.UNIT_NAME,
      200,
      100 // 20s max
    );
    if (el && el.innerText) {
      const match = el.innerText.match(/^\s*(\d{8})/);
      unitId = match ? match[1] : null;
    }
  } catch {
    unitId = null;
  }

  if (!unitId) return false;

  // 3. Fetch from remote blocklist
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
    const path = window.location.pathname.toLowerCase();

    // If we are on lancamentoautomatico, we want to start the service
    // immediately to catch the print popup, while the blocklist check runs in the background.
    // If it turns out we are blocked, we should stop (though current services don't support full stop yet).

    if (path.includes('/lancamentoautomatico/')) {
      runAutoDispatchService(fetchProxy);
      // Optional: if blocked, we could try to "un-run" it, but for now,
      // the blocklist will just prevent it from starting in future loads
      // or we just accept the tiny window of execution for the print popup.
      if (await isCurrentUnitBlocked()) {
        // In a real scenario, we'd want to reload or disable the extension UI here.
        // For now, let's just not start the Loec service if blocked.
        return;
      }
    } else if (path.includes('/loecsuspensa/')) {
      if (await isCurrentUnitBlocked()) return;
      runSuspendedLoecService(fetchProxy);
    }
  }
});
