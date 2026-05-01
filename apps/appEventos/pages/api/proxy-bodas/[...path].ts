import type { NextApiRequest, NextApiResponse } from 'next';

import { resolveApiBodasOrigin } from '../../../utils/apiEndpoints';

const BODAS_API_URL = resolveApiBodasOrigin();
const BODAS_API_URL_FALLBACK = process.env.API_BODAS_URL_FALLBACK || '';

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
  const primaryUrl = `${BODAS_API_URL}/${targetPath}`;
  const fallbackUrl = BODAS_API_URL_FALLBACK ? `${BODAS_API_URL_FALLBACK}/${targetPath}` : '';

  // Log para debug
  const queryName = req.body?.query?.match(/(?:query|mutation)\s+(\w+)/)?.[1] ||
                    req.body?.query?.match(/{\s*(\w+)/)?.[1] || 'unknown';
  console.log('[Proxy-Bodas] Request:', {
    method: req.method,
    targetUrl: primaryUrl,
    fallbackUrl: fallbackUrl || null,
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

    const makeRequest = (url: string) => fetch(url, {
      method: req.method,
      headers: requestHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    let response: Response;
    try {
      response = await makeRequest(primaryUrl);
    } catch (error) {
      if (fallbackUrl && fallbackUrl !== primaryUrl) {
        console.warn('[Proxy-Bodas] Primary host falló. Reintentando fallback:', fallbackUrl);
        response = await makeRequest(fallbackUrl);
      } else {
        throw error;
      }
    }

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
    res.status(503).json({ error: 'Proxy error', details: String(error) });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
