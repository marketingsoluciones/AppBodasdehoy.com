'use client';

import { Tag } from 'antd';
import { CalendarDaysIcon, ChevronDownIcon } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { useAvailableEventsFromCookie } from '@/hooks/useAvailableEventsFromCookie';

/**
 * X2(e) + X2(d) · plan consolidado 2026-07-20.
 * Chip clickeable en el header del chat que muestra el evento activo y
 * abre un dropdown con la lista de eventos disponibles (`availableEvents`
 * publicada por appEventos en `bodas_available_events` cookie).
 *
 * Elegir un evento del dropdown escribe la cookie `bodas_active_event`
 * (mismo formato que appEventos.EventContext.setEvent) + dispara el
 * CustomEvent que actualiza chat-ia sin recargar.
 * Los consumidores existentes (services/chat, tools, storage-r2) recogen
 * el nuevo valor en la siguiente llamada.
 */
const ActiveEventChip = memo(() => {
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const available = useAvailableEventsFromCookie();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refresh = () => {
      setEventId(localStorage.getItem('current_event_id'));
      setEventName(localStorage.getItem('current_event_name'));
    };

    refresh();
    const onChange = () => refresh();
    window.addEventListener('chatia:activeEventChanged', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('chatia:activeEventChanged', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  // #2 QA (re-análisis 22-ago): con 50+ eventos y muchos genéricos, el dropdown necesita
  // BUSCADOR; y falta la opción "Global" (sin evento = todas las bodas) explícita.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = available.map((e) => ({ id: e.id, name: e.name || `Evento ${e.id.slice(-6)}` }));
    return q ? list.filter((e) => e.name.toLowerCase().includes(q)) : list;
  }, [available, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selectEvent = (id: string, name: string | null) => {
    if (typeof window === 'undefined') return;
    const isProd = !!process.env.NEXT_PUBLIC_PRODUCTION;
    const domainAttr = isProd ? '; Domain=.bodasdehoy.com' : '';
    const maxAge = 60 * 60 * 24 * 30;
    const prevId = localStorage.getItem('current_event_id');
    if (id) {
      // eslint-disable-next-line unicorn/no-document-cookie
      document.cookie = `bodas_active_event=${encodeURIComponent(id)}; Path=/; SameSite=Lax; Max-Age=${maxAge}${domainAttr}`;
      localStorage.setItem('current_event_id', id);
      if (name) localStorage.setItem('current_event_name', name);
      else localStorage.removeItem('current_event_name');
    } else {
      // "Global": limpiar el evento activo (cookie + storage) → modo todas-mis-bodas.
      // eslint-disable-next-line unicorn/no-document-cookie
      document.cookie = `bodas_active_event=; Path=/; SameSite=Lax; Max-Age=0${domainAttr}`;
      localStorage.removeItem('current_event_id');
      localStorage.removeItem('current_event_name');
    }
    localStorage.removeItem('current_event_type');
    window.dispatchEvent(
      new CustomEvent('chatia:activeEventChanged', {
        detail: { eventId: id || null, prevEventId: prevId, source: 'user-picker' },
      }),
    );
    setOpen(false);
    setQuery('');
  };

  if (!eventId && available.length === 0) return null;

  const label = eventName || (eventId ? `Evento ${eventId.slice(-6)}` : 'Global');

  return (
    <div className="relative" ref={ref} style={{ display: 'inline-block' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ background: 'none', border: 0, padding: 0 }} type="button">
        <Tag
          color={eventId ? 'blue' : 'default'}
          icon={<CalendarDaysIcon size={12} style={{ verticalAlign: 'middle' }} />}
          style={{ cursor: 'pointer', marginInlineStart: 8 }}
          title={eventId ? `Evento activo: ${eventName || eventId} — click para cambiar` : 'Sin evento (Global) — click para elegir'}
        >
          {label}
          <ChevronDownIcon size={10} style={{ marginInlineStart: 4, verticalAlign: 'middle' }} />
        </Tag>
      </button>
      {open && (
        <div
          style={{
            background: '#fff', border: '1px solid #EDEDF0', borderRadius: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            left: 8, marginTop: 6, position: 'absolute', top: '100%', width: 260, zIndex: 50,
          }}
        >
          <div style={{ borderBottom: '1px solid #F1F0F5', padding: 8 }}>
            <input
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar boda…"
              value={query}
            />
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto', paddingBlock: 4 }}>
            <button
              className="block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-gray-50"
              onClick={() => selectEvent('', null)}
              style={{ background: !eventId ? '#EFF6FF' : 'transparent', border: 0, color: !eventId ? '#1D4ED8' : '#374151' }}
              type="button"
            >
              🌐 Global (todas mis bodas)
            </button>
            {filtered.length === 0 && (
              <div style={{ color: '#9CA3AF', fontSize: 12, padding: '8px 12px' }}>Sin resultados</div>
            )}
            {filtered.map((e) => (
              <button
                className="block w-full truncate px-3 py-1.5 text-left text-xs hover:bg-gray-50"
                key={e.id}
                onClick={() => selectEvent(e.id, e.name)}
                style={{ background: e.id === eventId ? '#EFF6FF' : 'transparent', border: 0, color: e.id === eventId ? '#1D4ED8' : '#374151' }}
                type="button"
              >
                {e.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

ActiveEventChip.displayName = 'ActiveEventChip';

export default ActiveEventChip;
