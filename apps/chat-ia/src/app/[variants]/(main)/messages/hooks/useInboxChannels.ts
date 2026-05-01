'use client';

import { useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useChatStore } from '@/store/chat';
import { getSocialAccounts } from '@/services/mcpApi/smm';
import type { SMMSocialAccount } from '@/services/mcpApi/smm';
import { getWhatsAppChannels } from '@/services/mcpApi/whatsapp';
import type { WhatsAppChannel } from '@/services/mcpApi/whatsapp';
import { buildHeaders } from '../utils/auth';

export type ChannelKind =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'telegram'
  | 'email'
  | 'web'
  | 'itinerary'
  | 'services'
  | 'guests'
  | 'tasks';

export interface InboxChannel {
  eventId?: string; 
  id: string;
  isPlaceholder?: boolean;
  kind: ChannelKind;
  // URL param: "whatsapp", "wa-channelId", "ev-eventId-itinerary"
  label: string;
  status?: 'connected' | 'disconnected' | 'connecting';
  unread: number;
}

export interface EventGroup {
  channels: InboxChannel[];
  eventId: string;
  eventName: string;
}

export function useInboxChannels(options?: { enableUnread?: boolean }) {
  const [waChannels, setWaChannels] = useState<WhatsAppChannel[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SMMSocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  // Map<channelId, totalUnread> — keyed by WhatsApp channel id
  const [unreadByChannel, setUnreadByChannel] = useState<Map<string, number>>(new Map());

  const userEvents = (useChatStore((s) => s.userEvents) as any[] | undefined) ?? [];
  const userType = useChatStore((s) => s.userType);
  const isGuest = userType === 'guest' || userType === 'visitor';
  const enableUnread = options?.enableUnread !== false;

  const { checkAuth } = useAuthCheck();
  const { development } = checkAuth();

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    Promise.all([
      getWhatsAppChannels().catch(() => [] as WhatsAppChannel[]),
      getSocialAccounts(development ?? 'bodasdehoy').catch(() => [] as SMMSocialAccount[]),
    ]).then(([wa, social]) => {
      setWaChannels(wa);
      setSocialAccounts(social);
    }).finally(() => setLoading(false));
  }, [isGuest, development]);

  // Fetch unread counts from conversations (refresh every 60s)
  useEffect(() => {
    if (isGuest || !enableUnread) return;

    const fetchUnread = async () => {
      try {
        const qs = new URLSearchParams({ limit: '50', page: '1' }).toString();
        const counts = new Map<string, number>();
        const sessions =
          waChannels.length > 0
            ? waChannels.map((ch) => ch.sessionKey || ch.id || ch.development)
            : [development || 'bodasdehoy'];

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

        await mapWithConcurrency(
          sessions.filter(Boolean),
          2,
          async (sessionId) => {
            const res = await fetch(
              `/api/messages/whatsapp/conversations/${encodeURIComponent(String(sessionId))}?${qs}`,
              { headers: buildHeaders() },
            );
            if (!res.ok) return;
            const data = await res.json();
            const list: any[] = Array.isArray(data) ? data : (data.conversations ?? []);
            for (const conv of list) {
              counts.set(String(sessionId), (counts.get(String(sessionId)) ?? 0) + (conv.unreadCount || 0));
            }
          },
        );

        setUnreadByChannel(counts);
      } catch {
        // ignore — badge just stays at 0
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [enableUnread, isGuest, development, waChannels]);

  // External channels — WhatsApp (real from MCP) + social (placeholders)
  const externalChannels: InboxChannel[] = [
    ...waChannels.map((ch) => ({
      id: `wa-${ch.id}`,
      kind: 'whatsapp' as const,
      label: ch.phoneNumber ? `${ch.name} · +${ch.phoneNumber}` : (ch.displayName || ch.name),
      status:
        ch.status === 'ACTIVE'
          ? ('connected' as const)
          : ch.status === 'CONNECTING'
            ? ('connecting' as const)
            : ('disconnected' as const),
      unread: unreadByChannel.get(ch.sessionKey || ch.id || ch.development || '') ?? 0,
    })),
    // If no WA channels configured yet, show a "connect" entry
    ...(waChannels.length === 0 && !loading
      ? [
          {
            id: 'whatsapp',
            kind: 'whatsapp' as const,
            label: 'WhatsApp',
            status: 'disconnected' as const,
            unread: 0,
          },
        ]
      : []),
    (() => {
      const ig = socialAccounts.find((a) => a.platform === 'INSTAGRAM');
      return {
        id: ig ? `ig-${ig._id}` : 'instagram',
        isPlaceholder: !ig,
        kind: 'instagram' as const,
        label: ig ? `@${ig.username}` : 'Instagram',
        status: ig ? ('connected' as const) : undefined,
        unread: 0,
      };
    })(),
    {
      id: 'telegram',
      isPlaceholder: true,
      kind: 'telegram' as const,
      label: 'Telegram',
      unread: 0,
    },
    {
      id: 'email',
      isPlaceholder: true,
      kind: 'email' as const,
      label: 'Email',
      unread: 0,
    },
    {
      id: 'web',
      isPlaceholder: true,
      kind: 'web' as const,
      label: 'Chat Web',
      unread: 0,
    },
    (() => {
      const fb = socialAccounts.find((a) => a.platform === 'FACEBOOK');
      return {
        id: fb ? `fb-${fb._id}` : 'facebook',
        isPlaceholder: !fb,
        kind: 'facebook' as const,
        label: fb ? `@${fb.username}` : 'Facebook',
        status: fb ? ('connected' as const) : undefined,
        unread: 0,
      };
    })(),
  ];

  // Internal channels — limit to 5 most recent/upcoming events to avoid overwhelming the sidebar
  const recentEvents = [...userEvents]
    .sort((a: any, b: any) => {
      const fa = a.fecha || a.date || '';
      const fb = b.fecha || b.date || '';
      const now = Date.now();
      const da = fa ? Math.abs(new Date(fa).getTime() - now) : Infinity;
      const db = fb ? Math.abs(new Date(fb).getTime() - now) : Infinity;
      return da - db;
    })
    .slice(0, 5);

  const eventGroups: EventGroup[] = recentEvents.map((event: any) => {
    const eventId = event.id || event._id || '';
    return {
      channels: [
        {
          eventId,
          id: `ev-${eventId}-itinerary`,
          kind: 'itinerary' as const,
          label: 'itinerario',
          unread: 0,
        },
        {
          eventId,
          id: `ev-${eventId}-services`,
          kind: 'services' as const,
          label: 'servicios',
          unread: 0,
        },
        {
          eventId,
          id: `ev-${eventId}-guests`,
          kind: 'guests' as const,
          label: 'invitados',
          unread: 0,
        },
        {
          eventId,
          id: `ev-${eventId}-tasks`,
          kind: 'tasks' as const,
          label: 'tareas',
          unread: 0,
        },
      ],
      eventId,
      eventName: event.name || event.nombre || 'Evento',
    };
  });

  return { eventGroups, externalChannels, isGuest, loading };
}
