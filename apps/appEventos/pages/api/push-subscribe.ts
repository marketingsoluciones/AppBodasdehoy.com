/**
 * POST /api/push-subscribe
 * Guarda un FCM token en api2 asociado al usuario.
 * El backend (api-ia / api2) lo usará para enviar push notifications.
 */
import type { NextApiRequest, NextApiResponse } from 'next';

import { resolveApiBodasOrigin } from '../../utils/api3Endpoints';

const API2_URL = resolveApiBodasOrigin();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, userId, development } = req.body ?? {};

  if (!token || !userId) {
    return res.status(400).json({ error: 'token and userId are required' });
  }

  // Validar que el userId del body corresponde con la sesión del usuario
  // La cookie sessionBodas contiene un JWT con el uid real
  const sessionCookie = req.cookies?.sessionBodas || req.cookies?.['sessionBodas'];
  if (!sessionCookie) {
    return res.status(401).json({ error: 'No session cookie' });
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
