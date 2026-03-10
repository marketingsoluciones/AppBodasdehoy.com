'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useInboxChannels } from '../hooks/useInboxChannels';
import type { InboxChannel, EventGroup } from '../hooks/useInboxChannels';
import { usePendingTasksSidebar } from '../hooks/usePendingTasksSidebar';
import type { PendingTaskItem } from '../hooks/usePendingTasksSidebar';
import { useRecentConversations, CHANNEL_BADGE } from '../hooks/useRecentConversations';
import type { RecentConversation } from '../hooks/useRecentConversations';
import { getUnreadNotificationsCount } from '@/services/api2/notifications';

// ─── icons ────────────────────────────────────────────────────────────────────

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '📱',
  instagram: '📷',
  facebook: '📘',
  telegram: '✈️',
  email: '📧',
  web: '🌐',
  itinerary: '📅',
  services: '🏢',
  guests: '👥',
  tasks: '✅',
};

const STATUS_DOT: Record<string, string> = {
  connected: 'bg-green-400',
  connecting: 'bg-yellow-400 animate-pulse',
  disconnected: 'bg-gray-400',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;
  if (diffH < 24) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (diffH < 168) return d.toLocaleDateString('es-ES', { weekday: 'short' });
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ─── components ───────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pb-1 pt-4">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </span>
    </div>
  );
}

function TaskRow({
  item,
  isActive,
  onClick,
}: {
  item: PendingTaskItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const { tarea } = item;
  const fecha = tarea.fecha ? new Date(tarea.fecha) : null;
  const dateLabel = fecha
    ? fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null;

  return (
    <button
      className={`group flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors ${
        isActive
          ? 'bg-purple-100 text-purple-900 ring-1 ring-purple-200'
          : 'bg-amber-50 text-gray-800 hover:bg-amber-100'
      }`}
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

function ConversationRow({
  conv,
  isActive,
  onClick,
}: {
  conv: RecentConversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const badge = CHANNEL_BADGE[conv.kind];
  const initials = conv.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const timeLabel = conv.lastMessageAt ? formatRelativeTime(conv.lastMessageAt) : null;

  // When channelLabel is set (multiple channels of same kind), show abbreviated channel name
  const badgeContent = conv.channelLabel
    ? `${badge.label}·${conv.channelLabel.slice(0, 3)}`
    : badge.label;
  const badgeWide = !!conv.channelLabel;

  return (
    <button
      className={`group flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors ${
        isActive
          ? 'bg-purple-100 text-purple-900 ring-1 ring-purple-200'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      onClick={onClick}
      type="button"
    >
      {/* compact avatar 28px */}
      <div className="relative shrink-0">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
          {initials || '?'}
        </span>
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full text-[6px] font-bold leading-none ${badge.bg} ${badge.text} ${badgeWide ? 'h-3.5 min-w-[18px] px-0.5' : 'h-3.5 w-3.5'}`}
          title={conv.channelLabel ? `Red: ${conv.channelLabel}` : badge.label}
        >
          {badgeContent}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="truncate text-[11px] font-medium leading-tight">{conv.name}</span>
          {timeLabel && (
            <span className="shrink-0 text-[9px] text-gray-400">{timeLabel}</span>
          )}
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

function ChannelRow({
  channel,
  isActive,
  onClick,
  compact = false,
}: {
  channel: InboxChannel;
  isActive: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const icon = CHANNEL_ICON[channel.kind] ?? '💬';
  const dotClass = channel.status ? STATUS_DOT[channel.status] : undefined;

  return (
    <button
      className={`group flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : channel.isPlaceholder
            ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
      onClick={onClick}
      title={channel.isPlaceholder ? 'Configurar' : undefined}
      type="button"
    >
      <span className={`shrink-0 text-sm ${compact ? '' : 'text-base'}`}>
        {compact ? '#' : icon}
      </span>
      <span className={`flex-1 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
        {channel.label}
        {channel.isPlaceholder && (
          <span className="ml-1 text-[10px] text-orange-400">configurar</span>
        )}
      </span>
      {channel.status === 'disconnected' && channel.kind === 'whatsapp' && !compact && (
        <span className="shrink-0 rounded bg-green-700/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-green-300">
          Conectar
        </span>
      )}
      {dotClass && channel.status !== 'disconnected' && !compact && (
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

function EventGroupSection({
  group,
  activeChannel,
  onSelect,
}: {
  group: EventGroup;
  activeChannel: string;
  onSelect: (channelId: string) => void;
}) {
  const isAnyActive = group.channels.some((c) => c.id === activeChannel);
  const [open, setOpen] = useState(isAnyActive);

  return (
    <div>
      <button
        className="flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-left transition-colors hover:bg-gray-100"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="text-[10px] text-gray-400">{open ? '▾' : '▸'}</span>
        <span className="flex-1 truncate text-xs font-medium text-gray-700">
          {group.eventName}
        </span>
        {isAnyActive && (
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
        )}
      </button>
      {open && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {group.channels.map((ch) => (
            <ChannelRow
              channel={ch}
              compact
              isActive={ch.id === activeChannel}
              key={ch.id}
              onClick={() => onSelect(ch.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── main sidebar ─────────────────────────────────────────────────────────────

export function InboxSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const { externalChannels, eventGroups, loading } = useInboxChannels();
  const { tasks: pendingTasks, loading: tasksLoading } = usePendingTasksSidebar();
  const { conversations: recentConvs, loading: convsLoading } = useRecentConversations(12);

  // Unread notifications count (poll every 60s)
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  useEffect(() => {
    getUnreadNotificationsCount().then(setUnreadNotifs).catch(() => {});
    const id = setInterval(() => {
      getUnreadNotificationsCount().then(setUnreadNotifs).catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Active channel detection from /messages/[channel]/[conv_id]
  const parts = pathname.split('/messages/')[1]?.split('/') ?? [];
  const activeChannel = parts[0] ?? '';
  const activeConvId = parts[1] ?? '';
  const isOnMessages = pathname.startsWith('/messages');
  const isOnNotifications = pathname.startsWith('/notifications');

  const handleSelect = (channelId: string) => {
    router.push(`/messages/${channelId}`);
  };

  const handleTaskClick = (item: PendingTaskItem) => {
    router.push(`/messages/ev-${item.eventId}-task/${item.tarea._id}`);
  };

  const handleConvClick = (conv: RecentConversation) => {
    router.push(`/messages/${conv.channelParam}/${conv.conversationId}`);
  };

  const isTaskChannel = /^ev-.+-task$/.test(activeChannel);
  const totalUnread = recentConvs.reduce((n, c) => n + c.unreadCount, 0);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col overflow-hidden bg-gray-50 border-r border-gray-200">
      {/* ── header ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">Bandeja</span>
          <button
            className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            onClick={() => router.push('/messages/whatsapp')}
            title="Añadir número de WhatsApp"
            type="button"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* summary pill */}
        {(pendingTasks.length > 0 || totalUnread > 0 || unreadNotifs > 0) && (
          <div className="mt-2 flex items-center gap-1.5 rounded-full bg-purple-600 px-3 py-1 text-[10px] font-medium text-white">
            <span>📅</span>
            <span>Hoy</span>
            {pendingTasks.length > 0 && (
              <span>· {pendingTasks.length} {pendingTasks.length === 1 ? 'tarea' : 'tareas'}</span>
            )}
            {totalUnread > 0 && (
              <span>· {totalUnread} mensaje{totalUnread !== 1 ? 's' : ''}</span>
            )}
            {unreadNotifs > 0 && (
              <span>· {unreadNotifs} notif</span>
            )}
          </div>
        )}
      </div>

      {/* ── body (scrollable) ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-2">

        {/* ── Tareas pendientes ── */}
        {!tasksLoading && pendingTasks.length > 0 && (
          <>
            <SectionLabel label="Tareas pendientes" />
            <div className="space-y-1 px-2">
              {pendingTasks.map((item) => (
                <TaskRow
                  isActive={isTaskChannel && activeConvId === item.tarea._id}
                  item={item}
                  key={item.tarea._id}
                  onClick={() => handleTaskClick(item)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Mensajes externos (WhatsApp / Instagram / etc.) ordenados por reciente ── */}
        {!convsLoading && recentConvs.length > 0 && (
          <>
            <SectionLabel label="WhatsApp / Redes" />
            {/* compact list — less spacing between rows */}
            <div className="space-y-0 px-2">
              {recentConvs.map((conv) => (
                <ConversationRow
                  conv={conv}
                  isActive={isOnMessages && activeChannel === conv.channelParam && activeConvId === conv.conversationId}
                  key={conv.conversationId}
                  onClick={() => handleConvClick(conv)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Mensajería (fallback si no hay convs aún — muestra canales conectados) ── */}
        {!convsLoading && recentConvs.length === 0 && (
          <>
            <SectionLabel label="Mensajería" />
            <div className="space-y-0.5 px-2">
              {loading ? (
                <div className="px-3 py-2 text-xs text-gray-400">Cargando...</div>
              ) : (
                externalChannels.map((ch) => (
                  <ChannelRow
                    channel={ch}
                    isActive={isOnMessages && ch.id === activeChannel}
                    key={ch.id}
                    onClick={() => handleSelect(ch.id)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* ── Notificaciones ── */}
        <div className="px-2 pt-3 pb-1">
          <button
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
              isOnNotifications
                ? 'bg-purple-100 text-purple-900'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
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

        {/* ── Mis eventos — cada evento tiene canales: itinerario, servicios, invitados, tareas ── */}
        {eventGroups.length > 0 && (
          <>
            <SectionLabel label="Eventos · Canales" />
            <div className="space-y-1 px-2">
              {eventGroups.map((group) => (
                <EventGroupSection
                  activeChannel={activeChannel}
                  group={group}
                  key={group.eventId}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── footer ─────────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 p-2">
        <button
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          onClick={() => router.push('/settings/integrations')}
          type="button"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Integraciones
        </button>
      </div>
    </aside>
  );
}
