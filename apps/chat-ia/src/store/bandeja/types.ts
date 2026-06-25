/**
 * Tipos del store unificado de Bandeja.
 *
 * El store centraliza el estado de TODAS las conversaciones, notificaciones
 * y el SSE singleton. Reemplaza el patrón actual de hooks múltiples que
 * cada uno mantiene su propio fetch + EventSource.
 */

export type ChannelKind =
  | 'whatsapp'
  | 'email'
  | 'web'
  | 'instagram'
  | 'facebook'
  | 'telegram'
  | 'sms'
  | 'call'
  | 'notification';

export type ConversationScope = 'support' | 'event' | 'brand';

export interface Conversation {
  id: string;
  channel: ChannelKind;
  channelParam: string;
  conversationId: string;
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  linkedEventId: string | null;
  linkedContactId: string | null;
  guestStatus?: 'confirmed' | 'pending' | 'declined';
  jidType?: string | null;
  /** Quién atiende (null = sin asignar). */
  assignedTo?: string | null;
  /** Estado IA: copilot / manual / autopilot. */
  iaLevel?: 'manual' | 'copilot' | 'autopilot';
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  focused?: string;
}

export type SSEEvent =
  | { type: 'new_message'; convId: string; message: any }
  | { type: 'conv_updated'; convId: string; fields: Partial<Conversation> }
  | { type: 'notification'; notif: Notification }
  | { type: 'typing'; convId: string; userId: string; ttl: number }
  | { type: 'read_receipt'; convId: string; msgId: string; readByUserId: string };

export interface BandejaState {
  // Datos
  conversations: Record<string, Conversation>;
  notifications: Notification[];
  unreadCounts: { byChannel: Record<string, number>; total: number; notifications: number };
  typingByConv: Record<string, Array<{ userId: string; expiresAt: number }>>;

  // SSE singleton state
  _sseInitialized: boolean;
  _broadcastInitialized: boolean;
  _isLeaderTab: boolean;
  _lastSyncAt: number;

  // Estado UI mínimo (qué scope/canal está activo)
  activeScope: ConversationScope | string; // 'support' | 'brand' | eventId
  activeChannelFilter: string; // 'all' | 'whatsapp' | etc.

  // Loading / error
  loading: boolean;
  error: string | null;
}
