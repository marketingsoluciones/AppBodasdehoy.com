import { NextRequest, NextResponse } from 'next/server';

import { resolveServerBackendOrigin } from '@/const/backendEndpoints';
import { resolveSessionIdentity } from '@/utils/serverSessionAuth';
const BACKEND_URL =
  resolveServerBackendOrigin();

const PROXY_TIMEOUT_MS = 30_000;

const NO_AUTENTICADO = { error: 'No autenticado', success: false } as const;

/**
 * POST /api/storage/upload
 *
 * Proxy al backend api-ia que escribe en Cloudflare R2.
 * Las credenciales R2 las gestiona api-ia vía whitelabel (MCP). El front no
 * necesita ninguna variable S3_*.
 *
 * 🔒 Gate de sesión (auditoría QA 15-09, IMG-01 / MARCA-01): antes esta ruta
 * identificaba al que sube con la cabecera `X-User-ID` y elegía la marca con
 * `X-Development` — las dos las escribe el cliente, así que cualquiera podía
 * subir al espacio de otro usuario o de otra marca. Ahora el uid sale del claim
 * del JWT y la marca del hostname; las cabeceras ya no se leen.
 *
 * Routing según eventId:
 *   - Con eventId → api-ia /api/storage/events/{eventId}/upload
 *                   (guarda metadata en MCP MongoDB para listado/permisos)
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
    // El gate va ANTES de leer el cuerpo: un anónimo no llega ni a la validación
    // del fichero (antes recibía "file requerido", que ya era estar dentro).
    const session = resolveSessionIdentity(request);
    if (!session) {
      return NextResponse.json(NO_AUTENTICADO, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'file requerido', success: false }, { status: 400 });
    }

    const eventId = (formData.get('event_id') as string | null) || '';
    const accessLevel = (formData.get('access_level') as string) || 'shared';

    const { credential, development, email: userEmail, userId } = session;

    // Construir FormData para reenviar
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('access_level', accessLevel);

    // Elegir endpoint según si hay eventId
    const backendUrl = eventId
      ? `${BACKEND_URL}/api/storage/events/${eventId}/upload?access_level=${accessLevel}`
      : `${BACKEND_URL}/api/storage/r2/users/${userId}/upload?access_level=${accessLevel}`;

    const response = await fetch(backendUrl, {
      body: backendFormData,
      headers: {
        // El JWT viaja al backend: cuando api-ia exija auth en /api/storage/*
        // (tarea abierta de la auditoría de backend), esto ya lo cumple.
        Authorization: credential,
        'X-Development': development,
        'X-User-Email': userEmail,
        'X-User-ID': userId,
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
    // Listar los ficheros de un evento enumera las fotos de esa boda: mismo gate
    // que la subida (IMG-01b).
    const session = resolveSessionIdentity(request);
    if (!session) {
      return NextResponse.json(NO_AUTENTICADO, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id') || '';
    const fileType = searchParams.get('file_type');

    const { credential, development, userId } = session;

    if (!eventId) {
      return NextResponse.json({ error: 'event_id requerido', success: false }, { status: 400 });
    }

    const params = new URLSearchParams();
    if (fileType) params.set('file_type', fileType);

    const url = `${BACKEND_URL}/api/storage/events/${eventId}/files${params.size ? `?${params}` : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: credential,
        'X-Development': development,
        'X-User-ID': userId,
      },
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
