'use client';

/**
 * InboxFilters — fila de filtros RSVP + canal sobre la lista de conversaciones.
 * FASE B v2.0 P-handoff Bandeja (24-jun).
 *
 * Diseño:
 *   Activo:   color propio (rsvp + canal)
 *   Inactivo: bg var(--b-surface-2), color var(--b-text-2)
 *
 * Filtros RSVP solo se muestran en modo Evento (P9 Diseño: Soporte sin RSVP).
 */
import { useMemo, useState } from 'react';

import { useBandejaBrand } from '../utils/brand';

export type RsvpFilter = 'all' | 'pending' | 'confirmed' | 'declined';
export type ChannelFilter = 'all' | 'wa' | 'sms' | 'ig' | 'web' | 'tg' | 'fb';

interface InboxFiltersProps {
  channel: ChannelFilter;
  /** Contadores para badge en cada filtro (opcional). */
  counts?: {
    channel?: Partial<Record<ChannelFilter, number>>;
    rsvp?: Partial<Record<RsvpFilter, number>>;
  };
  /** Si true, oculta los filtros RSVP (modo Soporte sin RSVP). */
  hideRsvp?: boolean;
  /** FASE B v2.0 — Cola "Pendientes IA" (Diseño 25-jun). Solo visible cuando
   *  iaLevel='copilot'. Muestra chip "✦ Pendientes N" a la derecha de los
   *  filtros de canal. Al activarse, filtra lista a draftState='pending'. */
  iaCopilotActive?: boolean;
  onChannelChange: (v: ChannelFilter) => void;
  onPendingIaToggle?: () => void;
  onRsvpChange: (v: RsvpFilter) => void;
  /** Ver newsletters/estados de WhatsApp (filtrados por defecto). Vivía en su propia fila
   *  con borde propio; ahora va al final de esta, que se desplaza en horizontal. */
  onToggleSpam?: () => void;
  pendingIaActive?: boolean;
  pendingIaCount?: number;
  rsvp: RsvpFilter;
  showSpam?: boolean;
}

const RSVP_OPTIONS: Array<{
  activeBg: string;
  activeColor: string;
  icon?: string;
  label: string;
  value: RsvpFilter;
}> = [
  { activeBg: '#EDE9FE', activeColor: '#5B21B6', label: 'Todos', value: 'all' },
  { activeBg: '#FEF3C7', activeColor: '#B45309', icon: '⏳', label: 'Pend.', value: 'pending' },
  { activeBg: '#DCFCE7', activeColor: '#15803D', icon: '✓', label: 'Conf.', value: 'confirmed' },
  { activeBg: '#FFE4E6', activeColor: '#9F1239', icon: '✕', label: 'Decl.', value: 'declined' },
];

// Prototipo aprobado (16-09): nombre completo y punto de color, no abreviaturas. "WA", "IG"
// y "TG" obligaban a descifrar el filtro; el punto da el canal de un vistazo y el nombre
// quita la duda. `dot` es el color propio del canal, que NO es marca: es igual en todas.
const CHANNEL_OPTIONS: Array<{
  activeBg: string;
  activeColor: string;
  dot?: string;
  label: string;
  value: ChannelFilter;
}> = [
  { activeBg: '#EDE9FE', activeColor: '#5B21B6', label: 'Todo', value: 'all' },
  { activeBg: '#DCFCE7', activeColor: '#166534', dot: '#22C55E', label: 'WhatsApp', value: 'wa' },
  // BUG-INBOX-08 QA #34 (29-jun): SMS visible en filtros pero sin canal SMS
  // configurable (no hay /messages/sms con setup propio ni backend provider
  // tipo Twilio/Vonage). Ocultar hasta que se implemente. El type
  // ChannelFilter mantiene 'sms' para no romper consumidores existentes.
  // { value: 'sms', label: 'SMS', activeBg: '#E2E8F0', activeColor: '#1F2937' },
  { activeBg: '#FCE7F3', activeColor: '#9D174D', dot: '#E1306C', label: 'Instagram', value: 'ig' },
  { activeBg: '#EDE9FE', activeColor: '#5B21B6', dot: '#6B4EFF', label: 'Chat web', value: 'web' },
  { activeBg: '#DBEAFE', activeColor: '#1E40AF', dot: '#38BDF8', label: 'Telegram', value: 'tg' },
];

const INACTIVE_STYLE = { backgroundColor: 'var(--b-surface-2)', color: 'var(--b-text-2)' };

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
  onToggleSpam,
  showSpam = false,
}: InboxFiltersProps) {
  const brand = useBandejaBrand();
  // Plegado en móvil; en escritorio la clase md:flex manda y esto da igual.
  const [abierto, setAbierto] = useState(false);
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
            className="inline-flex flex-none items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
            key={opt.value}
            onClick={() => onRsvpChange(opt.value)}
            style={isActive ? activeStyle(opt) : INACTIVE_STYLE}
            type="button"
          >
            {opt.icon && <span aria-hidden>{opt.icon}</span>}
            <span>{opt.label}</span>
            {typeof count === 'number' && count > 0 && (
              <span className="ml-0.5 rounded-full bg-[var(--b-surface)]/70 px-1 text-[9px] font-bold">
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
            className="inline-flex flex-none items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
            key={opt.value}
            onClick={() => onChannelChange(opt.value)}
            style={isActive ? activeStyle(opt) : INACTIVE_STYLE}
            type="button"
          >
            {opt.dot && (
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 flex-none rounded-full"
                style={{ backgroundColor: opt.dot }}
              />
            )}
            <span>{opt.label}</span>
            {typeof count === 'number' && count > 0 && (
              <span className="ml-0.5 rounded-full bg-[var(--b-surface)]/70 px-1 text-[9px] font-bold">
                {count}
              </span>
            )}
          </button>
        );
      }),
    [channel, onChannelChange, counts],
  );

  return (
    // QA 15-09 (dieta cabecera bandeja): RSVP + canal + cola IA en UNA sola
    // fila wrap. Antes eran 2-3 filas apiladas que comían ~90px de alto.
    // Una sola fila que se desplaza en horizontal (prototipo 16-09). Con `flex-wrap` los
    // filtros se apilaban en dos o tres líneas y se comían ~90px de alto de la lista.
    /* El degradado de la derecha no es adorno: la fila se desplaza en horizontal y el
       scrollbar va oculto, así que los canales que no caben —Telegram, correo, chat web—
       quedaban cortados a media palabra sin nada que indicara que hay más. Un borde que se
       desvanece es la señal de "sigue"; un corte seco se lee como un fallo de pintado. */
    <div className="relative border-b border-[var(--b-border)]">
      {/* P1.3 (brief 18-09): en un teléfono, una fila entera de pastillas de canal es media
          pantalla de "chrome" para algo que se usa de vez en cuando. En móvil se pliega
          detrás de un botón que dice cuál está puesto; en escritorio se queda desplegada,
          que ahí el ancho sobra. */}
      <button
        aria-expanded={abierto}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] font-medium md:hidden"
        onClick={() => setAbierto((v) => !v)}
        style={{ color: 'var(--b-text-2)' }}
        type="button"
      >
        <span>
          Filtros
          {channel !== 'all' && (
            <span className="ml-1 font-semibold" style={{ color: brand.brand }}>
              · {CHANNEL_OPTIONS.find((o) => o.value === channel)?.label ?? channel}
            </span>
          )}
        </span>
        <span aria-hidden>{abierto ? '▴' : '▾'}</span>
      </button>
      <div
        className={`no-scrollbar ${abierto ? 'flex' : 'hidden'} items-center gap-1 overflow-x-auto px-3 py-1.5 md:flex`}
      >
      {!hideRsvp && <span className="flex flex-none items-center gap-1">{rsvpRow}</span>}
      <span className="flex flex-none items-center gap-1">{channelRow}</span>
      <span className="flex flex-none items-center gap-1">
        {iaCopilotActive && (
          <button
            aria-pressed={pendingIaActive}
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors"
            onClick={onPendingIaToggle}
            style={{
              backgroundColor: '#CCFBF1',
              border: pendingIaActive ? '1.5px solid #0D9488' : '1.5px solid transparent',
              color: '#0F766E',
            }}
            title="Borradores IA esperando aprobación"
            type="button"
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
        {/* P1.3: no había ninguna forma visible de conectar otro canal desde la bandeja.
            La gestión vive en Configuración › Integraciones; esto es solo la puerta. */}
        <a
          className="inline-flex flex-none items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-1 text-[11px] font-medium"
          href="/settings/integrations"
          style={{ color: 'var(--b-text-2)' }}
          title="Conectar otro canal: Instagram, Facebook, Telegram, correo o chat web"
        >
          <span aria-hidden>+</span>
          <span>Canal</span>
        </a>
        {onToggleSpam && (
          <button
            aria-pressed={showSpam}
            className="inline-flex flex-none items-center gap-1 rounded-full border border-[var(--b-border)] px-2 py-1 text-[11px] font-medium"
            onClick={onToggleSpam}
            // A4 (QA 6-ago): color inline gana al override global del tema oscuro.
            style={{ backgroundColor: showSpam ? 'var(--b-surface-2)' : 'var(--b-surface)', color: 'var(--b-text-2)' }}
            title="Newsletters y estados de WhatsApp: no se pueden responder, por eso vienen ocultos"
            type="button"
          >
            <span aria-hidden>{showSpam ? '📢' : '👁'}</span>
            <span>{showSpam ? 'Ocultar estados' : 'Estados'}</span>
          </button>
        )}
      </span>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-6"
        style={{ background: 'linear-gradient(to right, rgba(255,255,255,0), var(--b-surface))' }}
      />
    </div>
  );
}
