/**
 * ChatSidebar Direct - Panel lateral del Copilot (monorepo: AppBodasdehoy + LobeChat)
 *
 * Usa @bodasdehoy/copilot-ui (CopilotDirect), que carga la app del copilot en iframe
 * desde la misma versión (chat-test con app-test). Ver docs/MONOREPO-INTEGRACION-COPILOT.md
 */

import { FC, memo, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useChatSidebar } from '../../context/ChatSidebarContext';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from '../../context';
// TODO: Crear CopilotEmbed component en @bodasdehoy/copilot-ui
// import { CopilotEmbed } from '@bodasdehoy/copilot-ui';
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

  // Monorepo: app-test ↔ chat-test. URL del iframe = chat-test en app-test (si chat-test no carga, Copilot no carga).
  const copilotUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname || '';
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3210';
    if (host.includes('app-test')) return 'https://chat-test.bodasdehoy.com';
    return process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com';
  }, []);

  // "Abrir en nueva pestaña" = misma URL que el iframe (chat-test en app-test).
  const copilotUrlNewTab = useMemo(() => copilotUrl, [copilotUrl]);

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
                <Link
                  href={copilotUrlNewTab}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-pink-100 rounded-lg transition-colors"
                  title="Abrir en nueva pestaña"
                >
                  <IoOpenOutline className="text-gray-600" />
                </Link>
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
          <div className="flex-1 overflow-hidden min-h-0 flex flex-col items-center justify-center bg-gray-50">
            <p className="text-gray-500 text-sm">
              CopilotEmbed pendiente de implementar en @bodasdehoy/copilot-ui
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Por ahora, usa el ChatSidebar regular
            </p>
            {/* TODO: Implementar CopilotEmbed component
            <CopilotEmbed
              userId={userId}
              development={development}
              eventId={eventId}
              eventName={event?.nombre}
              sessionId={sessionId}
              onLoadHistory={async (sid): Promise<any[]> => {
                const list = await getChatHistory(sid, development);
                return list
                  .filter((m) => m.role === 'user' || m.role === 'assistant')
                  .map((m) => ({
                    id: m.id,
                    role: m.role as 'user' | 'assistant',
                    content: m.content || '',
                  }));
              }}
              className="w-full h-full min-h-0"
              userData={{
                email: user?.email || null,
                displayName: user?.displayName || null,
                phoneNumber: user?.phoneNumber || null,
                photoURL: user?.photoURL || null,
                uid: user?.uid,
                role: user?.role || [],
              }}
              event={event}
              eventsList={eventsGroup}
              sendMessage={async (params: any, onChunk, signal, onEnrichedEvent) => {
                const sid = params.sessionId ?? sessionId;
                const res = await sendChatMessage(
                  {
                    message: params.message,
                    sessionId: sid,
                    userId: params.userId,
                    development: params.development,
                    eventId: params.eventId,
                    eventName: params.eventName,
                    pageContext: params.pageContext,
                  },
                  onChunk ?? undefined,
                  signal ?? undefined,
                  onEnrichedEvent ?? undefined
                );
                // El backend api-ia guarda user + assistant en API2 al finalizar el stream (event: done)
                return { content: res.content };
              }}
            />
            */}
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
