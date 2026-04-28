import type { LoecStore } from './state.js';
import { SROWEB_ORIGIN } from '../../shared/constants/urls.js';

const MAX_CACHE_ENTRIES = 300;

export async function getLoecObjectsByLancamento(
  correios_idLancamento: string | number,
  store: LoecStore,
  fetchProxy: (url: string) => Promise<string>
): Promise<unknown[]> {
  const key = String(correios_idLancamento ?? '');
  if (!key) return [];

  const cached = store.loecObjectCache[key];
  if (Array.isArray(cached)) return cached;

  const correios_acao = 'listar';
  const text = await fetchProxy(
    `${SROWEB_ORIGIN}/app/entregaexternaautomatica/loecsuspensa/controllers/objetoController.php?acao=${correios_acao}&idLancamento=${correios_idLancamento}`
  );

  const parsed = JSON.parse(text);
  const result = Array.isArray(parsed) ? parsed : [];

  store.loecObjectCache[key] = result;

  if (Object.keys(store.loecObjectCache).length > MAX_CACHE_ENTRIES)
    store.loecObjectCache = {};

  return result;
}
