/**
 * /api/push/subscribe — proxy Next.js server-side a api-ia.
 *
 * SPRINT 4 iMessage (6-jul). Endpoint que el hook useWebPushSubscription
 * llama con la PushSubscription serializada del browser. Aquí solo
 * proxeamos a api-ia (que debe implementar el endpoint real que persiste
 * la suscripción y luego emite pushes via web-push library).
 *
 * POST   — registra suscripción
 * DELETE — elimina suscripción por endpoint
 *
 * Auth: el proxy toma el JWT del client desde la cookie mcp_jwt / header
 * Authorization ya presente en la petición (buildHeaders lo pone). Backend
 * api-ia identifica al usuario por ese JWT.
 *
 * Env vars server-side requeridas:
 *   INTERNAL_SECRET — para autenticar servicio↔servicio con api-ia.
 * (Ver docs/AUTH-FLOW.md sección "Retirada de X-Support-Key")
 */
import { NextRequest, NextResponse } from 'next/server';

import { resolveServerBackendOrigin } from '@/const/backendEndpoints';

export const runtime = 'nodejs';

const API_IA = resolveServerBackendOrigin();

function forwardHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) h.Authorization = auth;
  const dev = req.headers.get('x-development');
  if (dev) h['X-Development'] = dev;
  const internalSecret = process.env.INTERNAL_SECRET;
  if (internalSecret) h['X-Internal-Secret'] = internalSecret;
  return h;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.endpoint !== 'string') {
      return NextResponse.json(
        { error: 'invalid_payload', hint: 'body debe incluir endpoint + keys' },
        { status: 400 },
      );
    }

    // BUG-QA-01 (10-jul): api-ia expone Pydantic SubscribeRequest con
    // `subscription: object` como field REQUIRED. El hook front envía el
    // shape plano {endpoint, keys, subscribedAt, userAgent}. Sin el
    // wrapper `subscription`, api-ia devolvía 422 → subscribe rompía y
    // el user nunca quedaba suscrito. Aquí adaptamos el contract sin
    // duplicar lógica en el hook (proxies son el lugar correcto para
    // shape-shims entre front y backend).
    const upstream = { subscription: body };
    const upstreamRes = await fetch(`${API_IA}/api/push/subscribe`, {
      method: 'POST',
      headers: forwardHeaders(request),
      body: JSON.stringify(upstream),
      signal: AbortSignal.timeout(6000),
    });

    // Pasamos status + body tal cual — el hook front interpreta el status.
    const data = await upstreamRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'proxy_error', message: e?.message || 'unknown' },
      { status: 502 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.endpoint !== 'string') {
      return NextResponse.json(
        { error: 'invalid_payload', hint: 'body debe incluir endpoint' },
        { status: 400 },
      );
    }

    // BUG-QA-02 (10-jul): api-ia NO expone DELETE en /api/push/subscribe.
    // El endpoint de baja es POST /api/push/unsubscribe con body {endpoint}
    // (UnsubscribeRequest, sin wrapper). El proxy antes hacía DELETE al path
    // /subscribe → 404 → el desuscribir del front nunca purgaba backend.
    const upstreamRes = await fetch(`${API_IA}/api/push/unsubscribe`, {
      method: 'POST',
      headers: forwardHeaders(request),
      body: JSON.stringify({ endpoint: body.endpoint }),
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
