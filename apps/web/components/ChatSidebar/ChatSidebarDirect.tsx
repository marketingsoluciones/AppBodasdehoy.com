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
// CopilotEmbed usando componentes de @bodasdehoy/copilot-shared
import { CopilotEmbed } from '../Copilot/CopilotEmbed';
import { sendChatMessage, getChatHistory } from '../../services/copilotChat';
// import type { SendMessageParams, EmbedMessage } from '@bodasdehoy/copilot-ui';
import { IoClose, IoSparkles, IoExpand, IoChevronDown, IoOpenOutline } from 'react-icons/io5';

const MIN_WIDTH = 380;
const MAX_WIDTH = 700;
const MOBILE_BREAKPOINT = 768;
const WIDE_BREAKPOINT = 1024; // Mismo que Container: Copilot 20% en pantallas anchas
const LARGE_SCREEN_BREAKPOINT = 1280;

const ChatSidebarDirect: FC = () => {
  const { isOpen, width, closeSidebar, setWidth } = useChatSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);
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
      const wide = window.innerWidth >= WIDE_BREAKPOINT;
      setIsMobile(mobile);
      setIsWideScreen(wide);
      if (mobile && width !== window.innerWidth) {
        setWidth(window.innerWidth);
      }
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [width, setWidth]);

  // En pantallas grandes: al abrir el Copilot, usar ancho que divida la pantalla en dos frames (contenido | Copilot)
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen || isMobile) return;
    if (window.innerWidth >= LARGE_SCREEN_BREAKPOINT && width < 520) {
      setWidth(520);
    }
  }, [isOpen, isMobile, width, setWidth]);

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

  // Monorepo: app-test ↔ chat-test. URL del iframe = chat-test en app-test (si chat-test no carga, Copilot no carga).
  const copilotUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3210';
    if (host.includes('app-test')) return 'https://chat-test.bodasdehoy.com';
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
    console.log('[ChatSidebarDirect] Abriendo Copilot completo:', fullUrl);
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }, [sessionId, guestSessionId, userId, development, user?.email, eventId, event?.nombre, copilotUrl]);

  const handleNavigate = useCallback((url: string) => {
    console.log('[ChatSidebarDirect] Navegación solicitada:', url);
    let finalUrl = url;
    const productionHosts = ['organizador.bodasdehoy.com', 'bodasdehoy.com', 'app-test.bodasdehoy.com'];

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

  const handleAction = useCallback((action: string, payload: any) => {
    console.log('[ChatSidebarDirect] Acción:', action, payload);
    // Manejar acciones específicas del copilot
  }, []);

  if (!isOpen) return null;

  // Mismo ancho que el marginLeft del contenido en Container para no superponer
  const finalWidth = isMobile
    ? '100%'
    : isWideScreen
    ? '20vw'
    : `${Math.max(MIN_WIDTH, Math.min(width, MAX_WIDTH))}px`;

  // Desktop: en el flujo del layout (no fixed) para que no se superponga a AppBodas
  // Móvil: fixed para que sea flotante
  const isOverlay = isMobile;

  return (
    <AnimatePresence>
      <motion.div
        initial={isOverlay ? { x: '-100%' } : { opacity: 0 }}
        animate={isOverlay ? { x: 0 } : { opacity: 1 }}
        exit={isOverlay ? { x: '-100%' } : { opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={
          isOverlay
            ? 'fixed top-0 left-0 h-screen bg-white shadow-2xl z-50 flex'
            : 'h-full bg-white shadow-xl flex flex-shrink-0 z-40'
        }
        style={{ width: finalWidth }}
      >

        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
            <div className="flex items-center gap-3">
              <IoSparkles className="text-pink-500 text-xl" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Copilot IA</h2>
                <p className="text-xs text-gray-500">Asistente inteligente</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'minimal' && (
                <button
                  onClick={handleOpenInNewTab}
                  className="p-2 hover:bg-pink-100 rounded-lg transition-colors"
                  title="Ver completo - Abrir en nueva pestaña"
                >
                  <IoOpenOutline className="text-gray-600" />
                </button>
              )}

              <button
                onClick={closeSidebar}
                className="p-2 hover:bg-pink-100 rounded-lg transition-colors"
                title="Cerrar"
              >
                <IoClose className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Copilot integrado como componente (monorepo, sin iframe) */}
          <div className="flex-1 overflow-hidden min-h-0">
            <CopilotEmbed
              userId={userId}
              sessionId={sessionId}
              development={development}
              eventId={eventId}
              eventName={event?.nombre}
              pageContext={{
                pageName: router.pathname,
                eventName: event?.nombre,
                eventId: event?._id,
                eventsList: eventsGroup?.map(e => ({
                  name: e.nombre,
                  type: e.tipo,
                  date: e.fecha,
                  id: e._id,
                })),
              }}
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
