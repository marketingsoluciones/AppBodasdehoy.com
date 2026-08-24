'use client';

import { useEffect, useState } from 'react';

import { useAuthCheck } from '@/hooks/useAuthCheck';
import { getEventoDetalle, getEventosByUsuario } from '@/services/mcpApi/eventos';

/**
 * useEventSeed — semilla del editor de web de boda a partir de los datos REALES del evento.
 *
 * P1 (QA 23-ago): el selector de evento ya está cableado, pero para un evento SIN wedding-web
 * configurada, getWeddingWeb devuelve vacío → el editor mostraba la plantilla "Nombre 1 &
 * Nombre 2" con itinerario estático. Sembramos pareja + fecha desde la boda elegida.
 *
 * QA 24-ago (build LbvmnNca6BrnMzCIaztV8): la semilla NO aplicaba. Causa raíz: dependía SOLO de
 * getEventoById, que pide campos ricos (presupuesto_objeto/invitados_array/menus_array/…) y si
 * api-mcp rechaza uno la query entera cae en 400 → la semilla se perdía en silencio. FIX: la
 * pareja + fecha se toman de getEventosByUsuario (la MISMA lista que ya puebla el selector, campos
 * mínimos y probados). getEventoById queda como enriquecimiento best-effort SOLO para el itinerario
 * (Programa del día): si falla, la pareja + fecha ya están sembradas igualmente.
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
  const { checkAuth } = useAuthCheck();
  const { development, userId } = checkAuth();

  useEffect(() => {
    setSeed(null);
    if (!eventId || eventId === 'dummy' || !development || !userId) return;
    let cancelled = false;

    (async () => {
      // 1) Pareja + fecha desde la lista PROBADA (la que ya puebla el selector). Campos mínimos,
      //    sin los ricos que hacen fallar getEventoById → esta semilla es la que SIEMPRE aplica.
      let nombre: string | undefined;
      let fecha: string | undefined;
      try {
        const list = await getEventosByUsuario(development, userId, { limit: 100, page: 1 });
        const ev = Array.isArray(list) ? list.find((e) => e._id === eventId) : undefined;
        if (ev) {
          nombre = ev.nombre;
          fecha = ev.fecha ? String(ev.fecha) : undefined;
        }
      } catch {
        /* lista no disponible → seguimos, aún podemos sembrar desde el detalle */
      }

      // 2) Itinerario (Programa del día) desde getEventoById: best-effort. Si la query cae (400 por
      //    campo rico) NO perdemos la pareja/fecha ya obtenidas arriba.
      let schedule: EventSeed['schedule'] = [];
      try {
        const det = await getEventoDetalle(eventId);
        if (det) {
          nombre = det.nombre || nombre;
          fecha = det.fecha ? String(det.fecha) : fecha;
          schedule = parseSchedule(det.itinerarios_array);
        }
      } catch {
        /* detalle no disponible → nos quedamos con pareja/fecha de la lista */
      }

      if (cancelled) return;
      const [p1, p2] = parseCouple(nombre);
      if (!p1 && !p2 && !schedule.length) return; // nada real que sembrar → no inventamos
      setSeed({ coupleNames: [p1, p2], date: fecha, schedule });
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, development, userId]);

  return seed;
}
