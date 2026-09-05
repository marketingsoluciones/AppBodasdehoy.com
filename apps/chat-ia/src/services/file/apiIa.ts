import { CheckFileHashResult, FileItem, QueryFileListParams, UploadFileParams } from '@/types/files';

import { IFileService } from './type';

// CAPA 2 PASO C 2026-06-05: file usa endpoints REST de api-ia:
// - GET    /api/files/list                    → getFiles + getFile (filtrar id en cliente)
// - GET    /api/storage/files/{id}            → getFileItem (metadata completa)
// - POST   /api/files/upload                  → createFile (multipart)
// - DELETE /api/storage/files/{id}            → removeFile
// - DELETE /api/files/{id}                    → fallback removeFile (mismo efecto)
//
// 3 métodos sin endpoint directo en api-ia (stubs documentados):
// - checkFileHash(hash)        → siempre devuelve { isExist: false } (dedupe del lado server)
// - removeAllFiles()           → batch DELETE iterando getFiles, throw si fallo
// - removeFileAsyncTask(id, t) → no-op (tasks asíncronos manejados internamente por api-mcp)

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

function lastSegment(s: string): string | undefined {
  return s.split('/').findLast(Boolean);
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const { idToken, development, userId } = getCtx();
  const headers: Record<string, string> = {
    'X-Development': development,
    ...extra,
  };
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
  if (userId) headers['X-User-ID'] = userId;
  return headers;
}

interface FileListResponse {
  files?: Array<Record<string, any>>;
  results?: Array<Record<string, any>>;
  total?: number;
}

function normalizeFile(raw: Record<string, any>): FileItem {
  return {
    chunkCount: raw.chunk_count ?? raw.chunkCount,
    chunkTaskId: raw.chunk_task_id ?? raw.chunkTaskId ?? null,
    createdAt: raw.created_at ? new Date(raw.created_at) : raw.createdAt ?? new Date(),
    embeddingTaskId: raw.embedding_task_id ?? raw.embeddingTaskId ?? null,
    fileType: raw.file_type ?? raw.fileType ?? raw.mime_type ?? raw.contentType ?? 'application/octet-stream',
    id: raw.id ?? raw._id ?? raw.file_id,
    name: raw.name ?? raw.filename ?? raw.original_name ?? '',
    size: raw.size ?? raw.file_size ?? 0,
    type: raw.file_type ?? raw.fileType ?? raw.mime_type ?? 'application/octet-stream',
    updatedAt: raw.updated_at ? new Date(raw.updated_at) : raw.updatedAt ?? new Date(),
    url: raw.url ?? raw.public_url ?? raw.publicUrl ?? '',
  } as FileItem;
}

export class ApiIaFileService implements IFileService {
  createFile = async (
    params: UploadFileParams,
    knowledgeBaseId?: string,
  ): Promise<{ id: string; url: string }> => {
    // CAPA 2 PASO C: el binario lo sube uploadService a R2; aquí registramos la
    // metadata en api-ia vía POST /storage/register-metadata (verificado 2026-06-13:
    // body {url, filename, user_id, development} obligatorios url+filename → 200 con
    // {success, file_id, indexed_chunks, message}). api-ia indexa el archivo en el KB (RAG).
    const { development, userId } = getCtx();
    const url = params.url || '';
    const filename = params.name || lastSegment(url) || 'file';

    const body: Record<string, any> = { development, filename, url };
    if (userId) body.user_id = userId;
    if (knowledgeBaseId) body.kb_id = knowledgeBaseId;

    const fallbackId = () => lastSegment(url) || crypto.randomUUID();

    try {
      const res = await fetch(
        `${API_IA_BASE}/storage/register-metadata?development=${encodeURIComponent(development)}`,
        { body: JSON.stringify(body), headers: authHeaders(), method: 'POST' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        // El binario ya está en R2; no rompemos el flujo si la indexación falla.
        console.warn('[ApiIaFileService.createFile] register-metadata failed', json?.error || res.status);
        return { id: fallbackId(), url };
      }
      return { id: json.file_id || json.id || fallbackId(), url: json.url || url };
    } catch (err) {
      console.warn('[ApiIaFileService.createFile] register-metadata error', err);
      return { id: fallbackId(), url };
    }
  };

  getFile = async (id: string): Promise<FileItem> => {
    const { development, userId } = getCtx();
    const qs = new URLSearchParams();
    if (development) qs.set('development', development);
    if (userId) qs.set('user_id', userId);

    const res = await fetch(
      `${API_IA_BASE}/api/storage/files/${encodeURIComponent(id)}/metadata?${qs.toString()}`,
      { headers: authHeaders(), method: 'GET' },
    );
    if (!res.ok) throw new Error('file not found');
    const json = await res.json();
    return normalizeFile(json);
  };

  getFileItem = async (id: string) => {
    return this.getFile(id);
  };

  getFiles = async (params: QueryFileListParams) => {
    const { development, userId } = getCtx();
    const qs = new URLSearchParams();
    if (development) qs.set('development', development);
    if (userId) qs.set('user_id', userId);
    if (params.q) qs.set('q', params.q);
    if (params.category) qs.set('category', params.category);

    const res = await fetch(`${API_IA_BASE}/api/files/list?${qs.toString()}`, {
      headers: authHeaders(),
      method: 'GET',
    });
    if (!res.ok) return [] as FileItem[];
    const json: FileListResponse = await res.json();
    const list = json.files ?? json.results ?? [];
    return list.map(normalizeFile);
  };

  removeFile = async (id: string): Promise<void> => {
    const { development, userId } = getCtx();
    const qs = new URLSearchParams();
    if (development) qs.set('development', development);
    if (userId) qs.set('user_id', userId);

    await fetch(`${API_IA_BASE}/api/storage/files/${encodeURIComponent(id)}?${qs.toString()}`, {
      headers: authHeaders(),
      method: 'DELETE',
    });
  };

  removeFiles = async (ids: string[]): Promise<void> => {
    // api-ia no tiene batch DELETE — iteramos. Si falla alguno, registra y sigue.
    await Promise.all(
      ids.map((id) =>
        this.removeFile(id).catch((err) => {
          console.warn('[ApiIaFileService.removeFiles] failed for id', id, err);
        }),
      ),
    );
  };

  // ─── Sin endpoint api-ia equivalente — stubs documentados ─────────────

  checkFileHash = async (_hash: string): Promise<CheckFileHashResult> => {
    // TODO api-ia: ¿endpoint para dedupe por hash? Mientras, no dedupea.
    return { isExist: false } as CheckFileHashResult;
  };

  removeAllFiles = async (): Promise<any> => {
    // Best-effort: lista y borra. Si list devuelve mucho, paginado.
    const files = await this.getFiles({} as QueryFileListParams);
    await this.removeFiles(files.map((f) => f.id));
  };

  removeFileAsyncTask = async (_id: string, _type: 'embedding' | 'chunk'): Promise<any> => {
    // TODO api-ia: ¿endpoint para cancelar tasks asíncronos? api-mcp puede manejar internamente.
    return;
  };
}
