'use client';

import { useEffect } from 'react';

/**
 * StandaloneEventContext — inyecta el EVENTO ACTIVO en el systemRole del agente para
 * que la IA tenga el `eventoId` y pueda invocar `show_event_section` (panel) también en
 * STANDALONE (usuario que entra directo al chat, no desde appEventos).
 *
 * Complementa `ContextFromEmbed` (que solo cubre el caso EMBEBIDO vía sessionStorage
 * `copilot_open_context`). Aquí leemos `current_event_id`/`current_event_name` (que fija
 * el selector `ActiveEventChip` o el sync cross-app) y re-inyectamos en cada
 * `chatia:activeEventChanged`. Mismos marcadores de bloque → idempotente (no acumula).
 *
 * Cierra el hueco QA B-01/B-03 · audit F4 (`no_context_at_all`).
 */
const MARK_START = '<!-- Contexto del evento (inyectado automáticamente) -->';
const MARK_END = '<!-- fin contexto -->';
const CLEAN_RE = /<!--\s*Contexto del evento[\S\s]*?<!--\s*fin contexto\s*-->\n*/g;

const StandaloneEventContext = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isMounted = true;

    const inject = async () => {
      try {
        // Si hay contexto del embed pendiente, lo maneja ContextFromEmbed (más rico).
        if (sessionStorage.getItem('copilot_open_context')) return;
        const eventId = localStorage.getItem('current_event_id');
        if (!eventId) return;
        const eventName = localStorage.getItem('current_event_name') || '';

        const lines = [MARK_START];
        if (eventName) lines.push(`Evento: ${eventName}`);
        lines.push(`ID de evento: ${eventId}`, 
          'Cuando el usuario pida ver su presupuesto, itinerario o servicios, invoca show_event_section con este eventoId.', MARK_END
        );
        const contextBlock = lines.join('\n');

        const [{ useAgentStore }, { agentSelectors }] = await Promise.all([
          import('@/store/agent'),
          import('@/store/agent/selectors'),
        ]);
        if (!isMounted) return;

        const agentStore = useAgentStore.getState();
        const current: string =
          agentSelectors.currentAgentSystemRole(useAgentStore.getState()) || '';
        const cleaned = current.replaceAll(CLEAN_RE, '').trimStart();
        const next = cleaned ? `${contextBlock}\n\n${cleaned}` : contextBlock;
        if (next === current) return;
        await agentStore.updateAgentConfig({ systemRole: next });
      } catch {
        /* noop: sin evento activo o store no listo */
      }
    };

    // Diferir para que el agent store inicialice (igual que ContextFromEmbed).
    const timeout = setTimeout(inject, 900);
    const onChange = () => inject();
    window.addEventListener('chatia:activeEventChanged', onChange);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
      window.removeEventListener('chatia:activeEventChanged', onChange);
    };
  }, []);

  return null;
};

export default StandaloneEventContext;
