/**
 * Tipos para el sistema de chat externo (WhatsApp, Chat, API)
 * Basado en la documentación del backend GraphQL
 */

// Tipos de chat
export type ChatType = 'individual' | 'grupo' | 'evento';

// Tipos de mensaje
export type MessageType = 'texto' | 'imagen' | 'audio' | 'video' | 'documento';

// Origen del chat (red social)
export type ChatSource = 'whatsapp' | 'chat' | 'api';

// Rol del mensaje (para IA)
export type MessageRole = 'user' | 'assistant';

// Interfaz principal del Chat
export interface IExternalChat {
  _id: string;
  // Nombre del contacto
  contactAvatar?: string;
  // Se obtiene de usage_tracking
  contactName?: string; 
  development: string;
  lastMessageAt?: Date | string;
  // UIDs de Firebase
  mensajes: IExternalChatMessage[]; 
  metadata: {
    fecha_ultima_actividad: Date | string;
  };
  participantes: string[];
  
  // Campos adicionales para UI
  source?: ChatSource; 
  tipo: ChatType; 
  // bodasdehoy, eventosorganizador, etc.
  unreadCount?: number; // Avatar del contacto
}

// Interfaz del Mensaje
export interface IExternalChatMessage {
  _id: string;
  aiModel?: string;
  emisor: string; 
  // gpt-4, claude-3, etc.
// Estado de error
  error?: {
    message: string;
    type: string;
  }; 
  fecha_creacion: Date | string;
  fecha_recibido?: Date | string;
  fecha_visto?: Date | string;
  // UID quien recibe
  mensaje: string;
  
  // UID quien envía
  receptor: string;
  // IA
  role?: MessageRole; 
  
  tipo: MessageType;
}

// Interfaz para identificar origen
export interface IUsageTracking {
  chat_id: string;
  client_number?: string;
  source: ChatSource; // Si es WhatsApp
}

// Input para crear mensaje
export interface CHAT_CreateMessageInput {
  mensaje: string;
  receptor: string;
  tipo: MessageType;
}

// Respuesta de las queries GraphQL
export interface CHAT_GetUserChatsResponse {
  CHAT_getUserChatsCursor: {
    chats: IExternalChat[];
    cursor?: string;
    hasMore?: boolean;
  };
}

export interface CHAT_GetMessagesResponse {
  CHAT_getChatMessagesCursor: {
    cursor?: string;
    hasMore?: boolean;
    messages: IExternalChatMessage[];
  };
}

export interface CHAT_SendMessageResponse {
  CHAT_sendMessage: IExternalChatMessage;
}

// Subscription de nuevos mensajes
export interface CHAT_NewMessageSubscription {
  CHAT_newMessage: IExternalChatMessage;
}

// Helper para obtener icono por origen
export const getChatSourceIcon = (source?: ChatSource): string => {
  switch (source) {
    case 'whatsapp': {
      return '💬';
    }
    case 'chat': {
      return '💭';
    }
    case 'api': {
      return '🔌';
    }
    default: {
      return '💭';
    }
  }
};

// Helper para obtener color por origen
export const getChatSourceColor = (source?: ChatSource): string => {
  switch (source) {
    case 'whatsapp': {
      return '#25D366';
    }
    case 'chat': {
      return '#0084FF';
    }
    case 'api': {
      return '#6B7280';
    }
    default: {
      return '#0084FF';
    }
  }
};









