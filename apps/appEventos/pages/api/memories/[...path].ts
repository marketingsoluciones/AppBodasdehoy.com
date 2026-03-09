import type { NextApiRequest, NextApiResponse } from 'next';

const MEMORIES_API_BASE =
  process.env.NEXT_PUBLIC_MEMORIES_API_URL ||
  process.env.MEMORIES_API_URL ||
  'https://api-ia.bodasdehoy.com';

/**
 * Proxy a la API de Memories (api-ia).
 * Permite que la página /momentos use apiBaseUrl = '' y las peticiones
 * vayan a /api/memories/... y se reenvíen al backend.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const path = req.query.path as string[] | string;
  const pathStr = Array.isArray(path) ? path.join('/') : path || '';
  const query = req.url?.split('?')[1] || '';
  const targetUrl = `${MEMORIES_API_BASE.replace(/\/$/, '')}/api/memories/${pathStr}${query ? `?${query}` : ''}`;

  try {
    const headers: Record<string, string> = {};
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'] as string;
    }
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization as string;
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, init);
    const contentType = response.headers.get('content-type');
    const text = await response.text();

    res.status(response.status);
    if (contentType?.includes('application/json')) {
      try {
        res.json(JSON.parse(text));
      } catch {
        res.send(text);
      }
    } else {
      res.setHeader('Content-Type', contentType || 'text/plain');
      res.send(text);
    }
  } catch (error) {
    console.error('[API memories proxy]', error);
    res.status(502).json({
      success: false,
      detail: 'Error de proxy a la API de Memories',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
