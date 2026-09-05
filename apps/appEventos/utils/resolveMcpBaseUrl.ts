/**
 * Normaliza la URL base para API MCP GraphQL segun el entorno.
 * Si se pasa una URL, la devuelve tal cual (compatibilidad con Fetching.ts).
 * Si no, usa la variable de entorno o el default.
 */
import { resolveApiBodasGraphqlUrl } from './apiEndpoints';

export function normalizeMcpHttpBase(url?: string): string {
  return url || resolveApiBodasGraphqlUrl();
}
