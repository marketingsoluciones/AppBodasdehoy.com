import { getAuthToken } from '@/utils/authToken';

/**
 * Lee el contexto del usuario desde dev-user-config:
 * userId, development, role
 */
function getUserContext(): { development?: string; role?: string, userId?: string; } {
  if (typeof window === 'undefined') return {};
  try {
    const config = localStorage.getItem('dev-user-config');
    if (config) {
      const parsed = JSON.parse(config);
      return {
        development: parsed?.development,
        role: parsed?.role,
        userId: parsed?.userId,
      };
    }
  } catch {}
  return {};
}

/**
 * Headers completos para llamadas al proxy /api/messages.
 * Incluye Authorization + X-Development + X-User-ID + X-Role
 * para que api-ia y MCP puedan aplicar visibilidad por perfil.
 */
export function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const { userId, development, role } = getUserContext();
  if (development) headers['X-Development'] = development;
  if (userId) headers['X-User-ID'] = userId;
  if (role) headers['X-Role'] = role;

  return headers;
}

/**
 * Parsea el conversationId de WhatsApp: "${dev}:${jid}"
 * Retorna { dev, jid } o null si el formato no es válido
 */
export function parseWhatsAppConversationId(conversationId: string): { dev: string; jid: string } | null {
  const idx = conversationId.indexOf(':');
  if (idx < 0) return null;
  return {
    dev: conversationId.slice(0, idx),
    jid: conversationId.slice(idx + 1),
  };
}

/**
 * Extrae el número de teléfono limpio de un JID de WhatsApp
 * "34600111222@s.whatsapp.net" → "34600111222"
 */
export function jidToPhone(jid: string): string {
  return jid.split('@')[0];
}
