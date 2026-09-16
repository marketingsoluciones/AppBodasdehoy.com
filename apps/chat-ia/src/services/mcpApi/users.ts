/**
 * mcpApi/users — buscar personas de la marca y resolver su nombre.
 *
 * 16-09: lo necesitan dos sitios —el panel de compartir conversación y el de "equipo con
 * acceso" de cada número— así que vive aquí y no dentro de uno de ellos. Formas verificadas
 * contra el esquema: `searchUsers(query, development, limit)` y `getUser(uid)`.
 */

import { mcpClient } from './client';

export interface PersonSummary {
  email?: string;
  id: string;
  name: string;
}

const SEARCH_USERS = `
  query SearchUsers($query: String!, $development: String!, $limit: Int) {
    searchUsers(query: $query, development: $development, limit: $limit) {
      displayName
      email
      id
      name
    }
  }
`;

const GET_USER = `
  query GetUser($uid: ID) {
    getUser(uid: $uid) {
      displayName
      email
    }
  }
`;

/** Busca personas de la marca. Devuelve [] si la consulta es demasiado corta o falla. */
export async function searchPeople(
  query: string,
  development: string,
  limit = 8,
): Promise<PersonSummary[]> {
  if (query.trim().length < 2) return [];
  try {
    const data = await mcpClient.query<{
      searchUsers: Array<{ displayName?: string; email?: string; id: string; name?: string }>;
    }>(SEARCH_USERS, { development, limit, query: query.trim() });
    return (data.searchUsers ?? []).map((u) => ({
      email: u.email,
      id: u.id,
      name: u.displayName || u.name || u.email || u.id,
    }));
  } catch {
    return [];
  }
}

/**
 * Nombre de una persona por su id.
 *
 * Si el backend no responde se devuelve el propio id: es feo, pero enseñar un identificador
 * es mejor que dejar en blanco quién tiene acceso a algo.
 */
export async function resolvePersonName(uid: string): Promise<string> {
  try {
    const data = await mcpClient.query<{
      getUser: { displayName?: string; email?: string } | null;
    }>(GET_USER, { uid });
    return data.getUser?.displayName || data.getUser?.email || uid;
  } catch {
    return uid;
  }
}
