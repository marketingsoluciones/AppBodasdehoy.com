'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMessages, type Message } from '../hooks/useMessages';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  channel: string;
  conversationId: string;
  searchFilter?: string;
}

function formatDateDivider(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86_400_000);

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) {
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
  }
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDateKey(timestamp: string): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

type MessageGroup =
  | { type: 'divider'; label: string; key: string }
  | { type: 'message'; message: Message; isFirstInGroup: boolean; isLastInGroup: boolean };

function groupMessages(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let lastDateKey = '';

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const dateKey = getDateKey(msg.timestamp);

    if (dateKey !== lastDateKey) {
      groups.push({ type: 'divider', label: formatDateDivider(msg.timestamp), key: `div-${dateKey}` });
      lastDateKey = dateKey;
    }

    const prevMsg = i > 0 ? messages[i - 1] : null;
    const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;

    const sameAsPrev = !!(prevMsg && prevMsg.fromUser === msg.fromUser && getDateKey(prevMsg.timestamp) === dateKey);
    const sameAsNext = !!(nextMsg && nextMsg.fromUser === msg.fromUser && getDateKey(nextMsg.timestamp) === dateKey);

    groups.push({
      type: 'message',
      message: msg,
      isFirstInGroup: !sameAsPrev,
      isLastInGroup: !sameAsNext,
    });
  }

  return groups;
}

export function MessageList({ channel, conversationId, searchFilter }: MessageListProps) {
  const { messages, loading, error } = useMessages(channel, conversationId);

  // Filter messages by search term
  const filteredMessages = useMemo(() => {
    if (!searchFilter?.trim()) return messages;
    const q = searchFilter.toLowerCase();
    return messages.filter((m) => m.text.toLowerCase().includes(q));
  }, [messages, searchFilter]);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const prevMessageCount = useRef(0);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }, []);

  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom();
    setShowJumpButton(!nearBottom);
    if (nearBottom) setNewMessageCount(0);
  }, [isNearBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (isInitialLoad.current || isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoad.current ? 'auto' : 'smooth' });
      isInitialLoad.current = false;
      setNewMessageCount(0);
    } else if (messages.length > prevMessageCount.current) {
      setNewMessageCount((c) => c + (messages.length - prevMessageCount.current));
    }
    prevMessageCount.current = messages.length;
  }, [messages, isNearBottom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessageCount(0);
    setShowJumpButton(false);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-3xl">⏳</div>
          <p className="text-sm text-gray-500">Cargando mensajes...</p>
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

  if (filteredMessages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-2 text-4xl">{searchFilter ? '🔍' : '💭'}</div>
          <p className="text-sm text-gray-500">
            {searchFilter ? `Sin resultados para "${searchFilter}"` : 'No hay mensajes aún'}
          </p>
          {!searchFilter && (
            <p className="mt-1 text-xs text-gray-400">
              Envía el primer mensaje para empezar la conversación
            </p>
          )}
        </div>
      </div>
    );
  }

  const grouped = groupMessages(filteredMessages);

  return (
    <div className="relative h-full">
      <div className="h-full overflow-auto bg-gray-50 p-4" ref={containerRef}>
        <div className="space-y-1">
          {grouped.map((item) => {
            if (item.type === 'divider') {
              return (
                <div key={item.key} className="flex items-center gap-3 py-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm">
                    {item.label}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              );
            }
            return (
              <div
                key={item.message.id}
                className={item.isFirstInGroup ? 'mt-3' : 'mt-0.5'}
              >
                <MessageItem
                  message={item.message}
                  compact={!item.isFirstInGroup}
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showJumpButton && (
        <button
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-700"
          onClick={scrollToBottom}
          type="button"
        >
          {newMessageCount > 0 ? (
            <>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
                {newMessageCount}
              </span>
              <span>Nuevos mensajes</span>
            </>
          ) : (
            <>
              <span>↓</span>
              <span>Ir al final</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
