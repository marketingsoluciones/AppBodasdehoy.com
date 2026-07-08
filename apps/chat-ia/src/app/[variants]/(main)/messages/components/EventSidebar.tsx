'use client';

/**
 * EventSidebar — sidebar derecho de /messages cuando la conversación
 * está vinculada a un EVENTO (Diseño P9 24-jun).
 *
 * Layout (top → bottom):
 *   1. Avatar + nombre + teléfono
 *   2. Estado RSVP — 3 botones ✅⏳❌ editables (cambio optimista)
 *   3. Asignación → picker (placeholder hoy, picker real próximo sprint)
 *   4. Etiquetas (lectura — gestión en próximo commit)
 *   5. NotesPanel (vía ConversationNotesSidebar)
 *
 * Para modo Soporte (linkedEventId vacío), usar ConversationNotesSidebar
 * directamente — sin RSVP ni datos de evento (Diseño P9).
 *
 * RSVP: mutación api-mcp `actualizarInvitado` cuando exista el bridge
 * conversation↔invitado (D3 backend pendiente). Mientras: cambio local
 * optimista + log para diagnóstico. Anotado en FASE B v2.0 backlog.
 */
import { useEffect, useRef, useState } from 'react';

import {
  callMcpGraphQL,
  GQL_UPDATE_GUEST_RSVP_BY_CONVERSATION,
  GQL_ASSIGN_CONVERSATION_TO_USER,
  GQL_SEARCH_CRM_USERS,
} from '@bodasdehoy/shared/crm-ui';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { ConversationNotesSidebar } from './ConversationNotesSidebar';

export type RsvpStatus = 'confirmed' | 'pending' | 'declined';

interface EventSidebarProps {
  conversationId: string;
  contactName?: string;
  contactPhone?: string;
  linkedContactId?: string | null;
  linkedEventId: string;
  eventLabel?: string;
  /** RSVP actual del invitado (undefined si aún no hay relación contact↔guest). */
  rsvpStatus?: RsvpStatus;
  /** Persona/equipo asignado a la conversación. */
  assignedTo?: { id: string; name: string; kind: 'user' | 'team' } | null;
  /** Canal de la conversación para que NotesPanel use entityType correcto.
   *  WA → CONVERSATION; otros canales → ENTITY (evita HTTP 400 resolver). */
  channel?: string;
}

const RSVP_BUTTONS: Array<{
  value: RsvpStatus;
  icon: string;
  label: string;
  activeBg: string;
  activeBorder: string;
  activeColor: string;
}> = [
  {
    value: 'confirmed',
    icon: '✓',
    label: 'Conf.',
    activeBg: '#DCFCE7',
    activeBorder: '#22C55E',
    activeColor: '#15803D',
  },
  {
    value: 'pending',
    icon: '⏳',
    label: 'Pend.',
    activeBg: '#FEF6E7',
    activeBorder: '#F59E0B',
    activeColor: '#B45309',
  },
  {
    value: 'declined',
    icon: '✕',
    label: 'Decl.',
    activeBg: '#FFE4E6',
    activeBorder: '#F43F5E',
    activeColor: '#9F1239',
  },
];

export function EventSidebar({
  conversationId,
  contactName,
  contactPhone,
  linkedContactId,
  linkedEventId,
  eventLabel,
  rsvpStatus: initialRsvp,
  assignedTo,
  channel,
}: EventSidebarProps) {
  // Cambio optimista cableado a api-mcp commit 926b5df (25-jun):
  //   updateGuestRsvpByConversation(conversationId, status) → GuestRsvpResponse
  // Devuelve objeto (NO Boolean) — leer .success para confirmar/revertir.
  // Sincronizamos también si llega un initialRsvp distinto (props cambian
  // cuando navega de una conv a otra).
  const { checkAuth } = useAuthCheck();
  const currentUserId = checkAuth().userId || null;
  const [rsvp, setRsvp] = useState<RsvpStatus | undefined>(initialRsvp);
  const [savingRsvp, setSavingRsvp] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [assignPickerOpen, setAssignPickerOpen] = useState(false);
  const assignPickerRef = useRef<HTMLDivElement>(null);
  // Lista usuarios workspace (api-mcp searchCRMUsers). Búsqueda debounced.
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<
    Array<{ id: string; name: string; email?: string | null }>
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setRsvp(initialRsvp);
    setRsvpError(null);
  }, [initialRsvp, conversationId]);

  const handleRsvpClick = async (next: RsvpStatus) => {
    if (savingRsvp || rsvp === next) return;
    const prev = rsvp;
    setRsvp(next);
    setSavingRsvp(true);
    setRsvpError(null);

    try {
      const data = await callMcpGraphQL<{
        updateGuestRsvpByConversation: {
          success: boolean;
          message?: string | null;
          guestStatus?: string | null;
          eventId?: string | null;
          invitadoId?: string | null;
        };
      }>(GQL_UPDATE_GUEST_RSVP_BY_CONVERSATION, {
        conversationId,
        status: next,
      });
      const ok = data?.updateGuestRsvpByConversation?.success === true;
      if (!ok) {
        setRsvp(prev);
        setRsvpError(
          data?.updateGuestRsvpByConversation?.message ||
            'No se pudo actualizar el RSVP del invitado.',
        );
      }
    } catch (err: any) {
      setRsvp(prev);
      setRsvpError(err?.message || 'Error de red al actualizar RSVP.');
    } finally {
      setSavingRsvp(false);
    }
  };

  const [savingAssign, setSavingAssign] = useState(false);
  const [assignedToLocal, setAssignedToLocal] = useState<
    { id: string; name: string; kind: 'user' | 'team' } | null | undefined
  >(assignedTo);

  useEffect(() => {
    setAssignedToLocal(assignedTo);
  }, [assignedTo, conversationId]);

  // Cerrar picker al hacer click fuera
  useEffect(() => {
    if (!assignPickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (assignPickerRef.current && !assignPickerRef.current.contains(e.target as Node)) {
        setAssignPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [assignPickerOpen]);

  // Búsqueda usuarios workspace via api-mcp searchCRMUsers (debounced 250ms).
  useEffect(() => {
    if (!assignPickerOpen) return;
    const t = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const data = await callMcpGraphQL<{
          searchCRMUsers: { users: Array<{ user_id: string; name: string; email: string | null }> };
        }>(GQL_SEARCH_CRM_USERS, { search: userSearch || null, limit: 20 });
        const list = data?.searchCRMUsers?.users ?? [];
        // Excluir el currentUser para no duplicar con "Asignármela a mí".
        setUserResults(list.filter((u) => u.user_id !== currentUserId));
      } catch {
        setUserResults([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [assignPickerOpen, userSearch, currentUserId]);

  const handleAssignToUser = async (userId: string | null, userLabel?: string) => {
    if (savingAssign) return;
    const prev = assignedToLocal;
    setSavingAssign(true);
    // Optimistic UI
    setAssignedToLocal(
      userId ? { id: userId, kind: 'user', name: userLabel || userId } : null,
    );
    try {
      const data = await callMcpGraphQL<{ assignConversationToUser: boolean | null }>(
        GQL_ASSIGN_CONVERSATION_TO_USER,
        { conversationId, userId },
      );
      if (data?.assignConversationToUser !== true) {
        setAssignedToLocal(prev);
      }
    } catch (err) {
      setAssignedToLocal(prev);
      // eslint-disable-next-line no-console
      console.warn('[EventSidebar] assign user falló:', err);
    } finally {
      setSavingAssign(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* 1. Header contacto */}
      <div className="border-b border-gray-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-rose-500 text-xs font-semibold text-white">
            {(contactName || '?')
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-800">
              {contactName || 'Contacto'}
            </div>
            {contactPhone && (
              <div className="truncate text-[11px] text-gray-500">{contactPhone}</div>
            )}
          </div>
        </div>
        {eventLabel && (
          <div
            className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: '#FFE4E6', color: '#9F1239' }}
          >
            <span aria-hidden>💍</span>
            <span className="truncate">{eventLabel}</span>
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* 2. RSVP */}
        <div className="border-b border-gray-100 px-3 py-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            RSVP
          </div>
          {rsvpError && (
            <div
              className="mb-1.5 rounded px-2 py-1 text-[10px]"
              style={{ backgroundColor: '#FFE4E6', color: '#9F1239', borderLeft: '2px solid #F43F5E' }}
              role="alert"
            >
              {rsvpError}
            </div>
          )}
          <div className="flex gap-1">
            {RSVP_BUTTONS.map((b) => {
              const isActive = rsvp === b.value;
              return (
                <button
                  aria-pressed={isActive}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-60"
                  disabled={savingRsvp}
                  key={b.value}
                  onClick={() => handleRsvpClick(b.value)}
                  style={
                    isActive
                      ? {
                          backgroundColor: b.activeBg,
                          borderColor: b.activeBorder,
                          color: b.activeColor,
                        }
                      : {
                          backgroundColor: '#fff',
                          borderColor: '#E6E5EC',
                          color: '#6B6678',
                        }
                  }
                  type="button"
                >
                  <span aria-hidden>{b.icon}</span>
                  <span>{b.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Asignación — picker user-only (api-mcp commit 926b5df, 25-jun) */}
        <div className="relative border-b border-gray-100 px-3 py-3" ref={assignPickerRef}>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Asignado a
          </div>
          <button
            aria-expanded={assignPickerOpen}
            aria-haspopup="listbox"
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 px-2 py-1.5 text-xs transition-colors hover:bg-gray-50 disabled:opacity-60"
            disabled={savingAssign}
            onClick={() => setAssignPickerOpen((v) => !v)}
            type="button"
          >
            {assignedToLocal ? (
              <span className="flex items-center gap-2 truncate">
                <span aria-hidden className="text-base">
                  {assignedToLocal.kind === 'team' ? '👥' : '👤'}
                </span>
                <span className="truncate text-gray-800">{assignedToLocal.name}</span>
              </span>
            ) : (
              <span className="text-gray-500">Sin asignar</span>
            )}
            <span aria-hidden className="opacity-60">
              ▾
            </span>
          </button>

          {assignPickerOpen && (
            <div
              className="absolute left-3 right-3 top-full z-20 mt-1 rounded-xl border border-gray-200 bg-white shadow-lg"
              role="listbox"
            >
              {/* Asignármela a mí — siempre primero, color verde Diseño */}
              {currentUserId && (
                <button
                  className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-[12px] transition-colors hover:bg-gray-50"
                  onClick={() => {
                    void handleAssignToUser(currentUserId, 'Yo');
                    setAssignPickerOpen(false);
                  }}
                  role="option"
                  aria-selected={assignedToLocal?.id === currentUserId}
                  type="button"
                  style={{ color: '#16A34A' }}
                >
                  <span aria-hidden className="text-base">⤴</span>
                  <span className="font-semibold">Asignármela a mí</span>
                </button>
              )}
              {/* Desasignar */}
              {assignedToLocal && (
                <button
                  className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-[12px] text-gray-700 transition-colors hover:bg-gray-50"
                  onClick={() => {
                    void handleAssignToUser(null);
                    setAssignPickerOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  <span aria-hidden>✕</span>
                  <span>Desasignar</span>
                </button>
              )}
              {/* Lista usuarios workspace via api-mcp searchCRMUsers */}
              <div className="border-b border-gray-100 px-2 py-1.5">
                <input
                  aria-label="Buscar usuarios"
                  className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] focus:border-violet-500 focus:outline-none"
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar miembros del equipo…"
                  type="text"
                  value={userSearch}
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {loadingUsers && (
                  <div className="px-3 py-2 text-[10px] text-gray-400">Cargando…</div>
                )}
                {!loadingUsers && userResults.length === 0 && (
                  <div className="px-3 py-2 text-[10px] text-gray-400">
                    {userSearch ? 'Sin resultados' : 'No hay más miembros'}
                  </div>
                )}
                {!loadingUsers &&
                  userResults.map((u) => (
                    <button
                      className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-[12px] transition-colors hover:bg-gray-50"
                      key={u.user_id}
                      onClick={() => {
                        void handleAssignToUser(u.user_id, u.name);
                        setAssignPickerOpen(false);
                      }}
                      role="option"
                      aria-selected={assignedToLocal?.id === u.user_id}
                      type="button"
                    >
                      <span aria-hidden className="text-base">👤</span>
                      <span className="min-w-0 flex-1 truncate">
                        <span className="block truncate text-gray-800">{u.name}</span>
                        {u.email && (
                          <span className="block truncate text-[10px] text-gray-500">{u.email}</span>
                        )}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Notas (reusa ConversationNotesSidebar — con migración + Pinned UI) */}
        <div className="p-2">
          <ConversationNotesSidebar
            conversationId={conversationId}
            contactName={contactName}
            linkedContactId={linkedContactId}
            linkedEventId={linkedEventId}
            channel={channel}
            compact
          />
        </div>
      </div>
    </div>
  );
}
