import { StateCreator } from 'zustand/vanilla';

import { apolloClient } from '@/libs/graphql/client';
import {
  GET_CHAT_SOURCE,
  GET_USER_API_CONFIGS,
  GET_USER_CHATS,
  GET_USER_EVENTS_BY_EMAIL,
  GET_USER_EVENTS_BY_PHONE,
  GET_USER_PROFILE,
  GET_WHITELABEL_CONFIG,
  SEND_MESSAGE,
} from '@/libs/graphql/queries';
import type {
  CHAT_CreateMessageInput,
  CHAT_SendMessageResponse,
  IExternalChat,
} from '@/types/externalChat';

import type { ChatStore } from '../../store';

/**
 * Acciones para el slice de chat externo
 */
export interface ExternalChatAction {
  // Cargar todos los datos del usuario (API configs, eventos, perfil)
  fetchAllUserData: () => Promise<void>;

  // Obtener origen del chat
  fetchChatSource: (chatId: string) => Promise<void>;
  // Obtener chats
  fetchExternalChats: () => Promise<void>;

  // Cargar configuraciones de API del usuario
  fetchUserApiConfigs: () => Promise<void>;

  // Cargar eventos del usuario
  fetchUserEvents: () => Promise<void>;

  // Cargar perfil del usuario
  fetchUserProfile: () => Promise<void>;

  // Internal actions
  internal_setExternalChats: (chats: IExternalChat[]) => void;

  internal_setExternalChatsError: (error?: string) => void;

  internal_setExternalChatsLoading: (loading: boolean) => void;

  refreshExternalChats: () => Promise<void>;

  // Seleccionar chat
  selectExternalChat: (chatId: string) => void;

  // Enviar mensaje
  sendExternalMessage: (chatId: string, input: CHAT_CreateMessageInput) => Promise<void>;
  // Configuración
  setExternalChatConfig: (
    userId: string,
    development: string,
    token?: string,
    userType?: 'registered' | 'guest',
    userRole?: string,
    userData?: any,
  ) => Promise<void>;
  // Sincronizar API keys del whitelabel a Lobe Chat keyVaults
  syncWhitelabelApiKeys: () => Promise<void>;
}

export const externalChatSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ExternalChatAction
> = (set, get) => ({
  // Cargar todos los datos del usuario
  fetchAllUserData: async () => {
    // ✅ SOLUCIÓN RÁPIDA: Prevenir llamadas duplicadas
    const state = get();
    if (state.externalChatsLoading) {
      console.log('⏭️ fetchAllUserData ya en progreso, saltando llamada duplicada');
      return;
    }

    const {
      fetchUserApiConfigs,
      fetchUserEvents,
      fetchUserProfile,
      fetchExternalChats,
      currentUserId,
      development,
      internal_setExternalChatsLoading,
    } = get();

    console.log('🔄 Iniciando carga de todos los datos del usuario:', {
      currentUserId,
      development,
    });

    // ✅ Marcar como cargando para prevenir duplicados
    internal_setExternalChatsLoading(true);

    try {
      // ✅ CORRECCIÓN: Ejecutar todas las llamadas en paralelo pero con manejo individual de errores
      // No usar Promise.race con timeout para evitar cancelar operaciones en curso
      // Cada función maneja sus propios errores y no bloquea las demás
      const promises = [
        fetchUserApiConfigs().catch((err) => {
          console.warn('⚠️ Error cargando API configs (continuando):', err.message);
          return null;
        }),
        fetchUserEvents().catch((err) => {
          console.warn('⚠️ Error cargando eventos (continuando):', err.message);
          return null;
        }),
        fetchUserProfile().catch((err) => {
          console.warn('⚠️ Error cargando perfil (continuando):', err.message);
          return null;
        }),
        fetchExternalChats().catch((err) => {
          console.warn('⚠️ Error cargando conversaciones (continuando):', err.message);
          return null;
        }),
      ];

      // ✅ OPTIMIZACIÓN: Aumentar timeout a 15s para queries a API2 (pueden tardar más)
      Promise.race([
        Promise.allSettled(promises).then(() => {
          internal_setExternalChatsLoading(false);
        }),
        new Promise<void>((resolve) => {
          setTimeout(() => {
            console.warn('⚠️ Timeout de seguridad alcanzado (15s), continuando con datos parciales');
            internal_setExternalChatsLoading(false);
            resolve();
          }, 15_000); // ✅ Aumentado a 15 segundos para queries a API2
        }),
      ]).catch(() => {
        internal_setExternalChatsLoading(false);
      });

      console.log('✅ Carga de datos del usuario completada (puede ser parcial)');
    } catch (error: any) {
      console.warn('⚠️ Error cargando datos del usuario (continuando):', {
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
      });
    }
  },

  // Obtener origen del chat
  // ✅ OFICIAL: getSession devuelve objeto DIRECTO (sin wrapper { success, session, errors })
  fetchChatSource: async (sessionId) => {
    try {
      const { data } = (await apolloClient.query({
        context: {
          fetchOptions: {
            signal: (() => {
              try {
                return AbortSignal.timeout(15_000);
              } catch {
                return undefined;
              }
            })(),
          },
        },
        errorPolicy: 'ignore',
        query: GET_CHAT_SOURCE,
        variables: { sessionId },
      })) as { data?: any };

      // ✅ OFICIAL: getSession devuelve ChatSession DIRECTO (sin wrapper)
      const session = data?.getSession;
      if (session && session.id) {
        const chats = get().externalChats;
        const chatIndex = chats.findIndex((c) => c._id === sessionId);

        if (chatIndex !== -1) {
          const sessionType = session.session_type;
          const source =
            sessionType === 'WHATSAPP' ? 'whatsapp' : sessionType === 'API' ? 'api' : 'chat';

          const updatedChats = [...chats];
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            participantes: session.participants,
            source,
          };

          set({ externalChats: updatedChats }, false, 'externalChat/fetchSource/success');
        }
      }
    } catch (error) {
      console.error('Error fetching session info:', error);
    }
  },

  // Obtener lista de chats externos
  fetchExternalChats: async () => {
    const {
      currentUserId,
      development,
      internal_setExternalChatsLoading,
      internal_setExternalChatsError,
      internal_setExternalChats,
    } = get();

    if (!currentUserId || !development) {
      const errorMsg = `Usuario o development no configurado. userId: ${currentUserId}, development: ${development}`;
      console.error('❌ fetchExternalChats:', errorMsg);
      internal_setExternalChatsError(errorMsg);
      return;
    }

    // ✅ Verificar si es UUID o visitante genérico
    const isUUID = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(currentUserId);
    if (isUUID || currentUserId === 'visitante@guest.local') {
      console.log('ℹ️ Usuario UUID o visitante, no cargando external chats');
      internal_setExternalChats([]);
      set({ externalChatsInit: true }, false, 'externalChat/fetchChats/guest');
      return;
    }

    console.log('🔍 Iniciando fetchExternalChats:', {
      currentUserId: currentUserId.slice(0, 30) + '...',
      development,
      isEmail: currentUserId.includes('@'),
    });

    internal_setExternalChatsLoading(true);
    internal_setExternalChatsError(undefined);

    try {
      // ✅ OFICIAL: getSessions con CRM_PaginationInput!
      console.log('📡 Enviando query getSessions a api2...');
      const { data } = await apolloClient.query<any>({
        fetchPolicy: 'network-only',
        query: GET_USER_CHATS,
        variables: {
          development,
          pagination: { limit: 50, page: 1 }, // ✅ OFICIAL: CRM_PaginationInput!
          userId: currentUserId,
        },
      });

      console.log('✅ Respuesta recibida de api2:', data);
      // ✅ CORRECCIÓN: Nueva estructura { success, sessions, total, errors }
      const sessionsResponse = data?.getSessions;
      const chats = sessionsResponse?.success ? sessionsResponse?.sessions || [] : [];
      console.log(`📋 Sesiones encontradas: ${chats.length}`);

      if (chats.length === 0) {
        console.log('ℹ️ Usuario no tiene conversaciones en API2');
        internal_setExternalChats([]);
        set({ externalChatsInit: true }, false, 'externalChat/fetchChats/empty');
        internal_setExternalChatsLoading(false);
        return;
      }

      // ✅ CORRECCIÓN: session_type ya viene incluido en la respuesta de getSessions
      // No necesitamos hacer queries adicionales para obtener el source
      const chatsWithSource = chats.map((session: any) => ({
        // Mapear campos de la nueva estructura a la estructura esperada por el frontend
        _id: session.id, // Mantener compatibilidad con código existente
        id: session.id,
        lastMessageAt: session.lastMessageAt,
        mensajes: (session.messages || []).map((msg: any) => ({
          _id: msg.id,
          aiModel: msg.aiModel,
          content: msg.content,
          createdAt: msg.createdAt,
          emisor: msg.role,
          fecha_creacion: msg.createdAt,
          id: msg.id,
          mensaje: msg.content,
          role: msg.role,
          tipo: msg.type || 'TEXT',
        })),
        metadata: {
          fecha_ultima_actividad: session.lastMessageAt,
        },
        participantes: session.participants || [],
        source:
          session.session_type === 'WHATSAPP'
            ? 'whatsapp'
            : session.session_type === 'API'
              ? 'api'
              : 'chat',
        tipo: session.session_type || 'LOBE_CHAT',
        unreadCount: session.unreadCount || 0,
      }));

      internal_setExternalChats(chatsWithSource);
      set({ externalChatsInit: true }, false, 'externalChat/fetchChats/success');
      console.log(`✅ ${chatsWithSource.length} chats cargados y guardados en store`);

      // ✅ Verificar que se guardaron correctamente
      const storeAfter = get();
      console.log('🔍 Verificación post-carga:', {
        cantidadChats: storeAfter.externalChats?.length || 0,
        externalChatsInit: storeAfter.externalChatsInit,
      });
    } catch (error: any) {
      // No bloquear el flujo - las queries CHAT pueden no existir en api2
      const errorMsg = error.message || 'Error al obtener chats';
      console.error('❌ Error fetchingexternal chats:', {
        development,
        error: errorMsg,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        stack: error.stack?.split('\n')[0],
        userId: currentUserId.slice(0, 30) + '...',
      });

      // Establecer array vacío para que la UI muestre "sin chats"
      internal_setExternalChats([]);
      internal_setExternalChatsError(errorMsg);
      set({ externalChatsInit: true }, false, 'externalChat/fetchChats/error');
    } finally {
      internal_setExternalChatsLoading(false);
    }
  },

  // Cargar configuraciones de API del usuario
  fetchUserApiConfigs: async () => {
    const { currentUserId, internal_setExternalChatsError } = get();

    if (!currentUserId) {
      console.error('❌ fetchUserApiConfigs: Usuario no configurado');
      internal_setExternalChatsError('Usuario no configurado');
      return;
    }

    console.log('🔍 fetchUserApiConfigs iniciando para userId:', currentUserId);

    try {
      // ✅ CORRECCIÓN: Agregar timeout personalizado y errorPolicy para evitar bloquear
      const { data } = (await apolloClient.query({
        // ✅ Ignorar errores para no bloquear
        context: {
          fetchOptions: {
            signal: (() => {
            try {
              return AbortSignal.timeout(30_000); // ✅ Aumentado a 30s para queries a API2
            } catch {
              return undefined;
            }
            })(),
          },
        },

        errorPolicy: 'ignore',

        fetchPolicy: 'network-only',

        query: GET_USER_API_CONFIGS,
        variables: { userId: currentUserId },
      })) as { data?: any };

      console.log('📡 Respuesta getUserApiConfigs:', data);

      // ✅ CORRECCIÓN: Nueva estructura { success, apiConfigs, errors }
      const response = data?.getUserApiConfigs;
      if (response?.success && response?.apiConfigs) {
        set({ userApiConfigs: response.apiConfigs }, false, 'externalChat/fetchApiConfigs/success');
        console.log('✅ API Configs cargadas:', response.apiConfigs);
      } else if (response?.errors?.length > 0) {
        console.warn('⚠️ getUserApiConfigs devolvió errores:', response.errors);
      } else {
        console.warn('⚠️ getUserApiConfigs devolvió datos vacíos');
      }
    } catch (error: any) {
      // No bloquear el flujo si falla - esta query puede no existir en api2 aún
      console.warn('⚠️ Error fetching user API configs (continuando):', {
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        userId: currentUserId,
      });
      // No llamar internal_setExternalChatsError para no bloquear el login
    }
  },

  // Cargar eventos del usuario
  fetchUserEvents: async () => {
    const { currentUserId, development, internal_setExternalChatsError } = get();

    if (!currentUserId || !development) {
      const errorMsg = `Usuario o development no configurado. userId: ${currentUserId}, development: ${development}`;
      console.error('❌ fetchUserEvents:', errorMsg);
      internal_setExternalChatsError(errorMsg);
      return;
    }

    // ✅ CORRECCIÓN: Detectar UUID y NO intentar consultar api2
    const isUUID = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(currentUserId);
    if (isUUID || currentUserId === 'visitante@guest.local') {
      console.warn(
        '⚠️ fetchUserEvents: currentUserId es UUID o visitante, NO consultando api2:',
        currentUserId,
      );
      set({ userEvents: [] }, false, 'externalChat/fetchEvents/uuid-detected');
      return;
    }

    console.log('🔍 fetchUserEvents iniciando:', { currentUserId, development });

    try {
      // Detectar si es email o teléfono (ya validado que NO es UUID)
      const isEmail = currentUserId.includes('@');
      const query = isEmail ? GET_USER_EVENTS_BY_EMAIL : GET_USER_EVENTS_BY_PHONE;
      // ✅ CORRECCIÓN: API2 usa "phone" no "phoneNumber"
      const variables = isEmail
        ? { development, email: currentUserId, pagination: { limit: 100, page: 1 } }
        : { development, pagination: { limit: 100, page: 1 }, phone: currentUserId };

      console.log('📡 Enviando query de eventos a api2...', {
        isEmail,
        queryName: isEmail ? 'getAllUserRelatedEventsByEmail' : 'getAllUserRelatedEventsByPhone',
        userId: currentUserId.slice(0, 10) + '...',
      });

      // ✅ OPTIMIZACIÓN: Timeout aumentado de 20s a 40s para consultas de eventos
      // Las consultas de eventos pueden tardar más si hay muchos eventos o la red es lenta
      const { data } = (await apolloClient.query({
        // ✅ Ignorar errores para no bloquear
        context: {
          fetchOptions: {
            signal: (() => {
              try {
                return AbortSignal.timeout(40_000); // ✅ Aumentado de 20s a 40s
              } catch {
                return undefined;
              }
            })(),
          },
        },

        errorPolicy: 'ignore',

        fetchPolicy: 'network-only',

        query,
        variables,
      })) as { data?: any };

      console.log('📡 Respuesta eventos:', data);

      // Extraer eventos según el tipo de query (ahora con estructura {success, eventos[], total})
      const eventosResponse = isEmail
        ? data?.getAllUserRelatedEventsByEmail
        : data?.getAllUserRelatedEventsByPhone;

      const events = eventosResponse?.success ? eventosResponse.eventos || [] : [];

      if (events.length > 0) {
        set({ userEvents: events }, false, 'externalChat/fetchEvents/success');
        console.log(
          `✅ ${events.length} eventos cargados con invitados:`,
          events.map((e: any) => ({
            invitados: e.invitados_array?.length || 0,
            nombre: e.nombre || e.name,
            tipo: e.tipo || e.type,
          })),
        );
      } else {
        console.warn('⚠️ No se encontraron eventos para el usuario');
        set({ userEvents: [] }, false, 'externalChat/fetchEvents/empty');
      }
    } catch (error: any) {
      // ✅ MEJORADO: Manejo de errores más detallado
      const isTimeout = error?.name === 'AbortError' ||
                       error?.message?.includes('timeout') ||
                       error?.message?.includes('Timeout');

      if (isTimeout) {
        console.warn('⚠️ Timeout al cargar eventos (la consulta tardó más de 40 segundos):', {
          development,
          error: error.message,
          userId: currentUserId,
        });
      } else {
        console.warn('⚠️ Error fetching user events (continuando):', {
          development,
          error: error.message,
          graphQLErrors: error.graphQLErrors,
          networkError: error.networkError,
          userId: currentUserId,
        });
      }

      // No bloquear el flujo si falla - las queries pueden no existir en api2 aún
      // Retornar array vacío en lugar de lanzar error
      set({ userEvents: [] }, false, 'externalChat/fetchEvents/error');
    }
  },

  // Cargar perfil del usuario
  fetchUserProfile: async () => {
    const { currentUserId, internal_setExternalChatsError } = get();

    if (!currentUserId) {
      console.error('❌ fetchUserProfile: Usuario no configurado');
      internal_setExternalChatsError('Usuario no configurado');
      return;
    }

    console.log('🔍 fetchUserProfile iniciando para userId:', currentUserId);

    try {
      console.log('📡 Enviando query getUserByEmail a api2...');
      // ✅ CORRECCIÓN: Usar getUserByEmail con development y errorPolicy
      const { development } = get();
      const { data } = (await apolloClient.query({
        // ✅ Ignorar errores para no bloquear
        context: {
          fetchOptions: {
            signal: (() => {
              try {
                return AbortSignal.timeout(30_000); // ✅ Aumentado a 30s para queries a API2
              } catch {
                return undefined;
              }
            })(),
          },
        },

        errorPolicy: 'ignore',

        fetchPolicy: 'network-only',

        query: GET_USER_PROFILE,
        variables: {
          development: development || 'bodasdehoy',
          email: currentUserId,
        },
      })) as { data?: any };

      console.log('📡 Respuesta getUserByEmail:', data);

      // ✅ CORRECCIÓN: getUserByEmail retorna { success, user, errors }
      if (data?.getUserByEmail?.success && data?.getUserByEmail?.user) {
        set({ userProfile: data.getUserByEmail.user }, false, 'externalChat/fetchProfile/success');
        console.log('✅ Perfil cargado:', data.getUserByEmail.user);
      } else {
        console.warn(
          '⚠️ getUserByEmail devolvió datos vacíos o errores:',
          data?.getUserByEmail?.errors,
        );
      }
    } catch (error: any) {
      // No bloquear el flujo si falla - la query puede no existir en api2 aún
      console.warn('⚠️ Error fetching user profile (continuando):', {
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        userId: currentUserId,
      });
    }
  },

  // Internal actions
  internal_setExternalChats: (chats) => {
    set({ externalChats: chats }, false, 'externalChat/setChats');
  },

  internal_setExternalChatsError: (error) => {
    set({ externalChatsError: error }, false, 'externalChat/setError');
  },

  internal_setExternalChatsLoading: (loading) => {
    set({ externalChatsLoading: loading }, false, 'externalChat/setLoading');
  },

  // Refrescar chats
  refreshExternalChats: async () => {
    await get().fetchExternalChats();
  },

  // Seleccionar chat activo
  selectExternalChat: (chatId) => {
    set({ activeExternalChatId: chatId }, false, 'externalChat/selectChat');

    // ✅ Persistir el chat activo en localStorage para restaurarlo después de recargar
    if (typeof window !== 'undefined' && chatId) {
      try {
        const config = localStorage.getItem('dev-user-config');
        if (config) {
          const parsed = JSON.parse(config);
          parsed.activeExternalChatId = chatId;
          parsed.lastActiveTimestamp = Date.now();
          localStorage.setItem('dev-user-config', JSON.stringify(parsed));
          console.log('💾 Chat activo guardado:', chatId);
        }
      } catch (e) {
        console.warn('⚠️ Error guardando chat activo:', e);
      }
    }
  },

  // Enviar mensaje
  sendExternalMessage: async (chatId, input) => {
    const { currentUserId, development, internal_setExternalChatsError } = get();

    if (!currentUserId || !development) {
      internal_setExternalChatsError('Usuario o development no configurado');
      return;
    }

    try {
      // API2 requiere AMBOS chatId Y sessionId (pueden ser el mismo valor)
      // role se define como enum USER en la query
      const { data } = await apolloClient.mutate<CHAT_SendMessageResponse>({
        mutation: SEND_MESSAGE,
        variables: {
          chatId,
          // API2 requiere ambos
          content: input.mensaje || '',
          sessionId: chatId,
        },
      });

      if (data?.CHAT_sendMessage) {
        // Actualizar el chat con el nuevo mensaje
        const chats = get().externalChats;
        const chatIndex = chats.findIndex((c) => c._id === chatId);

        if (chatIndex !== -1) {
          const updatedChats = [...chats];
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            mensajes: [...updatedChats[chatIndex].mensajes, data.CHAT_sendMessage],
            metadata: {
              fecha_ultima_actividad: data.CHAT_sendMessage.fecha_creacion,
            },
          };

          set({ externalChats: updatedChats }, false, 'externalChat/sendMessage/success');
        }
      }
    } catch (error: any) {
      internal_setExternalChatsError(error.message || 'Error al enviar mensaje');
      console.error('Error sending external message:', error);
      throw error;
    }
  },

  // Configurar usuario y development
  setExternalChatConfig: async (
    userId,
    development,
    token?: string,
    userType?: 'registered' | 'guest',
    userRole?: string,
    userData?: any,
  ) => {
    // ✅ CORRECCIÓN: Logging detallado para debuggear
    console.log('🔧 setExternalChatConfig llamado con:', {
      development,
      hasUserData: !!userData,
      userData: userData
        ? { displayName: userData.displayName, email: userData.email, nombre: userData.nombre }
        : null,
      userId: userId?.slice(0, 20) + '...',
      userRole,
      userType,
    });

    // Guardar userProfile si viene userData
    const userProfile = userData
      ? {
          displayName:
            userData.displayName ||
            userData.nombre ||
            (userId.includes('@') ? userId.split('@')[0] : userId),
          email: userData.email || (userId.includes('@') ? userId : undefined),
          nombre: userData.nombre,
          telefono: userData.telefono || userData.phoneNumber,
          ...userData,
        }
      : undefined;

    // ✅ CORRECCIÓN: Verificar que userId es válido antes de guardar
    if (!userId || userId === 'visitante@guest.local') {
      console.warn('⚠️ setExternalChatConfig recibió userId inválido:', userId);
    }

    // ✅ CORRECCIÓN: También establecer externalChatsInit: true cuando se configura un usuario válido
    // Esto indica que la sesión se ha inicializado (desde localStorage o login)
    // y evita que GuestWelcomeMessage muestre mensaje de registro antes de verificar
    const isValidUser = userId && userId !== 'visitante@guest.local' && userType !== 'guest';

    set(
      {
        currentUserId: userId,
        development,
        externalChatsInit: isValidUser ? true : get().externalChatsInit, // Solo marcar como init si es usuario válido
        userProfile: userProfile,
        userRole: userRole,
        userType: userType,
      },
      false,
      'externalChat/setConfig',
    );

    // ✅ CORRECCIÓN: Verificar que se guardó correctamente
    const stateAfter = get();
    console.log('✅ Store actualizado:', {
      currentUserId: stateAfter.currentUserId,
      hasUserProfile: !!stateAfter.userProfile,
      userRole: stateAfter.userRole,
      userType: stateAfter.userType,
    });

    // Actualizar useUserStore para mostrar estado visual de login
    try {
      const { useUserStore } = await import('@/store/user');
      const userStore = useUserStore.getState();

      // Determinar si es email o phone
      const isEmail = userId.includes('@');

      // ✅ CORRECCIÓN: Actualizar estado de usuario autenticado con datos completos
      // Usar userData si está disponible, sino usar userId
      const userEmail = userData?.email || (isEmail ? userId : undefined);
      const userFullName =
        userData?.displayName || userData?.nombre || (isEmail ? userId.split('@')[0] : userId);
      const userName =
        userData?.displayName || userData?.nombre || (isEmail ? userId.split('@')[0] : userId);

      useUserStore.setState({
        isLoaded: true,
        isSignedIn: true,
        user: {
          email: userEmail,
          fullName: userFullName,
          id: userId,
          username: userName,
          ...userStore.user, // Preservar otros datos
        },
      });

      console.log('✅ Estado de usuario actualizado en useUserStore');
    } catch (error) {
      console.warn('⚠️ Error actualizando useUserStore:', error);
    }

    // Si hay token, guardarlo en localStorage (solo almacenamiento)
    if (token) {
      localStorage.setItem('jwt_token', token);
      console.log('✅ Token JWT guardado');
    }

    // ✅ NUEVO: Guardar configuración en localStorage y en API
    try {
      const configToSave = {
        developer: development,
        development: development,
        role: userRole,
        timestamp: Date.now(),
        token: token,
        userId: userId,
        user_data: userData,
        user_type: userType,
      };

      // Guardar en localStorage (rápido, inmediato)
      localStorage.setItem('dev-user-config', JSON.stringify(configToSave));
      console.log('💾 Configuración guardada en localStorage');

      // ✅ NUEVO: También guardar en cookie HTTP para que el servidor la lea
      // Esto permite autenticación en peticiones tRPC sin necesidad de Clerk/NextAuth
      const cookieValue = encodeURIComponent(JSON.stringify(configToSave));
      // Cookie válida por 30 días, path=/ para todo el sitio, SameSite=Lax para seguridad
      // eslint-disable-next-line unicorn/no-document-cookie
      document.cookie = `dev-user-config=${cookieValue}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      console.log('🍪 Cookie dev-user-config establecida');

      // ✅ OPTIMIZACIÓN: Guardar en API en segundo plano (no bloqueante)
      if (typeof window !== 'undefined') {
        const saveConfigInBackground = () => {
          // En el navegador usar same-origin para evitar CORS (proxy en /api/auth/save-user-config)
          const BACKEND_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030');
          fetch(`${BACKEND_URL || ''}/api/auth/save-user-config`, {
            body: JSON.stringify({
              config: configToSave,
              development: development,
              user_id: userId,
            }),
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            method: 'POST',
          })
            .then(async (response) => {
              if (response.ok) {
                const result = await response.json();
                console.log('✅ Configuración guardada en API (en segundo plano):', result);
              } else {
                console.warn('⚠️ Error guardando configuración en API:', response.status);
              }
            })
            .catch((error) => {
              console.warn('⚠️ Error guardando configuración en API (continuando):', error);
            });
        };

        // ✅ Diferir guardado en API
        if ('requestIdleCallback' in window) {
          requestIdleCallback(saveConfigInBackground, { timeout: 1000 });
        } else {
          setTimeout(saveConfigInBackground, 500);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error guardando configuración (continuando):', error);
      // No bloquear el flujo si falla
    }

    // ✅ OPTIMIZACIÓN: Diferir sincronización de identidad (no bloqueante)
    // Ejecutar en segundo plano después de que la UI se renderice
    if (typeof window !== 'undefined') {
      const syncIdentityInBackground = async () => {
        try {
          const { eventosAPI } = await import('@/config/eventos-api');

          // Obtener sesión anónima actual si existe
          const currentState = get();
          const anonymousSessionId = currentState.activeExternalChatId;

          // Sincronizar identidad del usuario con middleware
          const syncResult = await eventosAPI.syncUserIdentity({
            anonymous_session_id: anonymousSessionId,
            development: development,
            user_email: userId.includes('@') ? userId : undefined,
            user_id: userId,
            user_name: userId.includes('@') ? userId.split('@')[0] : userId,
          });

          console.log('✅ Identidad sincronizada con middleware (en segundo plano):', syncResult);

          // Si hay datos migrados, actualizar el estado
          if (syncResult.has_migrated_data) {
            console.log('📦 Datos migrados:', syncResult.migration_result);
            // Recargar chats externos para mostrar datos migrados
            try {
              const { fetchExternalChats } = get();
              await fetchExternalChats();
            } catch (err) {
              console.warn('⚠️ Error cargando chats migrados:', err);
            }
          }
        } catch (error) {
          console.error('❌ Error sincronizando identidad (continuando):', error);
        }
      };

      // ✅ Diferir sincronización
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => syncIdentityInBackground(), { timeout: 3000 });
      } else {
        setTimeout(syncIdentityInBackground, 2000);
      }
    }

    // ✅ OPTIMIZACIÓN CRÍTICA: Diferir carga de datos pesados completamente
    // NO cargar datos inmediatamente - solo configurar lo mínimo para mostrar UI
    if (typeof window !== 'undefined') {
      const loadDataInBackground = () => {
        try {
          const { fetchAllUserData, syncWhitelabelApiKeys, externalChatsLoading } = get();

          // ✅ SOLUCIÓN RÁPIDA: Verificar si ya está cargando para evitar duplicados
          if (externalChatsLoading) {
            console.log('⏭️ Datos ya cargando, saltando llamada duplicada en setExternalChatConfig');
            return;
          }

          // Cargar datos en paralelo pero no esperar si fallan
          Promise.all([
            fetchAllUserData().catch((err) => {
              console.warn('⚠️ Error cargando datos del usuario (continuando):', err);
              return null;
            }),
            syncWhitelabelApiKeys().catch((err) => {
              console.warn('⚠️ Error sincronizando API keys (continuando):', err);
              return null;
            }),
          ])
            .then(() => {
              console.log('✅ Configuración de usuario completada (en segundo plano)');
            })
            .catch((err) => {
              console.warn('⚠️ Algunos datos no se cargaron, pero continuando:', err);
            });
        } catch (error) {
          console.error('❌ Error en carga de datos (continuando):', error);
        }
      };

      // ✅ OPTIMIZACIÓN CRÍTICA: Cargar datos DESPUÉS de que la UI esté completamente renderizada
      // Prioridad: UI primero, datos después
      if ('requestIdleCallback' in window) {
        // Esperar a que el navegador esté inactivo (UI ya renderizada)
        requestIdleCallback(loadDataInBackground, { timeout: 3000 });
      } else {
        // Fallback: delay más largo para asegurar que la UI se renderice primero
        setTimeout(loadDataInBackground, 2000);
      }
    }
  },

  // Sincronizar API keys del whitelabel a Lobe Chat keyVaults
  syncWhitelabelApiKeys: async () => {
    const { development } = get();

    if (!development) {
      console.warn('⚠️ No hay development configurado, no se pueden sincronizar API keys');
      return;
    }

    try {
      let whitelabelConfig: any = null;

      // ✅ Obtener supportKey según el development
      const { getSupportKey } = await import('@/const/supportKeys');
      const supportKey = getSupportKey(development);

      // Intentar obtener desde GraphQL primero
      try {
        // ✅ CORRECCIÓN: Agregar errorPolicy y timeout personalizado
        const { data } = (await apolloClient.query({
          // ✅ Ignorar errores para no bloquear
          context: {
            fetchOptions: {
              signal: (() => {
                try {
                  return AbortSignal.timeout(30_000); // ✅ Aumentado a 30s para queries a API2
                } catch {
                  return undefined;
                }
              })(),
            },
          },

          // ✅ Incluir supportKey
          errorPolicy: 'ignore',

          fetchPolicy: 'network-only',

          query: GET_WHITELABEL_CONFIG,
          variables: { development, supportKey },
        })) as { data?: any };

        whitelabelConfig = data?.getWhiteLabelConfig;
      } catch (graphqlError: any) {
        console.log('⚠️ GraphQL falló, intentando desde backend Python:', graphqlError.message);

        // Si GraphQL falla, obtener desde backend Python
        try {
          const backendResponse = await fetch(
            `http://localhost:8030/api/developers/${development}/config`,
          );
          if (backendResponse.ok) {
            const backendData = await backendResponse.json();
            const devConfig = backendData.config || {};

            // Mapear formato del backend al formato esperado
            whitelabelConfig = {
              aiApiKey: devConfig.ai_api_key || devConfig.aiApiKey,
              aiModel: devConfig.ai_model || devConfig.aiModel,
              aiProvider: devConfig.ai_provider || devConfig.aiProvider,
            };
          }
        } catch (backendError: any) {
          console.warn('⚠️ Backend Python también falló:', backendError.message);
        }
      }

      // ✅ CORRECCIÓN: Si no hay aiApiKey, verificar si se debe usar backend Python
      // En ese caso, NO sincronizar keys (el backend Python las manejará)
      if (!whitelabelConfig || !whitelabelConfig.aiApiKey) {
        // ✅ Usar utilidad centralizada para obtener configuración
        const { getPythonBackendConfig } = await import('@/utils/checkPythonBackendConfig');
        const { USE_PYTHON_BACKEND, PYTHON_BACKEND_URL } = getPythonBackendConfig();

        if (USE_PYTHON_BACKEND && PYTHON_BACKEND_URL) {
          console.log('✅ No hay API keys en whitelabel, pero se usa backend Python - el backend manejará las credenciales');
          return;
        }

        console.warn('⚠️ No se encontraron API keys en la configuración del whitelabel');
        return;
      }

      // Importar useUserStore dinámicamente para evitar dependencias circulares
      const { useUserStore } = await import('@/store/user');
      const { updateKeyVaults } = useUserStore.getState();

      // Mapear proveedores de api2 a Lobe Chat
      const providerMap: Record<string, string> = {
        anthropic: 'anthropic',
        azure: 'azure',
        google: 'google',
        openai: 'openai',
      };

      // Construir keyVaults desde la configuración del whitelabel
      const keyVaults: Record<string, { apiKey: string; baseURL?: string }> = {};

      // Si hay un proveedor principal configurado
      if (whitelabelConfig.aiProvider && whitelabelConfig.aiApiKey) {
        const provider =
          providerMap[whitelabelConfig.aiProvider.toLowerCase()] ||
          whitelabelConfig.aiProvider.toLowerCase();
        keyVaults[provider] = {
          apiKey: whitelabelConfig.aiApiKey,
        };
      }

      // Actualizar keyVaults en Lobe Chat
      if (Object.keys(keyVaults).length > 0) {
        await updateKeyVaults(keyVaults);
        console.log(
          '✅ API keys del whitelabel sincronizadas a Lobe Chat:',
          Object.keys(keyVaults),
        );
      } else {
        console.warn('⚠️ No se pudieron mapear las API keys del whitelabel');
      }
    } catch (error: any) {
      // No bloquear si falla - esta query puede no existir en api2 aún
      console.warn('⚠️ Error sincronizando API keys del whitelabel (continuando):', {
        error: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
      });
    }
  },
});
