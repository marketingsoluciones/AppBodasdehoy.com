import { NextRequest, NextResponse } from 'next/server';

import { resolveServerBackendOrigin } from '@/const/backendEndpoints';

export const runtime = 'nodejs';

// 503 firebase-login (QA 7-ago): la ruta de auth caía al fallback FLAKY `api-ia.bodasdehoy.com`
// (zona con 526/503 intermitente CF↔origin). Uso el resolver canónico, que cae a
// DEFAULT_API_IA_ORIGIN (eventosorganizador, no-flaky) cuando el env no está seteado — igual
// que el proxy de messages.
const BACKEND_URL = resolveServerBackendOrigin();

/**
 * Proxy server-side para POST /api/auth/firebase-login
 * Evita problemas de CORS en desarrollo local:
 * el browser llama a este endpoint local y Next.js reenvía a api-ia.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/firebase-login`, {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    const data = await response.json().catch(() => ({ detail: 'Invalid response' }));

    console.log(
      `[firebase-login] status=${response.status} | hasToken=${Boolean(data.token || data.jwt_token)} | user_id=${data.user_id || 'NULL'}`,
    );

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ /api/auth/firebase-login proxy error:', error.message);
    return NextResponse.json({ detail: error.message }, { status: 502 });
  }
}
