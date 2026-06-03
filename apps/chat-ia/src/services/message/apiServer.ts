/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * 🚧 ESQUELETO (Opción A / Fase 1.1) — implementación de IMessageService vía GraphQL a api-mcp,
 * en sustitución del tRPC de LobeChat (ServerService → lambdaClient → drizzle/pglite).
 *
 * Objetivo: desacoplar chat-ia de la BD/infra de LobeChat. Ver docs/PLAN-OPCION-A-FASE1-DETALLE.md.
 *
 * ESTADO: api-mcp (resolver src/graphql/resolvers/lobe-chat.ts) YA cubre LECTURA
 * (getMessages/updateMessage/deleteMessage). Las mutations de ESCRITURA (createMessage, etc.)
 * están ESCALADAS a BACKEND. Mientras no existan, NO activar este service (el index.ts sigue
 * usando ServerService/tRPC). Cuando BACKEND entregue, rellenar los métodos marcados con
 * 🔴 BACKEND-PENDIENTE y cambiar el switch en index.ts.
 *
 * Patrón GraphQL: usar apolloClient de @/libs/graphql/client (apunta a api-mcp, auth mcp_jwt +
 * X-Development ya inyectados). Ver ejemplos en store/chat/slices/externalChat/action.ts.
 */
import { UIChatMessage } from '@lobechat/types';
import { gql } from '@apollo/client';

import { INBOX_SESSION_ID } from '@/const/session';
import { apolloClient } from '@/libs/graphql/client';

import { IMessageService } from './type';

// ─── GraphQL ops (rellenar con el shape REAL del resolver lobe-chat de api-mcp) ───
const GET_MESSAGES = gql`
  query GetMessages($sessionId: String, $topicId: String, $groupId: String) {
    getMessages(sessionId: $sessionId, topicId: $topicId, groupId: $groupId) {
      # TODO: confirmar campos exactos del resolver lobe-chat (id, role, content, createdAt, ...)
      id
      role
      content
      sessionId
      topicId
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_MESSAGE = gql`
  mutation UpdateMessage($id: String!, $value: JSON!) {
    updateMessage(id: $id, value: $value)
  }
`;

const DELETE_MESSAGE = gql`
  mutation DeleteMessage($id: String!) {
    deleteMessage(id: $id)
  }
`;

// 🔴 BACKEND-PENDIENTE: createMessage, createNewMessage, batchCreateMessages,
//    updateMessageTTS/Translate/PluginState/PluginError/PluginArguments/RAG no existen aún
//    en el resolver lobe-chat de api-mcp. Definir gql cuando BACKEND los añada.

export class ApiServerService implements IMessageService {
  private toDbSessionId = (sessionId: string | undefined) =>
    sessionId === INBOX_SESSION_ID ? null : sessionId;

  // ───────── LECTURA (api-mcp YA lo cubre) ─────────
  getMessages: IMessageService['getMessages'] = async (sessionId, topicId, groupId) => {
    const { data } = await apolloClient.query<any>({
      fetchPolicy: 'no-cache',
      query: GET_MESSAGES,
      variables: { groupId, sessionId: this.toDbSessionId(sessionId), topicId },
    });
    return (data?.getMessages ?? []) as UIChatMessage[];
  };

  getGroupMessages: IMessageService['getGroupMessages'] = async (groupId, topicId) => {
    const { data } = await apolloClient.query<any>({
      fetchPolicy: 'no-cache',
      query: GET_MESSAGES,
      variables: { groupId, topicId },
    });
    return (data?.getMessages ?? []) as UIChatMessage[];
  };

  updateMessage: IMessageService['updateMessage'] = async (id, value) => {
    const { data } = await apolloClient.mutate<any>({
      mutation: UPDATE_MESSAGE,
      variables: { id, value },
    });
    return data?.updateMessage;
  };

  updateMessageError: IMessageService['updateMessageError'] = async (id, error) =>
    this.updateMessage(id, { error } as any);

  removeMessage: IMessageService['removeMessage'] = async (id) => {
    const { data } = await apolloClient.mutate<any>({
      mutation: DELETE_MESSAGE,
      variables: { id },
    });
    return data?.deleteMessage;
  };

  // ───────── 🔴 ESCRITURA (BACKEND-PENDIENTE — escalado, ver doc Fase 1) ─────────
  // Lanzan error explícito para que NUNCA se active este service sin que BACKEND entregue.
  private pending(method: string): never {
    throw new Error(
      `[message/apiServer] ${method} no disponible: api-mcp aún no expone esta mutation. ` +
        `Pendiente BACKEND (ver docs/PLAN-OPCION-A-FASE1-DETALLE.md). Usar ServerService (tRPC) por ahora.`,
    );
  }

  createMessage: IMessageService['createMessage'] = async () => this.pending('createMessage');
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
