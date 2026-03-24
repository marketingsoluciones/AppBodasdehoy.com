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
// getWhatsAppChannels goes directly to the REST fallback which is more reliable.

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

/** Returns WhatsApp sessions as channels via REST proxy (local api2 session state). */
export async function getWhatsAppChannels(development?: string): Promise<WhatsAppChannel[]> {
  // REST fallback: reads local api2 session state (doesn't call external WA service)
  try {
    const dev = development || 'bodasdehoy';
    const res = await fetch(`/api/messages/whatsapp/session/${dev}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.success) return [];
    return [sessionToChannel({ ...data, id: data.sessionKey || dev }, dev)];
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

// Legacy stubs — kept to avoid breaking other imports
export async function getWhatsAppChannelMembers(..._args: unknown[]): Promise<WhatsAppChannelMember[]> { return []; }
export async function createWhatsAppChannel(..._args: unknown[]): Promise<null> { return null; }
export async function deleteWhatsAppChannel(..._args: unknown[]): Promise<boolean> { return false; }
export async function addWhatsAppChannelMember(..._args: unknown[]): Promise<boolean> { return false; }

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
      getWhatsAppConversations: { total: number; conversations: any[] };
    }>(GET_WA_CONVERSATIONS, { developerId, pagination: { page: 1, limit } });
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
      getWhatsAppMessages: { total: number; messages: any[] };
    }>(GET_WA_MESSAGES, { conversationId, pagination: { page: 1, limit } });
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
