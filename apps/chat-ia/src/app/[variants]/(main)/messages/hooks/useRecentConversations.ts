'use client';

import { useEffect, useState } from 'react';

import { useChatStore } from '@/store/chat';
import { getWhatsAppChannels, getWhatsAppConversationsGQL } from '@/services/api2/whatsapp';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { buildHeaders } from '../utils/auth';

export type ChannelKind = 'whatsapp' | 'instagram' | 'telegram' | 'email' | 'web' | 'facebook';

export interface RecentConversation {
  /** Short label identifying the specific channel (e.g. "Boda", "Sv", "2") */
  channelLabel?: string;
  /** URL segment used for navigation: wa-{channelId}, instagram, telegram, etc. */
  channelParam: string;
  /** Conversation id used as the second URL segment */
  conversationId: string;
  kind: ChannelKind;
  lastMessage: string;
  lastMessageAt: string;
  name: string;
  unreadCount: number;
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
        const waPromise = fetch(`/api/messages/whatsapp/conversations/${dev}`, {
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
                channelLabel,
                channelParam,
                conversationId: c.conversationId || c.id || '',
                kind: 'whatsapp' as const,
                lastMessage: c.lastMessage || '',
                lastMessageAt: c.lastMessageAt || c.updatedAt || '',
                name: c.displayName || c.phoneNumber || 'Desconocido',
                unreadCount: c.unreadCount || 0,
              };
            });
          })
          .then(async (restConvs) => {
            if (restConvs !== null) return restConvs;
            // Fallback: api2 GraphQL native store (doesn't require external WA service)
            const gqlConvs = await getWhatsAppConversationsGQL(dev).catch(() => []);
            return gqlConvs.map((c) => ({
              channelLabel: undefined,
              channelParam: defaultWaParam,
              conversationId: `gql:${c.id}`,
              kind: 'whatsapp' as const,
              lastMessage: '',
              lastMessageAt: c.lastMessageAt || '',
              name: c.contactName || c.phoneNumber || 'Desconocido',
              unreadCount: 0,
            }));
          })
          .catch(() => [] as RecentConversation[]);

        // Fetch other channels conversations (if backend supports them)
        const otherChannels: ChannelKind[] = ['instagram', 'telegram', 'email', 'web', 'facebook'];
        const othersPromise = fetch(`/api/messages/conversations?development=${dev}`, {
          headers: buildHeaders(),
        })
          .then(async (res) => {
            if (!res.ok) return [];
            const data = await res.json();
            const rawList: any[] = Array.isArray(data) ? data : (data.conversations ?? []);
            return rawList.map((c: any) => {
              const kind = (c.channel || c.platform || 'web') as ChannelKind;
              const isKnown = otherChannels.includes(kind);
              return {
                channelParam: isKnown ? kind : 'web',
                conversationId: c.conversationId || c.id || '',
                kind: isKnown ? kind : ('web' as const),
                lastMessage: c.lastMessage || '',
                lastMessageAt: c.lastMessageAt || c.updatedAt || '',
                name: c.displayName || c.contactName || c.username || 'Desconocido',
                unreadCount: c.unreadCount || 0,
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
  }, [isGuestUser, development, max, refreshKey]);

  return { conversations, loading };
}
