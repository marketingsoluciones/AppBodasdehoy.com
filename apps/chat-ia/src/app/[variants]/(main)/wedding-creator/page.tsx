'use client';

/**
 * Event Creator Page - Editor de Webs para Eventos y Bodas
 * ==========================================================
 * Interfaz principal con chat a la izquierda y preview a la derecha
 * Responsive con tabs para mobile
 *
 * ENFOQUE 100% SECTOR EVENTOS Y BODAS:
 * - Creación de webs para bodas, eventos corporativos, celebraciones
 * - Gestión completa de información del evento
 * - RSVP y confirmación de asistencia
 * - Programa del día y timeline de eventos
 * - Ubicaciones y mapas interactivos
 * - Galerías de fotos y momentos
 * - Mesa de regalos y opciones de pago
 * - Personalización completa de estilos y paletas
 *
 * NOTA: Funcionalidad premium - solo usuarios registrados
 */

import React, { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MobileTabs,
  WeddingCreatorErrorBoundary,
  WeddingCreatorSkeleton,
  getAllPalettes,
} from '@bodasdehoy/wedding-creator';
import type { MobileTabType, PaletteType, SectionType } from '@bodasdehoy/wedding-creator';
import { useWeddingWeb } from '@/hooks/useWeddingWeb';
import { useWeddingWebGraphQL } from '@/hooks/useWeddingWebGraphQL';
import {
  sendWeddingChatMessage,
  checkBackendHealth,
  type WeddingChatMessage,
  type WeddingChangeAction,
} from '@/services/weddingChatService';
import { getCurrentEventId } from '@/services/storage-r2';
import { FeatureGate } from '@/components/FeatureGate';


// ✅ OPTIMIZACIÓN: Lazy load de componentes pesados
const WeddingSiteRenderer = lazy(() =>
  import('@bodasdehoy/wedding-creator').then(module => {
    if (!module.WeddingSiteRenderer) {
      throw new Error('WeddingSiteRenderer no encontrado en el módulo');
    }
    return { default: module.WeddingSiteRenderer };
  }).catch(error => {
    console.error('Error cargando WeddingSiteRenderer:', error);
    return import('@bodasdehoy/wedding-creator').then(m => ({ default: m.WeddingSiteRenderer }));
  })
);

const PublishModal = lazy(() =>
  import('@bodasdehoy/wedding-creator').then(module => {
    if (!module.PublishModal) {
      throw new Error('PublishModal no encontrado en el módulo');
    }
    return { default: module.PublishModal };
  }).catch(error => {
    console.error('Error cargando PublishModal:', error);
    return import('@bodasdehoy/wedding-creator').then(m => ({ default: m.PublishModal }));
  })
);

type ViewMode = 'desktop' | 'tablet' | 'mobile';

interface Message {
  content: string;
  id: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
}

/**
 * Hook para verificar si el usuario está registrado (no es guest/anonymous)
 * Funcionalidad premium - solo disponible para usuarios registrados
 *
 * ✅ MODIFICADO: Más permisivo para debugging - permite acceso temporal
 */
function useRequireRegisteredUser() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === 'development';

  // ✅ FIX HYDRATION: Inicializar estados de forma consistente entre SSR y cliente
  // Usar valores por defecto que sean iguales en servidor y cliente
  const [isChecking, setIsChecking] = useState(true); // Siempre empezar como true
  const [isRegistered, setIsRegistered] = useState(false); // Siempre empezar como false
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ OPTIMIZACIÓN: Deferir verificación para no bloquear render inicial
    // Nota: useEffect solo se ejecuta en el cliente, no en SSR
    const checkAuth = () => {
      try {
        const rawConfig = localStorage.getItem('dev-user-config');

        // ✅ DEBUG: En desarrollo, SIEMPRE permitir acceso sin config
        if (!rawConfig) {
          if (isDev) {
            // Dev mode: allow access without config
            setIsRegistered(true);
            setIsChecking(false);
            return;
          }
          setError('No se encontró configuración de usuario');
          setIsChecking(false);
          return;
        }

        // ✅ FIX: Manejo robusto de parsing JSON
        let config;
        try {
          if (!rawConfig.trim().startsWith('{') && !rawConfig.trim().startsWith('[')) {
            throw new Error('Raw config is not valid JSON');
          }
          config = JSON.parse(rawConfig);
        } catch (parseError) {
          // Invalid JSON in dev-user-config
          config = null;
        }
        // NOTA: dev-login guarda como "userId" (camelCase), no "user_id"
        const userId = config?.userId || config?.user_id;
        const registered = !!(userId && userId !== 'guest' && userId !== 'anonymous' && userId !== '');

        if (!registered) {
          // ✅ DEBUG: En desarrollo, SIEMPRE permitir acceso
          if (isDev) {
            // Dev mode: allow unregistered user access
            setIsRegistered(true);
            setIsChecking(false);
            return;
          }
          setError('Usuario no registrado. Por favor, inicia sesión.');
          setIsChecking(false);
          return;
        }

        setIsRegistered(true);
        setError(null);
      } catch (err) {
        console.error('Error checking auth:', err);
        // ✅ DEBUG: En desarrollo, SIEMPRE permitir acceso incluso con error
        if (isDev) {
          // Dev mode: allow access despite auth error
          setIsRegistered(true);
        } else {
          setError('Error al verificar autenticación');
        }
      } finally {
        setIsChecking(false);
      }
    };

    // ✅ En desarrollo, ejecutar inmediatamente pero de forma asíncrona
    // En producción, deferir más tiempo
    // Nota: useEffect solo se ejecuta en el cliente, window siempre está disponible
    if (isDev) {
      // En dev, ejecutar rápido pero asíncrono
      setTimeout(checkAuth, 0);
    } else {
      // En producción, deferir más
      if ('requestIdleCallback' in window) {
        requestIdleCallback(checkAuth, { timeout: 100 });
      } else {
        setTimeout(checkAuth, 0);
      }
    }
  }, [router, isDev]);

  return { error, isChecking, isRegistered };
}

function WeddingCreatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ✅ DEBUG: Log inicial
  useEffect(() => {
  }, []);

  // ✅ FIX HYDRATION: Inicializar siempre como null para evitar mismatch SSR/cliente
  const [eventId, setEventId] = useState<string | null>(null);

  // ✅ FIX HYDRATION: Cargar eventId solo en cliente después del mount
  useEffect(() => {
    if (eventId) return; // Ya tenemos eventId

    const loadEventId = () => {
      try {
        // 1. Primero intentar de query params
        const queryEventId = searchParams?.get('eventId');
        if (queryEventId) {
          setEventId(queryEventId);
          return;
        }

        // 2. Fallback: localStorage
        const loadedEventId = getCurrentEventId();
        if (loadedEventId) {
          setEventId(loadedEventId);
        }
      } catch (error) {
        // Error loading eventId - non-critical
      }
    };

    // Ejecutar inmediatamente en el cliente
    loadEventId();
  }, [eventId, searchParams]);

  // ✅ OPTIMIZACIÓN: Solo cargar el hook necesario, no ambos
  const shouldUseGraphQL = !!eventId && eventId !== 'dummy';

  // ✅ IMPORTANTE: Los hooks deben llamarse siempre, no condicionalmente
  // Solo llamar al hook GraphQL si realmente hay un eventId válido
  const graphQLHookResult = useWeddingWebGraphQL({
    autoSave: true,
    eventId: shouldUseGraphQL ? eventId : 'dummy',
  });
  const graphQLHook = shouldUseGraphQL ? graphQLHookResult : null;

  // ✅ Siempre llamar legacy hook (requisito de React)
  const legacyHook = useWeddingWeb({ autoSave: true });

  // Seleccionar hook activo
  const activeHook = graphQLHook || legacyHook;

  // ✅ FIX HYDRATION: Usar fecha fija para evitar mismatch SSR/cliente
  // Asegurar que wedding nunca sea null (usar datos iniciales si es necesario)
  const wedding = activeHook.wedding || legacyHook.wedding || {
    couple: { partner1: { name: '' }, partner2: { name: '' } },
    createdAt: '1970-01-01T00:00:00.000Z', // Fecha fija para SSR
    date: { date: '1970-01-01T00:00:00.000Z' },
    hero: { image: '', showCountdown: false, subtitle: '' },
    id: '',
    published: false,
    sections: [],
    slug: '',
    style: { palette: 'romantic' },
    updatedAt: '1970-01-01T00:00:00.000Z',
  };

  const isDirty = activeHook.isDirty ?? legacyHook.isDirty ?? false;
  const isSaving = activeHook.isSaving ?? legacyHook.isSaving ?? false;
  const weddingLoading = activeHook.isLoading ?? legacyHook.isLoading ?? false;

  // Funciones de actualización - usar GraphQL si está disponible
  const updateCouple = graphQLHook?.updateCoupleLocal || legacyHook.updateCouple;
  const updateDate = legacyHook.updateDate; // TODO: Implementar en GraphQL
  const updatePalette = graphQLHook?.updatePalette || legacyHook.updatePalette;
  const updateHero = graphQLHook?.updateHero || legacyHook.updateHero;
  const toggleSection = graphQLHook?.toggleSection || legacyHook.toggleSection;
  const _applyAIChanges = graphQLHook?.applyAIChanges || legacyHook.applyAIChanges;
  const _saveWedding = legacyHook.saveWedding; // TODO: Implementar en GraphQL

  // Schedule events handlers - usar legacyHook (GraphQL hook no tiene estos métodos aún)
  const addScheduleEvent = useCallback((event: Omit<import('@bodasdehoy/wedding-creator').ScheduleEvent, 'id'>) => {
    if (legacyHook.addScheduleEvent) {
      legacyHook.addScheduleEvent(event);
    } else {
      // addScheduleEvent not yet available in GraphQL hook
    }
  }, [legacyHook]);

  const updateScheduleEvent = useCallback((eventId: string, updates: Partial<import('@bodasdehoy/wedding-creator').ScheduleEvent>) => {
    if (legacyHook.updateScheduleEvent) {
      legacyHook.updateScheduleEvent(eventId, updates);
    } else {
      // updateScheduleEvent not yet available in GraphQL hook
    }
  }, [legacyHook]);

  const deleteScheduleEvent = useCallback((eventId: string) => {
    if (legacyHook.deleteScheduleEvent) {
      legacyHook.deleteScheduleEvent(eventId);
    } else {
      // deleteScheduleEvent not yet available in GraphQL hook
    }
  }, [legacyHook]);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [mobileTab, setMobileTab] = useState<MobileTabType>('chat');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedSubdomain, setPublishedSubdomain] = useState<string | undefined>(undefined);

  // ✅ FIX HYDRATION: Mensaje inicial con timestamp fijo para evitar mismatch SSR/cliente
  // El timestamp se actualiza en useEffect después del mount
  const [messages, setMessages] = useState<Message[]>([{
    content: '¡Hola! 👋 Soy tu asistente para crear webs de eventos y bodas.\n\n' +
      'Puedo ayudarte a personalizar tu evento: nombres, fecha, estilo, secciones y más.\n\n' +
      '¿Qué te gustaría configurar primero?',
    id: '1',
    role: 'assistant',
    timestamp: new Date(0), // Timestamp fijo para SSR, se actualiza en cliente
  }]);

  // ✅ FIX HYDRATION + OPTIMIZACIÓN: Cargar mensaje completo y timestamp real después del mount
  useEffect(() => {
    // Actualizar mensaje inicial con timestamp real y contenido completo
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === '1') {
        return [{
          ...prev[0],
          content: '¡Hola! 👋 Soy tu asistente especializado en crear webs para eventos y bodas.\n\n' +
            '🎯 **SECTOR EVENTOS Y BODAS** - Puedo ayudarte a crear una web profesional para:\n' +
            '   • Bodas y celebraciones matrimoniales\n' +
            '   • Eventos corporativos y empresariales\n' +
            '   • Celebraciones y fiestas especiales\n\n' +
            '✨ **FUNCIONALIDADES DISPONIBLES:**\n' +
            '   • Personalizar nombres de los anfitriones/pareja\n' +
            '   • Configurar fecha, hora y ubicación del evento\n' +
            '   • Elegir entre 6 paletas de colores profesionales\n' +
            '   • Gestionar secciones: agenda, ubicación, galería, RSVP, regalos\n' +
            '   • Agregar información importante (dress code, hospedaje, FAQs)\n' +
            '   • Configurar confirmación de asistencia (RSVP)\n' +
            '   • Integrar mesa de regalos y opciones de pago\n\n' +
            '💡 **EJEMPLOS DE COMANDOS:**\n' +
            '   • "Mi nombre es María y mi pareja es Juan"\n' +
            '   • "El evento es el 15 de junio de 2025"\n' +
            '   • "Quiero un estilo elegante y sofisticado"\n' +
            '   • "Agrega una sección de galería de fotos"\n' +
            '   • "Habilita el formulario de confirmación RSVP"\n\n' +
            '¿Qué te gustaría configurar primero para tu evento? 🎉',
          timestamp: new Date(), // ✅ Timestamp real en cliente
        }];
      }
      return prev;
    });
  }, []);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [_selectedSection, setSelectedSection] = useState<SectionType | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  // ✅ FIX HYDRATION: Usar useEffect para generar sessionId solo en cliente
  const [sessionId, setSessionId] = useState('wedding-temp');
  useEffect(() => {
    setSessionId(`wedding-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  }, []);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ✅ OPTIMIZACIÓN: Memoizar palettes para evitar recalcular en cada render
  const palettes = useMemo(() => getAllPalettes(), []);

  // ✅ OPTIMIZACIÓN: Deferir checkBackendHealth para no bloquear carga inicial
  useEffect(() => {
    // Ejecutar después de que la UI esté lista
    const checkHealth = () => {
      checkBackendHealth()
        .then(setBackendAvailable)
        .catch(() => setBackendAvailable(false));
    };

    // Usar requestIdleCallback si está disponible, sino setTimeout
    // Nota: useEffect solo se ejecuta en el cliente, window siempre está disponible
    if ('requestIdleCallback' in window) {
      requestIdleCallback(checkHealth, { timeout: 2000 });
    } else {
      setTimeout(checkHealth, 1000);
    }
  }, []);

  // Scroll to bottom when new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSectionClick = useCallback((section: SectionType) => {
    setSelectedSection(section);
    // Auto-add context message
    setMessages((prev) => [
      ...prev,
      {
        content: `[Usuario seleccionó la sección: ${section}]`,
        id: `sys-${Date.now()}`,
        role: 'system',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Apply actions from AI response to wedding state
  const applyActions = useCallback((actions: WeddingChangeAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'updateCouple': {
          updateCouple(action.payload.partner, action.payload.name);
          break;
        }
        case 'updateDate': {
          updateDate(action.payload.date);
          break;
        }
        case 'updatePalette': {
          updatePalette(action.payload.palette);
          break;
        }
        case 'updateHero': {
          updateHero(action.payload);
          break;
        }
        case 'toggleSection': {
          toggleSection(action.payload.section, action.payload.enabled);
          break;
        }
      }
    }
  }, [updateCouple, updateDate, updatePalette, updateHero, toggleSection]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      content: inputMessage,
      id: `user-${Date.now()}`,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Convert messages to chat format for backend
      const conversationHistory: WeddingChatMessage[] = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          content: m.content,
          role: m.role,
          timestamp: m.timestamp.toISOString(),
        }));

      // Send to backend AI
      const response = await sendWeddingChatMessage(
        inputMessage,
        wedding,
        conversationHistory,
        sessionId
      );

      // Apply any actions from the AI
      if (response.actions && response.actions.length > 0) {
        applyActions(response.actions);
      }

      const assistantMessage: Message = {
        content: response.message,
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error: any) {
      const errorMessage: Message = {
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.\n\n💡 **Tip:** Puedes intentar reformular tu solicitud o usar comandos más específicos como:\n• "Cambia el nombre a..."\n• "Actualiza la fecha a..."\n• "Habilita la sección de..."',
        id: `error-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, messages, wedding, sessionId, applyActions]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Publish handlers
  const handlePublish = async (subdomain: string) => {
    try {
      // Si usamos GraphQL, usar mutation directa
      if (graphQLHook && graphQLHook.weddingWeb) {
        const result = await graphQLHook.publish();
        if (result.success) {
          setPublishedSubdomain(graphQLHook.weddingWeb?.subdomain);
          setShowPublishModal(false);
          setMessages((prev) => [
            ...prev,
            {
              content: `¡Tu web de evento ha sido publicada exitosamente! 🎉\n\n📱 **URL Pública:**\n${result.publicUrl || `https://${graphQLHook.weddingWeb?.subdomain}.bodasdehoy.com`}\n\n✨ **Próximos pasos:**\n• Comparte este link con tus invitados\n• Envía la invitación por WhatsApp, email o redes sociales\n• Gestiona las confirmaciones desde el panel RSVP\n• Actualiza información cuando lo necesites\n\n¡Tu evento está listo para ser compartido! 🎊`,
              id: `sys-${Date.now()}`,
              role: 'assistant',
              timestamp: new Date(),
            },
          ]);
          return;
        } else {
          throw new Error('Error al publicar');
        }
      }

      // Fallback a API route (para compatibilidad)
      const response = await fetch('/api/wedding/publish', {
        body: JSON.stringify({
          action: 'publish',
          subdomain,
          weddingWebId: graphQLHook?.weddingWeb?.weddingWebId || wedding.id,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setPublishedSubdomain(data.subdomain || subdomain);
        setShowPublishModal(false);
        setMessages((prev) => [
          ...prev,
          {
            content: `¡Tu web de evento ha sido publicada exitosamente! 🎉\n\n📱 **URL Pública:**\n${data.url}\n\n✨ **Próximos pasos:**\n• Comparte este link con tus invitados\n• Envía la invitación por WhatsApp, email o redes sociales\n• Gestiona las confirmaciones desde el panel RSVP\n• Actualiza información cuando lo necesites\n\n¡Tu evento está listo para ser compartido! 🎊`,
            id: `sys-${Date.now()}`,
            role: 'assistant',
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(data.error || 'Error al publicar');
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Error al publicar. Intenta de nuevo.');
    }
  };

  const handleUnpublish = async () => {
    try {
      const response = await fetch('/api/wedding/publish', {
        body: JSON.stringify({
          action: 'unpublish',
          eventId: wedding.id,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        setPublishedSubdomain(undefined);
        setShowPublishModal(false);
      } else {
        throw new Error(data.error || 'Error al despublicar');
      }
    } catch (error) {
      console.error('Unpublish error:', error);
      alert('Error al despublicar. Intenta de nuevo.');
    }
  };

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile': {
        return 'max-w-[375px]';
      }
      case 'tablet': {
        return 'max-w-[768px]';
      }
      default: {
        return 'max-w-full';
      }
    }
  };

  // CMD+S keyboard shortcut to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty && _saveWedding) {
          _saveWedding();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, _saveWedding]);

  // ✅ FIX: Timeout para mostrar editor incluso si está cargando
  const [forceShow, setForceShow] = useState(false);

  useEffect(() => {
    // ✅ OPTIMIZACIÓN: Reducir timeout de 3s a 1s para carga más rápida
    if (weddingLoading) {
      const timeout = setTimeout(() => {
        // Force show editor after timeout
        setForceShow(true);
      }, 1000); // Reducido de 3000ms a 1000ms
      return () => clearTimeout(timeout);
    } else {
      setForceShow(false);
    }
  }, [weddingLoading]);

  // ✅ FIX: Mostrar editor siempre, incluso si está cargando (después de timeout)
  // ✅ OPTIMIZACIÓN: Reducir timeout de 3s a 1s para carga más rápida
  if (weddingLoading && !forceShow) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <WeddingCreatorSkeleton />
        <div className="mt-4 text-sm text-gray-500">
          Cargando editor de eventos y bodas...
        </div>
        <button
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          onClick={() => setForceShow(true)}
          type="button"
        >
          ⚡ Cargar Editor Ahora
        </button>
      </div>
    );
  }

  // ✅ FIX: Nunca bloquear - siempre mostrar editor con datos por defecto si es necesario
  // El wedding ya tiene un fallback, así que siempre debería existir

  const coupleName = wedding.couple.partner1.name && wedding.couple.partner2.name
    ? `${wedding.couple.partner1.name} & ${wedding.couple.partner2.name}`
    : 'Tu Evento';

  return (
    <>
      <div className="flex h-screen flex-col">
        {/* Mobile Tabs - Only visible on small screens */}
        <MobileTabs
          activeTab={mobileTab}
          onTabChange={setMobileTab}
          previewBadge={isDirty}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Chat Panel - Left Side */}
          <div className={`
            flex flex-col border-r border-gray-200 bg-white
            ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}
            w-full md:w-[400px] md:flex-shrink-0
          `}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => router.push('/chat')}
                  title="Volver al inicio"
                  type="button"
                >
                  <svg fill="none" height="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold">Editor de Eventos & Bodas</h1>
                {/* Auto-save indicator */}
                {isSaving && (
                  <span className="ml-2 text-xs text-gray-400 animate-pulse">Guardando...</span>
                )}
                {!isSaving && isDirty && (
                  <span className="ml-2 text-xs text-yellow-500">Sin guardar</span>
                )}
                {!isSaving && !isDirty && wedding.id && (
                  <span className="ml-2 text-xs text-green-500">Guardado</span>
                )}
              </div>
              {/* ✅ FIX: Botón de reinicio siempre visible */}
              <button
                className="ml-auto rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                onClick={() => window.location.reload()}
                title="Reiniciar editor"
                type="button"
              >
                🔄 Reiniciar
              </button>
              <div className="flex items-center gap-2">
                {backendAvailable === true && (
                  <span className="flex items-center gap-1 text-xs text-green-600" title="Conectado al backend AI">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    AI
                  </span>
                )}
                {backendAvailable === false && (
                  <span className="flex items-center gap-1 text-xs text-amber-600" title="Modo local (backend no disponible)">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Local
                  </span>
                )}
                {isDirty && (
                  <span className="text-xs text-amber-600">Sin guardar</span>
                )}
                {isSaving && (
                  <span className="text-xs text-blue-600">Guardando...</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    key={message.id}
                  >
                    {message.role === 'system' ? (
                      <div className="text-center text-xs text-gray-400">
                        {message.content}
                      </div>
                    ) : (
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-gray-100 px-4 py-2">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Escribe tu mensaje..."
                  rows={2}
                  value={inputMessage}
                />
                <button
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
                  disabled={!inputMessage.trim() || isLoading}
                  onClick={handleSendMessage}
                  type="button"
                >
                  <svg fill="none" height="20" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="20">
                    <line x1="22" x2="11" y1="2" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Preview Panel - Right Side */}
          <div className={`
            flex flex-1 flex-col bg-gray-200
            ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}
          `}>
            {/* Preview Header */}
            <div className="flex items-center justify-between border-b border-gray-300 bg-white px-4 py-2">
              <div className="flex items-center gap-4">
                <span className="hidden text-sm font-medium text-gray-600 sm:inline">Vista previa</span>
                <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-1">
                  <button
                    className={`rounded px-3 py-1 text-xs transition-colors ${
                      viewMode === 'desktop' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setViewMode('desktop')}
                    type="button"
                  >
                    Desktop
                  </button>
                  <button
                    className={`rounded px-3 py-1 text-xs transition-colors ${
                      viewMode === 'tablet' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setViewMode('tablet')}
                    type="button"
                  >
                    Tablet
                  </button>
                  <button
                    className={`rounded px-3 py-1 text-xs transition-colors ${
                      viewMode === 'mobile' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setViewMode('mobile')}
                    type="button"
                  >
                    Mobile
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                  onChange={(e) => updatePalette(e.target.value as PaletteType)}
                  value={wedding.style.palette}
                >
                  {palettes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <button
                  className={`flex items-center gap-1 rounded px-3 py-1 text-sm text-white transition-colors ${
                    publishedSubdomain
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                  onClick={() => setShowPublishModal(true)}
                  type="button"
                >
                  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" x2="12" y1="2" y2="15" />
                  </svg>
                  <span className="hidden sm:inline">
                    {publishedSubdomain ? 'Publicada' : 'Publicar'}
                  </span>
                </button>

                <button
                  className="flex items-center gap-1 rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
                  onClick={() => window.open(`/wedding/${wedding.slug || 'preview'}`, '_blank')}
                  type="button"
                >
                  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                  <span className="hidden sm:inline">Ver</span>
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex flex-1 items-start justify-center overflow-auto p-4">
              <div
                className={`h-full bg-white shadow-xl transition-all duration-300 ${getPreviewWidth()} ${
                  viewMode !== 'desktop' ? 'rounded-lg' : ''
                }`}
                style={{
                  width: viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '100%',
                }}
              >
                <div className="h-full overflow-auto">
                  <Suspense fallback={
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto" />
                        <p className="text-sm text-gray-500">Cargando preview...</p>
                      </div>
                    </div>
                  }>
                    <WeddingSiteRenderer
                      mode="preview"
                      onScheduleEventAdd={addScheduleEvent}
                      onScheduleEventDelete={deleteScheduleEvent}
                      onScheduleEventUpdate={updateScheduleEvent}
                      onSectionClick={handleSectionClick}
                      wedding={wedding}
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Publish Modal - Lazy loaded */}
      {showPublishModal && (
        <Suspense fallback={null}>
          <PublishModal
            coupleName={coupleName}
            currentSubdomain={publishedSubdomain}
            isOpen={showPublishModal}
            onClose={() => setShowPublishModal(false)}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
          />
        </Suspense>
      )}
    </>
  );
}

// Main export wrapped in ErrorBoundary + FeatureGate (registro + saldo)
export default function WeddingCreatorPage() {
  return (
    <FeatureGate
      featureDescription="para crear y editar la web de tu evento con IA"
      featureName="Creador Web"
      minCostEur={0.01}
    >
      <WeddingCreatorErrorBoundary>
        <Suspense fallback={
          <div className="flex h-screen flex-col items-center justify-center">
            <WeddingCreatorSkeleton />
            <div className="mt-4 text-sm text-gray-500">
              Cargando editor de eventos...
            </div>
          </div>
        }>
          <WeddingCreatorContent />
        </Suspense>
      </WeddingCreatorErrorBoundary>
    </FeatureGate>
  );
}
