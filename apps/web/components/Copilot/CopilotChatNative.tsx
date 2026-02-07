/**
 * CopilotChatNative - Chat nativo mejorado
 *
 * Con input de texto visible, boton de expandir y mejor UX
 */

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { IoSend, IoStop, IoExpand, IoSparkles } from 'react-icons/io5';
import {
  sendChatMessage,
  generateMessageId,
  ChatMessage,
  PageContext,
  EnrichedEvent,
} from '../../services/copilotChat';
import EnrichedEventRenderer from './EnrichedEventRenderer';
import SimpleMarkdown from './SimpleMarkdown';
import CopilotInputEditor from './CopilotInputEditor';

interface CopilotChatNativeProps {
  userId?: string;
  development?: string;
  eventId?: string;
  eventName?: string;
  pageContext?: PageContext;
  onNavigate?: (url: string) => void;
  onExpand?: () => void;
  className?: string;
}

const extractBackendIds = (text: string) => {
  const requestId = text.match(/RequestId:\s*([^\s]+)/i)?.[1];
  const traceId = text.match(/TraceId:\s*([^\s]+)/i)?.[1];
  const errorCode = text.match(/ErrorCode:\s*([^\s]+)/i)?.[1];

  return { errorCode, requestId, traceId };
};

const CopilotChatNative = memo(({
  userId,
  development = 'bodasdehoy',
  eventId,
  eventName,
  pageContext,
  onNavigate,
  onExpand,
  className,
}: CopilotChatNativeProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [copyStatusByMessageId, setCopyStatusByMessageId] = useState<Record<string, 'ok' | 'fail'>>({});

  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>(generateMessageId());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: inputValue.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    const assistantMessageId = generateMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
      loading: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await sendChatMessage(
        { message: userMessage.content, sessionId: sessionIdRef.current, userId, development, eventId, eventName, pageContext },
        (chunk: string) => {
          if (chunk && chunk.trim()) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, content: msg.content + chunk } : msg
              )
            );
          }
        },
        abortControllerRef.current.signal,
        (event: EnrichedEvent) => {
          // Accumulate enriched events on the assistant message in real-time
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, enrichedEvents: [...(msg.enrichedEvents || []), event] }
                : msg
            )
          );
        }
      );

      // NO filtrar contenido técnico - ver datos reales del backend para testing
      const rawContent = response.content || '';
      const looksLikeBackendError =
        /RequestId:/i.test(rawContent) &&
        /(Servicio IA no disponible|IA_BACKEND_|Error del backend IA|Ocurri\u00f3 un error|Error \d{3})/i.test(rawContent);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? looksLikeBackendError
              ? { ...msg, content: '', loading: false, error: rawContent }
              : {
                  ...msg,
                  content: rawContent || msg.content,
                  loading: false,
                  toolCalls: response.toolCalls,
                  enrichedEvents: [
                    ...(msg.enrichedEvents || []),
                    ...(response.enrichedEvents || []),
                  ],
                }
            : msg
        )
      );

      if (response.navigationUrl && onNavigate) {
        onNavigate(response.navigationUrl);
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, loading: false, error: error instanceof Error ? error.message : 'Error desconocido' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);

      abortControllerRef.current = null;
    }
  }, [inputValue, isLoading, userId, development, eventId, eventName, pageContext, onNavigate]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // Handle confirmation responses - sends auto-message back to backend
  const pendingConfirmRef = useRef<string | null>(null);
  const handleConfirm = useCallback((confirmId: string, accepted: boolean) => {
    if (isLoading) return;
    const msg = accepted
      ? `[CONFIRM:${confirmId}] Sí, confirmo la acción.`
      : `[CONFIRM:${confirmId}] No, cancela la acción.`;
    pendingConfirmRef.current = msg;
    setInputValue(msg);
  }, [isLoading]);

  // Auto-send when inputValue is set by confirm
  useEffect(() => {
    if (pendingConfirmRef.current && inputValue === pendingConfirmRef.current && !isLoading) {
      pendingConfirmRef.current = null;
      handleSend();
    }
  }, [inputValue, isLoading, handleSend]);

  // Handle UI actions from enriched events
  const handleUIAction = useCallback((url: string) => {
    if (onNavigate) {
      onNavigate(url);
    } else {
      window.location.href = url;
    }
  }, [onNavigate]);

  const handleCopyReport = useCallback(async (msgId: string, errorText: string) => {
    try {
      const ids = extractBackendIds(errorText);
      const report = [
        '## Reporte Copilot (Backend IA)',
        '',
        `- Development: ${development}`,
        `- EventId: ${eventId || 'N/A'}`,
        `- UserId: ${userId || 'N/A'}`,
        `- RequestId: ${ids.requestId || 'N/A'}`,
        `- TraceId: ${ids.traceId || 'N/A'}`,
        `- ErrorCode: ${ids.errorCode || 'N/A'}`,
        `- Timestamp: ${new Date().toISOString()}`,
        '',
        '### Error',
        errorText,
        '',
      ].join('\n');

      await navigator.clipboard.writeText(report);
      setCopyStatusByMessageId((prev) => ({ ...prev, [msgId]: 'ok' }));
      setTimeout(() => {
        setCopyStatusByMessageId((prev) => {
          const { [msgId]: _, ...rest } = prev;
          return rest;
        });
      }, 2500);
    } catch {
      setCopyStatusByMessageId((prev) => ({ ...prev, [msgId]: 'fail' }));
      setTimeout(() => {
        setCopyStatusByMessageId((prev) => {
          const { [msgId]: _, ...rest } = prev;
          return rest;
        });
      }, 2500);
    }
  }, [development, eventId, userId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  const quickSuggestions = [
    'Como gestiono los invitados?',
    'Ayudame con el presupuesto',
    'Muestra el itinerario',
  ];

  // Estilos inline para garantizar visibilidad
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      backgroundColor: '#ffffff',
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '16px',
    },
    welcomeContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center' as const,
    },
    iconBox: {
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
      background: 'linear-gradient(135deg, rgba(247,98,140,0.2) 0%, rgba(247,98,140,0.05) 100%)',
    },
    inputArea: {
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      padding: '12px',
    },
    expandButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      width: '100%',
      padding: '8px 12px',
      marginBottom: '8px',
      backgroundColor: '#f3f4f6',
      border: '1px dashed #d1d5db',
      borderRadius: '8px',
      color: '#6b7280',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    inputContainer: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: isFocused ? '2px solid #F7628C' : '2px solid #e5e7eb',
      boxShadow: isFocused ? '0 0 0 3px rgba(247,98,140,0.1)' : 'none',
      transition: 'all 0.2s',
    },
    textarea: {
      flex: 1,
      resize: 'none' as const,
      border: 'none',
      backgroundColor: 'transparent',
      padding: '12px 16px',
      fontSize: '14px',
      color: '#1f2937',
      outline: 'none',
      minHeight: '44px',
      maxHeight: '120px',
      lineHeight: '1.5',
    },
    sendButton: {
      margin: '6px',
      padding: '10px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: inputValue.trim() ? '#F7628C' : '#e5e7eb',
      color: inputValue.trim() ? '#ffffff' : '#9ca3af',
      cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stopButton: {
      margin: '6px',
      padding: '10px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#ef4444',
      color: '#ffffff',
      cursor: 'pointer',
    },
    hint: {
      fontSize: '10px',
      color: '#9ca3af',
      marginTop: '8px',
      textAlign: 'center' as const,
    },
    suggestionButton: {
      textAlign: 'left' as const,
      padding: '10px 14px',
      fontSize: '13px',
      color: '#4b5563',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '6px',
      width: '100%',
      maxWidth: '280px',
    },
  };

  return (
    <div style={styles.container} className={className}>
      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {messages.length === 0 ? (
          <div style={styles.welcomeContainer}>
            <div style={styles.iconBox}>
              <IoSparkles style={{ width: '32px', height: '32px', color: '#F7628C' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>
              Copilot
            </h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', maxWidth: '250px' }}>
              Tu asistente inteligente para gestionar eventos.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '280px' }}>
              {quickSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  style={styles.suggestionButton}
                  onClick={() => {
                    setInputValue(suggestion);
                    inputRef.current?.focus();
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Renderización manual de mensajes para mejor control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '80%' }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: msg.role === 'user' ? '#F7628C' : (msg.error ? '#fee2e2' : '#f3f4f6'),
                        color: msg.role === 'user' ? 'white' : (msg.error ? '#991b1b' : '#1f2937'),
                        fontSize: '14px',
                        lineHeight: '1.5',
                      }}
                    >
                      {msg.loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#9ca3af',
                            animation: 'pulse 1.5s infinite'
                          }} />
                          Pensando...
                        </span>
                      ) : msg.error ? (
                        <span>⚠️ {msg.error}</span>
                      ) : msg.content ? (
                        msg.role === 'assistant' ? <SimpleMarkdown content={msg.content} /> : msg.content
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                          (Respuesta vacía)
                        </span>
                      )}
                    </div>

                    {/* Enriched events (downloads, images, confirmations, progress, etc.) */}
                    {msg.enrichedEvents && msg.enrichedEvents.length > 0 && (
                      <EnrichedEventRenderer events={msg.enrichedEvents} onNavigate={handleUIAction} onConfirm={handleConfirm} />
                    )}

                    {msg.error && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleCopyReport(msg.id, msg.error || '')}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #fecaca',
                            backgroundColor: '#fff1f2',
                            color: '#991b1b',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Copiar reporte
                        </button>
                        {copyStatusByMessageId[msg.id] === 'ok' && (
                          <span style={{ fontSize: '12px', color: '#047857' }}>Copiado</span>
                        )}
                        {copyStatusByMessageId[msg.id] === 'fail' && (
                          <span style={{ fontSize: '12px', color: '#991b1b' }}>No se pudo copiar</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        {/* Expand Button - Visible y grande */}
        {onExpand && (
          <button
            type="button"
            style={styles.expandButton}
            onClick={onExpand}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
              e.currentTarget.style.borderColor = '#F7628C';
              e.currentTarget.style.color = '#F7628C';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <IoExpand style={{ width: '16px', height: '16px' }} />
            <span>Abrir en pantalla completa</span>
          </button>
        )}

        {/* Editor Completo */}
        <CopilotInputEditor
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          onStop={handleStop}
          isLoading={isLoading}
          placeholder="Escribe tu mensaje. Presione la tecla ⌘ ↵ para hacer un salto de línea..."
        />

        <p style={styles.hint}>
          Presiona Enter para enviar | Shift+Enter para nueva linea
        </p>
      </div>
    </div>
  );
});

CopilotChatNative.displayName = 'CopilotChatNative';

export default CopilotChatNative;
