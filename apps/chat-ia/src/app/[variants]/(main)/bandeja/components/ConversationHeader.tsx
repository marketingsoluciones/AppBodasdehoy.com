'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import {
  blockConversation,
  setConversationAgent,
  unblockConversation,
} from '@/services/mcpApi/whatsapp';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { LobeSessionType, type LobeAgentSession } from '@/types/session';
import { isWhatsAppView } from '../utils/channelClassify';
import { useAgentAssignmentOverrides } from '../hooks/useAgentAssignmentOverrides';
import { useConversations } from '../hooks/useConversations';
import { useConversationActions } from '../hooks/useConversationActions';
import { ConversationStatus, useConversationMeta } from '../hooks/useConversationMeta';
import { generateSummary } from '../hooks/useDraftSync';
import { ChannelBadge } from './ChannelBadge';
import { useBandejaBrand } from '../utils/brand';
import { describeVisibility } from '../utils/visibility';
import { ChannelTypeChip } from './ChannelTypeChip';
import { ConversationSummary } from './ConversationSummary';
import { SharePanel } from './SharePanel';
import { IaModeBadge } from './RowIndicators';

interface ConversationHeaderProps {
  channel?: string;
  conversationId: string;
  /** Rediseño A.4 (18-jul): controla el sidebar desplegable de detalles. */
  detailsOpen?: boolean;
  onSearchFilter?: (term: string) => void;
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
  const router = useRouter();
  const {
    conversations,
    loading: convListLoading,
    refetch: refetchConversations,
  } = useConversations(channel ?? null);
  const conversation = conversations.find((c) => c.id === conversationId);
  const conversationVisibility = describeVisibility(conversation?.sharedWith);
  // Bloqueo (auditoría 15-09, Problema 4a): la mutación existía en api-mcp desde hace
  // tiempo y el front no la llamaba. `blocked` ya está en el enum de estado.
  const [shareOpen, setShareOpen] = useState(false);
  // Atajo desde la lista: el icono de acceso de cada fila entra aquí con ?compartir=1 para
  // que no haya que buscar el botón después de abrir la conversación.
  const parametros = useSearchParams();
  useEffect(() => {
    if (parametros?.get('compartir') === '1') setShareOpen(true);
  }, [parametros]);
  const [blockOverride, setBlockOverride] = useState<boolean | null>(null);
  const [blocking, setBlocking] = useState(false);
  const isBlocked =
    blockOverride ?? String((conversation as any)?.status ?? '').toLowerCase() === 'blocked';

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
  // ASIGNAR AGENTE (24-ago): api-mcp confirmó la mutation setConversationAgent
  // (typeDefs/whatsapp.ts:454). Hasta hoy el chip "Responsable" era de SOLO
  // LECTURA: se veía quién atendía y no había forma de cambiarlo. La lista de
  // agentes es la misma que /agentes (sesiones type='agent', backend real).
  // Solo en conversaciones de WhatsApp: la mutation vive en el store de
  // WhatsApp de api-mcp; para email/telegram/web no hay a quién escribirle.
  const agentSessions = useSessionStore((st) => {
    const all = sessionSelectors.defaultSessions(st);
    return all.filter(
      (session): session is LobeAgentSession => session.type === LobeSessionType.Agent,
    );
  });
  const canAssignAgent = isWhatsAppView(channel) && agentSessions.length > 0;
  // Override optimista: api-ia mirror-ea el valor, pero no al instante.
  const [agentOverride, setAgentOverride] = useState<{ id: string | null; name: string | null } | null>(null);
  // Override para la LISTA (este de arriba solo afecta a esta cabecera).
  const setAgentOverrideForList = useAgentAssignmentOverrides((st) => st.setOverride);
  const [assigningAgent, setAssigningAgent] = useState(false);
  useEffect(() => {
    setAgentOverride(null);
  }, [conversationId]);
  const handleAssignAgent = async (agentId: string) => {
    const next = agentId || null;
    const nextName = next
      ? (agentSessions.find((a) => a.id === next)?.meta?.title ?? 'Agente')
      : null;
    const previous = agentOverride;
    setAgentOverride({ id: next, name: nextName });
    setAssigningAgent(true);
    try {
      const ok = await setConversationAgent(conversationId, next);
      if (!ok) throw new Error('respuesta negativa');
      // La escritura va a api-mcp y la LISTA lee de api-ia, que cachea el valor 120 s. Sin
      // este override, el usuario asigna un responsable y la lista no se entera durante dos
      // minutos: ni el chip ni el filtro por agente. Se retira solo al coincidir el backend.
      setAgentOverrideForList(conversationId, { id: next, name: nextName });
    } catch {
      setAgentOverride(previous);
      // eslint-disable-next-line no-alert
      alert('No se pudo cambiar el responsable. Vuelve a intentarlo en un momento.');
    } finally {
      setAssigningAgent(false);
    }
  };

  // FASE 4 Copilot (20-ago): "Resumir conversación" — resumen IA read-only (endpoint api-ia
  // /summary LIVE). NO es un borrador de respuesta: solo para que el agente se ponga al día.
  const [summary, setSummary] = useState<{ model?: string; summary: string } | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const handleSummarize = async () => {
    if (summarizing || !conversationId) return;
    setSummarizing(true);
    try {
      const s = await generateSummary(conversationId);
      setSummary(s);
    } finally {
      setSummarizing(false);
    }
  };
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
  // El nivel de la bandeja ya no se lee aquí: el indicador de la conversación lo resuelve
  // por su cuenta (propio o heredado) y cambiarlo desde esta cabecera ponía en automático las
  // noventa conversaciones creyendo tocar solo esta.
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
      case 'block': {
        void toggleBlock();
        break;
      }
    }
  };

  const toggleBlock = async () => {
    if (blocking || !conversationId) return;
    setBlocking(true);
    const next = !isBlocked;
    try {
      const ok = next
        ? await blockConversation(conversationId, development)
        : await unblockConversation(conversationId);
      // Solo movemos la UI si el backend confirma: un bloqueo "de mentira" es peor que
      // ninguno, porque el usuario cree que ese contacto ya no puede escribirle.
      if (ok) setBlockOverride(next);
      else console.warn('[ConversationHeader] el backend no confirmó el cambio de bloqueo');
    } catch (err) {
      console.warn('[ConversationHeader] bloqueo falló:', err);
    } finally {
      setBlocking(false);
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
          <button
            aria-label="Volver a la bandeja"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-100"
            onClick={() => router.push('/bandeja')}
            title="Volver a la bandeja"
            type="button"
          >
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              width="20"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
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
          {/* Volver a la bandeja: feedback owner 15-09 — el botón solo en móvil dejaba
              sin salida al panel de detalle en desktop (ventana estrecha, deep link). */}
          <button
            aria-label="Volver a la bandeja"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-md transition-colors"
            onClick={() => router.push('/bandeja')}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2F1F6')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            style={{ color: '#1C1C22' }}
            title="Volver a la bandeja"
            type="button"
          >
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              width="20"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
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
              {/* Aquí había el selector de IA de TODA la bandeja, pegado al nombre del
                  contacto (17-09). Puesto ahí parecía el modo de esta conversación, y no lo
                  era: cambiarlo ponía en automático las noventa. El modo del conjunto se
                  gobierna desde la cabecera de la lista, que es donde se ve la lista; aquí va
                  el de ESTA conversación, con el mismo icono que en su fila. */}
              {conversationId && (
                <IaModeBadge
                  conTexto
                  conversationId={conversationId}
                  development={development}
                />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="truncate text-xs" style={{ color: '#84848F' }}>
                {isOnline
                  ? 'En línea'
                  : conversation.contact.phone ||
                    conversation.contact.username ||
                    'Sin info de contacto'}
              </p>
              {/* G1 (auditoría 22-ago): tipo del número (Meta API vs QR) + salud EN CONTEXTO.
                  Render null salvo canal WhatsApp `wa-<id>` resoluble → 0 ruido. */}
              <span className="flex-none">
                <ChannelTypeChip channelParam={channel} />
              </span>
              {/* Problema 1 (auditoría 15-09): con quién está compartida, en el sitio donde
                  se trabaja la conversación, no solo en la lista. */}
              {conversationVisibility && (
                <span
                  className="flex-none rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                  title={conversationVisibility.title}
                >
                  {conversationVisibility.label}
                </span>
              )}
            </div>
            {/* FASE 2 Agentes (17-ago, FALLO 2 QA): responsable = AGENTE IA de esta
                conversación, visible también en el detalle (no solo en la lista). Solo
                se pinta cuando hay assignedAgentName (null-safe). Distinto del botón
                "Asignada" de la derecha, que es la asignación a un HUMANO. */}
            {(() => {
              const agentId = agentOverride ? agentOverride.id : (conversation.assignedAgentId ?? null);
              const agentName = agentOverride ? agentOverride.name : (conversation.assignedAgentName ?? null);
              // Con agentes disponibles el chip pasa a ser SELECTOR (mismo patrón
              // que el select de estado de la derecha). Sin ellos, o en canales
              // que no son WhatsApp, se queda como etiqueta de solo lectura.
              if (canAssignAgent) {
                return (
                  <select
                    aria-label="Cambiar el agente responsable de esta conversación"
                    className="mt-1 max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium focus:outline-none"
                    disabled={assigningAgent}
                    onChange={(e) => void handleAssignAgent(e.target.value)}
                    style={{
                      backgroundColor: agentId ? brand.brandBg : '#F2F1F6',
                      border: 'none',
                      color: agentId ? brand.brand : '#84848F',
                      cursor: assigningAgent ? 'wait' : 'pointer',
                    }}
                    title={agentName ? `Responsable: ${agentName}` : 'Sin responsable asignado'}
                    value={agentId ?? ''}
                  >
                    <option value="">🤖 Sin responsable</option>
                    {agentSessions.map((a) => (
                      <option key={a.id} value={a.id}>
                        🤖 {a.meta?.title ?? 'Agente'}
                      </option>
                    ))}
                  </select>
                );
              }
              return agentName ? (
                <span
                  aria-label={`Responsable: ${agentName}`}
                  className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: brand.brandBg, color: brand.brand }}
                >
                  <span aria-hidden="true">🤖</span>
                  <span className="truncate">Responsable: {agentName}</span>
                </span>
              ) : null;
            })()}
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

          {/* FASE 4 (20-ago): Resumir conversación (IA) — panel read-only bajo la cabecera.
              Endpoint /summary de api-ia LIVE. NO es borrador de respuesta. */}
          <button
            aria-label="Resumir conversación"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-60"
            disabled={summarizing}
            onClick={handleSummarize}
            style={{ backgroundColor: brand.brandBg, color: brand.brand }}
            title="Resumen IA de la conversación (para ponerte al día)"
            type="button"
          >
            <span aria-hidden="true">{summarizing ? '⏳' : '✦'}</span>
            {summarizing ? 'Resumiendo…' : 'Resumir'}
          </button>

          {/* Botón búsqueda con Lucide SVG (antes emoji 🔍) */}
          <button
            aria-label="Buscar en conversación"
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
            onMouseEnter={(e) => {
              if (!searchOpen) e.currentTarget.style.backgroundColor = '#F2F1F6';
            }}
            onMouseLeave={(e) => {
              if (!searchOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
            style={{
              backgroundColor: searchOpen ? brand.brandBg : 'transparent',
              color: searchOpen ? brand.brand : '#84848F',
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
          {/* El botón de llamar se retiró el 17-09: llevaba deshabilitado ("próximamente")
              ocupando un hueco en la barra principal, donde compiten once controles antes de
              poder leer un mensaje. Cuando exista la función, vuelve. */}

          {/* Toggle "Detalles" — abre/cierra el sidebar derecho (A.4) */}
          {onToggleDetails && (
            <button
              aria-label={detailsOpen ? 'Ocultar detalles' : 'Mostrar detalles'}
              aria-pressed={!!detailsOpen}
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
              onClick={onToggleDetails}
              onMouseEnter={(e) => {
                if (!detailsOpen) e.currentTarget.style.backgroundColor = '#F2F1F6';
              }}
              onMouseLeave={(e) => {
                if (!detailsOpen) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              style={{
                backgroundColor: detailsOpen ? brand.brandBg : 'transparent',
                color: detailsOpen ? brand.brand : '#84848F',
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
                <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
                <line x1="15" x2="15" y1="3" y2="21" />
              </svg>
            </button>
          )}
          {/* Menú más opciones — Lucide MoreVertical (antes ⋮) */}
          {/* M5 (16-09): compartir la conversación con personas o equipos. Las mutaciones
              existían en api-mcp desde hace tiempo y el front no llamaba a ninguna. */}
          <div className="relative">
            {/* Pastilla con el color de marca: como texto gris entre iconos pasaba
                desapercibido y la gente no encontraba la función (feedback 16-09). */}
            <button
              aria-expanded={shareOpen}
              aria-label="Compartir conversación"
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors"
              onClick={() => setShareOpen((v) => !v)}
              style={{
                backgroundColor: shareOpen ? brand.brand : brand.brandBg,
                color: shareOpen ? brand.onBrand : brand.brandText,
              }}
              title="Compartir conversación con alguien del equipo"
              type="button"
            >
              <svg
                fill="none"
                height="13"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="13"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.6" x2="15.4" y1="13.5" y2="17.5" />
                <line x1="15.4" x2="8.6" y1="6.5" y2="10.5" />
              </svg>
              Compartir
            </button>
            {shareOpen && conversationId && (
              <SharePanel
                conversationId={conversationId}
                development={development}
                onChanged={() => void refetchConversations()}
                onClose={() => setShareOpen(false)}
                sharedWith={conversation?.sharedWith ?? []}
              />
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              aria-label="Más opciones"
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              onMouseEnter={(e) => {
                if (!menuOpen) e.currentTarget.style.backgroundColor = '#F2F1F6';
              }}
              onMouseLeave={(e) => {
                if (!menuOpen) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              style={{
                backgroundColor: menuOpen ? '#F2F1F6' : 'transparent',
                color: menuOpen ? '#1C1C22' : '#84848F',
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
                  disabled={blocking}
                  onClick={() => handleMenuAction('block')}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F2F1F6')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  style={{ color: isBlocked ? '#1C1C22' : '#DC2626' }}
                  type="button"
                >
                  {blocking
                    ? 'Aplicando…'
                    : isBlocked
                      ? 'Desbloquear contacto'
                      : 'Bloquear contacto'}
                </button>
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
                  <span className="ml-auto text-[10px]" style={{ color: '#9A9AA6' }}>
                    solo aquí
                  </span>
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

      {/* FASE 4 (20-ago): panel de RESUMEN IA (read-only). Aparece bajo la cabecera al pulsar
          "✦ Resumir". Es lectura para el agente (ponerse al día), NO un borrador de respuesta. */}
      {/* Estado bloqueado bien visible: si no se ve, el operador sigue escribiendo a un
          contacto que ya no debería recibir nada (auditoría 15-09, Problema 4a). */}
      {isBlocked && (
        <div
          className="flex items-center justify-between gap-2 px-4 py-2 text-xs"
          style={{ backgroundColor: '#FEF2F2', borderTop: '1px solid #FECACA', color: '#991B1B' }}
        >
          <span>Conversación bloqueada. No se enviarán mensajes a este contacto.</span>
          <button
            className="rounded-md px-2 py-0.5 font-semibold"
            disabled={blocking}
            onClick={() => void toggleBlock()}
            style={{ border: '1px solid #FECACA', color: '#991B1B' }}
            type="button"
          >
            {blocking ? 'Aplicando…' : 'Desbloquear'}
          </button>
        </div>
      )}
      {summary && (
        <ConversationSummary
          brandColor={brand.brand}
          model={summary.model}
          onClose={() => setSummary(null)}
          summary={summary.summary}
        />
      )}

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
