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
  updateTopic: ITopicService['updateTopic'] = async (id, data) => {
    // BUG-NEW-BUILD34-01 QA #34 (29-jun): PATCH /chat/topics/:id devuelve 404
    // cuando topic no existe en api-ia (sesiones legacy/auto-created tras
    // el bug INSERT). El error visible en console era ruido — el chat sigue
    // funcionando aunque el título no se actualice. Capturamos 404 silente.
    try {
      return await call('PATCH', `/chat/topics/${encodeURIComponent(id)}`, data);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        // Silent: el topic puede haber sido eliminado o no llegó a persistirse.
        console.warn(`[topic/apiIa] updateTopic ${id} → 404 (silenciado)`);
        return undefined as any;
      }
      throw e;
    }
  };
  removeTopic: ITopicService['removeTopic'] = async (id) =>
    call('DELETE', `/chat/topics/${encodeURIComponent(id)}`);
  removeTopics: ITopicService['removeTopics'] = async (sessionId) =>
    call('DELETE', `/chat/topics?sessionId=${encodeURIComponent(sessionId)}`);

  // BUG QA 13-jul #25: sanitizar mensaje para no filtrar nombres internos al navegador.
  private pending(method: string, _note: string): never {
    throw new Error(`Operación no soportada: ${method}`);
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
