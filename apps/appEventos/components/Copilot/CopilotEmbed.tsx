/**
 * CopilotEmbed - Componente de chat integrado usando componentes compartidos
 *
 * Usa componentes de @bodasdehoy/copilot-shared:
 * - MessageList: Lista de mensajes con auto-scroll
 * - InputEditor: Input con shortcuts (Enter/Shift+Enter)
 *
 * Conecta con copilotChat service para streaming SSE.
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

export interface CopilotEmbedProps {
  /**
   * User ID
   */
  userId: string;
  /**
   * Session ID for chat history
   */
  sessionId: string;
  /**
   * Development environment (e.g., 'bodasdehoy')
   */
  development: string;
  /**
   * Optional event ID for context
   */
  eventId?: string;
  /**
   * Optional event name for context
   */
  eventName?: string;
  /**
   * Optional page context
   */
  pageContext?: PageContext;
  /**
   * Optional className for container
   */
  className?: string;
  /**
   * Whether the current user is a guest (not registered)
   */
  isGuest?: boolean;
  /**
   * Path to the login/register page
   */
  loginPath?: string;
}

/**
 * CopilotEmbed component
 *
 * Integración nativa del chat de Copilot en apps/web usando componentes compartidos.
 *
 * @example
 * ```tsx
 * <CopilotEmbed
 *   userId={userId}
 *   sessionId={sessionId}
 *   development="bodasdehoy"
 *   eventId={eventId}
 *   eventName={eventName}
 * />
 * ```
 */
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
}: CopilotEmbedProps) => {
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Último mensaje del usuario para poder reintentar en errores 503/429
  const [retryContent, setRetryContent] = useState<string | null>(null);
  // True cuando el visitante alcanzó el límite de mensajes gratuitos (429)
  const [isRateLimited, setIsRateLimited] = useState(false);
  // Progress state for multi-step operations
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  /** Hay conversación anterior cargada: preguntar si recuperar o nueva conversación */
  const [showRecoverBanner, setShowRecoverBanner] = useState(false);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const history = await getChatHistory(sessionId, development);

        const formattedMessages: MessageItem[] = history.map((msg) => ({
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

        setMessages(formattedMessages);
        if (formattedMessages.length > 0) setShowRecoverBanner(true);
      } catch (error) {
        console.error('[CopilotEmbed] Error loading history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [sessionId, development]);

  // Handle enriched events from api-ia SSE stream
  const handleEnrichedEvent = useCallback((event: EnrichedEvent) => {
    switch (event.type) {
      case 'ui_action': {
        const action = event.data as UIActionEvent;
        if (action.type === 'navigate' && action.path) {
          router.push(action.path);
        } else if (action.type === 'refresh_data') {
          router.replace(router.asPath);
        }
        break;
      }
      case 'progress': {
        const prog = event.data as ProgressEvent;
        setProgress(prog);
        // Clear progress when step completes or errors
        if (prog.status === 'completed' || prog.status === 'error') {
          setTimeout(() => setProgress(null), 2000);
        }
        break;
      }
      case 'tool_result': {
        const toolResult = event.data as ToolResultEvent;
        if (toolResult.result?.type === 'download' && toolResult.result.url) {
          toast('success', `Archivo listo: ${toolResult.result.filename || 'descarga'}`);
        } else if (toolResult.result?.type === 'error' && toolResult.result.error) {
          toast('error', toolResult.result.error);
        }
        break;
      }
      default:
        break;
    }
  }, [router, toast]);

  // Handle sending message
  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || loading) return;

      // Create user message
      const userMessageId = generateMessageId();
      const userMessage: MessageItem = {
        id: userMessageId,
        role: 'user',
        message: content,
        avatar: { title: 'Tú' },
        createdAt: new Date(),
      };

      // Add user message to list
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setLoading(true);
      setRetryContent(null); // Limpiar retry anterior

      // Create assistant message (empty, will be filled with streaming)
      const assistantMessageId = generateMessageId();
      const assistantMessage: MessageItem = {
        id: assistantMessageId,
        role: 'assistant',
        message: '',
        avatar: { title: 'Copilot', backgroundColor: '#FF1493' },
        createdAt: new Date(),
        loading: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Create abort controller for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const messageHistory = messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.message || '',
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

        // Send with streaming
        await sendChatMessage(
          params,
          // onChunk: Update assistant message content in real-time
          (chunk) => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.id === assistantMessageId) {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  message: updated[lastIdx].message + chunk,
                  loading: false,
                };
              }
              return updated;
            });
          },
          controller.signal,
          // onEnrichedEvent: Handle enriched events (tool results, etc.)
          handleEnrichedEvent
        );
      } catch (error: any) {
        console.error('[CopilotEmbed] Error sending message:', error);

        const isAbort = error.name === 'AbortError';
        // No reintentar en AUTH_ERROR: requiere acción de admin, no del usuario
        const isAuthError = error.__errorCode === 'AUTH_ERROR';
        // No reintentar en RATE_LIMIT: mostrar CTA de registro
        const isRateLimitError = error.__errorCode === 'RATE_LIMIT';
        if (!isAbort && !isAuthError && !isRateLimitError) setRetryContent(content);
        if (isRateLimitError) setIsRateLimited(true);

        // Update assistant message with error
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.id === assistantMessageId) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              message: isAbort
                ? 'Solicitud cancelada.'
                : error.message || 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.',
              loading: false,
              error: {
                message: error.message || 'Ocurrió un error al enviar el mensaje.',
              },
            };
          }
          return updated;
        });
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [sessionId, userId, development, eventId, eventName, pageContext, loading, handleEnrichedEvent, messages]
  );

  // Handle message actions (copy, etc.)
  const handleAction = useCallback((action: string, messageId: string) => {
    if (action === 'copy') {
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        navigator.clipboard.writeText(message.message).then(() => {
          toast('success', 'Mensaje copiado al portapapeles');
        }).catch(() => {
          toast('error', 'No se pudo copiar el mensaje');
        });
      }
    }
  }, [messages]);

  // Reintentar el último mensaje fallido
  const handleRetry = useCallback(() => {
    if (!retryContent || loading) return;
    // Eliminar el último mensaje de error (assistant) y reenviar
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && last?.error) return prev.slice(0, -2);
      return prev;
    });
    handleSend(retryContent);
  }, [retryContent, loading, handleSend]);

  // Interceptar clicks en links markdown internos (ej: /invitados?eventId=X)
  // para navegar con router.push en vez de recargar la página completa.
  const messageListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = messageListRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Solo interceptar rutas internas (empiezan por /)
      if (href.startsWith('/')) {
        e.preventDefault();
        router.push(href);
        return;
      }

      // Links al mismo dominio: convertir a ruta relativa
      try {
        const url = new URL(href, window.location.origin);
        const sameOrigin = url.origin === window.location.origin;
        const knownHosts = ['app-test.bodasdehoy.com', 'organizador.bodasdehoy.com', 'bodasdehoy.com'];
        const isKnown = knownHosts.some(h => url.hostname === h);
        if (sameOrigin || isKnown) {
          e.preventDefault();
          router.push(url.pathname + url.search + url.hash);
        }
      } catch {
        // URL inválida, dejar comportamiento por defecto
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      {/* Guest CTA banner — visible cuando el usuario no está registrado */}
      {isGuest && !isRateLimited && (
        <div
          style={{
            padding: '7px 16px',
            background: '#fff5f9',
            borderBottom: '1px solid #ffe0ef',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, color: '#999' }}>Modo gratuito · mensajes limitados</span>
          <a
            href={loginPath || '/login'}
            style={{ fontSize: 12, color: '#eb2f96', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Regístrate →
          </a>
        </div>
      )}

      {/* Banner: recuperar conversación anterior o nueva */}
      {showRecoverBanner && messages.length > 0 && (
        <div
          style={{
            padding: '10px 16px',
            background: '#f0f5ff',
            borderBottom: '1px solid #adc6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 13, color: '#2f54eb', flex: '1 1 200px' }}>
            Tienes una conversación anterior. ¿Continuar o empezar una nueva?
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowRecoverBanner(false)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#2f54eb',
                background: '#fff',
                border: '1px solid #adc6ff',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Continuar con esta
            </button>
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setShowRecoverBanner(false);
              }}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#fff',
                background: '#2f54eb',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Nueva conversación
            </button>
          </div>
        </div>
      )}

      {/* Message List — ref para interceptar clicks en links markdown */}
      <div ref={messageListRef} style={{ flex: 1, overflow: 'hidden' }}>
        <MessageList
          messages={messages}
          autoScroll
          loading={loadingHistory}
          onAction={handleAction}
          emptyState={
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                color: '#999',
              }}
            >
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                Bienvenido a Copilot
              </p>
              <p style={{ fontSize: '14px' }}>
                ¿En qué puedo ayudarte hoy?
              </p>
            </div>
          }
        />
      </div>

      {/* Progress indicator — aparece durante operaciones multi-paso */}
      {progress && (
        <div
          style={{
            padding: '8px 16px',
            background: '#f0f7ff',
            borderTop: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 4,
              background: '#dbeafe',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round((progress.step / progress.total) * 100)}%`,
                background: progress.status === 'error' ? '#ef4444' : '#3b82f6',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
            {progress.label} ({progress.step}/{progress.total})
          </span>
        </div>
      )}

      {/* Banner de límite alcanzado — reemplaza el retry cuando es 429 */}
      {isRateLimited && (
        <div
          style={{
            padding: '10px 16px',
            background: '#fff0f6',
            borderTop: '1px solid #ffadd2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, color: '#c41d7f', flex: 1 }}>
            Límite de mensajes gratuitos alcanzado.
          </span>
          <a
            href={loginPath || '/login'}
            style={{
              fontSize: 13,
              color: '#fff',
              background: '#eb2f96',
              borderRadius: 6,
              padding: '4px 12px',
              textDecoration: 'none',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            Regístrate gratis
          </a>
        </div>
      )}

      {/* Banner de reintento — aparece cuando hay error recuperable (no rate limit) */}
      {retryContent && !loading && !isRateLimited && (
        <div
          style={{
            padding: '8px 16px',
            background: '#fff7f0',
            borderTop: '1px solid #ffd0a8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 13, color: '#c05000' }}>
            El asistente no pudo responder.
          </span>
          <button
            onClick={handleRetry}
            disabled={loading}
            style={{
              fontSize: 13,
              color: '#fff',
              background: '#e05a00',
              border: 'none',
              borderRadius: 6,
              padding: '4px 14px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Input Editor */}
      <div
        style={{
          borderTop: '1px solid #e8e8e8',
          padding: '16px',
          background: '#fff',
        }}
      >
        <InputEditor
          content={input}
          placeholder="Escribe un mensaje..."
          loading={loading}
          onChange={setInput}
          onSend={handleSend}
          minRows={2}
          maxRows={6}
        />
      </div>
    </div>
  );
};

export default CopilotEmbed;
