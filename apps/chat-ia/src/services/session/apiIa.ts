/**
 * 🚧 ApiIaSessionService — sesiones vía api-ia (Opción A). PARCIAL: solo 2 métodos confirmados.
 *
 * api-ia confirmó (2026-06-03): GET /chat/sessions (lista) + POST /chat/session (crear).
 * El RESTO del CRUD de sesión (update/delete/clone/config/grupos) NO está confirmado aún
 * → esos métodos lanzan pending() con el PATH PROPUESTO en comentario, para que cuando api-ia
 * los exponga (ver project_migracion_api_ia_estado_03jun, gap de ~30 endpoints) solo haya que
 * rellenar la llamada. NO activar este service hasta que todos los métodos del flujo existan.
 *
 * Patrón: fetch a /api/backend/... (proxy → api-ia), buildAuthHeaders + credentials. Igual que
 * ApiIaMessageService. userId = firebase_uid.
 */
import { ChatSessionList, LobeAgentSession, LobeSessionType } from '@/types/session';
import { buildAuthHeaders } from '@/utils/authToken';

import { mapApiIaSessionsToList } from '../api-ia.mappers';
import { ISessionService } from './type';

const BACKEND = '/api/backend';
const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');
const tenant = () =>
  (typeof window !== 'undefined' && localStorage.getItem('current_development')) || 'bodasdehoy';
const uid = () => (typeof window !== 'undefined' && localStorage.getItem('user_uid')) || '';

async function call(method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${origin()}${BACKEND}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
    headers: { ...buildAuthHeaders(), 'Content-Type': 'application/json' },
    method,
  });
  if (!res.ok) throw new Error(`[session/apiIa] ${method} ${path} → HTTP ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export class ApiIaSessionService implements ISessionService {
  // ───────── CONFIRMADOS ─────────
  // GET /chat/sessions?userId=<firebase_uid> → {success,data:[...]}
  getGroupedSessions: ISessionService['getGroupedSessions'] = async () => {
    const res = await call('GET', `/chat/sessions?userId=${encodeURIComponent(uid())}`);
    return mapApiIaSessionsToList(res?.data ?? res?.sessions ?? res) as ChatSessionList;
  };

  // POST /chat/session → {success,data:{id}}
  createSession: ISessionService['createSession'] = async (_type, defaultValue) => {
    const res = await call('POST', '/chat/session', {
      config: (defaultValue as LobeAgentSession)?.config,
      development: tenant(),
      title: (defaultValue as LobeAgentSession)?.meta?.title,
      type: _type === LobeSessionType.Group ? 'group' : 'agent',
    });
    const d = res?.data ?? res;
    const id = d?.id ?? d?._id ?? d?.sessionId;
    if (!id) throw new Error('[session/apiIa] createSession: respuesta sin id');
    return id as string;
  };

  // ───────── PENDIENTE api-ia (path propuesto en el throw) ─────────
  private pending(method: string, proposedPath: string): never {
    throw new Error(
      `[session/apiIa] ${method}: endpoint api-ia no confirmado (propuesto: ${proposedPath}). ` +
        `NO activar sin que api-ia lo exponga. Ver project_migracion_api_ia_estado_03jun.`,
    );
  }

  updateSession: ISessionService['updateSession'] = async () =>
    this.pending('updateSession', 'PATCH /chat/sessions/{id}');
  updateSessionConfig: ISessionService['updateSessionConfig'] = async () =>
    this.pending('updateSessionConfig', 'PATCH /chat/sessions/{id}/config');
  updateSessionMeta: ISessionService['updateSessionMeta'] = async () =>
    this.pending('updateSessionMeta', 'PATCH /chat/sessions/{id} (meta)');
  updateSessionChatConfig: ISessionService['updateSessionChatConfig'] = async () =>
    this.pending('updateSessionChatConfig', 'PATCH /chat/sessions/{id}/chat-config');
  getSessionConfig: ISessionService['getSessionConfig'] = async () =>
    this.pending('getSessionConfig', 'GET /chat/sessions/{id}/config');
  cloneSession: ISessionService['cloneSession'] = async () =>
    this.pending('cloneSession', 'POST /chat/sessions/{id}/clone');
  removeSession: ISessionService['removeSession'] = async () =>
    this.pending('removeSession', 'DELETE /chat/sessions/{id}');
  removeAllSessions: ISessionService['removeAllSessions'] = async () =>
    this.pending('removeAllSessions', 'DELETE /chat/sessions');
  searchSessions: ISessionService['searchSessions'] = async () =>
    this.pending('searchSessions', 'GET /chat/sessions/search?q=');
  getSessionsByType: ISessionService['getSessionsByType'] = async () =>
    this.pending('getSessionsByType', 'GET /chat/sessions?type=');
  countSessions: ISessionService['countSessions'] = async () =>
    this.pending('countSessions', 'GET /chat/sessions/count');
  rankSessions: ISessionService['rankSessions'] = async () =>
    this.pending('rankSessions', 'GET /chat/sessions/rank');
  hasSessions: ISessionService['hasSessions'] = async () =>
    this.pending('hasSessions', 'GET /chat/sessions/count');
  batchCreateSessions: ISessionService['batchCreateSessions'] = async () =>
    this.pending('batchCreateSessions', 'POST /chat/sessions/batch');

  // Session groups (ninguno confirmado)
  createSessionGroup: ISessionService['createSessionGroup'] = async () =>
    this.pending('createSessionGroup', 'POST /chat/session-groups');
  getSessionGroups: ISessionService['getSessionGroups'] = async () =>
    this.pending('getSessionGroups', 'GET /chat/session-groups');
  updateSessionGroup: ISessionService['updateSessionGroup'] = async () =>
    this.pending('updateSessionGroup', 'PATCH /chat/session-groups/{id}');
  updateSessionGroupOrder: ISessionService['updateSessionGroupOrder'] = async () =>
    this.pending('updateSessionGroupOrder', 'PATCH /chat/session-groups/order');
  removeSessionGroup: ISessionService['removeSessionGroup'] = async () =>
    this.pending('removeSessionGroup', 'DELETE /chat/session-groups/{id}');
  removeSessionGroups: ISessionService['removeSessionGroups'] = async () =>
    this.pending('removeSessionGroups', 'DELETE /chat/session-groups');
  batchCreateSessionGroups: ISessionService['batchCreateSessionGroups'] = async () =>
    this.pending('batchCreateSessionGroups', 'POST /chat/session-groups/batch');
}
