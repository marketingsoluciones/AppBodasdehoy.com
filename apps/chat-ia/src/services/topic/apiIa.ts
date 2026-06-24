/**
 * 🚧 ApiIaTopicService — topics vía api-ia (Opción A). CRUD CONFIRMADO por api-ia (2026-06-03):
 * GET/POST/PATCH/DELETE /chat/topics desplegados. searchTopics/cloneTopic NO existen en api-mcp
 * (no bloquean → pending). Patrón fetch /api/backend/... (→api-ia), buildAuthHeaders + credentials.
 */
import { buildAuthHeaders } from '@/utils/authToken';

import { ITopicService } from './type';

const BACKEND = '/api/backend';
const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');
const tenant = () =>
  (typeof window !== 'undefined' && localStorage.getItem('current_development')) || 'bodasdehoy';

async function call(method: string, path: string, body?: unknown): Promise<any> {
  // BUG-MSG-01 paridad (auditoría 24-jun): api-ia exige X-Development en todos
  // los endpoints /api/backend/chat/... (sessions, messages, topics, etc.).
  // Sin él → HTTP 400 "Falta X-Development". Añadir aquí proactivamente para
  // que cuando alguien empiece a usar este service no salga el mismo bug.
  const res = await fetch(`${origin()}${BACKEND}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
    headers: {
      ...buildAuthHeaders(),
      'Content-Type': 'application/json',
      'X-Development': tenant(),
    },
    method,
  });
  if (!res.ok) throw new Error(`[topic/apiIa] ${method} ${path} → HTTP ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const unwrap = (res: any) => res?.data ?? res?.topics ?? res ?? [];

export class ApiIaTopicService implements ITopicService {
  // ───────── CONFIRMADOS (GET/POST/PATCH/DELETE /chat/topics) ─────────
  createTopic: ITopicService['createTopic'] = async (params) => {
    const res = await call('POST', '/chat/topics', params);
    const d = res?.data ?? res;
    return (d?.id ?? d?._id) as string;
  };
  getTopics: ITopicService['getTopics'] = async (params) => {
    const qs = new URLSearchParams();
    if ((params as any)?.sessionId) qs.set('sessionId', (params as any).sessionId);
    const res = await call('GET', `/chat/topics?${qs.toString()}`);
    return unwrap(res);
  };
  getAllTopics: ITopicService['getAllTopics'] = async () => {
    const res = await call('GET', '/chat/topics');
    return unwrap(res);
  };
  updateTopic: ITopicService['updateTopic'] = async (id, data) =>
    call('PATCH', `/chat/topics/${encodeURIComponent(id)}`, data);
  removeTopic: ITopicService['removeTopic'] = async (id) =>
    call('DELETE', `/chat/topics/${encodeURIComponent(id)}`);
  removeTopics: ITopicService['removeTopics'] = async (sessionId) =>
    call('DELETE', `/chat/topics?sessionId=${encodeURIComponent(sessionId)}`);

  // ───────── pending: NO existen en api-mcp / poco usadas (no bloquean) ─────────
  private pending(method: string, note: string): never {
    throw new Error(
      `[topic/apiIa] ${method}: ${note}. No bloquea el flujo principal. ` +
        `Ver project_migracion_api_ia_estado_03jun.`,
    );
  }
  cloneTopic: ITopicService['cloneTopic'] = async () =>
    this.pending('cloneTopic', 'duplicar topic — NO existe en api-mcp (UX secundaria)');
  searchTopics: ITopicService['searchTopics'] = async () =>
    this.pending('searchTopics', 'buscar topics — NO existe en api-mcp (secundaria)');
  countTopics: ITopicService['countTopics'] = async () =>
    this.pending('countTopics', 'contar topics (stats)');
  rankTopics: ITopicService['rankTopics'] = async () =>
    this.pending('rankTopics', 'ranking topics (stats)');
  batchCreateTopics: ITopicService['batchCreateTopics'] = async () =>
    this.pending('batchCreateTopics', 'import masivo (raro)');
  batchRemoveTopics: ITopicService['batchRemoveTopics'] = async () =>
    this.pending('batchRemoveTopics', 'borrado masivo (raro)');
  removeAllTopic: ITopicService['removeAllTopic'] = async () =>
    this.pending('removeAllTopic', 'borrar todos (raro/peligroso)');
}
