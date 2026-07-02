'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { getWhatsAppMessagesGQL } from '@/services/mcpApi/whatsapp';
import { buildHeaders, parseWhatsAppConversationId } from '../utils/auth';
import { useMessageStream } from './useMessageStream';
import type { StreamMessage } from './useMessageStream';

export interface Message {
  attachments?: Array<{
    filename?: string;
    type: 'image' | 'file';
    url: string;
  }>;
  author?: string;
  fromUser: boolean;
  id: string;
  kind?: 'message' | 'internal_note';
  status?: 'sent' | 'delivered' | 'read';
  text: string;
  timestamp: string;
}

function buildFetchUrl(channel: string, conversationId: string): string | null {
  // api-ia resuelve el whitelabel del header X-Development (que buildHeaders ya envía y el
  // proxy /api/messages propaga). Verificado 15-jun: el header BASTA (antes exigía ?development=
  // en query, era una muleta). Endpoint canónico: /api/messages/conversations/{id}/messages
  // (conversationId completo; para WhatsApp "${dev}:${jid}").
  if (channel === 'whatsapp') {
    const parsed = parseWhatsAppConversationId(conversationId);
    if (!parsed) return null;
  }
  return `/api/messages/conversations/${encodeURIComponent(conversationId)}/messages`;
}

function normalizeMessage(msg: any): Message {
  // Direction detection — covers: REST Baileys (fromMe bool), MCP GraphQL (emitUserUid),
  // api-ia normalized (direction string), legacy (fromUser bool)
  let fromUser: boolean;
  if (msg.direction !== undefined) {
    fromUser = msg.direction === 'INBOUND';
  } else if (typeof msg.fromMe === 'boolean') {
    // Baileys / MCP WhatsApp: fromMe=true means WE sent it
    fromUser = !msg.fromMe;
  } else {
    fromUser = msg.fromUser !== false;
  }

  return {
    attachments: msg.attachments,
    fromUser,
    id: msg.id || msg.messageId || msg._id || `msg_${Date.now()}_${Math.random()}`,
    status: msg.status || 'read',
    // Field variants: api-ia 'text', Baileys 'body', MCP graphql 'message', generic 'content'
    text: msg.text || msg.body || msg.message || msg.content || '',
    // Timestamp variants: ISO string, Unix seconds (Baileys), Float ms (MCP graphql)
    timestamp: (() => {
      const raw = msg.timestamp || msg.createdAt;
      if (!raw) return new Date().toISOString();
      if (typeof raw === 'number') {
        // Baileys uses Unix seconds; MCP createdAt is Float ms
        return new Date(raw < 1e12 ? raw * 1000 : raw).toISOString();
      }
      return raw;
    })(),
  };
}

export function useMessages(channel: string, conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { isGuest } = useAuthCheck();

  const initialLoadDone = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (isGuest || !conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // GraphQL native store path (MCP) — used when external WA service is down
    if (conversationId.startsWith('gql:')) {
      const gqlId = conversationId.slice(4);
      try {
        setLoading(true);
        const msgs = await getWhatsAppMessagesGQL(gqlId);
        const serverMsgs = msgs.map((m) => normalizeMessage({ ...m, direction: m.direction, text: m.text }));
        setMessages(serverMsgs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al obtener mensajes'));
        setMessages([]);
      } finally {
        setLoading(false);
        initialLoadDone.current = true;
      }
      return;
    }

    const url = buildFetchUrl(channel, conversationId);
    if (!url) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(url, { headers: buildHeaders() });

      if (!response.ok) {
        if (response.status === 404) {
          setMessages([]);
          setError(null);
          return;
        }
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.messages || []);
      const serverMsgs = raw.map(normalizeMessage);
      setMessages((prev) => {
        const pendingMsgs = prev.filter((m) => m.id.startsWith('msg_pending_'));
        const stillPending = pendingMsgs.filter(
          (p) =>
            !serverMsgs.some(
              (s: Message) =>
                s.text === p.text &&
                Math.abs(new Date(s.timestamp).getTime() - new Date(p.timestamp).getTime()) < 30_000,
            ),
        );
        return [...serverMsgs, ...stillPending];
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al obtener mensajes'));
      setMessages([]);
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, conversationId, isGuest]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ── SSE real-time messages ───────────────────────────────────────────────
  const handleStreamMessage = useCallback(
    (msg: StreamMessage) => {
      // Only add if it belongs to this conversation
      if (msg.conversationId && msg.conversationId !== conversationId) return;

      const normalized: Message = {
        attachments: msg.attachments,
        fromUser: msg.fromUser,
        id: msg.id,
        status: msg.status,
        text: msg.text,
        timestamp: msg.timestamp,
      };

      setMessages((prev) => {
        // Skip duplicates
        if (prev.some((m) => m.id === normalized.id)) return prev;
        // Remove matching pending message
        const withoutPending = prev.filter(
          (m) =>
            !m.id.startsWith('msg_pending_') ||
            m.text !== normalized.text ||
            Math.abs(new Date(m.timestamp).getTime() - new Date(normalized.timestamp).getTime()) >= 30_000,
        );
        return [...withoutPending, normalized];
      });
    },
    [conversationId],
  );

  const { shouldFallbackToPolling, connected: sseConnected } = useMessageStream({
    channel,
    conversationId,
    enabled: !isGuest && !!conversationId,
    onMessage: handleStreamMessage,
  });

  // SPRINT 2 iMessage 2-jul: read receipts en tiempo real.
  // El store bandeja emite `bandeja:read_receipt` CustomEvent en window
  // cuando llega el evento SSE. Escuchamos aquí y marcamos el mensaje
  // individual con status='read' → MessageItem pinta ✓✓ azul.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent).detail as { convId?: string; msgId?: string } | undefined;
      if (!detail || detail.convId !== conversationId || !detail.msgId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === detail.msgId ? { ...m, status: 'read' as const } : m)),
      );
    };
    window.addEventListener('bandeja:read_receipt', handler as EventListener);
    return () => window.removeEventListener('bandeja:read_receipt', handler as EventListener);
  }, [conversationId]);

  // Poll for new messages — only when SSE is not connected.
  // BUG-CW-N18 + perf mobile (informe QA 23-jun 5ª ronda): polling cada 10s
  // drena batería en mobile y se ejecuta incluso con pestaña en background.
  // Mejoras:
  //   · Intervalo a 15s (era 10s) — equilibrio entre UX y batería.
  //   · Pausa cuando document.hidden = true (visibilitychange).
  //   · Refresh inmediato cuando vuelve a visible.
  useEffect(() => {
    if (isGuest || !conversationId) return;
    // If SSE is connected and not in fallback mode, skip polling
    if (sseConnected && !shouldFallbackToPolling) return;
    if (typeof document === 'undefined') return;

    let interval: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (interval) return;
      interval = setInterval(() => {
        if (initialLoadDone.current && !document.hidden) fetchMessages();
      }, 15_000);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        // Volvió a visible: fetch inmediato + arrancar polling de nuevo.
        if (initialLoadDone.current) fetchMessages();
        start();
      }
    };

    // Estado inicial
    if (!document.hidden) start();

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [fetchMessages, isGuest, conversationId, sseConnected, shouldFallbackToPolling]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  return { addMessage, error, loading, messages, refetch: fetchMessages, sseConnected };
}
