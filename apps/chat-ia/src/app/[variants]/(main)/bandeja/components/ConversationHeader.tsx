'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useConversations } from '../hooks/useConversations';
import { useConversationActions } from '../hooks/useConversationActions';
import { ConversationStatus, useConversationMeta } from '../hooks/useConversationMeta';
import { ChannelBadge } from './ChannelBadge';
import { useBandejaBrand } from '../utils/brand';
import { dedupeFetch } from '../utils/dedupeFetch';
import { IaLevelPicker, type IaLevel } from './IaLevelPicker';

interface ConversationHeaderProps {
  channel?: string;
  conversationId: string;
  onSearchFilter?: (term: string) => void;
  /** Rediseño A.4 (18-jul): controla el sidebar desplegable de detalles. */
  detailsOpen?: boolean;
  onToggleDetails?: () => void;
}

export function ConversationHeader({
  channel,
  conversationId,
  onSearchFilter,
  detailsOpen,
  onToggleDetails,
}: ConversationHeaderProps) {
  const brand = useBandejaBrand();
  const { conversations, loading: convListLoading } = useConversations(channel ?? null);
  const conversation = conversations.find((c) => c.id === conversationId);

  // QA bug 25-jun: si la conversación no aparece en la lista (canal Web sin
  // resultado, o conv huérfana), el header se quedaba "Cargando..." eterno.
  // Damos 5s de gracia; tras eso renderizamos UI mínima con datos del URL.
  const [graceExpired, setGraceExpired] = useState(false);
  useEffect(() => {
    setGraceExpired(false);
    const t = setTimeout(() => setGraceExpired(true), 5000);
    return () => clearTimeout(t);
  }, [conversationId]);

  const { checkAuth } = useAuthCheck();
  const { userId } = checkAuth();
  const { meta, assignToUser, setStatus } = useConversationMeta(conversationId);
  const assignedToMe = !!(userId && meta.assignedUserId && meta.assignedUserId === userId);
  const status: ConversationStatus = meta.status ?? 'open';

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  // FASE B v2.0: nivel IA por workspace (Diseño P2: scope workspace).
  // Persistencia api-ia (commit 9080fe9):
  //   GET  /api/messages/workspace/{dev}/ia-config
  //   POST /api/messages/workspace/{dev}/ia-config
  //     body: { ia_level?, autopilot_threshold? }
  // Default 'copilot' mientras carga + si falla GET.
  // BUG-04 hydration (27-jun): leer localStorage durante render produce
  // mismatch SSR/CSR. Inicial vacío + hidratar en effect post-mount.
  const [development, setDevelopment] = useState<string>(checkAuth().development || 'bodasdehoy');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromStorage = localStorage.getItem('current_development');
    if (fromStorage && fromStorage !== development) setDevelopment(fromStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [iaLevel, setIaLevel] = useState<IaLevel>('copilot');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // H2 (QA 6-ago): dedup del GET de ia-config (el header se monta 2x al abrir).
        const res = await dedupeFetch(`/api/messages/workspace/${encodeURIComponent(development)}/ia-config`);
        if (!res.ok) return;
        const json = await res.json();
        const lvl = json?.config?.ia_level;
        if (!cancelled && (lvl === 'manual' || lvl === 'copilot' || lvl === 'autopilot')) {
          setIaLevel(lvl);
        }
      } catch {
        /* silencio — mantiene default 'copilot' */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [development]);

  const persistIaLevel = async (next: IaLevel) => {
    try {
      await fetch(`/api/messages/workspace/${encodeURIComponent(development)}/ia-config`, {
        body: JSON.stringify({ ia_level: next }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[ConversationHeader] persistIaLevel falló:', err);
    }
  };
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Keyboard shortcuts: Ctrl+K to open search, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        if (searchOpen) closeSearch();
        if (menuOpen) setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [searchOpen, menuOpen]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    onSearchFilter?.(value);
  }, [onSearchFilter]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchTerm('');
    onSearchFilter?.('');
  };

  const { isMuted, toggleArchive, toggleMute, clearChat } = useConversationActions();
  const conversationMuted = isMuted(conversationId);

  const handleMenuAction = (action: string) => {
    setMenuOpen(false);
    switch (action) {
      case 'archive': {
        toggleArchive(conversationId);
        break;
      }
      case 'mute': {
        toggleMute(conversationId);
        break;
      }
      case 'clear': {
        clearChat(conversationId);
        break;
      }
    }
  };

  if (!conversation) {
    // Mientras carga la lista y dentro de la gracia: spinner mínimo.
    if (convListLoading || !graceExpired) {
      return (
        <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-purple-500" />
            <span>Cargando…</span>
          </div>
        </div>
      );
    }
    // Fallback tras gracia: render mínimo con el conversationId (no bloqueante).
    // Permite seguir interactuando (notas, mensajes) aunque la conv no esté
    // en la lista del canal pedido (puede venir de otro endpoint backend).
    // TICKET P1 (24-jul): NUNCA exponer el id interno del canal/conversación al usuario.
    // Antes se filtraba "No disponible en la lista de wa-69d8…". Copy neutral + amable.
    // El estado solo-lectura (banner + compositor) lo pinta la página del hilo.
    return (
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-500">
            ⚠
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-gray-700">Conversación anterior</h2>
            <p className="truncate text-xs text-gray-500">
              El historial sigue disponible. Conexión no activa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Simulate online status based on recent activity
  const lastMsgTime = new Date(conversation.lastMessage.timestamp).getTime();
  const minutesAgo = (Date.now() - lastMsgTime) / 60_000;
  const isOnline = minutesAgo < 5;

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EDEDF0' }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Left: Contact Info */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar 40x40 con presence + punto canal */}
          <div className="relative flex-shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold"
              style={{ backgroundColor: '#F2F1F6', color: '#1C1C22' }}
            >
              {conversation.contact.name.charAt(0).toUpperCase()}
            </div>
            {isOnline && (
              <span
                aria-label="En línea"
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: '#22C55E', boxShadow: '0 0 0 2px #FFFFFF' }}
              />
            )}
          </div>

          {/* Info: nombre + ChannelBadge (preservado) + IaLevelPicker (preservado) */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold" style={{ color: '#1C1C22' }}>
                {conversation.contact.name}
              </h2>
              <ChannelBadge channel={conversation.channel} size="sm" />
              {/* IaLevelPicker PRESERVADO 3-niveles — solo se rediseña visualmente
                  desde su propio componente en un bloque posterior si se decide. */}
              <IaLevelPicker
                level={iaLevel}
                onChange={(next) => {
                  // Optimistic UI + persistir via api-ia.
                  setIaLevel(next);
                  void persistIaLevel(next);
                }}
              />
            </div>
            <p className="mt-0.5 truncate text-xs" style={{ color: '#84848F' }}>
              {isOnline
                ? 'En línea'
                : conversation.contact.phone ||
                  conversation.contact.username ||
                  'Sin info de contacto'}
            </p>
            {/* FASE 2 Agentes (17-ago, FALLO 2 QA): responsable = AGENTE IA de esta
                conversación, visible también en el detalle (no solo en la lista). Solo
                se pinta cuando hay assignedAgentName (null-safe). Distinto del botón
                "Asignada" de la derecha, que es la asignación a un HUMANO. */}
            {conversation.assignedAgentName ? (
              <span
                aria-label={`Responsable: ${conversation.assignedAgentName}`}
                className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: '#EDE9FE', color: '#6B4EFF' }}
              >
                <span aria-hidden="true">🤖</span>
                <span className="truncate">Responsable: {conversation.assignedAgentName}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <div className="hidden items-center gap-1.5 md:flex">
            {/* Selector estado — solo select, sin duplicar pill (la señal cromática
                queda en el select mismo). */}
            <select
              aria-label="Cambiar estado de la conversación"
              className="rounded-md px-2 py-1 text-xs focus:outline-none"
              onChange={(e) => setStatus(e.target.value as ConversationStatus)}
              style={{
                backgroundColor:
                  status === 'open' ? '#FFFFFF' : status === 'pending' ? '#FEF3C7' : '#F2F1F6',
                border: `1px solid ${
                  status === 'open' ? '#EDEDF0' : status === 'pending' ? '#FCD34D' : '#EDEDF0'
                }`,
                color:
                  status === 'open' ? '#1C1C22' : status === 'pending' ? '#92400E' : '#84848F',
              }}
              value={status}
            >
              <option value="open">Abierta</option>
              <option value="pending">En espera</option>
              <option value="closed">Cerrada</option>
            </select>

            {/* Asignación */}
            <button
              className="rounded-md px-2 py-1 text-xs transition-colors"
              onClick={() => {
                if (!userId) return;
                assignToUser(assignedToMe ? null : userId);
              }}
              style={{
                backgroundColor: assignedToMe ? brand.brandBg : '#FFFFFF',
                border: `1px solid ${assignedToMe ? brand.brandBg : '#EDEDF0'}`,
                color: assignedToMe ? brand.brand : '#84848F',
                fontWeight: assignedToMe ? 500 : 400,
              }}
              type="button"
            >
              {assignedToMe ? 'Asignada a ti' : meta.assignedUserId ? 'Asignada' : 'Sin asignar'}
            </button>
          </div>

          {/* Botón búsqueda con Lucide SVG (antes emoji 🔍) */}
          <button
            aria-label="Buscar en conversación"
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            style={{
              backgroundColor: searchOpen ? brand.brandBg : 'transparent',
              color: searchOpen ? brand.brand : '#84848F',
            }}
            onMouseEnter={(e) => {
              if (!searchOpen) e.currentTarget.style.backgroundColor = '#F2F1F6';
            }}
            onMouseLeave={(e) => {
              if (!searchOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Buscar en conversación (⌘K)"
            type="button"
          >
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              width="16"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          {/* Botón llamar disabled — Lucide phone SVG (antes emoji 📞) */}
          <button
            aria-label="Llamar (próximamente)"
            className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md"
            disabled
            style={{ color: '#D4D4D8' }}
            title="Llamar (próximamente)"
            type="button"
          >
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              width="16"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>

          {/* Toggle "Detalles" — abre/cierra el sidebar derecho (A.4) */}
          {onToggleDetails && (
            <button
              aria-label={detailsOpen ? 'Ocultar detalles' : 'Mostrar detalles'}
              aria-pressed={!!detailsOpen}
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
              onClick={onToggleDetails}
              style={{
                backgroundColor: detailsOpen ? brand.brandBg : 'transparent',
                color: detailsOpen ? brand.brand : '#84848F',
              }}
              onMouseEnter={(e) => {
                if (!detailsOpen) e.currentTarget.style.backgroundColor = '#F2F1F6';
              }}
              onMouseLeave={(e) => {
                if (!detailsOpen) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={detailsOpen ? 'Ocultar detalles del contacto' : 'Mostrar detalles del contacto'}
              type="button"
            >
              {/* Lucide PanelRightOpen / PanelRightClose (stroke 1.8) */}
              <svg
                fill="none"
                height="16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                width="16"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="15" x2="15" y1="3" y2="21" />
              </svg>
            </button>
          )}
          {/* Menú más opciones — Lucide MoreVertical (antes ⋮) */}
          <div className="relative" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              aria-label="Más opciones"
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                backgroundColor: menuOpen ? '#F2F1F6' : 'transparent',
                color: menuOpen ? '#1C1C22' : '#84848F',
              }}
              onMouseEnter={(e) => {
                if (!menuOpen) e.currentTarget.style.backgroundColor = '#F2F1F6';
              }}
              onMouseLeave={(e) => {
                if (!menuOpen) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Más opciones"
              type="button"
            >
              <svg
                fill="none"
                height="16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                width="16"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg py-1"
                role="menu"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EDEDF0',
                  boxShadow: '0 4px 12px rgba(28,28,34,0.08)',
                }}
              >
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
                  onClick={() => handleMenuAction('archive')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2F1F6')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  style={{ color: '#1C1C22' }}
                  type="button"
                >
                  Archivar conversación
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
                  onClick={() => handleMenuAction('mute')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2F1F6')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  style={{ color: '#1C1C22' }}
                  type="button"
                >
                  {conversationMuted ? 'Activar sonido' : 'Silenciar'}
                </button>
                <div style={{ borderTop: '1px solid #EDEDF0', margin: '4px 0' }} />
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors"
                  onClick={() => handleMenuAction('clear')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  style={{ color: '#DC2626' }}
                  type="button"
                >
                  Limpiar chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline search bar rediseñada con tokens del sistema */}
      {searchOpen && (
        <div
          className="flex items-center gap-2 px-4 py-2"
          style={{ borderTop: '1px solid #EDEDF0' }}
        >
          <svg
            aria-hidden
            fill="none"
            height="14"
            stroke="#9A9AA6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
            width="14"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar mensajes..."
            ref={searchInputRef}
            style={{ color: '#1C1C22' }}
            type="text"
            value={searchTerm}
          />
          {searchTerm && (
            <button
              className="text-xs transition-colors"
              onClick={closeSearch}
              style={{ color: '#84848F' }}
              type="button"
            >
              Cerrar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
