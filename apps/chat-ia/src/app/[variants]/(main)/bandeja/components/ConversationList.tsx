'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { useBandejaBrand } from '../utils/brand';

import { useConversationActions } from '../hooks/useConversationActions';
import { ConversationStatus, useConversationMetaState } from '../hooks/useConversationMeta';
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
    // B-MSG-WA-02 QA #34 (29-jun): mensaje "Verificando sesión..." en
    // pantalla completa generaba flash blanco percibido como crash.
    // Skeleton de items mantiene la sensación de carga sin texto técnico.
    return (
      <div className="flex h-full flex-col gap-2 p-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex animate-pulse items-start gap-3 rounded-lg p-2">
            <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/2 rounded bg-gray-200" />
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>
          </div>
        ))}
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
type InboxView = 'all' | 'mine' | 'unassigned' | 'closed';

function ConversationListInner({ channel, selectedId }: ConversationListProps) {
  const { conversations, loading, error } = useConversations(channel);
  const { isArchived } = useConversationActions();
  const metaState = useConversationMetaState();
  const { checkAuth } = useAuthCheck();
  const { userId } = checkAuth();
  const searchParams = useSearchParams();
  const view = (searchParams.get('view') as InboxView) || 'all';
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const filtered = useMemo(() => {
    // Hide archived conversations
    let list = conversations.filter((c) => !isArchived(c.id));

    const getStatus = (id: string): ConversationStatus => metaState[id]?.status ?? 'open';
    const getAssigned = (id: string): string | null | undefined => metaState[id]?.assignedUserId;

    if (view === 'mine') {
      list = list.filter((c) => getAssigned(c.id) && userId && getAssigned(c.id) === userId && getStatus(c.id) !== 'closed');
    }
    if (view === 'unassigned') {
      list = list.filter((c) => !getAssigned(c.id) && getStatus(c.id) !== 'closed');
    }
    if (view === 'closed') {
      list = list.filter((c) => getStatus(c.id) === 'closed');
    }

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
  }, [conversations, isArchived, metaState, search, sortMode, userId, view]);

  const totalUnread = useMemo(
    () => conversations.reduce((n, c) => n + c.unreadCount, 0),
    [conversations],
  );

  if (loading) {
    // Rediseño A.2: skeleton simple 3 filas con tokens del sistema
    return (
      <div style={{ backgroundColor: '#FFFFFF' }} className="h-full">
        <div
          className="sticky top-0 z-10 px-4 py-3"
          style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EDEDF0' }}
        >
          <div className="h-4 w-32 rounded" style={{ backgroundColor: '#F2F1F6' }} />
          <div className="mt-1.5 h-3 w-24 rounded" style={{ backgroundColor: '#F2F1F6' }} />
          <div className="mt-2 h-8 w-full rounded-md" style={{ backgroundColor: '#F2F1F6' }} />
        </div>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="flex items-start gap-3 px-3 py-3"
            style={{ borderBottom: '1px solid #EDEDF0' }}
          >
            <div
              className="h-10 w-10 flex-shrink-0 rounded-full"
              style={{ backgroundColor: '#F2F1F6' }}
            />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-3/5 rounded" style={{ backgroundColor: '#F2F1F6' }} />
              <div className="h-3 w-4/5 rounded" style={{ backgroundColor: '#F2F1F6' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center max-w-xs">
          <p className="text-sm font-medium" style={{ color: '#1C1C22' }}>
            No pudimos cargar tus conversaciones
          </p>
          <p className="mt-1 text-xs" style={{ color: '#84848F' }}>
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <p className="text-sm font-medium" style={{ color: '#1C1C22' }}>
            Aún no hay conversaciones
          </p>
          <p className="mt-1 text-xs" style={{ color: '#84848F' }}>
            Cuando recibas mensajes aparecerán aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header rediseñado (Bloque A.2) — título "Comunicaciones" + subtítulo
          con contadores dinámicos + buscador con icono + botón sort discreto. */}
      <div
        className="sticky top-0 z-10 px-4 py-3"
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EDEDF0',
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-base font-semibold"
              style={{ color: '#1C1C22', letterSpacing: '-0.01em' }}
            >
              Comunicaciones
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: '#84848F' }}>
              {conversations.length}{' '}
              {conversations.length === 1 ? 'conversación' : 'conversaciones'}
              {totalUnread > 0 && (
                <>
                  <span style={{ color: '#EDEDF0', margin: '0 6px' }}>·</span>
                  <span style={{ color: brand.brand, fontWeight: 500 }}>
                    {totalUnread} sin leer
                  </span>
                </>
              )}
            </p>
          </div>
          {/* Sort toggle discreto */}
          <button
            className="flex-shrink-0 rounded-md px-2 py-1 text-[11px] transition-colors"
            onClick={() => setSortMode((m) => (m === 'recent' ? 'unread' : 'recent'))}
            style={{
              color: '#84848F',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2F1F6')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={
              sortMode === 'recent'
                ? 'Ordenar: no leídos primero'
                : 'Ordenar: recientes primero'
            }
            type="button"
          >
            {sortMode === 'recent' ? 'Recientes' : 'No leídos'}
          </button>
        </div>
        {/* Buscador con icono Search y tokens del sistema */}
        <div className="mt-2 relative">
          <svg
            aria-hidden
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            fill="none"
            height="14"
            stroke="#9A9AA6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            width="14"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="w-full rounded-md py-1.5 pr-3 text-sm focus:outline-none"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            style={{
              backgroundColor: '#F2F1F6',
              border: '1px solid transparent',
              color: '#1C1C22',
              paddingLeft: '2rem',
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = brand.brand;
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = '#F2F1F6';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            type="text"
            value={search}
          />
        </div>
      </div>

      {/* Conversations — divide-y con color sutil del sistema */}
      <div style={{ borderColor: '#EDEDF0' }}>
        {filtered.length === 0 && search.trim() ? (
          <div className="p-4 text-center text-sm" style={{ color: '#9A9AA6' }}>
            Sin resultados para &ldquo;{search}&rdquo;
          </div>
        ) : null}
        {filtered.map((conversation, idx) => (
          <div
            key={conversation.id}
            style={{
              borderTop: idx === 0 ? 'none' : '1px solid #EDEDF0',
            }}
          >
            <ConversationItem
              conversation={conversation}
              isSelected={conversation.id === selectedId}
            />
          </div>
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

  // BUG-08 QA #13 (25-jun): si el caller pasa selectedId, una conversación
  // está abierta — por tanto el canal SÍ está operativo aunque localStorage
  // no haya marcado connected. Mostrar la lista en lugar del setup (que
  // tapaba el panel izquierdo con el snippet HTML de setup).
  if (!connected && !selectedId) {
    const setupProps = { development, onConnected: handleConnected };
    const setupMap: Record<string, React.ReactNode> = {
      email: <EmailSetup {...setupProps} />,
      facebook: <FacebookSetup {...setupProps} />,
      instagram: <InstagramSetup {...setupProps} />,
      telegram: <TelegramSetup {...setupProps} />,
      web: <WebChatSetup {...setupProps} />,
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
  const brand = useBandejaBrand();
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="mb-3 text-5xl">💬</div>
      <h3 className="mb-1 text-base font-semibold text-gray-700">Sin conversaciones</h3>
      <p className="mb-5 text-center text-xs text-gray-400">
        Configura WhatsApp, Instagram, Email y otros canales en Integraciones para recibir mensajes
      </p>
      <Link
        className="flex w-full max-w-xs items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
        href="/settings/integrations"
        style={{ backgroundColor: brand.brandBg, borderColor: brand.brandBorder, color: brand.brand }}
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
  const brand = useBandejaBrand();
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
      onSelectChannel={setRedirectChannel}
      selectedId={selectedId}
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
