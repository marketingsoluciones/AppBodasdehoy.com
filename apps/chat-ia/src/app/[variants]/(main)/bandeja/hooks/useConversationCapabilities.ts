import { useEffect, useState } from 'react';

import { buildHeaders } from '../utils/auth';

/**
 * HD-01: capacidades REALES por conversación (api-ia, EN PROD 25-jul).
 *   GET /api/backend/api/conversations/{convId}/capabilities?channel=&phone=
 *   (via proxy /api/backend → añade X-Internal-Secret; directo da "secreto interno inválido").
 *
 * SHAPE REAL (verificado en api-ia conversation_capabilities.py):
 *   { channel, canReplyFreeText, requiresTemplate, readOnlyReason, windowExpiresAt }
 * Es la política autoritativa de la ventana 24h de WhatsApp (sustituye la heurística
 * local isWhatsAppWindowExpired por la verdad del backend). NO trae canAddInternalNote:
 * la nota interna siempre está disponible (equipo), así que el composer nunca queda 100%
 * read-only por capabilities — como mucho "solo plantilla".
 */
export interface ConversationCapabilities {
  canReplyFreeText: boolean;
  channel?: string;
  readOnlyReason?: string | null;
  requiresTemplate: boolean;
  windowExpiresAt?: string | null;
}

const bool = (v: any, def: boolean) => (typeof v === 'boolean' ? v : def);

function parseCaps(raw: any): ConversationCapabilities | null {
  const d = raw?.data ?? raw?.capabilities ?? raw;
  if (!d || typeof d !== 'object') return null;
  // Requiere al menos uno de los campos clave para considerarlo respuesta válida.
  if (typeof d.canReplyFreeText !== 'boolean' && typeof d.requiresTemplate !== 'boolean') {
    return null;
  }
  return {
    canReplyFreeText: bool(d.canReplyFreeText, true),
    channel: d.channel,
    readOnlyReason: d.readOnlyReason ?? null,
    requiresTemplate: bool(d.requiresTemplate, false),
    windowExpiresAt: d.windowExpiresAt ?? null,
  };
}

export function useConversationCapabilities(
  conversationId: string,
  channel: string,
  phone?: string,
): { capabilities: ConversationCapabilities | null; loading: boolean } {
  const [capabilities, setCapabilities] = useState<ConversationCapabilities | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const qs = new URLSearchParams({ channel });
        if (phone) qs.set('phone', phone);
        const res = await fetch(
          `/api/backend/api/conversations/${encodeURIComponent(conversationId)}/capabilities?${qs.toString()}`,
          { credentials: 'include', headers: buildHeaders() },
        );
        if (!res.ok || cancelled) return;
        const json = await res.json();
        const caps = parseCaps(json);
        if (!cancelled && caps) setCapabilities(caps);
      } catch {
        /* sin capabilities → el composer usa su derivación local (ventana 24h) */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, channel, phone]);

  return { capabilities, loading };
}
