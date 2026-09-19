import type { NextApiRequest, NextApiResponse } from 'next';

type GeoResponse = {
  ipcountry: string;
  acceptLanguage: string;
  connectingIp: string;
};

/**
 * GET /api/geo — País del usuario.
 * 1) Headers Cloudflare/Vercel (producción / -dev vía proxy)
 * 2) Fallback: api.country.is (server-side; útil en localhost sin CF headers)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeoResponse>
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).end();
    return;
  }

  let ipcountry =
    (req.headers['cf-ipcountry'] as string) ||
    (req.headers['x-vercel-ip-country'] as string) ||
    '';

  // Cloudflare usa "XX" cuando no puede resolver el país
  if (ipcountry.toUpperCase() === 'XX') {
    ipcountry = '';
  }

  const acceptLanguage = (req.headers['accept-language'] as string) || '';
  const connectingIp =
    (req.headers['cf-connecting-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '';

  if (!ipcountry) {
    try {
      const geoRes = await fetch('https://api.country.is/', {
        signal: AbortSignal.timeout(4000),
      });
      if (geoRes.ok) {
        const data = (await geoRes.json()) as { country?: string };
        if (typeof data.country === 'string' && data.country.length === 2) {
          ipcountry = data.country;
        }
      }
    } catch {
      // Sin país: el cliente deja el campo vacío para selección manual
    }
  }

  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.status(200).json({
    ipcountry: ipcountry.toUpperCase(),
    acceptLanguage,
    connectingIp,
  });
}
