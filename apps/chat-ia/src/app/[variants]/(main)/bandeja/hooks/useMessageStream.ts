'use client';

import { useEffect, useRef } from 'react';

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

/** Subscribe to the actual SSE event, never a synthesized conversation summary. */
export function useMessageStream({
  conversationId,
  channel,
  enabled = true,
  onMessage,
  onTyping,
  onStatusUpdate,
}: UseMessageStreamOptions = {}) {
  const connected = useBandejaStore((s) => s._sseConnected);
  const error = useBandejaStore((s) => s.error);

  // Las callbacks pueden cambiar entre renders sin reabrir suscripción.
  const callbacksRef = useRef({ onMessage, onStatusUpdate, onTyping });
  callbacksRef.current = { onMessage, onStatusUpdate, onTyping };

  useEffect(() => {
    if (!enabled) return;
    let sequence = useBandejaStore.getState()._eventSequence;
    const unsub = useBandejaStore.subscribe((state) => {
      if (state._eventSequence === sequence) return;
      sequence = state._eventSequence;
      const event = state._lastEvent;
      if (!event || !('convId' in event)) return;
      if (conversationId && event.convId !== conversationId) return;
      const eventChannel = state.conversations[event.convId]?.channel ??
        (event.type === 'new_message' ? event.message?.channel : undefined);
      if (channel && eventChannel && eventChannel !== channel) return;
      if (channel && !conversationId && !eventChannel) return;
      if (event.type === 'new_message') {
        const msg = event.message;
        const id = msg?.id ?? msg?.message_id;
        if (!id) return; // REST reconciliation handles payloads without a stable ID.
        callbacksRef.current.onMessage?.({
          attachments: msg.attachments ?? [],
          channel: eventChannel,
          conversationId: event.convId,
          fromUser: msg.fromUser ?? msg.from_user ?? (msg.direction === 'outbound' || msg.fromMe === true),
          id: String(id),
          status: msg.status,
          text: msg.text ?? msg.content ?? '',
          timestamp: msg.timestamp ?? msg.created_at ?? new Date().toISOString(),
        });
      } else if (event.type === 'typing') {
        callbacksRef.current.onTyping?.({ id: event.userId, conversationId: event.convId,
          channel: eventChannel, fromUser: false, text: '', timestamp: new Date().toISOString() });
      } else if (event.type === 'read_receipt') {
        callbacksRef.current.onStatusUpdate?.({ id: event.msgId, conversationId: event.convId,
          channel: eventChannel, fromUser: true, text: '', status: 'read', timestamp: new Date().toISOString() });
      }
    });

    return () => {
      unsub();
    };
  }, [enabled, conversationId, channel]);

  return {
    connected,
    disconnect: () => {}, // Lifecycle is owned by the layout/store.
    error,
    reconnect: () => { void useBandejaStore.getState().refresh(); },
    shouldFallbackToPolling: !connected,
  };
}
