import { BuiltinPortalProps } from '@lobechat/types';
import { type CSSProperties, memo } from 'react';

import type { EventPanelState } from '@/store/chat/slices/builtinTool/actions/eventPanel';

/** Los *_array / presupuesto_objeto son JSON opacos: pueden venir como objeto ya
 *  parseado o como string. Normalizar defensivamente sin romper. */
function asObj<T = any>(v: unknown): T | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T;
    } catch {
      return undefined;
    }
  }
  return v as T;
}

const eur = (n: unknown): string => {
  const x = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(x)) return '—';
  return x.toLocaleString('es-ES', { currency: 'EUR', style: 'currency' });
};

const wrap: CSSProperties = { fontSize: 13, padding: 16 };
const h: CSSProperties = { fontSize: 15, fontWeight: 600, marginBottom: 12 };
const row: CSSProperties = {
  borderBottom: '1px solid rgba(0,0,0,0.06)',
  display: 'flex',
  justifyContent: 'space-between',
  padding: '6px 0',
};

const Presupuesto = ({ evento }: { evento: any }) => {
  const p = asObj<any>(evento?.presupuesto_objeto) ?? {};
  const total = p.presupuesto_total ?? p.presupuesto_estimado ?? 0;
  const gastado = p.coste_final ?? 0;
  const restante = Number(total) - Number(gastado);
  const cats: any[] = Array.isArray(p.categorias_array) ? p.categorias_array : [];
  const pct = Number(total) > 0 ? Math.min(100, Math.round((Number(gastado) / Number(total)) * 100)) : 0;
  const over = restante < 0;
  return (
    <div style={wrap}>
      <div style={h}>💰 Presupuesto — {evento?.nombre ?? 'Evento'}</div>
      <div style={{ margin: '4px 0 12px' }}>
        <div style={{ background: '#eee', borderRadius: 6, height: 8, overflow: 'hidden' }}>
          <div style={{ background: over ? '#dc2626' : '#16a34a', height: '100%', width: `${pct}%` }} />
        </div>
        <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>{pct}% del presupuesto usado</div>
      </div>
      <div style={row}><span>Presupuesto total</span><b>{eur(total)}</b></div>
      <div style={row}><span>Gastado</span><b>{eur(gastado)}</b></div>
      <div style={{ ...row, color: over ? '#dc2626' : '#16a34a' }}>
        <span>Restante</span><b>{eur(restante)}</b>
      </div>
      {cats.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Categorías ({cats.length})</div>
          {cats.map((c, i) => {
            const cFinal = Number(c?.coste_final ?? 0);
            const cEst = Number(c?.coste_estimado ?? 0);
            const gastos = Array.isArray(c?.gastos_array) ? c.gastos_array : [];
            return (
              <div key={c?._id ?? i} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500 }}>{c?.nombre ?? `Categoría ${i + 1}`}</span>
                  <b>{eur(cFinal || cEst)}</b>
                </div>
                {(gastos.length > 0 || cEst > 0) && (
                  <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>
                    {gastos.length > 0 ? `${gastos.length} gasto${gastos.length === 1 ? '' : 's'}` : 'sin gastos'}
                    {cEst > 0 ? ` · estimado ${eur(cEst)}` : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 16 }}>Solo lectura</div>
    </div>
  );
};

const Itinerario = ({ evento }: { evento: any }) => {
  const arr = asObj<any[]>(evento?.itinerarios_array);
  // Los itinerarios con tipo 'servicios' van en la sección Servicios (abajo).
  const items: any[] = Array.isArray(arr) ? arr.filter((it) => it?.tipo !== 'servicios') : [];
  return (
    <div style={wrap}>
      <div style={h}>📅 Itinerario — {evento?.nombre ?? 'Evento'}</div>
      {items.length === 0 ? (
        <div style={{ color: '#9ca3af' }}>Sin itinerarios registrados.</div>
      ) : (
        items.map((it, i) => {
          const tasks = Array.isArray(it?.tasks)
            ? it.tasks
            : Array.isArray(it?.tips)
              ? it.tips
              : [];
          return (
            <div key={it?._id ?? i} style={row}>
              <span>{it?.title ?? it?.nombre ?? `Itinerario ${i + 1}`}</span>
              <b>{tasks.length} tareas</b>
            </div>
          );
        })
      )}
      <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 16 }}>Solo lectura</div>
    </div>
  );
};

// Servicios: itinerarios_array con tipo 'servicios' (verificado en vivo 3-ago: el
// evento real tenía 7 de tipo 'servicios'). Cada task = un servicio/proveedor.
const Servicios = ({ evento }: { evento: any }) => {
  const arr = asObj<any[]>(evento?.itinerarios_array);
  const grupos: any[] = Array.isArray(arr) ? arr.filter((it) => it?.tipo === 'servicios') : [];
  const tareas = grupos.flatMap((g) => (Array.isArray(g?.tasks) ? g.tasks : []));
  return (
    <div style={wrap}>
      <div style={h}>🛎️ Servicios — {evento?.nombre ?? 'Evento'}</div>
      {tareas.length === 0 ? (
        <div style={{ color: '#9ca3af' }}>Sin servicios registrados.</div>
      ) : (
        tareas.map((t, i) => (
          <div key={t?._id ?? i} style={{ ...row, alignItems: 'baseline' }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              {t?.descripcion ?? t?.title ?? `Servicio ${i + 1}`}
              {t?.responsable && (
                <span style={{ color: '#6b7280', fontSize: 11 }}> · {t.responsable}</span>
              )}
            </span>
            {(t?.estatus || t?.estado) && (
              <b style={{ fontSize: 11, textTransform: 'capitalize' }}>
                {String(t?.estatus ?? t?.estado).replace(/_/g, ' ')}
              </b>
            )}
          </div>
        ))
      )}
      <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 16 }}>Solo lectura</div>
    </div>
  );
};

const EventPanelPortal = memo<BuiltinPortalProps<{ eventoId?: string; section?: string }, EventPanelState>>(
  ({ arguments: args, state }) => {
    const section = state?.section ?? args?.section;
    const { error, evento, loading } = state ?? {};

    if (error === 'fetch_failed') {
      return (
        <div style={wrap}>
          <div style={{ color: '#dc2626', fontWeight: 600 }}>Servidor no disponible</div>
          <div style={{ color: '#6b7280', marginTop: 8 }}>
            No pude cargar el evento ahora mismo. Vuelve a intentarlo en unos segundos.
          </div>
        </div>
      );
    }
    if (error === 'no_event') {
      return (
        <div style={wrap}>
          <div style={{ fontWeight: 600 }}>¿De qué evento?</div>
          <div style={{ color: '#6b7280', marginTop: 8 }}>
            No tienes un evento activo. Elige uno en el selector del encabezado y vuelve a pedírmelo.
          </div>
        </div>
      );
    }
    if (error === 'not_found') {
      return (
        <div style={wrap}>
          <div style={{ color: '#6b7280' }}>No encontré ese evento.</div>
        </div>
      );
    }
    if (loading || !evento) {
      return <div style={wrap}><div style={{ color: '#9ca3af' }}>Cargando…</div></div>;
    }

    if (section === 'itinerario') return <Itinerario evento={evento} />;
    if (section === 'servicios') return <Servicios evento={evento} />;
    return <Presupuesto evento={evento} />;
  },
);

EventPanelPortal.displayName = 'EventPanelPortal';

export default EventPanelPortal;
