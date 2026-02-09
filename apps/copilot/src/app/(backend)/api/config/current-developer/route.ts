import { NextResponse } from 'next/server';
import { getCurrentDeveloper } from '@/server/branding';
import { getDomainMapping } from '@/server/utils/detectDeveloperFromHostname';

export const runtime = 'edge';

/**
 * Endpoint para obtener el developer actual detectado
 *
 * GET /api/config/current-developer?developer=bodasdehoy
 *
 * Retorna:
 * {
 *   success: true,
 *   developer: "eventosorganizador",
 *   source: "query" | "hostname" | "cookie" | "localStorage" | "default"
 * }
 */
export async function GET(request: Request) {
  try {
    // ✅ PRIORIDAD 1: Query parameter (ej: ?developer=bodasdehoy)
    const url = new URL(request.url);
    const queryDeveloper = url.searchParams.get('developer');
    if (queryDeveloper) {
      const { getDomainMapping } = await import('@/server/utils/detectDeveloperFromHostname');
      const mapping = getDomainMapping();
      const validDevelopers = Object.values(mapping);
      if (validDevelopers.includes(queryDeveloper)) {
        return NextResponse.json({
          developer: queryDeveloper,
          source: 'query',
          success: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // ✅ PRIORIDAD 2: Detección automática (hostname, cookie, localStorage, default)
    const developer = await getCurrentDeveloper();

    return NextResponse.json({
      developer,
      source: queryDeveloper ? 'query_invalid' : 'auto',
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error getting current developer:', error);
    return NextResponse.json(
      {
        developer: 'bodasdehoy',
        error: error instanceof Error ? error.message : 'Failed to detect developer',
        success: false,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para obtener el mapeo completo de dominios
 * Útil para debugging y documentación
 *
 * POST /api/config/current-developer (con body { action: "mapping" })
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'mapping') {
      const mapping = getDomainMapping();

      return NextResponse.json({
        count: Object.keys(mapping).length,
        mapping,
        success: true,
      });
    }

    return NextResponse.json(
      {
        error: 'Invalid action. Use { action: "mapping" } to get domain mapping.',
        success: false,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Error in POST /api/config/current-developer:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}

