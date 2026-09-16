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
import { resolvePersonName, searchPeople as searchPeopleService } from '@/services/mcpApi/users';
import {
  shareConversation as shareConversationMutation,
  unshareConversation as unshareConversationMutation,
  type SharePermission,
} from '@/services/mcpApi/whatsapp';



export interface ShareCandidate {
  /** Para pintar quién es sin tener que resolverlo dos veces. */
  detail?: string;
  id: string;
  name: string;
  type: 'team' | 'user';
}

const GET_TEAMS = `
  query GetTeams($development: String!) {
    getTeams(development: $development) {
      success
      teams { id name memberCount }
    }
  }
`;

/** Busca personas de la marca (servicio compartido con el panel de canales). */
export async function searchPeople(
  query: string,
  development: string,
  limit = 8,
): Promise<ShareCandidate[]> {
  const people = await searchPeopleService(query, development, limit);
  return people.map((p) => ({ detail: p.email, id: p.id, name: p.name, type: 'user' as const }));
}

/** Equipos de la marca, para compartir con todo un grupo de una vez. */
export async function listTeams(development: string): Promise<ShareCandidate[]> {
  const data = await mcpClient.query<{
    getTeams: { success: boolean, teams: Array<{ id: string; memberCount?: number; name: string }>; };
  }>(GET_TEAMS, { development });
  if (!data.getTeams?.success) return [];
  return (data.getTeams.teams ?? []).map((t) => ({
    detail: typeof t.memberCount === 'number' ? `${t.memberCount} personas` : undefined,
    id: t.id,
    name: t.name,
    type: 'team' as const,
  }));
}

/** Resuelve el nombre de quien ya tiene acceso: `shared_with` solo guarda ids. */
export async function resolvePrincipalName(principalId: string): Promise<string> {
  return resolvePersonName(principalId);
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

export {type SharePermission} from '@/services/mcpApi/whatsapp';