/**
 * data/sharing — con quién se comparte una conversación.
 *
 * M5 (16-09). api-mcp lleva tiempo con todo esto resuelto (`shareConversation`,
 * `unshareConversation`, `searchUsers`, `getTeams`) y el front no llamaba a nada: no había
 * forma de compartir una conversación ni de retirar el acceso. Formas verificadas contra el
 * servidor: searchUsers(query, development, limit) y getTeams(development, includeInactive).
 *
 * Como en el resto de la capa de datos: las credenciales las pone el cliente MCP, la forma
 * se decide aquí, y los componentes no hablan con el backend.
 */

import { mcpClient } from '@/services/mcpApi/client';
import {
  shareConversation as shareConversationMutation,
  unshareConversation as unshareConversationMutation,
  type SharePermission,
} from '@/services/mcpApi/whatsapp';

export type { SharePermission };

export interface ShareCandidate {
  /** Para pintar quién es sin tener que resolverlo dos veces. */
  detail?: string;
  id: string;
  name: string;
  type: 'team' | 'user';
}

const SEARCH_USERS = `
  query SearchUsers($query: String!, $development: String!, $limit: Int) {
    searchUsers(query: $query, development: $development, limit: $limit) {
      id
      name
      email
      displayName
    }
  }
`;

const GET_TEAMS = `
  query GetTeams($development: String!) {
    getTeams(development: $development) {
      success
      teams { id name memberCount }
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

/** Busca personas de la marca por nombre o email. Devuelve [] si la búsqueda es muy corta. */
export async function searchPeople(
  query: string,
  development: string,
  limit = 8,
): Promise<ShareCandidate[]> {
  if (query.trim().length < 2) return [];
  const data = await mcpClient.query<{
    searchUsers: Array<{ displayName?: string; email?: string; id: string; name?: string }>;
  }>(SEARCH_USERS, { development, limit, query: query.trim() });
  return (data.searchUsers ?? []).map((u) => ({
    detail: u.email,
    id: u.id,
    name: u.displayName || u.name || u.email || u.id,
    type: 'user' as const,
  }));
}

/** Equipos de la marca, para compartir con todo un grupo de una vez. */
export async function listTeams(development: string): Promise<ShareCandidate[]> {
  const data = await mcpClient.query<{
    getTeams: { teams: Array<{ id: string; memberCount?: number; name: string }>; success: boolean };
  }>(GET_TEAMS, { development });
  if (!data.getTeams?.success) return [];
  return (data.getTeams.teams ?? []).map((t) => ({
    detail: typeof t.memberCount === 'number' ? `${t.memberCount} personas` : undefined,
    id: t.id,
    name: t.name,
    type: 'team' as const,
  }));
}

/**
 * Resuelve el nombre de quien ya tiene acceso.
 *
 * `shared_with` guarda solo ids, así que sin esto el panel enseñaría identificadores en vez
 * de personas. Si el backend no responde, se devuelve el id: preferible a no enseñar nada.
 */
export async function resolvePrincipalName(principalId: string): Promise<string> {
  try {
    const data = await mcpClient.query<{
      getUser: { displayName?: string; email?: string } | null;
    }>(GET_USER, { uid: principalId });
    return data.getUser?.displayName || data.getUser?.email || principalId;
  } catch {
    return principalId;
  }
}

export async function share(
  conversationId: string,
  candidate: ShareCandidate,
  permission: SharePermission,
): Promise<boolean> {
  return shareConversationMutation(conversationId, candidate.type, candidate.id, permission);
}

export async function unshare(conversationId: string, principalId: string): Promise<boolean> {
  return unshareConversationMutation(conversationId, principalId);
}
