import type { NextApiRequest, NextApiResponse } from 'next';

const ALLOWED_HOSTNAMES = new Set([
  'api-mcp.eventosorganizador.com',
  'www.theweddingplanner.mx',
  'i.ibb.co',
  'firebasestorage.googleapis.com',
]);

const ALLOWED_HOST_SUFFIXES = [
  '.firebasestorage.app',
  '.r2.dev',
  '.r2.cloudflarestorage.com',
];

function isAllowedUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return false;
    if (ALLOWED_HOSTNAMES.has(url.hostname)) return true;
    if (ALLOWED_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))) return true;
    return false;
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const urlParam = typeof req.query.url === 'string' ? req.query.url : '';
  if (!urlParam) return res.status(400).json({ error: 'Missing ?url=' });

  if (!isAllowedUrl(urlParam)) {
    return res.status(400).json({ error: 'Invalid or disallowed url' });
  }

  try {
    const response = await fetch(urlParam, {
      method: 'GET',
      headers: {
        'User-Agent': 'AppEventos/ProxyImage',
        'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/svg+xml,*/*',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream error', status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLengthHeader = response.headers.get('content-length');
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : null;

    if (contentLength !== null && Number.isFinite(contentLength) && contentLength > 2_500_000) {
      return res.status(413).json({ error: 'Image too large' });
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 2_500_000) {
      return res.status(413).json({ error: 'Image too large' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    res.status(502).json({
      error: 'Proxy error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
