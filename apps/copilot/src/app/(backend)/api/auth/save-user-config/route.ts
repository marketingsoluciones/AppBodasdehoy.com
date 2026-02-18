import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const getBackendUrl = (): string =>
  process.env.PYTHON_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

/**
 * Proxy: POST /api/auth/save-user-config → backend api-ia
 * Evita CORS cuando el Copilot (localhost:3210) llama desde el navegador.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/auth/save-user-config`, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      method: 'POST',
      signal: AbortSignal.timeout(15_000),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ Error en /api/auth/save-user-config proxy:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Error interno', success: false },
      { status: 500 }
    );
  }
}
