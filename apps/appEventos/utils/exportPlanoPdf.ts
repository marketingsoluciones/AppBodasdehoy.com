// Exportar el plano a PDF con DESCARGA real (jsPDF, sin popup ni servicios externos).
// Página 1: croquis del plano (mesas + SILLAS ocupadas/libres + textos + muebles, a escala).
// Páginas siguientes: invitados por mesa (asiento + nombre) + invitados SIN mesa.
// Datos reales: planSpaceActive.tables, table.guests, planSpaceActive.elements, event.invitados_array.
import { jsPDF } from 'jspdf';

interface ExportArgs {
  planSpaceActive: any
  event: any
  planoTitle: string
  // Captura del lienzo (html2canvas, dataURL PNG). Si viene, la página 1 muestra el
  // plano TAL CUAL en la app. Si no, se dibuja el croquis vectorial.
  planoImage?: string
}

// Colores de marca (RGB para jsPDF).
const C = {
  bg: [240, 240, 242] as [number, number, number],
  border: [231, 231, 234] as [number, number, number],
  ink: [58, 58, 66] as [number, number, number],
  muted: [138, 138, 144] as [number, number, number],
  pink: [239, 91, 148] as [number, number, number],
  line: [242, 242, 244] as [number, number, number],
  chairEmpty: [200, 200, 208] as [number, number, number],
  furniture: [230, 230, 234] as [number, number, number],
};

const stripHtml = (s: any): string =>
  String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const ROUND_TIPOS = ['redonda', 'oval', 'podio'];

export const exportPlanoPdf = ({ planSpaceActive, event, planoTitle, planoImage }: ExportArgs): boolean => {
  try {
    const tables: any[] = planSpaceActive?.tables ?? [];
    const elements: any[] = planSpaceActive?.elements ?? [];
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

    // Si viene la CAPTURA del plano (html2canvas) → la pintamos = idéntico a la app.
    let usedImage = false;
    if (planoImage) {
      try {
        const props: any = doc.getImageProperties(planoImage);
        const pad = 10;
        const r = Math.min((areaW - pad * 2) / props.width, (areaH - pad * 2) / props.height);
        const iw = props.width * r, ih = props.height * r;
        doc.addImage(planoImage, 'PNG', areaX + (areaW - iw) / 2, areaY + (areaH - ih) / 2, iw, ih);
        usedImage = true;
      } catch { /* imagen inválida → se dibuja el croquis vectorial abajo */ }
    }

    // Croquis vectorial: SOLO si no se pudo usar la captura de la app.
    if (!usedImage) {
    const W = planSpaceActive?.size?.width || 1400;
    const H = planSpaceActive?.size?.height || 1400;
    // pad para que las sillas del borde no se salgan del área
    const scale = Math.min(areaW / (W * 1.06), areaH / (H * 1.06));
    const offX = areaX + (areaW - W * scale) / 2;
    const offY = areaY + (areaH - H * scale) / 2;
    const sx = (v: number) => offX + v * scale;
    const sy = (v: number) => offY + v * scale;

    if (tables.length === 0 && elements.length === 0) {
      doc.setFontSize(12); doc.setTextColor(...C.muted);
      doc.text('Este plano no tiene mesas todavía.', pw / 2, areaY + areaH / 2, { align: 'center', baseline: 'middle' });
    }

    // Muebles (elements no-texto): caja gris clara con etiqueta (fiel: gris claro).
    elements.filter((el) => el?.tipo !== 'text').forEach((el: any) => {
      const x = sx(el?.position?.x ?? 0), y = sy(el?.position?.y ?? 0);
      const w = (el?.size?.width ?? 60) * scale, h = (el?.size?.height ?? 60) * scale;
      doc.setFillColor(...C.furniture); doc.setDrawColor(...C.chairEmpty); doc.setLineWidth(0.6);
      doc.roundedRect(x, y, w, h, 3, 3, 'FD');
      const lbl = String(el?.tipo || '');
      if (lbl && w > 24) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(Math.max(5, Math.min(7, w / 8))); doc.setTextColor(...C.muted);
        doc.text(lbl, x + w / 2, y + h / 2, { align: 'center', baseline: 'middle', maxWidth: w - 4 });
      }
    });

    // Textos: contenido plano en su posición (con su fontSize).
    elements.filter((el) => el?.tipo === 'text').forEach((el: any) => {
      const txt = stripHtml(el?.title) || 'Escribe aquí';
      const x = sx((el?.position?.x ?? 0) + (el?.size?.width ?? 80) / 2);
      const y = sy((el?.position?.y ?? 0) + (el?.size?.height ?? 30) / 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(Math.max(6, Math.min(14, (el?.fontSize ?? 14) * scale * 1.4)));
      doc.setTextColor(...C.ink);
      doc.text(txt, x, y, { align: 'center', baseline: 'middle', maxWidth: Math.max(40, (el?.size?.width ?? 120) * scale) });
    });

    // Mesas + sillas.
    tables.forEach((tb: any) => {
      const x = sx(tb?.position?.x ?? 0);
      const y = sy(tb?.position?.y ?? 0);
      const w = (tb?.size?.width ?? 100) * scale;
      const h = (tb?.size?.height ?? 100) * scale;
      const cx = x + w / 2, cy = y + h / 2;
      const round = ROUND_TIPOS.includes(tb?.tipo);

      // sillas alrededor del perímetro
      const N = tb?.numberChair ?? (tb?.guests?.length ?? 0);
      const occupied = new Set((tb?.guests ?? []).map((g: any) => g?.chair));
      const chairR = Math.max(2.2, Math.min(w, h) * 0.09);
      const gap = chairR * 1.35;
      for (let i = 0; i < N; i++) {
        let px: number, py: number;
        if (round) {
          const th = (i / N) * Math.PI * 2 - Math.PI / 2;
          px = cx + (w / 2 + gap + chairR) * Math.cos(th);
          py = cy + (h / 2 + gap + chairR) * Math.sin(th);
        } else {
          // recorrido del perímetro del rectángulo
          const perim = 2 * (w + h);
          const d = ((i + 0.5) / N) * perim;
          const off = gap + chairR;
          if (d < w) { px = x + d; py = y - off; }
          else if (d < w + h) { px = x + w + off; py = y + (d - w); }
          else if (d < 2 * w + h) { px = x + w - (d - w - h); py = y + h + off; }
          else { px = x - off; py = y + h - (d - 2 * w - h); }
        }
        if (occupied.has(i)) doc.setFillColor(...C.pink);
        else doc.setFillColor(...C.chairEmpty);
        doc.circle(px, py, chairR, 'F');
      }

      // mesa
      doc.setFillColor(...C.bg); doc.setDrawColor(...C.ink); doc.setLineWidth(1);
      if (round) doc.ellipse(cx, cy, w / 2, h / 2, 'FD');
      else doc.roundedRect(x, y, w, h, 3, 3, 'FD');
      const label = String(tb?.title || tb?.nombre_mesa || '');
      if (label) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.max(5, Math.min(9, w / 7)));
        doc.setTextColor(...C.ink);
        doc.text(label, cx, cy, { align: 'center', baseline: 'middle', maxWidth: Math.max(20, w - 4) });
      }
    });
    } // fin croquis vectorial (solo si no hubo captura de la app)

    // ---------- PÁGINAS 2+: invitados por mesa + sin mesa (2 columnas) ----------
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

    const seatedIds = new Set<string>();

    if (tables.length === 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...C.muted);
      doc.text('Sin mesas.', M, topY + 6);
    }

    tables.forEach((tb: any) => {
      const guests = (tb?.guests ?? [])
        .slice()
        .sort((a: any, b: any) => (a?.chair ?? 0) - (b?.chair ?? 0));
      guests.forEach((g: any) => { if (g?._id) seatedIds.add(g._id); });
      const rowH = 13, headH = 20;
      const blockH = headH + Math.max(1, guests.length) * rowH + 8;
      newColumnOrPage(blockH);
      const x = colX[col];

      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...C.ink);
      const cap = tb?.numberChair ? ` / ${tb.numberChair}` : '';
      doc.text(String(tb?.title || tb?.nombre_mesa || 'Mesa'), x, y + 8, { maxWidth: colW - 40 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.muted);
      doc.text(`${guests.length}${cap}`, x + colW, y + 8, { align: 'right' });
      y += headH;

      if (guests.length === 0) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(...C.muted);
        doc.text('Sin invitados', x + 4, y + 2); y += rowH;
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

    // Invitados SIN mesa (por sentar).
    const sinMesa = (event?.invitados_array ?? []).filter((g: any) => g?._id && !seatedIds.has(g._id));
    if (sinMesa.length > 0) {
      const rowH = 13;
      newColumnOrPage(20 + sinMesa.length * rowH + 8);
      const x = colX[col];
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...C.pink);
      doc.text(`Sin mesa (${sinMesa.length})`, x, y + 8); y += 20;
      sinMesa.forEach((g: any) => {
        doc.setDrawColor(...C.line); doc.setLineWidth(0.5);
        doc.line(x, y - 3, x + colW, y - 3);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...C.ink);
        doc.text(String(g?.nombre || '—'), x + 4, y + 5, { maxWidth: colW - 8 });
        y += rowH;
      });
    }

    const fname = `${event?.nombre || 'evento'} ${planoTitle || 'plano'}`
      .replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') + '.pdf';
    doc.save(fname);
    return true;
  } catch (e) {
    console.error('[exportPlanoPdf]', e);
    return false;
  }
};
