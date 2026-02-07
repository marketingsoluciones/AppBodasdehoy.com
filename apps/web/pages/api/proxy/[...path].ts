import type { NextApiRequest, NextApiResponse } from 'next';

// apiapp.bodasdehoy.com para queries de eventos (queryenEvento, getPsTemplate, updateActivity)
const BODAS_API_URL = 'https://apiapp.bodasdehoy.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join('/') : path || '';
  const targetUrl = `${BODAS_API_URL}/${targetPath}`;

  // Log para debug - mostrar query GraphQL
  const queryName = req.body?.query?.match(/(?:query|mutation)\s+(\w+)/)?.[1] ||
                    req.body?.query?.match(/{\s*(\w+)/)?.[1] || 'unknown';
  console.log('[Proxy] Request:', {
    method: req.method,
    targetUrl,
    queryName,
    hasBody: !!req.body,
    bodyPreview: typeof req.body === 'object' ? JSON.stringify(req.body).substring(0, 200) : 'no body',
    headers: {
      authorization: !!req.headers.authorization,
      'x-development': req.headers['x-development'],
      'content-type': req.headers['content-type'],
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

    console.log('[Proxy] Response:', {
      status: response.status,
      hasData: !!data?.data,
      hasErrors: !!data?.errors,
      errorPreview: data?.errors ? JSON.stringify(data.errors).substring(0, 300) : null,
    });

    // Copiar headers de respuesta importantes
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: String(error) });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
