/**
 * Normaliza la URL base para API2 según el entorno
 */
export function normalizeApi2HttpBase(): string {
  // Por defecto usa la API2 de producción
  return process.env.NEXT_PUBLIC_API2_URL || 'https://api2.eventosorganizador.com/graphql';
}