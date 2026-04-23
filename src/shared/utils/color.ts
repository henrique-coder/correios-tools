export function normalizeColor(color: unknown): string {
  if (!color) return '';
  return color.toString().replace(/\s+/g, '').toLowerCase();
}

export function colorsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.includes('rgb') && b.includes('rgb'))
    return a.replace(/[^0-9,]/g, '') === b.replace(/[^0-9,]/g, '');
  return false;
}

export function getSroStatusColor(sit: string): string {
  if (sit.includes('Entregue')) return '#10b981';
  if (sit.includes('Saiu')) return '#f97316';
  return '#64748b';
}
