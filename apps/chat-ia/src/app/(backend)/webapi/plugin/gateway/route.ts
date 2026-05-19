import { NextResponse } from 'next/server';

export const POST = async (req: Request) => {
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
    const trace = req.headers.get('X-lobe-trace');
    if (trace) headers['X-lobe-trace'] = trace;

    const upstream = await fetch(`${backendUrl}/webapi/plugin/gateway`, {
      body,
      headers,
      method: 'POST',
    });

    const data = await upstream.text();
    return new Response(data, {
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
      status: upstream.status,
    });
  } catch (e: any) {
    console.error(`[plugin/gateway] ❌ proxy error:`, e?.message);
    return NextResponse.json(
      { error: { message: 'Error en gateway de plugins', type: 'proxy_error' } },
      { status: 502 },
    );
  }
};
