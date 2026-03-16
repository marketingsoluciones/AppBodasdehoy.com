import { NextResponse } from 'next/server';

/**
 * Health check: si respondes 200, el proceso Next.js de chat-test está arriba.
 * Útil para comprobar que el servidor responde sin cargar la página completa.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'chat-ia',
    time: new Date().toISOString(),
  });
}
