/**
 * API Route para verificar URLs y dominios
 * Uso: GET /api/verify-urls
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAllUrls, verifyDomain, logUrlVerification } from '../../utils/verifyUrls';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar URLs
    const urlResults = await verifyAllUrls();
    
    // Información del dominio
    const domainInfo = verifyDomain();
    
    // Log en servidor
    console.log('[Verify URLs] Resultados:', {
      urls: urlResults,
      domain: domainInfo,
    });
    
    return res.status(200).json({
      success: true,
      urls: urlResults,
      domain: domainInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Verify URLs] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al verificar URLs',
    });
  }
}
