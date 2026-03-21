/**
 * CopilotEmbed - Chat integrado nativo (sin iframe) usando @bodasdehoy/copilot-shared
 *
 * Conecta con api-ia vía SSE (copilotChat.ts).
 * Soporta:
 *  - Streaming de respuestas
 *  - Eventos enriquecidos: ui_action, progress, tool_result, reasoning, tool_start
 *  - Acciones por mensaje: Copiar, Regenerar (último assistant)
 *  - Display de razonamiento colapsable
 *  - Indicador de herramienta en ejecución
 *  - Empty state con preguntas sugeridas
 *  - Botón Enviar + hint de teclado
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '../../hooks/useToast';
import { MessageList, InputEditor } from '@bodasdehoy/copilot-shared';
import type { MessageItem } from '@bodasdehoy/copilot-shared';
import {
  sendChatMessage,
  getChatHistory,
  generateMessageId,
  type SendMessageParams,
  type PageContext,
  type EnrichedEvent,
  type UIActionEvent,
  type ProgressEvent,
  type ToolResultEvent,
} from '../../services/copilotChat';
import { EventsGroupContextProvider } from '../../context';

/** Mapeo de path → entity para filtros del Copilot */
const PATH_TO_ENTITY: Record<string, string> = {
  '/invitados': 'guests',
  '/mesas': 'tables',
  '/presupuesto': 'budget_items',
  '/itinerario': 'moments',
  '/servicios': 'services',
};

/** Mapeo inverso: entity → path para auto-navegación */
const ENTITY_TO_PATH: Record<string, string> = {
  guests: '/invitados',
  tables: '/mesas',
  budget_items: '/presupuesto',
  moments: '/itinerario',
  services: '/servicios',
};

/** Preguntas sugeridas según sección actual */
const SUGGESTED_QUESTIONS = [
  '¿Cuántos invitados confirmados tengo?',
  '¿Cómo va el presupuesto?',
  'Muéstrame las tareas pendientes',
  '¿Qué servicios tengo contratados?',
  'Organiza las mesas por afinidad',
];

export interface CopilotEmbedProps {
  userId: string;
  sessionId: string;
  development: string;
  eventId?: string;
  eventName?: string;
  pageContext?: PageContext;
  className?: string;
  isGuest?: boolean;
  loginPath?: string;
  /** Callback que se llama con el texto del primer mensaje del usuario (para actualizar label de sesión) */
  onFirstMessage?: (firstMsg: string) => void;
}

// ── Pequeños componentes de acciones ────────────────────────────────────────

const ActionBtn = ({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      background: 'none',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      padding: '2px 8px',
      fontSize: 11,
      color: '#6b7280',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
  >
    {children}
  </button>
);

// ── Sección de razonamiento colapsable ──────────────────────────────────────

const ReasoningSection = ({ text, isStreaming }: { text: string; isStreaming: boolean }) => {
  const [open, setOpen] = useState(isStreaming); // abierto mientras llega, cerrado al terminar

  useEffect(() => {
    if (!isStreaming) setOpen(false); // colapsar al terminar
  }, [isStreaming]);

  return (
    <div
      style={{
        margin: '4px 0 8px',
        border: '1px solid #e0e7ff',
        borderRadius: 8,
        overflow: 'hidden',
        fontSize: 12,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: '#eef2ff',
          border: 'none',
          cursor: 'pointer',
          color: '#4338ca',
          fontWeight: 500,
          fontSize: 11,
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13 }}>{isStreaming ? '🧠' : '💡'}</span>
        {isStreaming ? 'Razonando…' : 'Ver razonamiento'}
        <span style={{ marginLeft: 'auto', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          style={{
            padding: '8px 10px',
            background: '#f5f3ff',
            color: '#4b5563',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {text || '…'}
        </div>
      )}
    </div>
  );
};

// ── Indicador "ejecutando herramienta" ──────────────────────────────────────

const ToolRunning = ({ tool }: { tool: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 12px',
      background: '#fffbeb',
      borderTop: '1px solid #fde68a',
      fontSize: 12,
      color: '#92400e',
      flexShrink: 0,
    }}
  >
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#f59e0b',
        animation: 'pulse 1s infinite',
      }}
    />
    Ejecutando <strong>{tool}</strong>…
  </div>
);

// ── Componente principal ─────────────────────────────────────────────────────

export const CopilotEmbed = ({
  userId,
  sessionId,
  development,
  eventId,
  eventName,
  pageContext,
  className,
  isGuest,
  loginPath,
  onFirstMessage,
}: CopilotEmbedProps) => {
  const router = useRouter();
  const toast = useToast();
  const { setCopilotFilter, clearCopilotFilter, refreshEventsGroup } = EventsGroupContextProvider();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const firstMessageSentRef = useRef(false);

  const [retryContent, setRetryContent] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [showRecoverBanner, setShowRecoverBanner] = useState(false);

  // Razonamiento en curso (texto acumulado + si está streaming)
  const [reasoningText, setReasoningText] = useState('');
  const [isReasoning, setIsReasoning] = useState(false);

  // Herramienta corriendo actualmente
  const [runningTool, setRunningTool] = useState<string | null>(null);

  // Reset al cambiar de sesión
  useEffect(() => {
    setMessages([]);
    setInput('');
    setLoading(false);
    setRetryContent(null);
    setIsRateLimited(false);
    setProgress(null);
    setShowRecoverBanner(false);
    setReasoningText('');
    setIsReasoning(false);
    setRunningTool(null);
    firstMessageSentRef.current = false;
  }, [sessionId]);

  // Cargar historial al montar / cambiar sesión
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingHistory(true);
        const history = await getChatHistory(sessionId, development);
        const formatted: MessageItem[] = history.map(msg => ({
          id: msg.id,
          role: msg.role,
          message: msg.content,
          avatar:
            msg.role === 'user'
              ? { title: 'Tú' }
              : { title: 'Copilot', backgroundColor: '#FF1493' },
          createdAt: msg.createdAt,
          loading: false,
          error: msg.error ? { message: msg.error } : undefined,
        }));
        setMessages(formatted);
        if (formatted.length > 0) {
          setShowRecoverBanner(true);
          firstMessageSentRef.current = true; // ya hay historial
        }
      } catch (e) {
        console.error('[CopilotEmbed] history error:', e);
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, [sessionId, development]);

  // Handle enriched events del SSE
  const handleEnrichedEvent = useCallback(
    (event: EnrichedEvent) => {
      switch (event.type) {
        case 'reasoning': {
          const chunk = typeof event.data === 'string' ? event.data : event.data?.text || '';
          setIsReasoning(true);
          setReasoningText(prev => prev + chunk);
          break;
        }
        case 'tool_start': {
          const tool = event.data?.tool || event.data || 'herramienta';
          setRunningTool(String(tool));
          break;
        }
        case 'tool_result': {
          setRunningTool(null);
          const toolResult = event.data as ToolResultEvent;
          if (toolResult.result?.type === 'download' && toolResult.result.url) {
            toast('success', `Archivo listo: ${toolResult.result.filename || 'descarga'}`);
          } else if (toolResult.result?.type === 'error' && toolResult.result.error) {
            toast('error', toolResult.result.error);
          }
          break;
        }
        case 'ui_action': {
          const action = event.data as UIActionEvent & {
            entity?: string;
            ids?: string[];
            query?: string;
          };
          if (action.type === 'navigate' && action.path) {
            let pathname = action.path;
            let searchIds: string[] | undefined;
            let searchQuery: string | undefined;
            try {
              const url = new URL(action.path, 'http://localhost');
              pathname = url.pathname;
              const idsParam = url.searchParams.get('ids');
              if (idsParam) searchIds = idsParam.split(',').filter(Boolean);
              searchQuery = url.searchParams.get('query') || undefined;
            } catch { /* path sin query params */ }

            const entity = action.entity || PATH_TO_ENTITY[pathname];
            if (entity) {
              setCopilotFilter({ entity, ids: action.ids || searchIds, query: action.query || searchQuery });
            }
            router.push(action.path);
          } else if ((action.type as string) === 'filter') {
            const entity = action.entity;
            if (entity) {
              setCopilotFilter({ entity, ids: action.ids, query: action.query });
              const targetPath = ENTITY_TO_PATH[entity];
              if (targetPath && !router.pathname.includes(targetPath)) {
                router.push(targetPath);
              }
            }
          } else if ((action.type as string) === 'clear_filter') {
            clearCopilotFilter();
          } else if (action.type === 'refresh_data') {
            refreshEventsGroup();
            router.replace(router.asPath);
          }
          break;
        }
        case 'progress': {
          const prog = event.data as ProgressEvent;
          setProgress(prog);
          if (prog.status === 'completed' || prog.status === 'error') {
            setTimeout(() => setProgress(null), 2000);
          }
          break;
        }
        default:
          break;
      }
    },
    [router, toast, setCopilotFilter, clearCopilotFilter, refreshEventsGroup],
  );

  // Construir acciones para un mensaje (copy + regenerar si es el último assistant)
  const buildActions = useCallback(
    (msgId: string, role: 'user' | 'assistant', isLast: boolean, content: string) => {
      if (role !== 'assistant') return undefined;

      const handleCopy = () => {
        navigator.clipboard.writeText(content).then(
          () => toast('success', 'Copiado'),
          () => toast('error', 'No se pudo copiar'),
        );
      };

      const handleRegen = () => {
        // Elimina el último par user+assistant y reenvía el mensaje del usuario
        setMessages(prev => {
          const lastUserIdx = [...prev].reverse().findIndex(m => m.role === 'user');
          if (lastUserIdx === -1) return prev;
          const userIdx = prev.length - 1 - lastUserIdx;
          const userMsg = prev[userIdx];
          // Corta hasta ese mensaje (sin incluirlo)
          const trimmed = prev.slice(0, userIdx);
          return trimmed;
        });
        // Recuperar el último mensaje del usuario para reenviar
        setMessages(prev => {
          const lastUser = [...prev].reverse().find(m => m.role === 'user');
          if (lastUser) {
            // Reenviar via setTimeout para dar tiempo al setMessages anterior
            setTimeout(() => handleSend(lastUser.message as string), 0);
          }
          return prev;
        });
      };

      return (
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <ActionBtn onClick={handleCopy} title="Copiar respuesta">
            📋 Copiar
          </ActionBtn>
          {isLast && !loading && (
            <ActionBtn onClick={handleRegen} title="Regenerar respuesta">
              🔄 Regenerar
            </ActionBtn>
          )}
        </div>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, toast],
  );

  // Rebuild messages with actions when messages or loading changes
  const messagesWithActions = messages.map((msg, idx) => {
    const isLast = idx === messages.length - 1;
    return {
      ...msg,
      actions: buildActions(msg.id, msg.role as 'user' | 'assistant', isLast, msg.message as string || ''),
      // Incrustar sección de razonamiento encima del último mensaje assistant si está razonando
      aboveMessage:
        isLast && msg.role === 'assistant' && (isReasoning || reasoningText) ? (
          <ReasoningSection text={reasoningText} isStreaming={isReasoning} />
        ) : undefined,
    };
  });

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || loading) return;

      // Notificar primer mensaje para actualizar label de sesión
      if (!firstMessageSentRef.current) {
        firstMessageSentRef.current = true;
        onFirstMessage?.(content);
      }

      // Limpiar reasoning anterior
      setReasoningText('');
      setIsReasoning(false);
      setRunningTool(null);

      const userMessageId = generateMessageId();
      const userMessage: MessageItem = {
        id: userMessageId,
        role: 'user',
        message: content,
        avatar: { title: 'Tú' },
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setLoading(true);
      setRetryContent(null);

      const assistantMessageId = generateMessageId();
      const assistantMessage: MessageItem = {
        id: assistantMessageId,
        role: 'assistant',
        message: '',
        avatar: { title: 'Copilot', backgroundColor: '#FF1493' },
        createdAt: new Date(),
        loading: true,
      };
      setMessages(prev => [...prev, assistantMessage]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const messageHistory = messages.map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.message as string || '',
        }));

        const params: SendMessageParams = {
          message: content,
          sessionId,
          userId,
          development,
          eventId,
          eventName,
          pageContext,
          messageHistory,
        };

        await sendChatMessage(
          params,
          chunk => {
            setMessages(prev => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.id === assistantMessageId) {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  message: (updated[lastIdx].message as string) + chunk,
                  loading: false,
                };
              }
              return updated;
            });
          },
          controller.signal,
          event => {
            handleEnrichedEvent(event);
            // Cuando llega tool_result, marcar fin de reasoning si seguía activo
            if (event.type === 'tool_result') setIsReasoning(false);
          },
        );

        // Fin de streaming: cerrar reasoning
        setIsReasoning(false);
        setRunningTool(null);
      } catch (error: any) {
        setIsReasoning(false);
        setRunningTool(null);
        console.error('[CopilotEmbed] send error:', error);

        const isAbort = error.name === 'AbortError';
        const isAuthError = error.__errorCode === 'AUTH_ERROR';
        const isRateLimitError = error.__errorCode === 'RATE_LIMIT';
        if (!isAbort && !isAuthError && !isRateLimitError) setRetryContent(content);
        if (isRateLimitError) setIsRateLimited(true);

        setMessages(prev => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.id === assistantMessageId) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              message: isAbort
                ? 'Solicitud cancelada.'
                : error.message || 'Error al enviar el mensaje.',
              loading: false,
              error: { message: error.message || 'Ocurrió un error.' },
            };
          }
          return updated;
        });
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      sessionId, userId, development, eventId, eventName, pageContext,
      loading, handleEnrichedEvent, messages, onFirstMessage,
    ],
  );

  const handleRetry = useCallback(() => {
    if (!retryContent || loading) return;
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && last?.error) return prev.slice(0, -2);
      return prev;
    });
    handleSend(retryContent);
  }, [retryContent, loading, handleSend]);

  // Interceptar clicks en links markdown internos
  const messageListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('/')) {
        e.preventDefault();
        try {
          const url = new URL(href, 'http://localhost');
          const entity = PATH_TO_ENTITY[url.pathname];
          if (entity) {
            const idsParam = url.searchParams.get('ids');
            const ids = idsParam ? idsParam.split(',').filter(Boolean) : undefined;
            const query = url.searchParams.get('query') || undefined;
            if (ids || query) setCopilotFilter({ entity, ids, query });
          }
        } catch { /* ignorar */ }
        router.push(href);
        return;
      }
      try {
        const url = new URL(href, window.location.origin);
        const knownHosts = ['app.bodasdehoy.com', 'app-test.bodasdehoy.com', 'app-dev.bodasdehoy.com', 'organizador.bodasdehoy.com'];
        if (url.origin === window.location.origin || knownHosts.some(h => url.hostname === h)) {
          e.preventDefault();
          router.push(url.pathname + url.search + url.hash);
        }
      } catch { /* ignorar */ }
    };
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [router, setCopilotFilter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  // Empty state con preguntas sugeridas
  const emptyState = (
    <div style={{ textAlign: 'center', padding: '32px 20px 16px', color: '#9ca3af' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>✨</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
        Copilot IA
      </p>
      <p style={{ fontSize: 13, marginBottom: 20 }}>
        {eventName ? `Asistente para "${eventName}"` : 'Tu asistente de bodas inteligente'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
        {SUGGESTED_QUESTIONS.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => handleSend(q)}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              color: '#374151',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fdf2f8';
              e.currentTarget.style.borderColor = '#f9a8d4';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
    >
      {/* Banner guest */}
      {isGuest && !isRateLimited && (
        <div style={{
          padding: '7px 16px', background: '#fff5f9', borderBottom: '1px solid #ffe0ef',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: '#999' }}>Modo gratuito · mensajes limitados</span>
          <a href={loginPath || '/login'} style={{ fontSize: 12, color: '#eb2f96', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Regístrate →
          </a>
        </div>
      )}

      {/* Banner recuperar conversación */}
      {showRecoverBanner && messages.length > 0 && (
        <div style={{
          padding: '10px 16px', background: '#f0f5ff', borderBottom: '1px solid #adc6ff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, color: '#2f54eb', flex: '1 1 200px' }}>
            Conversación anterior cargada. ¿Continuar o nueva?
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button type="button" onClick={() => setShowRecoverBanner(false)}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#2f54eb', background: '#fff', border: '1px solid #adc6ff', borderRadius: 6, cursor: 'pointer' }}>
              Continuar
            </button>
            <button type="button" onClick={() => { setMessages([]); setShowRecoverBanner(false); clearCopilotFilter(); }}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#2f54eb', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Nueva
            </button>
          </div>
        </div>
      )}

      {/* Lista de mensajes */}
      <div ref={messageListRef} style={{ flex: 1, overflow: 'hidden' }}>
        <MessageList
          messages={messagesWithActions}
          autoScroll
          loading={loadingHistory}
          emptyState={emptyState}
        />
      </div>

      {/* Progreso multi-paso */}
      {progress && (
        <div style={{
          padding: '8px 16px', background: '#f0f7ff', borderTop: '1px solid #bfdbfe',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{ flex: 1, height: 4, background: '#dbeafe', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.round((progress.step / progress.total) * 100)}%`,
              background: progress.status === 'error' ? '#ef4444' : '#3b82f6',
              borderRadius: 2, transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
            {progress.label} ({progress.step}/{progress.total})
          </span>
        </div>
      )}

      {/* Herramienta corriendo */}
      {runningTool && <ToolRunning tool={runningTool} />}

      {/* Rate limit banner */}
      {isRateLimited && (
        <div style={{
          padding: '10px 16px', background: '#fff0f6', borderTop: '1px solid #ffadd2',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, color: '#c41d7f', flex: 1 }}>Límite de mensajes gratuitos alcanzado.</span>
          <a href={loginPath || '/login'} style={{
            fontSize: 13, color: '#fff', background: '#eb2f96', borderRadius: 6,
            padding: '4px 12px', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            Regístrate gratis
          </a>
        </div>
      )}

      {/* Retry banner */}
      {retryContent && !loading && !isRateLimited && (
        <div style={{
          padding: '8px 16px', background: '#fff7f0', borderTop: '1px solid #ffd0a8',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, color: '#c05000' }}>El asistente no pudo responder.</span>
          <button onClick={handleRetry} disabled={loading}
            style={{ fontSize: 13, color: '#fff', background: '#e05a00', border: 'none', borderRadius: 6, padding: '4px 14px', cursor: 'pointer', fontWeight: 500 }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Input area con botón enviar */}
      <div style={{ borderTop: '1px solid #e8e8e8', padding: '12px 16px', background: '#fff', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <InputEditor
              content={input}
              placeholder="Escribe un mensaje… (Enter para enviar)"
              loading={loading}
              onChange={setInput}
              onSend={handleSend}
              minRows={1}
              maxRows={5}
            />
          </div>
          <button
            type="button"
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
            title="Enviar (Enter)"
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: input.trim() && !loading ? '#ec4899' : '#e5e7eb',
              color: input.trim() && !loading ? '#fff' : '#9ca3af',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              transition: 'background 0.15s',
              marginBottom: 2,
            }}
          >
            {loading ? '⏳' : '↑'}
          </button>
        </div>
        <p style={{ fontSize: 10, color: '#d1d5db', margin: '4px 0 0', textAlign: 'right' }}>
          Enter envía · Shift+Enter nueva línea
        </p>
      </div>
    </div>
  );
};

export default CopilotEmbed;
