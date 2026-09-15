import { buildAuthHeaders } from '@/utils/authToken';

import { mcpClient } from './client';

// Matches real MCP schema: WhatsAppSession GraphQL type
export type WhatsAppChannelType = 'WAB' | 'QR_WHITELABEL' | 'QR_USER';
export type WhatsAppChannelStatus = 'ACTIVE' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';
export type WhatsAppMemberRole = 'ADMIN' | 'AGENT' | 'READONLY';

export interface WhatsAppChannelMember {
  channelId: string;
  grantedAt?: string;
  grantedBy: string;
  id: string;
  isActive: boolean;
  role: WhatsAppMemberRole;
  userId: string;
}

export interface WhatsAppChannel {
  createdAt?: string;
  development: string;
  displayName?: string;
  id: string;
  isConnected?: boolean;
  name: string;
  phoneNumber?: string;
  sessionKey?: string;
  status: WhatsAppChannelStatus;
  type: string;
}

// NOTE: whatsappGetAllSessions does not exist in the MCP schema (only whatsappGetSession).
// getWhatsAppChannels tries GraphQL (multi-channel) then falls back to REST session.

const GET_WA_CHANNELS = `
  query GetWhatsAppChannels {
    getWhatsAppChannels { development id name phoneNumber status type }
  }
`;

// El envío de WhatsApp NO pasa por GraphQL. Va por REST, vía el proxy de
// /api/messages/* (ver `bandeja/hooks/useSendMessage.ts`), que sí aplica el
// gate de sesión de N32.
//
// Aquí vivía `whatsappSendMessage` + su helper `sendWhatsAppMessage()`. Se
// borran (QA 15-09): la auditoría READ-ONLY de api-mcp del 15-jul confirmó que
// ese resolver (evento-mutations.resolver.ts:2575) SOLO LOGUEA y devuelve un
// `{success:true, sent:true}` engañoso — nunca envía nada. El helper no tenía
// callers, así que era una trampa esperando a que alguien la cableara: un
// backend que responde «enviado» sin enviar no deja rastro de error en ninguna
// parte. El resolver real, si algún día se necesita por GraphQL, es
// `sendWhatsAppMessage(developerId, to, message: WhatsAppMessageInput!)`
// (whatsapp.ts:841), con otra forma.

const DISCONNECT_WA_SESSION = `
  mutation DisconnectWASession($args: DisconnectWhatsAppSessionArgs) {
    whatsappDisconnectSession(args: $args)
  }
`;

const CREATE_WA_SESSION = `
  mutation CreateWASession($args: CreateWhatsAppSessionArgs) {
    whatsappCreateSession(args: $args)
  }
`;

const REGENERATE_QR = `
  mutation RegenerateQR($sessionId: String) {
    whatsappRegenerateQR(sessionId: $sessionId)
  }
`;

function mapStatus(raw: boolean | string | undefined): WhatsAppChannelStatus {
  if (raw === true || raw === 'connected' || raw === 'ACTIVE') return 'ACTIVE';
  if (raw === 'connecting' || raw === 'CONNECTING') return 'CONNECTING';
  if (raw === 'error' || raw === 'ERROR') return 'ERROR';
  return 'DISCONNECTED';
}

function sessionToChannel(s: any, fallbackDev?: string): WhatsAppChannel {
  return {
    development: s.development || fallbackDev || 'bodasdehoy',
    displayName: s.phoneNumber || undefined,
    id: s.id || s.sessionKey || s.development || 'whatsapp',
    isConnected: typeof s.isConnected === 'boolean' ? s.isConnected : s.status === 'connected',
    name: s.phoneNumber || 'WhatsApp',
    phoneNumber: s.phoneNumber || undefined,
    sessionKey: s.id || s.sessionKey || s.development,
    status: mapStatus(s.isConnected ?? s.status),
    type: 'QR_USER',
  };
}

// ─── In-memory cache for getWhatsAppChannels (avoids duplicate calls per render cycle) ──
let _channelsCache: { data: WhatsAppChannel[]; dev: string; ts: number } | null = null;
const CHANNELS_CACHE_TTL = 10_000; // 10s

/** Returns WhatsApp channels — tries GraphQL (multi-channel) then REST session fallback, plus WAB config. */
export async function getWhatsAppChannels(development?: string): Promise<WhatsAppChannel[]> {
  const dev = development || 'bodasdehoy';

  // Return cached result if fresh (prevents duplicate calls from multiple hooks)
  if (_channelsCache && _channelsCache.dev === dev && Date.now() - _channelsCache.ts < CHANNELS_CACHE_TTL) {
    return _channelsCache.data;
  }

  const channels: WhatsAppChannel[] = [];

  // 1. GraphQL + REST + WAB in parallel for speed
  const [gqlResult, restResult, wabResult] = await Promise.allSettled([
    // GraphQL multi-channel
    mcpClient.query<{ getWhatsAppChannels: WhatsAppChannel[] }>(GET_WA_CHANNELS, {})
      .then((data) => (Array.isArray(data.getWhatsAppChannels) ? data.getWhatsAppChannels : []))
      .catch(() => [] as WhatsAppChannel[]),
    // REST Baileys session — 3s timeout to avoid blocking UI when Baileys is reconnecting
    // Auditoría 15-09: sin Authorization el gate del proxy (N32) responde 401 y la
    // sesión Baileys (QR personal de la marca) desaparecía de Integraciones.
    fetch(`/api/messages/whatsapp/session/${dev}`, {
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      signal: AbortSignal.timeout(3_000),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const sess = await res.json();
        return sess?.success ? sessionToChannel({ ...sess, id: sess.sessionKey || dev }, dev) : null;
      })
      .catch(() => null),
    // WAB config (Meta Business API)
    getWhatsAppBusinessConfig(dev).catch(() => null),
  ]);

  // Merge GraphQL channels
  const gqlChannels = gqlResult.status === 'fulfilled' ? gqlResult.value : [];
  if (gqlChannels.length > 0) channels.push(...gqlChannels);

  // Add REST session if not already covered by GraphQL
  const restChannel = restResult.status === 'fulfilled' ? restResult.value : null;
  if (restChannel && !channels.some((ch) => ch.type === 'QR_USER' || ch.type === 'QR_WHITELABEL')) {
    channels.push(restChannel);
  }

  // Add WAB if not already present
  // NOTE: getWhatsAppConfig resolver in MCP currently returns success:false even though
  // whatsappconfigs collection has the data. When MCP fixes this, WAB channel will appear.
  const wabConfig = wabResult.status === 'fulfilled' ? wabResult.value : null;
  if (wabConfig && wabConfig.isActive && !channels.some((ch) => ch.type === 'WAB')) {
    channels.push({
      development: dev,
      displayName: wabConfig.phoneNumberId,
      id: `wab-${dev}`,
      isConnected: true,
      name: 'WhatsApp Business',
      phoneNumber: wabConfig.phoneNumberId,
      status: 'ACTIVE',
      type: 'WAB',
    });
  }

  _channelsCache = { data: channels, dev, ts: Date.now() };
  return channels;
}

/** Invalidate the channels cache (call after connect/disconnect) */
export function invalidateChannelsCache() {
  _channelsCache = null;
}

/** Disconnect a WhatsApp session */
export async function disconnectWhatsAppSession(sessionId: string): Promise<boolean> {
  try {
    const data = await mcpClient.query<{ whatsappDisconnectSession: string }>(DISCONNECT_WA_SESSION, {
      args: { sessionId },
    });
    return !!data.whatsappDisconnectSession;
  } catch {
    return false;
  }
}

/** Create a new WhatsApp session */
export async function createWhatsAppSession(
  sessionId: string,
  development: string,
  userId?: string,
  phoneNumber?: string,
): Promise<boolean> {
  try {
    const data = await mcpClient.query<{ whatsappCreateSession: string }>(CREATE_WA_SESSION, {
      args: { development, phoneNumber, sessionId, userId },
    });
    return !!data.whatsappCreateSession;
  } catch {
    return false;
  }
}

/** Regenerate QR code for a session */
export async function regenerateWhatsAppQR(sessionId: string): Promise<boolean> {
  try {
    const data = await mcpClient.query<{ whatsappRegenerateQR: string }>(REGENERATE_QR, { sessionId });
    return !!data.whatsappRegenerateQR;
  } catch {
    return false;
  }
}

// ─── WhatsApp Business API (WAB) config ──────────────────────────────────────

const GET_WAB_CONFIG = `
  query GetWhatsAppConfig($developerId: String!) {
    getWhatsAppConfig(developerId: $developerId) {
      success
      config {
        phoneNumberId
        developerId
        isActive
      }
    }
  }
`;

export interface WabConfig {
  developerId: string;
  isActive: boolean;
  phoneNumberId: string;
}

/** Fetch WAB (Meta Business API) config for a development. Returns null if not configured. */
export async function getWhatsAppBusinessConfig(developerId: string): Promise<WabConfig | null> {
  try {
    const data = await mcpClient.query<{
      getWhatsAppConfig: { config: WabConfig | null; success: boolean };
    }>(GET_WAB_CONFIG, { developerId });
    if (data.getWhatsAppConfig?.success && data.getWhatsAppConfig.config) {
      return data.getWhatsAppConfig.config;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Channel management GraphQL ───────────────────────────────────────────────

// Fix 15-jul (auditoría READ-ONLY api-mcp): el nombre real del input en el
// schema es `WhatsAppCreateChannelInput` (typeDefs/whatsapp.ts:520), NO
// `CreateWhatsAppChannelInput` como usábamos antes → devolvía `Unknown type`
// en todos los tenants. Ver bloque catch abajo (mantenemos el fallback por
// si algún tenant legacy tiene schema aún más antiguo).
const CREATE_WA_CHANNEL = `
  mutation CreateWhatsAppChannel($input: WhatsAppCreateChannelInput!) {
    createWhatsAppChannel(input: $input) {
      channel { development id name phoneNumber status type }
      success
    }
  }
`;
const DELETE_WA_CHANNEL = `
  mutation DeleteWhatsAppChannel($channelId: ID!) {
    deleteWhatsAppChannel(channelId: $channelId) { success }
  }
`;
const GET_WA_MEMBERS = `
  query GetWhatsAppChannelMembers($channelId: ID!) {
    getWhatsAppChannelMembers(channelId: $channelId) { channelId grantedAt grantedBy id isActive role userId }
  }
`;
// Tipos corregidos el 16-09 contra el esquema real: el servidor declara userId String! y
// role WhatsAppChannelRole! (no ID!/String), así que tal y como estaba la mutación la
// rechazaba GraphQL por variables incompatibles antes de llegar al resolver.
const ADD_WA_MEMBER = `
  mutation AddWhatsAppChannelMember($channelId: ID!, $userId: String!, $role: WhatsAppChannelRole!) {
    addWhatsAppChannelMember(channelId: $channelId, userId: $userId, role: $role) {
      member { userId role }
      success
    }
  }
`;

export async function createWhatsAppChannel(name: string, type: string = 'QR_USER'): Promise<WhatsAppChannel | null> {
  try {
    const data = await mcpClient.query<{ createWhatsAppChannel: { channel: WhatsAppChannel; success: boolean } }>(
      CREATE_WA_CHANNEL,
      { input: { name, type } },
    );
    return data.createWhatsAppChannel?.success ? data.createWhatsAppChannel.channel : null;
  } catch (err: any) {
    const msg = (err?.message ?? '').toString();
    if (
      msg.includes('Unknown type "WhatsAppCreateChannelInput"') ||
      msg.includes('Unknown type "CreateWhatsAppChannelInput"')
    ) {
      throw new Error(
        'Tu API2 no soporta crear canales WhatsApp desde aquí (schema multi-canal no habilitado). Crea el canal desde CRM/API2 o pide a API2 habilitar el schema.',
      );
    }
    throw err;
  }
}

export async function deleteWhatsAppChannel(channelId: string): Promise<boolean> {
  try {
    const data = await mcpClient.query<{ deleteWhatsAppChannel: { success: boolean } }>(
      DELETE_WA_CHANNEL, { channelId },
    );
    return !!data.deleteWhatsAppChannel?.success;
  } catch {
    try {
      const res = await fetch(`/api/messages/whatsapp/session/${channelId}`, {
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        method: 'DELETE',
      });
      const data = await res.json().catch(() => null);
      return !!data?.success;
    } catch {
      return false;
    }
  }
}

export async function getWhatsAppChannelMembers(channelId: string): Promise<WhatsAppChannelMember[]> {
  try {
    const data = await mcpClient.query<{ getWhatsAppChannelMembers: WhatsAppChannelMember[] }>(
      GET_WA_MEMBERS, { channelId },
    );
    return data.getWhatsAppChannelMembers || [];
  } catch { return []; }
}

export async function addWhatsAppChannelMember(channelId: string, userId: string, role?: string): Promise<boolean> {
  try {
    const data = await mcpClient.query<{ addWhatsAppChannelMember: { success: boolean } }>(
      ADD_WA_MEMBER, { channelId, role, userId },
    );
    return !!data.addWhatsAppChannelMember?.success;
  } catch { return false; }
}

const UPDATE_WA_MEMBER_ROLE = `
  mutation UpdateWhatsAppChannelMemberRole($channelId: ID!, $userId: String!, $role: WhatsAppChannelRole!) {
    updateWhatsAppChannelMemberRole(channelId: $channelId, userId: $userId, role: $role) {
      error
      success
    }
  }
`;

const REMOVE_WA_MEMBER = `
  mutation RemoveWhatsAppChannelMember($channelId: ID!, $userId: String!) {
    removeWhatsAppChannelMember(channelId: $channelId, userId: $userId) {
      error
      success
    }
  }
`;

/** Roles de un miembro de canal, tal y como los define api-mcp. */
export type WhatsAppChannelRole = 'ADMIN' | 'AGENT' | 'READONLY';

/** Cambia el rol de alguien en el canal. false si el servidor lo rechaza. */
export async function updateWhatsAppChannelMemberRole(
  channelId: string,
  userId: string,
  role: WhatsAppChannelRole,
): Promise<boolean> {
  try {
    const data = await mcpClient.query<{
      updateWhatsAppChannelMemberRole: { error?: string; success: boolean };
    }>(UPDATE_WA_MEMBER_ROLE, { channelId, role, userId });
    return !!data.updateWhatsAppChannelMemberRole?.success;
  } catch {
    return false;
  }
}

/** Quita el acceso de alguien al canal. */
export async function removeWhatsAppChannelMember(
  channelId: string,
  userId: string,
): Promise<boolean> {
  try {
    const data = await mcpClient.query<{
      removeWhatsAppChannelMember: { error?: string; success: boolean };
    }>(REMOVE_WA_MEMBER, { channelId, userId });
    return !!data.removeWhatsAppChannelMember?.success;
  } catch {
    return false;
  }
}

// ─── GraphQL conversations / messages (MCP native store) ─────────────────────

export interface WaConversation {
  /** Agente de bandeja asignado. DISTINTO de assignedTo (dueño CRM) — lo escribe
   *  setConversationAgent y api-ia lo mirror-ea (esquema api-mcp whatsapp.ts:168). */
  assignedAgentId?: string | null;
  contactName?: string;
  id: string;
  /** user | group | newsletter | broadcast | lid | unknown. Si != user,
   *  phoneNumber NO es un teléfono. Lo usan los filtros anti-spam de la Bandeja. */
  jidType?: string | null;
  lastMessageAt: string;
  messageCount: number;
  phoneNumber: string;
  status: string;
  unreadCountForAgent?: number;
}

export interface WaMessage {
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  id: string;
  status: string;
  text?: string;
  timestamp: string;
}

const GET_WA_CONVERSATIONS = `
  query GetWAConversations($developerId: String!) {
    getWhatsAppConversations(developerId: $developerId) {
      conversations {
        id
        phoneNumber
        contactInfo { name }
        lastMessageAt
        messageCount
        status
        jidType
        assignedAgentId
        unread_count_for_agent
      }
    }
  }
`;

const GET_WA_MESSAGES = `
  query GetWAMessages($conversationId: ID!) {
    getWhatsAppMessages(conversationId: $conversationId) {
      messages {
        id
        conversationId
        direction
        content { text }
        timestamp
        status
        createdAt
      }
    }
  }
`;

/** Fetch conversations from MCP native WhatsApp store (works even if external WA service is down) */
export async function getWhatsAppConversationsGQL(
  developerId: string,
  _limit = 50,
): Promise<WaConversation[]> {
  try {
    const data = await mcpClient.query<{
      getWhatsAppConversations: { conversations: any[] };
    }>(GET_WA_CONVERSATIONS, { developerId });
    return (data.getWhatsAppConversations?.conversations ?? []).map((c: any) => ({
      assignedAgentId: c.assignedAgentId ?? null,
      contactName: c.contactInfo?.name || undefined,
      id: c.id,
      jidType: c.jidType ?? null,
      lastMessageAt: c.lastMessageAt,
      messageCount: c.messageCount ?? 0,
      phoneNumber: c.phoneNumber,
      status: c.status,
      unreadCountForAgent: c.unread_count_for_agent ?? 0,
    }));
  } catch {
    return [];
  }
}

const SET_CONVERSATION_AGENT = `
  mutation SetConversationAgent($conversationId: ID!, $agentId: ID) {
    setConversationAgent(conversationId: $conversationId, agentId: $agentId)
  }
`;

/** Asigna (o desasigna con agentId=null) el AGENTE de bandeja de una conversación.
 *
 *  Confirmado en el esquema de api-mcp (typeDefs/whatsapp.ts:454) el 24-ago: hasta
 *  hoy el front sabía LEER `assignedAgentId` pero no existía ni una llamada de
 *  escritura, así que el responsable no se podía cambiar desde la interfaz.
 *  api-ia mirror-ea el valor, así que la Bandeja lo ve por su vía habitual. */
export async function setConversationAgent(
  conversationId: string,
  agentId: string | null,
): Promise<boolean> {
  const data = await mcpClient.query<{ setConversationAgent: boolean }>(
    SET_CONVERSATION_AGENT, { agentId, conversationId },
  );
  return data.setConversationAgent === true;
}

// ── Compartir / bloquear conversación (auditoría 15-09) ───────────────────────────────
// El esquema de api-mcp ya declaraba estas cuatro operaciones y el front no llamaba a
// ninguna: no había forma de compartir una conversación, revocar el acceso ni bloquear un
// contacto desde la interfaz. Firmas verificadas contra el servidor el 15-09
// (typeDefs/whatsapp.ts:455-480; resolver de bloqueo en resolvers/whatsapp.ts:1680, que
// exige acceso 'reply' sobre la conversación).

const SHARE_CONVERSATION = `
  mutation ShareConversation($conversationId: ID!, $principalType: String!, $principalId: ID!, $permission: String) {
    shareConversation(conversationId: $conversationId, principalType: $principalType, principalId: $principalId, permission: $permission)
  }
`;

const UNSHARE_CONVERSATION = `
  mutation UnshareConversation($conversationId: ID!, $principalId: ID!) {
    unshareConversation(conversationId: $conversationId, principalId: $principalId)
  }
`;

const BLOCK_CONVERSATION = `
  mutation BlockWhatsAppConversation($conversationId: String!, $developerId: String!) {
    blockWhatsAppConversation(conversationId: $conversationId, developerId: $developerId) {
      success
      errors { message }
    }
  }
`;

const SET_CONVERSATION_STATUS = `
  mutation SetConversationStatus($conversationId: ID!, $status: ConversationStatus!) {
    setConversationStatus(conversationId: $conversationId, status: $status)
  }
`;

export type SharePrincipalType = 'team' | 'user';
/** `view` solo lectura · `reply` puede responder en nombre de la línea. */
export type SharePermission = 'reply' | 'view';

/** Comparte la conversación con una persona o un equipo. */
export async function shareConversation(
  conversationId: string,
  principalType: SharePrincipalType,
  principalId: string,
  permission: SharePermission = 'view',
): Promise<boolean> {
  const data = await mcpClient.query<{ shareConversation: boolean }>(SHARE_CONVERSATION, {
    conversationId,
    permission,
    principalId,
    principalType,
  });
  return data.shareConversation === true;
}

/** Retira el acceso de esa persona o equipo. */
export async function unshareConversation(
  conversationId: string,
  principalId: string,
): Promise<boolean> {
  const data = await mcpClient.query<{ unshareConversation: boolean }>(UNSHARE_CONVERSATION, {
    conversationId,
    principalId,
  });
  return data.unshareConversation === true;
}

/** Bloquea el contacto: deja la conversación en estado `blocked`. */
export async function blockConversation(
  conversationId: string,
  development: string,
): Promise<boolean> {
  const data = await mcpClient.query<{
    blockWhatsAppConversation: { errors?: Array<{ message: string }>; success: boolean };
  }>(BLOCK_CONVERSATION, { conversationId, developerId: development });
  return data.blockWhatsAppConversation?.success === true;
}

/** Desbloquea devolviendo la conversación a ACTIVE (no hay mutación inversa dedicada). */
export async function unblockConversation(conversationId: string): Promise<boolean> {
  const data = await mcpClient.query<{ setConversationStatus: boolean }>(SET_CONVERSATION_STATUS, {
    conversationId,
    status: 'ACTIVE',
  });
  return data.setConversationStatus === true;
}

const ASSIGN_CONVERSATION_TO_USER = `
  mutation AssignConversationToUser($conversationId: ID!, $userId: ID) {
    assignConversationToUser(conversationId: $conversationId, userId: $userId)
  }
`;

/** Estado de la conversación, tal y como lo entiende api-mcp. */
export type ConversationServerStatus =
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'BLOCKED'
  | 'CLOSED'
  | 'OPEN'
  | 'PENDING';

/** Cambia el estado en el servidor (visible para todo el equipo, no solo para este navegador). */
export async function setConversationStatus(
  conversationId: string,
  status: ConversationServerStatus,
): Promise<boolean> {
  const data = await mcpClient.query<{ setConversationStatus: boolean }>(SET_CONVERSATION_STATUS, {
    conversationId,
    status,
  });
  return data.setConversationStatus === true;
}

/** Asigna el responsable HUMANO (userId null = desasignar). Distinto del agente IA. */
export async function assignConversationToUser(
  conversationId: string,
  userId: string | null,
): Promise<boolean> {
  const data = await mcpClient.query<{ assignConversationToUser: boolean }>(
    ASSIGN_CONVERSATION_TO_USER,
    { conversationId, userId },
  );
  return data.assignConversationToUser === true;
}

/** Fetch messages for a conversation from MCP native store */
export async function getWhatsAppMessagesGQL(
  conversationId: string,
  _limit = 50,
): Promise<WaMessage[]> {
  try {
    const data = await mcpClient.query<{
      getWhatsAppMessages: { messages: any[] };
    }>(GET_WA_MESSAGES, { conversationId });
    return (data.getWhatsAppMessages?.messages ?? []).map((m: any) => ({
      conversationId: m.conversationId,
      direction: m.direction,
      id: m.id,
      status: m.status,
      text: m.content?.text || '',
      timestamp: m.timestamp || m.createdAt,
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Vincular una conversación a un evento (boda)
//
// POR QUÉ IMPORTA
// Los paneles Próximo / Agendar / Responsable solo aparecen cuando la conversación
// tiene linkedEventId. Medido el 30-ago: 0 de 100 conversaciones lo tienen. El backend
// SÍ sabe vincular (linkConversationToEvent, resolver whatsapp.ts:1379), pero el front
// no lo llamaba desde ningún sitio — así que ese campo nunca se rellenaba a mano y todo
// el "puesto de trabajo" quedaba invisible.
//
// No todas las conversaciones deben vincularse: un lead pidiendo info aún no es una boda.
// Por eso es una ACCIÓN del usuario (asociar), no algo automático que se imponga aquí.
// Un contacto puede tener varias bodas → se vincula la conversación al evento que toque,
// y se puede desvincular o cambiar.
// ─────────────────────────────────────────────────────────────────────────────

const LINK_CONV_TO_EVENT = `
  mutation LinkConversationToEvent($conversationId: ID!, $eventId: ID!) {
    linkConversationToEvent(conversationId: $conversationId, eventId: $eventId)
  }
`;

const UNLINK_CONV_FROM_EVENT = `
  mutation UnlinkConversationFromEvent($conversationId: ID!) {
    unlinkConversationFromEvent(conversationId: $conversationId)
  }
`;

/** Asocia la conversación a un evento. Devuelve true si el backend confirmó. */
export async function linkConversationToEvent(
  conversationId: string,
  eventId: string,
): Promise<boolean> {
  const data = await mcpClient.query<{ linkConversationToEvent: boolean }>(LINK_CONV_TO_EVENT, {
    conversationId,
    eventId,
  });
  return data?.linkConversationToEvent === true;
}

/** Quita el vínculo con el evento (p. ej. si se asoció al equivocado). */
export async function unlinkConversationFromEvent(conversationId: string): Promise<boolean> {
  const data = await mcpClient.query<{ unlinkConversationFromEvent: boolean }>(
    UNLINK_CONV_FROM_EVENT,
    { conversationId },
  );
  return data?.unlinkConversationFromEvent === true;
}
