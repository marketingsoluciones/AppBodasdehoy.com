/**
 * ChatSidebar - Panel lateral de chat integrado en la app
 *
 * MODO MÍNIMO (por defecto): Solo chat y resultados con header compacto
 * MODO COMPLETO: Vista expandida con todas las funcionalidades
 *
 * El usuario puede cambiar entre modos con el botón "Ver completo"
 */

import { FC, memo, useCallback, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useChatSidebar } from '../../context/ChatSidebarContext';
import { AuthContextProvider, EventContextProvider } from '../../context';
import CopilotIframe from '../Copilot/CopilotIframe';
import { IoClose, IoSparkles, IoExpand, IoChevronDown, IoOpenOutline } from 'react-icons/io5';

const MIN_WIDTH = 360;
/** Por debajo de este ancho el Copilot se muestra como overlay (no comprime el contenido) */
const MOBILE_BREAKPOINT = 768;

const ChatSidebar: FC = () => {
  const { isOpen, width, closeSidebar, setWidth } = useChatSidebar();
  const [viewMode, setViewMode] = useState<'minimal' | 'full'>('minimal');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
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

  const user = authContext?.user;
  const config = authContext?.config;
  const event = eventContext?.event;

  // Obtener datos para el chat - Detectar si es guest por displayName o falta de email
  // El AuthContext crea automáticamente un usuario guest si no hay sesión
  const isGuest = !user || user?.displayName === 'guest' || !user?.email;
  const userId = user?.email || user?.uid || guestSessionId;
  const development = config?.development || 'bodasdehoy';
  const eventId = event?._id;

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

  // Handler para expandir a vista completa (modal interno)
  const handleExpandToFull = useCallback(() => {
    setViewMode('full');
  }, []);

  // Handler para abrir chat-test (o localhost:3210 en automatización) en nueva pestaña
  const handleOpenInNewTab = useCallback(() => {
    const baseUrl =
      typeof window !== 'undefined' && window.location?.hostname === 'localhost'
        ? `${window.location.protocol}//localhost:3210`
        : (process.env.NEXT_PUBLIC_CHAT || 'https://chat-test.bodasdehoy.com');
    const params = new URLSearchParams();

    // Pasar parámetros para continuar la conversación
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

    const fullUrl = `${baseUrl}/${development}/chat${params.toString() ? '?' + params.toString() : ''}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }, [user?.email, eventId, development, guestSessionId]);

  // Handler para volver a minimal
  const handleMinimize = useCallback(() => {
    setViewMode('minimal');
  }, []);

  // En móvil: panel como overlay (no ocupa espacio en el flex, no comprime contenido)
  const asOverlay = isMobile && isOpen && viewMode === 'minimal';
  // Ancho efectivo en el layout: en móvil siempre 0 para no comprimir el main
  const layoutWidth = isMobile ? 0 : isOpen && viewMode === 'minimal' ? width : 0;

  return (
    <>
      {/* ========== VISTA MÍNIMA - MÓVIL: overlay flotante ========== */}
      <AnimatePresence>
        {asOverlay && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[45] md:hidden"
              onClick={closeSidebar}
              aria-hidden
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-[min(100%,400px)] max-w-full bg-white shadow-2xl flex flex-col z-50 md:hidden"
              aria-modal
              role="dialog"
              aria-label="Copilot"
            >
              <div className="h-10 px-3 flex items-center justify-between border-b border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <IoSparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-gray-700">Copilot</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleExpandToFull}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    title="Expandir"
                  >
                    <IoExpand className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    title="Ver completo en nueva pestaña"
                  >
                    <IoOpenOutline className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    onClick={closeSidebar}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    title="Cerrar (minimizar)"
                  >
                    <IoClose className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative min-h-0">
                <CopilotIframe
                  userId={userId}
                  development={development}
                  eventId={eventId}
                  userData={user}
                  event={event}
                  isAnonymous={isGuest}
                  className="h-full"
                />
                {isGuest && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-4 pb-2 px-3 pointer-events-none">
                    <div className="flex items-center justify-between text-xs text-gray-500 pointer-events-auto">
                      <span>Invitado — los datos se perderán al cerrar</span>
                      <Link href="/login" className="text-primary hover:underline font-medium">
                        Guardar y registrarse
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========== VISTA MÍNIMA - ESCRITORIO: sidebar en el flujo ========== */}
      {/*
       * En móvil este bloque tiene width 0 (no ocupa espacio). En desktop funciona igual que antes.
       * OPTIMIZACIÓN: iframe siempre montado en desktop para 0ms al abrir.
       */}
      <div
        className="h-full flex-shrink-0 overflow-hidden transition-[width,opacity] duration-150 hidden md:block"
        style={{
          width: layoutWidth,
          opacity: isOpen && viewMode === 'minimal' ? 1 : 0,
          pointerEvents: isOpen && viewMode === 'minimal' ? 'auto' : 'none',
        }}
        aria-hidden={!isOpen || viewMode !== 'minimal' || isMobile}
      >
        <div
          className="h-full bg-white shadow-xl flex flex-col z-40"
          style={{ width: Math.max(width, MIN_WIDTH) }}
        >
          <div className="h-10 px-3 flex items-center justify-between border-b border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <IoSparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-gray-700">Copilot</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExpandToFull}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                title="Expandir (modal)"
              >
                <IoExpand className="w-4 h-4 text-gray-500" />
              </button>
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

          <div className="flex-1 overflow-hidden relative">
            <CopilotIframe
              userId={userId}
              development={development}
              eventId={eventId}
              userData={user}
              event={event}
              isAnonymous={isGuest}
              className="h-full"
            />
            {isGuest && isOpen && viewMode === 'minimal' && (
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-3 pt-3 pb-3 pointer-events-auto">
                <p className="text-xs font-semibold text-gray-700 mb-2">El copilot IA puede ayudarte a:</p>
                <ul className="flex flex-col gap-1 mb-3">
                  {['Crear y gestionar invitados', 'Organizar el presupuesto', 'Diseñar el itinerario del día'].map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="text-pink-400">✦</span> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login?q=register"
                  className="block w-full text-center py-2 rounded-full bg-primary text-white text-xs font-medium hover:opacity-80 transition"
                >
                  Crear cuenta gratis y guardar mi evento
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resizer - solo en desktop */}
      {isOpen && viewMode === 'minimal' && !isMobile && (
        <div
          className="w-1 h-full cursor-col-resize bg-gray-100 hover:bg-primary/30 transition-colors flex-shrink-0 hidden md:block"
          onMouseDown={handleMouseDown}
        />
      )}

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
                <CopilotIframe
                  userId={userId}
                  development={development}
                  eventId={eventId}
                  userData={user}
                  event={event}
                  isAnonymous={isGuest}
                  className="h-full"
                />
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
