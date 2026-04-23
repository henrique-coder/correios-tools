import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { RUNTIME_DEFAULTS } from '../config/defaults.js';

const SROWEB_INDEX_URL = RUNTIME_DEFAULTS.URLS.SROWEB_INDEX;
const FETCH_PROXY_ACTION = RUNTIME_DEFAULTS.ACTIONS.FETCH_PROXY;
const FETCH_TIMEOUT_MS = RUNTIME_DEFAULTS.LIMITS.FETCH_TIMEOUT_MS;
const ALLOWED_PROXY_HOSTS = new Set(
  RUNTIME_DEFAULTS.SECURITY.ALLOWED_PROXY_HOSTS
);

function isAllowedHost(hostname: string): boolean {
  return ALLOWED_PROXY_HOSTS.has(hostname);
}

function isTrustedSender(sender: any): boolean {
  try {
    if (!sender?.url) return false;
    const url = new URL(sender.url);
    return url.protocol === 'https:' && isAllowedHost(url.hostname);
  } catch {
    return false;
  }
}

function parseProxyUrl(rawUrl: string): URL {
  if (typeof rawUrl !== 'string' || !rawUrl.trim())
    throw new Error('URL invalida');
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'https:')
    throw new Error('Somente HTTPS e permitido');
  if (!isAllowedHost(parsed.hostname)) throw new Error('Host nao permitido');
  return parsed;
}

function extractCharset(contentType: string, hostname: string): string {
  const match = /charset=([^\s;]+)/i.exec(contentType ?? '');
  if (match?.[1]) return match[1];
  return hostname.endsWith('correios.com.br') ? 'iso-8859-1' : 'utf-8';
}

async function proxyFetchText(url: URL): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const charset = extractCharset(
      response.headers.get('content-type') ?? '',
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

export default defineBackground(() => {
  browser.action.onClicked.addListener(() => {
    browser.tabs.create({ url: SROWEB_INDEX_URL });
  });

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || request.action !== FETCH_PROXY_ACTION) return false;
    if (!isTrustedSender(sender)) {
      sendResponse({ success: false, error: 'Origem do sender nao permitida' });
      return false;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = parseProxyUrl(request.url);
    } catch (err) {
      sendResponse({
        success: false,
        error: err instanceof Error ? err.message : 'URL invalida'
      });
      return false;
    }

    proxyFetchText(parsedUrl)
      .then((text) => sendResponse({ success: true, data: text }))
      .catch((err) =>
        sendResponse({
          success: false,
          error: err instanceof Error ? err.message : 'Falha no proxy de fetch'
        })
      );

    return true;
  });
});
