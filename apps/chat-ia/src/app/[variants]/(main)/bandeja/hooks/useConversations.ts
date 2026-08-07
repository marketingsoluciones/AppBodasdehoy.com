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

// A2-web: canales "otros" conocidos. Alineado 1:1 con useRecentConversations (feed).
// Cualquier canal fuera de este set (o sin channel) se clasifica como "web" (cajón).
const OTHER_CHANNELS = new Set(['instagram', 'telegram', 'email', 'web', 'facebook']);

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

      // A2-web (CAUSA RAÍZ): el feed (useRecentConversations) clasifica "web" como CAJÓN
      // por defecto (channel||platform||'web', desconocido→'web') pegando a
      // `/conversations?development=` SIN filtro. Aquí antes se pegaba con `&channel=web`
      // + default 'whatsapp' → una conversación sin `channel` aparecía como "web" en el
      // feed pero se PERDÍA al abrirla (lista vacía + banner WA colado). Fix: MISMO
      // endpoint que el feed (dedupeFetch coalesce → sin fetch extra, sin el 429 de #286)
      // + MISMA clasificación de canal (abajo).
      // isWaView: la vista WhatsApp llega como kind 'whatsapp', como null (feed) o como
      // channelPARAM 'wa-{id}' (URL del detalle: /bandeja/wa-xxx/conv_yyy). Los tres deben
      // pegar al endpoint WA y clasificarse como 'whatsapp'. Antes 'wa-xxx' caía al endpoint
      // de "otros" y filtraba c.channel==='wa-xxx' → SIEMPRE vacío → toda conv WA abierta
      // desde el detalle quedaba "solo lectura" falsamente (no solo las huérfanas).
      const isWaView = channel === 'whatsapp' || channel?.startsWith('wa-') || !channel;
      const fetchUrl = isWaView
        ? `${proxyBase}/whatsapp/conversations/${dev}`
        : `${proxyBase}/conversations?development=${dev}`;

      // H2: dedup de GET concurrentes idénticos (feed + detalle piden el mismo recurso).
      const response = await dedupeFetch(fetchUrl, { headers });

      if (response.ok) {
        const data = await response.json();
        const rawList = Array.isArray(data) ? data : data.conversations || [];
        // N31 CERRADO 24-jun (api-ia commit 665097b normalizó lastMessage).
        // Mantengo `|| ''` como cinturón-tirantes por canal legacy sin migrar.
        // N33 activa: parseJid en api-ia sigue pendiente. Defensa vive en
        // utils/jid.ts (friendlyContactName + classifyJidLike). Ver docs/AUTH-FLOW.md.
        const normalized: Conversation[] = rawList.map((c: any) => {
          const rawName = c.displayName || c.contactInfo?.name || c.phoneNumber || '';
          // Clasificación IDÉNTICA al feed (useRecentConversations): en vista WA todo es
          // 'whatsapp'; en vista "otros", desconocido/sin-channel → 'web' (cajón). Esto
          // hace que la conv sobreviva al abrirla (el filtro de abajo ya cuadra).
          const rawKind = c.channel || c.platform || (isWaView ? 'whatsapp' : 'web');
          const kind = isWaView
            ? 'whatsapp'
            : OTHER_CHANNELS.has(rawKind)
              ? rawKind
              : 'web';
          return {
            assignedToUserId: c.assignedUserId ?? c.assigned_to ?? c.assignedTo ?? null,
            channel: kind as Conversation['channel'],
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
        // En vista WA devolvemos TODAS las conversaciones WA: el channelParam 'wa-{id}'
        // identifica la CUENTA, no el canal de cada conv (que es 'whatsapp'); el detalle
        // localiza la suya por id. En "otros" sí filtramos por el kind clasificado.
        const filtered = isWaView
          ? normalized
          : channel
            ? normalized.filter((c) => c.channel === channel)
            : normalized;
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
