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

import { mcpClient } from './client';

// ========================================
// TYPES
// ========================================

export interface Evento {
  _id: string;
  development?: string;
  fecha?: string;
  nombre?: string;
  tipo?: string;
  usuario_id?: string;
}

// EventosResponse (schema api-mcp actual): { total, eventos[] }.
// CAMBIO 14-jun: getEventosByUsuario AHORA exige usuario_id:String! + pagination:CRM_PaginationInput!
// (obligatorios) y devuelve EventosResponse{ total, eventos[] } — antes era la lista directa con
// campos nombre_evento/fecha_boda que YA NO existen. El front estaba con la firma vieja → GraphQL
// rechazaba la query → 0 eventos → "lista de eventos vacía". Verificado en vivo contra prod.
export interface EventosResponse {
  eventos: Evento[];
  total: number;
}

export interface GetEventosByUsuarioResponse {
  getEventosByUsuario: EventosResponse;
}

// Evento RICO para el panel contextual del chat (#7). Los *_array / *_objeto son
// escalares JSON en api-mcp (sin subselección) → se tipan laxos y se parsean en el render.
// Gate por dueño a nivel campo (backend, verificado): cross-tenant recibe solo el stub
// público {_id,nombre,fecha,tipo} con los ricos en null.
export interface EventoDetalle extends Evento {
  invitados_array?: any[] | null;
  itinerarios_array?: any[] | null;
  menus_array?: any[] | null;
  planSpace?: any[] | null;
  presupuesto_objeto?: Record<string, any> | null;
}

export interface GetEventoByIdResponse {
  getEventoById: EventoDetalle | null;
}

// ========================================
// QUERIES
// ========================================

const GET_EVENTOS_BY_USUARIO = `
  query GetEventosByUsuario($development: String!, $usuario_id: String!, $pagination: CRM_PaginationInput!) {
    getEventosByUsuario(development: $development, usuario_id: $usuario_id, pagination: $pagination) {
      total
      eventos {
        _id
        nombre
        fecha
        tipo
        development
        usuario_id
      }
    }
  }
`;

// Panel contextual del chat (#7). Verificado EN VIVO 3-ago vs api-mcp:
// getEventoById(id: ID!) — NO acepta `development`; `id` es ID! (no String).
// Devuelve el evento rico (itinerarios_array/presupuesto_objeto/invitados_array).
const GET_EVENTO_BY_ID = `
  query GetEventoById($id: ID!) {
    getEventoById(id: $id) {
      _id
      nombre
      fecha
      tipo
      development
      itinerarios_array
      presupuesto_objeto
      invitados_array
      menus_array
      planSpace
    }
  }
`;

// ========================================
// SERVICE FUNCTIONS
// ========================================

/**
 * Obtiene los eventos del usuario autenticado vía api-mcp GraphQL.
 * usuario_id = email o uid del usuario (lo resuelve el caller desde el contexto de sesión).
 */
export const getEventosByUsuario = async (
  development: string,
  usuarioId: string,
  pagination?: { limit?: number; page?: number },
): Promise<Evento[]> => {
  if (!usuarioId) return [];
  const data = await mcpClient.query<GetEventosByUsuarioResponse>(GET_EVENTOS_BY_USUARIO, {
    development,
    pagination: { limit: pagination?.limit ?? 100, page: pagination?.page ?? 1 },
    usuario_id: usuarioId,
  });
  return data.getEventosByUsuario?.eventos ?? [];
};

/**
 * Obtiene UN evento con sus sub-objetos ricos (itinerario/presupuesto/servicios/invitados)
 * para el panel contextual del chat (#7). Lectura DIRECTA a api-mcp (NO pasa por el LLM →
 * sin coste IA, sin doble billing). El gate por dueño lo aplica api-mcp: si el usuario no
 * es dueño, los *_array/*_objeto llegan en null (solo stub público).
 * Devuelve null si no existe o no hay id.
 */
export const getEventoById = async (id: string): Promise<EventoDetalle | null> => {
  if (!id) return null;
  const data = await mcpClient.query<GetEventoByIdResponse>(GET_EVENTO_BY_ID, { id });
  return data.getEventoById ?? null;
};

/**
 * Formatea el nombre de un evento para mostrarlo en selectores.
 */
export const formatEventoLabel = (evento: Evento): string => {
  const nombre = evento.nombre || `Evento ${evento._id.slice(-6)}`;
  return evento.fecha ? `${nombre} (${evento.fecha})` : nombre;
};
