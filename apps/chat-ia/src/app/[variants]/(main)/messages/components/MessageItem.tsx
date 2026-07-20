'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Lock } from 'lucide-react';

import { sendFeedback, type FeedbackRating } from '@/services/feedback';

import { Message } from '../hooks/useMessages';

interface MessageItemProps {
  compact?: boolean;
  message: Message;
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
    case 'sent': {
      return '\u2713';
    }
    case 'delivered': {
      return '\u2713\u2713';
    }
    case 'read': {
      // Redise\u00f1o 18-jul: azul m\u00e1s sutil #3B82F6 (Tailwind blue-500 segu\u00eda ok).
      return <span style={{ color: '#3B82F6' }}>{'\u2713\u2713'}</span>;
    }
    default: {
      return null;
    }
  }
};

export function MessageItem({ message, compact }: MessageItemProps) {
  const isFromUser = message.fromUser;
  const [feedback, setFeedback] = useState<FeedbackRating | null>(null);

  if (message.kind === 'internal_note') {
    // Nota interna rediseñada — tokens amber más sutiles del sistema.
    return (
      <div className="flex justify-center">
        <div
          className={`max-w-[80%] rounded-xl px-4 ${compact ? 'py-1.5' : 'py-3'}`}
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#78350F',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" style={{ color: '#B45309' }} />
              <span className="text-xs font-semibold" style={{ color: '#92400E' }}>
                Nota interna
              </span>
              {message.author && (
                <span className="text-xs" style={{ color: '#B45309' }}>
                  {message.author}
                </span>
              )}
            </div>
            <span className="shrink-0 text-xs" style={{ color: '#B45309' }}>
              {formatTime(message.timestamp)}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">{message.text}</p>
        </div>
      </div>
    );
  }

  const handleFeedback = async (rating: FeedbackRating) => {
    if (feedback) return;
    setFeedback(rating);
    await sendFeedback({ messageId: message.id, rating });
  };

  // FASE B v2.0 — distinción visual por origen (Diseño 24-jun) — PRESERVADO
  // en el rediseño 18-jul (Opción A: no unificar colores para conservar la
  // señal cromática al vuelo):
  //   contact (fromUser=true)              → blanco, borde sutil, izq
  //   equipo humano (fromUser=false sin IA) → morado #7C3AED, der
  //   IA copilot aprobada                  → teal #2DD4BF + texto #0A2A28
  //   IA autopilot                         → gradiente teal→cyan #0D9488→#0891B2
  const isIa = !isFromUser && message.iaGenerated === true;
  const isIaAutopilot = isIa && message.iaMode === 'autopilot';

  const bubbleStyle: React.CSSProperties = isFromUser
    ? {
        // Rediseño: burbuja entrante blanca con borde sutil #EDEDF0 (antes solo
        // shadow-sm). Más minimalista tipo Claude/ChatGPT.
        backgroundColor: '#FFFFFF',
        border: '1px solid #EDEDF0',
        color: '#1C1C22',
      }
    : isIaAutopilot
      ? { background: 'linear-gradient(135deg, #0D9488, #0891B2)', color: '#fff' }
      : isIa
        ? { backgroundColor: '#2DD4BF', color: '#0A2A28' }
        : { backgroundColor: '#7C3AED', color: '#fff' };

  return (
    <div className={`flex ${isFromUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`group max-w-[70%] px-4 ${compact ? 'py-0.5' : 'py-2'} ${
          compact ? 'rounded-lg' : 'rounded-2xl'
        }`}
        style={bubbleStyle}
      >
        {/* Sello IA — solo cuando viene del modelo */}
        {isIa && (
          <div
            className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: isIaAutopilot ? '#CFFAFE' : '#0F766E' }}
          >
            <span aria-hidden>✦</span>
            <span>
              Enviado por IA{message.iaMode === 'autopilot' ? ' (Autopilot)' : ''}
              {message.iaModel ? ` · ${message.iaModel}` : ''}
            </span>
          </div>
        )}
        {/* Message Text */}
        <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>

        {/* Timestamp & Status */}
        <div
          className="mt-1 flex items-center justify-end gap-1 text-xs"
          style={{
            color: isFromUser
              ? '#9A9AA6' // contact — token secundario sistema
              : 'rgba(255,255,255,0.75)', // IA/humano equipo — blanco 75%
          }}
        >
          {/* SPRINT 3 iMessage (6-jul): pill (editado) si editedAt está */}
          {message.editedAt ? (
            <span
              data-testid="message-edited-pill"
              className={`italic ${isFromUser ? 'text-gray-400' : 'text-blue-200'}`}
              title={`Editado ${formatTime(message.editedAt)}`}
            >
              (editado)
            </span>
          ) : null}
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
