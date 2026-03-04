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
    const baseURL = 'https://api.bodasdehoy.com';

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

    console.log('[API Proxy Bodas] Proxying request to:', `${baseURL}/graphql`);
    console.log('[API Proxy Bodas] Headers:', {
      hasAuth: !!headers.Authorization,
      hasDevelopment: !!headers.Development,
      hasIsProduction: !!headers.IsProduction,
      contentType: headers['Content-Type']
    });
    console.log('[API Proxy Bodas] Query:', req.body?.query?.substring(0, 200));

    // Hacer la petición al backend
    const response = await axios.post(
      `${baseURL}/graphql`,
      req.body,
      {
        headers,
        timeout: 30000 // 30 segundos
      }
    );

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
      return res.status(500).json({
        error: 'Proxy error',
        message: error?.message
      });
    }
  }
}
