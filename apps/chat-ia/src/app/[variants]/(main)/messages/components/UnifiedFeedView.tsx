'use client';

import { useRouter } from 'next/navigation';

import type { FeedItem } from '../hooks/useUnifiedFeed';

// ─── Config ──────────────────────────────────────────────────────────────────

const FEED_CHANNEL_CONFIG: Record<string, { bg: string; icon: string; label: string }> = {
  email: { bg: 'bg-gray-500', icon: '📧', label: '@' },
  facebook: { bg: 'bg-blue-600', icon: '📘', label: 'FB' },
  instagram: { bg: 'bg-pink-500', icon: '📷', label: 'IG' },
  notification: { bg: 'bg-gray-300', icon: '🔔', label: '🔔' },
  telegram: { bg: 'bg-blue-400', icon: '✈️', label: 'TG' },
  web: { bg: 'bg-orange-500', icon: '🌐', label: 'Web' },
  whatsapp: { bg: 'bg-green-500', icon: '📱', label: 'W' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(timestamp: string): string {
  if (!timestamp) return '';
  const ts = new Date(timestamp).getTime();
  if (isNaN(ts)) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

// ─── FeedItemRow ─────────────────────────────────────────────────────────────

function FeedItemRow({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  const channelKey = item.channelKind as string;
  const cfg = FEED_CHANNEL_CONFIG[channelKey] ?? FEED_CHANNEL_CONFIG.web;
  const hasUnread = item.unreadCount > 0 || !item.isRead;

  let rowBg = 'bg-white hover:bg-gray-50';
  if (!item.isRead && item.kind === 'notification') rowBg = 'bg-pink-50/60 hover:bg-pink-50';
  else if (item.unreadCount > 0) rowBg = 'bg-green-50/50 hover:bg-green-50';

  const avatarBg =
    item.kind === 'notification' ? 'bg-gray-100' : 'bg-gray-200';

  return (
    <button
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${rowBg} border-b border-gray-100 last:border-0`}
      onClick={onClick}
      type="button"
    >
      {/* Avatar with channel badge */}
      <div className="relative shrink-0">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${avatarBg} text-sm font-medium text-gray-600`}
        >
          {item.kind === 'notification' ? (
            <span className="text-base">{cfg.icon}</span>
          ) : (
            <span>{initials(item.name)}</span>
          )}
        </div>
        {/* Channel badge */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white ${cfg.bg}`}
        >
          {item.channelLabel ?? cfg.label}
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-sm ${hasUnread ? 'font-semibold text-gray-900' : 'font-normal text-gray-700'}`}
          >
            {item.name}
          </span>
          <span className="shrink-0 text-xs text-gray-400">{timeAgo(item.timestamp)}</span>
        </div>
        <p className="truncate text-xs text-gray-500">{item.preview}</p>
      </div>

      {/* Unread indicator */}
      {hasUnread && (
        <div className="shrink-0">
          {item.kind === 'notification' ? (
            <span className="block h-2 w-2 rounded-full bg-pink-500" />
          ) : (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-white">
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="flex items-center gap-3 px-4 py-3" key={i}>
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface UnifiedFeedViewProps {
  items: FeedItem[];
  loading: boolean;
  onItemClick: (item: FeedItem) => void;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function UnifiedFeedView({ items, loading, onItemClick }: UnifiedFeedViewProps) {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-800">Todos los mensajes</h2>
        {!loading && items.length > 0 && (
          <span className="text-xs text-gray-400">{items.length} conversaciones</span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <FeedSkeleton />
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="text-5xl">💬</span>
            <div>
              <p className="font-medium text-gray-700">No hay mensajes aún</p>
              <p className="mt-1 text-sm text-gray-400">
                Conecta un canal para recibir mensajes aquí
              </p>
            </div>
            <button
              className="mt-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
              onClick={() => router.push('/messages/whatsapp')}
              type="button"
            >
              Conectar canal
            </button>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <FeedItemRow key={item.id} item={item} onClick={() => onItemClick(item)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
