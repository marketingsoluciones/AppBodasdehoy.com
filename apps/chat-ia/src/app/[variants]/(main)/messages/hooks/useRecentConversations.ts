'use client';

import { useEffect, useState } from 'react';

import { useChatStore } from '@/store/chat';
import { getWhatsAppChannels } from '@/services/api2/whatsapp';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { buildHeaders } from '../utils/auth';

export type ChannelKind = 'whatsapp' | 'instagram' | 'telegram' | 'email';

export interface RecentConversation {
  /** URL segment used for navigation: wa-{channelId}, instagram, telegram, etc. */
  channelParam: string;
  kind: ChannelKind;
  /** Conversation id used as the second URL segment */
  conversationId: string;
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  /** Short label identifying the specific channel (e.g. "Boda", "Sv", "2") */
  channelLabel?: string;
}

const CHANNEL_BADGE: Record<ChannelKind, { label: string; bg: string; text: string }> = {
  whatsapp: { label: 'W', bg: 'bg-green-500', text: 'text-white' },
  instagram: { label: 'IG', bg: 'bg-pink-500', text: 'text-white' },
  telegram: { label: 'TG', bg: 'bg-blue-500', text: 'text-white' },
  email: { label: '@', bg: 'bg-gray-500', text: 'text-white' },
};

export { CHANNEL_BADGE };

export function useRecentConversations(max = 5) {
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

        const res = await fetch(`/api/messages/whatsapp/conversations/${dev}`, {
          headers: buildHeaders(),
        });

        if (!res.ok) {
          setConversations([]);
          return;
        }

        const data = await res.json();
        const rawList: any[] = Array.isArray(data) ? data : (data.conversations ?? []);

        // Build a short label per channel so multiple WA/IG channels are distinguishable
        const channelLabelMap = new Map<string, string>();
        if (waChannels.length > 1) {
          waChannels.forEach((ch, idx) => {
            // Derive a ≤3-char abbreviation from channel name, falling back to index
            const raw = ch.name || ch.sessionKey || String(idx + 1);
            const abbr = raw.replace(/\s+/g, '').slice(0, 3);
            channelLabelMap.set(ch.id, abbr || String(idx + 1));
          });
        }

        const normalized: RecentConversation[] = rawList
          .map((c: any) => {
            // Use sessionKey to find the right wa-{id} param
            const sessionKey = c.sessionKey || '';
            const matchedChannel = waChannels.find(
              (ch) => ch.sessionKey === sessionKey || ch.name === sessionKey || ch.id === sessionKey,
            );
            const channelParam = matchedChannel ? `wa-${matchedChannel.id}` : defaultWaParam;
            const channelLabel = matchedChannel ? channelLabelMap.get(matchedChannel.id) : undefined;

            return {
              channelParam,
              kind: 'whatsapp' as const,
              conversationId: c.conversationId || c.id || '',
              name: c.displayName || c.phoneNumber || 'Desconocido',
              lastMessage: c.lastMessage || '',
              lastMessageAt: c.lastMessageAt || c.updatedAt || '',
              unreadCount: c.unreadCount || 0,
              channelLabel,
            };
          })
          .filter((c) => c.conversationId)
          .sort((a, b) => {
            const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return tb - ta;
          })
          .slice(0, max);

        setConversations(normalized);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [isGuestUser, development, max]);

  return { conversations, loading };
}
