import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * GET /api/geo — Devuelve país del usuario via headers de Cloudflare/Vercel.
 * Reemplaza la query getGeoInfo de api.bodasdehoy.com que ya no se usa.
 * No requiere auth ni llamada a backend externo.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Cloudflare: CF-IPCountry (2-letter ISO)
  // Vercel: x-vercel-ip-country
  // Fallback: Accept-Language header
  const ipcountry =
    (req.headers['cf-ipcountry'] as string) ||
    (req.headers['x-vercel-ip-country'] as string) ||
    '';

  const acceptLanguage = (req.headers['accept-language'] as string) || '';
  const connectingIp =
    (req.headers['cf-connecting-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    '';

  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1h cache
  res.status(200).json({
    ipcountry: ipcountry.toUpperCase(),
    acceptLanguage,
    connectingIp,
  });
}
