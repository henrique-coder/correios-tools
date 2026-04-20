const api = typeof browser !== 'undefined' ? browser : chrome;
const DEFAULTS = globalThis.CW_DEFAULTS;

if (!DEFAULTS) {
  throw new Error(
    '[Correios Wizard] CW_DEFAULTS ausente. Execute o build para injetar os defaults de runtime.'
  );
}

const SROWEB_INDEX_URL = DEFAULTS.URLS.SROWEB_INDEX;
const FETCH_PROXY_ACTION = DEFAULTS.ACTIONS.FETCH_PROXY;
const FETCH_TIMEOUT_MS = DEFAULTS.LIMITS.FETCH_TIMEOUT_MS;
const ALLOWED_PROXY_HOSTS = new Set(DEFAULTS.SECURITY.ALLOWED_PROXY_HOSTS);

function isAllowedHost(hostname) {
  return ALLOWED_PROXY_HOSTS.has(hostname);
}

function isTrustedSender(sender) {
  try {
    if (!sender || !sender.url) return false;
    const senderUrl = new URL(sender.url);
    return senderUrl.protocol === 'https:' && isAllowedHost(senderUrl.hostname);
  } catch {
    return false;
  }
}

function parseProxyUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    throw new Error('URL inválida');
  }

  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'https:') {
    throw new Error('Somente HTTPS é permitido');
  }
  if (!isAllowedHost(parsed.hostname)) {
    throw new Error('Host não permitido');
  }
  return parsed;
}

function extractCharset(contentType, hostname) {
  const charsetMatch = /charset=([^\s;]+)/i.exec(contentType || '');
  if (charsetMatch && charsetMatch[1]) {
    return charsetMatch[1];
  }
  return hostname.endsWith('correios.com.br') ? 'iso-8859-1' : 'utf-8';
}

async function proxyFetchText(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const charset = extractCharset(
      response.headers.get('content-type') || '',
      url.hostname
    );
    const buffer = await response.arrayBuffer();

    try {
      return new TextDecoder(charset).decode(buffer);
    } catch {
      return new TextDecoder('iso-8859-1').decode(buffer);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

api.action.onClicked.addListener(() => {
  api.tabs.create({ url: SROWEB_INDEX_URL });
});

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || request.action !== FETCH_PROXY_ACTION) {
    return false;
  }

  if (!isTrustedSender(sender)) {
    sendResponse({
      success: false,
      error: 'Origem do sender não permitida'
    });
    return false;
  }

  let parsedUrl;
  try {
    parsedUrl = parseProxyUrl(request.url);
  } catch (err) {
    sendResponse({
      success: false,
      error: err.message || 'URL inválida'
    });
    return false;
  }

  proxyFetchText(parsedUrl)
    .then((text) => sendResponse({ success: true, data: text }))
    .catch((err) =>
      sendResponse({
        success: false,
        error: err.message || 'Falha no proxy de fetch'
      })
    );

  return true;
});
