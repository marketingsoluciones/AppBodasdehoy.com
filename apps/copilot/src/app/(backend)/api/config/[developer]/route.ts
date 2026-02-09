import { NextRequest, NextResponse } from 'next/server';

// ✅ Caché en memoria para evitar múltiples llamadas al backend
const configCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos

/**
 * API Route para obtener configuración de branding del developer
 * Hace proxy al backend Python
 *
 * GET /api/config/[developer]
 *
 * Retorna configuración de branding incluyendo:
 * - Logo, favicon, iconos
 * - Colores primarios y secundarios
 * - Metadata (nombre, descripción)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ developer: string }> }
) {
  void _request;
  try {
    const { developer } = await params;

    // Validar que el developer no esté vacío
    if (!developer || developer.trim() === '') {
      return NextResponse.json(
        { error: 'Developer ID es requerido' },
        { status: 400 }
      );
    }

    const cacheKey = developer.toLowerCase();

    // ✅ Verificar caché en memoria primero
    const cached = configCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    // URL del backend Python
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:8030';

    // ✅ CORRECCIÓN: Asegurar que la URL termine con /api/config/[developer] y no sea solo el root
    const url = backendUrl.endsWith('/')
      ? `${backendUrl}api/config/${cacheKey}`
      : `${backendUrl}/api/config/${cacheKey}`;

    console.log(`🔄 Fetching branding config from: ${url}`);

    // Hacer fetch al backend Python
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache durante 1 hora en producción
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend error (${response.status}):`, errorText);

      // Si el developer no existe, devolver 404
      if (response.status === 404) {
        return NextResponse.json(
          {
            error: `Developer '${developer}' no encontrado`,
            message: 'Developer no configurado en el sistema',
          },
          { status: 404 }
        );
      }

      // Otros errores del backend
      return NextResponse.json(
        {
          error: `Error del backend: ${response.statusText}`,
          status: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Branding config obtenido para ${developer}`);

    // ✅ Guardar en caché
    configCache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error: any) {
    console.error('❌ Error obteniendo configuración de branding:', error);

    // Fallback: devolver configuración por defecto
    const { developer } = await params;
    const fallbackConfig = {
      color_primary: '#667eea',
      color_secondary: '#764ba2',
      colors: {
        accent: '#667eea',
        background: '#ffffff',
        primary: '#667eea',
        secondary: '#764ba2',
        text: '#1a202c',
      },
      description: `Asistente de eventos para ${developer || 'bodas'}`,
      developer: developer || 'bodasdehoy',
      enabled: true,
      icons: {},
      name: developer ? developer.charAt(0).toUpperCase() + developer.slice(1) : 'Bodas de Hoy',
    };

    console.log(`⚠️ Usando configuración fallback para ${developer}`);

    return NextResponse.json(fallbackConfig, {
      headers: {
        'X-Fallback': 'true',
      },
    });
  }
}

/**
 * Listar todos los developers disponibles
 * GET /api/config
 */
export async function OPTIONS(_request: NextRequest) {
  void _request;
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}


