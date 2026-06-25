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
import { useState } from 'react';

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
}: EventSidebarProps) {
  // Cambio optimista: actualizamos localmente al click; si la mutación
  // falla en backend, revertimos a `lastConfirmedRsvp`. Aún sin endpoint
  // backend confirmado — log en consola para diagnóstico mientras tanto.
  const [rsvp, setRsvp] = useState<RsvpStatus | undefined>(initialRsvp);
  const [savingRsvp, setSavingRsvp] = useState(false);

  const handleRsvpClick = async (next: RsvpStatus) => {
    if (savingRsvp || rsvp === next) return;
    const prev = rsvp;
    setRsvp(next);
    setSavingRsvp(true);

    try {
      // TODO: cuando api-mcp confirme D3 (extender actualizarInvitado para
      // aceptar phoneNumber directo) o mutación bridge contact↔guest, llamar
      // aquí con callMcpGraphQL. Por ahora solo log.
      // eslint-disable-next-line no-console
      console.info('[EventSidebar] RSVP optimista', {
        conversationId,
        linkedEventId,
        from: prev,
        to: next,
      });
      // Pseudo:
      //   await callMcpGraphQL(GQL_UPDATE_GUEST_RSVP, {
      //     conversationId, eventId: linkedEventId, status: next,
      //   });
    } catch (err) {
      // Revertir en error
      setRsvp(prev);
      // eslint-disable-next-line no-console
      console.warn('[EventSidebar] RSVP fallo, revertido:', err);
    } finally {
      setSavingRsvp(false);
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

        {/* 3. Asignación */}
        <div className="border-b border-gray-100 px-3 py-3">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Asignado a
          </div>
          {assignedTo ? (
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5">
              <span aria-hidden className="text-base">
                {assignedTo.kind === 'team' ? '👥' : '👤'}
              </span>
              <span className="truncate text-xs text-gray-800">{assignedTo.name}</span>
            </div>
          ) : (
            <button
              className="w-full rounded-lg border border-dashed border-gray-300 px-2 py-1.5 text-[11px] text-gray-500 hover:bg-gray-50"
              disabled
              title="Picker disponible en próximo sprint"
              type="button"
            >
              Sin asignar — picker próximo sprint
            </button>
          )}
        </div>

        {/* 4. Notas (reusa ConversationNotesSidebar — con migración + Pinned UI) */}
        <div className="p-2">
          <ConversationNotesSidebar
            conversationId={conversationId}
            contactName={contactName}
            linkedContactId={linkedContactId}
            linkedEventId={linkedEventId}
            compact
          />
        </div>
      </div>
    </div>
  );
}
