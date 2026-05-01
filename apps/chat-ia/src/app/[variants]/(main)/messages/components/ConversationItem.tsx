'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { Conversation } from '../hooks/useConversations';
import { useConversationActions } from '../hooks/useConversationActions';
import { ConversationStatus, useConversationMeta } from '../hooks/useConversationMeta';
import { ChannelBadge } from './ChannelBadge';

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
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-blue-600 italic">
      <span>Escribiendo</span>
      <span className="flex gap-px">
        <span className="h-1 w-1 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '0ms' }} />
        <span className="h-1 w-1 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '150ms' }} />
        <span className="h-1 w-1 animate-bounce rounded-full bg-blue-500" style={{ animationDelay: '300ms' }} />
      </span>
    </span>
  );
}

export function ConversationItem({
  conversation,
  isSelected,
}: ConversationItemProps) {
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

  // Simulate typing (randomly for demo — in production this comes from websocket)
  const isTyping = false; // Would come from real-time state

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
      `/messages/${encodeURIComponent(conversation.channel)}/${encodeURIComponent(conversation.id)}`,
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

  return (
    <>
      <button
        className={`w-full text-left transition-colors ${
          isSelected
            ? 'bg-blue-50 border-l-4 border-blue-600'
            : 'hover:bg-gray-50'
        }`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        type="button"
      >
        <div className="flex items-start gap-3 p-4">
          {/* Avatar with presence indicator */}
          <div className="relative flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
              {conversation.contact.name.charAt(0).toUpperCase()}
            </div>
            {/* Unread badge */}
            {conversation.unreadCount > 0 && (
              <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {conversation.unreadCount}
              </div>
            )}
            {/* Presence dot */}
            <span
              aria-label={isOnline ? 'En línea' : 'Desconectado'}
              className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                isOnline ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3
                  className={`truncate text-sm font-semibold ${
                    conversation.unreadCount > 0
                      ? 'text-gray-900'
                      : 'text-gray-700'
                  }`}
                >
                  {conversation.contact.name}
                </h3>
                <ChannelBadge channel={conversation.channel} size="sm" />
                <span
                  className={
                    status === 'open'
                      ? 'rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700'
                      : status === 'pending'
                        ? 'rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700'
                        : 'rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600'
                  }
                >
                  {status === 'open' ? 'Abierta' : status === 'pending' ? 'En espera' : 'Cerrada'}
                </span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {assignedToMe ? (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    Asignada
                  </span>
                ) : null}
                <span className="text-xs text-gray-500">
                  {formatTimestamp(conversation.lastMessage.timestamp)}
                </span>
              </div>
            </div>

            {/* Last Message or Typing */}
            {isTyping ? (
              <TypingIndicator />
            ) : (
              <div className="flex items-center gap-2">
                {!conversation.lastMessage.fromUser && (
                  <span className="text-xs text-blue-600">Tú:</span>
                )}
                <p
                  className={`truncate text-sm ${
                    conversation.unreadCount > 0
                      ? 'font-medium text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  {conversation.lastMessage.text}
                </p>
              </div>
            )}

            {/* Contact Info */}
            <div className="mt-1 text-xs text-gray-500">
              {conversation.contact.phone || conversation.contact.username || ''}
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
