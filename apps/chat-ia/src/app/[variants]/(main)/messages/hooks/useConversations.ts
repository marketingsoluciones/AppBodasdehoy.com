import { useCallback, useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { buildHeaders } from '../utils/auth';

export interface Conversation {
  channel: 'whatsapp' | 'instagram' | 'telegram' | 'email' | 'web' | 'facebook';
  contact: {
    avatar?: string;
    name: string;
    phone?: string;
    username?: string;
  };
  id: string;
  lastMessage: {
    fromUser: boolean;
    text: string;
    timestamp: string;
  };
  unreadCount: number;
}

export function useConversations(channel: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { checkAuth, isGuest } = useAuthCheck();
  const { isAuthenticated, development } = checkAuth();

  const fetchConversations = useCallback(async () => {
    if (isGuest) {
      setConversations([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const proxyBase = '/api/messages';
      const headers = buildHeaders();
      const dev = development || 'bodasdehoy';

      const fetchUrl =
        channel === 'whatsapp' || !channel
          ? `${proxyBase}/whatsapp/conversations/${dev}`
          : `${proxyBase}/conversations?development=${dev}&channel=${channel}`;

      const response = await fetch(fetchUrl, { headers });

      if (response.ok) {
        const data = await response.json();
        const rawList = Array.isArray(data) ? data : data.conversations || [];
        const normalized: Conversation[] = rawList.map((c: any) => ({
          channel: (c.channel || c.platform || channel || 'whatsapp') as Conversation['channel'],
          id: c.conversationId || c.id,
          contact: {
            name: c.displayName || c.phoneNumber || 'Desconocido',
            phone: c.phoneNumber,
          },
          lastMessage: {
            text: c.lastMessage || '',
            timestamp: c.lastMessageAt || c.updatedAt || new Date().toISOString(),
            fromUser: false,
          },
          unreadCount: c.unreadCount || 0,
        }));
        const filtered = channel ? normalized.filter((c) => c.channel === channel) : normalized;
        setConversations(filtered);
        setError(null);
      } else if (response.status === 401 || response.status === 403) {
        setConversations([]);
        setError(null);
      } else {
        setConversations([]);
        setError(new Error(`Error ${response.status} al cargar conversaciones`));
      }
    } catch (err) {
      setConversations([]);
      setError(err instanceof Error ? err : new Error('Error de red'));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, isGuest, development]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, error, isAuthenticated, loading, refetch: fetchConversations };
}
