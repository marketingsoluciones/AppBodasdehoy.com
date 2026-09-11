import { SemanticSearchSchemaType } from '@/types/rag';

// CAPA 2 PASO C 2026-06-05: RAG vía api-ia REST. Estado verificado 2026-06-11 (Qdrant):
//   ✅ POST /webapi/files/parse        → parseFileContent / createParseFileTask / retryParseFile
//   ✅ POST /api/lobechat-kb/search    → semanticSearch / semanticSearchForChat (smoke OK, score 0.74)
//   ✅ POST /api/lobechat-kb/batch-embed-file → createEmbeddingChunksTask (B1: api-ia trocea por file_id)
// Stubs:
//   deleteMessageRagQuery → no-op (api-mcp gestiona cleanup al borrar message)

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

async function apiPost(path: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_IA_BASE}${path}`, {
    body: JSON.stringify(body),
    headers: authHeaders(),
    method: 'POST',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`api-ia ${path} HTTP ${res.status}: ${text}`);
  }
  return res.json().catch(() => null);
}

class RAGService {
  parseFileContent = async (id: string, skipExist?: boolean) => {
    return apiPost('/webapi/files/parse', { file_id: id, skip_exist: skipExist });
  };

  createParseFileTask = async (id: string, skipExist?: boolean) => {
    return apiPost('/webapi/files/parse', { create_task: true, file_id: id, skip_exist: skipExist });
  };

  retryParseFile = async (id: string) => {
    return apiPost('/webapi/files/parse', { file_id: id, retry: true, skip_exist: false });
  };

  // ✅ B1 cableado 2026-06-11 — api-ia resolvió con /batch-embed-file (smoke OK: success, total_chunks).
  // El front dispara por file_id; api-ia descarga (R2) + parsea + trocea + vectoriza. NO troceamos aquí.
  // Schema EmbedFileRequest: {file_id*, user_id*, file_url?, text?, filename?, metadata?}.
  createEmbeddingChunksTask = async (id: string) => {
    const { userId } = getCtx();
    if (!userId) throw new Error('createEmbeddingChunksTask requires userId');
    return apiPost('/api/lobechat-kb/batch-embed-file', { file_id: id, user_id: userId });
  };

  semanticSearch = async (query: string, fileIds?: string[]) => {
    const { userId } = getCtx();
    return apiPost('/api/lobechat-kb/search', {
      file_ids: fileIds,
      limit: 5,
      min_score: 0.5,
      query,
      user_id: userId || '',
    });
  };

  semanticSearchForChat = async (params: SemanticSearchSchemaType) => {
    const { userId } = getCtx();
    return apiPost('/api/lobechat-kb/search', {
      file_ids: params.fileIds,
      knowledge_ids: params.knowledgeIds,
      limit: 8,
      message_id: params.messageId,
      min_score: 0.5,
      query: params.rewriteQuery || params.userQuery,
      user_id: userId || '',
    });
  };

  deleteMessageRagQuery = async (_id: string) => {
    return;
  };
}

export const ragService = new RAGService();
