'use client';

import { useState } from 'react';

import { buildHeaders, getUserContext, jidToPhone, parseWhatsAppConversationId } from '../utils/auth';
import type { Message } from './useMessages';

// Construye URL + body para enviar. 🐛 FIX (informe 2026-06-12): la ruta WhatsApp anterior
// (/api/messages/whatsapp/conversations/{dev}/{to}/send) daba 404 — NO existe en api-ia.
// El endpoint REAL es POST /api/whatsapp/messages/send?development= con body {phone_number, content}
// (verificado contra el OpenAPI de api-ia). El genérico /api/messages/send da storage_unavailable (Redis).
function buildSendRequest(
  channel: string,
  conversationId: string,
  text: string,
): { body: string; url: string } | null {
  if (channel === 'whatsapp') {
    const parsed = parseWhatsAppConversationId(conversationId);
    if (!parsed) return null;
    const { dev, jid } = parsed;
    const phone = jidToPhone(jid);
    // Vía el proxy /api/messages/whatsapp/* → el route.ts lo mapea a MCP /api/whatsapp/*
    // (quita "whatsapp/" y antepone el origin MCP). Así se aplican auth/headers del proxy.
    // El endpoint real es /api/whatsapp/messages/send con body {phone_number, content}.
    return {
      body: JSON.stringify({ content: text, phone_number: phone }),
      url: `/api/messages/whatsapp/messages/send?development=${encodeURIComponent(dev)}`,
    };
  }
  // Genérico (no-WhatsApp): api-ia exige development o devuelve 400 development_required.
  // Lo enviamos también por query (api-ia lo prioriza sobre el header X-Development).
  const dev = getUserContext().development;
  const qs = dev ? `?development=${encodeURIComponent(dev)}` : '';
  return {
    body: JSON.stringify({ channel, conversationId, text }),
    url: `/api/messages/send${qs}`,
  };
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

    const req = buildSendRequest(channel, conversationId, text);
    if (!req) {
      return { message: optimisticMsg, success: false };
    }
    const { url, body } = req;

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
