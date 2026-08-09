/**
 * HTML para /html-to-pdf del plano de mesas (mismo patrón que itinerario):
 * - Clona #lienzo-drop con CSS de la página + tipografías.
 * - Añade listado de invitados por mesa (HTML, no jsPDF).
 */
const MAX_HTML_CHARS = 3_500_000;

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Italiana&family=Montserrat:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap';

function absolutizeCssUrls(cssText: string, baseHref: string): string {
  return cssText.replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/gi, (_match, quote: string, rawUrl: string) => {
    const url = rawUrl.trim();
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
      return `url(${quote}${url}${quote})`;
    }
    try {
      return `url(${quote}${new URL(url, baseHref).href}${quote})`;
    } catch {
      return `url(${quote}${url}${quote})`;
    }
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolvePrimaryColor(): string {
  const probe =
    document.querySelector('.text-primary')
    ?? document.querySelector('.border-primary');
  if (probe instanceof HTMLElement) {
    const cs = window.getComputedStyle(probe);
    const color = cs.color || cs.borderTopColor;
    if (color && color !== 'rgba(0, 0, 0, 0)') return color;
  }
  return '#EF5B94';
}

function buildGuestsSectionHtml(planSpaceActive: any, event: any): string {
  const tables: any[] = planSpaceActive?.tables ?? [];
  const guestsById: Record<string, any> = {};
  (event?.invitados_array ?? []).forEach((g: any) => {
    if (g?._id) guestsById[g._id] = g;
  });
  const seatedIds = new Set<string>();

  const tableBlocks = tables.map((tb: any) => {
    const guests = (tb?.guests ?? [])
      .slice()
      .sort((a: any, b: any) => (a?.chair ?? 0) - (b?.chair ?? 0));
    guests.forEach((g: any) => {
      if (g?._id) seatedIds.add(g._id);
    });
    const cap = tb?.numberChair ? ` / ${tb.numberChair}` : '';
    const title = escapeHtml(String(tb?.title || tb?.nombre_mesa || 'Mesa'));
    const rows =
      guests.length === 0
        ? `<div class="pdf-guest-empty">Sin invitados</div>`
        : guests
            .map((gg: any) => {
              const guest = guestsById[gg?._id];
              const name = escapeHtml(String(guest?.nombre || '—'));
              const chair = (gg?.chair ?? 0) + 1;
              return `<div class="pdf-guest-row"><span class="pdf-chair">A${chair}</span><span>${name}</span></div>`;
            })
            .join('');
    return `<article class="pdf-table-block">
      <header class="pdf-table-head"><span>${title}</span><span class="pdf-muted">${guests.length}${cap}</span></header>
      ${rows}
    </article>`;
  }).join('');

  const sinMesa = (event?.invitados_array ?? []).filter(
    (g: any) => g?._id && !seatedIds.has(g._id),
  );
  const sinMesaBlock =
    sinMesa.length === 0
      ? ''
      : `<article class="pdf-table-block pdf-sin-mesa">
      <header class="pdf-table-head pdf-sin-mesa-head"><span>Sin mesa (${sinMesa.length})</span></header>
      ${sinMesa
        .map((g: any) => `<div class="pdf-guest-row"><span>${escapeHtml(String(g?.nombre || '—'))}</span></div>`)
        .join('')}
    </article>`;

  const empty =
    tables.length === 0
      ? `<p class="pdf-muted" style="grid-column:1/-1">Sin mesas.</p>`
      : '';

  return `<section class="pdf-guests" data-pdf-section="guests">
  <h2 class="pdf-guests-title">Invitados por mesa</h2>
  <div class="pdf-guests-grid">
    ${empty}${tableBlocks}${sinMesaBlock}
  </div>
</section>`;
}

export interface BuildPlanoPdfHtmlArgs {
  lienzoRoot: HTMLElement;
  planSpaceActive: any;
  event: any;
  planoTitle: string;
}

export function buildPlanoPdfHtml({
  lienzoRoot,
  planSpaceActive,
  event,
  planoTitle,
}: BuildPlanoPdfHtmlArgs): string {
  const origin = window.location.origin;
  const primary = resolvePrimaryColor();
  const clone = lienzoRoot.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.setAttribute('data-pdf-lienzo', '1');
  clone.classList.add('pdf-lienzo');

  clone.querySelectorAll('[data-pdf-hide], .ql-toolbar').forEach((el) => el.remove());

  clone.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;
    try {
      img.setAttribute('src', new URL(src, origin).href);
    } catch {
      /* ignore */
    }
  });

  const w = lienzoRoot.scrollWidth || planSpaceActive?.size?.width || 1400;
  const h = lienzoRoot.scrollHeight || planSpaceActive?.size?.height || 1400;
  // Letter landscape útil ≈ 960×560 px @96dpi (márgenes + cabecera con datos del evento).
  const scale = Math.min(1, 960 / w, 560 / h);

  const tablesCount = planSpaceActive?.tables?.length ?? 0;
  const lienzoW = Math.round((planSpaceActive?.size?.width ?? w) / 100 * 100) / 100;
  const lienzoH = Math.round((planSpaceActive?.size?.height ?? h) / 100 * 100) / 100;
  const lienzoLabel = `${lienzoW}×${lienzoH} m`;

  const formatEventDate = (raw: unknown): string => {
    if (raw == null || raw === '') return '—';
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    const d = Number.isFinite(n) ? new Date(n) : new Date(String(raw));
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const infoRows: Array<{ label: string; value: string }> = [
    { label: 'Evento', value: String(event?.nombre || '—') },
    { label: 'Tipo del evento', value: String(event?.tipo || '—') },
    { label: 'Mesas', value: String(tablesCount) },
    { label: 'Fecha', value: formatEventDate(event?.fecha) },
    { label: 'Lienzo', value: lienzoLabel },
  ];
  const infoHtml = infoRows
    .map(
      (row) =>
        `<div class="pdf-info-row"><span class="pdf-info-label">${escapeHtml(row.label)}:</span> <span class="pdf-info-value">${escapeHtml(row.value)}</span></div>`,
    )
    .join('');


  const headBits: string[] = [
    '<meta charset="utf-8" />',
    `<base href="${origin}/" />`,
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    `<link rel="stylesheet" href="${GOOGLE_FONTS_HREF}" />`,
  ];

  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = (link as HTMLLinkElement).href;
    if (!href || href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com')) return;
    headBits.push(`<link rel="stylesheet" href="${href.replace(/"/g, '&quot;')}" />`);
  });

  document.querySelectorAll('style').forEach((styleEl) => {
    const css = styleEl.textContent ?? '';
    if (css.trim()) {
      headBits.push(`<style>${absolutizeCssUrls(css, `${origin}/`)}</style>`);
    }
  });

  headBits.push(`<style id="pdf-plano-fonts">
    :root { --pdf-primary: ${primary}; }
    /* Plano = horizontal; invitados = vertical (named page). */
    @page { size: letter landscape; margin: 0.45in; }
    @page guests {
      size: letter portrait;
      margin: 0.45in;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff !important;
      font-family: Poppins, Montserrat, system-ui, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color: #3A3A42;
    }
    .font-title { font-family: Italiana, serif !important; }
    .font-display { font-family: Poppins, sans-serif !important; }
    [data-pdf-root="plano-mesas"] {
      max-width: 100%;
      margin: 0 auto;
      background: #fff;
    }
    .pdf-header {
      margin: 0 0 10px;
      padding: 0 4px;
    }
    .pdf-header h1 {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 700;
      color: #3A3A42;
      font-family: Poppins, sans-serif;
    }
    .pdf-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px 28px;
      font-size: 12px;
      line-height: 1.45;
      color: #3A3A42;
    }
    .pdf-info-label {
      font-weight: 600;
      color: #3A3A42;
    }
    .pdf-info-value {
      font-weight: 400;
      color: #5a5a62;
    }
    .pdf-plano-frame {
      border: 1px solid #e7e7ea;
      border-radius: 8px;
      overflow: hidden;
      background: #F3F1EC;
      width: ${Math.round(w * scale)}px;
      height: ${Math.round(h * scale)}px;
      margin: 0 auto;
    }
    .pdf-plano-scale {
      width: ${w}px;
      height: ${h}px;
      transform: scale(${scale});
      transform-origin: top left;
    }
    .pdf-lienzo {
      width: ${w}px !important;
      height: ${h}px !important;
      position: relative;
      background: #F3F1EC !important;
      background-image:
        linear-gradient(#E4E1D8 1px, transparent 1px),
        linear-gradient(90deg, #E4E1D8 1px, transparent 1px) !important;
      background-size: 44px 44px !important;
    }
    .pdf-guests {
      page: guests;
      break-before: page;
      page-break-before: always;
      padding-top: 4px;
    }
    .pdf-guests-title {
      margin: 0 0 14px;
      font-size: 18px;
      font-weight: 700;
      color: var(--pdf-primary);
    }
    .pdf-guests-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px 22px;
      align-content: start;
    }
    .pdf-table-block { break-inside: avoid; }
    .pdf-table-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 6px;
      color: #3A3A42;
    }
    .pdf-sin-mesa-head { color: var(--pdf-primary); }
    .pdf-muted { color: #8a8a90; font-weight: 500; }
    .pdf-guest-row {
      display: flex;
      gap: 10px;
      align-items: baseline;
      font-size: 12px;
      padding: 3px 0;
      border-top: 1px solid #f2f2f4;
    }
    .pdf-chair {
      font-weight: 700;
      color: var(--pdf-primary);
      min-width: 28px;
    }
    .pdf-guest-empty {
      font-size: 12px;
      font-style: italic;
      color: #8a8a90;
      padding: 2px 0 6px;
    }
  </style>`);

  const guestsHtml = buildGuestsSectionHtml(planSpaceActive, event);

  const html = `<!DOCTYPE html>
<html>
<head>
${headBits.join('\n')}
</head>
<body>
<div data-pdf-root="plano-mesas">
  <header class="pdf-header">
    <h1>${escapeHtml(String(planoTitle || 'Plano'))}</h1>
    <div class="pdf-info">
      ${infoHtml}
    </div>
  </header>
  <div class="pdf-plano-frame">
    <div class="pdf-plano-scale">
      ${clone.outerHTML}
    </div>
  </div>
  ${guestsHtml}
</div>
</body>
</html>`;

  if (html.length > MAX_HTML_CHARS) {
    throw new Error('El plano es demasiado grande para exportar a PDF');
  }

  return html;
}
