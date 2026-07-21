'use client';

import { useEffect, useState } from 'react';

const COOKIE_NAME = 'bodas_available_events';

export interface AvailableEvent {
  id: string;
  name: string;
}

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
  const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const parse = (raw: string | null): AvailableEvent[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((e: unknown) => {
        if (!e || typeof e !== 'object') return null;
        const obj = e as Record<string, unknown>;
        const id = typeof obj.i === 'string' ? obj.i : null;
        const name = typeof obj.n === 'string' ? obj.n : '';
        return id ? { id, name } : null;
      })
      .filter((x): x is AvailableEvent => x !== null);
  } catch {
    return [];
  }
};

/**
 * X2(d) · plan consolidado 2026-07-20.
 * Lee la lista compacta de eventos del usuario publicada por appEventos en la
 * cookie `bodas_available_events` (Domain=.bodasdehoy.com). Reactiva al montar,
 * en cada `visibilitychange`, y en el `storage` event.
 * Ver `apps/appEventos/context/EventContext.tsx` para el escritor.
 */
export const useAvailableEventsFromCookie = (): AvailableEvent[] => {
  const [events, setEvents] = useState<AvailableEvent[]>(() => parse(readCookie(COOKIE_NAME)));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refresh = () => setEvents(parse(readCookie(COOKIE_NAME)));
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    refresh();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', refresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return events;
};
