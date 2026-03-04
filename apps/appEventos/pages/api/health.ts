import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Ruta de comprobación: si ves { "ok": true } la app web está respondiendo.
 * Útil para verificar que app-test / localhost:8080 funciona.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ok: true,
    app: 'web',
    time: new Date().toISOString(),
  });
}
