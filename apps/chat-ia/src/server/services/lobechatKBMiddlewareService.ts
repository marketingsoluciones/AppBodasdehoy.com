/**
 * LobeChat KB Middleware Service (Server-side)
 * =============================================
 * 
 * Servicio del lado del servidor para integrar LobeChat KB con el middleware.
 * Usa el middleware para generar embeddings y buscar en lugar de PostgreSQL.
 * 
 * IMPORTANTE: Este servicio se usa en el servidor (Next.js API routes),
 * no en el cliente. Para el cliente, usar lobechatKBMiddleware.ts
 */

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';

const BACKEND_URL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';

export interface MiddlewareEmbedRequest {
  file_id: string;
  metadata?: Record<string, any>;
  text: string;
  user_id: string;
}

export interface MiddlewareEmbedResponse {
  dimensions: number;
  embedding_id: string;
  message: string;
  success: boolean;
}

export interface MiddlewareSearchRequest {
  limit?: number;
  min_score?: number;
  query: string;
  user_id: string;
}

export interface MiddlewareSearchResult {
  id: string;
  metadata: Record<string, any>;
  score: number;
  text_content: string;
}

export interface MiddlewareSearchResponse {
  query_embedding_dimensions: number;
  results: MiddlewareSearchResult[];
  success: boolean;
  total: number;
}

/**
 * Verifica si el middleware está disponible y configurado.
 * 
 * @returns True si se debe usar middleware, False si usar PostgreSQL
 */
export async function shouldUseMiddleware(): Promise<boolean> {
  // Verificar variable de entorno
  const useMiddleware = process.env.USE_MIDDLEWARE_FOR_LOBECHAT_KB;
  if (useMiddleware === 'false' || useMiddleware === '0') {
    return false;
  }
  if (useMiddleware === 'true' || useMiddleware === '1') {
    return true;
  }

  // Por defecto: verificar si el middleware responde
  try {
    const response = await fetch(`${BACKEND_URL}/api/lobechat-kb/search`, {
      body: JSON.stringify({
        limit: 1,
        query: 'test',
        user_id: 'test',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(3000), // 3 segundos timeout
    });

    // Si responde (aunque sea error de validación), el endpoint existe
    return response.status !== 404;
  } catch {
    return false;
  }
}

/**
 * Genera embedding para un chunk usando el middleware.
 * 
 * @param text - Texto del chunk
 * @param userId - ID del usuario
 * @param fileId - ID del archivo
 * @param chunkId - ID del chunk (opcional, para metadata)
 * @returns Embedding ID del middleware
 */
export async function generateEmbeddingViaMiddleware(
  text: string,
  userId: string,
  fileId: string,
  chunkId?: string
): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/lobechat-kb/embed`, {
      body: JSON.stringify({
        file_id: fileId,
        metadata: {
          chunk_id: chunkId,
          source: 'lobechat',
        },
        text,
        user_id: userId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data: MiddlewareEmbedResponse = await response.json();
    return data.embedding_id;
  } catch (error) {
    console.error('❌ Error generando embedding via middleware:', error);
    throw error;
  }
}

/**
 * Genera embeddings en lote usando el middleware.
 * 
 * @param texts - Array de textos de chunks
 * @param userId - ID del usuario
 * @param fileId - ID del archivo
 * @param chunkIds - Array de IDs de chunks (opcional)
 * @returns Array de embedding IDs
 */
export async function batchGenerateEmbeddingsViaMiddleware(
  texts: string[],
  userId: string,
  fileId: string,
  chunkIds?: string[]
): Promise<string[]> {
  try {
    const requests = texts.map((text, index) => ({
      file_id: `${fileId}_chunk_${index}`,
      metadata: {
        chunk_id: chunkIds?.[index],
        chunk_index: index,
        source: 'lobechat',
      },
      text,
      user_id: userId,
    }));

    const response = await fetch(`${BACKEND_URL}/api/lobechat-kb/batch-embed`, {
      body: JSON.stringify(requests),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Retornar embedding IDs en el mismo orden
    return data.results.map((r: any) => r.embedding_id);
  } catch (error) {
    console.error('❌ Error en batch embed via middleware:', error);
    throw error;
  }
}

/**
 * Busca en el Knowledge Base de LobeChat usando el middleware.
 * 
 * @param query - Texto de búsqueda
 * @param userId - ID del usuario
 * @param fileIds - IDs de archivos a buscar (opcional, filtra por file_id en metadata)
 * @param limit - Número máximo de resultados
 * @returns Resultados de búsqueda
 */
export async function searchViaMiddleware(
  query: string,
  userId: string,
  fileIds?: string[],
  limit: number = 10
): Promise<MiddlewareSearchResult[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/lobechat-kb/search`, {
      body: JSON.stringify({
        limit: limit * 2,
        // Buscar más para filtrar después
min_score: 0.5,
        
query, 
        user_id: userId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const data: MiddlewareSearchResponse = await response.json();
    
    // Filtrar por fileIds si se proporcionan
    let results = data.results;
    if (fileIds && fileIds.length > 0) {
      results = results.filter((r) => {
        const fileId = r.metadata?.file_id;
        if (!fileId) return false;
        // El file_id en metadata puede ser "fileId_chunk_0", extraer el fileId base
        const baseFileId = fileId.split('_chunk_')[0];
        return fileIds.includes(baseFileId);
      });
    }
    
    // Limitar resultados
    return results.slice(0, limit);
  } catch (error) {
    console.error('❌ Error buscando via middleware:', error);
    throw error;
  }
}

/**
 * Elimina embeddings de un archivo usando el middleware.
 * 
 * @param userId - ID del usuario
 * @param fileId - ID del archivo
 */
export async function deleteEmbeddingsViaMiddleware(
  userId: string,
  fileId: string
): Promise<void> {
  try {
    // El middleware usa un patrón de file_id, necesitamos eliminar todos los chunks
    // Por ahora, eliminamos el patrón base (el middleware puede necesitar un endpoint mejor)
    const response = await fetch(
      `${BACKEND_URL}/api/lobechat-kb/embed/${encodeURIComponent(userId)}/${encodeURIComponent(fileId)}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Error eliminando embeddings via middleware:', error);
    // No lanzar error, puede que no existan embeddings
  }
}






































