/**
 * services/lastGraphqlError.ts — chat-ia
 *
 * Módulo-level "last error" que llenan los callers a APIs GraphQL/HTTP
 * (api-ia, api-mcp, tools) cuando reciben un error con `X-Trace-ID` o
 * `errors[0].extensions.traceId`. El DebugFooter lo lee cada 3s y muestra
 * un chip "err" con el trace_id copiable de un click.
 *
 * Paridad con `apps/appEventos/utils/Fetching.ts#lastFetchApiBodasError`.
 * Se poblan desde:
 *   - services/api-ia.ts (chat streaming + HTTP calls a /webapi/*)
 *   - services/mcpAuth.ts (mutation Auth de api-mcp)
 *
 * Cualquier caller nuevo debe llamar `rememberGraphqlError()` al ver un
 * error para tener consistencia end-to-end.
 */

export interface LastGraphqlError {
  message: string;
  traceId?: string;
  source: string;
  at: number;
}

export let lastChatIaGraphqlError: LastGraphqlError | null = null;

export function rememberGraphqlError(
  message: string,
  source: string,
  traceId?: string,
): void {
  lastChatIaGraphqlError = {
    message: message?.slice(0, 200) || 'unknown',
    source,
    traceId,
    at: Date.now(),
  };
}

export function clearGraphqlError(): void {
  lastChatIaGraphqlError = null;
}
