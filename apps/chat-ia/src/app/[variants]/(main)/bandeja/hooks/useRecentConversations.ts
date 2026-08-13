'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useChatStore } from '@/store/chat';
import { getWhatsAppChannels, getWhatsAppConversationsGQL } from '@/services/mcpApi/whatsapp';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { buildHeaders } from '../utils/auth';
import { classifyOtherChannel } from '../utils/channelClassify';
import { dedupeFetch } from '../utils/dedupeFetch';
import { friendlyContactName } from '../utils/jid';
import { useMessageStream } from './useMessageStream';

export type ChannelKind = 'whatsapp' | 'instagram' | 'telegram' | 'email' | 'web' | 'facebook';

export interface RecentConversation {
  /** Short label identifying the specific channel (e.g. "Boda", "Sv", "2") */
  channelLabel?: string;
  /** URL segment used for navigation: wa-{channelId}, instagram, telegram, etc. */
  channelParam: string;
  /** Conversation id used as the second URL segment */
  conversationId: string;
  assignedToUserId?: string | null;
  kind: ChannelKind;
  lastMessage: string;
  lastMessageAt: string;
  lastInboundAt?: string;
  lastOutboundAt?: string;
  labels?: any[];
  linkedContactId?: string | null;
  linkedEventId?: string | null;
  /** FASE B v2.0 — api-mcp commit 7d52fec (25-jun): RSVP visible en lista. */
  guestStatus?: 'confirmed' | 'pending' | 'declined' | null;
  jidType?: string | null;
  jidRaw?: string | null;
  name: string;
  unreadCount: number;
  unreadCountForAgent?: number;
  status?: string;
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
                assignedToUserId: c.assignedUserId ?? c.assigned_to ?? c.assignedTo ?? null,
                channelLabel,
                channelParam,
                conversationId: c.conversationId || c.id || '',
                kind: 'whatsapp' as const,
                lastMessage: c.lastMessage || '',
                lastMessageAt: c.lastMessageAt || c.updatedAt || '',
                lastInboundAt: c.lastInboundAt ?? c.last_inbound_at ?? undefined,
                lastOutboundAt: c.lastOutboundAt ?? c.last_outbound_at ?? undefined,
                labels: c.labels ?? c.labelIds ?? c.label_ids ?? undefined,
                linkedContactId: c.linkedContactId ?? c.linked_contact_id ?? null,
                linkedEventId: c.linkedEventId ?? c.linked_event_id ?? null,
                guestStatus: (c.guestStatus ?? c.guest_status ?? null) as
                  | 'confirmed'
                  | 'pending'
                  | 'declined'
                  | null,
                jidType: c.jidType ?? c.jid_type ?? null,
                jidRaw: c.jidRaw ?? c.jid_raw ?? null,
                name: friendlyContactName(c.displayName, c.phoneNumber, c.jidType ?? c.jid_type),
                unreadCount: c.unreadCount || 0,
                unreadCountForAgent: c.unreadCountForAgent ?? c.unread_count_for_agent ?? undefined,
                status: c.status ?? c.conversationStatus ?? undefined,
              };
            });
          })
          .then(async (restConvs) => {
            if (restConvs !== null) return restConvs;
            // Fallback: MCP GraphQL native store (doesn't require external WA service)
            const gqlConvs = await getWhatsAppConversationsGQL(dev).catch(() => []);
            return gqlConvs.map((c) => ({
              channelLabel: undefined,
              channelParam: defaultWaParam,
              conversationId: `gql:${c.id}`,
              kind: 'whatsapp' as const,
              lastMessage: '',
              lastMessageAt: c.lastMessageAt || '',
              name: friendlyContactName(c.contactName, c.phoneNumber),
              unreadCount: 0,
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
              // N31 retirado 24-jun: api-ia commit 665097b normalizó lastMessage
              // a string + lastMessageAt + lastMessageFromMe. Ya no llega objeto.
              return {
                assignedToUserId: c.assignedUserId ?? c.assigned_to ?? c.assignedTo ?? null,
                channelParam: ch,
                conversationId: c.conversationId || c.id || '',
                kind: ch,
                lastMessage: c.lastMessage || '',
                lastMessageAt: c.lastMessageAt || c.updatedAt || '',
                lastInboundAt: c.lastInboundAt ?? c.last_inbound_at ?? undefined,
                lastOutboundAt: c.lastOutboundAt ?? c.last_outbound_at ?? undefined,
                labels: c.labels ?? c.labelIds ?? c.label_ids ?? undefined,
                linkedContactId: c.linkedContactId ?? c.linked_contact_id ?? null,
                linkedEventId: c.linkedEventId ?? c.linked_event_id ?? null,
                name: friendlyContactName(c.displayName || c.contactName || c.username, c.phoneNumber, c.jidType ?? c.jid_type),
                unreadCount: c.unreadCount || 0,
                unreadCountForAgent: c.unreadCountForAgent ?? c.unread_count_for_agent ?? undefined,
                status: c.status ?? c.conversationStatus ?? undefined,
              };
            });
          })
          .catch(() => [] as RecentConversation[]);

        const [waConvs, otherConvs] = await Promise.all([waPromise, othersPromise]);

        const all = [...waConvs, ...otherConvs]
          .filter((c) => c.conversationId)
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
