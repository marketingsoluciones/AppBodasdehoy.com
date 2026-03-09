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
  descripcion: string;
  /** api2 uses estatus ('true'/'false' string or boolean) as task completion */
  estatus?: string | boolean;
  completada?: boolean;
  fecha?: string;
  responsable?: string[];
  icon?: string;
  tags?: string[];
}

export interface Itinerario {
  _id: string;
  title?: string;
  tipo?: string;
  tasks?: Tarea[];
  completion_percentage?: number;
}

export interface GastoPresupuesto {
  _id: string;
  nombre: string;
  coste_estimado?: number;
  coste_final?: number;
  pagado?: number;
}

export interface CategoriaPresupuesto {
  _id: string;
  nombre: string;
  coste_estimado?: number;
  coste_final?: number;
  gastos_array?: GastoPresupuesto[];
}

export interface Invitado {
  _id: string;
  nombre: string;
  /** Campo real en api2: 'confirmado' | 'pendiente' | 'no' | 'si' */
  asistencia?: string;
  tableNameRecepcion?: { title?: string };
  nombre_mesa?: string;
  email?: string;
  telefono?: string;
  grupo_relacion?: string;
  nombre_menu?: string;
}

export interface EventoData {
  _id: string;
  nombre?: string;
  fecha?: string;
  itinerarios_array?: Itinerario[];
  presupuesto_objeto?: {
    categorias_array?: CategoriaPresupuesto[];
    coste_estimado?: number;
    coste_final?: number;
    pagado?: number;
  };
  invitados_array?: Invitado[];
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

  return { data, loading, error, refetch: fetchData };
}
