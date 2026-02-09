import { IExternalChat } from '@/types/externalChat';

/**
 * Estado inicial para el slice de chat externo (WhatsApp, Chat, API)
 */
export interface ExternalChatState {
  // Chat activo
  activeExternalChatId?: string;
  // Usuario actual
  currentUserId?: string;
  development?: string;

  // Chats externos
  externalChats: IExternalChat[];

  // Errores
  externalChatsError?: string;

  externalChatsInit: boolean;
  externalChatsLoading: boolean; // bodasdehoy, eventosorganizador, etc.

  // Datos del usuario
  userApiConfigs?: any[]; // Configuraciones de API del usuario
  userEvents?: any[]; // Eventos del usuario
  userProfile?: any; 
  // Tipo de usuario
  userRole?: string; 
  // Perfil del usuario
  userType?: 'registered' | 'guest'; // Rol del usuario
}

export const initialExternalChatState: ExternalChatState = {
  activeExternalChatId: undefined,
  currentUserId: undefined,
  development: 'bodasdehoy',
  externalChats: [],
  externalChatsError: undefined,
  externalChatsInit: false,
  externalChatsLoading: false, // valor por defecto
  userApiConfigs: undefined,
  userEvents: undefined,
  userProfile: undefined,
  userRole: undefined,
  userType: undefined,
};









