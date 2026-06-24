import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { buildHeaders } from '../utils/auth';
import { friendlyContactName, safePhoneOrEmpty } from '../utils/jid';
import { useMessageStream } from './useMessageStream';

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
        // N31 CERRADO 24-jun (api-ia commit 665097b normalizó lastMessage).
        // Mantengo `|| ''` como cinturón-tirantes por canal legacy sin migrar.
        // N33 activa: parseJid en api-ia sigue pendiente. Defensa vive en
        // utils/jid.ts (friendlyContactName + classifyJidLike). Ver docs/AUTH-FLOW.md.
        const normalized: Conversation[] = rawList.map((c: any) => {
          const rawName = c.displayName || c.contactInfo?.name || c.phoneNumber || '';
          return {
            assignedToUserId: c.assignedUserId ?? c.assigned_to ?? c.assignedTo ?? null,
            channel: (c.channel || c.platform || channel || 'whatsapp') as Conversation['channel'],
            contact: {
              name: friendlyContactName(rawName, c.phoneNumber),
              phone: safePhoneOrEmpty(c.phoneNumber),
            },
            id: c.conversationId || c.id,
            lastMessage: {
              fromUser: c.lastMessageFromMe === false,
              text: c.lastMessage || '',
              timestamp: c.lastMessageAt || c.updatedAt || new Date().toISOString(),
            },
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

  // SSE realtime: api-ia confirmó /api/messages/stream ACTIVO 24-jun (commit
  // refactor runtime-only-api-ia). Cuando llega un mensaje nuevo, refrescamos
  // la lista. Throttle 1.5s para coalescer ráfagas (varios mensajes seguidos).
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefetch = useCallback(() => {
    if (refetchTimerRef.current) return; // ya hay refetch pendiente
    refetchTimerRef.current = setTimeout(() => {
      refetchTimerRef.current = null;
      void fetchConversations();
    }, 1500);
  }, [fetchConversations]);

  useEffect(() => {
    return () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    };
  }, []);

  useMessageStream({
    channel: channel || undefined,
    enabled: isAuthenticated && !isGuest,
    onMessage: scheduleRefetch,
  });

  return { conversations, error, isAuthenticated, loading, refetch: fetchConversations };
}
