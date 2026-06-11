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
import { DEFAULT_AGENT_CONFIG } from '@/const/settings';
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
    // Guard: visitante sin uid → no lanzar /chat/sessions?userId= vacío; lista vacía.
    if (!uid()) return mapApiIaSessionsToList([]) as ChatSessionList;
    const res = await call('GET', `/chat/sessions?userId=${encodeURIComponent(uid())}`);
    return mapApiIaSessionsToList(res?.data ?? res?.sessions ?? res) as ChatSessionList;
  };

  // POST /chat/session → {success, data:{id}, errors}. Verificado smoke 2026-06-03: la respuesta
  // trae success:false + errors[] cuando falla (p.ej. UNAUTHENTICATED) → propagar el error real.
  createSession: ISessionService['createSession'] = async (_type, defaultValue) => {
    const res = await call('POST', '/chat/session', {
      config: (defaultValue as LobeAgentSession)?.config,
      development: tenant(),
      title: (defaultValue as LobeAgentSession)?.meta?.title,
      type: _type === LobeSessionType.Group ? 'group' : 'agent',
    });
    if (res?.success === false) {
      const e = res?.errors?.[0];
      throw new Error(`[session/apiIa] createSession: ${e?.message || 'falló'} (${e?.code || 'ERROR'})`);
    }
    const d = res?.data ?? res;
    const id = d?.id ?? d?._id ?? d?.sessionId;
    if (!id) throw new Error('[session/apiIa] createSession: respuesta sin id');
    return id as string;
  };

  // ───────── CONFIRMADOS por api-ia (2026-06-03, 12 endpoints desplegados) ─────────
  // PATCH /chat/sessions/{id} — update genérico (session + meta + config van por aquí).
  updateSession: ISessionService['updateSession'] = async (id, data) =>
    call('PATCH', `/chat/sessions/${encodeURIComponent(id)}`, data);
  updateSessionMeta: ISessionService['updateSessionMeta'] = async (id, meta) =>
    call('PATCH', `/chat/sessions/${encodeURIComponent(id)}`, { meta });
  updateSessionConfig: ISessionService['updateSessionConfig'] = async (id, config) =>
    call('PATCH', `/chat/sessions/${encodeURIComponent(id)}`, { config });
  updateSessionChatConfig: ISessionService['updateSessionChatConfig'] = async (id, chatConfig) =>
    call('PATCH', `/chat/sessions/${encodeURIComponent(id)}`, { chatConfig });

  // DELETE /chat/sessions/{id}
  removeSession: ISessionService['removeSession'] = async (id) =>
    call('DELETE', `/chat/sessions/${encodeURIComponent(id)}`);

  // GET /chat/sessions/search?userId=X&q=Y
  searchSessions: ISessionService['searchSessions'] = async (keyword) => {
    // Guard: visitante sin uid → no lanzar /chat/sessions/search?userId= vacío; sin resultados.
    if (!uid()) return [];
    const res = await call(
      'GET',
      `/chat/sessions/search?userId=${encodeURIComponent(uid())}&q=${encodeURIComponent(keyword)}`,
    );
    const list = mapApiIaSessionsToList(res?.data ?? res?.sessions ?? res);
    return list.sessions;
  };

  // ───────── SESSION GROUPS — CONFIRMADOS (GET/POST/PATCH/DELETE /chat/session-groups) ─────────
  createSessionGroup: ISessionService['createSessionGroup'] = async (name, sort) => {
    const res = await call('POST', '/chat/session-groups', { name, sort });
    const d = res?.data ?? res;
    return (d?.id ?? d?._id) as string;
  };
  // GET /chat/session-groups REQUIERE userId (verificado smoke 2026-06-03: 422 sin él).
  getSessionGroups: ISessionService['getSessionGroups'] = async () => {
    const res = await call('GET', `/chat/session-groups?userId=${encodeURIComponent(uid())}`);
    return (res?.data ?? res?.groups ?? res ?? []) as any;
  };
  updateSessionGroup: ISessionService['updateSessionGroup'] = async (id, data) =>
    call('PATCH', `/chat/session-groups/${encodeURIComponent(id)}`, data);
  removeSessionGroup: ISessionService['removeSessionGroup'] = async (id, removeChildren) =>
    call(
      'DELETE',
      `/chat/session-groups/${encodeURIComponent(id)}${removeChildren ? '?removeChildren=true' : ''}`,
    );

  // ───────── 5 ops NO existentes en api-mcp (api-ia 2026-06-03) — pending, no bloquean ─────────
  private pending(method: string, note: string): never {
    throw new Error(
      `[session/apiIa] ${method}: ${note}. NO existe en api-mcp (api-ia 2026-06-03). ` +
        `No bloquea el flujo principal. Ver project_migracion_api_ia_estado_03jun.`,
    );
  }
  cloneSession: ISessionService['cloneSession'] = async () =>
    this.pending('cloneSession', 'duplicar sesión (UX secundaria)');
  // getSessionConfig: api-mcp aún no expone getGlobalConfig/config por sesión (verificado
  // 2026-06-04: query no está en el schema). Para NO bloquear el arranque del chat
  // (useFetchAgentConfig la llama al abrir cada sesión), devolvemos el DEFAULT_AGENT_CONFIG
  // como fallback (estrategia acordada con api-ia). Cuando api-mcp lo exponga, conectar aquí.
  getSessionConfig: ISessionService['getSessionConfig'] = async () =>
    DEFAULT_AGENT_CONFIG;
  updateSessionGroupOrder: ISessionService['updateSessionGroupOrder'] = async () =>
    this.pending('updateSessionGroupOrder', 'reordenar grupos (cosmético)');
  removeSessionGroups: ISessionService['removeSessionGroups'] = async () =>
    this.pending('removeSessionGroups', 'borrar todos los grupos (raro)');
  batchCreateSessionGroups: ISessionService['batchCreateSessionGroups'] = async () =>
    this.pending('batchCreateSessionGroups', 'import masivo de grupos (raro)');

  // ───────── ops poco usadas — sin endpoint dedicado, pending ─────────
  removeAllSessions: ISessionService['removeAllSessions'] = async () =>
    this.pending('removeAllSessions', 'borrar todas las sesiones (raro/peligroso)');
  getSessionsByType: ISessionService['getSessionsByType'] = async () =>
    this.pending('getSessionsByType', 'filtrar por tipo — usar getGroupedSessions y filtrar en cliente');
  countSessions: ISessionService['countSessions'] = async () =>
    this.pending('countSessions', 'contar sesiones (stats)');
  rankSessions: ISessionService['rankSessions'] = async () =>
    this.pending('rankSessions', 'ranking sesiones (stats)');
  hasSessions: ISessionService['hasSessions'] = async () =>
    this.pending('hasSessions', 'check existencia (stats)');
  batchCreateSessions: ISessionService['batchCreateSessions'] = async () =>
    this.pending('batchCreateSessions', 'import masivo de sesiones (raro)');
}
