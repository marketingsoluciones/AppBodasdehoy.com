'use client';

import { useMemo } from 'react';

import type { Tarea } from '../hooks/useEventData';
import { useEventData } from '../hooks/useEventData';

/**
 * "Próximo" — lo que viene después, dentro de la conversación del cliente.
 *
 * POR QUÉ EXISTE
 * La bandeja sabía responder pero no recordar. Todo el histórico estaba a mano y nada de lo
 * que está por ocurrir: quien atiende tenía que salir a otro canal (ev-{id}-itinerary) para
 * ver qué le había prometido a esta pareja, y al volver había perdido el hilo.
 *
 * NO ES UNA FUENTE NUEVA DE VERDAD. Lee el mismo `itinerarios_array` que InternalChannelView
 * a través de useEventData; solo lo ordena por fecha y se queda con lo próximo. Las fechas
 * siguen viviendo en el itinerario de appEventos, que es su sitio: duplicarlas crearía dos
 * verdades, que es justo el problema que ya arrastramos en otras pantallas.
 *
 * Se apoya en `linkedEventId`, que la conversación ya trae.
 */

interface Props {
  /** Evento vinculado a la conversación (linkedEventId). Sin él, el panel no se pinta. */
  eventId: string | null;
  /** Cuántas cosas mostrar. Tres es lo que cabe sin robarle sitio a la conversación. */
  limite?: number;
}

interface Proxima {
  cuando: Date | null;
  itinerario: string;
  tarea: Tarea;
}

const esCompletada = (t: Tarea) => t.completada || t.estatus === true || t.estatus === 'true';

/** Formato corto y humano: "hoy", "mañana", "en 3 días", "hace 2 días". */
function cuandoTexto(fecha: Date | null): { texto: string; vencida: boolean } {
  if (!fecha) return { texto: 'sin fecha', vencida: false };
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const dias = Math.round((d.getTime() - hoy.getTime()) / 86_400_000);
  if (dias === 0) return { texto: 'hoy', vencida: false };
  if (dias === 1) return { texto: 'mañana', vencida: false };
  if (dias > 1) return { texto: `en ${dias} días`, vencida: false };
  if (dias === -1) return { texto: 'ayer', vencida: true };
  return { texto: `hace ${Math.abs(dias)} días`, vencida: true };
}

export function ProximoPanel({ eventId, limite = 3 }: Props) {
  const { data, error, loading } = useEventData(eventId);

  const proximas = useMemo<Proxima[]>(() => {
    const itinerarios = data?.itinerarios_array ?? [];
    const todas: Proxima[] = [];
    for (const it of itinerarios) {
      for (const t of it.tasks ?? []) {
        if (esCompletada(t)) continue;
        const cuando = t.fecha ? new Date(t.fecha) : null;
        todas.push({
          cuando: cuando && !Number.isNaN(cuando.getTime()) ? cuando : null,
          itinerario: it.title ?? 'Sin título',
          tarea: t,
        });
      }
    }
    // Lo vencido primero (es lo que urge), luego lo más cercano. Sin fecha, al final:
    // no se puede decir que "viene después" algo que no tiene cuándo.
    return todas
      .sort((a, b) => {
        if (!a.cuando && !b.cuando) return 0;
        if (!a.cuando) return 1;
        if (!b.cuando) return -1;
        return a.cuando.getTime() - b.cuando.getTime();
      })
      .slice(0, limite);
  }, [data, limite]);

  // Sin evento vinculado no hay nada que decir, y un panel vacío solo ocupa sitio.
  if (!eventId) return null;

  if (loading) {
    return (
      <div className="border-b border-gray-100 px-4 py-3">
        <Titulo />
        <p className="text-xs text-gray-400">Cargando…</p>
      </div>
    );
  }

  // El error se dice, no se esconde tras un panel vacío: si no cargó, quien atiende tiene
  // que saber que NO está viendo lo pendiente, en vez de creer que no hay nada.
  if (error) {
    return (
      <div className="border-b border-gray-100 px-4 py-3">
        <Titulo />
        <p className="text-xs text-red-600">No se pudo cargar lo próximo de este evento.</p>
      </div>
    );
  }

  if (proximas.length === 0) {
    return (
      <div className="border-b border-gray-100 px-4 py-3">
        <Titulo />
        <p className="text-xs text-gray-400">Sin tareas pendientes en el itinerario.</p>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 px-4 py-3">
      <Titulo />
      <ul className="space-y-2">
        {proximas.map(({ cuando, itinerario, tarea }) => {
          const { texto, vencida } = cuandoTexto(cuando);
          return (
            <li className="flex items-start gap-2" key={tarea._id}>
              <span
                aria-hidden="true"
                className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${
                  vencida ? 'bg-red-500' : 'bg-blue-500'
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-800">
                  {tarea.descripcion || 'Sin descripción'}
                </p>
                <p className="text-xs text-gray-400">
                  <span className={vencida ? 'font-medium text-red-600' : ''}>{texto}</span>
                  {' · '}
                  {itinerario}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Titulo() {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Próximo</h3>
  );
}
