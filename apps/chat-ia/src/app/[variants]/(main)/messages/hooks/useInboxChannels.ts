'use client';

import { useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useChatStore } from '@/store/chat';
import { getWhatsAppChannels } from '@/services/api2/whatsapp';
import type { WhatsAppChannel } from '@/services/api2/whatsapp';
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

export function useInboxChannels() {
  const [waChannels, setWaChannels] = useState<WhatsAppChannel[]>([]);
  const [loading, setLoading] = useState(true);
  // Map<channelId, totalUnread> — keyed by WhatsApp channel id
  const [unreadByChannel, setUnreadByChannel] = useState<Map<string, number>>(new Map());

  const userEvents = (useChatStore((s) => s.userEvents) as any[] | undefined) ?? [];
  const userType = useChatStore((s) => s.userType);
  const isGuest = userType === 'guest' || userType === 'visitor';

  const { checkAuth } = useAuthCheck();
  const { development } = checkAuth();

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    getWhatsAppChannels()
      .then(setWaChannels)
      .catch(() => setWaChannels([]))
      .finally(() => setLoading(false));
  }, [isGuest]);

  // Fetch unread counts from conversations (refresh every 60s)
  useEffect(() => {
    if (isGuest || !development) return;

    const fetchUnread = async () => {
      try {
        const dev = development;
        const res = await fetch(`/api/messages/whatsapp/conversations/${dev}`, { headers: buildHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        const list: any[] = Array.isArray(data) ? data : (data.conversations ?? []);
        // Sum unreadCount per sessionKey/channel
        const counts = new Map<string, number>();
        for (const conv of list) {
          const key = conv.sessionKey || 'whatsapp';
          counts.set(key, (counts.get(key) ?? 0) + (conv.unreadCount || 0));
        }
        setUnreadByChannel(counts);
      } catch {
        // ignore — badge just stays at 0
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [isGuest, development]);

  // External channels — WhatsApp (real from api2) + social (placeholders)
  const externalChannels: InboxChannel[] = [
    ...waChannels.map((ch) => ({
      id: `wa-${ch.id}`,
      kind: 'whatsapp' as const,
      label: ch.displayName || ch.phoneNumber || ch.name,
      status:
        ch.status === 'ACTIVE'
          ? ('connected' as const)
          : ch.status === 'CONNECTING'
            ? ('connecting' as const)
            : ('disconnected' as const),
      unread: unreadByChannel.get(ch.sessionKey || ch.name || '') ?? 0,
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
    {
      id: 'instagram',
      isPlaceholder: true,
      kind: 'instagram' as const,
      label: 'Instagram',
      unread: 0,
    },
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
    {
      id: 'facebook',
      isPlaceholder: true,
      kind: 'facebook' as const,
      label: 'Facebook',
      unread: 0,
    },
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
