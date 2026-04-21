import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const primaryBaseURL = process.env.API_BODAS_URL || 'https://api2.eventosorganizador.com';
    const fallbackBaseURL = process.env.API_BODAS_URL_FALLBACK;

    // Extraer headers necesarios del request original
    const headers: any = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    // Pasar Authorization si existe
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    // Pasar Development si existe
    if (req.headers.development) {
      headers.Development = req.headers.development;
    }

    // Pasar IsProduction si existe
    if (req.headers.isproduction) {
      headers.IsProduction = req.headers.isproduction;
    }

    console.log('[API Proxy Bodas] Proxying request to:', `${primaryBaseURL}/graphql`);
    console.log('[API Proxy Bodas] Headers:', {
      hasAuth: !!headers.Authorization,
      hasDevelopment: !!headers.Development,
      hasIsProduction: !!headers.IsProduction,
      contentType: headers['Content-Type']
    });
    console.log('[API Proxy Bodas] Query:', req.body?.query?.substring(0, 200));

    const doRequest = (baseURL: string) => axios.post(
      `${baseURL}/graphql`,
      req.body,
      {
        headers,
        timeout: 30000 // 30 segundos
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

    // Devolver la respuesta
    return res.status(response.status).json(response.data);

  } catch (error: any) {
    console.error('[API Proxy Bodas] Error completo:', JSON.stringify({
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data
    }, null, 2));

    if (error?.response) {
      // Error de la API backend
      return res.status(error.response.status).json(error.response.data);
    } else {
      // Error de red o timeout
      return res.status(503).json({
        error: 'Proxy error',
        message: error?.message
      });
    }
  }
}
