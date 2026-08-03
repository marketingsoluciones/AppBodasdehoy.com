import { useCallback, useEffect, useState } from 'react';

import { EventoDetalle, getEventoById } from '@/services/mcpApi/eventos';

/**
 * Carga el evento rico (getEventoById) para el panel contextual.
 * Estado de ERROR VISIBLE obligatorio: si api-mcp cae (BUG#5 `_eventsConnection` →
 * DATABASE_CONNECTION_ERROR), NUNCA mostrar "no tienes presupuesto" en silencio →
 * mostramos error + botón reintentar. Ver [[project_apimcp_db_connection_down_eventos_bug5_bug6]].
 */
export interface EventoDetalleState {
  data: EventoDetalle | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

export function useEventoDetalle(eventId: string | null): EventoDetalleState {
  const [data, setData] = useState<EventoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!eventId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEventoById(eventId)
      .then((ev) => {
        if (cancelled) return;
        setData(ev);
        if (!ev) setError('No se encontró el evento o no tienes acceso.');
      })
      .catch((e) => {
        if (cancelled) return;
        setData(null);
        setError(
          e?.message?.includes('CONNECTION')
            ? 'No se pudo conectar con el servidor de eventos. Reintenta en unos segundos.'
            : e?.message || 'Error cargando el evento.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, nonce]);

  return { data, error, loading, reload };
}
