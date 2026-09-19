/**
 * data/conversations — ÚNICA puerta de entrada a las conversaciones de la bandeja.
 *
 * Mejora M1 (16-09). Hasta ahora cada componente decidía por su cuenta cómo hablar con el
 * backend: 19 ficheros llamaban al proxy REST de api-ia y 7 iban por GraphQL a api-mcp, cada
 * uno con sus headers y su forma de leer la respuesta. Los tres fallos del 15-09 fueron el
 * mismo fallo tres veces: una llamada que no mandaba credenciales (ia-config), otra que
 * tampoco (sesión de WhatsApp) y un campo que solo normalizaba este hook (`shared_with`).
 * Centralizar cierra esa CLASE de error, no cada caso.
 *
 * Reglas de la capa:
 *   1. Las credenciales las pone SIEMPRE esta capa (buildHeaders), nunca quien llama.
 *   2. La forma de `Conversation` se decide aquí y en ningún otro sitio.
 *   3. Los componentes no hacen fetch de conversaciones: piden a esta capa.
 */

import { buildHeaders } from '../utils/auth';
import { classifyOtherChannel, isWhatsAppView } from '../utils/channelClassify';
import { dedupeFetch } from '../utils/dedupeFetch';
import { friendlyContactName, inferJidType, safePhoneOrEmpty } from '../utils/jid';
import { readSharedWith, type SharedPrincipal } from '../utils/visibility';



export interface Conversation {
  /** FASE 2 Agentes: agente IA responsable (distinto de assignedToUserId=humano).
   *  Null-safe hasta que backend lo expone; ya LIVE en api-ia (17-ago). */
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  /** ISO de cuando se asigno el responsable. Lo manda api-ia y no se tipaba. */
  assignedAt?: string | null;
  assignedToUserId?: string | null;
  /** Como llego a ser responsable: MANUAL | HANDOFF | AUTO
   *  (api-ia, messages_with_whitelabel_storage.py:78). Necesario para auditar que hace
   *  la IA en nombre del usuario. */
  assignmentSource?: string | null;
  channel: 'whatsapp' | 'instagram' | 'telegram' | 'email' | 'web' | 'facebook';
  /** Multicanal (api-ia b6d1823): id de la línea receptora + su tipo.
   *  channelType: 'WAB' = Meta Business API · 'WEB_QR' = WhatsApp QR (vinculado). */
  channelId?: string | null;
  channelType?: 'WAB' | 'WEB_QR' | string | null;
  contact: {
    avatar?: string;
    name: string;
    phone?: string;
    username?: string;
  };
  /** FASE B v2.0 — api-mcp commit 7d52fec (25-jun): RSVP del invitado
   *  resuelto desde el evento vinculado por teléfono. null si no aplica. */
  guestStatus?: 'confirmed' | 'pending' | 'declined' | null;
  id: string;
  jidRaw?: string | null;
  /** api-mcp jidType: user | group | newsletter | broadcast | lid | unknown.
   *  Si != 'user', phoneNumber NO es un teléfono real. */
  jidType?: string | null;
  labels?: any[];
  lastInboundAt?: string;
  lastMessage: {
    fromUser: boolean;
    text: string;
    timestamp: string;
  };
  lastOutboundAt?: string;
  linkedContactId?: string | null;
  linkedEventId?: string | null;
  /** Con quién está compartida (api-mcp `shared_with`). El payload ya lo traía; el
   *  normalizador lo descartaba, así que la UI nunca supo si una conversación era
   *  visible para más gente (auditoría 15-09, Problema 1). */
  sharedWith?: SharedPrincipal[];
  status?: string;
  unreadCount: number;
  unreadCountForAgent?: number;
}

/**
 * Normaliza una conversación venga de donde venga.
 *
 * api-mcp manda displayName/contactInfo/phoneNumber; api-ia manda contact:{name,phone} y
 * snake_case en varios campos. Sin esto, una conversación de api-ia se pintaba "Desconocido".
 *
 * @param isWaView en la vista WhatsApp todo es 'whatsapp'; en "otros", lo desconocido cae a
 *   'web' (mismo criterio que el feed: si no, la conversación se pierde al abrirla).
 */
export function normalizeConversation(c: any, isWaView: boolean): Conversation {
  // api-mcp manda displayName/contactInfo/phoneNumber; api-ia manda contact:{name,phone}.
  const rawPhone = c.phoneNumber ?? c.contact?.phone ?? null;
  const rawName = c.displayName || c.contactInfo?.name || c.contact?.name || rawPhone || '';
  const jidType = inferJidType(c.jidType ?? c.jid_type, rawName, rawPhone);
  // Misma clasificación que el feed: en vista WA todo es 'whatsapp'; en "otros", lo
  // desconocido cae a 'web'. Si esto cambia, la conversación se pierde al abrirla.
  const kind = isWaView ? 'whatsapp' : classifyOtherChannel(c.channel, c.platform);

  return {
    // Responsable = agente IA (null-safe), distinto del responsable humano.
    assignedAgentId: c.assignedAgentId ?? c.assigned_agent_id ?? null,
    assignedAgentName: c.assignedAgentName ?? c.assigned_agent_name ?? null,
    assignedAt: c.assignedAt ?? c.assigned_at ?? null,
    assignedToUserId: c.assignedUserId ?? c.assigned_to ?? c.assignedTo ?? null,
    assignmentSource: c.assignmentSource ?? c.assignment_source ?? null,
    channel: kind as Conversation['channel'],
    // Multicanal: qué línea recibió el mensaje y de qué tipo es (QR vs Meta API).
    channelId: c.channelId ?? c.channel_id ?? null,
    channelType: c.channelType ?? c.channel_type ?? null,
    contact: {
      name: friendlyContactName(rawName, rawPhone, jidType),
      phone: safePhoneOrEmpty(rawPhone, jidType),
    },
    guestStatus: (c.guestStatus ?? c.guest_status ?? null) as
      | 'confirmed'
      | 'pending'
      | 'declined'
      | null,
    id: c.conversationId || c.id,
    jidRaw: c.jidRaw ?? c.jid_raw ?? null,
    jidType,
    labels: c.labels ?? c.labelIds ?? c.label_ids ?? undefined,
    lastInboundAt: c.lastInboundAt ?? c.last_inbound_at ?? undefined,
    lastMessage: {
      fromUser: c.lastMessageFromMe === false,
      text: c.lastMessage || '',
      timestamp: c.lastMessageAt || c.updatedAt || new Date().toISOString(),
    },
    lastOutboundAt: c.lastOutboundAt ?? c.last_outbound_at ?? undefined,
    linkedContactId: c.linkedContactId ?? c.linked_contact_id ?? null,
    linkedEventId: c.linkedEventId ?? c.linked_event_id ?? null,
    sharedWith: readSharedWith(c),
    status: c.status ?? c.conversationStatus ?? undefined,
    unreadCount: c.unreadCount || 0,
    unreadCountForAgent: c.unreadCountForAgent ?? c.unread_count_for_agent ?? undefined,
  };
}

export interface FetchConversationsOptions {
  /** `wa-<id>`, un canal concreto, o null para el feed. */
  channel: string | null;
  development: string;
}

/**
 * Devuelve las conversaciones ya normalizadas y filtradas por canal.
 *
 * En vista WA se devuelven TODAS: el `wa-{id}` identifica la CUENTA, no el canal de cada
 * conversación. En "otros" sí se filtra por el tipo clasificado.
 */
export async function fetchConversations({
  channel,
  development,
}: FetchConversationsOptions): Promise<Conversation[]> {
  const isWaView = isWhatsAppView(channel);
  const url = isWaView
    ? `/api/messages/whatsapp/conversations/${development}`
    : `/api/messages/conversations?development=${development}`;

  const response = await dedupeFetch(url, { headers: buildHeaders() });
  if (!response.ok) {
    const error = new Error(`conversations ${response.status}`);
    (error as any).status = response.status;
    throw error;
  }

  const data = await response.json();
  const rawList = Array.isArray(data) ? data : data.conversations || [];
  const normalized: Conversation[] = rawList.map((c: any) => normalizeConversation(c, isWaView));

  if (isWaView) return normalized;
  return channel ? normalized.filter((x) => x.channel === channel) : normalized;
}

export {type SharedPrincipal} from '../utils/visibility';