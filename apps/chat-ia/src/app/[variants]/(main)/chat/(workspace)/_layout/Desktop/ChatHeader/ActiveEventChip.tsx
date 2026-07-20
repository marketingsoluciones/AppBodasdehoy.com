'use client';

import { Tag } from 'antd';
import { CalendarDaysIcon } from 'lucide-react';
import { memo, useEffect, useState } from 'react';

/**
 * X2(e) · plan consolidado 2026-07-20.
 * Chip visible en el header del chat que muestra el evento activo actual.
 * Lee `current_event_id` + `current_event_name` de localStorage y se
 * refresca al recibir el CustomEvent `chatia:activeEventChanged`
 * (emitido por `useCrossAppActiveEventSync` cuando la cookie cambia).
 *
 * El click abre appEventos en la vista de eventos (por ahora — futuro:
 * abrir picker inline; requiere X2(d)).
 */
const ActiveEventChip = memo(() => {
  const [eventName, setEventName] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

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

  if (!eventId) return null;

  const label = eventName || `Evento ${eventId.slice(-6)}`;

  return (
    <Tag
      color="blue"
      icon={<CalendarDaysIcon size={12} style={{ verticalAlign: 'middle' }} />}
      style={{ cursor: 'default', marginInlineStart: 8 }}
      title={eventName ? `Evento activo: ${eventName}` : `Evento activo (id: ${eventId})`}
    >
      {label}
    </Tag>
  );
});

ActiveEventChip.displayName = 'ActiveEventChip';

export default ActiveEventChip;
