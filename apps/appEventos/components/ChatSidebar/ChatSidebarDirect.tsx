/**
 * ChatSidebar Direct - Panel lateral del Copilot (monorepo: AppBodasdehoy + LobeChat)
 *
 * Usa @bodasdehoy/copilot-ui (CopilotDirect), que carga la app del copilot en iframe
 * desde la misma versión (chat-test con app-test). Ver docs/MONOREPO-INTEGRACION-COPILOT.md
 */

import { FC, memo, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useChatSidebar } from '../../context/ChatSidebarContext';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from '../../context';
// Copilot completo via iframe (LobeChat full feature set)
import CopilotIframe from '../Copilot/CopilotIframe';
// import type { SendMessageParams, EmbedMessage } from '@bodasdehoy/copilot-ui';
import { IoClose, IoSparkles, IoOpenOutline } from 'react-icons/io5';

const MOBILE_BREAKPOINT = 768;

const ChatSidebarDirect: FC = () => {
  const { isOpen, width, closeSidebar, setWidth } = useChatSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'minimal' | 'full'>('minimal');

  const [guestSessionId] = useState(() => {
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

  const isGuest = !user || user?.displayName === 'guest' || !user?.email;
  // Paso 7: sesión estable por usuario autenticado (mismo historial en dispositivos si se persiste en backend)
  const sessionId = user?.uid ? `user_${user.uid}` : guestSessionId;
  const userId = user?.email || user?.uid || guestSessionId;
  const development = config?.development || 'bodasdehoy';
  const eventId = event?._id;
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile && width !== window.innerWidth) {
        setWidth(window.innerWidth);
      }
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [width, setWidth]);

  const isResizingRef = useRef(false);
  const lastXRef = useRef(0);

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

  // Solo dominios (app-test ↔ chat-test). No localhost ni IP locales; se trabaja con túnel/VPN o desplegado.
  const copilotUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname;
    if (host?.includes('-dev.')) return 'https://chat-dev.bodasdehoy.com';
    if (host?.includes('-test.')) return 'https://chat-test.bodasdehoy.com';
    return process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com';
  }, []);

  const handleOpenInNewTab = useCallback(() => {
    const params = new URLSearchParams({
      sessionId: sessionId || guestSessionId,
      userId: userId,
      development,
    });

    if (user?.email) {
      params.set('email', user.email);
    }

    if (eventId) {
      params.set('eventId', eventId);
    }

    if (event?.nombre) {
      params.set('eventName', event.nombre);
    }

    const fullUrl = `${copilotUrl}?${params.toString()}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }, [sessionId, guestSessionId, userId, development, user?.email, eventId, event?.nombre, copilotUrl]);

  const handleNavigate = useCallback((url: string) => {
    let finalUrl = url;
    const productionHosts = ['app.bodasdehoy.com', 'app-test.bodasdehoy.com', 'app-dev.bodasdehoy.com', 'organizador.bodasdehoy.com', 'bodasdehoy.com'];

    try {
      const parsed = new URL(url, window.location.origin);
      if (productionHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
        finalUrl = parsed.pathname + parsed.search + parsed.hash;
      }
    } catch {
      // URL relativa, usar tal cual
    }

    router.push(finalUrl);
  }, [router]);

  const handleAction = useCallback((_action: string, _payload: any) => {
    // Manejar acciones específicas del copilot
  }, []);

  if (!isOpen) return null;

  // Desktop: en el flujo del layout (no fixed) para que no se superponga a AppBodas
  // Móvil: fixed overlay con 85% ancho para dejar 15% de backdrop visible (tap to dismiss)
  const isOverlay = isMobile;

  return (
    <AnimatePresence>
      {/* Backdrop semitransparente solo en móvil */}
      {isOverlay && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-[45] md:hidden"
          onClick={closeSidebar}
          aria-hidden
        />
      )}

      <motion.div
        key="panel"
        initial={isOverlay ? { x: '-100%' } : { opacity: 0 }}
        animate={isOverlay ? { x: 0 } : { opacity: 1 }}
        exit={isOverlay ? { x: '-100%' } : { opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={
          isOverlay
            ? 'fixed top-0 left-0 h-screen bg-white shadow-2xl z-50 flex flex-col'
            : 'h-full max-w-full bg-white shadow-xl flex flex-shrink-0 z-40 min-w-0'
        }
        style={{ width: isOverlay ? 'min(85%, 400px)' : '100%' }}
      >
        {/* Drag handle pill — solo en móvil */}
        {isOverlay && (
          <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        )}

        <div className="flex-1 flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-2 sm:px-3 border-b border-gray-200 bg-white min-w-0 text-gray-900 [color-scheme:light] flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <IoSparkles className="text-pink-500 text-lg shrink-0" aria-hidden />
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight truncate">
                  Copilot IA
                </h2>
                <p className="text-[10px] sm:text-xs font-medium text-gray-600 leading-tight truncate">
                  Asistente inteligente
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {viewMode === 'minimal' && (
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="p-1.5 hover:bg-pink-100 rounded-lg transition-colors"
                  title="Ver completo - Abrir en nueva pestaña"
                >
                  <IoOpenOutline className="text-gray-600 w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={closeSidebar}
                className="p-2 hover:bg-pink-50 rounded-lg transition-colors"
                title="Cerrar"
              >
                <IoClose className="text-gray-500 w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Copilot integrado como componente (monorepo, sin iframe) */}
          <div className="flex-1 overflow-hidden min-h-0">
            <CopilotIframe
              userId={userId}
              development={development}
              eventId={eventId}
              userData={user as any}
              event={event as any}
              isAnonymous={isGuest}
              className="w-full h-full min-h-0"
            />
          </div>
        </div>

        {/* Resize Handle - DERECHA del sidebar (para sidebar en IZQUIERDA) */}
        {!isMobile && (
          <div
            className="w-1 cursor-col-resize hover:bg-pink-500 active:bg-pink-600 transition-colors"
            onMouseDown={handleMouseDown}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

ChatSidebarDirect.displayName = 'ChatSidebarDirect';

export default memo(ChatSidebarDirect);
