/**
 * data/conversationMeta — estado y responsable de una conversación, EN EL SERVIDOR.
 *
 * M2 (16-09). Hasta ahora esto vivía solo en `localStorage` (`inbox_conversation_meta`), y
 * eso tiene una consecuencia que no se ve en una demo con un usuario: **cada agente veía un
 * estado distinto**. Si alguien marcaba una conversación como cerrada o se la asignaba, el
 * resto del equipo seguía viéndola abierta y sin dueño, y al cambiar de navegador se perdía
 * todo. Una bandeja compartida en la que el equipo no comparte el estado no es una bandeja.
 *
 * api-mcp ya tenía las dos mutaciones. Aquí se envuelven para que el hook escriba en el
 * servidor y localStorage quede solo como respuesta inmediata mientras llega la confirmación.
 */

import {
  assignConversationToUser,
  setConversationStatus,
  type ConversationServerStatus,
} from '@/services/mcpApi/whatsapp';

/** Estados que maneja la interfaz de la bandeja. */
export type InboxStatus = 'closed' | 'open' | 'pending';

const TO_SERVER: Record<InboxStatus, ConversationServerStatus> = {
  closed: 'CLOSED',
  open: 'OPEN',
  pending: 'PENDING',
};

/** Traduce el estado del servidor al de la interfaz; null si no es uno de los tres. */
export function fromServerStatus(status: string | null | undefined): InboxStatus | null {
  const s = String(status ?? '').toLowerCase();
  return s === 'open' || s === 'pending' || s === 'closed' ? (s as InboxStatus) : null;
}

/**
 * Archiva o desarchiva para TODO el equipo.
 *
 * Archivar vivía solo en `localStorage` (17-09): cada persona archivaba en su navegador y
 * el resto seguía viendo la conversación en la bandeja. api-mcp admite el estado `ARCHIVED`
 * desde hace tiempo; al desarchivar se vuelve a `ACTIVE`, igual que hace `reopenConversation`.
 */
export async function persistArchived(
  conversationId: string,
  archived: boolean,
): Promise<boolean> {
  try {
    return await setConversationStatus(conversationId, archived ? 'ARCHIVED' : 'ACTIVE');
  } catch {
    return false;
  }
}

/** Guarda el estado para TODO el equipo. false si el servidor lo rechaza. */
export async function persistStatus(
  conversationId: string,
  status: InboxStatus,
): Promise<boolean> {
  try {
    return await setConversationStatus(conversationId, TO_SERVER[status]);
  } catch {
    return false;
  }
}

/** Guarda el responsable humano para TODO el equipo. userId null = desasignar. */
export async function persistAssignee(
  conversationId: string,
  userId: string | null,
): Promise<boolean> {
  try {
    return await assignConversationToUser(conversationId, userId);
  } catch {
    return false;
  }
}
