import type { NextApiRequest, NextApiResponse } from 'next';

const BODAS_API_URL = 'https://api.bodasdehoy.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir en desarrollo/test
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join('/') : path || '';
  const targetUrl = `${BODAS_API_URL}/${targetPath}`;

  // Log para debug
  const queryName = req.body?.query?.match(/(?:query|mutation)\s+(\w+)/)?.[1] ||
                    req.body?.query?.match(/{\s*(\w+)/)?.[1] || 'unknown';
  console.log('[Proxy-Bodas] Request:', {
    method: req.method,
    targetUrl,
    queryName,
    hasBody: !!req.body,
    headers: {
      authorization: !!req.headers.authorization,
      'x-development': req.headers['x-development'],
    }
  });

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (req.headers.authorization) {
      requestHeaders['Authorization'] = req.headers.authorization as string;
    }
    if (req.headers['x-development'] || req.headers['development']) {
      requestHeaders['Development'] = (req.headers['x-development'] || req.headers['development']) as string;
    }
    if (req.headers['isproduction']) {
      requestHeaders['IsProduction'] = req.headers['isproduction'] as string;
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: requestHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();

    console.log('[Proxy-Bodas] Response:', {
      status: response.status,
      hasData: !!data?.data,
      hasErrors: !!data?.errors,
      errorPreview: data?.errors ? JSON.stringify(data.errors).substring(0, 300) : null,
    });

    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Proxy-Bodas] Error:', error);
    res.status(500).json({ error: 'Proxy error', details: String(error) });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
