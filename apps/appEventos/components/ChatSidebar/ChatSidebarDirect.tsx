/**
 * Panel lateral del Copilot — nativo (sin iframe).
 *
 * Header con dropdown de conversaciones estilo Cursor:
 *   [✨] [Conversación activa ▼]  |  [+ Nueva] [↗] [✕]
 *
 * El dropdown despliega la lista de conversaciones recientes.
 */

import { FC, memo, useCallback, useRef, useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatSidebar } from '../../context/ChatSidebarContext';
import { AuthContextProvider, EventContextProvider } from '../../context';
import { CopilotEmbed } from '../Copilot/CopilotEmbed';
import type { StoredSession } from '../Copilot/SessionsPanel';
import { resolveChatOrigin } from '@bodasdehoy/shared/utils';
import {
  IoClose,
  IoSparkles,
  IoOpenOutline,
  IoChevronDown,
  IoTrashOutline,
  IoAddOutline,
} from 'react-icons/io5';

// ── Session storage helpers ──────────────────────────────────────────────────

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

function truncateLabel(label: string, max = 34) {
  if (!label) return 'Nueva conversación';
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

// ── Componente principal ────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;

const ChatSidebarDirect: FC = () => {
  const { isOpen, width, closeSidebar, setWidth } = useChatSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setActiveSessionId(prev => (stored.some(s => s.id === prev) ? prev : defaultSessionId));
  }, [stableUserId, defaultSessionId]);

  const handleNewSession = useCallback(() => {
    const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    upsertSession(stableUserId, newId, 'Nueva conversación');
    setSessions(loadSessions(stableUserId));
    setActiveSessionId(newId);
    setDropdownOpen(false);
  }, [stableUserId]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setDropdownOpen(false);
  }, []);

  const handleDeleteSession = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(stableUserId, id);
    const remaining = loadSessions(stableUserId);
    setSessions(remaining);
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

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const sessionId = activeSessionId;
  const userId = stableUserId;
  const development = config?.development || 'bodasdehoy';
  const eventId = event?._id;

  const sidebarWidthRef = useRef(width);
  const wasMobileViewportRef = useRef(false);
  useEffect(() => { sidebarWidthRef.current = width; }, [width]);

  // ── Mobile detection ────────────────────────────────────────────────────
  const applyViewportMode = useCallback(() => {
    if (typeof window === 'undefined') return;
    const mobile = window.innerWidth < MOBILE_BREAKPOINT;
    setIsMobile(mobile);
    if (mobile) {
      wasMobileViewportRef.current = true;
      const vw = window.innerWidth;
      if (sidebarWidthRef.current !== vw) setWidth(vw);
    } else if (wasMobileViewportRef.current) {
      wasMobileViewportRef.current = false;
    }
  }, [setWidth]);

  useLayoutEffect(() => { applyViewportMode(); }, [applyViewportMode]);

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

  // ── Abrir en nueva pestaña ──────────────────────────────────────────────
  const copilotUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const envUrl = process.env.NEXT_PUBLIC_CHAT;
    if (envUrl) return envUrl.replace(/\/$/, '');
    return resolveChatOrigin(window.location.hostname);
  }, []);

  const handleOpenInNewTab = useCallback(() => {
    const params = new URLSearchParams({ sessionId: sessionId || guestSessionId, userId, development });
    if (user?.email) params.set('email', user.email);
    if (eventId) params.set('eventId', eventId);
    if (event?.nombre) params.set('eventName', event.nombre);
    window.open(`${copilotUrl}?${params.toString()}`, '_blank', 'noopener,noreferrer');
  }, [sessionId, guestSessionId, userId, development, user?.email, eventId, event?.nombre, copilotUrl]);

  const activeSessionLabel = sessions.find(s => s.id === activeSessionId)?.label || 'Nueva conversación';

  const overlayPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === 'undefined' || !isOpen || !isMobile) return;
    const { body, documentElement: html } = document;
    const prevBody = body.style.overflow;
    const prevHtml = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    return () => { body.style.overflow = prevBody; html.style.overflow = prevHtml; };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!isOpen || !isMobile) return;
    const id = requestAnimationFrame(() => { overlayPanelRef.current?.focus({ preventScroll: true }); });
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
          <div className="flex items-center px-2 py-2 sm:px-3 border-b border-gray-200 bg-white [color-scheme:light] flex-shrink-0 gap-2">

            {/* Icono sparkles */}
            <IoSparkles className="text-pink-500 text-base shrink-0" aria-hidden />

            {/* Dropdown de conversación — ocupa el espacio restante */}
            <div ref={dropdownRef} className="relative flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-1 w-full min-w-0 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-left group"
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                title="Cambiar conversación"
              >
                <span
                  id="copilot-sidebar-title"
                  className="flex-1 min-w-0 text-sm font-medium text-gray-800 truncate leading-tight"
                >
                  {truncateLabel(activeSessionLabel, 28)}
                </span>
                <IoChevronDown
                  className={`shrink-0 w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown list */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                    role="listbox"
                    aria-label="Conversaciones"
                  >
                    {/* Botón nueva conversación en el top del dropdown */}
                    <button
                      type="button"
                      onClick={handleNewSession}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-pink-600 hover:bg-pink-50 transition-colors border-b border-gray-100"
                    >
                      <IoAddOutline className="w-4 h-4 shrink-0" />
                      Nueva conversación
                    </button>

                    {/* Lista de conversaciones */}
                    <div className="max-h-56 overflow-y-auto">
                      {sessions.map(session => {
                        const isActive = session.id === activeSessionId;
                        return (
                          <div
                            key={session.id}
                            role="option"
                            aria-selected={isActive}
                            className={`flex items-center gap-1 px-3 py-2 cursor-pointer group/item transition-colors ${
                              isActive ? 'bg-pink-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => handleSelectSession(session.id)}
                          >
                            <span className={`flex-1 min-w-0 text-xs truncate ${isActive ? 'text-pink-700 font-medium' : 'text-gray-700'}`}>
                              {truncateLabel(session.label, 30)}
                            </span>
                            {/* Borrar — solo visible en hover */}
                            {sessions.length > 1 && (
                              <button
                                type="button"
                                onClick={e => handleDeleteSession(e, session.id)}
                                className="shrink-0 p-1 rounded opacity-0 group-hover/item:opacity-100 hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all"
                                title="Eliminar conversación"
                              >
                                <IoTrashOutline className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Acciones derecha */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="p-1.5 hover:bg-pink-100 rounded-lg transition-colors touch-manipulation inline-flex items-center justify-center"
                title="Abrir completo en nueva pestaña"
              >
                <IoOpenOutline className="text-gray-500 w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={closeSidebar}
                className="p-1.5 hover:bg-pink-50 rounded-lg transition-colors touch-manipulation inline-flex items-center justify-center"
                title="Cerrar"
              >
                <IoClose className="text-gray-500 w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Chat embed ──────────────────────────────────────────────── */}
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

        {/* Resize handle — solo desktop */}
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
