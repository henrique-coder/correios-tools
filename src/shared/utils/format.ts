export function formatTrackingCode(code: string): string {
  if (!code || code.length !== 13) return code ?? '';
  return `<strong style="color:#00416B">${code.slice(0, 2)}</strong> ${code.slice(2, 5)} ${code.slice(5, 8)} <strong style="color:#00416B">${code.slice(8, 11)}</strong> ${code.slice(11)}`;
}

export function formatCarimbo(ts: string): string {
  if (!ts || ts.length < 18) return '--';
  return `${ts.substring(8, 10)}/${ts.substring(10, 12)}/${ts.substring(12, 16)} às ${ts.substring(16, 18)}:${ts.substring(18, 20)}`;
}

export function parseDistrito(dStr: string): { grade: string; side: string } {
  const match = (dStr ?? '').match(/^(\d)(\d*)\s*([a-zA-Z]*)/i);
  if (match)
    return { grade: match[1], side: match[3] ? match[3].toUpperCase() : '' };
  return { grade: '', side: '' };
}

export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseInt(value.toString().replace(/<[^>]*>/g, ''), 10) || 0;
}

export function buildMapUrl(address: {
  correios_logradouro: string;
  correios_numeroLogradouro: string;
  correios_complementoLogradouro: string;
  correios_bairro: string;
  correios_municipio: string;
  correios_uf: string;
}): string {
  const full = `${address.correios_logradouro}, ${address.correios_numeroLogradouro}${address.correios_complementoLogradouro && address.correios_complementoLogradouro !== '--' ? ' - ' + address.correios_complementoLogradouro : ''} - ${address.correios_bairro}, ${address.correios_municipio}/${address.correios_uf}`;
  const encoded = encodeURIComponent(full)
    .replace(/%20/g, '+')
    .replace(/%2C/g, ',');
  return `https://www.google.com/maps/search/${encoded}`;
}
