import { useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { buildHeaders, parseWhatsAppConversationId } from '../utils/auth';

export interface Message {
  attachments?: Array<{
    filename?: string;
    type: 'image' | 'file';
    url: string;
  }>;
  fromUser: boolean;
  id: string;
  status?: 'sent' | 'delivered' | 'read';
  text: string;
  timestamp: string;
}

function buildFetchUrl(channel: string, conversationId: string): string | null {
  if (channel === 'whatsapp') {
    const parsed = parseWhatsAppConversationId(conversationId);
    if (!parsed) return null;
    const { dev, jid } = parsed;
    return `/api/messages/whatsapp/conversations/${dev}/${encodeURIComponent(jid)}/messages`;
  }
  return `/api/messages/conversations/${encodeURIComponent(conversationId)}`;
}

function normalizeMessage(msg: any): Message {
  return {
    attachments: msg.attachments,
    // INBOUND = del contacto (fromUser=true), OUTBOUND = tuyo (fromUser=false)
    fromUser: msg.direction === 'INBOUND' || (msg.direction === undefined && msg.fromUser !== false),
    id: msg.id || msg.messageId || msg._id || `msg_${Date.now()}_${Math.random()}`,
    status: msg.status || 'read',
    text: msg.text || msg.content || '',
    timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
  };
}

export function useMessages(channel: string, conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { isGuest } = useAuthCheck();

  const fetchMessages = async () => {
    if (isGuest || !conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const url = buildFetchUrl(channel, conversationId);
    if (!url) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(url, { headers: buildHeaders() });

      if (!response.ok) {
        if (response.status === 404) {
          setMessages([]);
          setError(null);
          return;
        }
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.messages || []);
      setMessages(raw.map(normalizeMessage));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al obtener mensajes'));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, channel, isGuest]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  return { addMessage, error, loading, messages, refetch: fetchMessages };
}
