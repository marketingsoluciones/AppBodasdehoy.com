/**
 * ChatSidebar - Panel lateral de chat integrado en la app
 *
 * MODO MÍNIMO (por defecto): Solo chat y resultados con header compacto
 * MODO COMPLETO: Vista expandida con todas las funcionalidades
 *
 * El usuario puede cambiar entre modos con el botón "Ver completo"
 */

import { FC, memo, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useChatSidebar } from '../../context/ChatSidebarContext';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from '../../context';
import CopilotChatNative from '../Copilot/CopilotChatNative';
import { IoClose, IoSparkles, IoExpand, IoChevronDown, IoOpenOutline } from 'react-icons/io5';

const MIN_WIDTH = 500; // Desktop: Ancho mínimo para el editor
const MAX_WIDTH = 600; // Desktop: Ancho máximo
const MOBILE_BREAKPOINT = 768; // px
/** Pantallas anchas: Copilot usa 20% del espacio (20vw) */
const WIDE_BREAKPOINT = 1024;

const ChatSidebar: FC = () => {
  const { isOpen, width, closeSidebar, setWidth } = useChatSidebar();

  const [isMobile, setIsMobile] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);

      // En móvil, usar ancho completo
      if (mobile && width !== window.innerWidth) {
        setWidth(window.innerWidth);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [width, setWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsWideScreen(window.innerWidth >= WIDE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const [viewMode, setViewMode] = useState<'minimal' | 'full'>('minimal');
  const [guestSessionId] = useState(() => {
    // Generar o recuperar session ID para usuarios guest
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('copilot_guest_session');
      if (stored) return stored;
      const newId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('copilot_guest_session', newId);
      return newId;
    }
    return `guest_${Date.now()}`;
  });
  const authContext = AuthContextProvider();
  const eventContext = EventContextProvider();
  const eventsGroupContext = EventsGroupContextProvider();

  const user = authContext?.user;
  const config = authContext?.config;
  const event = eventContext?.event;
  const eventsGroup = eventsGroupContext?.eventsGroup;

  // Obtener datos para el chat - Detectar si es guest por displayName o falta de email
  // El AuthContext crea automáticamente un usuario guest si no hay sesión
  const isGuest = !user || user?.displayName === 'guest' || !user?.email;
  const userId = user?.email || user?.uid || guestSessionId;
  const development = config?.development || 'bodasdehoy';
  const eventId = event?._id;
  const router = useRouter();
  const pageName = router.pathname?.replace('/', '') || 'inicio';

  // Construir pageContext con datos reales del evento para el sistema de IA
  const pageContext = useMemo(() => {
    const screenData: Record<string, any> = {};

    if (event) {
      // Invitados
      const invitados = event.invitados_array || [];
      screenData.totalInvitados = invitados.length;
      screenData.confirmados = invitados.filter((g: any) => g.asistencia === 'Asiste').length;
      screenData.pendientes = invitados.filter((g: any) => !g.asistencia || g.asistencia === 'Pendiente').length;

      // Presupuesto
      const presupuesto = event.presupuesto_objeto;
      if (presupuesto) {
        screenData.presupuestoTotal = presupuesto.presupuesto_total || 0;
        screenData.pagado = presupuesto.pagado || 0;
        screenData.currency = presupuesto.currency || 'EUR';
      }

      // Mesas
      if (event.mesas_array) {
        screenData.totalMesas = event.mesas_array.length;
      }

      // Itinerarios
      if (event.itinerarios_array) {
        screenData.totalItinerarios = event.itinerarios_array.length;
      }

      // Tipo y fecha del evento
      if (event.tipo) screenData.tipoEvento = event.tipo;
      if (event.fecha) screenData.fechaEvento = event.fecha;
    }

    // Lista de eventos del usuario
    const eventsList = (eventsGroup || []).map((ev: any) => ({
      name: ev.nombre,
      type: ev.tipo,
      date: ev.fecha,
      id: ev._id,
    }));

    return {
      pageName,
      eventName: event?.nombre,
      eventId,
      screenData,
      eventsList,
    };
  }, [event, eventsGroup, pageName, eventId]);

  // Referencias para resize
  const isResizingRef = useRef(false);
  const lastXRef = useRef(0);

  // Handler para resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    lastXRef.current = e.clientX;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      setWidth(width + deltaX);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [width, setWidth]);

  // Cerrar con Escape o volver a minimal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewMode === 'full') {
          setViewMode('minimal');
        } else {
          closeSidebar();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, closeSidebar]);

  // Handler para navegacion desde el chat
  const handleNavigate = useCallback((url: string) => {
    console.log('[ChatSidebar] Navegacion solicitada:', url);

    // Convertir URLs absolutas de produccion a rutas relativas
    // para que la navegacion se quede en el dominio actual (ej: app-test)
    let finalUrl = url;
    const productionHosts = [
      'organizador.bodasdehoy.com',
      'bodasdehoy.com',
      'app-test.bodasdehoy.com',
    ];
    try {
      const parsed = new URL(url, window.location.origin);
      if (productionHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
        // Extraer solo el path para navegar internamente
        finalUrl = parsed.pathname + parsed.search + parsed.hash;
      }
    } catch {
      // Si no es URL valida, usarla tal cual (probablemente ya es relativa)
    }

    // Usar router.push para rutas relativas, window.location para absolutas externas
    if (finalUrl.startsWith('/')) {
      router.push(finalUrl);
    } else {
      window.location.href = finalUrl;
    }
  }, [router]);

  // Handler para expandir a vista completa (modal interno)
  const handleExpandToFull = useCallback(() => {
    setViewMode('full');
  }, []);

  // Handler para abrir chat-test en nueva pestaña con toda la funcionalidad
  const handleOpenInNewTab = useCallback(() => {
    const baseUrl = process.env.NEXT_PUBLIC_CHAT || 'https://chat-test.bodasdehoy.com';
    const params = new URLSearchParams();

    // ✅ Guardar contexto completo en sessionStorage ANTES de abrir
    // Esto permite que chat-test recupere el contexto del evento
    const contextToPass = {
      pageContext,
      userId,
      development,
      eventId,
      eventName: event?.nombre,
      timestamp: Date.now(),
      fromEmbed: true, // Marcar que viene del sidebar embebido
    };

    try {
      sessionStorage.setItem('copilot_open_context', JSON.stringify(contextToPass));
      console.log('[ChatSidebar] Contexto guardado en sessionStorage para chat-test:', {
        eventId,
        eventName: event?.nombre,
        hasPageContext: !!pageContext,
      });
    } catch (err) {
      console.error('[ChatSidebar] Error guardando contexto:', err);
    }

    // Pasar parámetros en URL para autenticación e inicialización
    if (user?.email) {
      params.set('email', user.email);
    }
    if (eventId) {
      params.set('eventId', eventId);
    }
    // Pasar el sessionId del guest para mantener contexto
    if (guestSessionId) {
      params.set('sessionId', guestSessionId);
    }

    // ✅ IMPORTANTE: NO pasar minimal=1 ni embed=1 para que chat-test tenga funcionalidad completa
    const fullUrl = `${baseUrl}/${development}/chat${params.toString() ? '?' + params.toString() : ''}`;
    console.log('[ChatSidebar] Abriendo chat completo en nueva pestaña:', fullUrl);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }, [user?.email, eventId, development, guestSessionId, pageContext, userId, event]);

  // Handler para volver a minimal
  const handleMinimize = useCallback(() => {
    setViewMode('minimal');
  }, []);

  return (
    <>
      {/* ========== MÓVIL: Copilot flotante (overlay desde la derecha) ========== */}
      <AnimatePresence>
        {isOpen && viewMode === 'minimal' && isMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[45]"
              onClick={closeSidebar}
              aria-hidden
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 bottom-0 w-[min(400px,90vw)] max-w-full bg-white shadow-2xl flex flex-col z-50"
            >
              {/* Header */}
              <div className="h-10 px-3 flex items-center justify-between border-b border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <IoSparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-gray-700">Copilot</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={handleExpandToFull} className="p-1.5 hover:bg-gray-100 rounded-md" title="Expandir">
                    <IoExpand className="w-4 h-4 text-gray-500" />
                  </button>
                  <button type="button" onClick={handleOpenInNewTab} className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 rounded-md">
                    <IoOpenOutline className="w-3.5 h-3.5" /><span>Ver completo</span>
                  </button>
                  <button type="button" onClick={closeSidebar} className="p-1.5 hover:bg-gray-100 rounded-md ml-1" title="Cerrar">
                    <IoClose className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative min-h-0">
                <CopilotChatNative
                  userId={userId}
                  development={development}
                  eventId={eventId}
                  eventName={event?.nombre}
                  pageContext={pageContext}
                  onNavigate={handleNavigate}
                  onExpand={handleOpenInNewTab}
                  className="h-full w-full"
                />
                {isGuest && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-[2px] z-30 pointer-events-none" aria-hidden />
                    <div className="absolute inset-0 flex items-center justify-center z-40 p-4">
                      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 max-w-sm text-center pointer-events-auto">
                        <p className="text-sm font-medium text-gray-800 mb-1">Inicia sesión para usar el Copilot</p>
                        <p className="text-xs text-gray-500 mb-4">Con tu cuenta verás aquí tus eventos e invitados.</p>
                        {config?.pathLogin?.startsWith('http') ? (
                          <a href={config.pathLogin} className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg">Iniciar sesión</a>
                        ) : (
                          <Link href={config?.pathLogin || '/login'} className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg">Iniciar sesión</Link>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== ESCRITORIO: Vista mínima (panel a la izquierda, AppBodas a la derecha) ========== */}
      <AnimatePresence>
        {isOpen && viewMode === 'minimal' && !isMobile && (
          <>
            {/* Panel del Chat - Vista Mínima */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full bg-white shadow-xl flex flex-col z-40 flex-shrink-0"
              style={{
                width: isWideScreen ? '20vw' : width,
              }}
            >
              {/* Header Mínimo - Compacto */}
              <div className="h-10 px-3 flex items-center justify-between border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <IoSparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-gray-700">Copilot</span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Botón Expandir - Modal interno */}
                  <button
                    type="button"
                    onClick={handleExpandToFull}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    title="Expandir (modal)"
                  >
                    <IoExpand className="w-4 h-4 text-gray-500" />
                  </button>
                  {/* Botón Abrir en Nueva Pestaña - chat-test completo */}
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                    title="Abrir chat completo en nueva pestaña"
                  >
                    <IoOpenOutline className="w-3.5 h-3.5" />
                    <span>Ver completo</span>
                  </button>
                  <button
                    type="button"
                    onClick={closeSidebar}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors ml-1"
                    title="Cerrar"
                  >
                    <IoClose className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Area del chat — usando CopilotChatNative con funcionalidad completa */}
              <div className="flex-1 overflow-hidden relative">
                <CopilotChatNative
                  userId={userId}
                  development={development}
                  eventId={eventId}
                  eventName={event?.nombre}
                  pageContext={pageContext}
                  onNavigate={handleNavigate}
                  onExpand={handleOpenInNewTab}
                  className="h-full w-full"
                />
                {/* Aviso claro cuando no hay sesión: evita que parezca "cargando" o roto */}
                {isGuest && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-[2px] z-30 pointer-events-none" aria-hidden />
                    <div className="absolute inset-0 flex items-center justify-center z-40 p-4">
                      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 max-w-sm text-center pointer-events-auto">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                          <IoSparkles className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-gray-800 mb-1">
                          Inicia sesión para usar el Copilot
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                          Con tu cuenta verás aquí tus eventos, invitados y datos cargados.
                        </p>
                        {config?.pathLogin?.startsWith('http') ? (
                          <a
                            href={config.pathLogin}
                            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                          >
                            Iniciar sesión
                          </a>
                        ) : (
                          <Link
                            href={config?.pathLogin || '/login'}
                            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                          >
                            Iniciar sesión
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-4 pb-2 px-3 pointer-events-none z-20">
                      <div className="flex items-center justify-between text-xs text-gray-500 pointer-events-auto">
                        <span>Estás como invitado</span>
                        <Link
                          href={config?.pathLogin || '/login'}
                          className="text-primary hover:underline font-medium"
                        >
                          Iniciar sesión
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Resizer para vista mínima - Solo en desktop */}
            {!isMobile && (
              <div
                className="w-1 h-full cursor-col-resize bg-gray-100 hover:bg-primary/30 transition-colors flex-shrink-0"
                onMouseDown={handleMouseDown}
              />
            )}
          </>
        )}
      </AnimatePresence>

      {/* ========== VISTA COMPLETA (Modal) ========== */}
      <AnimatePresence>
        {isOpen && viewMode === 'full' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleMinimize}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-[95vw] h-[90vh] max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header de Vista Completa */}
              <div className="h-14 px-5 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-primary/5 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <IoSparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">Copilot - Vista Completa</h2>
                    <p className="text-xs text-gray-500">Tu asistente inteligente de eventos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Botón Abrir en Nueva Pestaña */}
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                    title="Abrir chat completo en nueva pestaña"
                  >
                    <IoOpenOutline className="w-4 h-4" />
                    <span className="hidden sm:inline">Nueva pestaña</span>
                  </button>
                  {/* Botón Minimizar - Volver a vista mínima */}
                  <button
                    type="button"
                    onClick={handleMinimize}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Volver a vista mínima (Esc)"
                  >
                    <IoChevronDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Minimizar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('minimal');
                      closeSidebar();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Cerrar"
                  >
                    <IoClose className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Area del chat expandido */}
              <div className="flex-1 overflow-hidden relative">
                <CopilotChatNative
                  userId={userId}
                  development={development}
                  eventId={eventId}
                  eventName={event?.nombre}
                  pageContext={pageContext}
                  onNavigate={handleNavigate}
                  onExpand={handleOpenInNewTab}
                  className="h-full w-full"
                />
                {isGuest && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-[2px] z-30 pointer-events-none" aria-hidden />
                    <div className="absolute inset-0 flex items-center justify-center z-40 p-4">
                      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 max-w-sm text-center pointer-events-auto">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                          <IoSparkles className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-gray-800 mb-1">
                          Inicia sesión para usar el Copilot
                        </p>
                        <p className="text-xs text-gray-500 mb-4">
                          Con tu cuenta verás aquí tus eventos, invitados y datos cargados.
                        </p>
                        {config?.pathLogin?.startsWith('http') ? (
                          <a
                            href={config.pathLogin}
                            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                          >
                            Iniciar sesión
                          </a>
                        ) : (
                          <Link
                            href={config?.pathLogin || '/login'}
                            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                          >
                            Iniciar sesión
                          </Link>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer con información adicional en vista completa */}
              <div className="h-8 px-4 flex items-center justify-between border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                <span>Presiona Esc para minimizar</span>
                <span>Powered by IA</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(ChatSidebar);
