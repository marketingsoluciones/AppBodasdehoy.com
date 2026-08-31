'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useTypingInConv } from '@/store/bandeja/selectors';
import { Conversation } from '../hooks/useConversations';
import { useBandejaBrand } from '../utils/brand';
import { useConversationActions } from '../hooks/useConversationActions';
import { ConversationStatus, useConversationMeta } from '../hooks/useConversationMeta';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected?: boolean;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
};

function TypingIndicator() {
  const brand = useBandejaBrand();
  return (
    <span className="inline-flex items-center gap-0.5 text-xs italic" style={{ color: brand.brand }}>
      <span>Escribiendo</span>
      <span className="flex gap-px">
        <span className="h-1 w-1 animate-bounce rounded-full" style={{ animationDelay: '0ms', backgroundColor: brand.brand }} />
        <span className="h-1 w-1 animate-bounce rounded-full" style={{ animationDelay: '150ms', backgroundColor: brand.brand }} />
        <span className="h-1 w-1 animate-bounce rounded-full" style={{ animationDelay: '300ms', backgroundColor: brand.brand }} />
      </span>
    </span>
  );
}

// Colores canal (rediseño 18-jul). Solo puntos indicadores, no fondos.
const CHANNEL_DOT: Record<string, string> = {
  whatsapp: '#25D366',
  instagram: '#E1306C',
  facebook: '#1877F2',
  telegram: '#2AABEE',
  web: '#6B4EFF',
  email: '#84848F',
  sms: '#84848F',
};

// Nombre legible del canal para el chip de la fila (antes solo había un punto de 12px,
// indistinguible de un vistazo — sobre todo WhatsApp vs el punto verde de "en línea").
const CHANNEL_NAME: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  telegram: 'Telegram',
  web: 'Web',
  email: 'Email',
  sms: 'SMS',
};

export function ConversationItem({
  conversation,
  isSelected,
}: ConversationItemProps) {
  const brand = useBandejaBrand();
  const router = useRouter();
  const { checkAuth } = useAuthCheck();
  const { userId } = checkAuth();
  const { meta } = useConversationMeta(conversation.id);
  const status: ConversationStatus = meta.status ?? 'open';
  const assignedToMe = !!(userId && meta.assignedUserId && meta.assignedUserId === userId);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isMuted, toggleArchive, toggleMute, deleteConversation } = useConversationActions();

  // Simulate presence based on recent activity
  const lastMsgTime = new Date(conversation.lastMessage.timestamp).getTime();
  const minutesAgo = (Date.now() - lastMsgTime) / 60_000;
  const isOnline = minutesAgo < 5;

  // SPRINT 2 iMessage (30-jun): cablear typing real desde el store bandeja.
  // Backend api-ia YA emite `typing` en SSE; el store lo reduce en
  // typingByConv[convId] con expiresAt. Filtramos por currentUserId para
  // NO mostrar "escribiendo…" cuando SOMOS nosotros los que escribimos.
  const typers = useTypingInConv(conversation.id);
  const isTyping = typers.some((t) => !userId || t.userId !== userId);

  // Close context menu on outside click, scroll, or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  const handleClick = () => {
    router.push(
      `/bandeja/${encodeURIComponent(conversation.channel)}/${encodeURIComponent(conversation.id)}`,
    );
  };

  const handleContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const conversationMuted = isMuted(conversation.id);

  const handleMenuAction = (action: string) => {
    setContextMenu(null);
    switch (action) {
      case 'archive': {
        toggleArchive(conversation.id);
        break;
      }
      case 'mute': {
        toggleMute(conversation.id);
        break;
      }
      case 'delete': {
        deleteConversation(conversation.id);
        break;
      }
    }
  };

  const channelDot = CHANNEL_DOT[conversation.channel] ?? '#84848F';
  // Señal ✦: si esta conversación tiene IA activa (copilot o autopilot).
  // Preservamos la señal cromática de los mensajes (teal/cyan/morado) — este ✦
  // es solo un marcador de "hay IA operando aquí" en la lista. Cast defensivo:
  // el hook useConversations no tipa `iaLevel`, pero el store bandeja sí lo
  // propaga en algunos endpoints — si no viene, hasIa cae a false.
  const iaLevel = (conversation as unknown as { iaLevel?: string }).iaLevel;
  const hasIa = iaLevel === 'copilot' || iaLevel === 'autopilot';

  return (
    <>
      <button
        className="w-full text-left transition-colors"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{
          backgroundColor: isSelected ? '#F2F1F6' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = '#FCFCFD';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
        }}
        type="button"
      >
        {/* Fase 2 hifi: padding 10px 12px (spec Bandeja - Prototipo). */}
        <div className="flex items-start gap-3 px-3 py-2.5">
          {/* Avatar 40x40 con punto de canal 12px bottom-right */}
          <div className="relative flex-shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold"
              style={{
                backgroundColor: '#F2F1F6',
                color: '#1C1C22',
              }}
            >
              {conversation.contact.name.charAt(0).toUpperCase()}
            </div>
            {/* Punto de canal (rediseño 18-jul) */}
            <span
              aria-label={`Canal ${conversation.channel}`}
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
              style={{
                backgroundColor: channelDot,
                boxShadow: '0 0 0 2px #FFFFFF',
              }}
            />
            {/* Presence dot: si hay presencia, encima del canal en top-right */}
            {isOnline && (
              <span
                aria-label="En línea"
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: '#22C55E',
                  boxShadow: '0 0 0 2px #FFFFFF',
                }}
              />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Header: nombre + hora */}
            <div className="mb-0.5 flex items-baseline justify-between gap-2">
              {/* Fase 2 hifi: nombre 13px/700 #262131, timestamp 10px #A8A3B5 (spec). */}
              <h3 className="truncate text-[13px] font-bold" style={{ color: '#262131' }}>
                {conversation.contact.name}
              </h3>
              <span className="flex-shrink-0 text-[10px]" style={{ color: '#A8A3B5' }}>
                {formatTimestamp(conversation.lastMessage.timestamp)}
              </span>
            </div>

            {/* Preview mensaje / Typing + contador no leídos */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                {isTyping ? (
                  <TypingIndicator />
                ) : (
                  <p
                    className="truncate text-[11.5px]"
                    style={{
                      color: conversation.unreadCount > 0 ? '#1C1C22' : '#8B8698',
                      fontWeight: conversation.unreadCount > 0 ? 500 : 400,
                    }}
                  >
                    {hasIa && (
                      <span
                        aria-hidden
                        style={{ color: brand.brand, marginRight: 4 }}
                      >
                        ✦
                      </span>
                    )}
                    {!conversation.lastMessage.fromUser && (
                      <span style={{ color: '#9A9AA6' }}>Tú: </span>
                    )}
                    {conversation.lastMessage.text}
                  </p>
                )}
              </div>
              {/* Contador no leídos: pill morado #6B4EFF */}
              {conversation.unreadCount > 0 && (
                <span
                  aria-label={`${conversation.unreadCount} sin leer`}
                  className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ backgroundColor: '#6B4EFF', minWidth: 20 }}
                >
                  {conversation.unreadCount}
                </span>
              )}
            </div>

            {/* Fila 3: chips secundarios (canal + status + asignada + phone) */}
            <div className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: '#9A9AA6' }}>
              {/* Chip de canal con color + nombre → distinguir WhatsApp de otros de un vistazo. */}
              <span
                className="inline-flex flex-none items-center gap-1 rounded-full px-1.5 py-0.5 font-medium"
                style={{ backgroundColor: `${channelDot}1A`, color: channelDot }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: channelDot }}
                />
                {CHANNEL_NAME[conversation.channel] ?? conversation.channel}
              </span>
              {status === 'pending' && (
                <span
                  className="rounded-full px-1.5 py-0.5 font-medium"
                  style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                >
                  En espera
                </span>
              )}
              {status === 'closed' && (
                <span
                  className="rounded-full px-1.5 py-0.5 font-medium"
                  style={{ backgroundColor: '#F2F1F6', color: '#84848F' }}
                >
                  Cerrada
                </span>
              )}
              {assignedToMe && (
                <span
                  className="rounded-full px-1.5 py-0.5 font-medium"
                  style={{ backgroundColor: '#EDE9FE', color: '#6B4EFF' }}
                >
                  Asignada a ti
                </span>
              )}
              {(conversation.contact.phone || conversation.contact.username) && (
                <span className="truncate">
                  {conversation.contact.phone || conversation.contact.username}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
          ref={menuRef}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            aria-label="Archivar conversación"
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => handleMenuAction('archive')}
            type="button"
          >
            📦 Archivar
          </button>
          <button
            aria-label={conversationMuted ? 'Activar sonido' : 'Silenciar conversación'}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => handleMenuAction('mute')}
            type="button"
          >
            {conversationMuted ? '🔔 Activar sonido' : '🔇 Silenciar'}
          </button>
          <div className="my-1 h-px bg-gray-100" />
          <button
            aria-label="Eliminar conversación"
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => handleMenuAction('delete')}
            type="button"
          >
            🗑️ Eliminar
          </button>
        </div>
      )}
    </>
  );
}
