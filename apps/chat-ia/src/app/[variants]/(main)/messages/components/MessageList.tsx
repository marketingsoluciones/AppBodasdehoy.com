'use client';

import { useEffect, useRef } from 'react';
import { useMessages } from '../hooks/useMessages';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  channel: string;
  conversationId: string;
}

export function MessageList({ channel, conversationId }: MessageListProps) {
  const { messages, loading, error } = useMessages(channel, conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-2 text-4xl">💭</div>
          <p className="text-sm text-gray-500">No hay mensajes aún</p>
          <p className="mt-1 text-xs text-gray-400">
            Envía el primer mensaje para empezar la conversación
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

