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
        setLoading(conversations.length === 0);

        const mergeAndSort = (wa: RecentConversation[], other: RecentConversation[]) => {
          const byKey = new Map<string, RecentConversation>();
          for (const c of [...wa, ...other]) {
            if (!c.conversationId) continue;
            const key = `${c.channelParam}::${c.conversationId}`;
            const prev = byKey.get(key);
            if (!prev) {
              byKey.set(key, c);
              continue;
            }
            const ta = prev.lastMessageAt ? new Date(prev.lastMessageAt).getTime() : 0;
            const tb = c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : 0;
            byKey.set(key, tb >= ta ? c : prev);
          }

          return [...byKey.values()]
            .sort((a, b) => {
              const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
              const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
              return tb - ta;
            })
            .slice(0, max);
        };

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

        // Fetch WA channels to get real channel IDs for navigation
        const waChannels = await getWhatsAppChannels().catch(() => []);
        const firstWaChannel = waChannels.find((ch) => ch.status === 'ACTIVE') ?? waChannels[0];
        const defaultWaParam = firstWaChannel ? `wa-${firstWaChannel.id}` : 'whatsapp';

        // Build a short label per channel so multiple WA/IG channels are distinguishable
        const channelLabelMap = new Map<string, string>();
        waChannels.forEach((ch, idx) => {
          const phone = (ch.phoneNumber || '').replaceAll(/\D/g, '');
          const tail = phone ? phone.slice(-3) : '';
          const raw = tail || ch.name || ch.sessionKey || String(idx + 1);
          const abbr = raw.replaceAll(/\s+/g, '').slice(0, 3);
          channelLabelMap.set(ch.id, abbr || String(idx + 1));
        });

        // Fetch WhatsApp conversations
        // Primary: REST via Baileys (live sessions). Fallback: GraphQL api2 store (works even if external WA service is down).
        const waPromise = (async (): Promise<RecentConversation[]> => {
          const perSessionLimit = String(Math.min(25, Math.max(10, Math.ceil(max / 2))));
          const qs = new URLSearchParams({ limit: perSessionLimit, page: '1' }).toString();

          const normalizeConversationId = (sessionId: string, c: any): string => {
            const raw = (c.conversationId || c.id || '').trim();
            if (raw.includes(':')) return raw;
            const jid = (c.jid || '').trim();
            if (jid) return `${sessionId}:${jid}`;
            if (raw.includes('@')) return `${sessionId}:${raw}`;
            return raw;
          };

          const fetchForSession = async (channel: typeof waChannels[number] | null): Promise<RecentConversation[]> => {
            const sessionId = channel?.sessionKey || channel?.id || dev;
            const channelParam = channel ? `wa-${channel.id}` : defaultWaParam;
            const channelLabel = channel ? channelLabelMap.get(channel.id) : undefined;
            const url = `/api/messages/whatsapp/conversations/${encodeURIComponent(sessionId)}?${qs}`;

            const rest = await fetch(url, {
              headers: buildHeaders(),
              signal: AbortSignal.timeout(5_000),
            })
              .then(async (res) => {
                if (!res.ok) return [] as any[];
                const data = await res.json();
                const rawList: any[] = Array.isArray(data) ? data : (data.conversations ?? []);
                return rawList;
              })
              .catch(() => [] as any[]);

            return rest.map((c: any) => ({
              channelLabel,
              channelParam,
              conversationId: normalizeConversationId(sessionId, c),
              kind: 'whatsapp' as const,
              lastMessage: c.lastMessage || '',
              lastMessageAt: c.lastMessageAt || c.updatedAt || '',
              name: c.displayName || c.phoneNumber || 'Desconocido',
              unreadCount: c.unreadCount || 0,
            }));
          };

          const mapWithConcurrency = async <T, R>(
            items: T[],
            concurrency: number,
            fn: (item: T) => Promise<R>,
          ): Promise<R[]> => {
            if (items.length === 0) return [];
            const results: R[] = [];
            let idx = 0;
            const workers = Array.from({ length: Math.min(concurrency, items.length) }).map(async () => {
              while (idx < items.length) {
                const cur = items[idx++];
                results.push(await fn(cur));
              }
            });
            await Promise.all(workers);
            return results;
          };

          const primary = waChannels.find((ch) => ch.status === 'ACTIVE') ?? waChannels[0] ?? null;
          const restPrimary = await fetchForSession(primary);
          const restRemaining = waChannels.length > 1
            ? (
                await mapWithConcurrency(
                  waChannels.filter((ch) => ch !== primary),
                  2,
                  fetchForSession,
                )
              ).flat()
            : [];

          const restMapped = [...restPrimary, ...restRemaining].filter(
            (c) => c.conversationId && c.conversationId.includes(':'),
          );

          const shouldTryGql = restMapped.length === 0 || restMapped.length < Math.min(max, 10);
          if (!shouldTryGql) return restMapped;

          const gqlConvs = await getWhatsAppConversationsGQL(dev).catch(() => []);
          const gqlMapped: RecentConversation[] = gqlConvs.map((c) => ({
            channelLabel: undefined,
            channelParam: defaultWaParam,
            conversationId: `gql:${c.id}`,
            kind: 'whatsapp' as const,
            lastMessage: '',
            lastMessageAt: c.lastMessageAt || '',
            name: c.contactName || c.phoneNumber || 'Desconocido',
            unreadCount: 0,
          }));

          const seen = new Set(restMapped.map((c) => c.conversationId));
          const merged = [...restMapped, ...gqlMapped.filter((c) => !seen.has(c.conversationId))];
          return merged;
        })();

        let pushedOnce = false;
        let waPart: RecentConversation[] = [];
        let otherPart: RecentConversation[] = [];

        const push = () => {
          const merged = mergeAndSort(waPart, otherPart);
          setConversations(merged);
          if (!pushedOnce) {
            pushedOnce = true;
            setLoading(false);
          }
        };

        waPromise
          .then((wa) => {
            waPart = wa;
            push();
          })
          .catch(() => {
            waPart = [];
            push();
          });

        othersPromise
          .then((other) => {
            otherPart = other;
            push();
          })
          .catch(() => {
            otherPart = [];
            push();
          });

        await Promise.allSettled([waPromise, othersPromise]);
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
