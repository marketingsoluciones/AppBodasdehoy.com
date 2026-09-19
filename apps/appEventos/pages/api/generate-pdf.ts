import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

const CONVERT_API_URL = (process.env.CONVERT_API_URL ?? 'http://127.0.0.1:4004').replace(/\/$/, '');
const CONVERT_TOKEN = process.env.CONVERT_TOKEN ?? '';
const VALID_FORMATS = new Set(['letter', 'A4', 'legal']);
const MAX_HTML_CHARS = 3_500_000;

const ALLOWED_DOMAINS = [
  'bodasdehoy.com',
  'eventosorganizador.com',
  'champagne-events.com.mx',
  'mercurycloud.mx',
];

function requestHostname(req: NextApiRequest): string | null {
  const forwarded = req.headers['x-forwarded-host'];
  const raw = (typeof forwarded === 'string' ? forwarded.split(',')[0] : null)
    ?? (typeof req.headers.host === 'string' ? req.headers.host : null);
  if (!raw) return null;
  return raw.trim().split(':')[0].toLowerCase() || null;
}

function isAllowedPdfUrl(rawUrl: string, reqHost: string | null): boolean {
  const parsedUrl = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return false;
  }

  const host = parsedUrl.hostname.toLowerCase();

  if (reqHost && host === reqHost) {
    return true;
  }

  if (process.env.NODE_ENV !== 'production') {
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost')) {
      return true;
    }
  }

  return ALLOWED_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
}

async function proxyConvertPdf(
  path: '/html-to-pdf' | '/url-to-pdf',
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${CONVERT_API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Convert-Token': CONVERT_TOKEN,
      'User-Agent': 'Mozilla/5.0 (compatible; PDF-Generator/1.0)',
    },
    body: JSON.stringify(body),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!CONVERT_TOKEN || CONVERT_TOKEN.length < 32) {
    console.error('generate-pdf: CONVERT_TOKEN ausente o demasiado corto');
    return res.status(500).json({ error: 'Servicio PDF no configurado' });
  }

  const { url, html, format = 'letter' } = req.body ?? {};
  if (!VALID_FORMATS.has(format)) {
    return res.status(400).json({ error: 'Formato no válido. Use: letter, A4, u legal.' });
  }

  const useHtml = typeof html === 'string' && html.length > 0;
  const useUrl = typeof url === 'string' && url.length > 0;

  if (!useHtml && !useUrl) {
    return res.status(400).json({ error: 'Se requiere html o url' });
  }

  if (useHtml) {
    if (html.length > MAX_HTML_CHARS) {
      return res.status(413).json({ error: 'HTML demasiado grande' });
    }
  } else {
    try {
      if (!isAllowedPdfUrl(url, requestHostname(req))) {
        return res.status(403).json({ error: 'Dominio no permitido para generación de PDF' });
      }
    } catch {
      return res.status(400).json({ error: 'URL inválida' });
    }
  }

  try {
    const response = useHtml
      ? await proxyConvertPdf('/html-to-pdf', { html, format })
      : await proxyConvertPdf('/url-to-pdf', { url, format });

    if (!response.ok) {
      const upstream = await response.text().catch(() => '');
      console.error('generate-pdf upstream error:', response.status, upstream.slice(0, 300));
      return res.status(502).json({
        error: 'Error al generar PDF',
        details: `upstream ${response.status}`,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return res.json({ base64 });
  } catch (error) {
    console.error('Error en generate-pdf:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
}
