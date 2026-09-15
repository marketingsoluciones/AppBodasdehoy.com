import { buildAuthHeaders } from '@/utils/authToken';

interface SharePermissions { can_read: boolean; can_write: boolean; can_delete: boolean }
interface GraphqlEnvelope<T> { data?: T; errors?: { message?: string }[] }
interface PermissionResult {
  getResourcePermissions?: {
    success: boolean;
    permissions?: { owner: { userId: string }; sharedWith: { userId: string; permissions: { can_share: boolean } }[] };
    errors?: { message?: string }[];
  };
}

function authenticatedHeaders(): Record<string, string> {
  const headers = buildAuthHeaders({ 'Content-Type': 'application/json' });
  if (!headers.Authorization) throw new Error('Inicia sesión para compartir esta conversación.');
  const development = localStorage.getItem('current_development');
  if (!development) throw new Error('No se ha identificado el entorno de la conversación.');
  return { ...headers, 'X-Development': development };
}

async function graphql<T>(query: string, variables: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const response = await fetch('/api/graphql', {
    method: 'POST', headers: authenticatedHeaders(), body: JSON.stringify({ query, variables }),
    credentials: 'include', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
  });
  const result = await response.json() as GraphqlEnvelope<T>;
  if (!response.ok || result.errors?.length || !result.data) {
    throw new Error(result.errors?.[0]?.message || 'No se pudieron consultar los permisos.');
  }
  return result.data;
}

export async function canManageChat(sessionId: string, userId: string, signal?: AbortSignal): Promise<boolean> {
  if (!sessionId || !userId) return false;
  // getSession enforces read ACL. Never infer ownership from the active user.
  const access = await graphql<{ getSession: { id: string } | null }>(
    'query ShareAccess($sessionId: String!) { getSession(sessionId: $sessionId) { id } }',
    { sessionId }, signal,
  );
  if (access.getSession?.id !== sessionId) return false;
  const result = await graphql<PermissionResult>(
    'query SharePermissions($resourceId: ID!) { getResourcePermissions(resourceType: CHAT, resourceId: $resourceId) { success permissions { owner { userId } sharedWith { userId permissions { can_share } } } errors { message } } }',
    { resourceId: sessionId }, signal,
  );
  const payload = result.getResourcePermissions;
  if (!payload?.success || !payload.permissions) throw new Error(payload?.errors?.[0]?.message || 'Permisos no disponibles.');
  return payload.permissions.owner.userId === userId ||
    payload.permissions.sharedWith.some(member => member.userId === userId && member.permissions.can_share);
}

export async function shareChat(sessionId: string, targetUserId: string, permissions: SharePermissions): Promise<void> {
  if (!targetUserId.trim()) throw new Error('Selecciona un usuario.');
  const response = await fetch('/api/chat/share', {
    method: 'POST', credentials: 'include', headers: authenticatedHeaders(),
    signal: AbortSignal.timeout(30_000),
    body: JSON.stringify({ session_id: sessionId, target_user_id: targetUserId.trim(), ...permissions }),
  });
  const result = await response.json() as { success?: boolean; errors?: { message?: string }[]; detail?: unknown };
  if (!response.ok || result.success !== true) {
    throw new Error(result.errors?.[0]?.message || (typeof result.detail === 'string' ? result.detail : 'No se pudo compartir la conversación.'));
  }
}

export interface ChatRecipient { id: string; name: string; email: string; phone?: string | null }

export async function searchChatRecipients(query: string, signal?: AbortSignal): Promise<ChatRecipient[]> {
  const text = query.trim();
  if (text.length < 3) return [];
  const development = localStorage.getItem('current_development');
  if (!development) throw new Error('No se ha identificado el entorno.');
  const result = await graphql<{ searchUsers: ChatRecipient[] }>(
    'query ChatRecipients($query: String!, $development: String!) { searchUsers(query: $query, development: $development, limit: 10) { id name email phone } }',
    { query: text, development }, signal,
  );
  return result.searchUsers.filter(user => Boolean(user.id));
}
