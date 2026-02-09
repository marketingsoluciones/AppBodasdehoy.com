/**
 * useCopilotBridge - Hook para comunicacion con el parent de Copilot
 *
 * Este hook permite a Lobe-Chat recibir:
 * - Configuracion de autenticacion del parent (AppBodasdeHoy)
 * - Contexto del evento actual
 * - Cambios de modo de vista
 *
 * Y enviar:
 * - Eventos de navegacion cuando MCP devuelve URLs
 * - Notificacion de que el chat esta listo
 */

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/store/chat';

// Tipos de mensajes (deben coincidir con @bodasdehoy/shared)
type MessageType =
  | 'AUTH_CONFIG'
  | 'AUTH_REQUEST'
  | 'LOBE_CHAT_READY'
  | 'MCP_NAVIGATION'
  | 'EVENT_CONTEXT'
  | 'VIEW_MODE_CHANGE';

interface BridgeMessage<T = any> {
  payload: T;
  source: string;
  timestamp: number;
  type: MessageType;
}

interface AuthConfigPayload {
  development: string;
  eventId?: string;
  eventName?: string;
  token: string | null;
  userData: {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  };
  userId: string;
}

interface EventContextPayload {
  eventId: string;
  eventName: string;
  eventType?: string;
}

export const useCopilotBridge = () => {
  // Verificar si estamos en un iframe - de forma síncrona
  const isInIframe = useRef(
    typeof window !== 'undefined' ? window.parent !== window : false
  );
  const hasNotifiedParent = useRef(false);

  // Obtener funciones del store de chat
  const { setExternalChatConfig, development, currentUserId } = useChatStore((state) => ({
    currentUserId: state.currentUserId,
    development: state.development,
    setExternalChatConfig: state.setExternalChatConfig,
  }));

  // Enviar mensaje al parent
  const sendToParent = useCallback((type: MessageType, payload: any) => {
    if (!isInIframe.current || typeof window === 'undefined') return;

    const message: BridgeMessage = {
      payload,
      source: 'copilot-chat',
      timestamp: Date.now(),
      type,
    };

    window.parent.postMessage(message, '*');
  }, []);

  // Enviar notificacion de navegacion MCP
  const sendMCPNavigation = useCallback((url: string, toolName?: string) => {
    sendToParent('MCP_NAVIGATION', { toolName, url });
  }, [sendToParent]);

  // Escuchar mensajes del parent
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      const message = event.data as BridgeMessage;

      // Ignorar mensajes propios
      if (message?.source === 'copilot-chat') return;

      // Validar estructura basica
      if (!message?.type) return;

      switch (message.type) {
        case 'AUTH_CONFIG': {
          const payload = message.payload as AuthConfigPayload;
          console.log('[CopilotBridge] Recibido AUTH_CONFIG:', payload);

          // Actualizar store con la configuracion de auth del parent
          if (payload.userId && setExternalChatConfig) {
            setExternalChatConfig(
              payload.userId,
              payload.development,
              payload.token || undefined, // Convertir null a undefined
              'registered',
              undefined,
              payload.userData
            );
          }

          // Guardar contexto del evento si viene incluido
          if (payload.eventId) {
            localStorage.setItem('current_event_id', payload.eventId);
          }
          if (payload.eventName) {
            localStorage.setItem('current_event_name', payload.eventName);
          }
          break;
        }

        case 'EVENT_CONTEXT': {
          const payload = message.payload as EventContextPayload;
          console.log('[CopilotBridge] Recibido EVENT_CONTEXT:', payload);

          // Guardar contexto del evento para uso en MCPs
          if (payload.eventId) {
            localStorage.setItem('current_event_id', payload.eventId);
          }
          if (payload.eventName) {
            localStorage.setItem('current_event_name', payload.eventName);
          }
          if (payload.eventType) {
            localStorage.setItem('current_event_type', payload.eventType);
          }
          break;
        }

        case 'VIEW_MODE_CHANGE': {
          console.log('[CopilotBridge] Recibido VIEW_MODE_CHANGE:', message.payload);
          // Podria usarse para ajustar la UI del chat
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Notificar al parent que el chat esta listo (solo una vez)
    if (isInIframe.current && !hasNotifiedParent.current) {
      hasNotifiedParent.current = true;

      console.log('[CopilotBridge] Detectado iframe, notificando al parent...');

      // Enviar con un pequeño delay para asegurar que el parent esté escuchando
      const timer = setTimeout(() => {
        sendToParent('LOBE_CHAT_READY', {
          currentUserId,
          development,
        });
        console.log('[CopilotBridge] LOBE_CHAT_READY enviado al parent');

        // También enviar AUTH_REQUEST para solicitar autenticación explícitamente
        sendToParent('AUTH_REQUEST', {
          reason: 'copilot_loaded',
          timestamp: Date.now(),
        });
        console.log('[CopilotBridge] AUTH_REQUEST enviado al parent');
      }, 300);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('message', handleMessage);
      };
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [development, currentUserId, setExternalChatConfig, sendToParent]);

  return {
    isInIframe: isInIframe.current,
    sendMCPNavigation,
    sendToParent,
  };
};

export default useCopilotBridge;
