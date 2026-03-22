import { api2Client } from './client';

// Matches api2 schema enums exactly
export type WhatsAppChannelType = 'WAB' | 'QR_WHITELABEL' | 'QR_USER';
export type WhatsAppChannelStatus = 'ACTIVE' | 'CONNECTING' | 'DISCONNECTED' | 'ERROR';
export type WhatsAppMemberRole = 'ADMIN' | 'AGENT' | 'READONLY';

export interface WhatsAppChannelMember {
  id: string;
  channelId: string;
  userId: string;
  role: WhatsAppMemberRole;
  grantedBy: string;
  grantedAt?: string;
  isActive: boolean;
}

export interface WhatsAppChannel {
  id: string;
  createdAt?: string;
  development: string;
  displayName?: string;
  name: string;
  phoneNumber?: string;
  sessionKey?: string;
  status: WhatsAppChannelStatus;
  type: WhatsAppChannelType;
}

const GET_WHATSAPP_CHANNELS = `
  query GetWhatsAppChannels {
    getWhatsAppChannels {
      id
      name
      type
      status
      phoneNumber
      displayName
      development
      createdAt
      sessionKey
    }
  }
`;

const GET_WHATSAPP_CHANNEL_MEMBERS = `
  query GetWhatsAppChannelMembers($channelId: ID!) {
    getWhatsAppChannelMembers(channelId: $channelId) {
      id
      channelId
      userId
      role
      grantedBy
      grantedAt
      isActive
    }
  }
`;

const CREATE_WHATSAPP_CHANNEL = `
  mutation CreateWhatsAppChannel($input: WhatsAppCreateChannelInput!) {
    createWhatsAppChannel(input: $input) {
      success
      channel {
        id
        name
        type
        status
        development
      }
      error
    }
  }
`;

const DELETE_WHATSAPP_CHANNEL = `
  mutation DeleteWhatsAppChannel($channelId: ID!) {
    deleteWhatsAppChannel(channelId: $channelId) {
      success
      error
    }
  }
`;

const ADD_WHATSAPP_CHANNEL_MEMBER = `
  mutation AddWhatsAppChannelMember($channelId: ID!, $userId: String!, $role: WhatsAppChannelRole!) {
    addWhatsAppChannelMember(channelId: $channelId, userId: $userId, role: $role) {
      success
      member {
        userId
        role
      }
      error
    }
  }
`;

interface GetChannelsData {
  getWhatsAppChannels: WhatsAppChannel[];
}

interface GetChannelMembersData {
  getWhatsAppChannelMembers: WhatsAppChannelMember[];
}

interface ChannelResponse {
  success: boolean;
  channel?: WhatsAppChannel;
  error?: string;
}

interface CreateChannelData {
  createWhatsAppChannel: ChannelResponse;
}

interface DeleteChannelData {
  deleteWhatsAppChannel: { success: boolean; error?: string };
}

interface AddMemberData {
  addWhatsAppChannelMember: { success: boolean; member?: { userId: string; role: string }; error?: string };
}

export async function getWhatsAppChannels(): Promise<WhatsAppChannel[]> {
  try {
    const data = await api2Client.query<GetChannelsData>(GET_WHATSAPP_CHANNELS);
    return data.getWhatsAppChannels ?? [];
  } catch (err) {
    console.warn('[whatsapp] getWhatsAppChannels error:', err);
    return [];
  }
}

export async function getWhatsAppChannelMembers(channelId: string): Promise<WhatsAppChannelMember[]> {
  try {
    const data = await api2Client.query<GetChannelMembersData>(GET_WHATSAPP_CHANNEL_MEMBERS, { channelId });
    return data.getWhatsAppChannelMembers ?? [];
  } catch (err) {
    console.warn('[whatsapp] getWhatsAppChannelMembers error:', err);
    return [];
  }
}

export async function createWhatsAppChannel(
  name: string,
  type: WhatsAppChannelType = 'QR_USER',
): Promise<WhatsAppChannel | null> {
  const data = await api2Client.query<CreateChannelData>(CREATE_WHATSAPP_CHANNEL, {
    input: { name, type },
  });
  if (!data.createWhatsAppChannel.success) {
    console.warn('[whatsapp] createWhatsAppChannel error:', data.createWhatsAppChannel.error);
    return null;
  }
  return data.createWhatsAppChannel.channel ?? null;
}

export async function deleteWhatsAppChannel(channelId: string): Promise<boolean> {
  const data = await api2Client.query<DeleteChannelData>(DELETE_WHATSAPP_CHANNEL, { channelId });
  return data.deleteWhatsAppChannel.success ?? false;
}

export async function addWhatsAppChannelMember(
  channelId: string,
  userId: string,
  role: WhatsAppMemberRole,
): Promise<boolean> {
  try {
    const data = await api2Client.query<AddMemberData>(ADD_WHATSAPP_CHANNEL_MEMBER, { channelId, role, userId });
    return data.addWhatsAppChannelMember.success ?? false;
  } catch {
    return false;
  }
}

// ─── GraphQL conversations / messages (api2 native store) ─────────────────────

export interface WaConversation {
  id: string;
  phoneNumber: string;
  contactName?: string;
  lastMessageAt: string;
  messageCount: number;
  status: string;
}

export interface WaMessage {
  id: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  text?: string;
  timestamp: string;
  status: string;
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

/** Fetch conversations stored in api2 native WhatsApp store */
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
