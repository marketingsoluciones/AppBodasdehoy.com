/**
 * 🚧 Persistencia de mensajes vía api-ia — INACTIVO hasta confirmar endpoints (Opción A).
 *
 * REGLA (user 2026-06-03): el front NO persiste en api-mcp directo; TODO va por api-ia
 * (gestor de agentes + contable). Ver [[feedback_api_ia_gestor_agentes_no_solo_billing]].
 *
 * CONTEXTO (ver [[project_chat_ia_streaming_vs_persistencia]]):
 *  · El STREAMING ya pasa por api-ia (/webapi/chat). NO se toca aquí.
 *  · La PERSISTENCIA hoy va por tRPC→drizzle (messageService ServerService). Esto es lo que
 *    movemos a api-ia para eliminar el data-layer y bajar módulos de compilación.
 *
 * Este service implementa los métodos de IMessageService MÁS USADOS en el flujo de chat
 * (medido: createMessage 23×, updateMessage 13×, updateMessageError 9×, getMessages 4×,
 * removeMessage 1×) vía fetch a /api/backend/... (proxy que YA apunta a api-ia). Los métodos
 * raros (TTS/translate/plugin/RAG/stats) lanzan pending() hasta que se confirmen.
 *
 * ✅ ENDPOINTS CONFIRMADOS por api-ia (2026-06-03), todos desplegados:
 *   POST   /chat/messages           body:{sessionId, role, content, type?} → {success,data:{id,...}}
 *   PATCH  /chat/messages/{id}       body:{content,...}
 *   DELETE /chat/messages/{id}?reason=X
 *   GET    /chat/messages?sessionId  (leer)
 * Shape plano, role en minúsculas, Authorization Bearer JWT. api-mcp soporta send/update/delete.
 *
 * NOTA: en el flujo normal de chat, /chat/stream con persist:true persiste user+assistant solo.
 * Estos endpoints individuales son para edición/borrado/correcciones que el front dispara aparte.
 */
import { UIChatMessage } from '@lobechat/types';

import { INBOX_SESSION_ID } from '@/const/session';
import { buildAuthHeaders } from '@/utils/authToken';

import { mapApiIaMessages } from '../api-ia.mappers';
import { IMessageService } from './type';

const BACKEND = '/api/backend';

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');

async function call(method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(`${origin()}${BACKEND}${path}`, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
    headers: { ...buildAuthHeaders(), 'Content-Type': 'application/json' },
    method,
  });
  if (!res.ok) throw new Error(`[message/apiIa] ${method} ${path} → HTTP ${res.status}`);
  // 204/empty → null
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Persistencia de mensajes vía api-ia. Solo los métodos del flujo real de chat; el resto
 * lanza pending() para que NUNCA se active sin confirmar el endpoint.
 */
export class ApiIaMessageService implements IMessageService {
  private toDbSessionId = (sessionId: string | undefined) =>
    sessionId === INBOX_SESSION_ID ? null : sessionId;

  // ───────── LECTURA (GET /chat/messages confirmado por api-ia) ─────────
  getMessages: IMessageService['getMessages'] = async (sessionId, topicId) => {
    const dbSessionId = this.toDbSessionId(sessionId);
    // Guard: NO lanzar GET /chat/messages con ?sessionId= vacío → api-ia responde 400
    // (reporte 14-jun §0: "chat atascado en esqueletos" = bucle de 400 por sessionId vacío).
    // dbSessionId es null para INBOX (INBOX_SESSION_ID); el inbox NO se lee por esta ruta
    // (tiene su propia capa inbox-api). undefined/''/null → no hay sesión real que leer → [].
    if (dbSessionId === undefined || dbSessionId === null || dbSessionId === '') return [];
    const qs = new URLSearchParams({ sessionId: String(dbSessionId) });
    if (topicId) qs.set('topicId', topicId);
    const res = await call('GET', `/chat/messages?${qs.toString()}`);
    return mapApiIaMessages(res?.data ?? res?.messages ?? res) as UIChatMessage[];
  };

  getGroupMessages: IMessageService['getGroupMessages'] = async (groupId, topicId) => {
    // Guard: sin groupId no lanzar ?groupId= vacío.
    if (!groupId) return [];
    const qs = new URLSearchParams({ groupId });
    if (topicId) qs.set('topicId', topicId);
    const res = await call('GET', `/chat/messages?${qs.toString()}`);
    return mapApiIaMessages(res?.data ?? res?.messages ?? res) as UIChatMessage[];
  };

  // ───────── ESCRITURA vía api-ia (endpoints por confirmar) ─────────
  // POST /chat/messages — crear. body confirmado: {sessionId, role, content, type?}.
  // Devuelve {success, data:{id,...}}. toDbSessionId mapea INBOX_SESSION_ID → null (no revertir).
  createMessage: IMessageService['createMessage'] = async ({ sessionId, ...params }) => {
    const res = await call('POST', '/chat/messages', {
      // campos extra del flujo (parentId, topicId, etc.) van también — api-ia ignora los no usados.
      // ...params PRIMERO para que los campos explícitos de abajo NO sean sobreescritos (TS2783).
      ...params,
      content: (params as any).content,
      // CONTRATO role (api-ia 2026-06-03): front↔api-ia en MINÚSCULAS ('user'/'assistant').
      // api-ia uppercasea antes de api-mcp (cuya comparación es role==='ASSISTANT' para facturar).
      // NO cambiar a mayúsculas aquí — romperías el doble-uppercase y la facturación. [[contrato]]
      role: String((params as any).role),
      sessionId: this.toDbSessionId(sessionId),
      type: (params as any).type,
    });
    const d = res?.data ?? res;
    const id = d?.id ?? d?._id ?? d?.messageId;
    if (!id) throw new Error('[message/apiIa] createMessage: respuesta sin id');
    return id as string;
  };

  updateMessage: IMessageService['updateMessage'] = async (id, value) =>
    call('PATCH', `/chat/messages/${encodeURIComponent(id)}`, value);

  updateMessageError: IMessageService['updateMessageError'] = async (id, error) =>
    this.updateMessage(id, { error } as any);

  // DELETE /chat/messages/{id}?reason=X (reason opcional, confirmado por api-ia).
  removeMessage: IMessageService['removeMessage'] = async (id) =>
    call('DELETE', `/chat/messages/${encodeURIComponent(id)}?reason=user_delete`);

  // ───────── pending: métodos raros — confirmar endpoint antes de activar ─────────
  private pending(method: string): never {
    throw new Error(
      `[message/apiIa] ${method}: endpoint api-ia no confirmado. NO activar este service ` +
        `sin que api-ia exponga la ruta. Usar ServerService (tRPC) por ahora.`,
    );
  }

  createNewMessage: IMessageService['createNewMessage'] = async () => this.pending('createNewMessage');
  batchCreateMessages: IMessageService['batchCreateMessages'] = async () => this.pending('batchCreateMessages');
  updateMessageTTS: IMessageService['updateMessageTTS'] = async () => this.pending('updateMessageTTS');
  updateMessageTranslate: IMessageService['updateMessageTranslate'] = async () => this.pending('updateMessageTranslate');
  updateMessagePluginState: IMessageService['updateMessagePluginState'] = async () => this.pending('updateMessagePluginState');
  updateMessagePluginError: IMessageService['updateMessagePluginError'] = async () => this.pending('updateMessagePluginError');
  updateMessagePluginArguments: IMessageService['updateMessagePluginArguments'] = async () => this.pending('updateMessagePluginArguments');
  updateMessageRAG: IMessageService['updateMessageRAG'] = async () => this.pending('updateMessageRAG');
  getAllMessages: IMessageService['getAllMessages'] = async () => this.pending('getAllMessages');
  getAllMessagesInSession: IMessageService['getAllMessagesInSession'] = async () => this.pending('getAllMessagesInSession');
  countMessages: IMessageService['countMessages'] = async () => this.pending('countMessages');
  countWords: IMessageService['countWords'] = async () => this.pending('countWords');
  rankModels: IMessageService['rankModels'] = async () => this.pending('rankModels');
  getHeatmaps: IMessageService['getHeatmaps'] = async () => this.pending('getHeatmaps');
  removeMessages: IMessageService['removeMessages'] = async () => this.pending('removeMessages');
  removeMessagesByAssistant: IMessageService['removeMessagesByAssistant'] = async () => this.pending('removeMessagesByAssistant');
  removeMessagesByGroup: IMessageService['removeMessagesByGroup'] = async () => this.pending('removeMessagesByGroup');
  removeAllMessages: IMessageService['removeAllMessages'] = async () => this.pending('removeAllMessages');
  hasMessages: IMessageService['hasMessages'] = async () => this.pending('hasMessages');
  messageCountToCheckTrace: IMessageService['messageCountToCheckTrace'] = async () =>
    this.pending('messageCountToCheckTrace');
}
