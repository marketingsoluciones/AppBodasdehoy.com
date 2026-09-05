'use client';

import { useEffect, useState } from 'react';

import { buildHeaders, getUserContext } from '../utils/auth';

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
    const qs = new URLSearchParams({ development, owner_email: userId });
    fetch(`/api/backend/api/owner/summary?${qs.toString()}`, { headers: buildHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && d.success !== false) setSummary(d as OwnerSummary);
      })
      .catch(() => {
        /* backend caído → no mostramos números inventados (se queda en '…') */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats: Array<{ icon: string; label: string; value: number | null }> = [
    { icon: '💍', label: 'bodas', value: num(summary?.eventos) },
    { icon: '💬', label: 'sin leer', value: convUnread },
    { icon: '⏳', label: 'esperan', value: num(summary?.esperanRespuesta) },
    { icon: '✅', label: 'confirmados', value: num(summary?.confirmados) },
  ];

  return (
    <div className="border-b border-gray-100 px-3 py-2.5">
      <div
        className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: '#6B4EFF' }}
      >
        <span aria-hidden="true">🌐</span> Todas tus bodas
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {stats.map((s) => (
          <div className="flex items-baseline gap-1" key={s.label}>
            <span className="text-sm">{s.icon}</span>
            <span className="text-base font-bold" style={{ color: '#1C1C22' }}>
              {s.value === null ? '…' : s.value}
            </span>
            <span className="text-[11px]" style={{ color: '#84848F' }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
