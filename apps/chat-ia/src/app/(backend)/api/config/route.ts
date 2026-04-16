import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para listar todos los developers disponibles
 * Hace proxy al backend Python
 *
 * GET /api/config
 *
 * Retorna lista de developers con configuración básica
 */
export async function GET(_request: NextRequest) {
  void _request;
  try {
    // URL del backend Python
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:8030';

    // ✅ CORRECCIÓN: Asegurar que la URL termine con /api/config y no sea solo el root
    const url = backendUrl.endsWith('/')
      ? `${backendUrl}api/config`
      : `${backendUrl}/api/config`;

    console.log(`🔄 Fetching developers list from: ${url}`);

    // Hacer fetch al backend Python
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache durante 1 hora
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend error (${response.status}):`, errorText);

      // En lugar de retornar error, usar fallback
      console.log('⚠️ Backend no disponible, usando fallback');
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Developers list obtenida: ${data.count} developers`);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error obteniendo lista de developers:', error);

    // Fallback: devolver lista básica
    const fallbackList = {
      count: 4,
      developers: [
        {
          description: 'Asistente inteligente para la planificación de bodas',
          developer: 'bodasdehoy',
          enabled: true,
          name: 'Bodas de Hoy',
        },
        {
          description: 'Plataforma profesional para organización de eventos corporativos',
          developer: 'eventosorganizador',
          enabled: true,
          name: 'Eventos Organizador',
        },
        {
          description: 'Eventos exclusivos con estilo y elegancia',
          developer: 'annloevents',
          enabled: true,
          name: 'Annlo Events',
        },
        {
          description: 'Eventos sofisticados y memorables',
          developer: 'champagneevents',
          enabled: true,
          name: 'Champagne Events',
        },
      ],
    };

    console.log('⚠️ Usando lista de developers fallback');

    return NextResponse.json(fallbackList, {
      headers: {
        'X-Fallback': 'true',
      },
    });
  }
}

export async function OPTIONS(_request: NextRequest) {
  void _request;
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}
