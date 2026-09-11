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

import { useBandejaBrand } from '../utils/brand';

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
  /** FASE B v2.0 — Cola "Pendientes IA" (Diseño 25-jun). Solo visible cuando
   *  iaLevel='copilot'. Muestra chip "✦ Pendientes N" a la derecha de los
   *  filtros de canal. Al activarse, filtra lista a draftState='pending'. */
  iaCopilotActive?: boolean;
  pendingIaCount?: number;
  pendingIaActive?: boolean;
  onPendingIaToggle?: () => void;
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
  // BUG-INBOX-08 QA #34 (29-jun): SMS visible en filtros pero sin canal SMS
  // configurable (no hay /messages/sms con setup propio ni backend provider
  // tipo Twilio/Vonage). Ocultar hasta que se implemente. El type
  // ChannelFilter mantiene 'sms' para no romper consumidores existentes.
  // { value: 'sms', label: 'SMS', activeBg: '#E2E8F0', activeColor: '#1F2937' },
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
  iaCopilotActive = false,
  pendingIaCount = 0,
  pendingIaActive = false,
  onPendingIaToggle,
}: InboxFiltersProps) {
  const brand = useBandejaBrand();
  // Los filtros de MARCA del config estático (#EDE9FE/#5B21B6, ej. "Todos"/"Todo"/"Web")
  // se resuelven a la paleta del whitelabel. Los SEMÁNTICOS (RSVP ámbar/verde/rojo,
  // canal WA/IG/TG) conservan su color fijo.
  const activeStyle = (opt: { activeBg: string; activeColor: string }) =>
    opt.activeBg === '#EDE9FE'
      ? { backgroundColor: brand.brandBg, color: brand.brandText }
      : { backgroundColor: opt.activeBg, color: opt.activeColor };
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
            style={isActive ? activeStyle(opt) : INACTIVE_STYLE}
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
            style={isActive ? activeStyle(opt) : INACTIVE_STYLE}
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
      <div className="flex flex-wrap items-center gap-1">
        {channelRow}
        {iaCopilotActive && (
          <button
            aria-pressed={pendingIaActive}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors"
            onClick={onPendingIaToggle}
            style={{
              backgroundColor: '#CCFBF1',
              color: '#0F766E',
              border: pendingIaActive ? '1.5px solid #0D9488' : '1.5px solid transparent',
            }}
            type="button"
            title="Borradores IA esperando aprobación"
          >
            <span aria-hidden>✦</span>
            {/* Etiqueta "Borradores IA" (no "Pendientes"): "Pendientes" en el rail = "Esperan
                respuesta" (no leídos); esto es la cola de borradores IA sin aprobar. Nombres
                distintos para no confundir (feedback owner + QA 19-ago "Pendientes duplicado"). */}
            <span>Borradores IA</span>
            {pendingIaCount > 0 && (
              <span
                className="rounded-md px-1 text-[10px] font-bold"
                style={{ backgroundColor: '#0D9488', color: '#fff' }}
              >
                {pendingIaCount > 99 ? '99+' : pendingIaCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
