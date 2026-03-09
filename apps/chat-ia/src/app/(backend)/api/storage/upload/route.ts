import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para subir archivos a Storage R2
 * 
 * Proxy al backend Python que maneja Cloudflare R2
 * 
 * POST /api/storage/upload
 * Body: FormData con:
 *   - file: File
 *   - event_id: string (opcional, si no se proporciona se usa "default")
 *   - access_level: "original" | "shared" | "public" (default: "shared")
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo', success: false },
        { status: 400 }
      );
    }

    // Obtener event_id del formData o usar default
    const eventId = (formData.get('event_id') as string) || 'default';
    const accessLevel = (formData.get('access_level') as string) || 'shared';

    // Obtener headers de usuario desde request
    const userEmail = request.headers.get('X-User-Email');
    const userId = request.headers.get('X-User-ID');
    const development = request.headers.get('X-Development') || 'bodasdehoy';

    // Si no hay user_id en headers, intentar obtenerlo de cookies/localStorage del cliente
    // Por ahora usamos el email o un ID temporal
    const finalUserId = userId || userEmail || 'anonymous';

    // Backend URL (usar dominio público o localhost)
    const backendUrl = process.env.BACKEND_URL || 
                       process.env.NEXT_PUBLIC_BACKEND_URL || 
                       'https://api-ia.bodasdehoy.com';

    // Crear nuevo FormData para enviar al backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('access_level', accessLevel);

    // Hacer proxy al backend Python
    const response = await fetch(`${backendUrl}/api/storage/events/${eventId}/upload?access_level=${accessLevel}`, {
      body: backendFormData,
      headers: {
        'X-Development': development,
        'X-User-Email': userEmail || '',
        'X-User-ID': finalUserId,
        // No incluir Content-Type, FormData lo maneja automáticamente
      },
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en backend storage:', response.status, errorText);
      return NextResponse.json(
        { 
          details: errorText, 
          error: `Error del servidor: ${response.status}`,
          success: false 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      ...data,
    });

  } catch (error: any) {
    console.error('❌ Error en upload route:', error);
    return NextResponse.json(
      { 
        details: error.message, 
        error: 'Error procesando archivo',
        success: false 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/storage/upload - Listar archivos de un evento
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id') || 'default';
    const fileType = searchParams.get('file_type'); // photos, documents, videos, audio

    const development = request.headers.get('X-Development') || 'bodasdehoy';
    const userId = request.headers.get('X-User-ID') || request.headers.get('X-User-Email') || 'anonymous';

    const backendUrl = process.env.BACKEND_URL || 
                       process.env.NEXT_PUBLIC_BACKEND_URL || 
                       'https://api-ia.bodasdehoy.com';

    const url = `${backendUrl}/api/storage/events/${eventId}/files${fileType ? `?file_type=${fileType}` : ''}`;

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
    console.error('❌ Error listando archivos:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}

