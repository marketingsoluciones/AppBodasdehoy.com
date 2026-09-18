'use client';

import { useEffect, useState } from 'react';

import { getUserContext } from '../utils/auth';
import { fetchOwnerSummary } from '../data/outbound';

/**
 * GlobalSummaryCard — "modo Global": cuando NO hay evento seleccionado (scope = Soporte),
 * el dueño ve un resumen de TODAS sus bodas a la vez.
 *
 * G5 (23-ago): api-ia expone GET /api/owner/summary (motor de digests del dueño) →
 * { eventos, conversacionesAbiertas, esperanRespuesta, confirmados }. Lo consumimos vía el
 * proxy /api/backend/[...path] (→ api-ia/api/owner/summary). Autoritativo y en 1 llamada
 * (incluye `confirmados`, que el front no podía calcular). `convUnread` (de la bandeja, ya en
 * memoria) se muestra de inmediato mientras el summary carga.
 */
interface OwnerSummary {
  confirmados?: number;
  conversacionesAbiertas?: number;
  esperanRespuesta?: number;
  eventos?: number;
}

const num = (v: number | undefined) => (typeof v === 'number' ? v : null);

export function GlobalSummaryCard({ convUnread }: { convUnread: number }) {
  const [summary, setSummary] = useState<OwnerSummary | null>(null);

  useEffect(() => {
    const { development, userId } = getUserContext();
    if (!development || !userId) return;
    let cancelled = false;
    // backend caído → null, y la tarjeta se queda en '…' en vez de inventar números.
    void fetchOwnerSummary(development, userId).then((d) => {
      if (!cancelled && d) setSummary(d as OwnerSummary);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Solo se enseña lo que tiene número. Antes salían los cuatro siempre y tres de ellos
  // marcaban "…" porque api-ia no responde ese resumen en esta marca: una tarjeta de 60px
  // que en la práctica decía "no sé, no sé, no sé". (Owner 17-09: «ocupa mucho espacio,
  // aporta poco valor».) Ahora es una línea y desaparece si no hay nada que contar.
  const stats: Array<{ icon: string; label: string; value: number | null }> = [
    { icon: '💍', label: 'bodas', value: num(summary?.eventos) },
    { icon: '💬', label: 'sin leer', value: convUnread },
    { icon: '⏳', label: 'esperan', value: num(summary?.esperanRespuesta) },
    { icon: '✅', label: 'confirmados', value: num(summary?.confirmados) },
  ].filter((s) => s.value !== null && s.value !== 0) as Array<{
    icon: string;
    label: string;
    value: number;
  }>;

  if (stats.length === 0) return null;

  return (
    <div className="no-scrollbar flex items-center gap-3 overflow-x-auto border-b border-[var(--b-border)] px-3 py-1.5">
      {/* Aquí había un 🌐 suelto con el significado escondido en el tooltip. En la revisión
          de UX del 18-09 se leyó como un indicador de saldo: un icono sin palabra al lado no
          se interpreta, se adivina. Y encima repetía lo que dice el selector de ámbito justo
          encima ("Todas tus bodas"), así que sobra. */}
      {stats.map((s) => (
        <span className="flex flex-none items-baseline gap-1" key={s.label}>
          <span aria-hidden="true" className="text-[11px]">{s.icon}</span>
          <span className="text-[13px] font-bold" style={{ color: 'var(--b-text-1)' }}>
            {s.value}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--b-text-2)' }}>
            {s.label}
          </span>
        </span>
      ))}
    </div>
  );
}
