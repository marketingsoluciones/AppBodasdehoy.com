import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para obtener URL de archivo desde Storage R2
 * 
 * GET /api/storage/files/[fileId]
 * Query params:
 *   - version: "original" | "optimized_800w" | "optimized_400w" | "thumbnail"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version') || 'optimized_800w';
    const eventId = searchParams.get('event_id');

    const development = request.headers.get('X-Development') || 'bodasdehoy';
    const userId = request.headers.get('X-User-ID') || request.headers.get('X-User-Email') || 'anonymous';

    const backendUrl = process.env.BACKEND_URL || 
                       process.env.NEXT_PUBLIC_BACKEND_URL || 
                       'https://api-ia.bodasdehoy.com';

    const url = `${backendUrl}/api/storage/files/${fileId}?version=${version}${eventId ? `&event_id=${eventId}` : ''}`;

    const response = await fetch(url, {
      headers: {
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
    const { fileId } = await params;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    const development = request.headers.get('X-Development') || 'bodasdehoy';
    const userId = request.headers.get('X-User-ID') || request.headers.get('X-User-Email') || 'anonymous';

    const backendUrl = process.env.BACKEND_URL || 
                       process.env.NEXT_PUBLIC_BACKEND_URL || 
                       'https://api-ia.bodasdehoy.com';

    const url = `${backendUrl}/api/storage/files/${fileId}${eventId ? `?event_id=${eventId}` : ''}`;

    const response = await fetch(url, {
      headers: {
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

