/**
 * GET /api/copilot/chat-history?sessionId=xxx&limit=50
 *
 * Proxea al endpoint api-ia POST /webapi/chat/history desde el server
 * de appEventos. Histórico real persistido en MCP graphql vía api-ia
 * (guardado automático al hacer POST /webapi/chat).
 *
 * Antes (pre-2026-05-19): requería env var API_IA_CHAT_HISTORY_URL.
 * Ahora: usa resolveApiIaOrigin() — fuente única de verdad del monorepo.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { resolveApiIaOrigin } from '../../../utils/apiEndpoints';

// SupportKeys por whitelabel — api-ia los exige cuando no hay JWT válido.
// Mantenido inline para evitar dep a chat-ia o packages/shared.
const SUPPORT_KEYS: Record<string, string> = {
  annloevents: 'SK-annloevents-bc71e2d9',
  bodasdehoy: 'SK-bodasdehoy-a71f5b3c',
  'champagne-events': 'SK-champagne-events-d4c92a10',
  corporativozr: 'SK-corporativozr-0f1e8c72',
  eventosintegrados: 'SK-eventosintegrados-9184f2c0',
  eventosorganizador: 'SK-eventosorganizador-6e38d7f4',
  eventosplanificador: 'SK-eventosplanificador-ae273c81',
  miamorcitocorazon: 'SK-miamorcitocorazon-4a7e1c9d',
  ohmaratilano: 'SK-ohmaratilano-df63a0b5',
  theweddingplanner: 'SK-theweddingplanner-5c9e41ad',
  vivetuboda: 'SK-vivetuboda-5f92c1ab',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId required' });
  }

  const auth = req.headers.authorization || '';
  const development = (req.headers['x-development'] as string) || 'bodasdehoy';
  const limitNum = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;
  const supportKey = SUPPORT_KEYS[development] || SUPPORT_KEYS.bodasdehoy;

  const apiIaOrigin = resolveApiIaOrigin();

  try {
    const url = `${apiIaOrigin}/webapi/chat/history?sessionId=${encodeURIComponent(sessionId)}&limit=${limitNum}`;
    const response = await fetch(url, {
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        'X-Development': development,
        // X-Support-Key per-tenant: identidad whitelabel.
        'X-Support-Key': supportKey,
        // Unificación secretos api-mcp v2 (29-jun): X-Internal-Secret AUTH
        // servicio-servicio. api-ia acepta en su inbound centralizado.
        ...(process.env.INTERNAL_SECRET
          ? { 'X-Internal-Secret': process.env.INTERNAL_SECRET }
          : {}),
      },
      method: 'GET',
    });
    if (!response.ok) {
      console.warn(`[chat-history] api-ia non-ok: ${response.status}`);
      return res.status(200).json({ messages: [] });
    }
    const data = await response.json();
    const list = Array.isArray(data.messages) ? data.messages : (data.messages ?? []);
    return res.status(200).json({ messages: list });
  } catch (e) {
    console.error('[chat-history] api-ia error:', e);
    return res.status(200).json({ messages: [] });
  }
}
