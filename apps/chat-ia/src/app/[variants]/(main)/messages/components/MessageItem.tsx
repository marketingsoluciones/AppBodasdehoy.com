'use client';

import Image from 'next/image';
import { useState } from 'react';

import { sendFeedback, type FeedbackRating } from '@/services/feedback';

import { Message } from '../hooks/useMessages';

interface MessageItemProps {
  message: Message;
  compact?: boolean;
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'sent':
      return '\u2713';
    case 'delivered':
      return '\u2713\u2713';
    case 'read':
      return <span className="text-blue-500">{'\u2713\u2713'}</span>;
    default:
      return null;
  }
};

export function MessageItem({ message, compact }: MessageItemProps) {
  const isFromUser = message.fromUser;
  const [feedback, setFeedback] = useState<FeedbackRating | null>(null);

  const handleFeedback = async (rating: FeedbackRating) => {
    if (feedback) return;
    setFeedback(rating);
    await sendFeedback({ messageId: message.id, rating });
  };

  return (
    <div className={`flex ${isFromUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`group max-w-[70%] px-4 ${compact ? 'py-0.5' : 'py-2'} ${
          isFromUser
            ? `bg-white shadow-sm ${compact ? 'rounded-lg' : 'rounded-2xl'}`
            : `bg-blue-600 text-white shadow-md ${compact ? 'rounded-lg' : 'rounded-2xl'}`
        }`}
      >
        {/* Message Text */}
        <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>

        {/* Timestamp & Status */}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-xs ${
            isFromUser ? 'text-gray-500' : 'text-blue-100'
          }`}
        >
          <span>{formatTime(message.timestamp)}</span>
          {!isFromUser && message.status && (
            <span className="ml-1">{getStatusIcon(message.status)}</span>
          )}
        </div>

        {/* Feedback — only on inbound (bot/contact) messages */}
        {isFromUser && (
          <div className={`mt-1 flex gap-1 ${feedback ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <button
              className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
                feedback === 'positive'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-green-600'
              }`}
              disabled={!!feedback}
              onClick={() => handleFeedback('positive')}
              title="Buena respuesta"
              type="button"
            >
              👍
            </button>
            <button
              className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
                feedback === 'negative'
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-red-600'
              }`}
              disabled={!!feedback}
              onClick={() => handleFeedback('negative')}
              title="Mala respuesta"
              type="button"
            >
              👎
            </button>
          </div>
        )}

        {/* Attachments (if any) */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.url}>
                {attachment.type === 'image' ? (
                  <Image
                    alt="Adjunto"
                    className="h-auto max-w-full rounded-lg"
                    height={400}
                    sizes="(max-width: 768px) 80vw, 400px"
                    src={attachment.url}
                    width={400}
                  />
                ) : (
                  <a
                    className={`flex items-center gap-2 rounded-lg p-2 ${
                      isFromUser ? 'bg-gray-100' : 'bg-blue-700'
                    }`}
                    href={attachment.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="text-lg">📎</span>
                    <span className="text-sm">{attachment.filename}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
