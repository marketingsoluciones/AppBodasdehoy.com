/**
 * HTML para /html-to-pdf del esquema:
 * - Sin inlining de px (rompía layout).
 * - CSS de la página (Tailwind) + Google Fonts CDN (Puppeteer sí las descarga).
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

function resolvePrimaryColor(): string {
  const probe =
    document.querySelector('.text-primary')
    ?? document.querySelector('.border-primary');
  if (probe instanceof HTMLElement) {
    const cs = window.getComputedStyle(probe);
    const color = cs.color || cs.borderTopColor;
    if (color && color !== 'rgba(0, 0, 0, 0)') return color;
  }
  return '#ec4899';
}

export function buildSchemaPdfHtml(root: HTMLElement): string {
  const origin = window.location.origin;
  const clone = root.cloneNode(true) as HTMLElement;
  const primary = resolvePrimaryColor();

  clone.querySelectorAll('[data-pdf-hide]').forEach((el) => el.remove());

  clone.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;
    try {
      img.setAttribute('src', new URL(src, origin).href);
    } catch {
      /* ignore */
    }
  });

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

  headBits.push(`<style id="pdf-schema-fonts">
    :root { --pdf-primary: ${primary}; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff !important;
      font-family: Poppins, Montserrat, system-ui, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .font-title { font-family: Italiana, serif !important; }
    .font-display { font-family: Poppins, sans-serif !important; }
    .font-body { font-family: Montserrat, sans-serif !important; }
    [data-pdf-root="itinerario-schema"] {
      max-width: 900px;
      margin: 0 auto;
      padding: 12px 16px 24px;
      background: #fff;
    }
  </style>`);

  const html = `<!DOCTYPE html>
<html>
<head>
${headBits.join('\n')}
</head>
<body>
${clone.outerHTML}
</body>
</html>`;

  if (html.length > MAX_HTML_CHARS) {
    throw new Error('El esquema es demasiado grande para exportar a PDF');
  }

  return html;
}
