import { EventoDetalle } from '@/services/mcpApi/eventos';

import { Bar, Card, EmptyHint, money } from './shared';

/**
 * Presupuesto: presupuesto_objeto (verificado 3-ago).
 * Totales (presupuesto_total/coste_estimado/coste_final/pagado) + categorias_array
 * (nombre, coste_final, pagado) con barra pagado/coste.
 */
export const PresupuestoSection = ({ evento }: { evento: EventoDetalle }) => {
  const p: any = evento.presupuesto_objeto;
  if (!p || typeof p !== 'object') return <EmptyHint>Este evento no tiene presupuesto todavía.</EmptyHint>;

  const currency = p.currency || 'EUR';
  const total = p.presupuesto_total ?? p.coste_final ?? 0;
  const estimado = p.coste_estimado ?? 0;
  const final = p.coste_final ?? 0;
  const pagado = p.pagado ?? 0;
  const cats: any[] = Array.isArray(p.categorias_array) ? p.categorias_array : [];
  const pctPagado = final > 0 ? (pagado / final) * 100 : 0;

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--ep-muted,#6b7280)', fontSize: 13 }}>Presupuesto total</span>
          <strong style={{ fontSize: 18 }}>{money(total, currency)}</strong>
        </div>
        <Bar color="#22c55e" pct={pctPagado} />
        <div style={{ color: 'var(--ep-muted,#6b7280)', display: 'flex', fontSize: 12, gap: 12, marginTop: 8 }}>
          <span>Pagado <strong style={{ color: '#22c55e' }}>{money(pagado, currency)}</strong></span>
          <span>Estimado <strong>{money(estimado, currency)}</strong></span>
          <span>Coste final <strong>{money(final, currency)}</strong></span>
        </div>
      </Card>

      <div style={{ color: 'var(--ep-muted,#6b7280)', fontSize: 12, fontWeight: 600, margin: '14px 4px 8px' }}>
        CATEGORÍAS ({cats.length})
      </div>
      {cats.length === 0 && <EmptyHint>Sin categorías de gasto.</EmptyHint>}
      {cats.map((c, i) => {
        const cFinal = c.coste_final ?? 0;
        const cPag = c.pagado ?? 0;
        const gastos = Array.isArray(c.gastos_array) ? c.gastos_array.length : 0;
        return (
          <Card key={c._id || i}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <strong style={{ fontSize: 14, textTransform: 'capitalize' }}>{c.nombre || 'Categoría'}</strong>
              <span style={{ fontSize: 13 }}>{money(cFinal, currency)}</span>
            </div>
            <Bar pct={cFinal > 0 ? (cPag / cFinal) * 100 : 0} />
            <div style={{ color: 'var(--ep-muted,#9ca3af)', display: 'flex', fontSize: 11, gap: 10, marginTop: 6 }}>
              <span>Pagado {money(cPag, currency)}</span>
              <span>{gastos} gasto{gastos === 1 ? '' : 's'}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
