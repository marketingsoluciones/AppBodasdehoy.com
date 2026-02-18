import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const getBackendUrl = (): string =>
  process.env.PYTHON_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

/**
 * Proxy: POST /api/graphql → backend api-ia/graphql
 * Evita CORS cuando el Copilot (localhost:3210) llama desde el navegador.
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
