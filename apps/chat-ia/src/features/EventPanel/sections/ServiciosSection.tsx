import { EventoDetalle } from '@/services/mcpApi/eventos';

import { Card, EmptyHint, StatusPill } from './shared';

/**
 * Servicios: itinerarios_array con tipo 'servicios' (verificado 3-ago — el evento real
 * tenía 7 de tipo 'servicios' vs 6 'itinerario'). Cada task = un servicio/proveedor:
 * descripcion (servicio) + responsable (proveedor) + estatus + fecha.
 */
export const ServiciosSection = ({ evento }: { evento: EventoDetalle }) => {
  const all: any[] = Array.isArray(evento.itinerarios_array) ? evento.itinerarios_array : [];
  const grupos = all.filter((i) => i?.tipo === 'servicios');

  const totalServicios = grupos.reduce(
    (acc, g) => acc + (Array.isArray(g.tasks) ? g.tasks.length : 0),
    0,
  );

  if (totalServicios === 0) return <EmptyHint>Este evento no tiene servicios todavía.</EmptyHint>;

  return (
    <div>
      <div style={{ color: 'var(--ep-muted,#6b7280)', fontSize: 12, fontWeight: 600, margin: '2px 4px 8px' }}>
        {totalServicios} SERVICIO{totalServicios === 1 ? '' : 'S'}
      </div>
      {grupos.map((g, gi) => {
        const tasks: any[] = Array.isArray(g.tasks) ? g.tasks : [];
        if (tasks.length === 0) return null;
        return (
          <div key={g._id || gi} style={{ marginBottom: 6 }}>
            {g.title && g.title !== 'sin nombre' && (
              <div style={{ color: 'var(--ep-muted,#9ca3af)', fontSize: 11, fontWeight: 600, margin: '8px 4px 4px' }}>
                {g.title}
              </div>
            )}
            {tasks.slice(0, 60).map((t, j) => (
              <Card key={t._id || j}>
                <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 13 }}>{t.descripcion || 'Servicio'}</strong>
                  <StatusPill value={t.estatus || t.estado} />
                </div>
                <div style={{ color: 'var(--ep-muted,#9ca3af)', display: 'flex', flexWrap: 'wrap', fontSize: 11, gap: 10, marginTop: 4 }}>
                  {t.responsable && <span>👤 {t.responsable}</span>}
                  {t.fecha && <span>📅 {String(t.fecha).slice(0, 16)}</span>}
                  {t.duracion && <span>⏱ {t.duracion}</span>}
                </div>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
};
