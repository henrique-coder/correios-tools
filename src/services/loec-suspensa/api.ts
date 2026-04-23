import type { LoecStore } from './state.js';
import { SROWEB_ORIGIN } from '../../shared/constants/urls.js';

const MAX_CACHE_ENTRIES = 300;

export async function getLoecObjectsByLancamento(
  idLancamento: string | number,
  store: LoecStore,
  fetchProxy: (url: string) => Promise<string>
): Promise<unknown[]> {
  const key = String(idLancamento ?? '');
  if (!key) return [];

  const cached = store.loecObjectCache[key];
  if (Array.isArray(cached)) return cached;

  const text = await fetchProxy(
    `${SROWEB_ORIGIN}/app/entregaexternaautomatica/loecsuspensa/controllers/objetoController.php?acao=listar&idLancamento=${idLancamento}`
  );

  const parsed = JSON.parse(text);
  const result = Array.isArray(parsed) ? parsed : [];

  store.loecObjectCache[key] = result;

  if (Object.keys(store.loecObjectCache).length > MAX_CACHE_ENTRIES)
    store.loecObjectCache = {};

  return result;
}
