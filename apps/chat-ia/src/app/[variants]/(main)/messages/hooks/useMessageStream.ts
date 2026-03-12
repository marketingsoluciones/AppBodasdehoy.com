'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { buildHeaders } from '../utils/auth';

export interface StreamMessage {
  id: string;
  text: string;
  fromUser: boolean;
  timestamp: string;
  conversationId?: string;
  channel?: string;
  status?: 'sent' | 'delivered' | 'read';
  attachments?: Array<{ type: 'image' | 'file'; url: string; filename?: string }>;
}

export type StreamEventType = 'new_message' | 'typing' | 'status_update';

interface StreamEvent {
  type: StreamEventType;
  data: StreamMessage;
}

interface UseMessageStreamOptions {
  /** Conversation to filter events for (optional — receives all if omitted) */
  conversationId?: string;
  /** Channel type (whatsapp, instagram, etc.) */
  channel?: string;
  /** Whether the stream is enabled */
  enabled?: boolean;
  /** Callback when a new message arrives */
  onMessage?: (msg: StreamMessage) => void;
  /** Callback when typing indicator arrives */
  onTyping?: (data: StreamMessage) => void;
  /** Callback when status update arrives */
  onStatusUpdate?: (data: StreamMessage) => void;
}

export function useMessageStream({
  conversationId,
  channel,
  enabled = true,
  onMessage,
  onTyping,
  onStatusUpdate,
}: UseMessageStreamOptions = {}) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const callbacksRef = useRef({ onMessage, onTyping, onStatusUpdate });
  callbacksRef.current = { onMessage, onTyping, onStatusUpdate };

  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const headers = buildHeaders();
    const development = headers['X-Development'] || 'bodasdehoy';

    const params = new URLSearchParams({ development });
    if (conversationId) params.set('conversationId', conversationId);
    if (channel) params.set('channel', channel);

    const url = `/api/messages/stream?${params.toString()}`;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      es.addEventListener('new_message', (e) => {
        try {
          const data = JSON.parse(e.data) as StreamMessage;
          callbacksRef.current.onMessage?.(data);
        } catch {
          // ignore malformed messages
        }
      });

      es.addEventListener('typing', (e) => {
        try {
          const data = JSON.parse(e.data) as StreamMessage;
          callbacksRef.current.onTyping?.(data);
        } catch {
          // ignore
        }
      });

      es.addEventListener('status_update', (e) => {
        try {
          const data = JSON.parse(e.data) as StreamMessage;
          callbacksRef.current.onStatusUpdate?.(data);
        } catch {
          // ignore
        }
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        eventSourceRef.current = null;

        // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
        const attempts = reconnectAttemptsRef.current;
        const delay = Math.min(2000 * Math.pow(2, attempts), 30_000);
        reconnectAttemptsRef.current = attempts + 1;

        if (attempts < 10) {
          setError(`Reconectando en ${Math.round(delay / 1000)}s...`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else {
          setError('No se pudo conectar al stream. Usando polling como respaldo.');
        }
      };
    } catch {
      setError('SSE no disponible en este navegador');
      setConnected(false);
    }
  }, [conversationId, channel]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [enabled, connect, disconnect]);

  return {
    connected,
    error,
    /** Whether to fallback to polling (SSE failed after max retries) */
    shouldFallbackToPolling: !connected && reconnectAttemptsRef.current >= 10,
    reconnect: connect,
    disconnect,
  };
}
