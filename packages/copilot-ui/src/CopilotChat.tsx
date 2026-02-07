/**
 * CopilotChat - Componente directo del chat sin iframe
 *
 * Renderiza el LobeChat directamente en la app principal sin usar iframe.
 * Comparte estado, autenticación y contexto directamente con la app host.
 */

import React, { useEffect, useMemo, useCallback, createContext, useContext } from 'react';
import type { CopilotChatProps, PageContextData, Event } from './types';

// ====================================
// Context para compartir datos entre apps
// ====================================

interface CopilotContextValue {
  userId?: string;
  development?: string;
  eventId?: string;
  eventName?: string;
  userData?: CopilotChatProps['userData'];
  event?: Event | null;
  eventsList?: any[];
  pageContext?: PageContextData;
  onNavigate?: (path: string) => void;
  onAction?: (action: string, payload: any) => void;
}

const CopilotContext = createContext<CopilotContextValue | null>(null);

export const useCopilot = () => {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error('useCopilot must be used within CopilotChat');
  }
  return context;
};

// ====================================
// Componente principal
// ====================================

const CopilotChat: React.FC<CopilotChatProps> = ({
  userId,
  development = 'bodasdehoy',
  eventId,
  eventName,
  className,
  userData,
  event,
  eventsList,
  onNavigate,
  onAction,
}) => {
  // URL base del copilot según el entorno
  const copilotBaseUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';

    // Desarrollo local
    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3210';
    }

    // Test
    if (window.location.hostname === 'app-test.bodasdehoy.com') {
      return 'https://chat-test.bodasdehoy.com';
    }

    // Producción
    return process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com';
  }, []);

  // Construir URL del copilot con parámetros
  const copilotUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (development) params.set('developer', development);
    if (userData?.email) {
      params.set('email', userData.email);
    } else if (userId?.includes('@')) {
      params.set('email', userId);
    }
    if (eventId) params.set('eventId', eventId);

    const baseUrl = copilotBaseUrl.replace(/\/$/, '');
    const variants = encodeURIComponent(development || 'bodasdehoy');
    const chatPath = `/${variants}/chat`;
    const queryString = params.toString();

    return queryString ? `${baseUrl}${chatPath}?${queryString}` : `${baseUrl}${chatPath}`;
  }, [copilotBaseUrl, development, userData?.email, userId, eventId]);

  // Extraer contexto de página (implementación simplificada)
  const pageContext = useMemo<PageContextData>(() => {
    if (typeof window === 'undefined') {
      return {
        pageName: 'unknown',
        screenData: {},
      };
    }

    const pathname = window.location.pathname;
    const pageName = pathname.split('/').filter(Boolean).pop() || 'home';

    const context: PageContextData = {
      pageName,
      screenData: {},
    };

    // Si hay evento, agregar resumen
    if (event) {
      context.eventSummary = {
        id: event._id,
        name: event.nombre,
        type: event.tipo,
        date: event.fecha,
        guestsCount: event.invitados_array?.length || 0,
        budget: event.presupuesto_objeto?.presupuesto || 0,
        tasks: event.itinerarios_array?.length || 0,
      };
    }

    return context;
  }, [event]);

  // Valor del contexto
  const contextValue = useMemo<CopilotContextValue>(() => ({
    userId,
    development,
    eventId,
    eventName,
    userData,
    event,
    eventsList,
    pageContext,
    onNavigate,
    onAction,
  }), [userId, development, eventId, eventName, userData, event, eventsList, pageContext, onNavigate, onAction]);

  // Log para debugging
  useEffect(() => {
    console.log('[CopilotChat] Initialized with:', {
      userId,
      development,
      eventId,
      copilotUrl,
      hasEvent: !!event,
    });
  }, [userId, development, eventId, copilotUrl, event]);

  return (
    <CopilotContext.Provider value={contextValue}>
      <div className={`copilot-chat-container ${className || ''}`}>
        {/*
          Por ahora, renderizamos el iframe como antes, pero este componente
          está preparado para integración directa cuando migremos a componentes compartidos.

          El siguiente paso será importar directamente los componentes del copilot
          en lugar de usar iframe.
        */}
        <div className="relative w-full h-full">
          {/* Placeholder para integración futura sin iframe */}
          <div className="text-center p-8 text-gray-500">
            <p className="mb-4">🚧 Integración directa en desarrollo</p>
            <p className="text-sm">URL del copilot: {copilotUrl}</p>
            <p className="text-xs mt-2">Contexto: {pageContext.pageName}</p>
            {event && (
              <p className="text-xs mt-1">Evento: {event.nombre}</p>
            )}
          </div>
        </div>
      </div>
    </CopilotContext.Provider>
  );
};

CopilotChat.displayName = 'CopilotChat';

export default CopilotChat;
