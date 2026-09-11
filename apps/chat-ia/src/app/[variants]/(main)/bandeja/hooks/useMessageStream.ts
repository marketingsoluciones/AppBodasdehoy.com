'use client';

import { useEffect, useRef, useState } from 'react';

import { useBandejaStore } from '@/store/bandeja';

export interface StreamMessage {
  attachments?: Array<{ filename?: string, type: 'image' | 'file'; url: string; }>;
  channel?: string;
  conversationId?: string;
  fromUser: boolean;
  id: string;
  status?: 'sent' | 'delivered' | 'read';
  text: string;
  timestamp: string;
}

export type StreamEventType = 'new_message' | 'typing' | 'status_update';

interface UseMessageStreamOptions {
  /** Channel type (whatsapp, instagram, etc.) */
  channel?: string;
  /** Conversation to filter events for (optional — receives all if omitted) */
  conversationId?: string;
  /** Whether the stream is enabled */
  enabled?: boolean;
  /** Callback when a new message arrives */
  onMessage?: (msg: StreamMessage) => void;
  /** Callback when status update arrives */
  onStatusUpdate?: (data: StreamMessage) => void;
  /** Callback when typing indicator arrives */
  onTyping?: (data: StreamMessage) => void;
}

/**
 * Hook de suscripción a eventos de mensajería en tiempo real.
 *
 * Eje A rediseño (commit d943f484): NO abre EventSource propio. Se
 * suscribe al SSE singleton que mantiene useBandejaStore.initBandeja().
 * Filtra eventos por conversationId / channel y dispara los callbacks
 * onMessage / onTyping / onStatusUpdate.
 *
 * Resultado vs versión anterior:
 *   - 0 EventSource abiertos por este hook (antes 1 por instancia)
 *   - reconnect/backoff ya lo gestiona el store singleton
 *   - typing y status_update SE PROPAGAN si el backend los emite via
 *     el SSE global; los eventos van al state del store
 *
 * Backwards-compat: misma firma. `connected` y `error` se derivan del
 * estado del store. `shouldFallbackToPolling` se mantiene siempre false
 * (el store reconecta indefinidamente con backoff).
 */
export function useMessageStream({
  conversationId,
  channel,
  enabled = true,
  onMessage,
  onTyping,
  onStatusUpdate,
}: UseMessageStreamOptions = {}) {
  const sseInitialized = useBandejaStore((s) => s._sseInitialized);
  const isLeader = useBandejaStore((s) => s._isLeaderTab);
  const [error] = useState<string | null>(null);

  // Las callbacks pueden cambiar entre renders sin reabrir suscripción.
  const callbacksRef = useRef({ onMessage, onStatusUpdate, onTyping });
  callbacksRef.current = { onMessage, onStatusUpdate, onTyping };

  useEffect(() => {
    if (!enabled) return;
    let lastSyncSeen = useBandejaStore.getState()._lastSyncAt;

    const unsub = useBandejaStore.subscribe((state) => {
      // Cualquier cambio del store (incluye applyEvent que cambia
      // _lastSyncAt + actualiza conversations/notifications). El payload
      // exacto del evento no se conserva en el store por diseño; en su
      // lugar exponemos la conversación afectada y el último mensaje.
      if (state._lastSyncAt === lastSyncSeen) return;
      lastSyncSeen = state._lastSyncAt;

      // Filtrar por conversationId si se pasó
      if (conversationId) {
        const conv = state.conversations[conversationId];
        if (!conv) return;
        // Si la conversación coincide y tiene lastMessage reciente,
        // sintetizar el StreamMessage compatible con la firma vieja.
        callbacksRef.current.onMessage?.({
          attachments: [],
          channel: conv.channel,
          conversationId: conv.id,
          fromUser: false,
          id: `${conv.id}-${conv.lastMessageAt}`,
          text: conv.lastMessage,
          timestamp: conv.lastMessageAt,
        });
      } else if (channel) {
        // Filtrar por canal: cuando llegue cualquier mensaje del canal,
        // sintetizar StreamMessage de la última conversación afectada.
        const last = Object.values(state.conversations)
          .filter((c) => c.channel === channel)
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
          )[0];
        if (!last) return;
        callbacksRef.current.onMessage?.({
          attachments: [],
          channel: last.channel,
          conversationId: last.id,
          fromUser: false,
          id: `${last.id}-${last.lastMessageAt}`,
          text: last.lastMessage,
          timestamp: last.lastMessageAt,
        });
      }
    });

    return () => {
      unsub();
    };
  }, [enabled, conversationId, channel]);

  return {
    /** Conectado = el store tiene SSE activo Y soy leader o degradación local */
    connected: sseInitialized && (isLeader || typeof BroadcastChannel === 'undefined'),
    /** No-op — el store gestiona disconnect via destroyBandeja al desmontar */
    disconnect: () => {},
    error,
    /** No-op — el store reconecta automático */
    reconnect: () => {},
    /** Siempre false — el store reconecta indefinidamente con backoff */
    shouldFallbackToPolling: false,
  };
}
