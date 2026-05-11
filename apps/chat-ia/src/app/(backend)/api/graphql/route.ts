import { NextRequest, NextResponse } from 'next/server';

import { resolveServerMcpGraphqlUrl } from '@/const/mcpEndpoints';

export const runtime = 'nodejs';

// ✅ CORRECCIÓN: Las queries del apolloClient (fetchUserEvents, fetchExternalChats, etc.) son queries de MCP.
// Usar MCP GraphQL como destino del proxy, NO el backend Python (api-ia).
const getBackendUrl = (): string => {
  return resolveServerMcpGraphqlUrl().replace(/\/graphql\/?$/i, '');
};

/**
 * Proxy: POST /api/graphql → **MCP** (/graphql). Mongo y dominio de negocio viven detrás de MCP.
 * Orquestación IA (tools, RAG, chat): **api-ia**; este route solo evita CORS desde el Copilot.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const auth = request.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;
    const developer = request.headers.get('developer');
    if (developer) headers['Developer'] = developer;
    const supportKey = request.headers.get('supportkey');
    if (supportKey) headers['SupportKey'] = supportKey;
    const xDevelopment = request.headers.get('x-development');
    if (xDevelopment) headers['X-Development'] = xDevelopment;

    const backendUrl = getBackendUrl();
    const opName = body?.operationName ?? '(anon)';
    const querySnip = typeof body?.query === 'string' ? body.query.slice(0, 80).replace(/\s+/g, ' ') : '(no query)';
    const startedAt = Date.now();
    let response: Response;
    try {
      response = await fetch(`${backendUrl}/graphql`, {
        body: JSON.stringify(body),
        headers,
        method: 'POST',
        // Timeout 8s en lugar de 30s — evita bloquear el render del page SSR.
        // Si una query tarda más, el client maneja el error gracefully (try/catch en servicios).
        signal: AbortSignal.timeout(8_000),
      });
    } catch (fetchErr: any) {
      const elapsed = Date.now() - startedAt;
      console.error(`⏱️  /api/graphql TIMEOUT/ERR [${opName}] tras ${elapsed}ms — query: ${querySnip}`);
      throw fetchErr;
    }

    const data = await response.json().catch(() => ({}));

    // Log 400/500 errors with operation name + query for diagnostics
    if (response.status >= 400) {
      const operationName = body?.operationName ?? '(unknown)';
      const querySnippet = typeof body?.query === 'string' ? body.query.slice(0, 300) : '(no query)';
      console.error(
        `❌ mcp GraphQL ${response.status} [${operationName}]:\n` +
        `  Query: ${querySnippet}\n` +
        `  Variables: ${JSON.stringify(body?.variables ?? {}).slice(0, 200)}\n` +
        `  Response: ${JSON.stringify(data).slice(0, 500)}`
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ Error en /api/graphql proxy:', error?.message || error);
    return NextResponse.json(
      { errors: [{ message: error?.message || 'Error interno del proxy GraphQL' }] },
      { status: 500 }
    );
  }
}
