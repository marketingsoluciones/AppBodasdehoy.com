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

// Evento con los datos RICOS del evento (para el panel contextual del chat).
// Los *_array y presupuesto_objeto son escalares JSON opacos en el schema api-mcp
// (04-jul, EVT-01): sin subselección → el cliente los consume tal cual (arrays de
// objetos). Verificado contra la query que appEventos ya usa en prod (Fetching.ts
// getEventsByID → queryenEvento).
export interface EventoDetalle extends Evento {
  invitados_array?: unknown;
  itinerarios_array?: unknown;
  lugar?: { _id?: string; slug?: string; title?: string } | null;
  menus_array?: unknown;
  presupuesto_objeto?: unknown;
  showChildrenGuest?: boolean;
}

export interface QueryenEventoResponse {
  queryenEvento: EventoDetalle | null;
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

// Lectura de UN evento con sus datos ricos (presupuesto/itinerario/invitados).
// Espeja la query PROBADA de appEventos (Fetching.ts getEventsByID): resolver
// `queryenEvento(variable, valor, development)`. variable="_id" + valor=eventoId.
// IMPORTANTE: NO poner comentarios `#` dentro de este template (el proxy lo aplasta
// a 1 línea → el `#` come hasta EOF → "Syntax Error: Expected Name, found <EOF>").
const GET_EVENTO_DETALLE = `
  query GetEventoDetalle($variable: String, $valor: String, $development: String!) {
    queryenEvento(variable: $variable, valor: $valor, development: $development) {
      _id
      nombre
      fecha
      tipo
      usuario_id
      development
      lugar { _id title slug }
      itinerarios_array
      presupuesto_objeto
      invitados_array
      menus_array
      showChildrenGuest
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
 * Obtiene UN evento con sus datos ricos (presupuesto/itinerario/invitados/menús)
 * para el panel contextual del chat. Devuelve null si no se resuelve.
 * Nota: los *_array y presupuesto_objeto vuelven como JSON opaco (parsear en el consumidor).
 */
export const getEventoDetalle = async (
  development: string,
  eventoId: string,
): Promise<EventoDetalle | null> => {
  if (!eventoId) return null;
  const data = await mcpClient.query<QueryenEventoResponse>(GET_EVENTO_DETALLE, {
    development,
    valor: eventoId,
    variable: '_id',
  });
  return data.queryenEvento ?? null;
};

/**
 * Formatea el nombre de un evento para mostrarlo en selectores.
 */
export const formatEventoLabel = (evento: Evento): string => {
  const nombre = evento.nombre || `Evento ${evento._id.slice(-6)}`;
  return evento.fecha ? `${nombre} (${evento.fecha})` : nombre;
};
