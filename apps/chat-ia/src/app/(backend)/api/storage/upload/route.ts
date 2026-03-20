import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

const PROXY_TIMEOUT_MS = 30_000;

/**
 * POST /api/storage/upload
 *
 * Proxy al backend api-ia que escribe en Cloudflare R2.
 * Las credenciales R2 las gestiona api-ia vía whitelabel (api2). El front no
 * necesita ninguna variable S3_* — solo pasar X-Development y X-User-ID.
 *
 * Routing según eventId:
 *   - Con eventId → api-ia /api/storage/events/{eventId}/upload
 *                   (guarda metadata en api2 MongoDB para listado/permisos)
 *   - Sin eventId → api-ia /api/storage/r2/users/{userId}/upload
 *                   (archivos de usuario sin contexto de evento)
 *
 * FormData:
 *   - file         File      requerido
 *   - event_id     string    opcional — ID del evento propietario
 *   - access_level string    "original" | "shared" | "public" (default: shared)
 */
export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'file requerido', success: false }, { status: 400 });
    }

    const eventId = (formData.get('event_id') as string | null) || '';
    const accessLevel = (formData.get('access_level') as string) || 'shared';

    const userEmail = request.headers.get('X-User-Email') || '';
    const userId = request.headers.get('X-User-ID') || '';
    const development = request.headers.get('X-Development') || 'bodasdehoy';

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'X-User-ID requerido', success: false }, { status: 400 });
    }

    const finalUserId = userId || userEmail;

    // Construir FormData para reenviar
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('access_level', accessLevel);

    // Elegir endpoint según si hay eventId
    const backendUrl = eventId
      ? `${BACKEND_URL}/api/storage/events/${eventId}/upload?access_level=${accessLevel}`
      : `${BACKEND_URL}/api/storage/r2/users/${finalUserId}/upload?access_level=${accessLevel}`;

    const response = await fetch(backendUrl, {
      body: backendFormData,
      headers: {
        'X-Development': development,
        'X-User-Email': userEmail,
        'X-User-ID': finalUserId,
      },
      method: 'POST',
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[storage/upload] backend error:', response.status, errorText);
      return NextResponse.json(
        { details: errorText, error: `Backend error: ${response.status}`, success: false },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Timeout al subir archivo', success: false }, { status: 504 });
    }
    console.error('[storage/upload] error:', error);
    return NextResponse.json(
      { details: error.message, error: 'Error procesando archivo', success: false },
      { status: 500 },
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET /api/storage/upload?event_id=...&file_type=...
 *
 * Lista archivos de un evento (proxy a api-ia).
 */
export async function GET(request: NextRequest) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id') || '';
    const fileType = searchParams.get('file_type');

    const development = request.headers.get('X-Development') || 'bodasdehoy';
    const userId =
      request.headers.get('X-User-ID') || request.headers.get('X-User-Email') || '';

    if (!eventId) {
      return NextResponse.json({ error: 'event_id requerido', success: false }, { status: 400 });
    }

    const params = new URLSearchParams();
    if (fileType) params.set('file_type', fileType);

    const url = `${BACKEND_URL}/api/storage/events/${eventId}/files${params.size ? `?${params}` : ''}`;

    const response = await fetch(url, {
      headers: { 'X-Development': development, 'X-User-ID': userId },
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, success: false },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Timeout listando archivos', success: false }, { status: 504 });
    }
    console.error('[storage/upload GET] error:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
