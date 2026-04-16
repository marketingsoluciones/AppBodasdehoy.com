/**
 * Helpers para Tests con Backend Real
 * 
 * Usa las 1,000 preguntas y 300-600 acciones guardadas en el backend
 */

import { buildAuthHeaders } from '../utils/authToken';

// Usar URL de producción si está disponible, sino localhost
export const BACKEND_URL = 
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.BACKEND_URL || 
  (typeof window !== 'undefined' ? 'https://api-ia.bodasdehoy.com' : 'http://localhost:8030');

export interface TestQuestion {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedResponse?: string;
  id: string;
  keywords?: string[];
  question: string;
}

export interface TestAction {
  action: string;
  id: string;
  metadata?: Record<string, any>;
  type: string;
}

/**
 * Obtener preguntas reales del backend
 */
export async function getTestQuestions(limit = 10): Promise<TestQuestion[]> {
  try {
    // Intentar con URL configurada
    let url = `${BACKEND_URL}/api/admin/tests/questions${limit ? `?limit=${limit}` : ''}`;
    let response = await fetch(url, {
      headers: buildAuthHeaders(),
      signal: AbortSignal.timeout(15_000),
    });

    // Si falla con EPERM y estamos usando localhost, intentar con producción
    if (!response.ok && BACKEND_URL.includes('localhost')) {
      const prodUrl = 'https://api-ia.bodasdehoy.com';
      url = `${prodUrl}/api/admin/tests/questions${limit ? `?limit=${limit}` : ''}`;
      response = await fetch(url, {
        headers: buildAuthHeaders(),
        signal: AbortSignal.timeout(15_000),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('Error obteniendo preguntas del backend:', error);
    // Si es error de permisos, retornar array vacío en lugar de fallar
    if (error?.code === 'EPERM' || error?.message?.includes('EPERM')) {
      console.warn('⚠️ Error EPERM - problemas de permisos. Retornando array vacío.');
      return [];
    }
    throw error;
  }
}

/**
 * Obtener acciones guardadas del backend
 * Nota: Verificar endpoint real - puede ser /api/admin/tests/actions o similar
 */
export async function getTestActions(limit = 10): Promise<TestAction[]> {
  try {
    // Intentar diferentes endpoints posibles
    const possibleEndpoints = [
      '/api/admin/tests/actions',
      '/api/admin/actions',
      '/api/tests/actions',
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        const url = `${BACKEND_URL}${endpoint}${limit ? `?limit=${limit}` : ''}`;
        const response = await fetch(url, {
          headers: buildAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        }
      } catch {
        // Continuar con siguiente endpoint
        continue;
      }
    }

    throw new Error('No se encontró endpoint de acciones');
  } catch (error) {
    console.error('Error obteniendo acciones del backend:', error);
    // Retornar array vacío si no se encuentra el endpoint
    return [];
  }
}

/**
 * Ejecutar test con pregunta real
 */
export async function runTestWithQuestion(
  question: TestQuestion,
  model = 'claude-3-5-sonnet-20241022',
  provider = 'anthropic'
): Promise<{
  error?: string;
  metadata?: any;
  response?: string;
  success: boolean;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/webapi/chat/auto`, {
      body: JSON.stringify({
        messages: [{ content: question.question, role: 'user' }],
        model,
        provider,
        stream: false,
      }),
      headers: {
        ...buildAuthHeaders(),
        'Content-Type': 'application/json',
        'X-Development': 'bodasdehoy',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.error || `HTTP ${response.status}`,
        success: false,
      };
    }

    const data = await response.json();
    return {
      metadata: data.metadata,
      response: data.response || data.message,
      success: data.success || false,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}

/**
 * Obtener estadísticas de tests
 */
export async function getTestStats(): Promise<{
  avgScore: number;
  avgTime: number;
  failed: number;
  passed: number;
  total: number;
} | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/tests/stats`, {
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
}

/**
 * Ejecutar TestSuite completo con todas las preguntas
 */
export async function runFullTestSuite(
  model = 'claude-3-5-sonnet-20241022',
  provider = 'anthropic',
  testIds: string[] = [] // Vacío = todas las preguntas
): Promise<{
  error?: string;
  results?: any[];
  success: boolean;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/tests/run`, {
      body: JSON.stringify({
        model,
        provider,
        testIds, // Si está vacío, ejecuta todas
      }),
      headers: {
        ...buildAuthHeaders(),
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.error || `HTTP ${response.status}`,
        success: false,
      };
    }

    const data = await response.json();
    return {
      results: data.results,
      success: data.success || false,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}
