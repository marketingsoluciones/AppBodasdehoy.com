/**
 * Normaliza la URL base para API2 según el entorno.
 * Si se pasa una URL, la devuelve tal cual (compatibilidad con Fetching.ts).
 * Si no, usa la variable de entorno o el default.
 */
export function normalizeApi2HttpBase(url?: string): string {
  return url || process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com/graphql';
}