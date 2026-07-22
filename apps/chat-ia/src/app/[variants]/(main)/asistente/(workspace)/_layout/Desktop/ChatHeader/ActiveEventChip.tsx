'use client';

import { Dropdown, Tag } from 'antd';
import { CalendarDaysIcon, ChevronDownIcon } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';

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

  const items = useMemo(
    () =>
      available.map((e) => ({
        key: e.id,
        label: e.name || `Evento ${e.id.slice(-6)}`,
      })),
    [available],
  );

  const selectEvent = (id: string) => {
    if (typeof window === 'undefined') return;
    const isProd = !!process.env.NEXT_PUBLIC_PRODUCTION;
    const domainAttr = isProd ? '; Domain=.bodasdehoy.com' : '';
    const maxAge = 60 * 60 * 24 * 30;
    document.cookie = `bodas_active_event=${encodeURIComponent(id)}; Path=/; SameSite=Lax; Max-Age=${maxAge}${domainAttr}`;
    const prevId = localStorage.getItem('current_event_id');
    const picked = available.find((e) => e.id === id);
    localStorage.setItem('current_event_id', id);
    if (picked?.name) localStorage.setItem('current_event_name', picked.name);
    else localStorage.removeItem('current_event_name');
    localStorage.removeItem('current_event_type');
    window.dispatchEvent(
      new CustomEvent('chatia:activeEventChanged', {
        detail: { eventId: id, prevEventId: prevId, source: 'user-picker' },
      }),
    );
  };

  if (!eventId && items.length === 0) return null;

  const label = eventName || (eventId ? `Evento ${eventId.slice(-6)}` : 'Elegir evento');

  const chip = (
    <Tag
      color={eventId ? 'blue' : 'default'}
      icon={<CalendarDaysIcon size={12} style={{ verticalAlign: 'middle' }} />}
      style={{
        cursor: items.length > 1 ? 'pointer' : 'default',
        marginInlineStart: 8,
      }}
      title={
        eventId
          ? eventName
            ? `Evento activo: ${eventName}${items.length > 1 ? ' — click para cambiar' : ''}`
            : `Evento activo (id: ${eventId})`
          : 'Elegir evento'
      }
    >
      {label}
      {items.length > 1 && <ChevronDownIcon size={10} style={{ marginInlineStart: 4, verticalAlign: 'middle' }} />}
    </Tag>
  );

  if (items.length <= 1) return chip;

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => selectEvent(key),
        selectedKeys: eventId ? [eventId] : [],
      }}
      trigger={['click']}
    >
      {chip}
    </Dropdown>
  );
});

ActiveEventChip.displayName = 'ActiveEventChip';

export default ActiveEventChip;
