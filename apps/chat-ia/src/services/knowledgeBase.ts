import { CreateKnowledgeBaseParams } from '@/types/knowledgeBase';

// CAPA 2 PASO C 2026-06-05 — opción (c) según api-ia (msg 07:50, 08:47, 09:40):
//
//   userConfig.knowledgeBases[] = [{ id, name, fileIds[] }]
//
//   Solo guarda la AGRUPACIÓN (qué fileIds forman cada KB). Los archivos viven en
//   R2 vía /storage/upload y embedding/search via /api/lobechat-kb/*.
//   No hay tabla user_knowledge_bases en backend.
//
//   Si en el futuro se necesita KB COMPARTIDA entre usuarios → ticket api-mcp,
//   pero NO en CAPA 2.

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
  } catch { /* ignore */ }
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

interface UserConfigKB {
  id: string;
  name: string;
  description?: string;
  fileIds: string[];
  createdAt?: string;
}

async function loadKBs(): Promise<UserConfigKB[]> {
  const { userId } = getCtx();
  if (!userId) return [];
  try {
    const res = await fetch(
      `${API_IA_BASE}/api/auth/get-user-config?user_id=${encodeURIComponent(userId)}`,
      { headers: authHeaders(), method: 'GET' },
    );
    if (!res.ok) return [];
    const json = await res.json().catch(() => null);
    const cfg = json?.config ?? json ?? {};
    return Array.isArray(cfg.knowledgeBases) ? cfg.knowledgeBases : [];
  } catch {
    return [];
  }
}

async function saveKBs(knowledgeBases: UserConfigKB[]): Promise<void> {
  const { userId, development } = getCtx();
  if (!userId) return;
  await fetch(`${API_IA_BASE}/api/auth/save-user-config`, {
    body: JSON.stringify({ config: { knowledgeBases }, development, user_id: userId }),
    headers: authHeaders(),
    method: 'POST',
  });
}

class KnowledgeBaseService {
  createKnowledgeBase = async (params: CreateKnowledgeBaseParams) => {
    const kbs = await loadKBs();
    const id = (params as any).id || `kb_${Date.now()}`;
    const newKB: UserConfigKB = {
      createdAt: new Date().toISOString(),
      description: (params as any).description ?? '',
      fileIds: [],
      id,
      name: params.name ?? '',
    };
    await saveKBs([...kbs, newKB]);
    return id;
  };

  getKnowledgeBaseList = async () => {
    return loadKBs();
  };

  getKnowledgeBaseById = async (id: string) => {
    const kbs = await loadKBs();
    return kbs.find((k) => k.id === id);
  };

  updateKnowledgeBaseList = async (id: string, value: any) => {
    const kbs = await loadKBs();
    const next = kbs.map((k) =>
      k.id === id
        ? { ...k, description: value.description ?? k.description, name: value.name ?? k.name }
        : k,
    );
    await saveKBs(next);
  };

  deleteKnowledgeBase = async (id: string) => {
    const kbs = await loadKBs();
    await saveKBs(kbs.filter((k) => k.id !== id));
  };

  addFilesToKnowledgeBase = async (knowledgeBaseId: string, ids: string[]) => {
    const kbs = await loadKBs();
    const next = kbs.map((k) => {
      if (k.id !== knowledgeBaseId) return k;
      const set = new Set([...k.fileIds, ...ids]);
      return { ...k, fileIds: [...set] };
    });
    await saveKBs(next);
  };

  removeFilesFromKnowledgeBase = async (knowledgeBaseId: string, ids: string[]) => {
    const kbs = await loadKBs();
    const remove = new Set(ids);
    const next = kbs.map((k) =>
      k.id !== knowledgeBaseId ? k : { ...k, fileIds: k.fileIds.filter((f) => !remove.has(f)) },
    );
    await saveKBs(next);
  };
}

export const knowledgeBaseService = new KnowledgeBaseService();
