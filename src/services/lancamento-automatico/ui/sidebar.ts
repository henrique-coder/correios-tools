import { DOM_IDS } from '../../../shared/constants/dom-elements.js';
import type { FetchProxyOptions } from '../../../shared/fetch/proxy.js';
import { waitForElement } from '../../../shared/utils/dom.js';
import { showCepSearchOverlay } from './cep-search-modal.js';
import { showTrackingOverlay } from './tracking-modal.js';

export async function injectSidebarButtons(
  fetchProxy: (url: string, options?: FetchProxyOptions) => Promise<string>
): Promise<void> {
  try {
    const sidebar = await waitForElement<HTMLElement>('.aberto', 200, 100); // Wait up to 20s
    if (!sidebar) return;

    if (document.getElementById('cw-btn-tracking')) return;

    const btnTracking = document.createElement('a');
    btnTracking.id = 'cw-btn-tracking';
    btnTracking.className = 'cw-sidebar-btn';
    btnTracking.tabIndex = 1;
    btnTracking.style.cssText =
      'cursor:pointer; background:#e0f2fe; color:#1e40af; font-weight:bold; border-left:4px solid #3b82f6; display:block; padding:10px 15px; text-decoration:none; margin-top: 8px;';
    btnTracking.innerHTML = '🚀 Rastreamento Avançado';

    const btnCep = document.createElement('a');
    btnCep.id = 'cw-btn-cep';
    btnCep.className = 'cw-sidebar-btn';
    btnCep.tabIndex = 1;
    btnCep.style.cssText =
      'cursor:pointer; background:#fef3c7; color:#854d0e; font-weight:bold; border-left:4px solid #eab308; display:block; padding:10px 15px; text-decoration:none; margin-top: 4px; border-bottom:1px solid #ccc;';
    btnCep.innerHTML = '📍 Pesquisa de Distrito';

    btnTracking.addEventListener('click', (e) => {
      e.preventDefault();
      const txtObj = document.getElementById(
        DOM_IDS.OBJECT_INPUT
      ) as HTMLInputElement;
      let obj = txtObj ? txtObj.value.trim().toUpperCase() : '';
      if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(obj) && !/^\d{9}$/.test(obj)) {
        obj = '';
      }

      let currentUnitName = '';
      const unitEl = document.querySelector<HTMLElement>('.nome[tabindex="1"]');
      if (unitEl && unitEl.innerText) {
        const match = unitEl.innerText.match(/^\s*\d{8}\s*-\s*([^|/]+)/);
        if (match) currentUnitName = match[1].trim().toUpperCase();
      }

      showTrackingOverlay(obj, currentUnitName, fetchProxy);
    });

    btnCep.addEventListener('click', (e) => {
      e.preventDefault();
      showCepSearchOverlay(fetchProxy);
    });

    sidebar.appendChild(btnTracking);
    sidebar.appendChild(btnCep);
  } catch {}
}
