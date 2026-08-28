'use client';

import { useState } from 'react';

import { buildHeaders, jidToPhone, parseWhatsAppConversationId } from '../utils/auth';
import type { Message } from './useMessages';

/**
 * Envío HSM template (WA ventana 24h cerrada). Shape confirmado 15-jul en
 * auditoría READ-ONLY de api-ia (`api/whatsapp_endpoints.py`):
 *   POST /api/whatsapp/messages/template?development={dev}
 *   body: { phone_number, template_name, language_code, parameters: string[] }
 *   response: { success, message: { messageId, ... }, error? }
 */
export interface WhatsAppTemplateSend {
  templateName: string;
  languageCode: string;
  parameters: string[];
}

/**
 * Emisor elegido en el selector "Enviar desde".
 *
 * api-ia lo acepta desde el 28-ago (commit 21112de) con campos OPCIONALES: sin emisor sale por
 * el número por defecto del whitelabel, que es el comportamiento de siempre.
 *   · Meta → `from_phone_number_id` (phoneNumberId del número)
 *   · QR   → `session_key` (sesión de WhatsApp-web; esas sesiones viven en api-mcp)
 * Se manda solo el campo que corresponde: enviar los dos a la vez no está definido.
 */
export interface WhatsAppSender {
  kind: 'meta' | 'qr';
  /** phoneNumberId (Meta) o sessionKey (QR), según kind. */
  value: string;
}

// Construye URL + body para enviar. 🐛 FIX (informe 2026-06-12): la ruta WhatsApp anterior
// (/api/messages/whatsapp/conversations/{dev}/{to}/send) daba 404 — NO existe en api-ia.
// El endpoint REAL es POST /api/whatsapp/messages/send?development= con body {phone_number, content}
// (verificado contra el OpenAPI de api-ia). El genérico /api/messages/send da storage_unavailable (Redis).
// Además, si viene `template` → usar POST /api/whatsapp/messages/template?development= con shape HSM.
function buildSendRequest(
  channel: string,
  conversationId: string,
  text: string,
  template?: WhatsAppTemplateSend,
  sender?: WhatsAppSender,
): { body: string; url: string } | null {
  if (channel === 'whatsapp') {
    const parsed = parseWhatsAppConversationId(conversationId);
    if (!parsed) return null;
    const { dev, jid } = parsed;
    const phone = jidToPhone(jid);
    // Ventana 24h cerrada + template seleccionada → endpoint HSM.
    // Emisor elegido (si lo hay). Omitirlo = número por defecto del whitelabel.
    const senderFields = sender
      ? sender.kind === 'qr'
        ? { session_key: sender.value }
        : { from_phone_number_id: sender.value }
      : {};
    if (template) {
      return {
        body: JSON.stringify({
          ...senderFields,
          language_code: template.languageCode,
          parameters: template.parameters,
          phone_number: phone,
          template_name: template.templateName,
        }),
        url: `/api/messages/whatsapp/messages/template?development=${encodeURIComponent(dev)}`,
      };
    }
    // Vía el proxy /api/messages/whatsapp/* → el route.ts lo mapea a MCP /api/whatsapp/*
    // (quita "whatsapp/" y antepone el origin MCP). Así se aplican auth/headers del proxy.
    // El endpoint real es /api/whatsapp/messages/send con body {phone_number, content}.
    return {
      body: JSON.stringify({ ...senderFields, content: text, phone_number: phone }),
      url: `/api/messages/whatsapp/messages/send?development=${encodeURIComponent(dev)}`,
    };
  }
  // Genérico (no-WhatsApp) → api-ia. El development viaja por el header X-Development
  // (buildHeaders + proxy lo propaga). Verificado 15-jun: el header basta (send → 200), ya
  // no hace falta ?development= en query.
  return {
    body: JSON.stringify({ channel, conversationId, text }),
    url: `/api/messages/send`,
  };
}

export function useSendMessage() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = async (
    channel: string,
    conversationId: string,
    text: string,
    template?: WhatsAppTemplateSend,
    sender?: WhatsAppSender,
  ): Promise<{ message: Message; success: boolean }> => {
    const optimisticMsg: Message = {
      fromUser: false, // false = mensaje enviado por ti (outbound)
      id: `msg_pending_${Date.now()}`,
      status: 'sent',
      text,
      timestamp: new Date().toISOString(),
    };

    const req = buildSendRequest(channel, conversationId, text, template, sender);
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
