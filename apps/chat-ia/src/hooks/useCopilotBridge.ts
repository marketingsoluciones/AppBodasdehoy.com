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
import type {
  MessageType,
  BridgeMessage,
  AuthConfigPayload,
  EventContextPayload,
  PageContextPayload,
} from '@bodasdehoy/shared/communication';

// Delays de reintento si el tRPC call es abortado durante la inicialización del iframe.
// Con el delay inicial de AUTH_CONFIG (2500ms) el primer intento ya llega tarde,
// así que los reintentos pueden ser más cortos.
const RETRY_DELAYS_MS = [1500, 3000, 5000];

// Helper: inyectar bloque de contexto en el system prompt del agente activo
// Reintenta automáticamente si el tRPC call es abortado durante la inicialización del iframe.
async function injectContextIntoSystemPrompt(
  pageContext: {
    pageName?: string;
    eventName?: string;
    eventId?: string;
    screenData?: Record<string, any>;
  },
  attempt = 0,
): Promise<void> {
  try {
    const lines: string[] = ['<!-- Contexto del evento (inyectado automáticamente) -->'];
    if (pageContext.eventName) lines.push(`Evento: ${pageContext.eventName}`);
    if (pageContext.eventId) lines.push(`ID de evento: ${pageContext.eventId}`);
    if (pageContext.pageName) lines.push(`Pantalla actual: ${pageContext.pageName}`);
    if (pageContext.screenData && Object.keys(pageContext.screenData).length > 0) {
      try {
        const dataStr = JSON.stringify(pageContext.screenData, null, 2);
        lines.push(`Datos de la pantalla:\n${dataStr}`);
      } catch {
        // Ignorar si no es serializable
      }
    }
    lines.push('<!-- fin contexto -->');
    const contextBlock = lines.join('\n');

    const [{ useAgentStore }, { agentSelectors }] = await Promise.all([
      import('@/store/agent'),
      import('@/store/agent/selectors'),
    ]);

    const agentStore = useAgentStore.getState();
    const currentSystemRole: string =
      agentSelectors.currentAgentSystemRole(useAgentStore.getState()) || '';

    // Eliminar bloque de contexto anterior (evita acumulación)
    const cleanedSystemRole = currentSystemRole
      .replace(/<!--\s*Contexto del evento[\s\S]*?<!--\s*fin contexto\s*-->\n*/g, '')
      .trimStart();

    const newSystemRole = cleanedSystemRole
      ? `${contextBlock}\n\n${cleanedSystemRole}`
      : contextBlock;

    await agentStore.updateAgentConfig({ systemRole: newSystemRole });

    console.log('[CopilotBridge] ✅ Contexto inyectado en system prompt:', {
      pageName: pageContext.pageName,
      eventName: pageContext.eventName,
      screenDataKeys: pageContext.screenData ? Object.keys(pageContext.screenData) : [],
    });
  } catch (err: any) {
    // Si el tRPC call fue abortado (iframe aún inicializando), reintentar con backoff
    const isAborted =
      err?.message?.toLowerCase().includes('aborted') ||
      err?.name === 'AbortError' ||
      err?.cause?.name === 'AbortError';

    if (isAborted && attempt < RETRY_DELAYS_MS.length) {
      const delay = RETRY_DELAYS_MS[attempt];
      console.log(
        `[CopilotBridge] Reintentando inyección de contexto (intento ${attempt + 1}/${RETRY_DELAYS_MS.length}) en ${delay}ms...`,
      );
      setTimeout(() => injectContextIntoSystemPrompt(pageContext, attempt + 1), delay);
    } else {
      console.error('[CopilotBridge] Error inyectando contexto en system prompt:', err);
    }
  }
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

  // Enviar filtro al parent app para que filtre su vista principal
  // entity: 'events' | 'guests' | 'tables' | 'budget_items' | ...
  const sendFilterView = useCallback((entity: string, ids: string[], query?: string) => {
    sendToParent('FILTER_VIEW', { entity, ids, query });
  }, [sendToParent]);

  // Limpiar filtro activo en el parent app
  const clearParentFilter = useCallback(() => {
    sendToParent('CLEAR_FILTER', {});
  }, [sendToParent]);

  // Interceptar clicks en links que apuntan al app de eventos para navegar el parent en lugar de abrir otra pestaña
  useEffect(() => {
    if (!isInIframe.current || typeof window === 'undefined') return;

    // Dominios conocidos del app de eventos (producción y test)
    const APP_DOMAINS = [
      'app.bodasdehoy.com',
      'organizador.bodasdehoy.com', // legacy masterv1
      'app-test.bodasdehoy.com',
      'app-dev.bodasdehoy.com',
      'organizador.eventosorganizador.com',
    ];

    // Rutas del app que indican navegación interna
    const APP_PATHS = [
      '/invitados', '/presupuesto', '/mesas', '/itinerario', '/servicios',
      '/menus', '/invitaciones', '/lista-regalos', '/configuracion',
      '/resumen-evento', '/facturacion', '/bandeja-de-mensajes', '/perfil',
      '/momentos', '/diseno-ia',
    ];

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target || !target.href) return;

      try {
        const url = new URL(target.href);
        const isAppDomain = APP_DOMAINS.some(d => url.hostname === d);
        const isAppPath = APP_PATHS.some(p => url.pathname.startsWith(p));

        if (isAppDomain || isAppPath) {
          e.preventDefault();
          e.stopPropagation();
          const path = url.pathname + url.search;
          window.parent.postMessage({
            type: 'COPILOT_NAVIGATE',
            source: 'copilot-chat',
            timestamp: Date.now(),
            payload: { url: target.href },
          }, '*');
          console.log('[CopilotBridge] Interceptado link app, enviando COPILOT_NAVIGATE:', path);
        }
      } catch {
        // URL inválida, ignorar
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, []);

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

          // Inyectar pageContext en el system prompt si viene incluido en AUTH_CONFIG.
          // Delay de 2500ms para dar tiempo al agent store a inicializarse — sin él el
          // tRPC call se aborta y se necesitan hasta 4 reintentos (~7s de espera).
          if (payload.pageContext) {
            const ctxToInject = {
              pageName: payload.pageContext?.pageName,
              eventName: payload.eventName || undefined,
              eventId: payload.eventId || undefined,
              screenData: payload.pageContext?.screenData,
            };
            setTimeout(() => injectContextIntoSystemPrompt(ctxToInject), 2500);
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

        case 'PAGE_CONTEXT': {
          const payload = message.payload as {
            path?: string;
            pageName?: string;
            pageDescription?: string;
            eventSummary?: any;
            screenData?: Record<string, any>;
          };
          console.log('[CopilotBridge] Recibido PAGE_CONTEXT:', {
            pageName: payload.pageName,
            screenDataKeys: payload.screenData ? Object.keys(payload.screenData) : [],
          });

          // Recuperar eventId/eventName del localStorage (guardado en AUTH_CONFIG)
          const eventId = localStorage.getItem('current_event_id') || undefined;
          const eventName = localStorage.getItem('current_event_name') || undefined;

          injectContextIntoSystemPrompt({
            pageName: payload.pageName,
            eventName,
            eventId,
            screenData: payload.screenData,
          });
          break;
        }

        case 'SEND_PROMPT': {
          const { message: promptMessage } = message.payload as { message: string; context?: Record<string, any> };
          if (!promptMessage) break;
          console.log('[CopilotBridge] Recibido SEND_PROMPT:', promptMessage.slice(0, 80));
          import('@/store/chat').then(({ useChatStore }) => {
            useChatStore.getState().sendMessage({ message: promptMessage });
          }).catch((err) => {
            console.error('[CopilotBridge] Error enviando SEND_PROMPT al chat:', err);
          });
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
    sendFilterView,
    clearParentFilter,
  };
};

export default useCopilotBridge;
