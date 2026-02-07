/**
 * GET /api/copilot/chat-history?sessionId=xxx&limit=50
 *
 * Obtiene el historial de mensajes del Copilot.
 * - Si API_IA_CHAT_HISTORY_URL está definido, se llama a api-ia (diseño objetivo: front no usa API2).
 * - Si no, se usa API2 getChatMessages (comportamiento actual hasta que api-ia exponga el endpoint).
 * Ver docs/INFORME-BACKEND-API-IA-IMPLEMENTAR.md y docs/LISTADO-LLAMADAS-API2-AUDITORIA.md.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const API_IA_HISTORY_URL = process.env.API_IA_CHAT_HISTORY_URL || '';
const API2_GRAPHQL = process.env.API2_GRAPHQL_URL || 'https://api2.eventosorganizador.com/graphql';

const GET_CHAT_MESSAGES = `
  query GetChatMessages($sessionId: String!, $limit: Int) {
    getChatMessages(sessionId: $sessionId, limit: $limit) {
      id
      role
      content
      createdAt
      metadata
    }
  }
`;

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

  // Preferir api-ia si está configurado (front no llama a API2)
  if (API_IA_HISTORY_URL) {
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

  // Fallback: API2 (hasta que api-ia exponga GET /webapi/chat/history)
  try {
    const response = await fetch(API2_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
        'X-Development': development,
      },
      body: JSON.stringify({
        query: GET_CHAT_MESSAGES,
        variables: { sessionId, limit: limitNum },
      }),
    });

    const json = await response.json();
    if (json.errors?.length) {
      console.warn('[chat-history] GraphQL errors:', json.errors);
      return res.status(200).json({ messages: [] });
    }
    const list = json.data?.getChatMessages ?? [];
    return res.status(200).json({ messages: list });
  } catch (e) {
    console.error('[chat-history] Error:', e);
    return res.status(200).json({ messages: [] });
  }
}
