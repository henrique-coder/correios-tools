import { DOM_IDS } from '../../../shared/constants/dom-elements.js';
import type { FetchProxyOptions } from '../../../shared/fetch/proxy.js';
import { waitForElement } from '../../../shared/utils/dom.js';
import { showCepSearchOverlay } from './cep-search-modal.js';
import { showTrackingOverlay } from './tracking-modal.js';

export async function injectSidebarButtons(
  fetchProxy: (url: string, options?: FetchProxyOptions) => Promise<string>
): Promise<void> {
  try {
    // We want the specific '.aberto' that contains 'Entrega Externa' links
    const sidebars = document.querySelectorAll<HTMLElement>('.aberto');
    let targetSidebar: HTMLElement | null = null;

    for (const sb of Array.from(sidebars)) {
      if (sb.innerHTML.includes('imprimiretiquetatms')) {
        targetSidebar = sb;
        break;
      }
    }

    if (!targetSidebar) return;
    if (document.getElementById('cw-btn-tracking')) return;

    const btnTracking = document.createElement('a');
    btnTracking.id = 'cw-btn-tracking';
    btnTracking.className = 'cw-sidebar-btn';
    btnTracking.tabIndex = 1;
    btnTracking.style.cssText =
      'cursor:pointer; display:block; padding:10px 15px; text-decoration:none; margin-top: 8px; border-top: 1px dashed #ccc; font-weight: bold; color: #444;';
    btnTracking.innerHTML = 'Rastreamento Interno Rápido';

    const btnCep = document.createElement('a');
    btnCep.id = 'cw-btn-cep';
    btnCep.className = 'cw-sidebar-btn';
    btnCep.tabIndex = 1;
    btnCep.style.cssText =
      'cursor:pointer; display:block; padding:10px 15px; text-decoration:none; font-weight: bold; color: #444;';
    btnCep.innerHTML = 'Pesquisa Rápida de Distrito';

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

    targetSidebar.appendChild(btnTracking);
    targetSidebar.appendChild(btnCep);
  } catch {}
}
