import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * GET /api/chat/messages?sessionId=xxx
 * Devuelve el historial de mensajes de una sesión.
 *
 * POST /api/chat/messages
 * Body: { sessionId: string, role: 'user'|'assistant', content: string, id?: string }
 * Añade un mensaje a la sesión (persistencia en memoria por proceso).
 *
 * Usado por getChatHistory() y persistChatMessage() en services/copilotChat.ts.
 * Para persistencia entre reinicios se puede conectar después a API2/DB.
 */

type StoredMessage = { id: string; role: string; content: string; createdAt: string };

const store = new Map<string, StoredMessage[]>();

function getMessages(sessionId: string): StoredMessage[] {
  return store.get(sessionId) ?? [];
}

function appendMessage(sessionId: string, msg: StoredMessage): void {
  const list = getMessages(sessionId);
  list.push(msg);
  store.set(sessionId, list);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required' });
    }
    const messages = getMessages(sessionId);
    return res.status(200).json({ messages });
  }

  if (req.method === 'POST') {
    const sessionId = req.body?.sessionId;
    const role = req.body?.role;
    const content = typeof req.body?.content === 'string' ? req.body.content : '';
    if (!sessionId || !role || content === undefined) {
      return res.status(400).json({ error: 'sessionId, role and content required' });
    }
    if (role !== 'user' && role !== 'assistant') {
      return res.status(400).json({ error: 'role must be user or assistant' });
    }
    const id = typeof req.body?.id === 'string' ? req.body.id : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    appendMessage(sessionId, {
      id,
      role,
      content,
      createdAt: new Date().toISOString(),
    });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
