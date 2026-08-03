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
  return (
    <div style={wrap}>
      <div style={h}>💰 Presupuesto — {evento?.nombre ?? 'Evento'}</div>
      <div style={row}><span>Presupuesto total</span><b>{eur(total)}</b></div>
      <div style={row}><span>Gastado</span><b>{eur(gastado)}</b></div>
      <div style={{ ...row, color: restante < 0 ? '#dc2626' : '#16a34a' }}>
        <span>Restante</span><b>{eur(restante)}</b>
      </div>
      {cats.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Categorías</div>
          {cats.map((c, i) => (
            <div key={c?._id ?? i} style={row}>
              <span>{c?.nombre ?? `Categoría ${i + 1}`}</span>
              <b>{eur(c?.coste_final ?? c?.coste_estimado ?? 0)}</b>
            </div>
          ))}
        </div>
      )}
      <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 16 }}>Solo lectura</div>
    </div>
  );
};

const Itinerario = ({ evento }: { evento: any }) => {
  const arr = asObj<any[]>(evento?.itinerarios_array);
  const items: any[] = Array.isArray(arr) ? arr : [];
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

    return section === 'itinerario' ? <Itinerario evento={evento} /> : <Presupuesto evento={evento} />;
  },
);

EventPanelPortal.displayName = 'EventPanelPortal';

export default EventPanelPortal;
