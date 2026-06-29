/**
 * INTERNAL_SECRET — unificación de secretos internos servicio↔servicio
 * (api-mcp directiva 2026-06-29 v2).
 *
 * Contrato:
 *   - api-mcp y api-ia aceptan header X-Internal-Secret con el valor de
 *     env var INTERNAL_SECRET (el mismo que api-mcp tiene en su .env).
 *   - X-Support-Key LEGACY auth retirado de los callers a api-mcp. Mantiene
 *     uso como identidad per-tenant (whitelabel) donde aplique (NO en
 *     callers a /api/internal/* de api-mcp).
 *   - El valor LO LEE de env var, NO se hardcodea en código ni se commit.
 *
 * Uso (caller a api-mcp directo):
 *   const headers = {
 *     'X-Internal-Secret': getInternalSecret(),
 *     'X-User-Id': uid, // identidad usuario, no secret
 *   };
 */
export function getInternalSecret(): string {
  if (typeof process === 'undefined') return '';
  const s = process.env.INTERNAL_SECRET;
  if (!s) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[internalSecret] INTERNAL_SECRET no configurado. Llamadas server-to-server' +
          ' a api-mcp pueden fallar tras retirada de headers legacy.',
      );
    }
    return '';
  }
  return s;
}
