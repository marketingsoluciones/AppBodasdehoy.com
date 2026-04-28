/**
 * POST /api/dev/mint-jwt
 *
 * Genera un JWT firmado con el mismo secret que usa api-ia/api2.
 * SOLO disponible en entornos dev/test (NODE_ENV !== 'production').
 * Permite que el dev_bypass tenga un token válido para el copilot.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const API2_JWT_SECRET = process.env.API2_JWT_SECRET;
if (!API2_JWT_SECRET) {
  console.warn('[mint-jwt] API2_JWT_SECRET no configurado — endpoint deshabilitado');
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API2_JWT_SECRET) {
    return res.status(503).json({ error: 'API2_JWT_SECRET not configured' });
  }

  // Solo en dev/test
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const { uid, email, development } = req.body || {};
  if (!uid || !email) {
    return res.status(400).json({ error: 'uid and email required' });
  }

  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    uid,
    email,
    user_id: uid,
    development: development || 'bodasdehoy',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24h
  }));

  const signature = base64url(
    crypto.createHmac('sha256', API2_JWT_SECRET).update(`${header}.${payload}`).digest()
  );

  const token = `${header}.${payload}.${signature}`;

  return res.status(200).json({ token });
}
