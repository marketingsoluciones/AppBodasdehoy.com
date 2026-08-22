'use client';

import { useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { getEventosByUsuario } from '@/services/mcpApi/eventos';

/**
 * GlobalSummaryCard — "modo Global": cuando NO hay evento seleccionado (scope = Soporte),
 * el dueño ve un resumen de TODAS sus bodas a la vez.
 *
 * G2 de la auditoría (22-ago). Verificado que es front-agregable con datos ya disponibles:
 *   · nº de bodas → getEventosByUsuario (lista lean, barata).
 *   · conversaciones sin leer / notificaciones → ya calculadas en la bandeja (useUnifiedFeed).
 * El motor de "digests del dueño" ya existe en api-ia (/api/event-followup/run-digests);
 * cuando exponga un GET de resumen de lectura, esta tarjeta migra a consumirlo (menos coste).
 */
export function GlobalSummaryCard({
  convUnread,
  notifUnread,
}: {
  convUnread: number;
  notifUnread: number;
}) {
  const { checkAuth, isGuest } = useAuthCheck();
  const { development, userId } = checkAuth();
  const [eventCount, setEventCount] = useState<number | null>(null);

  useEffect(() => {
    if (isGuest || !userId || !development) return;
    let cancelled = false;
    getEventosByUsuario(development, userId, { limit: 50, page: 1 })
      .then((list) => {
        if (!cancelled) setEventCount(Array.isArray(list) ? list.length : null);
      })
      .catch(() => {
        /* backend caído → no mostramos número inventado */
      });
    return () => {
      cancelled = true;
    };
  }, [isGuest, userId, development]);

  const stats: Array<{ icon: string; label: string; value: number | null }> = [
    { icon: '💍', label: eventCount === 1 ? 'boda' : 'bodas', value: eventCount },
    { icon: '💬', label: 'sin leer', value: convUnread },
    { icon: '🔔', label: 'notificaciones', value: notifUnread },
  ];

  return (
    <div className="border-b border-gray-100 px-3 py-2.5">
      <div
        className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: '#6B4EFF' }}
      >
        <span aria-hidden="true">🌐</span> Todas tus bodas
      </div>
      <div className="flex items-center gap-4">
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
