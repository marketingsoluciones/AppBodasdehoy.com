import type { ChannelKind } from '../hooks/useRecentConversations';

/**
 * Fuente ÚNICA de la clasificación de canal de conversaciones.
 *
 * Antes esta lógica estaba DUPLICADA en `useConversations` (rail del detalle) y
 * `useRecentConversations` (feed de /bandeja): misma lista de canales y mismo criterio
 * copiados en dos sitios → podían divergir (p.ej. añadir un canal en uno y no en el otro,
 * reintroduciendo el bug A2 de conteos/clasificación incoherentes). Aquí queda en un solo
 * lugar para que ambos hooks NO puedan volver a divergir.
 */

/** Canales "otros" (no-WhatsApp) reconocidos. */
export const KNOWN_OTHER_CHANNELS: readonly ChannelKind[] = [
  'instagram',
  'telegram',
  'email',
  'web',
  'facebook',
];

// Canales que el endpoint "otros" (`/api/messages/conversations`) SÍ puede devolver ya
// clasificados y que debemos honrar tal cual — 'whatsapp' incluido. BUG 2-sep: api-ia
// devuelve WhatsApp-QR como `{channel:'whatsapp', channelType:'WEB_QR'}` (correcto), pero
// 'whatsapp' NO estaba en el set reconocido → caía al cajón 'web' (naranja) e ignoraba el
// channelType. Resultado: conversaciones QR reales pintadas como "Web", separadas de las de
// Meta, y sin salir al filtrar "WA". El dato del backend es correcto; solo faltaba honrarlo.
const CLASSIFIABLE_SET = new Set<string>([...KNOWN_OTHER_CHANNELS, 'whatsapp']);

/**
 * ¿La vista corresponde a WhatsApp? Llega como kind `'whatsapp'`, como channelParam
 * `'wa-{id}'` (URL del detalle) o como `null`/`undefined` (feed sin canal). Los tres pegan
 * al endpoint WA y clasifican como `'whatsapp'`.
 */
export function isWhatsAppView(channel: string | null | undefined): boolean {
  return channel === 'whatsapp' || !!channel?.startsWith('wa-') || !channel;
}

/**
 * Clasifica el canal de una conversación en la vista "otros" (no-WA). Toma
 * `channel`/`platform` del raw; desconocido o ausente → `'web'` (cajón por defecto).
 */
export function classifyOtherChannel(rawChannel?: unknown, rawPlatform?: unknown): ChannelKind {
  const raw = String(rawChannel || rawPlatform || 'web');
  return (CLASSIFIABLE_SET.has(raw) ? raw : 'web') as ChannelKind;
}
