import { NextResponse } from 'next/server';

import { resolveServerBackendOrigin } from '@/const/backendEndpoints';

export const POST = async (req: Request, { params }: { params: Promise<{ provider: string }> }) => {
  const { provider } = await params;
  const backendUrl = resolveServerBackendOrigin();

  if (!backendUrl) {
    return NextResponse.json(
      { error: { message: 'Backend IA no configurado', type: 'config_error' } },
      { status: 500 },
    );
  }

  try {
    const body = await req.text();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;
    const cookie = req.headers.get('Cookie');
    if (cookie) headers['Cookie'] = cookie;
    const supportKey = req.headers.get('X-Support-Key');
    if (supportKey) headers['X-Support-Key'] = supportKey;
    // Unificación secretos api-mcp v2 (29-jun): X-Internal-Secret server-side.
    if (process.env.INTERNAL_SECRET) headers['X-Internal-Secret'] = process.env.INTERNAL_SECRET;

    const upstream = await fetch(`${backendUrl}/webapi/models/${provider}/pull`, {
      body,
      headers,
      method: 'POST',
      signal: req.signal,
    });

    return new Response(upstream.body, {
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
      status: upstream.status,
    });
  } catch (e: any) {
    console.error(`[models/pull] ❌ proxy error provider="${provider}":`, e?.message);
    return NextResponse.json(
      { error: { message: 'No se pudo descargar el modelo', type: 'proxy_error' } },
      { status: 502 },
    );
  }
};
