import { IExternalChat } from '@/types/externalChat';

import { ChatStoreState } from '../../initialState';

/**
 * Selectores para el slice de chat externo
 */

// Obtener todos los chats externos
const externalChats = (s: ChatStoreState): IExternalChat[] => s.externalChats || [];

// Obtener chat activo
const activeExternalChat = (s: ChatStoreState): IExternalChat | undefined => {
  if (!s.activeExternalChatId) return undefined;
  return externalChats(s).find((chat) => chat._id === s.activeExternalChatId);
};

// Obtener chat por ID
const getExternalChatById = (chatId: string) => (s: ChatStoreState): IExternalChat | undefined => {
  return externalChats(s).find((chat) => chat._id === chatId);
};

// Obtener total de mensajes no leídos
const totalUnreadCount = (s: ChatStoreState): number => {
  return externalChats(s).reduce((total, chat) => total + (chat.unreadCount || 0), 0);
};

// Obtener chats ordenados por actividad reciente
const sortedExternalChats = (s: ChatStoreState): IExternalChat[] => {
  return [...externalChats(s)].sort((a, b) => {
    const dateA = new Date(a.metadata.fecha_ultima_actividad).getTime();
    const dateB = new Date(b.metadata.fecha_ultima_actividad).getTime();
    return dateB - dateA; // Más reciente primero
  });
};

// Obtener nombre del contacto (otro participante)
const getContactName =
  (chat: IExternalChat, currentUserId?: string) =>
  (s: ChatStoreState): string => {
    let userId = currentUserId || s.currentUserId;
    if (!userId) return 'Usuario';
    
    // Si tiene nombre guardado, usarlo
    if (chat.contactName) return chat.contactName;
    
    // Buscar el otro participante
    const otherParticipant = chat.participantes.find((p) => p !== userId);
    return otherParticipant || 'Usuario';
  };

// Obtener último mensaje del chat
const getLastMessage = (chat: IExternalChat): string => {
  if (!chat.mensajes || chat.mensajes.length === 0) return 'Sin mensajes';
  
  const lastMsg = chat.mensajes.at(-1);
  
  // Si no hay mensajes, retornar mensaje por defecto
  if (!lastMsg) {
    return 'Sin mensajes';
  }
  
  // Si es un mensaje de IA
  if (lastMsg.role === 'assistant') {
    return `🤖 ${lastMsg.mensaje.slice(0, 50)}...`;
  }
  
  return lastMsg.mensaje.slice(0, 50) + (lastMsg.mensaje.length > 50 ? '...' : '');
};

// Estado de carga
const isExternalChatsLoading = (s: ChatStoreState): boolean => s.externalChatsLoading;

// Estado de inicialización
const isExternalChatsInit = (s: ChatStoreState): boolean => s.externalChatsInit;

// Error
const externalChatsError = (s: ChatStoreState): string | undefined => s.externalChatsError;

// Usuario actual
const currentUserId = (s: ChatStoreState): string | undefined => s.currentUserId;

// Development
const development = (s: ChatStoreState): string | undefined => s.development;

export const externalChatSelectors = {
  activeExternalChat,
  currentUserId,
  development,
  externalChats,
  externalChatsError,
  getContactName,
  getExternalChatById,
  getLastMessage,
  isExternalChatsInit,
  isExternalChatsLoading,
  sortedExternalChats,
  totalUnreadCount,
};









