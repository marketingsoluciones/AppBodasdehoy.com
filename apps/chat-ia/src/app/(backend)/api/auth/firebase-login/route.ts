import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://api-ia.bodasdehoy.com';

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

    // DEBUG: ver qué devuelve api-ia
    console.log(`[firebase-login] status=${response.status} | token=${data.token ? data.token.slice(0, 30) + '...' : 'NULL'} | user_id=${data.user_id || 'NULL'} | keys=${Object.keys(data).join(',')}`);

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ /api/auth/firebase-login proxy error:', error.message);
    return NextResponse.json({ detail: error.message }, { status: 502 });
  }
}
