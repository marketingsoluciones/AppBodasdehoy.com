'use client';

import { useEffect, useState } from 'react';

import { api2Client } from '@/services/api2/client';

const GET_EVENTO_BY_ID = `
  query GetEventoById($id: ID!) {
    getEventoById(id: $id) {
      id
      nombre
      fecha
      itinerarios_array
      presupuesto_objeto
      invitados_array
    }
  }
`;

export interface Tarea {
  _id: string;
  completada?: boolean;
  descripcion: string;
  /** api2 uses estatus ('true'/'false' string or boolean) as task completion */
  estatus?: string | boolean;
  fecha?: string;
  icon?: string;
  responsable?: string[];
  tags?: string[];
}

export interface Itinerario {
  _id: string;
  completion_percentage?: number;
  tasks?: Tarea[];
  tipo?: string;
  title?: string;
}

export interface GastoPresupuesto {
  _id: string;
  coste_estimado?: number;
  coste_final?: number;
  nombre: string;
  pagado?: number;
}

export interface CategoriaPresupuesto {
  _id: string;
  coste_estimado?: number;
  coste_final?: number;
  gastos_array?: GastoPresupuesto[];
  nombre: string;
}

export interface Invitado {
  _id: string;
  /** Campo real en api2: 'confirmado' | 'pendiente' | 'no' | 'si' */
  asistencia?: string;
  email?: string;
  grupo_relacion?: string;
  nombre: string;
  nombre_menu?: string;
  nombre_mesa?: string;
  tableNameRecepcion?: { title?: string };
  telefono?: string;
}

export interface EventoData {
  _id: string;
  fecha?: string;
  invitados_array?: Invitado[];
  itinerarios_array?: Itinerario[];
  nombre?: string;
  presupuesto_objeto?: {
    categorias_array?: CategoriaPresupuesto[];
    coste_estimado?: number;
    coste_final?: number;
    pagado?: number;
  };
}

interface EventoResponse {
  getEventoById: EventoData;
}

export function useEventData(eventId: string | null) {
  const [data, setData] = useState<EventoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    api2Client
      .query<EventoResponse>(GET_EVENTO_BY_ID, { id: eventId })
      .then((res) => {
        setData(res.getEventoById ?? null);
      })
      .catch((err) => {
        console.warn('[useEventData] error:', err);
        setError(err?.message ?? 'Error cargando evento');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return { data, error, loading, refetch: fetchData };
}
