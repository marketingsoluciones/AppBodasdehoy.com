'use client';

import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';

interface MessageInputProps {
  channel: string;
  conversationId: string;
}

export function MessageInput({ channel, conversationId }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, sending } = useSendMessage();
  const { addMessage } = useMessages(channel, conversationId);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setText('');

    try {
      const result = await sendMessage(channel, conversationId, messageText);

      if (result.success && result.message) {
        addMessage(result.message);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      // Restaurar texto si falla
      setText(messageText);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2">
      {/* Attach button (opcional) */}
      <button
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl text-gray-600 transition-colors hover:bg-gray-100"
        title="Adjuntar archivo"
        type="button"
      >
        📎
      </button>

      {/* Textarea */}
      <textarea
        className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
        disabled={sending}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje..."
        ref={textareaRef}
        rows={1}
        value={text}
      />

      {/* Send button */}
      <button
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xl text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!text.trim() || sending}
        onClick={handleSend}
        title="Enviar mensaje"
        type="button"
      >
        {sending ? '⏳' : '📤'}
      </button>
    </div>
  );
}

