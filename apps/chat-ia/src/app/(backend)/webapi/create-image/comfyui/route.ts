/**
 * ComfyUI create-image proxy → api-ia backend
 * Migrado 2026-05-20 LOTE 6. Antes invocaba lambdaRouter.comfyui.createImage
 * (server/services/comfyui local) que llamaba a ComfyUI server directamente.
 * Ahora proxea el payload tal cual a api-ia, que gestiona ComfyUI con keys
 * centralizadas e idéntico mapping de errores (InvalidProviderAPIKey 401,
 * PermissionDenied 403, ModelNotFound 404, ComfyUIServiceUnavailable 503).
 */

import { NextResponse } from 'next/server';

import { resolveServerBackendOrigin } from '@/const/backendEndpoints';
export const runtime = 'nodejs';
export const maxDuration = 300;

const getBackendUrl = () =>
  resolveServerBackendOrigin();

export const POST = async (req: Request) => {
  const backendUrl = getBackendUrl();

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

    const upstream = await fetch(`${backendUrl}/webapi/create-image/comfyui`, {
      body,
      headers,
      method: 'POST',
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    console.error('[ComfyUI WebAPI] ❌ proxy error:', e?.message);
    return NextResponse.json(
      { error: { message: 'Error al generar imagen ComfyUI. Intenta de nuevo.', type: 'proxy_error' } },
      { status: 502 },
    );
  }
};
