/**
 * Memory Recall Service
 * =====================
 *
 * Busca memorias relevantes del usuario para inyectar como contexto
 * en el system prompt durante el flujo de chat.
 *
 * Lee de las tablas:
 *   - user_memories (summary_vector_1024)
 *   - user_memories_preferences (conclusion_directives_vector)
 *   - user_memories_identities (description_vector)
 */

import { LobeChatDatabase } from '@lobechat/database';

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';
import { UserMemoryModel } from '@/database/models/userMemory';

const BACKEND_URL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';

interface MemoryRecallResult {
  contextBlock: string;
  hasMemories: boolean;
  memoriesCount: number;
}

/**
 * Genera un embedding de 1024 dimensiones para una query usando api-ia.
 * Llama POST /api/lobechat-kb/query-embedding
 *
 * Fallback: si el endpoint no existe, devuelve null (memoria deshabilitada).
 */
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/lobechat-kb/query-embedding`, {
      body: JSON.stringify({ dimensions: 1024, query }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // Si el endpoint no existe, memory recall se desactiva silenciosamente
      if (response.status === 404) return null;
      console.warn(`[MemoryRecall] query-embedding HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.embedding as number[];
  } catch (error) {
    console.warn('[MemoryRecall] Error generando query embedding:', error);
    return null;
  }
}

/**
 * Busca memorias, preferencias e identidades relevantes y devuelve
 * un bloque de texto formateado para inyectar en el system prompt.
 */
export async function recallMemories(
  db: LobeChatDatabase,
  userId: string,
  query: string,
): Promise<MemoryRecallResult> {
  const emptyResult: MemoryRecallResult = {
    contextBlock: '',
    hasMemories: false,
    memoriesCount: 0,
  };

  // 1. Generar embedding de la query
  const embedding = await generateQueryEmbedding(query);
  if (!embedding) return emptyResult;

  const memoryModel = new UserMemoryModel(db, userId);

  // 2. Buscar en paralelo en las 3 tablas principales
  const [memories, preferences, identities] = await Promise.all([
    memoryModel.findRelevantMemories(embedding, 5, 0.3),
    memoryModel.findRelevantPreferences(embedding, 3, 0.3),
    memoryModel.findUserIdentity(embedding, 3, 0.3),
  ]);

  const totalCount = memories.length + preferences.length + identities.length;
  if (totalCount === 0) return emptyResult;

  // 3. Marcar memorias como accedidas (fire-and-forget)
  for (const m of memories) {
    memoryModel.touchAccessed(m.id).catch(() => {});
  }

  // 4. Formatear bloque de contexto
  const lines: string[] = ['<!-- Memoria del usuario (recall automático) -->'];

  if (identities.length > 0) {
    lines.push('## Identidad del usuario');
    for (const id of identities) {
      const parts = [id.description];
      if (id.role) parts.push(`Rol: ${id.role}`);
      if (id.relationship) parts.push(`Relación: ${id.relationship}`);
      lines.push(`- ${parts.join(' | ')}`);
    }
  }

  if (preferences.length > 0) {
    lines.push('## Preferencias del usuario');
    for (const p of preferences) {
      lines.push(`- ${p.conclusionDirectives}`);
      if (p.suggestions) lines.push(`  Sugerencia: ${p.suggestions}`);
    }
  }

  if (memories.length > 0) {
    lines.push('## Memorias relevantes');
    for (const m of memories) {
      const label = m.title || m.memoryCategory || 'Memoria';
      lines.push(`- **${label}**: ${m.summary}`);
    }
  }

  lines.push('<!-- fin memoria -->');

  return {
    contextBlock: lines.join('\n'),
    hasMemories: true,
    memoriesCount: totalCount,
  };
}
