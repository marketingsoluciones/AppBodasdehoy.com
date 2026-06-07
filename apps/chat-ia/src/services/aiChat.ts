import { SendMessageServerParams, StructureOutputParams } from '@lobechat/types';
import { cleanObject } from '@lobechat/utils';

import { lambdaClient } from '@/libs/trpc/client';
import { createXorKeyVaultsPayload } from '@/services/_auth';

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
  sendMessageInServer = async (
    params: SendMessageServerParams,
    abortController: AbortController,
  ) => {
    return lambdaClient.aiChat.sendMessageInServer.mutate(cleanObject(params), {
      context: { showNotification: false },
      signal: abortController?.signal,
    });
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
