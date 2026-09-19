'use client';

import { useEffect, useRef } from 'react';

import { useSessionStore } from '@/store/session';

const LS_ID = 'current_event_id';
const LS_NAME = 'current_event_name';
const LS_TYPE = 'current_event_type';
const key = (sessionId: string) => `chatia:session_event:${sessionId}`;

/**
 * X2(b) · plan consolidado 2026-07-20.
 * MVP client-only del sticky de evento por conversación.
 * Cada vez que cambia la sesión activa (`useSessionStore.activeId`):
 *   1. Persiste `current_event_id` bajo la clave de la sesión ANTERIOR
 *      (`chatia:session_event:<sessionId>`).
 *   2. Restaura el `current_event_id` que quedó guardado para la sesión
 *      NUEVA, si existe. Invalida `current_event_name`/`current_event_type`
 *      cacheados (los rehidrata la próxima API call) y dispara
 *      `CustomEvent('chatia:activeEventChanged', { source: 'sticky-session' })`.
 *
 * Cuando api-ia soporte `session.metadata.eventId` esta capa migra a esa
 * fuente. Mientras, la persistencia local sobrevive a recargas y funciona
 * sin coordinación backend.
 */
export const useStickyEventPerSession = () => {
  const activeId = useSessionStore((s) => s.activeId);
  const prevIdRef = useRef<string | undefined>(activeId);

  useEffect(() => {
    if (typeof window === 'undefined' || !activeId) return;
    if (prevIdRef.current === activeId) return;

    if (prevIdRef.current) {
      const currentEvent = localStorage.getItem(LS_ID);
      if (currentEvent) localStorage.setItem(key(prevIdRef.current), currentEvent);
    }

    const stored = localStorage.getItem(key(activeId));
    if (stored) {
      const currentEvent = localStorage.getItem(LS_ID);
      if (stored !== currentEvent) {
        localStorage.setItem(LS_ID, stored);
        localStorage.removeItem(LS_NAME);
        localStorage.removeItem(LS_TYPE);
        window.dispatchEvent(
          new CustomEvent('chatia:activeEventChanged', {
            detail: { eventId: stored, prevEventId: currentEvent, source: 'sticky-session' },
          }),
        );
      }
    }

    prevIdRef.current = activeId;
  }, [activeId]);
};
