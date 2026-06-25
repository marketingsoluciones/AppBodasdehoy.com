'use client';

/**
 * useWhatsAppTemplates — listar plantillas HSM aprobadas del workspace para
 * componer mensajes WhatsApp cuando la ventana de 24h ha expirado.
 *
 * api-mcp commit 7d52fec (25-jun): `getWhatsAppTemplates` lee directamente
 * la WABA (Meta Graph API) con las credenciales del whitelabel del tenant.
 *
 * Cache simple in-memory por sesión (las plantillas cambian raramente, Meta
 * aprueba en horas/días). TTL 5 minutos.
 */
import { useEffect, useState } from 'react';

import { callMcpGraphQL } from '@bodasdehoy/shared/crm-ui';

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category?: string | null;
  status?: string | null;
  parameters: string[];
  /** Componentes crudos de Meta (header/body/footer/buttons). */
  components?: Array<Record<string, unknown>> | null;
}

const GQL_GET_WHATSAPP_TEMPLATES = `
query GetWhatsAppTemplates {
  getWhatsAppTemplates {
    success
    errors { field message code }
    total
    templates {
      name
      language
      category
      status
      parameters
      components
    }
  }
}
`;

interface CacheEntry {
  data: WhatsAppTemplate[];
  fetchedAt: number;
}
const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

/** Extrae el texto del componente BODY de una plantilla Meta normalizada. */
export function templateBodyText(t: WhatsAppTemplate): string {
  if (!t.components) return '';
  for (const c of t.components) {
    const type = (c as any)?.type?.toUpperCase?.();
    const text = (c as any)?.text;
    if (type === 'BODY' && typeof text === 'string') return text;
  }
  return '';
}

export function useWhatsAppTemplates(enabled: boolean = true) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const cached = cache.get('default');
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
      setTemplates(cached.data);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await callMcpGraphQL<{
          getWhatsAppTemplates: {
            success: boolean;
            errors: any[] | null;
            total: number;
            templates: WhatsAppTemplate[];
          };
        }>(GQL_GET_WHATSAPP_TEMPLATES, {});

        if (cancelled) return;

        const list = data?.getWhatsAppTemplates?.templates ?? [];
        // Solo APPROVED (Meta puede tener PENDING/REJECTED en la lista).
        const approved = list.filter((t) => (t.status ?? '').toUpperCase() === 'APPROVED');
        cache.set('default', { data: approved, fetchedAt: Date.now() });
        setTemplates(approved);
        setError(null);
      } catch (e: any) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { templates, loading, error };
}

/** Es WhatsApp y la ventana de 24h ha expirado (último inbound > 24h). */
export function isWhatsAppWindowExpired(
  channel: string | undefined,
  lastInboundAt: string | null | undefined,
): boolean {
  if (channel !== 'whatsapp') return false;
  if (!lastInboundAt) return true; // sin inbound previo → ventana cerrada por defecto
  const last = new Date(lastInboundAt).getTime();
  if (Number.isNaN(last)) return false;
  const diffMs = Date.now() - last;
  return diffMs > 24 * 60 * 60 * 1000;
}
