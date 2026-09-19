/**
 * Cohere Rerank Service
 * =====================
 *
 * Llama a la API v2 de Cohere para re-rankear documentos usando
 * el modelo multilingue rerank-v3.5.
 *
 * Opt-in: solo se activa si COHERE_API_KEY esta presente en env.
 */

import type { MiddlewareSearchResult } from './lobechatKBMiddlewareService';

const COHERE_RERANK_URL = 'https://api.cohere.com/v2/rerank';
const DEFAULT_MODEL = 'rerank-v3.5';

interface CohereRerankRequest {
  documents: Array<{ text: string }>;
  model: string;
  query: string;
  top_n: number;
}

interface CohereRerankResultItem {
  index: number;
  relevance_score: number;
}

interface CohereRerankResponse {
  id: string;
  results: CohereRerankResultItem[];
}

/**
 * Devuelve true si el reranker esta disponible (COHERE_API_KEY definida).
 */
export function isRerankAvailable(): boolean {
  return !!process.env.COHERE_API_KEY;
}

/**
 * Re-rankea un array de MiddlewareSearchResult usando Cohere Rerank v2 API.
 *
 * @param results - Resultados de busqueda vectorial (candidatos).
 * @param query   - Query original del usuario.
 * @param topN    - Cuantos resultados devolver despues del rerank.
 * @param model   - Modelo de rerank (default: rerank-v3.5).
 * @returns       - Resultados re-rankeados con score actualizado.
 */
export async function rerankDocuments(
  results: MiddlewareSearchResult[],
  query: string,
  topN: number,
  model: string = DEFAULT_MODEL,
): Promise<MiddlewareSearchResult[]> {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    console.warn('[Rerank] COHERE_API_KEY no definida, devolviendo resultados sin rerank');
    return results.slice(0, topN);
  }

  if (results.length === 0) return [];

  const body: CohereRerankRequest = {
    documents: results.map((r) => ({ text: r.text_content })),
    model,
    query,
    top_n: Math.min(topN, results.length),
  };

  try {
    const response = await fetch(COHERE_RERANK_URL, {
      body: JSON.stringify(body),
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[Rerank] Cohere API error HTTP ${response.status}:`, errorText.slice(0, 300));
      // Fallback: devolver los primeros topN sin rerank
      return results.slice(0, topN);
    }

    const data: CohereRerankResponse = await response.json();

    // Mapear indices de vuelta a los resultados originales con el nuevo score
    return data.results.map((item) => ({
      ...results[item.index],
      score: item.relevance_score,
    }));
  } catch (error) {
    console.error('[Rerank] Error llamando Cohere rerank:', error);
    // Fallback graceful
    return results.slice(0, topN);
  }
}
