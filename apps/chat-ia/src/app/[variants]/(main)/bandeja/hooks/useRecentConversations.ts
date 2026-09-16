'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { readSharedWith, type SharedPrincipal } from '../utils/visibility';

import { useChatStore } from '@/store/chat';
import { getWhatsAppChannels, getWhatsAppConversationsGQL } from '@/services/mcpApi/whatsapp';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { buildHeaders } from '../utils/auth';
import { classifyOtherChannel } from '../utils/channelClassify';
import { dedupeFetch } from '../utils/dedupeFetch';
import { friendlyContactName, inferJidType } from '../utils/jid';
import { useMessageStream } from './useMessageStream';

export type ChannelKind = 'whatsapp' | 'instagram' | 'telegram' | 'email' | 'web' | 'facebook';

export interface RecentConversation {
  /** FASE 2 Agentes (17-ago): id/nombre del AGENTE IA (sesión LobeChat) responsable
   *  de la conversación. DISTINTO de assignedToUserId (humano). Null-safe: undefined
   *  hasta que backend exponga el campo (ticket assignedAgentId). Mismo patrón que
   *  guestStatus → el badge de responsable y el filtro ?agent= solo se ACTIVAN cuando
   *  llega el dato; hasta entonces quedan dormidos (0 dead code, 0 fallback). */
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  assignedToUserId?: string | null;
  channelId?: string | null;
  /** Short label identifying the specific channel (e.g. "Boda", "Sv", "2") */
  channelLabel?: string;
  /** URL segment used for navigation: wa-{channelId}, instagram, telegram, etc. */
  channelParam: string;
  /** Multicanal (api-ia b6d1823): tipo de línea WhatsApp — 'WAB' (Meta Business API) o
   *  'WEB_QR' (número personal vinculado por QR). Permite unificar la estética WhatsApp
   *  (Meta+QR bajo un mismo verde) y a la vez decir de un vistazo por qué línea entró. */
  channelType?: 'WAB' | 'WEB_QR' | string | null;
  /** Conversation id used as the second URL segment */
  conversationId: string;
  /** FASE B v2.0 — api-mcp commit 7d52fec (25-jun): RSVP visible en lista. */
  guestStatus?: 'confirmed' | 'pending' | 'declined' | null;
  jidRaw?: string | null;
  jidType?: string | null;
  kind: ChannelKind;
  labels?: any[];
  lastInboundAt?: string;
  lastMessage: string;
  lastMessageAt: string;
  lastOutboundAt?: string;
  linkedEventId?: string | null;
  linkedContactId?: string | null;
  /** #8: teléfono/nombre de la LÍNEA receptora (para distinguir 910 vs Meta por hilo). */
  lineLabel?: string | null;
  name: string;
  /** Con quién está compartida (api-mcp `shared_with`). Sin esto, el chip de visibilidad
   *  solo salía en la lista por canal y no en la bandeja principal, que es la que se usa. */
  sharedWith?: SharedPrincipal[];
  status?: string;
  unreadCount: number;
  unreadCountForAgent?: number;
}

const CHANNEL_BADGE: Record<ChannelKind, { bg: string; label: string; text: string }> = {
  email: { bg: 'bg-gray-500', label: '@', text: 'text-white' },
  facebook: { bg: 'bg-blue-600', label: 'FB', text: 'text-white' },
  instagram: { bg: 'bg-pink-500', label: 'IG', text: 'text-white' },
  telegram: { bg: 'bg-blue-500', label: 'TG', text: 'text-white' },
  web: { bg: 'bg-orange-500', label: 'WEB', text: 'text-white' },
  whatsapp: { bg: 'bg-green-500', label: 'W', text: 'text-white' },
};

export { CHANNEL_BADGE };

export function useRecentConversations(max = 50, refreshKey = 0) {
  const [conversations, setConversations] = useState<RecentConversation[]>([]);
  const [loading, setLoading] = useState(true);
  // SSE realtime: cuando llega un mensaje nuevo via stream, incrementamos este
  // contador local para forzar re-ejecución del useEffect de fetch (efecto =
  // refrescar lista). Throttled a 1.5s en el callback para coalescer ráfagas.
  const [streamTick, setStreamTick] = useState(0);

  const { checkAuth, isGuest } = useAuthCheck();
  const { development } = checkAuth();
  const userType = useChatStore((s) => s.userType);
  const isGuestUser = isGuest || userType === 'guest' || userType === 'visitor';

  useEffect(() => {
    if (isGuestUser) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const dev = development || 'bodasdehoy';

    async function fetchAll() {
      try {
        setLoading(true);

        // Fetch WA channels to get real channel IDs for navigation
        const waChannels = await getWhatsAppChannels().catch(() => []);
        const firstWaChannel = waChannels.find((ch) => ch.status === 'ACTIVE') ?? waChannels[0];
        const defaultWaParam = firstWaChannel ? `wa-${firstWaChannel.id}` : 'whatsapp';

        // #8 informe QA: mostrar de QUÉ LÍNEA/número viene cada hilo (910 vs Meta) para que el
        // usuario lo distinga. Mapa channelId → teléfono de la línea receptora.
        const channelPhoneMap = new Map<string, string>();
        waChannels.forEach((ch) => {
          const p = ch.phoneNumber || ch.name;
          if (ch.id && p) channelPhoneMap.set(ch.id, p);
        });

        // Build a short label per channel so multiple WA/IG channels are distinguishable
        const channelLabelMap = new Map<string, string>();
        if (waChannels.length > 1) {
          waChannels.forEach((ch, idx) => {
            const raw = ch.name || ch.sessionKey || String(idx + 1);
            const abbr = raw.replaceAll(/\s+/g, '').slice(0, 3);
            channelLabelMap.set(ch.id, abbr || String(idx + 1));
          });
        }

        // Fetch WhatsApp conversations
        // Primary: REST via Baileys (live sessions). Fallback: GraphQL api2 store (works even if external WA service is down).
        const waPromise = dedupeFetch(`/api/messages/whatsapp/conversations/${dev}`, {
          headers: buildHeaders(),
        })
          .then(async (res) => {
            if (!res.ok) return null;
            const data = await res.json();
            const rawList: any[] = Array.isArray(data) ? data : (data.conversations ?? []);
            if (rawList.length === 0) return null; // empty = try fallback
            return rawList.map((c: any) => {
              const sessionKey = c.sessionKey || '';
              const matchedChannel = waChannels.find(
                (ch) => ch.sessionKey === sessionKey || ch.name === sessionKey || ch.id === sessionKey,
              );
              const channelParam = matchedChannel ? `wa-${matchedChannel.id}` : defaultWaParam;
              const channelLabel = matchedChannel ? channelLabelMap.get(matchedChannel.id) : undefined;
              return {
                // FASE 2 (dormido hasta backend): responsable = AGENTE IA. Null-safe.
                assignedAgentId: c.assignedAgentId ?? c.assigned_agent_id ?? null,
                assignedAgentName: c.assignedAgentName ?? c.assigned_agent_name ?? null,
                assignedToUserId: c.assignedUserId ?? c.assigned_to ?? c.assignedTo ?? null,
                channelLabel,
                channelParam,
                conversationId: c.conversationId || c.id || '',
                kind: 'whatsapp' as const,
                labels: c.labels ?? c.labelIds ?? c.label_ids ?? undefined,
                guestStatus: (c.guestStatus ?? c.guest_status ?? null) as
                  | 'confirmed'
                  | 'pending'
                  | 'declined'
                  | null,
                lastInboundAt: c.lastInboundAt ?? c.last_inbound_at ?? undefined,
                jidRaw: c.jidRaw ?? c.jid_raw ?? null,
                lastMessage: c.lastMessage || '',
                jidType: c.jidType ?? c.jid_type ?? null,
                sharedWith: readSharedWith(c),
                lastMessageAt: c.lastMessageAt || c.updatedAt || '',
                lastOutboundAt: c.lastOutboundAt ?? c.last_outbound_at ?? undefined,
                lineLabel: matchedChannel?.phoneNumber ?? matchedChannel?.name ?? undefined,
                linkedContactId: c.linkedContactId ?? c.linked_contact_id ?? null,
                linkedEventId: c.linkedEventId ?? c.linked_event_id ?? null,
                name: friendlyContactName(c.displayName, c.phoneNumber, c.jidType ?? c.jid_type),
                status: c.status ?? c.conversationStatus ?? undefined,
                unreadCount: c.unreadCount || 0,
                unreadCountForAgent: c.unreadCountForAgent ?? c.unread_count_for_agent ?? undefined,
              };
            });
          })
          .then(async (restConvs) => {
            if (restConvs !== null) return restConvs;
            // Fallback: MCP GraphQL native store (doesn't require external WA service)
            const gqlConvs = await getWhatsAppConversationsGQL(dev).catch(() => []);
            return gqlConvs.map((c) => ({
              assignedAgentId: c.assignedAgentId ?? null,
              channelLabel: undefined,
              channelParam: defaultWaParam,
              conversationId: `gql:${c.id}`,
              jidType: c.jidType ?? null,
              kind: 'whatsapp' as const,
              lastMessage: '',
              lastMessageAt: c.lastMessageAt || '',
              name: friendlyContactName(c.contactName, c.phoneNumber, c.jidType),
              unreadCount: c.unreadCountForAgent ?? 0,
            }));
          })
          .catch(() => [] as RecentConversation[]);

        // Fetch other channels conversations (if backend supports them)
        const othersPromise = dedupeFetch(`/api/messages/conversations?development=${dev}`, {
          headers: buildHeaders(),
        })
          .then(async (res) => {
            if (!res.ok) return [];
            const data = await res.json();
            const rawList: any[] = Array.isArray(data) ? data : (data.conversations ?? []);
            return rawList.map((c: any) => {
              // Clasificación de canal — fuente ÚNICA compartida con useConversations (rail).
              const ch = classifyOtherChannel(c.channel, c.platform);
              // api-ia devuelve `contact:{name,phone}` — no displayName/phoneNumber
              // (verificado 24-ago). Sin esto la fila se pintaba "Desconocido" y
              // `jidType` ni se ponía → el filtro anti-spam de page.tsx no la veía.
              const rawPhone = c.phoneNumber ?? c.contact?.phone ?? null;
              const rawName = c.displayName || c.contactName || c.username || c.contact?.name || rawPhone;
              const jidType = inferJidType(c.jidType ?? c.jid_type, rawName, rawPhone);
              // N31 retirado 24-jun: api-ia commit 665097b normalizó lastMessage
              // a string + lastMessageAt + lastMessageFromMe. Ya no llega objeto.
              return {
                // FASE 2 (dormido hasta backend): responsable = AGENTE IA. Null-safe.
                assignedAgentId: c.assignedAgentId ?? c.assigned_agent_id ?? null,
                assignedAgentName: c.assignedAgentName ?? c.assigned_agent_name ?? null,
                assignedToUserId: c.assignedUserId ?? c.assigned_to ?? c.assignedTo ?? null,
                
channelId: c.channelId ?? c.channel_id ?? null,
                
                // navegación: WhatsApp usa `wa-{channelId}`; el resto, el propio kind.
channelParam:
                  ch === 'whatsapp' && (c.channelId ?? c.channel_id)
                    ? `wa-${c.channelId ?? c.channel_id}`
                    : ch,
                
                // Tipo/linea de WhatsApp (api-ia ya lo manda en este endpoint: WEB_QR/WAB).
channelType: c.channelType ?? c.channel_type ?? null,
                
conversationId: c.conversationId || c.id || '',
                kind: ch,
                jidType,
                labels: c.labels ?? c.labelIds ?? c.label_ids ?? undefined,
                lastInboundAt: c.lastInboundAt ?? c.last_inbound_at ?? undefined,
                lastMessage: c.lastMessage || '',
                lastMessageAt: c.lastMessageAt || c.updatedAt || '',
                sharedWith: readSharedWith(c),
                lastOutboundAt: c.lastOutboundAt ?? c.last_outbound_at ?? undefined,
                lineLabel: channelPhoneMap.get(String(c.channelId ?? c.channel_id ?? '')) ?? null,
                linkedContactId: c.linkedContactId ?? c.linked_contact_id ?? null,
                linkedEventId: c.linkedEventId ?? c.linked_event_id ?? null,
                name: friendlyContactName(rawName, rawPhone, jidType),
                status: c.status ?? c.conversationStatus ?? undefined,
                unreadCount: c.unreadCount || 0,
                unreadCountForAgent: c.unreadCountForAgent ?? c.unread_count_for_agent ?? undefined,
              };
            });
          })
          .catch(() => [] as RecentConversation[]);

        const [waConvs, otherConvs] = await Promise.all([waPromise, othersPromise]);

        // DEDUP por conversationId (BUG 2-sep): la MISMA conversación WhatsApp-QR llega por
        // el endpoint WA y por el de "otros" → antes salían DOS filas del mismo teléfono (una
        // "W" verde y otra "Web" naranja). Fusionamos por id conservando el registro más rico:
        // el que trae `channelType` (WEB_QR/WAB) y/o un nombre real (el de "otros" para QR).
        const byId = new Map<string, RecentConversation>();
        for (const c of [...waConvs, ...otherConvs]) {
          if (!c.conversationId) continue;
          const prev = byId.get(c.conversationId);
          if (!prev) {
            byId.set(c.conversationId, c);
            continue;
          }
          // Preferimos el que aporta channelType; si empatan, el que tenga nombre no-vacío.
          const cScore = (c.channelType ? 2 : 0) + (c.name ? 1 : 0);
          const pScore = (prev.channelType ? 2 : 0) + (prev.name ? 1 : 0);
          const winner = cScore > pScore ? c : prev;
          const loser = winner === c ? prev : c;
          // Merge suave: el ganador manda, pero rellenamos huecos con el perdedor (p.ej. el
          // WA endpoint aporta jidType/labels y el de "otros" aporta channelType/nombre).
          byId.set(c.conversationId, {
            ...loser,
            ...winner,
            channelId: winner.channelId ?? loser.channelId ?? null,
            channelType: winner.channelType ?? loser.channelType ?? null,
            jidType: winner.jidType ?? loser.jidType ?? null,
            lineLabel: winner.lineLabel ?? loser.lineLabel ?? null,
            sharedWith: winner.sharedWith?.length ? winner.sharedWith : loser.sharedWith,
          });
        }

        const all = [...byId.values()]
          .sort((a, b) => {
            const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return tb - ta;
          })
          .slice(0, max);

        setConversations(all);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [isGuestUser, development, max, refreshKey, streamTick]);

  // SSE: refresh throttled al recibir nuevos mensajes (api-ia confirma stream
  // activo 24-jun). Reemplaza polling 30s anterior.
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleStreamRefresh = useCallback(() => {
    if (streamTimerRef.current) return;
    streamTimerRef.current = setTimeout(() => {
      streamTimerRef.current = null;
      setStreamTick((t) => t + 1);
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearTimeout(streamTimerRef.current);
    };
  }, []);

  useMessageStream({
    enabled: !isGuestUser,
    onMessage: scheduleStreamRefresh,
  });

  return { conversations, loading };
}
