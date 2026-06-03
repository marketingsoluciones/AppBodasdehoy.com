/**
 * 🚧 ApiIaTopicService — topics vía api-ia (Opción A). NINGÚN endpoint confirmado aún.
 *
 * api-ia NO ha confirmado rutas de topic (2026-06-03). Esqueleto con PATHS PROPUESTOS en el
 * throw para que, cuando api-ia los exponga (ver project_migracion_api_ia_estado_03jun), solo
 * haya que rellenar la llamada `call()`. NO activar hasta que existan.
 *
 * Patrón idéntico a ApiIaMessageService / ApiIaSessionService: fetch a /api/backend/... (→api-ia).
 */
import { buildAuthHeaders } from '@/utils/authToken';

import { ITopicService } from './type';

const BACKEND = '/api/backend';
const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');

// Helper listo para cuando se rellenen los métodos (evita duplicar fetch en cada uno).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function call(method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${origin()}${BACKEND}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
    headers: { ...buildAuthHeaders(), 'Content-Type': 'application/json' },
    method,
  });
  if (!res.ok) throw new Error(`[topic/apiIa] ${method} ${path} → HTTP ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export class ApiIaTopicService implements ITopicService {
  private pending(method: string, proposedPath: string): never {
    throw new Error(
      `[topic/apiIa] ${method}: endpoint api-ia no confirmado (propuesto: ${proposedPath}). ` +
        `NO activar sin que api-ia lo exponga. Ver project_migracion_api_ia_estado_03jun.`,
    );
  }

  createTopic: ITopicService['createTopic'] = async () =>
    this.pending('createTopic', 'POST /chat/topics');
  getTopics: ITopicService['getTopics'] = async () =>
    this.pending('getTopics', 'GET /chat/topics?sessionId=');
  getAllTopics: ITopicService['getAllTopics'] = async () =>
    this.pending('getAllTopics', 'GET /chat/topics/all');
  updateTopic: ITopicService['updateTopic'] = async () =>
    this.pending('updateTopic', 'PATCH /chat/topics/{id}');
  removeTopic: ITopicService['removeTopic'] = async () =>
    this.pending('removeTopic', 'DELETE /chat/topics/{id}');
  removeTopics: ITopicService['removeTopics'] = async () =>
    this.pending('removeTopics', 'DELETE /chat/topics?sessionId=');
  cloneTopic: ITopicService['cloneTopic'] = async () =>
    this.pending('cloneTopic', 'POST /chat/topics/{id}/clone');
  searchTopics: ITopicService['searchTopics'] = async () =>
    this.pending('searchTopics', 'GET /chat/topics/search?q=');
  countTopics: ITopicService['countTopics'] = async () =>
    this.pending('countTopics', 'GET /chat/topics/count');
  rankTopics: ITopicService['rankTopics'] = async () =>
    this.pending('rankTopics', 'GET /chat/topics/rank');
  batchCreateTopics: ITopicService['batchCreateTopics'] = async () =>
    this.pending('batchCreateTopics', 'POST /chat/topics/batch');
  batchRemoveTopics: ITopicService['batchRemoveTopics'] = async () =>
    this.pending('batchRemoveTopics', 'DELETE /chat/topics/batch');
  removeAllTopic: ITopicService['removeAllTopic'] = async () =>
    this.pending('removeAllTopic', 'DELETE /chat/topics');
}
