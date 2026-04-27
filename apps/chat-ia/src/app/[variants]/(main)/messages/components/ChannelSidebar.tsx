'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

import { useChatStore } from '@/store/chat';
import { api2Client } from '@/services/api2/client';
import { getUnreadNotificationsCount } from '@/services/api2/notifications';
import { useAuthCheck } from '@/hooks/useAuthCheck';

import { useInboxChannels } from '../hooks/useInboxChannels';
import type { InboxChannel } from '../hooks/useInboxChannels';
import { usePendingTasksSidebar } from '../hooks/usePendingTasksSidebar';
import type { PendingTaskItem } from '../hooks/usePendingTasksSidebar';
import { useRecentConversations, CHANNEL_BADGE } from '../hooks/useRecentConversations';
import type { RecentConversation, ChannelKind } from '../hooks/useRecentConversations';
import { useChannelHealthMonitor } from '../hooks/useChannelHealthMonitor';
import type { EventoData } from '../hooks/useEventData';
import { useConversationMetaState } from '../hooks/useConversationMeta';

import { ConnectChannelDrawer } from './ConnectChannelDrawer';

// ─── types ────────────────────────────────────────────────────────────────────

interface EventSummary {
  fecha?: string;
  hasActivity: boolean;
  id: string;
  invitadosCount: number;
  name: string;
  tareasCount: number;
  tareasPendientes: number;
  unreadCount: number;
}

type ChannelFilter = 'all' | ChannelKind;

interface ChannelSidebarProps {
  /** Compact mode: panel fijo de 320px en desktop layout. Full: pantalla completa mobile. */
  compact?: boolean;
}

type InboxView = 'all' | 'mine' | 'unassigned' | 'closed';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;
  if (diffH < 1) return 'hace min';
  if (diffH < 24) return `hace ${Math.floor(diffH)}h`;
  if (diffH < 168) return d.toLocaleDateString('es-ES', { weekday: 'short' });
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

const GET_EVENTO_BY_ID = `
  query GetEventoById($id: ID!) {
    getEventoById(id: $id) {
      id
      nombre
      fecha
      itinerarios_array
      invitados_array
    }
  }
`;

const CHANNEL_ICON: Record<string, string> = {
  email: '📧',
  facebook: '📘',
  guests: '👥',
  instagram: '📷',
  itinerary: '📅',
  services: '🏢',
  tasks: '✅',
  telegram: '✈️',
  web: '🌐',
  whatsapp: '📱',
};

const STATUS_DOT: Record<string, string> = {
  connected: 'bg-green-400',
  connecting: 'bg-yellow-400 animate-pulse',
  disconnected: 'bg-gray-400',
};

const FILTER_TABS: { key: ChannelFilter; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'whatsapp', label: 'WA' },
  { key: 'instagram', label: 'IG' },
  { key: 'telegram', label: 'TG' },
  { key: 'email', label: '@' },
  { key: 'web', label: 'Web' },
  { key: 'facebook', label: 'FB' },
];

// ─── hook: event summaries ────────────────────────────────────────────────────

function useEventSummaries(enabled: boolean) {
  const userEvents = (useChatStore((s) => s.userEvents) as any[] | undefined) ?? [];
  const [summaries, setSummaries] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const eventIds = useMemo(() => {
    if (!enabled) return [];
    const now = Date.now();
    return [...userEvents]
      .sort((a: any, b: any) => {
        const fa = a.fecha || a.date || '';
        const fb = b.fecha || b.date || '';
        const da = fa ? Math.abs(new Date(fa).getTime() - now) : Infinity;
        const db = fb ? Math.abs(new Date(fb).getTime() - now) : Infinity;
        return da - db;
      })
      .slice(0, 5)
      .map((e: any) => ({
        fecha: e.fecha || e.date,
        id: e.id || e._id || '',
        name: e.name || e.nombre || 'Evento',
      }));
  }, [enabled, userEvents]);

  useEffect(() => {
    if (eventIds.length === 0) {
      setSummaries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      eventIds.map(async (ev) => {
        try {
          const res = await api2Client.query<{ getEventoById: EventoData }>(GET_EVENTO_BY_ID, {
            id: ev.id,
          });
          const data = res.getEventoById;
          const invitados = data?.invitados_array ?? [];
          const itinerarios = data?.itinerarios_array ?? [];
          let tareasCount = 0;
          let tareasPendientes = 0;
          for (const it of itinerarios) {
            for (const t of it.tasks ?? []) {
              tareasCount++;
              const done = t.completada || t.estatus === true || t.estatus === 'true';
              if (!done) tareasPendientes++;
            }
          }
          return {
            fecha: data?.fecha || ev.fecha,
            hasActivity: tareasPendientes > 0 || invitados.length > 0,
            id: ev.id,
            invitadosCount: invitados.length,
            name: data?.nombre || ev.name,
            tareasCount,
            tareasPendientes,
            unreadCount: tareasPendientes,
          } as EventSummary;
        } catch {
          return {
            fecha: ev.fecha,
            hasActivity: false,
            id: ev.id,
            invitadosCount: 0,
            name: ev.name,
            tareasCount: 0,
            tareasPendientes: 0,
            unreadCount: 0,
          } as EventSummary;
        }
      }),
    )
      .then(setSummaries)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(eventIds)]);

  return { loading, summaries };
}

// ─── section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, extra }: { extra?: ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between px-3 pb-1 pt-4">
      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      {extra}
    </div>
  );
}

// ─── task row ─────────────────────────────────────────────────────────────────

function TaskRow({ item, onClick }: { item: PendingTaskItem; onClick: () => void }) {
  const { tarea } = item;
  const fecha = tarea.fecha ? new Date(tarea.fecha) : null;
  const dateLabel = fecha
    ? fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null;

  return (
    <button
      className="group flex w-full flex-col gap-0.5 rounded-lg bg-amber-50 px-3 py-2 text-left text-gray-800 transition-colors hover:bg-amber-100"
      onClick={onClick}
      type="button"
    >
      <div className="flex w-full items-start gap-2">
        <span className="mt-0.5 shrink-0 text-sm">{tarea.icon ?? '📋'}</span>
        <span className="flex-1 truncate text-xs font-medium leading-snug">
          {tarea.descripcion}
        </span>
      </div>
      <div className="ml-5 flex items-center gap-2 text-[10px] text-gray-400">
        <span className="truncate">{item.itinerarioTitle}</span>
        {dateLabel && <span className="shrink-0 text-pink-400">· {dateLabel}</span>}
      </div>
    </button>
  );
}

// ─── event card ───────────────────────────────────────────────────────────────

function EventCard({ event, onClick }: { event: EventSummary; onClick: () => void }) {
  const stats: string[] = [];
  if (event.invitadosCount > 0) stats.push(`${event.invitadosCount} inv`);
  if (event.tareasCount > 0) stats.push(`${event.tareasCount} tareas`);
  if (event.fecha) {
    const d = new Date(event.fecha);
    if (!isNaN(d.getTime())) stats.push(formatRelativeTime(d));
  }
  const statsLine = stats.length > 0 ? ` · ${stats.join(' · ')}` : '';

  const nameLower = event.name.toLowerCase();
  const icon = nameLower.includes('boda')
    ? '💒'
    : nameLower.includes('cumple') || nameLower.includes('aniversario')
      ? '🎂'
      : '📅';

  return (
    <button
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
        event.hasActivity ? 'bg-white' : 'bg-gray-50'
      } hover:bg-gray-100`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${event.hasActivity ? 'bg-green-500' : 'bg-gray-300'}`}
      />
      <div className="min-w-0 flex-1 truncate">
        <span className="text-[11px] font-semibold text-gray-900">
          {icon} {event.name}
          <span className="font-normal text-gray-500">{statsLine}</span>
        </span>
      </div>
      {event.unreadCount > 0 && (
        <span
          className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold leading-none text-white"
          title={`${event.unreadCount} pendiente${event.unreadCount !== 1 ? 's' : ''}`}
        >
          {event.unreadCount}
        </span>
      )}
    </button>
  );
}

// ─── conversation row ─────────────────────────────────────────────────────────

function ConversationRow({ conv, onClick }: { conv: RecentConversation; onClick: () => void }) {
  const badge = CHANNEL_BADGE[conv.kind];
  const initials = conv.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const timeLabel = conv.lastMessageAt ? formatRelativeTime(conv.lastMessageAt) : null;
  const badgeContent = conv.channelLabel
    ? `${badge.label}·${conv.channelLabel.slice(0, 3)}`
    : badge.label;
  const badgeWide = !!conv.channelLabel;

  return (
    <button
      className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-gray-700 transition-colors hover:bg-gray-100"
      onClick={onClick}
      type="button"
    >
      <div className="relative shrink-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
          {initials || '?'}
        </span>
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full text-[6px] font-bold leading-none ${badge.bg} ${badge.text} ${badgeWide ? 'h-3.5 min-w-[18px] px-0.5' : 'h-3.5 w-3.5'}`}
        >
          {badgeContent}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="truncate text-[11px] font-medium leading-tight">{conv.name}</span>
          {timeLabel && <span className="shrink-0 text-[9px] text-gray-400">{timeLabel}</span>}
        </div>
        {conv.lastMessage && (
          <span className="block truncate text-[10px] leading-none text-gray-400">
            {conv.lastMessage}
          </span>
        )}
      </div>
      {conv.unreadCount > 0 && (
        <span className="shrink-0 rounded-full bg-green-500 px-1 py-0.5 text-[9px] font-bold text-white">
          {conv.unreadCount}
        </span>
      )}
    </button>
  );
}

// ─── channel row ──────────────────────────────────────────────────────────────

function ChannelRow({ channel, onClick }: { channel: InboxChannel; onClick: () => void }) {
  const icon = CHANNEL_ICON[channel.kind] ?? '💬';
  const dotClass = channel.status ? STATUS_DOT[channel.status] : undefined;

  return (
    <button
      className="group flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      onClick={onClick}
      type="button"
    >
      <span className="shrink-0 text-sm">{icon}</span>
      <span className="flex-1 truncate text-xs">{channel.label}</span>
      {(channel.status === 'disconnected' || channel.status === 'connecting') && channel.kind === 'whatsapp' && (
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
          channel.status === 'connecting'
            ? 'bg-yellow-200 text-yellow-800'
            : 'bg-green-700/60 text-green-300'
        }`}>
          {channel.status === 'connecting' ? 'Reconectar' : 'Conectar'}
        </span>
      )}
      {dotClass && channel.status !== 'disconnected' && (
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
      )}
      {channel.unread > 0 && (
        <span className="shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-gray-900">
          {channel.unread}
        </span>
      )}
    </button>
  );
}

// ─── main export ──────────────────────────────────────────────────────────────

export function ChannelSidebar({ compact = false }: ChannelSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuthCheck();
  const { userId } = checkAuth();
  const metaState = useConversationMetaState();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Data hooks
  const { summaries: events, loading: eventsLoading } = useEventSummaries(!compact);
  const { tasks: pendingTasks, loading: tasksLoading } = usePendingTasksSidebar(compact ? 0 : 6);
  const { conversations: recentConvs, loading: convsLoading } = useRecentConversations(compact ? 15 : 50);
  const { externalChannels, loading: channelsLoading } = useInboxChannels({ enableUnread: !compact });

  // Channel health monitor
  const [healthAlert, setHealthAlert] = useState<{ kind: string, label: string; } | null>(null);
  const handleChannelDown = useCallback(
    (ev: { channelId: string; kind: string; label: string }) => {
      setHealthAlert({ kind: ev.kind, label: ev.label });
    },
    [],
  );
  const handleChannelRecovered = useCallback(() => {
    setHealthAlert(null);
  }, []);
  useChannelHealthMonitor({
    channels: externalChannels,
    onChannelDown: handleChannelDown,
    onChannelRecovered: handleChannelRecovered,
  });

  // Search & filter state
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');

  const activeView = (searchParams.get('view') as InboxView) || 'all';
  const setView = useCallback(
    (view: InboxView) => {
      const next = new URLSearchParams(searchParams.toString());
      if (view === 'all') next.delete('view');
      else next.set('view', view);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const viewCounts = useMemo(() => {
    let mine = 0;
    let unassigned = 0;
    let closed = 0;
    for (const c of recentConvs) {
      const meta = metaState[c.conversationId] ?? {};
      const status = meta.status ?? 'open';
      const assignedUserId = meta.assignedUserId ?? null;
      if (status === 'closed') {
        closed++;
        continue;
      }
      if (!assignedUserId) {
        unassigned++;
        continue;
      }
      if (userId && assignedUserId === userId) mine++;
    }
    return { closed, mine, unassigned };
  }, [metaState, recentConvs, userId]);

  // Notification count
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  useEffect(() => {
    if (compact) return;
    getUnreadNotificationsCount()
      .then(setUnreadNotifs)
      .catch(() => {});
    const id = setInterval(() => {
      getUnreadNotificationsCount()
        .then(setUnreadNotifs)
        .catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, [compact]);

  // Filtered conversations
  const filteredConvs = useMemo(() => {
    let list = recentConvs;
    if (channelFilter !== 'all') {
      list = list.filter((c) => c.kind === channelFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.lastMessage?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [recentConvs, channelFilter, search]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (!search.trim()) return pendingTasks;
    const q = search.toLowerCase();
    return pendingTasks.filter(
      (t) =>
        t.tarea.descripcion.toLowerCase().includes(q) ||
        t.itinerarioTitle.toLowerCase().includes(q),
    );
  }, [pendingTasks, search]);

  // Active messaging channels (configured + with history)
  const activeMessagingChannels = useMemo(() => {
    return externalChannels.filter((ch) => {
      if (ch.isPlaceholder) return false;
      const hasUnread = ch.unread > 0;
      const hasConversation = recentConvs.some(
        (conv) => conv.channelParam === ch.id || conv.kind === ch.kind,
      );
      // Also show channels that are actively connected, even with no conversations yet
      const isConnected = ch.status === 'connected';
      return hasUnread || hasConversation || isConnected;
    });
  }, [externalChannels, recentConvs]);

  const totalUnread = recentConvs.reduce((n, c) => n + c.unreadCount, 0);
  const totalPending = pendingTasks.length;
  const isLoading = eventsLoading && tasksLoading && convsLoading;

  // Available channel filter tabs
  const availableKinds = useMemo(() => {
    const kinds = new Set(recentConvs.map((c) => c.kind));
    return FILTER_TABS.filter((t) => t.key === 'all' || kinds.has(t.key as ChannelKind));
  }, [recentConvs]);

  // Navigation handlers
  const handleEventClick = (eventId: string) => {
    router.push(`/messages/ev-${eventId}-itinerary`);
  };
  const handleConvClick = (conv: RecentConversation) => {
    router.push(
      `/messages/${encodeURIComponent(conv.channelParam)}/${encodeURIComponent(conv.conversationId)}`,
    );
  };
  const handleTaskClick = (item: PendingTaskItem) => {
    router.push(`/messages/ev-${item.eventId}-task/${item.tarea._id}`);
  };
  const handleChannelSelect = (channelId: string) => {
    router.push(`/messages/${channelId}`);
  };

  return (
    <>
      <div className="flex h-full w-full flex-col overflow-hidden bg-white">
        {/* ── Channel health alert ── */}
        {healthAlert && (
          <div className="flex shrink-0 items-center gap-2 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span>⚠️</span>
            <span className="flex-1">
              {CHANNEL_ICON[healthAlert.kind] ?? '💬'} {healthAlert.label} desconectado
            </span>
            <button
              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-100"
              onClick={() => router.push('/settings/integrations')}
              type="button"
            >
              Reconectar
            </button>
            <button
              className="shrink-0 text-amber-500 hover:text-amber-700"
              onClick={() => setHealthAlert(null)}
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── WhatsApp connection status banner ── */}
        {!channelsLoading && (() => {
          const waChannels = externalChannels.filter((ch) => ch.kind === 'whatsapp');
          const hasConnected = waChannels.some((ch) => ch.status === 'connected');
          const hasConnecting = waChannels.some((ch) => ch.status === 'connecting');
          const allDisconnected = waChannels.length > 0 && !hasConnected && !hasConnecting;
          const noChannels = waChannels.length === 0;

          if (hasConnected) return null;

          if (hasConnecting) {
            return (
              <div className="flex shrink-0 items-center gap-2 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                <span className="flex-1">WhatsApp reconectando...</span>
                <button
                  className="shrink-0 rounded bg-yellow-200 px-2 py-0.5 text-[10px] font-semibold text-yellow-900 hover:bg-yellow-300"
                  onClick={() => router.push('/settings/integrations')}
                  type="button"
                >
                  Escanear QR
                </button>
              </div>
            );
          }

          if (allDisconnected || noChannels) {
            return (
              <div className="flex shrink-0 items-center gap-2 bg-red-50 px-3 py-2 text-xs text-red-700">
                <span>📱</span>
                <span className="flex-1">WhatsApp no conectado</span>
                <button
                  className="shrink-0 rounded bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-green-700"
                  onClick={() => router.push('/settings/integrations')}
                  type="button"
                >
                  Conectar
                </button>
              </div>
            );
          }

          return null;
        })()}

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
          <span className="text-sm font-semibold text-gray-900">Mensajes</span>
          <div className="flex items-center gap-0.5">
            <Link
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              href="/messages/whatsapp"
              title="Nueva conversación"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </Link>
            {/* ⊕ Conectar canal — abre drawer inline en lugar de navegar a /settings/integrations */}
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              onClick={() => setDrawerOpen(true)}
              title="Conectar canal"
              type="button"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Summary pill ── */}
        {!compact && (totalPending > 0 || totalUnread > 0 || unreadNotifs > 0) && (
          <div className="shrink-0 px-2 pt-2">
            <div className="flex items-center gap-1.5 rounded-2xl bg-purple-600 px-3 py-1.5 text-[10px] font-medium text-white">
              <span>📅</span>
              <span>Hoy:</span>
              {totalPending > 0 && (
                <span>
                  {totalPending} {totalPending === 1 ? 'tarea' : 'tareas'}
                </span>
              )}
              {totalPending > 0 && totalUnread > 0 && <span>·</span>}
              {totalUnread > 0 && (
                <span>
                  {totalUnread} msg{totalUnread !== 1 ? 's' : ''}
                </span>
              )}
              {unreadNotifs > 0 && (
                <>
                  <span>·</span>
                  <span>{unreadNotifs} notif</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Views ── */}
        <div className="shrink-0 px-2 pt-2">
          <div className="flex gap-1">
            <button
              className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                activeView === 'mine'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setView(activeView === 'mine' ? 'all' : 'mine')}
              type="button"
            >
              Mis asignadas
              {viewCounts.mine > 0 ? ` · ${viewCounts.mine}` : ''}
            </button>
            <button
              className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                activeView === 'unassigned'
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setView(activeView === 'unassigned' ? 'all' : 'unassigned')}
              type="button"
            >
              Sin asignar
              {viewCounts.unassigned > 0 ? ` · ${viewCounts.unassigned}` : ''}
            </button>
            <button
              className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                activeView === 'closed'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setView(activeView === 'closed' ? 'all' : 'closed')}
              type="button"
            >
              Cerradas
              {viewCounts.closed > 0 ? ` · ${viewCounts.closed}` : ''}
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="shrink-0 px-2 pt-2">
          <input
            className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tareas, chats..."
            type="text"
            value={search}
          />
        </div>

        {/* ── Channel filter tabs ── */}
        {availableKinds.length > 2 && (
          <div className="flex shrink-0 gap-1 overflow-x-auto px-2 pb-1 pt-2">
            {availableKinds.map((tab) => (
              <button
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  channelFilter === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                key={tab.key}
                onClick={() => setChannelFilter(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
          </div>
        )}

        {/* ── Scrollable body ── */}
        {!isLoading && (
          <div className="flex-1 overflow-y-auto pb-2">
            {/* ── Pending tasks ── */}
            {!compact && !tasksLoading && filteredTasks.length > 0 && channelFilter === 'all' && (
              <>
                <SectionLabel label="Tareas pendientes" />
                <div className="space-y-1 px-2">
                  {filteredTasks.map((item) => (
                    <TaskRow
                      item={item}
                      key={item.tarea._id}
                      onClick={() => handleTaskClick(item)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* ── Events (channels) ── */}
            {!compact && events.length > 0 && channelFilter === 'all' && !search.trim() && (
              <>
                <SectionLabel label="Canales" />
                <div className="space-y-0.5 px-2">
                  {events.map((ev) => (
                    <EventCard event={ev} key={ev.id} onClick={() => handleEventClick(ev.id)} />
                  ))}
                </div>
              </>
            )}

            {/* ── Conversations ── */}
            {filteredConvs.length > 0 && (
              <>
                <SectionLabel
                  extra={
                    <Link
                      className="text-[9px] font-medium text-purple-500 hover:text-purple-700"
                      href="/messages"
                    >
                      Ver todo
                    </Link>
                  }
                  label={
                    channelFilter === 'all'
                      ? 'Mensajes'
                      : (FILTER_TABS.find((t) => t.key === channelFilter)?.label ?? 'Mensajes')
                  }
                />
                <div className="space-y-0 px-2">
                  {filteredConvs.map((conv) => (
                    <ConversationRow
                      conv={conv}
                      key={conv.conversationId}
                      onClick={() => handleConvClick(conv)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* ── Empty state for filtered ── */}
            {filteredConvs.length === 0 && (channelFilter !== 'all' || search.trim()) && (
              <div className="px-3 py-6 text-center text-xs text-gray-400">
                Sin resultados
                {search.trim() && <> para &ldquo;{search}&rdquo;</>}
              </div>
            )}

            {/* ── Messaging channels (when no conversations yet) ── */}
            {!convsLoading &&
              recentConvs.length === 0 &&
              channelFilter === 'all' &&
              !search.trim() && (
                <>
                  <SectionLabel label="Mensajería" />
                  <div className="space-y-0.5 px-2">
                    {channelsLoading ? (
                      <div className="px-3 py-2 text-xs text-gray-400">Cargando...</div>
                    ) : activeMessagingChannels.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        No hay canales configurados.{' '}
                        <button
                          className="text-purple-500 hover:underline"
                          onClick={() => setDrawerOpen(true)}
                          type="button"
                        >
                          Conectar canal →
                        </button>
                      </div>
                    ) : (
                      activeMessagingChannels.map((ch) => (
                        <ChannelRow
                          channel={ch}
                          key={ch.id}
                          onClick={() => handleChannelSelect(ch.id)}
                        />
                      ))
                    )}
                  </div>
                </>
              )}

            {/* ── Notifications ── */}
            {!compact && channelFilter === 'all' && !search.trim() && (
              <div className="px-2 pb-1 pt-3">
                <button
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-gray-700 transition-colors hover:bg-gray-100"
                  onClick={() => router.push('/notifications')}
                  type="button"
                >
                  <span className="shrink-0 text-sm">🔔</span>
                  <span className="flex-1 text-xs font-medium">Notificaciones</span>
                  {unreadNotifs > 0 && (
                    <span className="shrink-0 rounded-full bg-pink-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {unreadNotifs}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ConnectChannelDrawer ── */}
      <ConnectChannelDrawer onClose={() => setDrawerOpen(false)} open={drawerOpen} />
    </>
  );
}
