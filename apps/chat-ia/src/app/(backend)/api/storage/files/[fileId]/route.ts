import { NextRequest, NextResponse } from 'next/server';

import { resolveServerBackendOrigin } from '@/const/backendEndpoints';
import { resolveSessionIdentity } from '@/utils/serverSessionAuth';

const NO_AUTENTICADO = { error: 'No autenticado', success: false } as const;

/**
 * Proxy de ficheros de Storage R2 (vía api-ia).
 *
 * 🔒 Gate de sesión (auditoría QA 15-09, IMG-02): las dos rutas resolvían al
 * usuario como `X-User-ID || X-User-Email || 'anonymous'`. El fallback hacía que
 * un DELETE sin ninguna cabecera llegara igualmente al backend con un usuario
 * ficticio — sobre fotos de boda, un borrado no tiene vuelta atrás. Ahora sin
 * sesión no se pasa, y el uid sale del claim del JWT.
 */

/**
 * GET /api/storage/files/[fileId]
 * Query params:
 *   - version: "original" | "optimized_800w" | "optimized_400w" | "thumbnail"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = resolveSessionIdentity(request);
    if (!session) {
      return NextResponse.json(NO_AUTENTICADO, { status: 401 });
    }

    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version') || 'optimized_800w';
    const eventId = searchParams.get('event_id');

    const { credential, development, userId } = session;

    const backendUrl = resolveServerBackendOrigin();

    const url = `${backendUrl}/api/storage/files/${fileId}?version=${version}${eventId ? `&event_id=${eventId}` : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: credential,
        'X-Development': development,
        'X-User-ID': userId,
      },
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error: ${response.status}`, success: false },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ Error obteniendo archivo:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/storage/files/[fileId] - Eliminar archivo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = resolveSessionIdentity(request);
    if (!session) {
      return NextResponse.json(NO_AUTENTICADO, { status: 401 });
    }

    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    const { credential, development, userId } = session;

    const backendUrl = resolveServerBackendOrigin();

    const url = `${backendUrl}/api/storage/files/${fileId}${eventId ? `?event_id=${eventId}` : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: credential,
        'X-Development': development,
        'X-User-ID': userId,
      },
      method: 'DELETE',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error: ${response.status}`, success: false },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ Error eliminando archivo:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
