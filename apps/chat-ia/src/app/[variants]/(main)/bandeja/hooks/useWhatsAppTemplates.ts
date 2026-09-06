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

import { getUserContext } from '../utils/auth';

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
query GetWhatsAppTemplates($developerId: String!) {
  getWhatsAppTemplates(developerId: $developerId) {
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

/**
 * Cuenta los placeholders únicos `{{N}}` presentes en el texto (Meta HSM).
 * Devuelve el nº máximo, no la cantidad — `"Hola {{1}}, tu pedido {{3}}"` → 3.
 * Meta permite huecos: los placeholders no tienen por qué ser consecutivos.
 */
export function templateParamCount(body: string): number {
  if (!body) return 0;
  let max = 0;
  const re = /\{\{\s*(\d+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

/**
 * Sustituye `{{1}}`, `{{2}}`... por los valores dados. Índices vacíos se
 * conservan como placeholder — así el usuario ve qué falta por rellenar.
 */
export function templateFillParams(body: string, values: string[]): string {
  if (!body) return '';
  return body.replaceAll(/\{\{\s*(\d+)\s*\}\}/g, (match, num) => {
    const i = Number(num) - 1;
    const v = values[i];
    return v && v.trim() ? v : match;
  });
}

export function useWhatsAppTemplates(enabled: boolean = true) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // getWhatsAppTemplates(developerId: String!) exige el development como argumento — sin él,
    // api-mcp responde 400 "argument developerId is required" (origen del toast "[crm-ui] HTTP 400").
    const { development } = getUserContext();
    if (!development) return;

    const cached = cache.get(development);
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
        }>(GQL_GET_WHATSAPP_TEMPLATES, { developerId: development });

        if (cancelled) return;

        const list = data?.getWhatsAppTemplates?.templates ?? [];
        // Solo APPROVED (Meta puede tener PENDING/REJECTED en la lista).
        const approved = list.filter((t) => (t.status ?? '').toUpperCase() === 'APPROVED');
        cache.set(development, { data: approved, fetchedAt: Date.now() });
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
