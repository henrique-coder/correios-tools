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

export function closeCepSearchOverlay(): void {
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = null;
  }
  if (activeOverlayCleanup) {
    activeOverlayCleanup();
    activeOverlayCleanup = null;
  }
  if (previousFocus && typeof previousFocus.focus === 'function') {
    previousFocus.focus();
  }
}

export async function showCepSearchOverlay(
  fetchProxy: (url: string, options?: FetchProxyOptions) => Promise<string>
): Promise<void> {
  // Close the tracking overlay if open
  const trackingOverlay = document.getElementById('cw-tracking-overlay');
  if (trackingOverlay) {
    window.dispatchEvent(new Event('cw-close-tracking'));
  }

  if (activeOverlay) {
    closeCepSearchOverlay();
  }

  previousFocus = document.activeElement as HTMLElement;

  const overlay = document.createElement('div');
  overlay.id = 'cw-cep-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.backdropFilter = 'blur(4px)';

  const modal = document.createElement('div');
  modal.style.backgroundColor = '#fff';
  modal.style.borderRadius = '12px';
  modal.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
  modal.style.width = '95vw';
  modal.style.maxWidth = '1100px';
  modal.style.height = '85vh';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.overflow = 'hidden';
  modal.style.fontFamily = 'Arial, sans-serif';

  const header = document.createElement('div');
  header.style.padding = '20px 24px';
  header.style.borderBottom = '1px solid #e2e8f0';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.backgroundColor = '#f8fafc';

  const title = document.createElement('h2');
  title.style.margin = '0';
  title.style.fontSize = '22px';
  title.style.color = '#1e293b';
  title.innerText = 'Pesquisa Rápida de Distrito por Endereço/CEP';
  header.appendChild(title);

  const closeBtn = document.createElement('button');
  closeBtn.innerText = '✕';
  closeBtn.style.background = 'transparent';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#64748b';
  closeBtn.addEventListener('click', closeCepSearchOverlay);
  header.appendChild(closeBtn);

  const content = document.createElement('div');
  content.style.display = 'flex';
  content.style.flex = '1';
  content.style.overflow = 'hidden';

  // Left Column: Search
  const searchCol = document.createElement('div');
  searchCol.style.flex = '1';
  searchCol.style.padding = '24px';
  searchCol.style.display = 'flex';
  searchCol.style.flexDirection = 'column';
  searchCol.style.gap = '16px';
  searchCol.style.borderRight = '1px solid #e2e8f0';
  searchCol.style.backgroundColor = '#ffffff';

  const inputWrapper = document.createElement('div');
  inputWrapper.style.position = 'relative';

  const inputFlex = document.createElement('div');
  inputFlex.style.display = 'flex';
  inputFlex.style.gap = '8px';
  inputFlex.style.width = '100%';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Digite um endereço ou CEP...';
  input.style.flex = '1';
  input.style.padding = '14px 16px';
  input.style.fontSize = '18px';
  input.style.border = '2px solid #cbd5e1';
  input.style.borderRadius = '8px';
  input.style.boxSizing = 'border-box';
  input.style.outline = 'none';
  input.style.transition = 'border-color 0.2s';
  input.addEventListener('focus', () => (input.style.borderColor = '#3b82f6'));
  input.addEventListener('blur', () => (input.style.borderColor = '#cbd5e1'));

  const numInput = document.createElement('input');
  numInput.type = 'text';
  numInput.placeholder = 'Nº';
  numInput.style.width = '100px';
  numInput.style.padding = '14px 16px';
  numInput.style.fontSize = '18px';
  numInput.style.border = '2px solid #cbd5e1';
  numInput.style.borderRadius = '8px';
  numInput.style.boxSizing = 'border-box';
  numInput.style.outline = 'none';
  numInput.style.transition = 'border-color 0.2s';
  numInput.addEventListener(
    'focus',
    () => (numInput.style.borderColor = '#3b82f6')
  );
  numInput.addEventListener(
    'blur',
    () => (numInput.style.borderColor = '#cbd5e1')
  );

  const gradeSelect = document.createElement('select');
  gradeSelect.style.width = '80px';
  gradeSelect.style.padding = '14px 10px';
  gradeSelect.style.fontSize = '16px';
  gradeSelect.style.border = '2px solid #cbd5e1';
  gradeSelect.style.borderRadius = '8px';
  gradeSelect.style.outline = 'none';
  gradeSelect.style.cursor = 'pointer';
  gradeSelect.innerHTML =
    '<option value="3">G3</option><option value="6">G6</option>';

  inputFlex.appendChild(input);
  inputFlex.appendChild(numInput);
  inputFlex.appendChild(gradeSelect);

  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.style.position = 'absolute';
  suggestionsContainer.style.top = '100%';
  suggestionsContainer.style.left = '0';
  suggestionsContainer.style.right = '0';
  suggestionsContainer.style.backgroundColor = '#fff';
  suggestionsContainer.style.border = '1px solid #cbd5e1';
  suggestionsContainer.style.borderTop = 'none';
  suggestionsContainer.style.borderBottomLeftRadius = '8px';
  suggestionsContainer.style.borderBottomRightRadius = '8px';
  suggestionsContainer.style.maxHeight = '250px';
  suggestionsContainer.style.overflowY = 'auto';
  suggestionsContainer.style.zIndex = '10';
  suggestionsContainer.style.display = 'none';
  suggestionsContainer.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';

  inputWrapper.appendChild(inputFlex);
  inputWrapper.appendChild(suggestionsContainer);
  searchCol.appendChild(inputWrapper);

  const resultContainer = document.createElement('div');
  resultContainer.style.flex = '1';
  resultContainer.style.overflowY = 'auto';
  resultContainer.style.marginTop = '8px';
  searchCol.appendChild(resultContainer);

  // Right Column: History
  const historyCol = document.createElement('div');
  historyCol.style.width = '350px';
  historyCol.style.padding = '24px';
  historyCol.style.display = 'flex';
  historyCol.style.flexDirection = 'column';
  historyCol.style.backgroundColor = '#f8fafc';
  historyCol.style.overflowY = 'auto';

  const historyTitle = document.createElement('h3');
  historyTitle.style.margin = '0 0 16px 0';
  historyTitle.style.fontSize = '16px';
  historyTitle.style.color = '#475569';
  historyTitle.style.textTransform = 'uppercase';
  historyTitle.innerText = 'Histórico Temporário';
  historyCol.appendChild(historyTitle);

  const historyContainer = document.createElement('div');
  historyContainer.style.display = 'flex';
  historyContainer.style.flexDirection = 'column';
  historyContainer.style.gap = '12px';
  historyCol.appendChild(historyContainer);

  content.appendChild(searchCol);
  content.appendChild(historyCol);

  modal.appendChild(header);
  modal.appendChild(content);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  activeOverlay = overlay;

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeCepSearchOverlay();
    }
  };
  document.addEventListener('keydown', handleKeydown, true);

  const handleCloseEvent = () => closeCepSearchOverlay();
  window.addEventListener('cw-close-cep', handleCloseEvent);

  activeOverlayCleanup = () => {
    document.removeEventListener('keydown', handleKeydown, true);
    window.removeEventListener('cw-close-cep', handleCloseEvent);
  };

  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) closeCepSearchOverlay();
  });

  const fetchCepDetails = async (
    cep: string,
    numero: string,
    hideSuggestions = true
  ) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    resultContainer.innerHTML =
      '<div style="color: #3b82f6; padding: 20px; text-align: center; font-size: 16px; font-weight: bold;">⏳ Buscando detalhes do endereço e distrito...</div>';
    if (hideSuggestions) {
      suggestionsContainer.style.display = 'none';
    }

    try {
      const grade = gradeSelect.value;
      const numParam = encodeURIComponent(numero);

      const addressUrl = `${SROWEB_ORIGIN}/app/entregaexternaautomatica/lancamentoautomatico/controllers/enderecoController.php?tipoPesquisa=cep&cep=${cleanCep}&documentoDestinatario=${numParam}`;
      let addressData = getCachedData<any>(addressUrl);
      if (!addressData) {
        const addressRes = await fetchProxy(addressUrl);
        if (addressRes && addressRes.trim() !== '') {
          try {
            addressData = JSON.parse(addressRes);
            if (addressData) setCachedData(addressUrl, addressData);
          } catch (e) {
            addressData = null;
          }
        }
      }

      const districtUrl = `${SROWEB_ORIGIN}/app/entregaexternaautomatica/lancamentoautomatico/controllers/distritamentoTrechoController.php?mcmcu=&cep=${cleanCep}&grade=${grade}`;
      let districtData = getCachedData<any[]>(districtUrl);
      if (!districtData) {
        const districtRes = await fetchProxy(districtUrl);
        if (districtRes && districtRes.trim() !== '') {
          try {
            districtData = JSON.parse(districtRes);
            if (Array.isArray(districtData))
              setCachedData(districtUrl, districtData);
          } catch (e) {
            districtData = [];
          }
        } else {
          districtData = [];
        }
      }

      let filteredDistrictData = districtData || [];
      if (numero && districtData && districtData.length > 0) {
        const n = parseInt(numero, 10);
        if (!isNaN(n)) {
          filteredDistrictData = districtData.filter((d) => {
            const min = parseInt(d.inicioDomicilio, 10);
            const max = parseInt(d.fimDomicilio, 10);
            return n >= min && n <= max;
          });
        }
      }

      if (addressData) {
        addressData._numero = numero; // store for the card attribute
      }

      renderResult(addressData, filteredDistrictData, hideSuggestions);
    } catch {
      resultContainer.innerHTML =
        '<div style="color: #ef4444; padding: 20px; text-align: center; font-size: 16px;">Erro ao buscar dados do CEP.</div>';
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

    suggestionsContainer.style.display = 'block';
    suggestionsContainer.innerHTML =
      '<div style="padding: 12px; color: #3b82f6; font-weight: bold;">⏳ Buscando na base dos Correios...</div>';

    debounceTimer = setTimeout(async () => {
      try {
        const grade = gradeSelect.value;
        const searchUrl = `${SROWEB_ORIGIN}/app/entregaexternaautomatica/lancamentoautomatico/controllers/logradouroController.php?search=${encodeURIComponent(val)}&numeroGrade=${grade}`;

        let results = getCachedData<any[]>(searchUrl);
        if (!results) {
          const res = await fetchProxy(searchUrl);
          if (res && res.trim() !== '') {
            results = JSON.parse(res);
            if (Array.isArray(results)) {
              setCachedData(searchUrl, results);
            } else {
              results = [];
            }
          } else {
            results = [];
          }
        }

        suggestionsContainer.innerHTML = '';
        if (results && results.length > 0) {
          if (results.length === 1) {
            // Only 1 result, skip suggestions dropdown and just fetch details
            suggestionsContainer.style.display = 'none';
            fetchCepDetails(results[0].cep || '', numInput.value.trim(), true);
            return;
          }

          results.forEach((item) => {
            const div = document.createElement('div');
            div.style.padding = '12px 16px';
            div.style.cursor = 'pointer';
            div.style.borderBottom = '1px solid #f1f5f9';
            div.style.fontSize = '15px';
            div.style.color = '#334155';
            div.innerText = item.text || item.logradouro || item.cep;

            div.addEventListener('mouseenter', () => {
              div.style.backgroundColor = '#f8fafc';
            });
            div.addEventListener('mouseleave', () => {
              div.style.backgroundColor = 'transparent';
            });
            div.addEventListener('click', () => {
              fetchCepDetails(item.cep || '', numInput.value.trim());
            });

            suggestionsContainer.appendChild(div);
          });
          suggestionsContainer.style.display = 'block';

          fetchCepDetails(results[0].cep || '', numInput.value.trim(), false);
        } else {
          suggestionsContainer.innerHTML =
            '<div style="padding: 12px; color: #ef4444;">Nenhum logradouro encontrado.</div>';
        }
      } catch {
        suggestionsContainer.innerHTML =
          '<div style="padding: 12px; color: #ef4444;">Erro na busca.</div>';
      }
    }, 500);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      numInput.focus();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();

      const card = resultContainer.querySelector('.cw-cep-result-card');
      if (card) {
        // Move to history
        const currentCep = card.getAttribute('data-cep') || '';
        const lastHistoryCard = historyContainer.firstElementChild;
        const lastCep = lastHistoryCard
          ? lastHistoryCard.getAttribute('data-cep')
          : '';

        if (currentCep && currentCep !== lastCep) {
          const clone = card.cloneNode(true) as HTMLElement;
          clone.style.fontSize = '12px';

          // Make the clone more compact
          const titles = clone.querySelectorAll<HTMLElement>('.cw-d-title');
          titles.forEach((t) => {
            t.style.fontSize = '16px';
            const span = t.querySelector('span');
            if (span) span.style.fontSize = '14px';
          });
          const values = clone.querySelectorAll<HTMLElement>('.cw-d-val');
          values.forEach((v) => {
            v.style.fontSize = '14px';
          });

          historyContainer.prepend(clone);
        }

        // Clear main view
        resultContainer.innerHTML = '';
        input.value = '';
        numInput.value = '';
        suggestionsContainer.style.display = 'none';
        input.focus();
      } else {
        const cleanCep = input.value.replace(/\D/g, '');
        if (cleanCep.length === 8) {
          fetchCepDetails(cleanCep, numInput.value.trim());
        } else {
          const firstSuggestion = suggestionsContainer.querySelector(
            'div[style*="cursor: pointer"]'
          );
          if (
            firstSuggestion &&
            suggestionsContainer.style.display === 'block'
          ) {
            (firstSuggestion as HTMLElement).click();
          }
        }
      }
    }
  });

  numInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      input.focus();
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const cleanCep = input.value.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        fetchCepDetails(cleanCep, numInput.value.trim());
      } else {
        const firstSuggestion = suggestionsContainer.querySelector(
          'div[style*="cursor: pointer"]'
        );
        if (firstSuggestion && suggestionsContainer.style.display === 'block') {
          (firstSuggestion as HTMLElement).click();
        }
      }
    }
  });

  numInput.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const cleanCep = input.value.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        fetchCepDetails(cleanCep, numInput.value.trim());
      }
    }, 500);
  });

  setTimeout(() => input.focus(), 50);
}
