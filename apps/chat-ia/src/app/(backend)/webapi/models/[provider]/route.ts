import { NextResponse } from 'next/server';

// SPRINT-AC: edge runtime — solo hace fetch a api-ia, sin Node APIs.
// Cold start mucho más rápido + distributed en edge locations.
export const runtime = 'edge';

export const GET = async (req: Request, { params }: { params: Promise<{ provider: string }> }) => {
  const { provider } = await params;
  const backendUrl = process.env.API_IA_URL || process.env.NEXT_PUBLIC_API_IA_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { error: { message: 'Backend IA no configurado', type: 'config_error' } },
      { status: 500 },
    );
  }

  try {
    const headers: Record<string, string> = {};
    const auth = req.headers.get('Authorization');
    if (auth) headers['Authorization'] = auth;
    const cookie = req.headers.get('Cookie');
    if (cookie) headers['Cookie'] = cookie;
    const supportKey = req.headers.get('X-Support-Key');
    if (supportKey) headers['X-Support-Key'] = supportKey;

    const upstream = await fetch(`${backendUrl}/webapi/models/${provider}`, {
      headers,
      method: 'GET',
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    console.error(`[models] ❌ proxy error provider="${provider}":`, e?.message);
    return NextResponse.json(
      { error: { message: 'No se pudo obtener la lista de modelos', type: 'proxy_error' } },
      { status: 502 },
    );
  }
};
