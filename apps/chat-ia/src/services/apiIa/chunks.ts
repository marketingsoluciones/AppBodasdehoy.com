/**
 * CAPA 3 PASO C — cliente REST para GET /api/lobechat-kb/files/{id}/chunks de api-ia.
 *
 * Backend devuelve: { success, file_id, total, data: ChunkItem[], warning? }
 * API actual (tRPC) devuelve: useInfiniteQuery con { items, nextCursor }
 *
 * Adaptamos al hook useQuery (1 sola página, sin paginación cursor) ya que
 * el endpoint REST devuelve todos los chunks de una vez (limit 200 server-side).
 */
import { useQuery } from '@tanstack/react-query';

import { FileChunk } from '@lobechat/types';

const API_IA_BASE = process.env.NEXT_PUBLIC_API_IA_URL || 'https://api-ia.bodasdehoy.com';

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
    'X-Development': development,
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (userId) headers['X-User-ID'] = userId;
  return headers;
}

interface ApiIaChunkRaw {
  content: string;
  file_id: string;
  id: string;
  index: number;
  page?: number;
}

interface ApiIaChunksResponse {
  data: ApiIaChunkRaw[];
  file_id: string;
  success: boolean;
  total: number;
  warning?: string;
}

function toFileChunk(raw: ApiIaChunkRaw): FileChunk {
  const now = new Date();
  return {
    createdAt: now,
    id: raw.id,
    index: raw.index,
    metadata: raw.page ? ({ pageNumber: raw.page } as FileChunk['metadata']) : null,
    pageNumber: raw.page,
    text: raw.content,
    type: 'text',
    updatedAt: now,
  };
}

export async function fetchChunks(fileId: string): Promise<FileChunk[]> {
  const res = await fetch(
    `${API_IA_BASE}/api/lobechat-kb/files/${encodeURIComponent(fileId)}/chunks`,
    { headers: authHeaders(), method: 'GET' },
  );
  if (!res.ok) {
    throw new Error(`[/chunks] HTTP ${res.status}`);
  }
  const json: ApiIaChunksResponse = await res.json();
  return (json.data || []).map(toFileChunk);
}

/**
 * Hook que reemplaza lambdaQuery.chunk.getChunksByFileId.useInfiniteQuery.
 *
 * Mantiene la firma { data: { pages: [{ items, nextCursor }] }, isLoading,
 * fetchNextPage } para no romper consumers (ChunkList + PDF Renderer) que
 * usan `data?.pages.flatMap((page) => page.items)`.
 *
 * El endpoint REST devuelve todos los chunks de una vez (sin paginación cursor),
 * así que `pages` tiene siempre 1 entrada y `fetchNextPage` es no-op.
 */
export const useChunksByFileId = (fileId: string) => {
  const { data, isLoading, error } = useQuery({
    enabled: !!fileId,
    queryFn: () => fetchChunks(fileId),
    queryKey: ['chunks', fileId],
  });

  return {
    data: data
      ? {
          pages: [{ items: data, nextCursor: undefined as string | undefined }],
        }
      : undefined,
    error,
    fetchNextPage: () => {
      // no-op: endpoint REST devuelve todos los chunks de una vez
    },
    isLoading,
  };
};
