'use client';

import { useState } from 'react';

import { buildHeaders, jidToPhone, parseWhatsAppConversationId } from '../utils/auth';
import type { Message } from './useMessages';

function buildSendUrl(channel: string, conversationId: string): string | null {
  if (channel === 'whatsapp') {
    const parsed = parseWhatsAppConversationId(conversationId);
    if (!parsed) return null;
    const { dev, jid } = parsed;
    const to = jidToPhone(jid);
    return `/api/messages/whatsapp/conversations/${encodeURIComponent(dev)}/${encodeURIComponent(to)}/send`;
  }
  return `/api/messages/send`;
}

export function useSendMessage() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = async (
    channel: string,
    conversationId: string,
    text: string,
  ): Promise<{ message: Message; success: boolean }> => {
    const optimisticMsg: Message = {
      fromUser: false, // false = mensaje enviado por ti (outbound)
      id: `msg_pending_${Date.now()}`,
      status: 'sent',
      text,
      timestamp: new Date().toISOString(),
    };

    const url = buildSendUrl(channel, conversationId);
    if (!url) {
      return { message: optimisticMsg, success: false };
    }

    // 🐛 FIX 8.2 (informe 2026-06-12): el endpoint genérico /api/messages/send exige
    // conversationId + channel + text (422 si faltan). La URL de WhatsApp ya lleva la conv
    // en el path, pero el body debe incluir los campos requeridos para el endpoint genérico.
    const isWhatsAppDirectUrl = url.includes('/whatsapp/conversations/');
    const body = isWhatsAppDirectUrl
      ? JSON.stringify({ text })
      : JSON.stringify({ channel, conversationId, text });

    try {
      setSending(true);
      setError(null);

      const response = await fetch(url, {
        body,
        headers: buildHeaders(),
        method: 'POST',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      return {
        message: {
          ...optimisticMsg,
          id: data.messageId || data.id || optimisticMsg.id,
          status: 'delivered',
        },
        success: true,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al enviar mensaje');
      setError(error);
      return { message: optimisticMsg, success: false };
    } finally {
      setSending(false);
    }
  };

  return { error, sendMessage, sending };
}
