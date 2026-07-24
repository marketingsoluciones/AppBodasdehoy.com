'use client';

/**
 * ScopeSelector — píldora clicable de la Bandeja (FASE B v2.0 P-handoff 24-jun).
 *
 * Permite al usuario alternar entre:
 *   · "Soporte" (bandeja del equipo, todos los agentes)
 *   · Un evento/boda activo del usuario (linkedEvents)
 *
 * Colores por scope (Diseño):
 *   Soporte: border #C4B5FD, bg #F4F1FE, color #5B21B6
 *   Evento:  border #FBD0D7, bg #FFF6F7, color #9F1239
 *
 * Cambio de scope dispara onChange — el caller debe:
 *   · Recargar lista de conversaciones
 *   · Resetear filtros
 *   · Actualizar sidebar
 *   · Cargar primera conversación del scope
 */
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { useBandejaBrand } from '../utils/brand';
import { getEventosByUsuario, type Evento } from '@/services/mcpApi/eventos';

export type ScopeId = 'support' | string; // 'support' o un eventId
export interface ScopeOption {
  id: ScopeId;
  kind: 'support' | 'event';
  label: string;
  pendingCount?: number; // badge ámbar
}

interface ScopeSelectorProps {
  activeScope: ScopeId;
  onChange: (scope: ScopeId) => void;
  /** Devuelve los eventos del usuario (opcional override; por defecto se cargan en el hook interno) */
  events?: Evento[];
}

const SUPPORT_OPTION: ScopeOption = { id: 'support', kind: 'support', label: 'Soporte' };

function isEventScope(kind: 'support' | 'event'): boolean {
  return kind === 'event';
}

export function ScopeSelector({ activeScope, onChange, events }: ScopeSelectorProps) {
  const brand = useBandejaBrand();
  const [open, setOpen] = useState(false);
  const [internalEvents, setInternalEvents] = useState<Evento[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { checkAuth, isGuest } = useAuthCheck();
  const { development, userId } = checkAuth();

  // Cargar eventos del usuario una sola vez (si el caller no los pasa)
  useEffect(() => {
    if (events !== undefined) return;
    if (isGuest || !userId || !development) return;
    let cancelled = false;
    setLoadingEvents(true);
    void getEventosByUsuario(development, userId, { limit: 50, page: 1 })
      .then((list) => {
        if (!cancelled) setInternalEvents(list);
      })
      .catch(() => {
        if (!cancelled) setInternalEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingEvents(false);
      });
    return () => {
      cancelled = true;
    };
  }, [events, isGuest, userId, development]);

  const effectiveEvents = events ?? internalEvents;

  const allOptions: ScopeOption[] = useMemo(() => {
    const eventOptions: ScopeOption[] = effectiveEvents.map((e) => ({
      id: e._id,
      kind: 'event',
      label: e.nombre || 'Evento sin nombre',
    }));
    return [SUPPORT_OPTION, ...eventOptions];
  }, [effectiveEvents]);

  const active: ScopeOption =
    allOptions.find((o) => o.id === activeScope) ?? SUPPORT_OPTION;

  // Cerrar dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const isEvent = isEventScope(active.kind);
  const pillStyle = isEvent
    ? { borderColor: '#FBD0D7', backgroundColor: '#FFF6F7', color: '#9F1239' }
    : { borderColor: brand.brandBorder, backgroundColor: brand.brandBg, color: brand.brandText };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between gap-2 rounded-[10px] border px-2.5 py-[7px] text-xs font-semibold transition-colors hover:brightness-95"
        onClick={() => setOpen((v) => !v)}
        style={pillStyle}
        type="button"
      >
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: isEvent ? '#E11D48' : brand.brand }}
          />
          <span className="truncate">{active.label}</span>
        </span>
        <span aria-hidden className="opacity-60">
          ▾
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[60vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {/* Sección Soporte */}
          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Atención al cliente
          </div>
          <ScopeRow
            option={SUPPORT_OPTION}
            isActive={active.id === 'support'}
            onClick={() => {
              onChange('support');
              setOpen(false);
            }}
          />

          {/* Sección Eventos */}
          <div className="my-1 border-t border-gray-100" />
          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Eventos activos
          </div>
          {loadingEvents && (
            <div className="px-3 py-2 text-[11px] text-gray-400">Cargando eventos…</div>
          )}
          {!loadingEvents && effectiveEvents.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-gray-400">
              No tienes eventos activos.
            </div>
          )}
          {!loadingEvents &&
            allOptions
              .filter((o) => o.kind === 'event')
              .map((o) => (
                <ScopeRow
                  key={o.id}
                  option={o}
                  isActive={active.id === o.id}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                />
              ))}
        </div>
      )}
    </div>
  );
}

function ScopeRow({
  option,
  isActive,
  onClick,
}: {
  option: ScopeOption;
  isActive: boolean;
  onClick: () => void;
}) {
  const isEvent = option.kind === 'event';
  return (
    <button
      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px] transition-colors hover:bg-gray-50 ${
        isActive ? 'bg-gray-50 font-semibold' : ''
      }`}
      onClick={onClick}
      role="option"
      aria-selected={isActive}
      type="button"
    >
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: isEvent ? '#E11D48' : '#7C3AED' }}
        />
        <span className="truncate text-gray-800">{option.label}</span>
      </span>
      {option.pendingCount != null && option.pendingCount > 0 && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
          style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}
        >
          {option.pendingCount}
        </span>
      )}
    </button>
  );
}
