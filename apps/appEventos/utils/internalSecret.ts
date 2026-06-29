/**
 * INTERNAL_SECRET — unificación de secretos internos servicio↔servicio
 * (api-mcp directiva 2026-06-29).
 *
 * Contrato:
 *   - api-mcp acepta header X-Internal-Secret con el valor de INTERNAL_SECRET
 *   - Durante transición api-mcp acepta los headers viejos (X-Support-Key) Y el
 *     nuevo a la vez → migración sin downtime
 *   - El valor LO LEE de env var, NO se hardcoded en código ni se commit
 *
 * Uso:
 *   const headers = {
 *     ...(getInternalSecret() ? { 'X-Internal-Secret': getInternalSecret() } : {}),
 *     'X-Support-Key': supportKey, // legacy, retirar tras confirmar migración
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
