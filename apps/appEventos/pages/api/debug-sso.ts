/**
 * Diagnóstico SSO cross-domain — SOLO para entornos de test/dev.
 * Prueba si api.bodasdehoy.com responde correctamente a la mutation auth desde Vercel.
 *
 * Uso: GET /api/debug-sso
 *   - Si hay cookie idTokenV0.1.0: prueba el intercambio SSO completo
 *   - Si no hay cookie: solo verifica la conectividad con api.bodasdehoy.com
 *
 * Navegar a app-test.bodasdehoy.com/api/debug-sso con la cookie presente para diagnosticar.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const ALLOWED_HOSTS = [
  'localhost',
  '127.0.0.1',
  'app-test.bodasdehoy.com',
  'app-dev.bodasdehoy.com',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo en entornos no-producción
  const host = req.headers.host || '';
  const isAllowed = ALLOWED_HOSTS.some(h => host === h || host.startsWith(h + ':'));
  if (!isAllowed) {
    return res.status(404).json({ error: 'Not found' });
  }

  const apiUrl = 'https://api.bodasdehoy.com/graphql';
  const idToken = req.cookies?.['idTokenV0.1.0'] || null;
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    host,
    idTokenPresent: !!idToken,
    idTokenLength: idToken?.length ?? 0,
  };

  // 1. Ping básico — consulta de introspección mínima
  try {
    const t0 = Date.now();
    const pingResp = await axios.post(
      apiUrl,
      { query: '{ __typename }' },
      {
        headers: { 'Content-Type': 'application/json', Development: 'bodasdehoy' },
        timeout: 10_000,
        validateStatus: () => true,
      }
    );
    results.ping = {
      status: pingResp.status,
      durationMs: Date.now() - t0,
      body: JSON.stringify(pingResp.data).substring(0, 200),
    };
  } catch (err: any) {
    results.ping = { error: err?.message, code: err?.code };
  }

  // 2. Mutation auth con el idToken si está disponible
  if (idToken) {
    try {
      const t0 = Date.now();
      const authResp = await axios.post(
        apiUrl,
        {
          query: 'mutation ($idToken: String){ auth(idToken: $idToken){ sessionCookie } }',
          variables: { idToken },
        },
        {
          headers: { 'Content-Type': 'application/json', Development: 'bodasdehoy' },
          timeout: 15_000,
          validateStatus: () => true,
        }
      );
      results.authMutation = {
        status: authResp.status,
        durationMs: Date.now() - t0,
        hasSessionCookie: !!(authResp.data?.data?.auth?.sessionCookie),
        errors: authResp.data?.errors,
        rawBody: JSON.stringify(authResp.data).substring(0, 400),
      };
    } catch (err: any) {
      results.authMutation = { error: err?.message, code: err?.code };
    }
  } else {
    results.authMutation = { skipped: 'No idTokenV0.1.0 cookie present — log in at chat-test first' };
  }

  return res.status(200).json(results);
}
