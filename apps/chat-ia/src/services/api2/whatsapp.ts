import { api2Client } from './client';

// Matches real api2 schema: WhatsAppSession GraphQL type
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

// NOTE: whatsappGetAllSessions does not exist in the api2 schema (only whatsappGetSession).
// getWhatsAppChannels tries GraphQL (multi-channel) then falls back to REST session.

const GET_WA_CHANNELS = `
  query GetWhatsAppChannels {
    getWhatsAppChannels { development id isConnected name phoneNumber status type }
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

/** Returns WhatsApp channels — tries GraphQL (multi-channel) then REST session fallback. */
export async function getWhatsAppChannels(development?: string): Promise<WhatsAppChannel[]> {
  // GraphQL path: multi-channel support (api2 schema v2+)
  try {
    const data = await api2Client.query<{ getWhatsAppChannels: WhatsAppChannel[] }>(GET_WA_CHANNELS, {});
    if (Array.isArray(data.getWhatsAppChannels)) return data.getWhatsAppChannels;
  } catch { /* fall through to REST */ }

  // REST fallback: reads local api2 session state
  try {
    const dev = development || 'bodasdehoy';
    const res = await fetch(`/api/messages/whatsapp/session/${dev}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];
    const sess = await res.json();
    if (!sess?.success) return [];
    return [sessionToChannel({ ...sess, id: sess.sessionKey || dev }, dev)];
  } catch {
    return [];
  }
}

/** Send a WhatsApp message */
export async function sendWhatsAppMessage(
  sessionId: string,
  to: string,
  message: string,
  options?: { caption?: string; filename?: string; mediaType?: string; mediaUrl?: string; type?: string },
): Promise<boolean> {
  try {
    const data = await api2Client.query<{ whatsappSendMessage: string }>(SEND_WA_MESSAGE, {
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
    const data = await api2Client.query<{ whatsappDisconnectSession: string }>(DISCONNECT_WA_SESSION, {
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
    const data = await api2Client.query<{ whatsappCreateSession: string }>(CREATE_WA_SESSION, {
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
    const data = await api2Client.query<{ whatsappRegenerateQR: string }>(REGENERATE_QR, { sessionId });
    return !!data.whatsappRegenerateQR;
  } catch {
    return false;
  }
}

// ─── Channel management GraphQL ───────────────────────────────────────────────

const CREATE_WA_CHANNEL = `
  mutation CreateWhatsAppChannel($input: CreateWhatsAppChannelInput!) {
    createWhatsAppChannel(input: $input) {
      channel { development id isConnected name phoneNumber status type }
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
    const data = await api2Client.query<{ createWhatsAppChannel: { channel: WhatsAppChannel; success: boolean } }>(
      CREATE_WA_CHANNEL, { input: { name, type } },
    );
    return data.createWhatsAppChannel?.success ? data.createWhatsAppChannel.channel : null;
  } catch { return null; }
}

export async function deleteWhatsAppChannel(channelId: string): Promise<boolean> {
  try {
    const data = await api2Client.query<{ deleteWhatsAppChannel: { success: boolean } }>(
      DELETE_WA_CHANNEL, { channelId },
    );
    return !!data.deleteWhatsAppChannel?.success;
  } catch { return false; }
}

export async function getWhatsAppChannelMembers(channelId: string): Promise<WhatsAppChannelMember[]> {
  try {
    const data = await api2Client.query<{ getWhatsAppChannelMembers: WhatsAppChannelMember[] }>(
      GET_WA_MEMBERS, { channelId },
    );
    return data.getWhatsAppChannelMembers || [];
  } catch { return []; }
}

export async function addWhatsAppChannelMember(channelId: string, userId: string, role?: string): Promise<boolean> {
  try {
    const data = await api2Client.query<{ addWhatsAppChannelMember: { success: boolean } }>(
      ADD_WA_MEMBER, { channelId, role, userId },
    );
    return !!data.addWhatsAppChannelMember?.success;
  } catch { return false; }
}

// ─── GraphQL conversations / messages (api2 native store) ─────────────────────

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
  query GetWAConversations($developerId: String!, $pagination: CRM_PaginationInput) {
    getWhatsAppConversations(developerId: $developerId, pagination: $pagination) {
      total
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
  query GetWAMessages($conversationId: ID!, $pagination: CRM_PaginationInput) {
    getWhatsAppMessages(conversationId: $conversationId, pagination: $pagination) {
      total
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

/** Fetch conversations from api2 native WhatsApp store (works even if external WA service is down) */
export async function getWhatsAppConversationsGQL(
  developerId: string,
  limit = 50,
): Promise<WaConversation[]> {
  try {
    const data = await api2Client.query<{
      getWhatsAppConversations: { conversations: any[], total: number; };
    }>(GET_WA_CONVERSATIONS, { developerId, pagination: { limit, page: 1 } });
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

/** Fetch messages for a conversation from api2 native store */
export async function getWhatsAppMessagesGQL(
  conversationId: string,
  limit = 50,
): Promise<WaMessage[]> {
  try {
    const data = await api2Client.query<{
      getWhatsAppMessages: { messages: any[], total: number; };
    }>(GET_WA_MESSAGES, { conversationId, pagination: { limit, page: 1 } });
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
