import { SROINTRANET_ORIGIN } from '../../../shared/constants/urls.js';
import type { FetchProxyOptions } from '../../../shared/fetch/proxy.js';
import { fetchDetailedTracking } from '../../../shared/sro/intranet-fetcher.js';

let activeOverlay: HTMLElement | null = null;
let previousFocus: HTMLElement | null = null;
let activeOverlayCleanup: (() => void) | null = null;

export async function showTrackingOverlay(
  initialObjCode: string,
  currentUnitId: string,
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
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.backdropFilter = 'blur(2px)';

  const modal = document.createElement('div');
  modal.style.backgroundColor = '#fff';
  modal.style.borderRadius = '8px';
  modal.style.width = '95vw';
  modal.style.maxWidth = '900px';
  modal.style.maxHeight = '90vh';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
  modal.style.fontFamily = 'Arial, sans-serif';

  const header = document.createElement('div');
  header.style.padding = '16px';
  header.style.borderBottom = '1px solid #eee';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.backgroundColor = '#f8f9fa';
  header.style.borderTopLeftRadius = '8px';
  header.style.borderTopRightRadius = '8px';

  const titleContainer = document.createElement('div');
  titleContainer.style.display = 'flex';
  titleContainer.style.alignItems = 'center';
  titleContainer.style.gap = '12px';

  const title = document.createElement('h2');
  title.style.margin = '0';
  title.style.fontSize = '18px';
  title.style.color = '#333';
  title.innerText = 'Rastreamento:';

  titleContainer.appendChild(title);

  const codeLink = document.createElement('a');
  codeLink.target = '_blank';
  codeLink.style.textDecoration = 'none';
  codeLink.style.fontSize = '18px';
  codeLink.style.fontWeight = 'bold';
  codeLink.style.display = 'inline-block';
  codeLink.style.color = '#999';
  codeLink.innerText = '-------------';
  codeLink.addEventListener('mouseenter', () => {
    if (codeLink.hasAttribute('href'))
      codeLink.style.textDecoration = 'underline';
  });
  codeLink.addEventListener('mouseleave', () => {
    codeLink.style.textDecoration = 'none';
  });

  const refreshBtn = document.createElement('button');
  refreshBtn.style.marginLeft = '8px';
  refreshBtn.style.padding = '4px 8px';
  refreshBtn.style.border = '1px solid #ccc';
  refreshBtn.style.borderRadius = '4px';
  refreshBtn.style.backgroundColor = '#fff';
  refreshBtn.style.cursor = 'pointer';
  refreshBtn.style.display = 'none';

  let currentObjCode = initialObjCode;
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  let refreshInterval: ReturnType<typeof setInterval> | null = null;
  const clearTimers = () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  };
  const content = document.createElement('div');
  content.style.padding = '16px';
  content.style.overflowY = 'auto';
  content.style.flex = '1';

  refreshBtn.addEventListener('click', () => {
    if (!refreshBtn.disabled && currentObjCode) {
      triggerSearch(currentObjCode);
    }
  });

  const updatePreview = (b: string, s: string) => {
    const p1 = (b.substring(0, 2) + '--').substring(0, 2);
    const p2 = (b.substring(2, 11) + '---------').substring(0, 9);
    const p3 = (s + '--').substring(0, 2);

    codeLink.innerText = `${p1}${p2}${p3}`;

    const fullCode = b + s;
    if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(fullCode)) {
      codeLink.style.color = '#2455A0';
      codeLink.href = `${SROINTRANET_ORIGIN}/rastreamento?objetos=${fullCode}`;
    } else {
      codeLink.style.color = '#999';
      codeLink.removeAttribute('href');
    }
  };

  const triggerSearch = async (code: string) => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
    refreshBtn.style.display = 'none';

    currentObjCode = code;
    updatePreview(code.substring(0, 11), code.substring(11, 13));

    content.innerHTML =
      '<div style="text-align:center; padding: 20px; color: #666;">Buscando histórico completo...</div>';
    try {
      const { events, detailsFailed } = await fetchDetailedTracking(
        code,
        fetchProxy
      );

      const notFoundEvent = events.find(
        (e) => e.sit && e.sit.toLowerCase().includes('não encontrado')
      );
      if (events.length === 0 || notFoundEvent) {
        content.innerHTML =
          '<div style="text-align:center; padding: 20px; color: #d9534f;">Objeto não encontrado no sistema.</div>';
      } else {
        content.innerHTML = '';
        if (detailsFailed > 0) {
          const warn = document.createElement('div');
          warn.style.padding = '10px 12px';
          warn.style.border = '1px solid #f0ad4e';
          warn.style.borderRadius = '6px';
          warn.style.backgroundColor = '#fff8e5';
          warn.style.color = '#8a6d3b';
          warn.style.marginBottom = '12px';
          warn.innerText =
            'Alguns detalhes não puderam ser carregados. Tente atualizar.';
          content.appendChild(warn);
        }
        events.forEach((evt) => {
          const card = document.createElement('div');
          card.style.border = '1px solid #ddd';
          card.style.borderRadius = '6px';
          card.style.padding = '12px';
          card.style.marginBottom = '12px';
          card.style.backgroundColor = '#fafafa';

          if (
            currentUnitId &&
            evt.local.toUpperCase().includes(currentUnitId)
          ) {
            card.style.backgroundColor = '#eaf4fe';
            card.style.borderLeft = '4px solid #4da6ff';
          } else {
            card.style.borderLeft = '4px solid #ddd';
          }

          const row1 = document.createElement('div');
          row1.style.display = 'flex';
          row1.style.justifyContent = 'space-between';
          row1.style.marginBottom = '8px';

          const titleWrapper = document.createElement('div');
          if (evt.params) {
            const link = document.createElement('a');
            link.href = '#';
            link.innerText = evt.sit;
            link.style.color = '#2455A0';
            link.style.fontWeight = 'bold';
            link.style.textDecoration = 'none';

            link.addEventListener('click', (e) => {
              e.preventDefault();
              const form = document.createElement('form');
              form.target = '_blank';
              form.method = 'POST';
              form.action = `${SROINTRANET_ORIGIN}/rastreamento`;

              for (const [k, v] of Object.entries(evt.params!)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = k;
                input.value = v;
                form.appendChild(input);
              }

              const emptyList = document.createElement('input');
              emptyList.type = 'hidden';
              emptyList.name = 'listaTituloObjetos';
              emptyList.value = '';
              form.appendChild(emptyList);

              document.body.appendChild(form);
              form.submit();
              document.body.removeChild(form);
            });
            titleWrapper.appendChild(link);
          } else {
            const strong = document.createElement('strong');
            strong.style.color = '#2455A0';
            strong.innerText = evt.sit;
            titleWrapper.appendChild(strong);
          }

          const dhSpan = document.createElement('span');
          dhSpan.style.color = '#666';
          dhSpan.style.fontSize = '13px';
          dhSpan.innerText = evt.dh;

          row1.appendChild(titleWrapper);
          row1.appendChild(dhSpan);

          const row2 = document.createElement('div');
          row2.style.fontSize = '13px';
          row2.style.color = '#444';
          row2.style.marginBottom = '8px';
          row2.innerHTML = `<span style="color: #666;">Local:</span> <span style="color: #333;">${evt.local}</span>`;

          card.appendChild(row1);
          card.appendChild(row2);

          if (evt.details && Object.keys(evt.details).length > 0) {
            const detailsDiv = document.createElement('div');
            detailsDiv.style.marginTop = '8px';
            detailsDiv.style.paddingTop = '8px';
            detailsDiv.style.borderTop = '1px dashed #ccc';
            detailsDiv.style.fontSize = '12px';
            detailsDiv.style.display = 'grid';
            detailsDiv.style.gridTemplateColumns = '1fr 1fr';
            detailsDiv.style.gap = '4px 8px';

            for (const [key, val] of Object.entries(evt.details)) {
              const item = document.createElement('div');
              item.innerHTML = `<span style="color: #666;">${key}:</span> <span style="color: #333;">${val}</span>`;
              detailsDiv.appendChild(item);
            }
            card.appendChild(detailsDiv);
          }

          content.appendChild(card);
        });
      }

      refreshBtn.style.display = 'inline-block';
      refreshBtn.disabled = true;
      let countdown = 5;
      refreshBtn.innerText = `Atualizar (${countdown}s)`;
      refreshInterval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          if (refreshInterval) clearInterval(refreshInterval);
          refreshBtn.disabled = false;
          refreshBtn.innerText = 'Atualizar';
        } else {
          refreshBtn.innerText = `Atualizar (${countdown}s)`;
        }
      }, 1000);
    } catch (err) {
      content.innerHTML = `<div style="text-align:center; padding: 20px; color: #d9534f;">Erro ao buscar dados.</div>`;
      refreshBtn.style.display = 'inline-block';
      refreshBtn.disabled = false;
      refreshBtn.innerText = 'Tentar novamente';
    }
  };

  const inputContainer = document.createElement('div');
  inputContainer.style.display = 'flex';
  inputContainer.style.gap = '8px';

  const createInput = (maxLen: number, width: string, val: string) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = maxLen;
    input.style.width = width;
    input.style.padding = '4px 8px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '4px';
    input.style.fontSize = '16px';
    input.style.fontWeight = 'bold';
    input.style.color = '#2455A0';
    input.style.textTransform = 'uppercase';
    input.style.backgroundColor = val ? '#fff' : '#f0f0f0';
    input.value = val;
    input.addEventListener('input', () => {
      input.style.backgroundColor = input.value.trim() ? '#fff' : '#f0f0f0';
    });
    return input;
  };

  let initBody = '';
  let initSuffix = 'BR';
  if (initialObjCode && initialObjCode.length >= 11) {
    initBody = initialObjCode.substring(0, 11);
    if (initialObjCode.length === 13) {
      initSuffix = initialObjCode.substring(11, 13);
    }
  } else if (initialObjCode) {
    initBody = initialObjCode;
  }

  const bodyInput = createInput(11, '160px', initBody);
  const suffixInput = createInput(2, '40px', initSuffix);

  updatePreview(initBody, initSuffix);

  const handleInput = () => {
    let b = bodyInput.value.trim().toUpperCase();
    let s = suffixInput.value.trim().toUpperCase();

    b = b.replace(/[^A-Z0-9]/g, '');
    s = s.replace(/[^A-Z]/g, '');

    let parsedBody = '';
    for (let i = 0; i < b.length; i++) {
      if (i < 2) {
        if (/[A-Z]/.test(b[i])) parsedBody += b[i];
      } else if (i < 11) {
        if (/[0-9]/.test(b[i])) parsedBody += b[i];
      }
    }

    bodyInput.value = parsedBody;
    suffixInput.value = s;
    bodyInput.style.backgroundColor = parsedBody ? '#fff' : '#f0f0f0';
    suffixInput.style.backgroundColor = s ? '#fff' : '#f0f0f0';

    updatePreview(parsedBody, s);

    const fullCode = parsedBody + s;
    if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(fullCode)) {
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        triggerSearch(fullCode);
      }, 1000);
    }
  };

  bodyInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData?.getData('text') || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (pasted.length >= 11) {
      bodyInput.value = pasted.substring(0, 11);
      if (pasted.length === 13) {
        suffixInput.value = pasted.substring(11, 13);
      }
    } else {
      bodyInput.value = pasted;
    }
    handleInput();
  });

  bodyInput.addEventListener('input', handleInput);
  suffixInput.addEventListener('input', handleInput);

  inputContainer.appendChild(bodyInput);
  inputContainer.appendChild(suffixInput);
  titleContainer.appendChild(inputContainer);

  setTimeout(() => {
    if (!initialObjCode) bodyInput.focus();
  }, 100);

  titleContainer.insertBefore(codeLink, inputContainer);

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.border = 'none';
  closeBtn.style.background = 'transparent';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.lineHeight = '1';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#666';

  header.appendChild(titleContainer);
  header.appendChild(closeBtn);
  modal.appendChild(header);
  modal.appendChild(content);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  activeOverlay = overlay;

  const restorePreviousFocus = () => {
    if (
      previousFocus &&
      typeof previousFocus.focus === 'function' &&
      document.contains(previousFocus)
    ) {
      previousFocus.focus();
    }
  };

  const closeOverlay = () => {
    clearTimers();
    if (activeOverlay) {
      activeOverlay.remove();
      activeOverlay = null;
    }
    restorePreviousFocus();
    document.removeEventListener('keydown', handleKeydown, true);
    activeOverlayCleanup = null;
  };

  closeBtn.addEventListener('click', closeOverlay);

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeOverlay();
    }
  };
  document.addEventListener('keydown', handleKeydown, true);
  activeOverlayCleanup = closeOverlay;

  if (initialObjCode) {
    triggerSearch(initialObjCode);
  } else {
    content.innerHTML =
      '<div style="text-align:center; padding: 20px; color: #666;">Digite o código do objeto...</div>';
  }
}
