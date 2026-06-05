import { CreateMessageParams } from '@lobechat/types';

import { CreateThreadParams, ThreadItem, ThreadStatus, ThreadType } from '@/types/topic';

import { IThreadService } from './type';

// CAPA 2 PASO C 2026-06-05: ApiIaThreadService — proxy a los 6 endpoints REST que
// api-ia expondrá (proxy a api-mcp). Contrato confirmado por backend con 4 ajustes:
//   [1] enum type:   continuation/standalone (front MINÚSCULAS, api-mcp MAYÚSCULAS)
//   [2] enum status: active/archived/deprecated (idem casing)
//   [3] message: usa SendMessageInput existente
//   [4] type/status: enums GraphQL tipados, no String!
//
// Patrón uppercase/lowercase IDÉNTICO al de role (memory/project_contrato_role_chat_persistencia.md):
//   front ↔ api-ia      → MINÚSCULAS
//   api-ia ↔ api-mcp    → MAYÚSCULAS (api-ia hace la transformación)
//
// Endpoints REST esperados (api-ia los expone tras Fase 4):
//   GET    /chat/topics/{topic_id}/threads
//   POST   /chat/topics/{topic_id}/threads
//   PATCH  /chat/threads/{thread_id}
//   DELETE /chat/threads/{thread_id}?removeChildren=true|false
//   POST   /chat/topics/{topic_id}/threads/with-message
//   DELETE /chat/topics/{topic_id}/threads

interface CreateThreadWithMessageParams extends CreateThreadParams {
  message: CreateMessageParams;
}

const API_IA_BASE = process.env.NEXT_PUBLIC_API_IA_URL || 'http://localhost:8080';

function getCtx(): { development: string; idToken?: string; userId?: string } {
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

function authHeaders(): Record<string, string> {
  const { idToken, development, userId } = getCtx();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Development': development,
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (userId) headers['X-User-ID'] = userId;
  return headers;
}

function normalizeThread(raw: Record<string, any>): ThreadItem {
  return {
    createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
    id: raw.id ?? raw._id,
    lastActiveAt: raw.lastActiveAt ? new Date(raw.lastActiveAt) : new Date(),
    parentThreadId: raw.parentThreadId ?? undefined,
    sourceMessageId: raw.sourceMessageId,
    status: (raw.status ?? 'active') as ThreadStatus,
    title: raw.title ?? '',
    topicId: raw.topicId,
    type: (raw.type ?? 'continuation') as ThreadType,
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
    userId: raw.userId,
  };
}

export class ApiIaThreadService implements IThreadService {
  getThreads = async (topicId: string): Promise<ThreadItem[]> => {
    const res = await fetch(`${API_IA_BASE}/chat/topics/${encodeURIComponent(topicId)}/threads`, {
      headers: authHeaders(),
      method: 'GET',
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    const list = Array.isArray(json) ? json : json?.threads || json?.data || [];
    return list.map(normalizeThread);
  };

  createThreadWithMessage = async ({
    message,
    ...params
  }: CreateThreadWithMessageParams): Promise<{ messageId: string; threadId: string }> => {
    const res = await fetch(
      `${API_IA_BASE}/chat/topics/${encodeURIComponent(params.topicId)}/threads/with-message`,
      {
        body: JSON.stringify({
          message,
          parentThreadId: params.parentThreadId,
          sourceMessageId: params.sourceMessageId,
          title: params.title,
          type: params.type,
        }),
        headers: authHeaders(),
        method: 'POST',
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`createThreadWithMessage failed: HTTP ${res.status} ${text}`);
    }
    const json = await res.json();
    return {
      messageId: json.messageId ?? json.message_id ?? '',
      threadId: json.threadId ?? json.thread_id ?? '',
    };
  };

  updateThread = async (id: string, data: Partial<ThreadItem>): Promise<any> => {
    const body: Record<string, any> = {};
    if (data.title !== undefined) body.title = data.title;
    if (data.type !== undefined) body.type = data.type;
    if (data.status !== undefined) body.status = data.status;
    if (data.parentThreadId !== undefined) body.parentThreadId = data.parentThreadId;

    const res = await fetch(`${API_IA_BASE}/chat/threads/${encodeURIComponent(id)}`, {
      body: JSON.stringify(body),
      headers: authHeaders(),
      method: 'PATCH',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`updateThread failed: HTTP ${res.status} ${text}`);
    }
    return res.json().catch(() => null);
  };

  removeThread = async (id: string): Promise<any> => {
    const res = await fetch(
      `${API_IA_BASE}/chat/threads/${encodeURIComponent(id)}?removeChildren=true`,
      { headers: authHeaders(), method: 'DELETE' },
    );
    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => '');
      throw new Error(`removeThread failed: HTTP ${res.status} ${text}`);
    }
    return { success: true };
  };
}
