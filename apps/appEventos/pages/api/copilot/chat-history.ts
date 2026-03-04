/**
 * GET /api/copilot/chat-history?sessionId=xxx&limit=50
 *
 * Obtiene el historial de mensajes del Copilot desde api-ia.
 * Si API_IA_CHAT_HISTORY_URL no está configurado, devuelve historial vacío
 * (el front no llama a API2 directamente).
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const API_IA_HISTORY_URL = process.env.API_IA_CHAT_HISTORY_URL || '';

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
  const limitNum = Number.isFinite(limit) ? limit : 50;

  if (!API_IA_HISTORY_URL) {
    return res.status(200).json({ messages: [] });
  }

  try {
    const url = `${API_IA_HISTORY_URL.replace(/\/$/, '')}?sessionId=${encodeURIComponent(sessionId)}&limit=${limitNum}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': auth,
        'X-Development': development,
      },
    });
    if (!response.ok) {
      console.warn('[chat-history] api-ia history non-ok:', response.status);
      return res.status(200).json({ messages: [] });
    }
    const data = await response.json();
    const list = Array.isArray(data.messages) ? data.messages : (data.messages ?? []);
    return res.status(200).json({ messages: list });
  } catch (e) {
    console.error('[chat-history] api-ia history error:', e);
    return res.status(200).json({ messages: [] });
  }
}
