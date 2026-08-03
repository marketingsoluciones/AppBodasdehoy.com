'use client';

import { useEffect } from 'react';

import { getCurrentEventId } from './getCurrentEventId';
import { ItinerarioSection } from './sections/ItinerarioSection';
import { PresupuestoSection } from './sections/PresupuestoSection';
import { ServiciosSection } from './sections/ServiciosSection';
import { EmptyHint } from './sections/shared';
import { EVENT_SECTIONS, EventSection, useEventPanelStore } from './store';
import { useEventoDetalle } from './useEventoDetalle';

const LABEL: Record<EventSection, string> = {
  itinerario: 'Itinerario',
  presupuesto: 'Presupuesto',
  servicios: 'Servicios',
};

const THEME_VARS = `
.ep-root{--ep-card:#fff;--ep-border:#ececef;--ep-bar-bg:#e5e7eb;--ep-muted:#6b7280;--ep-bg:#fafafa;--ep-fg:#111827;--ep-head:#fff}
@media (prefers-color-scheme:dark){.ep-root{--ep-card:#1f1f23;--ep-border:#2e2e33;--ep-bar-bg:#333;--ep-muted:#9ca3af;--ep-bg:#161618;--ep-fg:#e5e7eb;--ep-head:#1a1a1d}}
`;

/**
 * Panel contextual del chat (#7). Drawer derecho que muestra presupuesto/itinerario/
 * servicios del evento actual, leyendo getEventoById DIRECTO de api-mcp (sin LLM).
 * La IA lo abre vía filter_view (ver filterAppView.ts); el usuario cambia de sección
 * con las pestañas. Montado una vez en el workspace del asistente.
 */
export const EventPanel = () => {
  const isOpen = useEventPanelStore((s) => s.isOpen);
  const section = useEventPanelStore((s) => s.section);
  const storeEventId = useEventPanelStore((s) => s.eventId);
  const close = useEventPanelStore((s) => s.close);
  const setSection = useEventPanelStore((s) => s.setSection);

  // Si el store no trae eventId (la IA no lo pasó), usar el evento actual del usuario.
  const eventId = storeEventId || getCurrentEventId();
  const { data, loading, error, reload } = useEventoDetalle(isOpen ? eventId : null);

  // cerrar con ESC
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, close]);

  const openPanel = useEventPanelStore((s) => s.open);

  // Disparador manual: mientras la IA no pueda abrirlo (dep. #1), un botón flotante
  // permite abrir el panel del evento actual. También sirve como entrada directa.
  if (!isOpen) {
    return (
      <button
        aria-label="Ver datos del evento"
        onClick={() => openPanel('presupuesto')}
        style={{
          alignItems: 'center',
          background: '#6366f1',
          border: 'none',
          borderRadius: 999,
          bottom: 88,
          boxShadow: '0 4px 14px rgba(99,102,241,.4)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          fontSize: 13,
          fontWeight: 600,
          gap: 6,
          padding: '10px 16px',
          position: 'fixed',
          right: 20,
          zIndex: 999,
        }}
        title="Ver presupuesto / itinerario / servicios del evento"
        type="button"
      >
        📋 Evento
      </button>
    );
  }

  return (
    <>
      <style>{THEME_VARS}</style>
      <div
        className="ep-root"
        style={{
          background: 'var(--ep-bg)',
          borderLeft: '1px solid var(--ep-border)',
          bottom: 0,
          boxShadow: '-8px 0 24px rgba(0,0,0,.08)',
          color: 'var(--ep-fg)',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '92vw',
          position: 'fixed',
          right: 0,
          top: 0,
          width: 400,
          zIndex: 1000,
        }}
      >
        {/* Header */}
        <div
          style={{
            alignItems: 'center',
            background: 'var(--ep-head)',
            borderBottom: '1px solid var(--ep-border)',
            display: 'flex',
            gap: 8,
            justifyContent: 'space-between',
            padding: '12px 14px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {data?.nombre || 'Evento'}
            </div>
            {data?.fecha && (
              <div style={{ color: 'var(--ep-muted)', fontSize: 11 }}>{String(data.fecha).slice(0, 16)}</div>
            )}
          </div>
          <button
            aria-label="Cerrar"
            onClick={close}
            style={{ background: 'none', border: 'none', color: 'var(--ep-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}
            type="button"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid var(--ep-border)', display: 'flex', gap: 4, padding: '8px 10px' }}>
          {EVENT_SECTIONS.map((s) => {
            const active = s === section;
            return (
              <button
                key={s}
                onClick={() => setSection(s)}
                style={{
                  background: active ? 'var(--ep-fg)' : 'transparent',
                  border: '1px solid var(--ep-border)',
                  borderRadius: 999,
                  color: active ? 'var(--ep-bg)' : 'var(--ep-muted)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '5px 12px',
                }}
                type="button"
              >
                {LABEL[s]}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {loading && <EmptyHint>Cargando…</EmptyHint>}
          {!loading && error && (
            <div style={{ padding: '24px 4px', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</div>
              <button
                onClick={reload}
                style={{ background: 'var(--ep-fg)', border: 'none', borderRadius: 8, color: 'var(--ep-bg)', cursor: 'pointer', fontSize: 13, padding: '6px 14px' }}
                type="button"
              >
                Reintentar
              </button>
            </div>
          )}
          {!loading && !error && !eventId && <EmptyHint>Selecciona un evento para ver sus datos.</EmptyHint>}
          {!loading && !error && data && (
            <>
              {section === 'presupuesto' && <PresupuestoSection evento={data} />}
              {section === 'itinerario' && <ItinerarioSection evento={data} />}
              {section === 'servicios' && <ServiciosSection evento={data} />}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default EventPanel;
