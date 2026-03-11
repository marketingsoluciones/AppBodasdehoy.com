'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { useConversationActions } from '../hooks/useConversationActions';
import { useConversations } from '../hooks/useConversations';
import { useWhatsAppSession } from '../hooks/useWhatsAppSession';
import { ConversationItem } from './ConversationItem';
import { EmailSetup } from './EmailSetup';
import { FacebookSetup } from './FacebookSetup';
import { InstagramSetup } from './InstagramSetup';
import { TelegramSetup } from './TelegramSetup';
import { WebChatSetup } from './WebChatSetup';
import { WhatsAppSetup } from './WhatsAppSetup';

interface ConversationListProps {
  channel: string | null;
  selectedId?: string;
}

function WhatsAppConversationList({ development, selectedId }: { development: string; selectedId?: string }) {
  const { loading: sessionLoading, status } = useWhatsAppSession(development);

  if (sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-3xl">⏳</div>
          <p className="text-sm text-gray-500">Verificando sesión de WhatsApp...</p>
        </div>
      </div>
    );
  }

  if (status !== 'connected') {
    return <WhatsAppSetup development={development} />;
  }

  // Connected — show real conversation list
  return <ConversationListInner channel="whatsapp" selectedId={selectedId} />;
}

type SortMode = 'recent' | 'unread';

function ConversationListInner({ channel, selectedId }: ConversationListProps) {
  const { conversations, loading, error } = useConversations(channel);
  const { isArchived } = useConversationActions();
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const filtered = useMemo(() => {
    // Hide archived conversations
    let list = conversations.filter((c) => !isArchived(c.id));

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contact.name.toLowerCase().includes(q) ||
          c.lastMessage.text.toLowerCase().includes(q),
      );
    }

    // Sort
    if (sortMode === 'unread') {
      list = [...list].sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
      });
    }

    return list;
  }, [conversations, search, sortMode, isArchived]);

  const totalUnread = useMemo(
    () => conversations.reduce((n, c) => n + c.unreadCount, 0),
    [conversations],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-3xl">⏳</div>
          <p className="text-sm text-gray-500">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-2 text-3xl">❌</div>
          <p className="text-sm text-red-600">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-2 text-4xl">📭</div>
          <p className="text-sm text-gray-500">No hay conversaciones</p>
          <p className="text-xs text-gray-400 mt-1">
            Tus conversaciones aparecerán aquí cuando recibas mensajes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              {conversations.length}
            </span>
            {totalUnread > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {totalUnread} sin leer
              </span>
            )}
          </div>
          {/* Sort toggle */}
          <button
            className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setSortMode((m) => (m === 'recent' ? 'unread' : 'recent'))}
            title={sortMode === 'recent' ? 'Ordenar: no leídos primero' : 'Ordenar: recientes primero'}
            type="button"
          >
            {sortMode === 'recent' ? '🕐 Recientes' : '🔴 No leídos'}
          </button>
        </div>
        <div className="mt-2">
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            type="text"
            value={search}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="divide-y divide-gray-200">
        {filtered.length === 0 && search.trim() ? (
          <div className="p-4 text-center text-sm text-gray-400">
            Sin resultados para &ldquo;{search}&rdquo;
          </div>
        ) : null}
        {filtered.map((conversation) => (
          <ConversationItem
            conversation={conversation}
            isSelected={conversation.id === selectedId}
            key={conversation.id}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Generic wrapper for non-WhatsApp channels.
 * Shows the setup component when no connection exists (placeholder channels),
 * and ConversationListInner once connected.
 *
 * Since backend integrations for these channels are pending, we use
 * localStorage to persist connection state set by each Setup component.
 */
function ChannelConversationList({
  channel,
  development,
  selectedId,
}: {
  channel: string;
  development: string;
  selectedId?: string;
}) {
  const [connected, setConnected] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`channel_connected_${channel}_${development}`) === 'true';
  });

  const handleConnected = () => {
    localStorage.setItem(`channel_connected_${channel}_${development}`, 'true');
    setConnected(true);
  };

  if (!connected) {
    const setupProps = { development, onConnected: handleConnected };
    const setupMap: Record<string, React.ReactNode> = {
      instagram: <InstagramSetup {...setupProps} />,
      telegram: <TelegramSetup {...setupProps} />,
      email: <EmailSetup {...setupProps} />,
      web: <WebChatSetup {...setupProps} />,
      facebook: <FacebookSetup {...setupProps} />,
    };

    return (
      <div className="h-full overflow-auto">
        {setupMap[channel] ?? (
          <div className="flex h-full items-center justify-center p-4">
            <p className="text-sm text-gray-500">Canal no soportado: {channel}</p>
          </div>
        )}
      </div>
    );
  }

  return <ConversationListInner channel={channel} selectedId={selectedId} />;
}

const SETUP_CHANNELS = new Set(['instagram', 'telegram', 'email', 'web', 'facebook']);

/** Empty state sin duplicar la lista de canales: redirige a Integraciones */
function EmptyStateWithChannels(_props: { onSelectChannel: (ch: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="mb-3 text-5xl">💬</div>
      <h3 className="mb-1 text-base font-semibold text-gray-700">Sin conversaciones</h3>
      <p className="mb-5 text-center text-xs text-gray-400">
        Configura WhatsApp, Instagram, Email y otros canales en Integraciones para recibir mensajes
      </p>
      <Link
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-100"
        href="/settings/integrations"
      >
        Ir a Integraciones →
      </Link>
      <p className="mt-3 text-center text-[11px] text-gray-400">
        O elige un canal en el menú de la izquierda
      </p>
    </div>
  );
}

export function ConversationList({ channel, selectedId }: ConversationListProps) {
  const { checkAuth } = useAuthCheck();
  const { development } = checkAuth();
  const dev = development || 'bodasdehoy';
  const [redirectChannel, setRedirectChannel] = useState<string | null>(null);

  const activeChannel = redirectChannel || channel;

  // wa-[channelId] channels from InboxSidebar → WhatsApp session check
  if (activeChannel === 'whatsapp' || activeChannel?.startsWith('wa-')) {
    return <WhatsAppConversationList development={dev} selectedId={selectedId} />;
  }

  // Social / messaging channels with setup flow
  if (activeChannel && SETUP_CHANNELS.has(activeChannel)) {
    return <ChannelConversationList channel={activeChannel} development={dev} selectedId={selectedId} />;
  }

  // No channel selected — show all conversations or empty state with channel options
  return (
    <ConversationListWithFallback
      channel={channel}
      selectedId={selectedId}
      onSelectChannel={setRedirectChannel}
    />
  );
}

function ConversationListWithFallback({
  channel,
  selectedId,
  onSelectChannel,
}: ConversationListProps & { onSelectChannel: (ch: string) => void }) {
  const { conversations, loading, error } = useConversations(channel);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-3xl">⏳</div>
          <p className="text-sm text-gray-500">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0 && !error) {
    return <EmptyStateWithChannels onSelectChannel={onSelectChannel} />;
  }

  return <ConversationListInner channel={channel} selectedId={selectedId} />;
}
