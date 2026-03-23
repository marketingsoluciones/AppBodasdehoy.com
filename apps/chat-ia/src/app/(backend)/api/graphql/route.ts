import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// ✅ CORRECCIÓN: Las queries del apolloClient (fetchUserEvents, fetchExternalChats, etc.) son api2 queries.
// Usar GRAPHQL_ENDPOINT (api2) como destino del proxy, NO el Python backend (api-ia).
const getBackendUrl = (): string => {
  const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT || process.env.API2_GRAPHQL_URL;
  if (graphqlEndpoint) {
    // graphqlEndpoint ya incluye /graphql — extraemos la base para que el proxy añada /graphql
    return graphqlEndpoint.replace(/\/graphql$/, '');
  }
  return 'https://api2.eventosorganizador.com';
};

/**
 * Proxy: POST /api/graphql → **API2** (/graphql). Mongo y dominio de negocio viven detrás de API2.
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
    const origin = request.headers.get('origin');
    if (origin) headers['Origin'] = origin;

    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/graphql`, {
      body: JSON.stringify(body),
      headers,
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ Error en /api/graphql proxy:', error?.message || error);
    return NextResponse.json(
      { errors: [{ message: error?.message || 'Error interno del proxy GraphQL' }] },
      { status: 500 }
    );
  }
}
