'use client';

import { useEffect, useState } from 'react';

import { getEventoDetalle } from '@/services/mcpApi/eventos';

/**
 * useEventSeed — semilla del editor de web de boda a partir de los datos REALES del evento.
 *
 * P1 (QA 23-ago): el selector de evento ya está cableado, pero para un evento SIN wedding-web
 * configurada, getWeddingWeb devuelve vacío → el editor mostraba la plantilla "Nombre 1 &
 * Nombre 2" con itinerario estático. Aquí traemos getEventoById(eventId) y derivamos una
 * semilla (pareja del nombre, fecha, agenda del itinerario) para que el editor refleje la boda
 * elegida aunque aún no tenga web. Es SOLO lectura (fallback): al editar/guardar se crea la web.
 */
export interface EventSeed {
  coupleNames: [string, string];
  date?: string;
  schedule: Array<{ location?: string; time?: string; title: string }>;
}

// "Boda de Pedro y Pedra" / "Pedro & Pedra" / "Pedro y Pedra" → ["Pedro","Pedra"].
function parseCouple(nombre?: string): [string, string] {
  const raw = (nombre || '').trim();
  if (!raw) return ['', ''];
  const cleaned = raw.replace(/^(boda|evento|comuni[oó]n?|fiesta)\s+(de\s+)?/i, '').trim();
  const parts = cleaned.split(/\s+[&+y]\s+/i);
  if (parts.length >= 2) return [parts[0].trim(), parts.slice(1).join(' y ').trim()];
  return [cleaned, ''];
}

// itinerarios_array es JSON opaco de api-mcp. Parseo DEFENSIVO: buscamos tareas con hora/título.
function parseSchedule(itinerarios: unknown): EventSeed['schedule'] {
  const out: EventSeed['schedule'] = [];
  const arr = Array.isArray(itinerarios) ? itinerarios : [];
  for (const it of arr) {
    const tasks = (it as any)?.tasks || (it as any)?.itinerario || (Array.isArray(it) ? it : [it]);
    for (const t of Array.isArray(tasks) ? tasks : []) {
      const title = (t as any)?.descripcion || (t as any)?.titulo || (t as any)?.title || (t as any)?.tip;
      if (!title) continue;
      const time = (t as any)?.hora || (t as any)?.time || (t as any)?.horaActual;
      const location = (t as any)?.lugar || (t as any)?.location || (t as any)?.responsable;
      out.push({ location: location ? String(location) : undefined, time: time ? String(time) : undefined, title: String(title) });
      if (out.length >= 20) return out;
    }
  }
  return out;
}

export function useEventSeed(eventId: string | null): EventSeed | null {
  const [seed, setSeed] = useState<EventSeed | null>(null);

  useEffect(() => {
    setSeed(null);
    if (!eventId || eventId === 'dummy') return;
    let cancelled = false;
    getEventoDetalle(eventId)
      .then((ev) => {
        if (cancelled || !ev) return;
        setSeed({
          coupleNames: parseCouple(ev.nombre),
          date: ev.fecha ? String(ev.fecha) : undefined,
          schedule: parseSchedule(ev.itinerarios_array),
        });
      })
      .catch(() => {
        /* backend caído → sin semilla, el editor cae a su default (sin inventar) */
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return seed;
}
