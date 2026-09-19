'use client';

import { useEffect, useState } from 'react';

import { getEventosByUsuario } from '@/services/mcpApi/eventos';

const COOKIE_NAME = 'bodas_available_events';

export interface AvailableEvent {
  id: string;
  name: string;
}

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const escaped = name.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');
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

    // La cookie es la fuente primaria (appEventos la publica). Solo sobreescribimos
    // cuando trae eventos, para NO pisar el fallback fetch de abajo con [] cuando la
    // cookie está vacía (standalone: el usuario NO viene de appEventos).
    const refresh = () => {
      const fromCookie = parse(readCookie(COOKIE_NAME));
      if (fromCookie.length) setEvents(fromCookie);
    };
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

  // Fallback STANDALONE (audit F4 / QA B-01): si la cookie no trae eventos (el usuario
  // entró directo al chat, no desde appEventos), buscar los eventos del usuario vía
  // api-mcp para poblar el selector. Sin esto, el chip no aparece y la IA no tiene
  // eventoId → nunca invoca show_event_section (no_context_at_all).
  useEffect(() => {
    if (typeof window === 'undefined' || events.length > 0) return;
    let cancelled = false;
    try {
      const raw = localStorage.getItem('dev-user-config');
      const cfg = raw ? JSON.parse(raw) : {};
      const usuarioId = cfg.user_id ?? cfg.userId ?? cfg.user_email ?? cfg.email;
      const development =
        cfg.development ?? cfg.developer ?? localStorage.getItem('current_development') ?? 'bodasdehoy';
      if (!usuarioId) return;
      getEventosByUsuario(development, String(usuarioId))
        .then((list) => {
          if (cancelled || !Array.isArray(list) || list.length === 0) return;
          setEvents(list.map((e) => ({ id: e._id, name: e.nombre || '' })));
        })
        .catch(() => {
          /* sin eventos o backend caído: el chip simplemente no se puebla */
        });
    } catch {
      /* dev-user-config ausente/roto */
    }
    return () => {
      cancelled = true;
    };
  }, [events.length]);

  return events;
};
