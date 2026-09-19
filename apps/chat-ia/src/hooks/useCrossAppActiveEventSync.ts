'use client';

import { useEffect } from 'react';

import { trackContextAmbiguity } from '@/utils/copilotTelemetry';

const COOKIE_NAME = 'bodas_active_event';
const LS_ID = 'current_event_id';
const LS_NAME = 'current_event_name';
const LS_TYPE = 'current_event_type';

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
  const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * CTX-C · X1 (plan consolidado 2026-07-20).
 * appEventos escribe la cookie `bodas_active_event` con Domain=.bodasdehoy.com
 * en cada cambio de evento activo. Este hook la lee al montar y en cada
 * `visibilitychange` (visible) y, si difiere de `current_event_id`, actualiza
 * localStorage e invalida el `name`/`type` cacheados.
 * Los consumidores que leen `current_event_id` (tools, storage-r2, chat service)
 * recogen el nuevo valor en la siguiente llamada.
 */
export const useCrossAppActiveEventSync = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sync = () => {
      const cookieId = readCookie(COOKIE_NAME);
      const localId = localStorage.getItem(LS_ID);
      if (!cookieId) {
        // X3: sin cookie ni localStorage → ambigüedad completa. Logueamos una
        // sola vez por sesión (evitamos ruido con SESSION storage).
        if (!localId && !sessionStorage.getItem('chatia:ambig_logged')) {
          sessionStorage.setItem('chatia:ambig_logged', '1');
          trackContextAmbiguity({
            reason: 'no_context_at_all',
            route: window.location.pathname,
          });
        }
        return;
      }
      if (cookieId === localId) return;

      localStorage.setItem(LS_ID, cookieId);
      localStorage.removeItem(LS_NAME);
      localStorage.removeItem(LS_TYPE);
      // Cambio real: reset flag para permitir volver a loguear si cambia el estado
      sessionStorage.removeItem('chatia:ambig_logged');
      window.dispatchEvent(
        new CustomEvent('chatia:activeEventChanged', {
          detail: { eventId: cookieId, prevEventId: localId },
        }),
      );
    };

    sync();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
};
