import { DOM_IDS } from '../../../shared/constants/dom-elements.js';
import { SROWEB_ORIGIN } from '../../../shared/constants/urls.js';
import type { FetchProxyOptions } from '../../../shared/fetch/proxy.js';

let activeOverlay: HTMLElement | null = null;
let previousFocus: HTMLElement | null = null;
let activeOverlayCleanup: (() => void) | null = null;

const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  cache.set(key, { timestamp: Date.now(), data });
}

export async function showCepSearchOverlay(
  fetchProxy: (url: string, options?: FetchProxyOptions) => Promise<string>
): Promise<void> {
  if (activeOverlay) {
    activeOverlayCleanup?.();
    return;
  }

  previousFocus = document.activeElement as HTMLElement;

  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'flex-start';
  overlay.style.paddingTop = '10vh';
  overlay.style.backdropFilter = 'blur(2px)';

  const modal = document.createElement('div');
  modal.style.backgroundColor = '#fff';
  modal.style.borderRadius = '8px';
  modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
  modal.style.width = '90%';
  modal.style.maxWidth = '500px';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.overflow = 'hidden';
  modal.style.fontFamily = 'Arial, sans-serif';

  const header = document.createElement('div');
  header.style.padding = '16px';
  header.style.borderBottom = '1px solid #eee';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.backgroundColor = '#f8f9fa';

  const title = document.createElement('h2');
  title.style.margin = '0';
  title.style.fontSize = '18px';
  title.style.color = '#333';
  title.innerText = 'Pesquisar Distrito por CEP';
  header.appendChild(title);

  const closeBtn = document.createElement('button');
  closeBtn.innerText = '✕';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#666';
  header.appendChild(closeBtn);

  const content = document.createElement('div');
  content.style.padding = '16px';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.gap = '12px';

  const inputWrapper = document.createElement('div');
  inputWrapper.style.position = 'relative';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Digite um CEP (apenas números)';
  input.style.width = '100%';
  input.style.padding = '10px';
  input.style.fontSize = '16px';
  input.style.border = '1px solid #ccc';
  input.style.borderRadius = '4px';
  input.style.boxSizing = 'border-box';
  input.style.outline = 'none';

  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.style.position = 'absolute';
  suggestionsContainer.style.top = '100%';
  suggestionsContainer.style.left = '0';
  suggestionsContainer.style.right = '0';
  suggestionsContainer.style.backgroundColor = '#fff';
  suggestionsContainer.style.border = '1px solid #ccc';
  suggestionsContainer.style.borderTop = 'none';
  suggestionsContainer.style.borderBottomLeftRadius = '4px';
  suggestionsContainer.style.borderBottomRightRadius = '4px';
  suggestionsContainer.style.maxHeight = '200px';
  suggestionsContainer.style.overflowY = 'auto';
  suggestionsContainer.style.zIndex = '10';
  suggestionsContainer.style.display = 'none';
  suggestionsContainer.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

  inputWrapper.appendChild(input);
  inputWrapper.appendChild(suggestionsContainer);
  content.appendChild(inputWrapper);

  const resultContainer = document.createElement('div');
  resultContainer.style.marginTop = '8px';
  content.appendChild(resultContainer);

  modal.appendChild(header);
  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  activeOverlay = overlay;

  const closeOverlay = () => {
    if (activeOverlay) {
      activeOverlay.remove();
      activeOverlay = null;
    }
    document.removeEventListener('keydown', handleKeydown, true);
    if (previousFocus && typeof previousFocus.focus === 'function') {
      previousFocus.focus();
    }
    activeOverlayCleanup = null;
  };
  closeBtn.addEventListener('click', closeOverlay);

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeOverlay();
    }
  };
  document.addEventListener('keydown', handleKeydown, true);
  activeOverlayCleanup = closeOverlay;

  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  const getCurrentGrade = (): string => {
    const sel = document.getElementById(
      DOM_IDS.GRADE_SELECT
    ) as HTMLSelectElement | null;
    if (sel && sel.value) return sel.value;
    return '3';
  };

  const renderResult = (addressData: any, districtData: any[]) => {
    suggestionsContainer.style.display = 'none';
    resultContainer.innerHTML = '';

    if (!addressData && (!districtData || districtData.length === 0)) {
      resultContainer.innerHTML =
        '<div style="color: #ef4444; padding: 10px; text-align: center;">Nenhum dado encontrado para este CEP.</div>';
      return;
    }

    const card = document.createElement('div');
    card.style.border = '1px solid #e2e8f0';
    card.style.borderRadius = '6px';
    card.style.overflow = 'hidden';

    let addressHtml = '';
    if (addressData) {
      addressHtml = `
        <div style="background: #f8fafc; padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: bold; color: #1e293b; font-size: 15px; margin-bottom: 4px;">${addressData.logradouro || ''}</div>
          <div style="color: #475569; font-size: 13px;">${addressData.bairro || ''} - ${addressData.municipio || ''}/${addressData.uf || ''}</div>
          <div style="color: #64748b; font-size: 12px; margin-top: 2px;">CEP: ${addressData.cep || ''}</div>
        </div>
      `;
    }

    let districtHtml = '<div style="padding: 12px;">';
    if (districtData && districtData.length > 0) {
      districtData.forEach((d) => {
        districtHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #f1f5f9; border-radius: 4px; margin-bottom: 8px;">
            <div>
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold;">Distrito</div>
              <div style="font-size: 18px; font-weight: bold; color: #0f172a;">${d.rotuloDistrito} <span style="color: #3b82f6;">${d.areaDistrito}</span></div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold;">Ordem</div>
              <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${d.ordemPercorrida}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold;">Lado</div>
              <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${d.lado}</div>
            </div>
          </div>
        `;
      });
    } else {
      districtHtml +=
        '<div style="color: #64748b; font-size: 13px; text-align: center;">Nenhum distrito mapeado para este CEP na grade atual.</div>';
    }
    districtHtml += '</div>';

    card.innerHTML = addressHtml + districtHtml;
    resultContainer.appendChild(card);
  };

  const fetchCepDetails = async (cep: string, hideSuggestions = true) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    resultContainer.innerHTML =
      '<div style="color: #64748b; padding: 10px; text-align: center;">Buscando detalhes...</div>';
    if (hideSuggestions) {
      suggestionsContainer.style.display = 'none';
    }

    try {
      const grade = getCurrentGrade();

      const addressUrl = `${SROWEB_ORIGIN}/app/entregaexternaautomatica/lancamentoautomatico/controllers/enderecoController.php?tipoPesquisa=cep&cep=${cleanCep}&documentoDestinatario=`;
      let addressData = getCachedData<any>(addressUrl);
      if (!addressData) {
        const addressRes = await fetchProxy(addressUrl);
        addressData = JSON.parse(addressRes);
        setCachedData(addressUrl, addressData);
      }

      const districtUrl = `${SROWEB_ORIGIN}/app/entregaexternaautomatica/lancamentoautomatico/controllers/distritamentoTrechoController.php?mcmcu=&cep=${cleanCep}&grade=${grade}`;
      let districtData = getCachedData<any[]>(districtUrl);
      if (!districtData) {
        const districtRes = await fetchProxy(districtUrl);
        districtData = JSON.parse(districtRes);
        setCachedData(districtUrl, districtData);
      }

      renderResult(addressData, districtData, hideSuggestions);
    } catch {
      resultContainer.innerHTML =
        '<div style="color: #ef4444; padding: 10px; text-align: center;">Erro ao buscar dados do CEP.</div>';
    }
  };

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  input.addEventListener('input', () => {
    const val = input.value.trim();

    if (debounceTimer) clearTimeout(debounceTimer);

    if (val.length < 3) {
      suggestionsContainer.style.display = 'none';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const grade = getCurrentGrade();
        const searchUrl = `${SROWEB_ORIGIN}/app/entregaexternaautomatica/lancamentoautomatico/controllers/logradouroController.php?search=${encodeURIComponent(val)}&numeroGrade=${grade}`;

        let results = getCachedData<any[]>(searchUrl);
        if (!results) {
          const res = await fetchProxy(searchUrl);
          results = JSON.parse(res);
          setCachedData(searchUrl, results);
        }

        suggestionsContainer.innerHTML = '';
        if (results && results.length > 0) {
          results.forEach((item) => {
            const div = document.createElement('div');
            div.style.padding = '8px 12px';
            div.style.cursor = 'pointer';
            div.style.borderBottom = '1px solid #f1f5f9';
            div.style.fontSize = '14px';
            div.style.color = '#334155';
            div.innerText = item.text || item.logradouro || item.cep;

            div.addEventListener('mouseenter', () => {
              div.style.backgroundColor = '#f8fafc';
            });
            div.addEventListener('mouseleave', () => {
              div.style.backgroundColor = 'transparent';
            });
            div.addEventListener('click', () => {
              input.value = item.cep || '';
              fetchCepDetails(item.cep || '');
            });

            suggestionsContainer.appendChild(div);
          });
          suggestionsContainer.style.display = 'block';

          // Automaticamente buscar detalhes do primeiro resultado, mas mantendo a lista de sugestões visível
          fetchCepDetails(results[0].cep || '', false);
        } else {
          suggestionsContainer.style.display = 'none';
        }
      } catch {
        suggestionsContainer.style.display = 'none';
      }
    }, 500);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleanCep = input.value.replace(/\\D/g, '');
      if (cleanCep.length === 8) {
        fetchCepDetails(cleanCep);
      } else {
        const firstSuggestion = suggestionsContainer.querySelector('div');
        if (firstSuggestion && suggestionsContainer.style.display === 'block') {
          firstSuggestion.click();
        }
      }
    }
  });

  setTimeout(() => input.focus(), 50);
}
