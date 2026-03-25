/**
 * Panel lateral del Copilot — nativo (sin iframe).
 *
 * Layout de dos columnas:
 *   [SessionsPanel 200px | CopilotEmbed flex-1]
 *
 * El botón "Abrir completo" abre chat-ia en nueva pestaña.
 */

import { FC, memo, useCallback, useRef, useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatSidebar } from '../../context/ChatSidebarContext';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from '../../context';
import { CopilotEmbed } from '../Copilot/CopilotEmbed';
import SessionsPanel from '../Copilot/SessionsPanel';
import type { StoredSession } from '../Copilot/SessionsPanel';
import { resolveChatOrigin } from '@bodasdehoy/shared/utils';
import {
  IoClose,
  IoSparkles,
  IoOpenOutline,
  IoMenuOutline,
} from 'react-icons/io5';

// ── Session storage helpers ──────────────────────────────────────────────────

const SESSIONS_KEY = 'copilot_sessions_v1';
/** Solo desktop: recordar si el panel izquierdo de conversaciones estaba visible. */
const SESSIONS_PANEL_COLLAPSED_KEY = 'copilot_sessions_panel_collapsed';

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
    localStorage.setItem(`${SESSIONS_KEY}_${userId}`, JSON.stringify(sessions.slice(0, 20)));
  } catch { /* quota exceeded */ }
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

function deleteSession(userId: string, id: string) {
  const sessions = loadSessions(userId).filter(s => s.id !== id);
  saveSessions(userId, sessions);
}

function truncateSessionLabel(label: string, maxLength = 36) {
  if (!label) return 'Nueva conversación';
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

function readSessionsPanelCollapsedPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const v = localStorage.getItem(SESSIONS_PANEL_COLLAPSED_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch { /* ignore */ }
  return false; // open by default, like Cursor
}

function persistSessionsPanelCollapsedPreference(collapsed: boolean) {
  try {
    localStorage.setItem(SESSIONS_PANEL_COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch { /* ignore */ }
}

// ── Componente principal ────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;

const ChatSidebarDirect: FC = () => {
  const { isOpen, width, closeSidebar, setWidth } = useChatSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [sessionsCollapsed, setSessionsCollapsed] = useState(readSessionsPanelCollapsedPreference);

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

  const user = authContext?.user;
  const config = authContext?.config;
  const event = eventContext?.event;

  const isGuest = !user || user?.displayName === 'guest' || !user?.email;
  const stableUserId = user?.email || user?.uid || guestSessionId;
  const defaultSessionId = user?.uid ? `user_${user.uid}` : guestSessionId;

  // ── Session management ──────────────────────────────────────────────────
  const [activeSessionId, setActiveSessionId] = useState(defaultSessionId);
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let stored = loadSessions(stableUserId);
    if (!stored.find(s => s.id === defaultSessionId)) {
      upsertSession(stableUserId, defaultSessionId);
      stored = loadSessions(stableUserId);
    }
    setSessions(stored);
    // Tras login/logout el id activo puede ser de otro usuario (p. ej. guest_…): alinear con sesiones actuales.
    setActiveSessionId(prev => (stored.some(s => s.id === prev) ? prev : defaultSessionId));
  }, [stableUserId, defaultSessionId]);

  const handleNewSession = useCallback(() => {
    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    upsertSession(stableUserId, newId, 'Nueva conversación');
    setSessions(loadSessions(stableUserId));
    setActiveSessionId(newId);
  }, [stableUserId]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(stableUserId, id);
    const remaining = loadSessions(stableUserId);
    setSessions(remaining);
    // Si borramos la activa, ir a la primera disponible o crear nueva
    if (id === activeSessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        upsertSession(stableUserId, newId, 'Nueva conversación');
        setSessions(loadSessions(stableUserId));
        setActiveSessionId(newId);
      }
    }
  }, [stableUserId, activeSessionId]);

  const handleSessionLabelUpdate = useCallback((firstMsg: string) => {
    const label = firstMsg.slice(0, 40) + (firstMsg.length > 40 ? '…' : '');
    upsertSession(stableUserId, activeSessionId, label);
    setSessions(loadSessions(stableUserId));
  }, [stableUserId, activeSessionId]);

  const sessionId = activeSessionId;
  const userId = stableUserId;
  const development = config?.development || 'bodasdehoy';
  const eventId = event?._id;

  const sidebarWidthRef = useRef(width);
  /** Solo true tras haber estado en viewport móvil; evita resetear el panel en cada resize de escritorio. */
  const wasMobileViewportRef = useRef(false);
  useEffect(() => {
    sidebarWidthRef.current = width;
  }, [width]);

  // ── Mobile detection ────────────────────────────────────────────────────
  const applyViewportMode = useCallback(() => {
    if (typeof window === 'undefined') return;
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(mobile);
    if (mobile) {
      wasMobileViewportRef.current = true;
      setSessionsCollapsed(true); // en móvil el panel siempre colapsado (no toca preferencia guardada en localStorage)
      const vw = window.innerWidth;
      if (sidebarWidthRef.current !== vw) setWidth(vw);
    } else if (wasMobileViewportRef.current) {
      // Solo al salir de móvil → desktop: restaurar preferencia (no en cada resize de escritorio)
      wasMobileViewportRef.current = false;
      setSessionsCollapsed(readSessionsPanelCollapsedPreference());
    }
  }, [setWidth]);

  // Antes del primer pintado evita 1 frame con panel "desktop" dentro de columna 0px (grid móvil).
  useLayoutEffect(() => {
    applyViewportMode();
  }, [applyViewportMode]);

  useEffect(() => {
    window.addEventListener('resize', applyViewportMode);
    return () => window.removeEventListener('resize', applyViewportMode);
  }, [applyViewportMode]);

  // ── Resize handle ───────────────────────────────────────────────────────
  const isResizingRef = useRef(false);
  const lastXRef = useRef(0);
  const rafRef = useRef<number>(0);
  const currentWidthRef = useRef(width);
  useEffect(() => { currentWidthRef.current = width; }, [width]);

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
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - lastXRef.current;
        lastXRef.current = e.clientX;
        setWidth(Math.max(320, currentWidthRef.current + deltaX));
      });
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
  }, [setWidth]);

  // Escape para cerrar: ChatSidebarProvider (contexto global).

  // ── Abrir en nueva pestaña ──────────────────────────────────────────────
  const copilotUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const envUrl = process.env.NEXT_PUBLIC_CHAT;
    if (envUrl) return envUrl.replace(/\/$/, '');
    return resolveChatOrigin(window.location.hostname);
  }, []);

  const handleOpenInNewTab = useCallback(() => {
    const params = new URLSearchParams({
      sessionId: sessionId || guestSessionId,
      userId,
      development,
    });
    if (user?.email) params.set('email', user.email);
    if (eventId) params.set('eventId', eventId);
    if (event?.nombre) params.set('eventName', event.nombre);
    window.open(`${copilotUrl}?${params.toString()}`, '_blank', 'noopener,noreferrer');
  }, [sessionId, guestSessionId, userId, development, user?.email, eventId, event?.nombre, copilotUrl]);

  // ── Nombre de sesión activa para el header ──────────────────────────────
  const activeSessionLabel = sessions.find(s => s.id === activeSessionId)?.label;

  const overlayPanelRef = useRef<HTMLDivElement>(null);

  // Sin scroll detrás del drawer (Safari iOS a veces necesita html + body)
  useEffect(() => {
    if (typeof document === 'undefined' || !isOpen || !isMobile) return;
    const { body, documentElement: html } = document;
    const prevBody = body.style.overflow;
    const prevHtml = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
    };
  }, [isOpen, isMobile]);

  // Foco en el panel al abrir en móvil (lectores de pantalla + teclado externo)
  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const id = requestAnimationFrame(() => {
      overlayPanelRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, isMobile]);

  if (!isOpen) return null;

  const isOverlay = isMobile;

  return (
    <AnimatePresence>
      {/* Backdrop móvil */}
      {isOverlay && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-[45] md:hidden overscroll-none touch-none"
          onClick={closeSidebar}
          aria-hidden
        />
      )}

      <motion.div
        key="panel"
        ref={overlayPanelRef}
        role={isOverlay ? 'dialog' : undefined}
        aria-modal={isOverlay ? true : undefined}
        aria-labelledby={isOverlay ? 'copilot-sidebar-title' : undefined}
        tabIndex={isOverlay ? -1 : undefined}
        initial={isOverlay ? { x: '-100%' } : { opacity: 0 }}
        animate={isOverlay ? { x: 0 } : { opacity: 1 }}
        exit={isOverlay ? { x: '-100%' } : { opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={
          isOverlay
            ? 'fixed top-0 left-0 h-screen max-h-[100dvh] bg-white shadow-2xl z-50 flex flex-col overscroll-y-contain [-webkit-tap-highlight-color:transparent] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] outline-none'
            : 'h-full max-w-full bg-white shadow-xl flex flex-shrink-0 z-40 min-w-0'
        }
        style={{
          width: isOverlay ? 'min(85%, 480px)' : '100%',
          // Chrome/Android modernos: 100dvh evita cortes con barra de URL; si no aplica, queda h-screen (100vh).
          ...(isOverlay ? { height: '100dvh' } : {}),
        }}
      >
        {/* Drag pill móvil */}
        {isOverlay && (
          <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>
        )}

        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden overscroll-y-contain">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-2 py-2 sm:px-3 border-b border-gray-200 bg-white [color-scheme:light] flex-shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Toggle panel sessions */}
              {!isMobile && (
                <button
                  type="button"
                  onClick={() => {
                    setSessionsCollapsed(v => {
                      const next = !v;
                      if (!isMobile) persistSessionsPanelCollapsedPreference(next);
                      return next;
                    });
                  }}
                  className="p-1.5 hover:bg-pink-50 rounded-lg transition-colors flex-shrink-0"
                  title={sessionsCollapsed ? 'Ver conversaciones' : 'Ocultar conversaciones'}
                >
                  <IoMenuOutline className="text-gray-500 w-4 h-4" />
                </button>
              )}

              <IoSparkles className="text-pink-500 text-lg shrink-0" aria-hidden />

              <div className="min-w-0">
                <h2 id="copilot-sidebar-title" className="text-sm sm:text-base font-semibold text-gray-900 leading-tight truncate">
                  Copilot IA
                </h2>
                {activeSessionLabel && activeSessionLabel !== 'Nueva conversación' && (
                  <p className="text-[10px] text-gray-400 leading-tight truncate">
                    {activeSessionLabel}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleNewSession}
                className="inline-flex px-2 py-1.5 text-xs font-semibold text-pink-600 border border-pink-100 rounded-lg hover:bg-pink-50 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 items-center justify-center"
                title="Nueva conversación"
              >
                <span className="hidden sm:inline">Nueva</span>
                <span className="sm:hidden text-base leading-none">+</span>
              </button>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1.5 hover:bg-pink-100 rounded-lg transition-colors touch-manipulation inline-flex items-center justify-center"
                title="Abrir completo en nueva pestaña"
              >
                <IoOpenOutline className="text-gray-600 w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={closeSidebar}
                className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 hover:bg-pink-50 rounded-lg transition-colors touch-manipulation inline-flex items-center justify-center"
                title="Cerrar"
              >
                <IoClose className="text-gray-500 w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Selector de conversación móvil — solo si hay más de 1 sesión */}
          {isMobile && sessions.length > 1 && (
            <div className="sm:hidden px-2 py-1.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <select
                value={sessions.some(s => s.id === activeSessionId) ? activeSessionId : ''}
                onChange={e => { const v = e.target.value; if (v) handleSelectSession(v); }}
                aria-label="Cambiar de conversación"
                className="flex-1 min-w-0 text-xs text-gray-600 border-0 bg-transparent py-1 focus:ring-0 touch-manipulation"
              >
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {truncateSessionLabel(session.label, 30)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Cuerpo: sessions + chat ─────────────────────────────────── */}
          <div className="flex-1 flex overflow-hidden min-h-0">

            {/* Panel sesiones (colapsable) */}
            {!sessionsCollapsed && !isMobile && (
              <SessionsPanel
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelect={handleSelectSession}
                onNew={handleNewSession}
                onDelete={handleDeleteSession}
                onCollapse={() => {
                  setSessionsCollapsed(true);
                  if (!isMobile) persistSessionsPanelCollapsedPreference(true);
                }}
              />
            )}

            {/* Chat embed nativo */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <CopilotEmbed
                userId={userId}
                sessionId={sessionId}
                development={development}
                eventId={eventId}
                eventName={event?.nombre}
                isGuest={isGuest}
                className="w-full h-full"
                onFirstMessage={handleSessionLabelUpdate}
              />
            </div>
          </div>
        </div>

        {/* Resize handle — solo desktop, a la DERECHA del panel */}
        {!isMobile && (
          <div
            className="w-1 cursor-col-resize hover:bg-pink-400 active:bg-pink-600 transition-colors flex-shrink-0"
            onMouseDown={handleMouseDown}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

ChatSidebarDirect.displayName = 'ChatSidebarDirect';
export default memo(ChatSidebarDirect);
