import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { IncomingMessage } from 'http';

import { resolveApiBodasOrigin } from '../../../utils/apiEndpoints';

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const primaryBaseURL = resolveApiBodasOrigin();
    const fallbackBaseURL = process.env.API_BODAS_URL_FALLBACK;

    const contentType = req.headers['content-type'] || '';
    const isMultipart = contentType.includes('multipart/form-data');

    const headers: any = {
      'Content-Type': contentType || 'application/json',
    };

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    } else if (req.cookies?.['idTokenV0.1.0']) {
      headers.Authorization = `Bearer ${req.cookies['idTokenV0.1.0']}`;
    } else if (req.cookies?.sessionBodas) {
      headers.Authorization = `Bearer ${req.cookies.sessionBodas}`;
    }

    if (req.headers.development) {
      headers.Development = req.headers.development;
    }

    if (req.headers.isproduction) {
      headers.IsProduction = req.headers.isproduction;
    }

    console.log('[API Proxy Bodas] Proxying request to:', `${primaryBaseURL}/graphql`);
    console.log('[API Proxy Bodas] Headers:', {
      hasAuth: !!headers.Authorization,
      hasDevelopment: !!headers.Development,
      hasIsProduction: !!headers.IsProduction,
      contentType: headers['Content-Type'],
    });

    let body: any;
    if (isMultipart) {
      body = await readBody(req);
      console.log('[API Proxy Bodas] Multipart upload');
    } else {
      const rawBody = await readBody(req);
      body = rawBody.length > 0 ? JSON.parse(rawBody.toString()) : {};
      console.log('[API Proxy Bodas] Query:', body?.query?.substring(0, 200));
    }

    const doRequest = (baseURL: string) => axios.post(
      `${baseURL}/graphql`,
      body,
      {
        headers,
        timeout: 30000,
        ...(isMultipart ? { maxContentLength: Infinity, maxBodyLength: Infinity } : {}),
      }
    );

    let response;
    try {
      response = await doRequest(primaryBaseURL);
    } catch (error: any) {
      const isNetworkError = !error?.response;
      if (isNetworkError && fallbackBaseURL && fallbackBaseURL !== primaryBaseURL) {
        console.warn('[API Proxy Bodas] Primary host falló. Reintentando con fallback:', fallbackBaseURL);
        response = await doRequest(fallbackBaseURL);
      } else {
        throw error;
      }
    }

    return res.status(response.status).json(response.data);

  } catch (error: any) {
    console.error('[API Proxy Bodas] Error completo:', JSON.stringify({
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    }, null, 2));

    if (error?.response) {
      return res.status(error.response.status).json(error.response.data);
    } else {
      return res.status(503).json({
        error: 'Proxy error',
        message: error?.message
      });
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
