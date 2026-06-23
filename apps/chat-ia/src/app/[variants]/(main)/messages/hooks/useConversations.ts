import { useCallback, useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { buildHeaders } from '../utils/auth';
import { friendlyContactName, safePhoneOrEmpty } from '../utils/jid';

export interface Conversation {
  assignedToUserId?: string | null;
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
  lastInboundAt?: string;
  lastOutboundAt?: string;
  labels?: any[];
  linkedContactId?: string | null;
  linkedEventId?: string | null;
  status?: string;
  unreadCount: number;
  unreadCountForAgent?: number;
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
        // BUG-CW-N31 (QA3 reporte 23-jun): api-ia devuelve `lastMessage` como
        // OBJETO {text,timestamp,fromUser} en algunos canales (no-WA) en lugar
        // de string. Sin normalizar, `text:` aquí quedaba como objeto y al
        // renderizar `{conversation.lastMessage.text}` en ConversationItem
        // se disparaba React Error #31 ("Objects are not valid as a React child").
        // Defensa front: aceptar tanto string como objeto y extraer .text.
        const normalized: Conversation[] = rawList.map((c: any) => {
          const lm = c.lastMessage;
          const lmIsObj = lm && typeof lm === 'object';
          const text = typeof lm === 'string' ? lm
            : lmIsObj && typeof lm.text === 'string' ? lm.text
            : '';
          const timestamp = c.lastMessageAt || c.updatedAt
            || (lmIsObj && typeof lm.timestamp === 'string' ? lm.timestamp : new Date().toISOString());
          const fromUser = lmIsObj && typeof lm.fromUser === 'boolean' ? lm.fromUser : false;
          // BUG-CW-N33 (QA3 reporte 23-jun BUG 3): api-ia guarda en phoneNumber
          // el prefijo del JID (Newsletter, Group, broadcast) sin distinguir.
          // Defensa display: si el nombre/teléfono es realmente un JID,
          // mostrar "Canal ...", "Grupo ..." o "Status Broadcast" en lugar
          // de un número de 18 dígitos que confunde al usuario.
          const rawName = c.displayName || c.contactInfo?.name || c.phoneNumber || '';
          return {
            assignedToUserId: c.assignedUserId ?? c.assigned_to ?? c.assignedTo ?? null,
            channel: (c.channel || c.platform || channel || 'whatsapp') as Conversation['channel'],
            contact: {
              name: friendlyContactName(rawName, c.phoneNumber),
              phone: safePhoneOrEmpty(c.phoneNumber),
            },
            id: c.conversationId || c.id,
            lastMessage: { fromUser, text, timestamp },
            lastInboundAt: c.lastInboundAt ?? c.last_inbound_at ?? undefined,
            lastOutboundAt: c.lastOutboundAt ?? c.last_outbound_at ?? undefined,
            labels: c.labels ?? c.labelIds ?? c.label_ids ?? undefined,
            linkedContactId: c.linkedContactId ?? c.linked_contact_id ?? null,
            linkedEventId: c.linkedEventId ?? c.linked_event_id ?? null,
            status: c.status ?? c.conversationStatus ?? undefined,
            unreadCount: c.unreadCount || 0,
            unreadCountForAgent: c.unreadCountForAgent ?? c.unread_count_for_agent ?? undefined,
          };
        });
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
