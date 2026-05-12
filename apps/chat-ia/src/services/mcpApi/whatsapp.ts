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

const SEND_WA_MESSAGE = `
  mutation SendWAMessage($args: SendWhatsAppMessageArgs) {
    whatsappSendMessage(args: $args)
  }
`;

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
    fetch(`/api/messages/whatsapp/session/${dev}`, {
      headers: { 'Content-Type': 'application/json' },
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

/** Send a WhatsApp message */
export async function sendWhatsAppMessage(
  sessionId: string,
  to: string,
  message: string,
  options?: { caption?: string; filename?: string; mediaType?: string; mediaUrl?: string; type?: string },
): Promise<boolean> {
  try {
    const data = await mcpClient.query<{ whatsappSendMessage: string }>(SEND_WA_MESSAGE, {
      args: { message, sessionId, to, type: options?.type || 'text', ...options },
    });
    return !!data.whatsappSendMessage;
  } catch {
    return false;
  }
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

const CREATE_WA_CHANNEL = `
  mutation CreateWhatsAppChannel($input: CreateWhatsAppChannelInput!) {
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
const ADD_WA_MEMBER = `
  mutation AddWhatsAppChannelMember($channelId: ID!, $userId: ID!, $role: String) {
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
    if (msg.includes('Unknown type "CreateWhatsAppChannelInput"')) {
      throw new Error(
        'Tu API2 no soporta crear canales WhatsApp desde aquí (schema sin CreateWhatsAppChannelInput). Crea el canal desde CRM/API2 o pide a API2 habilitar el schema multi-canal.',
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
        headers: { 'Content-Type': 'application/json' },
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

// ─── GraphQL conversations / messages (MCP native store) ─────────────────────

export interface WaConversation {
  contactName?: string;
  id: string;
  lastMessageAt: string;
  messageCount: number;
  phoneNumber: string;
  status: string;
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
      contactName: c.contactInfo?.name || undefined,
      id: c.id,
      lastMessageAt: c.lastMessageAt,
      messageCount: c.messageCount ?? 0,
      phoneNumber: c.phoneNumber,
      status: c.status,
    }));
  } catch {
    return [];
  }
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
