/**
 * CopilotEmbed - Componente de chat integrado usando componentes compartidos
 *
 * Usa componentes de @bodasdehoy/copilot-shared:
 * - MessageList: Lista de mensajes con auto-scroll
 * - InputEditor: Input con shortcuts (Enter/Shift+Enter)
 *
 * Conecta con copilotChat service para streaming SSE.
 */

import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { MessageList, InputEditor } from '@bodasdehoy/copilot-shared';
import type { MessageItem } from '@bodasdehoy/copilot-shared';
import {
  sendChatMessage,
  getChatHistory,
  generateMessageId,
  type SendMessageParams,
  type PageContext,
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
export const CopilotEmbed: FC<CopilotEmbedProps> = ({
  userId,
  sessionId,
  development,
  eventId,
  eventName,
  pageContext,
  className,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

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
      } catch (error) {
        console.error('[CopilotEmbed] Error loading history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [sessionId, development]);

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
        const params: SendMessageParams = {
          message: content,
          sessionId,
          userId,
          development,
          eventId,
          eventName,
          pageContext,
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
          (event) => {
            // TODO: Handle enriched events in future phases
            console.log('[CopilotEmbed] Enriched event:', event);
          }
        );
      } catch (error: any) {
        console.error('[CopilotEmbed] Error sending message:', error);

        // Update assistant message with error
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.id === assistantMessageId) {
            updated[lastIdx] = {
              ...updated[lastIdx],
              message:
                error.name === 'AbortError'
                  ? 'Request cancelled'
                  : 'Error sending message. Please try again.',
              loading: false,
              error: {
                message:
                  error.message || 'An error occurred while sending your message.',
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
    [sessionId, userId, development, eventId, eventName, pageContext, loading]
  );

  // Handle message actions (copy, etc.)
  const handleAction = useCallback((action: string, messageId: string) => {
    if (action === 'copy') {
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        navigator.clipboard.writeText(message.message);
        // TODO: Show toast notification in future
        console.log('[CopilotEmbed] Copied message:', messageId);
      }
    }
  }, [messages]);

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
      {/* Message List */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
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
