import {
  SendMessageServerParams,
  SendMessageServerResponse,
  StructureOutputParams,
} from '@lobechat/types';

import { createXorKeyVaultsPayload } from '@/services/_auth';
import { messageService } from '@/services/message';
import { topicService } from '@/services/topic';

const API_IA_BASE = process.env.NEXT_PUBLIC_API_IA_URL || 'https://api-ia.bodasdehoy.com';

function getApiIaCtx(): { development: string; idToken?: string; userId?: string } {
  if (typeof window === 'undefined') {
    return { development: process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy' };
  }
  try {
    const raw = localStorage.getItem('dev-user-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        development: parsed?.development || process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy',
        idToken: parsed?.token,
        userId: parsed?.userId,
      };
    }
  } catch {
    // ignore
  }
  return { development: process.env.NEXT_PUBLIC_DEVELOPMENT || 'bodasdehoy' };
}

function apiIaHeaders(): Record<string, string> {
  const { idToken, development, userId } = getApiIaCtx();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Development': development,
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (userId) headers['X-User-ID'] = userId;
  return headers;
}

class AiChatService {
  /**
   * PERSISTENCIA 5+6 (24-jul) — CABLEADO, PENDIENTE de confirmación api-ia + test.
   *
   * Antes: lambdaClient.aiChat.sendMessageInServer (tRPC) → AiChatService(ctx.serverDB)
   * → Neon (MUERTO) → 500. Verificado en Mongo: chat_messages tuvo su ÚLTIMO doc el
   * 2026-06-03 y 0 nuevos desde el 4-jun (día de PASO C). El guardado real vive en
   * api-mcp Mongo (colección chat_messages), alcanzable por messageService/topicService
   * (api-ia REST /chat/messages · /chat/topics), que YA funcionan (READ) desde PASO C.
   *
   * Aquí reimplementamos el SEND por esos services (termina la migración Neon→api-ia,
   * sin fallback). Devuelve el MISMO shape que el tRPC para no tocar el store.
   *
   * ⚠️ NO desplegar hasta: (1) api-ia confirme el contrato POST /chat/messages para el
   * par user+assistant (campos fromModel/fromProvider, sessionId), (2) api-ia soporte
   * mover `newTopic.topicMessageIds` al topic nuevo (el tRPC lo hacía server-side),
   * (3) test controlado: contar chat_messages antes/después de un envío real.
   */
  sendMessageInServer = async (
    params: SendMessageServerParams,
    _abortController: AbortController,
  ): Promise<SendMessageServerResponse> => {
    // La firma mantiene abortController por compat; api-ia (fetch REST) no lo aborta aquí.
    void _abortController;
    const sessionId = params.sessionId;

    // 1) Topic: crear si viene newTopic; si no, usar el activo.
    let topicId = params.topicId;
    let isCreateNewTopic = false;
    if (params.newTopic) {
      topicId = await topicService.createTopic({
        sessionId,
        title: params.newTopic.title,
        // TODO api-ia: mover params.newTopic.topicMessageIds al topic nuevo (server-side antes).
      } as any);
      isCreateNewTopic = true;
    }

    // 2) Mensaje de usuario.
    const userMessageId = await messageService.createMessage({
      content: params.newUserMessage.content,
      files: params.newUserMessage.files,
      role: 'user',
      sessionId,
      topicId,
    } as any);

    // 3) Mensaje de asistente (placeholder; el streaming rellena el contenido).
    const assistantMessageId = await messageService.createMessage({
      content: '',
      fromModel: params.newAssistantMessage.model,
      fromProvider: params.newAssistantMessage.provider,
      role: 'assistant',
      sessionId,
      topicId,
    } as any);

    // 4) Refetch listas para el store (mismo shape que devolvía el tRPC).
    const messages = await messageService.getMessages(sessionId ?? '', topicId);
    const topics = await topicService.getTopics({ sessionId } as any).catch(() => undefined);

    return {
      assistantMessageId,
      isCreateNewTopic,
      messages,
      topicId: topicId ?? '',
      topics: topics as any,
      userMessageId,
    };
  };

  generateJSON = async (
    params: Omit<StructureOutputParams, 'keyVaultsPayload'>,
    abortController: AbortController,
  ) => {
    const { messages, model, provider, schema, systemRole, tools } = params;

    const body: Record<string, unknown> = {
      messages: systemRole
        ? [{ content: systemRole, role: 'system' }, ...messages]
        : messages,
      model,
      provider,
    };
    if (schema) body.schema = schema;
    if (tools) body.tools = tools;

    const res = await fetch(`${API_IA_BASE}/chat/structured`, {
      body: JSON.stringify(body),
      headers: apiIaHeaders(),
      method: 'POST',
      signal: abortController?.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`[/chat/structured] HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    if (json?.success === false) {
      const msg = json?.errors?.[0]?.message || 'structured request failed';
      throw new Error(`[/chat/structured] ${msg}`);
    }
    return json?.data;
  };

  // sendGroupMessageInServer = async (params: SendMessageServerParams) => {
  //   return lambdaClient.aiChat.sendGroupMessageInServer.mutate(cleanObject(params));
  // };
}

// createXorKeyVaultsPayload no se usa en /chat/structured (api-ia resuelve key del whitelabel)
void createXorKeyVaultsPayload;

export const aiChatService = new AiChatService();
