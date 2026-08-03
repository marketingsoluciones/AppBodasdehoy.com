import { EventoDetalle } from '@/services/mcpApi/eventos';

import { Bar, Card, EmptyHint, StatusPill } from './shared';

/**
 * Itinerario: itinerarios_array con tipo 'itinerario' (verificado 3-ago).
 * Cada itinerario: title + completion_percentage + tasks[{descripcion,fecha,responsable,estatus}].
 */
export const ItinerarioSection = ({ evento }: { evento: EventoDetalle }) => {
  const all: any[] = Array.isArray(evento.itinerarios_array) ? evento.itinerarios_array : [];
  const items = all.filter((i) => (i?.tipo || 'itinerario') === 'itinerario');

  if (items.length === 0) return <EmptyHint>Este evento no tiene itinerario todavía.</EmptyHint>;

  return (
    <div>
      {items.map((it, i) => {
        const tasks: any[] = Array.isArray(it.tasks) ? it.tasks : [];
        const pct = typeof it.completion_percentage === 'number' ? it.completion_percentage : 0;
        return (
          <Card key={it._id || i}>
            <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: 8 }}>
              <strong style={{ fontSize: 14 }}>{it.title || 'Itinerario'}</strong>
              <span style={{ color: 'var(--ep-muted,#9ca3af)', fontSize: 11 }}>{Math.round(pct)}%</span>
            </div>
            <Bar pct={pct} />
            <div style={{ marginTop: 10 }}>
              {tasks.length === 0 && (
                <div style={{ color: 'var(--ep-muted,#9ca3af)', fontSize: 12 }}>Sin tareas.</div>
              )}
              {tasks.slice(0, 40).map((t, j) => (
                <div
                  key={t._id || j}
                  style={{ borderTop: j ? '1px solid var(--ep-border,#f0f0f2)' : 'none', display: 'flex', gap: 8, padding: '7px 0' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.descripcion || 'Tarea'}
                    </div>
                    <div style={{ color: 'var(--ep-muted,#9ca3af)', display: 'flex', fontSize: 11, gap: 8, marginTop: 2 }}>
                      {t.fecha && <span>📅 {String(t.fecha).slice(0, 16)}</span>}
                      {t.responsable && <span>👤 {t.responsable}</span>}
                    </div>
                  </div>
                  <StatusPill value={t.estatus || t.estado} />
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
