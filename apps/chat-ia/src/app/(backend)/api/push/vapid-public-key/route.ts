/**
 * /api/push/vapid-public-key — proxy Next.js server-side a api-ia.
 *
 * SPRINT 4 iMessage. Devuelve la clave PÚBLICA VAPID que el hook
 * useWebPushSubscription necesita como applicationServerKey al suscribir.
 *
 * Se resuelve en runtime (no se inyecta en build) para que una rotación de
 * la clave en api-ia NO obligue a rebuildar el front. api-ia expone la clave
 * en GET /api/push/vapid-public-key → { publicKey }.
 *
 * La clave pública NO es secreta (va al navegador por diseño), por eso el
 * endpoint es GET sin auth.
 */
import { NextResponse } from 'next/server';

import { resolveServerBackendOrigin } from '@/const/backendEndpoints';

export const runtime = 'nodejs';

const API_IA = resolveServerBackendOrigin();

export async function GET() {
  try {
    const upstreamRes = await fetch(`${API_IA}/api/push/vapid-public-key`, {
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
      signal: AbortSignal.timeout(6000),
    });

    const data = await upstreamRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'proxy_error', message: e?.message || 'unknown' },
      { status: 502 },
    );
  }
}
