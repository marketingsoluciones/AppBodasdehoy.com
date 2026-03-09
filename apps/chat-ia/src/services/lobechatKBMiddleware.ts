/**
 * LobeChat KB Middleware Service
 * ===============================
 * 
 * Servicio para integrar LobeChat Knowledge Base con el middleware.
 * Usa Ollama (gratis) y ChromaDB en lugar de PostgreSQL + OpenAI.
 * 
 * Endpoints del middleware:
 * - POST /api/lobechat-kb/embed - Generar embedding
 * - POST /api/lobechat-kb/search - Buscar en KB
 * - DELETE /api/lobechat-kb/embed/{user_id}/{file_id} - Eliminar
 * - GET /api/lobechat-kb/stats/{user_id} - Estadísticas
 */

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';

const BACKEND_URL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';

export interface EmbedRequest {
  file_id: string;
  metadata?: Record<string, any>;
  text: string;
  user_id: string;
}

export interface EmbedResponse {
  dimensions: number;
  embedding_id: string;
  message: string;
  success: boolean;
}

export interface SearchRequest {
  limit?: number;
  min_score?: number;
  query: string;
  user_id: string;
}

export interface SearchResult {
  id: string;
  metadata: Record<string, any>;
  score: number;
  text_content: string;
}

export interface SearchResponse {
  query_embedding_dimensions: number;
  results: SearchResult[];
  success: boolean;
  total: number;
}

export interface BatchEmbedRequest {
  requests: EmbedRequest[];
}

export interface BatchEmbedResponse {
  errors: Array<{ error: string, file_id: string; }>;
  failed: number;
  results: Array<{ embedding_id: string; file_id: string; success: boolean }>;
  succeeded: number;
  success: boolean;
  total: number;
}

/**
 * Genera embedding para un archivo de LobeChat KB usando el middleware.
 * 
 * @param text - Texto del archivo a convertir en embedding
 * @param userId - ID del usuario de LobeChat
 * @param fileId - ID del archivo
 * @param metadata - Metadatos adicionales (opcional)
 * @returns Response con embedding_id
 */
export async function generateEmbeddingViaMiddleware(
  text: string,
  userId: string,
  fileId: string,
  metadata?: Record<string, any>
): Promise<EmbedResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/lobechat-kb/embed`, {
      body: JSON.stringify({
        file_id: fileId,
        metadata: metadata || {},
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

    const data: EmbedResponse = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error generando embedding via middleware:', error);
    throw error;
  }
}

/**
 * Busca en el Knowledge Base de LobeChat del usuario usando el middleware.
 * 
 * @param query - Texto de búsqueda
 * @param userId - ID del usuario (filtra resultados por usuario)
 * @param limit - Número máximo de resultados (default: 10)
 * @param minScore - Score mínimo de relevancia (default: 0.5)
 * @returns Response con resultados ordenados por relevancia
 */
export async function searchViaMiddleware(
  query: string,
  userId: string,
  limit: number = 10,
  minScore: number = 0.5
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/lobechat-kb/search`, {
      body: JSON.stringify({
        limit,
        min_score: minScore,
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

    const data: SearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error buscando via middleware:', error);
    throw error;
  }
}

/**
 * Elimina embedding de un archivo de LobeChat KB.
 * 
 * @param userId - ID del usuario
 * @param fileId - ID del archivo
 * @returns Success status
 */
export async function deleteEmbeddingViaMiddleware(
  userId: string,
  fileId: string
): Promise<{ message: string, success: boolean; }> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/lobechat-kb/embed/${encodeURIComponent(userId)}/${encodeURIComponent(fileId)}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error eliminando embedding via middleware:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas del Knowledge Base de LobeChat para un usuario.
 * 
 * @param userId - ID del usuario
 * @returns Estadísticas
 */
export async function getKBStatsViaMiddleware(
  userId: string
): Promise<{ collection_stats: any; message: string, success: boolean; user_id: string; }> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/lobechat-kb/stats/${encodeURIComponent(userId)}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas via middleware:', error);
    throw error;
  }
}

/**
 * Genera embeddings en lote para múltiples archivos.
 * Útil para indexar muchos archivos a la vez.
 * 
 * @param requests - Array de requests de embedding
 * @returns Response con resultados y errores
 */
export async function batchEmbedViaMiddleware(
  requests: EmbedRequest[]
): Promise<BatchEmbedResponse> {
  try {
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

    return await response.json();
  } catch (error) {
    console.error('❌ Error en batch embed via middleware:', error);
    throw error;
  }
}

/**
 * Verifica si el middleware está disponible y funcionando.
 * 
 * @returns True si el middleware responde correctamente
 */
export async function checkMiddlewareAvailability(): Promise<boolean> {
  try {
    // Intentar una búsqueda vacía para verificar conectividad
    const response = await fetch(`${BACKEND_URL}/api/lobechat-kb/search`, {
      body: JSON.stringify({
        limit: 1,
        query: 'test',
        user_id: 'test',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    // Si responde (aunque sea error de validación), el endpoint existe
    return response.status !== 404;
  } catch (error) {
    console.error('❌ Middleware no disponible:', error);
    return false;
  }
}






































