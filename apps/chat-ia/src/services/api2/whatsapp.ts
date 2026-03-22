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

// Real api2 GraphQL query — field names match WhatsAppSession type
// NOTE: calls external WA microservice (api-whatsapp-v1.sistemasjaihom.com) — may be down
const GET_WA_SESSIONS = `
  query GetAllWASessions {
    whatsappGetAllSessions {
      id
      development
      userId
      isConnected
      phoneNumber
      connectionTime
      lastActivity
    }
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

/**
 * Returns WhatsApp sessions as channels.
 * Tries GraphQL first (calls external WA microservice via api2).
 * Falls back to REST proxy which reads local api2 state (more reliable).
 */
export async function getWhatsAppChannels(development?: string): Promise<WhatsAppChannel[]> {
  // Try real GraphQL query
  try {
    const data = await api2Client.query<{ whatsappGetAllSessions: any[] }>(GET_WA_SESSIONS);
    const sessions = data.whatsappGetAllSessions ?? [];
    if (sessions.length > 0) {
      return sessions.map((s) => sessionToChannel(s, development));
    }
  } catch {
    // External WA service may be down — fall through to REST fallback
  }

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
export async function getWhatsAppChannelMembers(): Promise<WhatsAppChannelMember[]> { return []; }
export async function createWhatsAppChannel(): Promise<null> { return null; }
export async function deleteWhatsAppChannel(): Promise<boolean> { return false; }
export async function addWhatsAppChannelMember(): Promise<boolean> { return false; }
