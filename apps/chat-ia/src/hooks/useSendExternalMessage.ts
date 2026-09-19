'use client';

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';
import type {
  ExternalConversationMessagesPage,
  ExternalMessage,
} from '@/hooks/useExternalConversationMessages';
import { buildAuthHeaders } from '@/utils/authToken';
import { refreshJWTStandalone } from '@/hooks/useTokenRefresh';
import { generateConversationTitle } from '@/hooks/usePendingIntent';

interface SendExternalMessageVariables {
  channel?: string;
  development?: string;
  isGroup?: boolean;
  message: string;
  messageType?: string;
  metadata?: Record<string, unknown>;
  role?: 'USER' | 'ASSISTANT' | 'SYSTEM';
  sessionId: string;
  sessionType?: string;
}

interface SendExternalMessageResponse {
  error?: string;
  message?: Record<string, any>;
  success: boolean;
}

const mapApiMessageToExternalMessage = (
  message: Record<string, any>,
  fallback: {
    messageType: string;
    role: string;
  }
): ExternalMessage => {
  const metadata = message.metadata || {};
  const aiMetadata = metadata.aiMetadata || {};
  const role = (message.role || message.tipo || fallback.role).toString().toLowerCase();

  return {
    content: message.content || message.mensaje || '',
    metadata: {
      cost_usd: message.cost ?? aiMetadata.cost_usd,
      is_group: metadata.is_group ?? metadata?.tipo === 'grupo',
      model: message.aiModel ?? aiMetadata.model,
      processing_time_ms: aiMetadata.processing_time_ms,
      provider: message.aiProvider ?? aiMetadata.provider,
      session_type: metadata.session_type,
      tokens_used: message.tokens ?? aiMetadata.tokens_used,
      type: message.tipo || fallback.messageType,
    },
    role:
      role === 'assistant' || role === 'ia' || role === 'bot'
        ? 'assistant'
        : role === 'system'
        ? 'system'
        : 'user',
    timestamp: message.createdAt || message.fecha_creacion || message.updatedAt || undefined,
  };
};

/**
 * Detectar si la respuesta del chat indica sesión expirada
 */
const isSessionExpiredResponse = (data: any): boolean => {
  if (!data) return false;

  const messageContent = data.message?.content || data.response || '';
  const lowerContent = messageContent.toLowerCase();

  return (
    lowerContent.includes('sesión ha expirado') ||
    lowerContent.includes('sesion ha expirado') ||
    lowerContent.includes('session expired') ||
    lowerContent.includes('inicia sesión nuevamente') ||
    lowerContent.includes('volver a iniciar sesión') ||
    data.error === 'session_expired' ||
    data.metadata?.error === 'session_expired'
  );
};

/**
 * ✅ NUEVO: Actualizar el título de una conversación
 * Se usa para auto-generar títulos basados en el primer mensaje
 */
const updateConversationTitle = async (
  sessionId: string,
  titulo: string,
  development?: string
): Promise<boolean> => {
  try {
    const backendURL = EVENTOS_API_CONFIG.BACKEND_URL;
    const baseURL =
      backendURL && backendURL.startsWith('http')
        ? backendURL
        : `${window.location.origin}/api/backend`;
    const response = await fetch(
      `${baseURL}/api/conversations/${encodeURIComponent(sessionId)}?titulo=${encodeURIComponent(titulo)}&development=${development || 'bodasdehoy'}`,
      {
        credentials: 'include',
        headers: buildAuthHeaders({
          'Content-Type': 'application/json',
        }),
        method: 'PATCH',
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('✅ Título de conversación actualizado:', titulo);
        return true;
      }
    }
    console.warn('⚠️ No se pudo actualizar el título de la conversación');
    return false;
  } catch (error) {
    console.warn('⚠️ Error actualizando título:', error);
    return false;
  }
};

const sendExternalMessage = async (
  variables: SendExternalMessageVariables,
  isRetry: boolean = false
): Promise<SendExternalMessageResponse> => {
  const {
    channel,
    development,
    isGroup,
    message,
    messageType = 'TEXT',
    metadata,
    role = 'USER',
    sessionId,
    sessionType,
  } = variables;

  const backendURL = EVENTOS_API_CONFIG.BACKEND_URL;
  const baseURL =
    backendURL && backendURL.startsWith('http')
      ? backendURL
      : `${window.location.origin}/api/backend`;
  const response = await fetch(
    `${baseURL}/api/conversations/${encodeURIComponent(sessionId)}/messages`,
    {
      body: JSON.stringify({
        channel,
        development,
        is_group: isGroup,
        message,
        message_type: messageType,
        metadata,
        role,
        session_type: sessionType,
      }),
      credentials: 'include',
      headers: buildAuthHeaders({
        'Content-Type': 'application/json',
      }),
      method: 'POST',
    }
  );

  // ✅ MEJORADO: Si es 401/403, intentar renovar token y reintentar
  if ((response.status === 401 || response.status === 403) && !isRetry) {
    console.log('🔄 Error de autenticación, intentando renovar sesión...');
    const refreshed = await refreshJWTStandalone(true);
    if (refreshed) {
      console.log('✅ Sesión renovada, reintentando petición...');
      return sendExternalMessage(variables, true);
    }
    throw new Error('Sesión no válida. Inicia sesión nuevamente en /login.');
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('Sesión no válida. Inicia sesión nuevamente en /login.');
  }

  let data: SendExternalMessageResponse | null = null;

  const rawBody = await response.text();
  if (rawBody) {
    try {
      data = JSON.parse(rawBody) as SendExternalMessageResponse;
    } catch {
      // Si el backend devolvió HTML u otro formato, seguimos tratando el cuerpo como inválido
    }
  }

  if (!data) {
    throw new Error('Respuesta inválida del servidor');
  }

  // ✅ NUEVO: Detectar mensaje de sesión expirada en la respuesta y reintentar
  if (isSessionExpiredResponse(data) && !isRetry) {
    console.log('🔄 Respuesta indica sesión expirada, intentando renovar...');
    const refreshed = await refreshJWTStandalone(true);
    if (refreshed) {
      console.log('✅ Sesión renovada, reintentando petición...');
      return sendExternalMessage(variables, true);
    }
    // Si no se pudo renovar, retornar la respuesta original
    console.warn('⚠️ No se pudo renovar la sesión, mostrando mensaje original');
  }

  if (!response.ok || !data.success) {
    throw new Error(data.error || `Error HTTP ${response.status}`);
  }

  return data;
};

export const useSendExternalMessage = (sessionId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: Omit<SendExternalMessageVariables, 'sessionId'>) => {
      if (!sessionId) {
        throw new Error('Sesión inválida');
      }

      return await sendExternalMessage({
        sessionId,
        ...variables,
      }, false);
    },
    onSuccess: async (data, variables) => {
      if (sessionId && data.message) {
        const newMessage = mapApiMessageToExternalMessage(data.message, {
          messageType: (variables?.messageType ?? 'TEXT').toUpperCase(),
          role: (variables?.role ?? 'USER').toUpperCase(),
        });

        // ✅ NUEVO: Detectar si es el primer mensaje para auto-generar título
        let isFirstMessage = false;
        const currentData = queryClient.getQueryData<InfiniteData<ExternalConversationMessagesPage>>(
          ['externalConversationMessages', sessionId]
        );

        // Si no hay datos en cache o solo hay 0-1 mensajes, es primer mensaje
        if (!currentData || !currentData.pages || currentData.pages.length === 0) {
          isFirstMessage = true;
        } else {
          const totalMessages = currentData.pages.reduce(
            (acc, page) => acc + (page.messages?.length || 0),
            0
          );
          isFirstMessage = totalMessages <= 1;
        }

        queryClient.setQueriesData<
          InfiniteData<ExternalConversationMessagesPage>
        >(
          {
            predicate: (query) =>
              Array.isArray(query.queryKey) &&
              query.queryKey[0] === 'externalConversationMessages' &&
              query.queryKey[1] === sessionId,
          },
          (current) => {
            if (!current) return current;
            const pages = [...current.pages];
            const pageParams = [...current.pageParams];
            if (pages.length === 0) {
              pages.push({
                hasMore: false,
                messages: [newMessage],
                page: 1,
              });
              if (pageParams.length === 0) {
                pageParams.push(1);
              }
            } else {
              const lastIndex = pages.length - 1;
              const lastPage = pages[lastIndex];
              pages[lastIndex] = {
                ...lastPage,
                messages: [...lastPage.messages, newMessage],
              };
            }
            return {
              ...current,
              pageParams,
              pages,
            };
          }
        );

        // ✅ NUEVO: Auto-generar título basado en el primer mensaje
        if (isFirstMessage && variables.message) {
          const generatedTitle = generateConversationTitle(variables.message);
          console.log('📝 Generando título automático para nueva conversación:', generatedTitle);

          // Actualizar título en segundo plano (no bloquear UI)
          updateConversationTitle(sessionId, generatedTitle, variables.development).then(
            (success) => {
              if (success) {
                // Invalidar queries de historial para reflejar el nuevo título
                queryClient.invalidateQueries({
                  queryKey: ['conversationHistory'],
                });
              }
            }
          );
        }
      }

      if (sessionId) {
        queryClient.invalidateQueries({
          queryKey: ['externalConversationMessages', sessionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['conversationHistory'],
        });
      }
      // También limpiar historial si existe
      if (variables?.development) {
        queryClient.invalidateQueries({
          queryKey: ['conversationHistory', variables.development],
        });
      }
    },
  });
};

