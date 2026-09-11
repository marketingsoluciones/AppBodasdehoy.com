'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { getEventosByUsuario, type Evento } from '@/services/mcpApi/eventos';

/**
 * WeddingEventPicker — selector de evento para el editor de la web de boda.
 *
 * Gap QA (re-análisis 22-ago): el editor `/wedding-creator` YA carga los datos del evento
 * cuando llega con `?eventId=` (useWeddingWebGraphQL), pero NO tenía selector en la UI → si
 * entrabas directo, caía a la plantilla dummy. Este picker deja ELEGIR la boda (reusa el
 * flujo eventId existente, no reinventa) y trae BUSCADOR (el owner tiene 50+ eventos, muchos
 * con nombre genérico). El itinerario del organizador vive en appEventos; esto solo elige
 * QUÉ boda edita la web pública.
 */
export function WeddingEventPicker({
  eventId,
  onSelect,
}: {
  eventId: string | null;
  onSelect: (id: string) => void;
}) {
  const { checkAuth, isGuest } = useAuthCheck();
  const { development, userId } = checkAuth();
  const [events, setEvents] = useState<Evento[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGuest || !userId || !development) return;
    let cancelled = false;
    getEventosByUsuario(development, userId, { limit: 100, page: 1 })
      .then((list) => {
        if (!cancelled) setEvents(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        /* backend caído → lista vacía, sin inventar */
      });
    return () => {
      cancelled = true;
    };
  }, [isGuest, userId, development]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const current = events.find((e) => e._id === eventId);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? events.filter((e) => (e.nombre || '').toLowerCase().includes(q)) : events;
  }, [events, query]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span aria-hidden>💍</span>
        <span className="max-w-[180px] truncate">{current?.nombre || 'Elige una boda…'}</span>
        <span aria-hidden className="opacity-60">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <input
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-violet-400"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar boda…"
              value={query}
            />
          </div>
          <div className="max-h-72 overflow-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-400">Sin resultados</div>
            )}
            {filtered.map((e) => (
              <button
                className={`block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${
                  e._id === eventId ? 'bg-violet-50 text-violet-700' : 'text-gray-700'
                }`}
                key={e._id}
                onClick={() => {
                  onSelect(e._id);
                  setOpen(false);
                  setQuery('');
                }}
                type="button"
              >
                {e.nombre || 'Boda sin nombre'}
                {e.fecha && (
                  <span className="ml-1 text-[10px] text-gray-400">{String(e.fecha).slice(0, 10)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
