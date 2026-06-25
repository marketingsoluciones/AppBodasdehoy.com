'use client';

/**
 * InboxFilters — fila de filtros RSVP + canal sobre la lista de conversaciones.
 * FASE B v2.0 P-handoff Bandeja (24-jun).
 *
 * Diseño:
 *   Activo:   color propio (rsvp + canal)
 *   Inactivo: bg #F1F0F5, color #6B6678
 *
 * Filtros RSVP solo se muestran en modo Evento (P9 Diseño: Soporte sin RSVP).
 */
import { useMemo } from 'react';

export type RsvpFilter = 'all' | 'pending' | 'confirmed' | 'declined';
export type ChannelFilter = 'all' | 'wa' | 'sms' | 'ig' | 'web' | 'tg' | 'fb';

interface InboxFiltersProps {
  /** Si true, oculta los filtros RSVP (modo Soporte sin RSVP). */
  hideRsvp?: boolean;
  rsvp: RsvpFilter;
  channel: ChannelFilter;
  onRsvpChange: (v: RsvpFilter) => void;
  onChannelChange: (v: ChannelFilter) => void;
  /** Contadores para badge en cada filtro (opcional). */
  counts?: {
    rsvp?: Partial<Record<RsvpFilter, number>>;
    channel?: Partial<Record<ChannelFilter, number>>;
  };
}

const RSVP_OPTIONS: Array<{
  value: RsvpFilter;
  label: string;
  icon?: string;
  activeBg: string;
  activeColor: string;
}> = [
  { value: 'all', label: 'Todos', activeBg: '#EDE9FE', activeColor: '#5B21B6' },
  { value: 'pending', label: 'Pend.', icon: '⏳', activeBg: '#FEF3C7', activeColor: '#B45309' },
  { value: 'confirmed', label: 'Conf.', icon: '✓', activeBg: '#DCFCE7', activeColor: '#15803D' },
  { value: 'declined', label: 'Decl.', icon: '✕', activeBg: '#FFE4E6', activeColor: '#9F1239' },
];

const CHANNEL_OPTIONS: Array<{
  value: ChannelFilter;
  label: string;
  activeBg: string;
  activeColor: string;
}> = [
  { value: 'all', label: 'Todo', activeBg: '#EDE9FE', activeColor: '#5B21B6' },
  { value: 'wa', label: 'WA', activeBg: '#DCFCE7', activeColor: '#166534' },
  { value: 'sms', label: 'SMS', activeBg: '#E2E8F0', activeColor: '#1F2937' },
  { value: 'ig', label: 'IG', activeBg: '#FCE7F3', activeColor: '#9D174D' },
  { value: 'web', label: 'Web', activeBg: '#EDE9FE', activeColor: '#5B21B6' },
  { value: 'tg', label: 'TG', activeBg: '#DBEAFE', activeColor: '#1E40AF' },
];

const INACTIVE_STYLE = { backgroundColor: '#F1F0F5', color: '#6B6678' };

export function InboxFilters({
  hideRsvp = false,
  rsvp,
  channel,
  onRsvpChange,
  onChannelChange,
  counts,
}: InboxFiltersProps) {
  const rsvpRow = useMemo(
    () =>
      RSVP_OPTIONS.map((opt) => {
        const isActive = rsvp === opt.value;
        const count = counts?.rsvp?.[opt.value];
        return (
          <button
            aria-pressed={isActive}
            className="inline-flex items-center gap-1 rounded-[9px] px-2 py-1 text-[11px] font-semibold transition-colors"
            key={opt.value}
            onClick={() => onRsvpChange(opt.value)}
            style={isActive ? { backgroundColor: opt.activeBg, color: opt.activeColor } : INACTIVE_STYLE}
            type="button"
          >
            {opt.icon && <span aria-hidden>{opt.icon}</span>}
            <span>{opt.label}</span>
            {count != null && count > 0 && (
              <span className="ml-0.5 rounded-full bg-white/70 px-1 text-[9px] font-bold">
                {count}
              </span>
            )}
          </button>
        );
      }),
    [rsvp, onRsvpChange, counts],
  );

  const channelRow = useMemo(
    () =>
      CHANNEL_OPTIONS.map((opt) => {
        const isActive = channel === opt.value;
        const count = counts?.channel?.[opt.value];
        return (
          <button
            aria-pressed={isActive}
            className="inline-flex items-center gap-1 rounded-[9px] px-2 py-1 text-[11px] font-semibold transition-colors"
            key={opt.value}
            onClick={() => onChannelChange(opt.value)}
            style={isActive ? { backgroundColor: opt.activeBg, color: opt.activeColor } : INACTIVE_STYLE}
            type="button"
          >
            <span>{opt.label}</span>
            {count != null && count > 0 && (
              <span className="ml-0.5 rounded-full bg-white/70 px-1 text-[9px] font-bold">
                {count}
              </span>
            )}
          </button>
        );
      }),
    [channel, onChannelChange, counts],
  );

  return (
    <div className="flex flex-col gap-1.5 border-b border-gray-100 px-3 py-2">
      {!hideRsvp && <div className="flex flex-wrap gap-1">{rsvpRow}</div>}
      <div className="flex flex-wrap gap-1">{channelRow}</div>
    </div>
  );
}
