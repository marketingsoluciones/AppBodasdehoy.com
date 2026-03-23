/**
 * Memory Extractor Service
 * ========================
 *
 * Analiza el historial de conversaciones y extrae:
 *   - Preferencias del usuario
 *   - Datos de identidad
 *   - Hechos importantes
 *
 * Los guarda en las tablas user_memories_* con embeddings.
 *
 * Se llama desde el pipeline de summary (internal_summaryHistory).
 */

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';

const BACKEND_URL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';

interface ExtractedMemory {
  category: 'preference' | 'identity' | 'fact';
  content: string;
  tags?: string[];
  title: string;
}

interface ExtractionResult {
  memories: ExtractedMemory[];
}

/**
 * Llama a api-ia para extraer memorias de un resumen de conversación.
 *
 * POST /api/memory/extract
 * Body: { summary, userId }
 * Response: { memories: ExtractedMemory[] }
 */
export async function extractMemoriesFromSummary(
  summary: string,
  userId: string,
): Promise<ExtractionResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/memory/extract`, {
      body: JSON.stringify({ summary, userId }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Endpoint not yet available — silently skip
        return { memories: [] };
      }
      console.warn(`[MemoryExtractor] HTTP ${response.status}`);
      return { memories: [] };
    }

    return (await response.json()) as ExtractionResult;
  } catch (error) {
    console.warn('[MemoryExtractor] Error extrayendo memorias:', error);
    return { memories: [] };
  }
}

/**
 * Genera un embedding de 1024 dimensiones para un texto.
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/lobechat-kb/query-embedding`, {
      body: JSON.stringify({ dimensions: 1024, query: text }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.embedding as number[];
  } catch {
    return null;
  }
}

/**
 * Pipeline completo: extrae memorias de un summary y las persiste en la BD.
 */
export async function extractAndPersistMemories(
  summary: string,
  userId: string,
  db: any,
): Promise<number> {
  const { memories } = await extractMemoriesFromSummary(summary, userId);
  if (memories.length === 0) return 0;

  const { UserMemoryModel } = await import('@/database/models/userMemory');
  const memoryModel = new UserMemoryModel(db, userId);

  let persisted = 0;

  for (const mem of memories) {
    try {
      const embedding = await generateEmbedding(mem.content);

      if (mem.category === 'preference') {
        await memoryModel.createPreference({
          conclusionDirectives: mem.content,
          conclusionDirectivesVector: embedding,
          tags: mem.tags,
          type: 'extracted',
        });
      } else {
        await memoryModel.create({
          memoryCategory: mem.category,
          memoryType: 'extracted',
          summary: mem.content,
          summaryVector1024: embedding,
          tags: mem.tags,
          title: mem.title,
          lastAccessedAt: new Date(),
        });
      }

      persisted++;
    } catch (error) {
      console.warn(`[MemoryExtractor] Error persistiendo memoria "${mem.title}":`, error);
    }
  }

  console.log(`[MemoryExtractor] ${persisted}/${memories.length} memorias persistidas para user ${userId}`);
  return persisted;
}
