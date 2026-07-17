// Rediseño Fase D (fiel a MESAS.dc.html): exportar el plano a PDF.
// Sin dependencias: genera un HTML con croquis SVG (mesas posicionadas) + lista de
// invitados por mesa, lo abre en una ventana nueva y lanza print() → el usuario elige
// "Guardar como PDF". Usa datos reales (planSpaceActive.tables, table.guests,
// event.invitados_array). El _buildPDF del prototipo es solo referencia de layout.

const escapeHtml = (s: any): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>
  )[c]);

interface ExportArgs {
  planSpaceActive: any
  event: any
  planoTitle: string
}

export const exportPlanoPdf = ({ planSpaceActive, event, planoTitle }: ExportArgs): boolean => {
  const tables: any[] = planSpaceActive?.tables ?? [];
  const W = planSpaceActive?.size?.width || 1400;
  const H = planSpaceActive?.size?.height || 1400;

  const guestsById: Record<string, any> = {};
  (event?.invitados_array ?? []).forEach((g: any) => { if (g?._id) guestsById[g._id] = g; });

  const svgTables = tables.map((tb: any) => {
    const x = tb?.position?.x ?? 0;
    const y = tb?.position?.y ?? 0;
    const w = tb?.size?.width ?? 100;
    const h = tb?.size?.height ?? 100;
    const round = ['redonda', 'oval', 'podio'].includes(tb?.tipo);
    const shape = round
      ? `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="#F0F0F2" stroke="#3A3A42" stroke-width="2"/>`
      : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#F0F0F2" stroke="#3A3A42" stroke-width="2"/>`;
    const label = `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" font-size="24" font-weight="700" fill="#3A3A42" font-family="Poppins,Arial">${escapeHtml(tb?.title || tb?.nombre_mesa || '')}</text>`;
    return shape + label;
  }).join('');

  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;max-height:58vh;border:1px solid #E7E7EA;border-radius:12px;background:#fff">${svgTables}</svg>`;

  const lists = tables.map((tb: any) => {
    const rows = (tb?.guests ?? [])
      .slice()
      .sort((a: any, b: any) => (a?.chair ?? 0) - (b?.chair ?? 0))
      .map((gg: any) => {
        const guest = guestsById[gg?._id];
        return `<li><span class="seat">A${(gg?.chair ?? 0) + 1}</span> ${escapeHtml(guest?.nombre || '—')}</li>`;
      }).join('');
    const cap = tb?.numberChair ? ` / ${tb.numberChair}` : '';
    return `<div class="tbl"><h3>${escapeHtml(tb?.title || tb?.nombre_mesa || '')} <small>${tb?.guests?.length ?? 0}${cap}</small></h3><ul>${rows || '<li class="empty">Sin invitados</li>'}</ul></div>`;
  }).join('');

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(planoTitle)}</title>
<style>
  *{box-sizing:border-box} body{font-family:Poppins,Arial,sans-serif;color:#3A3A42;margin:28px}
  h1{font-size:22px;margin:0 0 4px} .sub{color:#8a8a90;font-size:12px;margin-bottom:18px}
  h2{font-size:15px;margin:22px 0 12px;color:#EF5B94}
  .lists{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
  .tbl{border:1px solid #E7E7EA;border-radius:10px;padding:10px 12px;break-inside:avoid}
  .tbl h3{font-size:13px;margin:0 0 6px} .tbl small{color:#a0a0a8;font-weight:500}
  .tbl ul{list-style:none;padding:0;margin:0} .tbl li{font-size:12px;padding:3px 0;border-top:1px solid #f2f2f4;display:flex;gap:8px;align-items:center}
  .tbl li:first-child{border-top:none} .seat{color:#EF5B94;font-weight:700;font-size:10px;min-width:26px}
  .empty{color:#c8c8ce}
  @media print{ body{margin:12mm} }
</style></head><body>
  <h1>${escapeHtml(planoTitle)}</h1>
  <div class="sub">${tables.length} mesas${event?.nombre ? ' · ' + escapeHtml(event.nombre) : ''}</div>
  <div class="croquis">${svg}</div>
  <h2>Invitados por mesa</h2>
  <div class="lists">${lists || '<div class="empty">Sin mesas</div>'}</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
};
