// Exportar el plano a PDF con DESCARGA real (jsPDF, sin popup ni servicios externos).
// Página 1: croquis del plano (mesas posicionadas a escala + nombre).
// Páginas siguientes: lista de invitados por mesa (asiento + nombre).
// Datos reales: planSpaceActive.tables, table.guests, event.invitados_array.
import { jsPDF } from 'jspdf';

interface ExportArgs {
  planSpaceActive: any
  event: any
  planoTitle: string
}

// Colores de marca (RGB para jsPDF).
const C = {
  bg: [240, 240, 242] as [number, number, number],
  border: [231, 231, 234] as [number, number, number],
  ink: [58, 58, 66] as [number, number, number],
  muted: [138, 138, 144] as [number, number, number],
  pink: [239, 91, 148] as [number, number, number],
  line: [242, 242, 244] as [number, number, number],
};

export const exportPlanoPdf = ({ planSpaceActive, event, planoTitle }: ExportArgs): boolean => {
  try {
    const tables: any[] = planSpaceActive?.tables ?? [];
    const guestsById: Record<string, any> = {};
    (event?.invitados_array ?? []).forEach((g: any) => { if (g?._id) guestsById[g._id] = g; });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const M = 40;

    // ---------- PÁGINA 1: croquis del plano ----------
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...C.ink);
    doc.text(String(planoTitle || 'Plano'), M, M + 4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...C.muted);
    doc.text(`${tables.length} mesa${tables.length === 1 ? '' : 's'}${event?.nombre ? '  ·  ' + event.nombre : ''}`, M, M + 20);

    const areaX = M, areaY = M + 34;
    const areaW = pw - M * 2, areaH = ph - areaY - M;
    doc.setDrawColor(...C.border); doc.setLineWidth(1);
    doc.roundedRect(areaX, areaY, areaW, areaH, 8, 8, 'S');

    const W = planSpaceActive?.size?.width || 1400;
    const H = planSpaceActive?.size?.height || 1400;
    const scale = Math.min(areaW / W, areaH / H);
    const offX = areaX + (areaW - W * scale) / 2;
    const offY = areaY + (areaH - H * scale) / 2;

    if (tables.length === 0) {
      doc.setFontSize(12); doc.setTextColor(...C.muted);
      doc.text('Este plano no tiene mesas todavía.', pw / 2, areaY + areaH / 2, { align: 'center', baseline: 'middle' });
    }

    tables.forEach((tb: any) => {
      const x = offX + (tb?.position?.x ?? 0) * scale;
      const y = offY + (tb?.position?.y ?? 0) * scale;
      const w = (tb?.size?.width ?? 100) * scale;
      const h = (tb?.size?.height ?? 100) * scale;
      doc.setFillColor(...C.bg); doc.setDrawColor(...C.ink); doc.setLineWidth(1);
      const round = ['redonda', 'oval', 'podio'].includes(tb?.tipo);
      if (round) doc.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 'FD');
      else doc.roundedRect(x, y, w, h, 3, 3, 'FD');
      const label = String(tb?.title || tb?.nombre_mesa || '');
      if (label) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.max(5, Math.min(9, w / 7)));
        doc.setTextColor(...C.ink);
        doc.text(label, x + w / 2, y + h / 2, { align: 'center', baseline: 'middle', maxWidth: Math.max(20, w - 4) });
      }
    });

    // ---------- PÁGINAS 2+: invitados por mesa (2 columnas, con salto de página) ----------
    doc.addPage('letter', 'portrait');
    const pw2 = doc.internal.pageSize.getWidth();
    const ph2 = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...C.pink);
    doc.text('Invitados por mesa', M, M + 2);

    const colGap = 18;
    const colW = (pw2 - M * 2 - colGap) / 2;
    const colX = [M, M + colW + colGap];
    const topY = M + 22;
    const bottomY = ph2 - M;
    let col = 0;
    let y = topY;

    const newColumnOrPage = (blockH: number) => {
      if (y + blockH <= bottomY) return;
      if (col === 0) { col = 1; y = topY; }
      else { doc.addPage('letter', 'portrait'); col = 0; y = topY; }
    };

    if (tables.length === 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...C.muted);
      doc.text('Sin mesas.', M, topY + 6);
    }

    tables.forEach((tb: any) => {
      const guests = (tb?.guests ?? [])
        .slice()
        .sort((a: any, b: any) => (a?.chair ?? 0) - (b?.chair ?? 0));
      const rowH = 13;
      const headH = 20;
      const blockH = headH + Math.max(1, guests.length) * rowH + 8;
      newColumnOrPage(blockH);
      const x = colX[col];

      // header de la mesa
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...C.ink);
      const cap = tb?.numberChair ? ` / ${tb.numberChair}` : '';
      doc.text(String(tb?.title || tb?.nombre_mesa || 'Mesa'), x, y + 8, { maxWidth: colW - 40 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.muted);
      doc.text(`${guests.length}${cap}`, x + colW, y + 8, { align: 'right' });
      y += headH;

      if (guests.length === 0) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(...C.muted);
        doc.text('Sin invitados', x + 4, y + 2);
        y += rowH;
      } else {
        guests.forEach((gg: any) => {
          const guest = guestsById[gg?._id];
          doc.setDrawColor(...C.line); doc.setLineWidth(0.5);
          doc.line(x, y - 3, x + colW, y - 3);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...C.pink);
          doc.text(`A${(gg?.chair ?? 0) + 1}`, x + 2, y + 5);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.ink);
          doc.text(String(guest?.nombre || '—'), x + 26, y + 5, { maxWidth: colW - 30 });
          y += rowH;
        });
      }
      y += 10;
    });

    const fname = `${event?.nombre || 'evento'} ${planoTitle || 'plano'}`
      .replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') + '.pdf';
    doc.save(fname);
    return true;
  } catch (e) {
    console.error('[exportPlanoPdf]', e);
    return false;
  }
};
