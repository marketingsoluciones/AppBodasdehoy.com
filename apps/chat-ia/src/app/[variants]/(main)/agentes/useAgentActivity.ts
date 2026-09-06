'use client';

import { useEffect, useRef, useState } from 'react';

import { buildHeaders } from '../bandeja/utils/auth';

/**
 * Actividad/handoff en tiempo real para /agentes.
 *
 * api-ia emite `event: activity` y `event: handoff` en /api/messages/stream (verificado
 * 25-jul: /api/messages/stream → 200). El store bandeja consume ese stream pero SOLO bajo
 * el layout de bandeja; /agentes es otra ruta → suscripción propia, aislada al montar.
 * Patrón fetch+ReadableStream (no EventSource) para mandar el JWT en Authorization.
 * Parseo TOLERANTE del payload (varios nombres de campo) porque el shape exacto del evento
 * no está documentado aún.
 */
export interface AgentActivityEvent {
  /** F2 Sala de control: en nombre de quién actuó (regla permisos-heredados). */
  actor?: string;
  agentId?: string;
  /** Canal de la conversación (whatsapp/web/…) si el payload lo trae → deep-link. */
  channel?: string;
  /** Conversación afectada, si el payload la trae → habilita "Intervenir". */
  conversationId?: string;
  id: string;
  text: string;
  timestamp: string;
  type: 'activity' | 'handoff';
}

function toText(d: any, type: string): string {
  return (
    d?.text ??
    d?.description ??
    d?.message ??
    d?.summary ??
    (type === 'handoff' ? 'Handoff a un agente humano' : 'Actividad del agente')
  );
}

export function useAgentActivity(development: string): AgentActivityEvent[] {
  const [events, setEvents] = useState<AgentActivityEvent[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    if (!development || typeof window === 'undefined') return;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/messages/stream?development=${encodeURIComponent(development)}`,
          { headers: { Accept: 'text/event-stream', ...buildHeaders() }, signal: controller.signal },
        );
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';

          for (const block of blocks) {
            let eventType = 'message';
            let data = '';
            for (const line of block.split('\n')) {
              if (line.startsWith('event:')) eventType = line.slice(6).trim();
              else if (line.startsWith('data:')) data += line.slice(5).trim();
            }
            if (eventType !== 'activity' && eventType !== 'handoff') continue;
            let parsed: any = {};
            try {
              parsed = data ? JSON.parse(data) : {};
            } catch {
              /* payload no-JSON → texto por defecto */
            }
            seq.current += 1;
            const evt: AgentActivityEvent = {
              actor: parsed.actor ?? parsed.onBehalfOf ?? parsed.on_behalf_of ?? parsed.userId ?? undefined,
              agentId: parsed.agentId ?? parsed.agent_id ?? parsed.sessionId,
              channel: parsed.channel ?? parsed.canal ?? undefined,
              conversationId:
                parsed.conversationId ?? parsed.conversation_id ?? parsed.convId ?? undefined,
              id: `${eventType}-${parsed.id ?? parsed.timestamp ?? seq.current}`,
              text: toText(parsed, eventType),
              timestamp: parsed.timestamp ?? parsed.createdAt ?? '',
              type: eventType as 'activity' | 'handoff',
            };
            setEvents((prev) => [evt, ...prev].slice(0, 30));
          }
        }
      } catch {
        /* abort al desmontar o corte de red → sin actividad en tiempo real */
      }
    })();

    return () => controller.abort();
  }, [development]);

  return events;
}
