import type { LoecStore, DeliveryObject } from '../state.js';
import { parseDistrito } from '../../../shared/utils/format.js';
import { downloadTextFile } from '../../../shared/utils/dom.js';
import { getArchiveFilters, getFilteredObjs } from './fetch-objects.js';

export function formatExportText(
  data: { cat: string; objs: DeliveryObject[] } | null,
  filters: ReturnType<typeof getArchiveFilters>,
  store: LoecStore
): string {
  if (!data?.objs?.length) return '';

  const filteredObjs = getFilteredObjs(data, filters, store);
  if (!filteredObjs.length) return '';

  const groups: Record<string, DeliveryObject[]> = {};
  for (const o of filteredObjs) {
    const key = `${o.district}-${o.sroCode ?? ''}-${o.postmanName ?? ''}-${o.postmanId ?? ''}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(o);
  }

  const out: string[] = [];
  let first = true;
  for (const groupObjs of Object.values(groups)) {
    if (!first) out.push('');
    first = false;
    const f = groupObjs[0];
    out.push(
      `Nome: ${f.postmanName ?? 'N/A'} - Matrícula: ${f.postmanId ?? '00000000'} - Unidade: ${f.sroCode ?? '00000000'} - Quantidade: ${groupObjs.length} - Categoria: ${data.cat} - Distrito: ${f.district}`
    );
    for (const o of groupObjs) {
      if (filters.mode === '1') out.push(o.trackingCode ?? '--');
      else if (filters.mode === '2')
        out.push(`${o.address ?? ''} ${o.zipCode ?? ''}`.trim());
      else
        out.push(
          `${o.trackingCode ?? '--'} - ${o.address ?? ''} ${o.zipCode ?? ''}`.trim()
        );
    }
  }
  return out.join('\r\n');
}

export function triggerCopyToClipboard(store: LoecStore): void {
  const filters = getArchiveFilters();
  const txt = formatExportText(store.archiveLastData, filters, store);
  if (txt) navigator.clipboard.writeText(txt);
}

export function triggerSaveTxt(store: LoecStore): void {
  const filters = getArchiveFilters();
  const txt = formatExportText(store.archiveLastData, filters, store);
  if (!txt || !store.archiveLastData) return;

  let name = `Export_${store.archiveLastData.cat}`;
  if (filters.grade) name += '_G' + filters.grade;
  if (filters.side) name += '_L' + filters.side;
  if (filters.dist) name += '_' + filters.dist.replace(/\s+/g, '_');

  downloadTextFile(txt, name + '.txt');
}

export function buildPrintContent(
  filteredObjs: DeliveryObject[],
  cat: string,
  store: LoecStore
): string {
  const distGroups: Record<string, DeliveryObject[]> = {};
  for (const o of filteredObjs) {
    const d = o.district ?? '--';
    if (!distGroups[d]) distGroups[d] = [];
    distGroups[d].push(o);
  }

  const sortedDists = Object.keys(distGroups).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const header = `<div style="display:flex;justify-content:space-between;gap:15px;margin-bottom:45px;align-items:stretch">
    <div style="flex:1.5;padding:8px 12px;border:1px solid #cbd5e1;border-radius:4px;background:#fafafa;display:flex;flex-direction:column">
      <p style="margin:0;color:#0f172a;font-size:13px;font-weight:bold">Observações:</p>
      <div style="border-bottom:1px solid #cbd5e1;margin-top:18px"></div>
      <div style="border-bottom:1px solid #cbd5e1;margin-top:16px"></div>
    </div>
    <div style="flex:1;padding:8px 12px;border:1px solid #cbd5e1;border-radius:4px;background:#fafafa;display:flex;flex-direction:column;justify-content:space-around">
      <p style="margin:0 0 10px 0;color:#0f172a;font-size:13px;font-weight:bold;white-space:nowrap">Resultado da busca:</p>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div style="display:flex;align-items:center;gap:6px;white-space:nowrap">
          <div style="width:14px;height:14px;border:1px solid #94a3b8;background:#fff"></div>
          <span style="font-size:12px;color:#334155;font-weight:600">100% Encontrados</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;white-space:nowrap">
          <div style="width:14px;height:14px;border:1px solid #94a3b8;background:#fff"></div>
          <span style="font-size:12px;color:#334155;font-weight:600">Faltou objetos, Qtd:</span>
          <div style="width:30px;border-bottom:1px solid #94a3b8;height:14px"></div>
        </div>
      </div>
    </div>
  </div>`;

  const groups = sortedDists
    .map((dist) => {
      const objs = distGroups[dist].sort((a, b) =>
        (a.trackingCode ?? '').localeCompare(b.trackingCode ?? '')
      );
      const first = objs[0];
      const items = objs
        .map((o) => {
          const m = (o.trackingCode ?? '').match(
            /^([A-Z]{2})(\d{3})(\d{3})(\d{3})([A-Z]{2})$/i
          );
          const sroData = o.trackingCode
            ? store.sroIntranetCache[o.trackingCode]
            : null;
          const sroSit = sroData?.sit
            ? `<div style="font-size:10px;font-weight:bold;margin-top:2px;text-transform:uppercase">${sroData.sit}</div>`
            : '';

          const display = m
            ? `<span style="background:#dbeafe;color:#1e3a8a;border-radius:3px;padding:1px 3px;font-weight:bold">${m[1]}</span> ${m[2]} ${m[3]} <span style="background:#fef9c3;color:#1e40af;border-radius:3px;padding:1px 3px;font-weight:bold">${m[4]}</span> ${m[5]}`
            : `<span style="font-weight:bold">${o.trackingCode ?? '--'}</span>`;
          return `<div style="display:flex;flex-direction:column;align-items:center;border-bottom:1px dashed #e2e8f0;padding-bottom:4px;font-family:monospace;font-size:14px;min-width:180px;justify-content:center;page-break-inside:avoid">
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:16px;height:16px;border:2px solid #94a3b8;border-radius:3px;box-sizing:border-box"></div>
          <div>${display}</div>
        </div>
        ${sroSit}
      </div>`;
        })
        .join('');

      return `<div class="print-dist-group" style="margin-bottom:45px;page-break-inside:auto;width:100%">
      <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;padding:10px;margin-bottom:12px;font-size:13px;text-align:center;page-break-inside:avoid">
        <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:20px;align-items:center;width:100%;margin-bottom:8px">
          <div style="font-size:16px;font-weight:bold;color:#0f172a">Distrito: ${dist}</div>
          <div style="display:flex;gap:15px;font-size:12px">
            <span><strong>Mat:</strong> ${first.postmanId ?? '--'}</span>
            <span><strong>Und:</strong> ${first.sroCode ?? '--'}</span>
            <span style="background:#e2e8f0;padding:2px 8px;border-radius:20px;font-weight:bold">Total: ${objs.length}</span>
          </div>
        </div>
        <div style="font-size:12px;border-top:1px dashed #cbd5e1;padding-top:8px;width:100%">
          <span><strong>Carteiro:</strong> ${first.postmanName ?? 'N/A'}</span>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px 25px;page-break-inside:auto">${items}</div>
    </div>`;
    })
    .join('');

  return header + groups;
}

export function printReport(store: LoecStore): void {
  const filters = getArchiveFilters();
  const data = store.archiveLastData;
  if (!data) return;
  const filteredObjs = getFilteredObjs(data, filters, store);
  if (!filteredObjs.length) return;

  const content = buildPrintContent(filteredObjs, data.cat, store);
  const dateStr = new Date().toLocaleString('pt-BR');

  const printSurface = `<div id="print-a4-surface" style="width:190mm;min-height:277mm;background:#fff;box-sizing:border-box;margin:0 auto">
    <div style="text-align:center;border-bottom:3px solid #0f172a;border-top:3px solid #0f172a;padding:10px 0;margin-bottom:20px">
      <h1 style="margin:0;color:#0f172a;font-size:24px;text-transform:uppercase;letter-spacing:1px">Relatório Analítico de Objetos - ${data.cat}</h1>
      <p style="margin:8px 0 0;color:#475569;font-size:14px"><strong>Gerado em:</strong> ${dateStr} | <strong>Total de Objetos:</strong> ${filteredObjs.length}</p>
    </div>
    ${content}
  </div>`;

  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0'
  });
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(`<html><head><title>Correios Wizard - Relatório A4</title>
    <style>@page{size:A4 portrait;margin:10mm}body{margin:0;font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff}.print-dist-group{page-break-after:auto;break-after:auto;page-break-inside:auto;break-inside:auto}.print-dist-group>div:first-child{page-break-after:avoid;break-after:avoid;page-break-inside:avoid;break-inside:avoid}</style>
    </head><body>${printSurface}</body></html>`);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => iframe.remove(), 2000);
  }, 400);
}
