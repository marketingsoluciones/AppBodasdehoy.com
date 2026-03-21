/**
 * Panel lateral del Copilot: usa CopilotEmbed (nativo, sin iframe) para carga instantánea.
 * El botón "Abrir completo" abre chat-ia completo en nueva pestaña (floor plan, venue visualizer, etc.)
 */

import { FC, memo, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useChatSidebar } from '../../context/ChatSidebarContext';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from '../../context';
import { CopilotEmbed } from '../Copilot/CopilotEmbed';
import { resolveChatOrigin } from '@bodasdehoy/shared/utils';
import { IoClose, IoSparkles, IoOpenOutline, IoChatbubbleOutline, IoAddOutline, IoTimeOutline } from 'react-icons/io5';

// ── Session storage helpers ──────────────────────────────────────────────────

interface StoredSession {
  id: string;
  label: string;   // primeras palabras del primer mensaje
  createdAt: number;
}

const SESSIONS_KEY = 'copilot_sessions_v1';

function loadSessions(userId: string): StoredSession[] {
  try {
    const raw = localStorage.getItem(`${SESSIONS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(userId: string, sessions: StoredSession[]) {
  try {
    // Máximo 20 sesiones
    localStorage.setItem(`${SESSIONS_KEY}_${userId}`, JSON.stringify(sessions.slice(0, 20)));
  } catch { /* quota exceeded, ignore */ }
}

function upsertSession(userId: string, id: string, label?: string) {
  const sessions = loadSessions(userId);
  const existing = sessions.findIndex(s => s.id === id);
  if (existing >= 0) {
    if (label) sessions[existing].label = label;
    saveSessions(userId, sessions);
  } else {
    sessions.unshift({ id, label: label || 'Nueva conversación', createdAt: Date.now() });
    saveSessions(userId, sessions);
  }
}

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
  const stableUserId = user?.email || user?.uid || guestSessionId;
  const defaultSessionId = user?.uid ? `user_${user.uid}` : guestSessionId;

  // ── Session management ───────────────────────────────────────────────────
  const [activeSessionId, setActiveSessionId] = useState(defaultSessionId);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const sessionMenuRef = useRef<HTMLDivElement>(null);

  // Cargar sesiones de localStorage al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = loadSessions(stableUserId);
    // Registrar sesión activa si no está
    if (!stored.find(s => s.id === defaultSessionId)) {
      upsertSession(stableUserId, defaultSessionId);
    }
    setSessions(loadSessions(stableUserId));
  }, [stableUserId, defaultSessionId]);

  // Cerrar menú al click fuera
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (sessionMenuRef.current && !sessionMenuRef.current.contains(e.target as Node)) {
        setShowSessionMenu(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleNewSession = useCallback(() => {
    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    upsertSession(stableUserId, newId, 'Nueva conversación');
    setSessions(loadSessions(stableUserId));
    setActiveSessionId(newId);
    setShowSessionMenu(false);
  }, [stableUserId]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setShowSessionMenu(false);
  }, []);

  const handleSessionLabelUpdate = useCallback((firstMsg: string) => {
    const label = firstMsg.slice(0, 40) + (firstMsg.length > 40 ? '…' : '');
    upsertSession(stableUserId, activeSessionId, label);
    setSessions(loadSessions(stableUserId));
  }, [stableUserId, activeSessionId]);

  const sessionId = activeSessionId;
  const userId = stableUserId;
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
    const envUrl = process.env.NEXT_PUBLIC_CHAT;
    if (envUrl) return envUrl.replace(/\/$/, '');
    return resolveChatOrigin(window.location.hostname);
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
                  {sessions.find(s => s.id === activeSessionId)?.label || 'Asistente inteligente'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Session selector */}
              <div className="relative" ref={sessionMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowSessionMenu(v => !v)}
                  className="p-1.5 hover:bg-pink-100 rounded-lg transition-colors"
                  title="Conversaciones"
                >
                  <IoChatbubbleOutline className="text-gray-600 w-4 h-4" />
                </button>

                {showSessionMenu && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    {/* Nueva conversación */}
                    <button
                      type="button"
                      onClick={handleNewSession}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-pink-600 hover:bg-pink-50 transition-colors border-b border-gray-100"
                    >
                      <IoAddOutline className="w-4 h-4 shrink-0" />
                      Nueva conversación
                    </button>

                    {/* Lista de sesiones */}
                    <div className="max-h-56 overflow-y-auto">
                      {sessions.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-gray-400 text-center">Sin conversaciones anteriores</p>
                      ) : (
                        sessions.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectSession(s.id)}
                            className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${s.id === activeSessionId ? 'bg-pink-50' : ''}`}
                          >
                            <IoTimeOutline className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className={`text-xs truncate ${s.id === activeSessionId ? 'text-pink-600 font-medium' : 'text-gray-700'}`}>
                                {s.label}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(s.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Abrir en pestaña completa */}
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

          {/* Copilot integrado nativo: MessageList + InputEditor, SSE directo a api-ia */}
          <div className="flex-1 overflow-hidden min-h-0">
            <CopilotEmbed
              userId={userId}
              sessionId={sessionId}
              development={development}
              eventId={eventId}
              eventName={event?.nombre}
              isGuest={isGuest}
              onFirstMessage={handleSessionLabelUpdate}
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
