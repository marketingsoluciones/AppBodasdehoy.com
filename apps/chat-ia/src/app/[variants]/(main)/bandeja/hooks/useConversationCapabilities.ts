import { useEffect, useState } from 'react';

import { buildHeaders } from '../utils/auth';

/**
 * HD-01: capacidades REALES por conversación (api-ia, EN PROD 25-jul).
 *   GET /api/backend/api/conversations/{convId}/capabilities?channel=&phone=
 *   (via proxy /api/backend → añade X-Internal-Secret; directo da "secreto interno inválido").
 *
 * Sustituye la inferencia por jidType/ventana-24h por la política real del backend.
 * ⚠️ CABLEADO EN RAMA (no desplegado): pendiente que api-ia confirme el SHAPE exacto de
 * la respuesta. El parseo es tolerante (varios nombres de campo) para no romper.
 */
export interface ConversationCapabilities {
  canAddInternalNote: boolean;
  canAttachFiles: boolean;
  canReplyFreeText: boolean;
  channelType?: string;
  readOnlyReason?: string | null;
  requiresTemplate: boolean;
}

const b = (v: any, def: boolean) => (typeof v === 'boolean' ? v : def);

function parseCaps(raw: any): ConversationCapabilities | null {
  const d = raw?.data ?? raw?.capabilities ?? raw;
  if (!d || typeof d !== 'object') return null;
  return {
    canAddInternalNote: b(d.canAddInternalNote ?? d.can_add_internal_note, true),
    canAttachFiles: b(d.canAttachFiles ?? d.can_attach_files, true),
    canReplyFreeText: b(d.canReplyFreeText ?? d.can_reply_free_text, true),
    channelType: d.channelType ?? d.channel_type ?? d.channel,
    readOnlyReason: d.readOnlyReason ?? d.read_only_reason ?? null,
    requiresTemplate: b(d.requiresTemplate ?? d.requires_template, false),
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
        /* sin capabilities → el composer usa su derivación por canal (jidType/24h) */
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
