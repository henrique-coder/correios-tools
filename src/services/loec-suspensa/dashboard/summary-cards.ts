import { parseNumber } from '../../../shared/utils/format.js';
import type { DistrictData } from '../state.js';

export function buildSummaryCards(districts: DistrictData[]): {
  totalObjs: number;
  totalPts: number;
  totalVencidos: number;
  totalToday: number;
  totalDueSoon: number;
  totalArs: number;
  html: string;
} {
  let totalObjs = 0,
    totalPts = 0,
    totalVencidos = 0,
    totalToday = 0,
    totalDueSoon = 0,
    totalArs = 0;

  for (const d of districts) {
    totalObjs += parseNumber(d.correios_qtde);
    totalPts += parseNumber(d.correios_qtdePontos);
    totalVencidos += parseNumber(d.correios_qtdeVencido);
    totalToday += parseNumber(d.correios_qtdeHoje);
    totalDueSoon += parseNumber(d.correios_qtdeAVencer);
    totalArs += parseNumber(d.correios_qtdeAR);
  }

  const card = (
    color: string,
    label: string,
    value: number | string,
    sub: string
  ) =>
    `<div style="background:#fff;padding:20px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);border-left:4px solid ${color}">
      <div style="font-size:11px;color:#64748b;font-weight:700;letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px">${label}</div>
      <div style="font-size:28px;font-weight:800;color:${color};line-height:1">${value}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:8px">${sub}</div>
    </div>`;

  const html = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px">
    ${card('#3b82f6', 'Carga Total', `${totalObjs} <span style="font-size:14px;color:#64748b;font-weight:500">objs</span>`, `📍 ${totalPts} pontos | 📝 ${totalArs} ARs`)}
    ${card('#ef4444', 'Vencidos', totalVencidos, 'Prioridade Máxima')}
    ${card('#f97316', 'Vencem Hoje', totalToday, 'SLA Diário')}
    ${card('#10b981', 'A Vencer', totalDueSoon, 'Fluxo Controlado')}
  </div>`;

  return {
    totalObjs,
    totalPts,
    totalVencidos,
    totalToday,
    totalDueSoon,
    totalArs,
    html
  };
}
