/**
 * Servicio de Eventos - Cliente para API2 GraphQL
 * ================================================
 *
 * Usa la query getEventosByUsuario (indicación de API2) para listar
 * los eventos del usuario autenticado. Usado principalmente en el
 * EventSelector de campañas CRM.
 *
 * Referencia: docs/AVANCES-API-IA-RESPUESTAS-SLACK.md
 */

import { api2Client } from './client';

// ========================================
// TYPES
// ========================================

export interface Evento {
  _id: string;
  nombre_evento?: string;
  nombre?: string;
  fecha_boda?: string;
  fecha?: string;
  development?: string;
  usuario_id?: string;
}

export interface GetEventosByUsuarioResponse {
  getEventosByUsuario: Evento[];
}

// ========================================
// QUERIES
// ========================================

const GET_EVENTOS_BY_USUARIO = `
  query GetEventosByUsuario($development: String!) {
    getEventosByUsuario(development: $development) {
      _id
      nombre_evento
      nombre
      fecha_boda
      fecha
      development
      usuario_id
    }
  }
`;

// ========================================
// SERVICE FUNCTIONS
// ========================================

/**
 * Obtiene los eventos del usuario autenticado vía API2.
 * Reemplaza el uso de queryenEvento según indicación de API2.
 */
export const getEventosByUsuario = async (development: string): Promise<Evento[]> => {
  const data = await api2Client.query<GetEventosByUsuarioResponse>(
    GET_EVENTOS_BY_USUARIO,
    { development },
  );
  return data.getEventosByUsuario ?? [];
};

/**
 * Formatea el nombre de un evento para mostrarlo en selectores.
 */
export const formatEventoLabel = (evento: Evento): string => {
  const nombre = evento.nombre_evento || evento.nombre || `Evento ${evento._id.slice(-6)}`;
  const fecha = evento.fecha_boda || evento.fecha;
  return fecha ? `${nombre} (${fecha})` : nombre;
};
