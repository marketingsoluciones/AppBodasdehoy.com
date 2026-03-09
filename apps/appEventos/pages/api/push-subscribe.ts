/**
 * POST /api/push-subscribe
 * Guarda un FCM token en api2 asociado al usuario.
 * El backend (api-ia / api2) lo usará para enviar push notifications.
 */
import type { NextApiRequest, NextApiResponse } from 'next';

const API2_URL = process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, userId, development } = req.body ?? {};

  if (!token || !userId) {
    return res.status(400).json({ error: 'token and userId are required' });
  }

  try {
    // Proxy hacia api2 para registrar el FCM token
    const r = await fetch(`${API2_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Development': development || 'bodasdehoy',
        // Cookie de sesión se pasa automáticamente si hay mismo dominio
        // Para cross-domain, usamos el sessionBodas del cliente
        ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {}),
      },
      body: JSON.stringify({ token, userId, platform: 'web' }),
    });

    if (!r.ok) {
      // Si api2 no tiene el endpoint aún, fallo silencioso
      console.warn('[push-subscribe] api2 no disponible o endpoint no existe:', r.status);
      return res.status(200).json({ ok: true, forwarded: false });
    }

    const data = await r.json();
    return res.status(200).json({ ok: true, forwarded: true, data });
  } catch (err) {
    // No bloquear la UX por un error de registro de push
    console.warn('[push-subscribe] Error registrando FCM token:', err);
    return res.status(200).json({ ok: true, forwarded: false });
  }
}
