import { NextResponse } from 'next/server';

// SPRINT-AC: edge runtime — solo hace fetch a api-ia.
export const runtime = 'edge';

export const preferredRegion = [
  'arn1', 'bom1', 'cdg1', 'cle1', 'cpt1', 'dub1', 'fra1', 'gru1',
  'hnd1', 'iad1', 'icn1', 'kix1', 'lhr1', 'pdx1', 'sfo1', 'sin1', 'syd1',
];

export const POST = async (req: Request, { params }: { params: Promise<{ provider: string }> }) => {
  const { provider } = await params;
  const backendUrl = process.env.API_IA_URL || process.env.NEXT_PUBLIC_API_IA_URL;

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

    const upstream = await fetch(`${backendUrl}/webapi/text-to-image/${provider}`, {
      body,
      headers,
      method: 'POST',
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    console.error(`[text-to-image] ❌ proxy error provider="${provider}":`, e?.message);
    return NextResponse.json(
      { error: { message: 'Error al generar imagen. Intenta de nuevo.', type: 'proxy_error' } },
      { status: 502 },
    );
  }
};
