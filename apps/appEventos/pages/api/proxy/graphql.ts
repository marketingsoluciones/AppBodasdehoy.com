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
    // GraphQL → api-mcp (servidor con fixes de seguridad)
    // NEXT_PUBLIC_BASE_URL se mantiene solo para imágenes/assets
    const baseURL = process.env.API_MCP_GRAPHQL_URL?.replace(/\/graphql\/?$/i, '') || 'https://api3-mcp-graphql.eventosorganizador.com';

    // Extraer headers necesarios del request original
    const headers: any = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    // Pasar Authorization: header directo o cookie idTokenV0.1.0 como fallback
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    } else if (req.cookies?.['idTokenV0.1.0']) {
      headers.Authorization = `Bearer ${req.cookies['idTokenV0.1.0']}`;
    } else if (req.cookies?.sessionBodas) {
      headers.Authorization = `Bearer ${req.cookies.sessionBodas}`;
    }

    // Pasar Development si existe
    if (req.headers.development) {
      headers.Development = req.headers.development;
    }

    console.log('[API Proxy] Proxying request to:', `${baseURL}/graphql`);
    console.log('[API Proxy] Headers:', {
      hasAuth: !!headers.Authorization,
      hasDevelopment: !!headers.Development,
      contentType: headers['Content-Type']
    });
    console.log('[API Proxy] Query:', req.body?.query?.substring(0, 200));

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
    console.error('[API Proxy] Error completo:', JSON.stringify({
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
