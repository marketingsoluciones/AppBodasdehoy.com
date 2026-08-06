import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { buildHeaders } from '../utils/auth';
import { dedupeFetch } from '../utils/dedupeFetch';
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
  /** FASE B v2.0 — api-mcp commit 7d52fec (25-jun): RSVP del invitado
   *  resuelto desde el evento vinculado por teléfono. null si no aplica. */
  guestStatus?: 'confirmed' | 'pending' | 'declined' | null;
  /** api-mcp jidType: user | group | newsletter | broadcast | lid | unknown.
   *  Si != 'user', phoneNumber NO es un teléfono real. */
  jidType?: string | null;
  jidRaw?: string | null;
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

      // A2 (QA 6-ago): el detalle debe usar la MISMA fuente COMBINADA que el feed
      // (useRecentConversations: WhatsApp + otros canales), NO re-pedir
      // /conversations?channel=X — ese endpoint solo indexa WhatsApp → devolvía vacío para
      // web/IG/TG (vaciaba toda la lista) o desalineado con el feed para WhatsApp. Combinamos
      // ambas fuentes + dedup por id + filtro de canal en cliente. dedupeFetch coalescE los
      // GET concurrentes (el feed ya pide los mismos).
      const [waRes, otherRes] = await Promise.all([
        dedupeFetch(`${proxyBase}/whatsapp/conversations/${dev}`, { headers }),
        dedupeFetch(`${proxyBase}/conversations?development=${dev}`, { headers }),
      ]);

      const readRaw = async (res: Response, sourceKind: string): Promise<any[]> => {
        if (!res.ok) return [];
        try {
          const data = await res.json();
          const arr = Array.isArray(data) ? data : data.conversations || [];
          return arr.map((c: any) => ({ ...c, __sourceKind: sourceKind }));
        } catch {
          return [];
        }
      };

      if (waRes.ok || otherRes.ok) {
        // Mismo criterio de canal que useRecentConversations: WA→'whatsapp'; otros→'web' por defecto.
        const rawList = [
          ...(await readRaw(waRes, 'whatsapp')),
          ...(await readRaw(otherRes, 'web')),
        ];
        // N31/N33: lastMessage/JID defensivos (utils/jid.ts). Ver docs/AUTH-FLOW.md.
        const normalized: Conversation[] = rawList.map((c: any) => {
          const rawName = c.displayName || c.contactInfo?.name || c.phoneNumber || '';
          return {
            assignedToUserId: c.assignedUserId ?? c.assigned_to ?? c.assignedTo ?? null,
            channel: (c.channel || c.platform || c.__sourceKind || 'whatsapp') as Conversation['channel'],
            contact: {
              name: friendlyContactName(rawName, c.phoneNumber, c.jidType ?? c.jid_type),
              phone: safePhoneOrEmpty(c.phoneNumber, c.jidType ?? c.jid_type),
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
            // FASE B v2.0 — guestStatus desde api-mcp (commit 7d52fec).
            guestStatus: (c.guestStatus ?? c.guest_status ?? null) as
              | 'confirmed'
              | 'pending'
              | 'declined'
              | null,
            jidType: c.jidType ?? c.jid_type ?? null,
            jidRaw: c.jidRaw ?? c.jid_raw ?? null,
            status: c.status ?? c.conversationStatus ?? undefined,
            unreadCount: c.unreadCount || 0,
            unreadCountForAgent: c.unreadCountForAgent ?? c.unread_count_for_agent ?? undefined,
          };
        });
        // Dedup por id (ambas fuentes pueden solapar en WhatsApp).
        const seen = new Set<string>();
        const deduped = normalized.filter((c) => {
          const key = String(c.id ?? '');
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const filtered = channel ? deduped.filter((c) => c.channel === channel) : deduped;
        setConversations(filtered);
        setError(null);
      } else if ([waRes.status, otherRes.status].some((s) => s === 401 || s === 403)) {
        setConversations([]);
        setError(null);
      } else {
        setConversations([]);
        setError(new Error('Error al cargar conversaciones'));
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
