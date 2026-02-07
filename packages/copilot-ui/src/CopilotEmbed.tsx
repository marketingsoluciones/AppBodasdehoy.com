/**
 * CopilotEmbed - Chat integrado como componente (monorepo, sin iframe)
 *
 * Renderiza el chat del Copilot directamente en la app web usando la API
 * /api/copilot/chat. Mismo backend, misma ventana, sin iframe.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { CopilotChatProps } from './types';

export interface EmbedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface SendMessageParams {
  message: string;
  sessionId?: string;
  userId?: string;
  development?: string;
  eventId?: string;
  eventName?: string;
  pageContext?: {
    pageName?: string;
    eventId?: string;
    eventName?: string;
    eventsList?: Array<{ name?: string; type?: string; date?: string; id?: string }>;
  };
}

/** Evento enriquecido del stream (tool_result, progress, ui_action, etc.) */
export interface EmbedEnrichedEvent {
  type: string;
  data: any;
}

export type SendMessageFn = (
  params: SendMessageParams,
  onChunk?: (chunk: string) => void,
  signal?: AbortSignal,
  onEnrichedEvent?: (event: EmbedEnrichedEvent) => void
) => Promise<{ content: string }>;

export interface CopilotEmbedProps extends CopilotChatProps {
  /** Función que envía el mensaje al backend (ej: llama a /api/copilot/chat). La web app la inyecta. */
  sendMessage: SendMessageFn;
  /** Id de sesión para mantener contexto en el backend y cargar historial */
  sessionId?: string;
  /** Cargar historial al montar cuando hay sessionId (ej: getChatHistory). La web app la inyecta. */
  onLoadHistory?: (sessionId: string) => Promise<EmbedMessage[]>;
  /** Altura mínima del área de mensajes (ej: "300px") */
  minHeight?: string;
  /** Placeholder del input */
  inputPlaceholder?: string;
}

const generateId = () => `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function formatEnrichedEventLabel(ev: EmbedEnrichedEvent): string {
  const d = ev.data;
  if (ev.type === 'progress' && d?.step != null && d?.total != null) {
    return `Paso ${d.step}/${d.total}: ${d.label ?? ''}`.trim();
  }
  if (ev.type === 'tool_result' && d?.result) {
    return d.result.message ?? d.result.label ?? d.result.error ?? '';
  }
  if (ev.type === 'tool_start' && d?.tool) return `Ejecutando ${d.tool}…`;
  if (ev.type === 'event_card') return (d?.message ?? (d?.event?.name ? `Evento: ${d.event.name}` : '')) || ev.type;
  if (ev.type === 'usage') return (d?.tokens != null ? `Uso: ${d.tokens} tokens` : (d?.cost != null ? `Coste: ${d.cost}` : '')) || ev.type;
  return (d?.message ?? d?.label ?? (typeof d === 'string' ? d : '')) || ev.type;
}

const CopilotEmbed: React.FC<CopilotEmbedProps> = ({
  userId,
  development = 'bodasdehoy',
  eventId,
  eventName,
  userData,
  event,
  eventsList,
  className,
  sendMessage,
  sessionId,
  onLoadHistory,
  minHeight = '280px',
  inputPlaceholder = 'Escribe tu pregunta...',
}) => {
  const [messages, setMessages] = useState<EmbedMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEnrichedEvents, setCurrentEnrichedEvents] = useState<EmbedEnrichedEvent[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cargar historial al montar si hay sessionId y onLoadHistory
  useEffect(() => {
    if (!sessionId || !onLoadHistory || messages.length > 0) return;
    setLoadingHistory(true);
    onLoadHistory(sessionId)
      .then((list) => {
        if (list?.length) setMessages(list);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps -- solo al montar/cambiar sesión

  const pageContext = {
    pageName: typeof window !== 'undefined' ? (window.location.pathname.split('/').filter(Boolean).pop() || 'home') : 'home',
    eventId,
    eventName,
    eventsList: eventsList?.map((e: any) => ({
      id: e._id ?? e.id,
      name: e.nombre ?? e.name,
      type: e.tipo ?? e.type,
      date: e.fecha ?? e.date,
    })),
  };

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    const userMsg: EmbedMessage = { id: generateId(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    const assistantId = generateId();
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
    setCurrentEnrichedEvents([]);
    setLoading(true);

    abortRef.current = new AbortController();
    let fullContent = '';

    try {
      await sendMessage(
        {
          message: text,
          sessionId,
          userId: userId || userData?.email || userData?.uid,
          development,
          eventId,
          eventName,
          pageContext,
        },
        (chunk) => {
          fullContent += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: fullContent } : m))
          );
        },
        abortRef.current.signal,
        (event) => setCurrentEnrichedEvents((prev) => [...prev, event])
      );
      if (!fullContent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: 'No hubo respuesta. Intenta de nuevo.' } : m
          )
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar. Intenta de nuevo.';
      setError(msg);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: msg } : m))
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className || ''}`} role="region" aria-label="Chat del asistente">
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Mensajes del chat"
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ minHeight }}
      >
        {loadingHistory && (
          <div className="text-center text-gray-400 text-sm py-4">Cargando historial…</div>
        )}
        {!loadingHistory && messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            <p>Asistente de bodas y eventos.</p>
            <p className="mt-1">Pregunta por invitados, presupuesto, itinerario, mesas, etc.</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{m.content || '…'}</div>
            </div>
          </div>
        ))}
        {currentEnrichedEvents.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 space-y-1">
              {currentEnrichedEvents.map((ev, i) => {
                const label = formatEnrichedEventLabel(ev);
                const url = ev.data?.result?.url ?? ev.data?.result?.imageUrl;
                const actions = ev.type === 'event_card' && Array.isArray(ev.data?.actions) ? ev.data.actions : [];
                return (
                  <div key={i}>
                    <span className="font-medium text-gray-500">{ev.type}:</span>{' '}
                    {label}
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-pink-600 hover:underline"
                      >
                        Ver
                      </a>
                    )}
                    {actions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {actions.map((action: { url?: string; label?: string }, j: number) =>
                          action?.url ? (
                            <a
                              key={j}
                              href={action.url.startsWith('http') ? action.url : action.url.startsWith('/') ? action.url : `/${action.url}`}
                              className="inline-block rounded-lg bg-pink-500 text-white px-2 py-1 text-xs font-medium hover:bg-pink-600"
                            >
                              {action.label ?? 'Ver'}
                            </a>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="px-4 py-1 text-xs text-red-500 bg-red-50">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 flex gap-2" aria-label="Enviar mensaje al asistente">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={inputPlaceholder}
          aria-label="Escribe tu mensaje"
          className="flex-1 min-w-0 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
          disabled={loading}
        />
        {loading && (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            aria-label="Cancelar respuesta"
            className="rounded-xl border border-gray-300 text-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Enviar mensaje"
          className="rounded-xl bg-pink-500 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600"
        >
          {loading ? '…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
};

CopilotEmbed.displayName = 'CopilotEmbed';
export default CopilotEmbed;
