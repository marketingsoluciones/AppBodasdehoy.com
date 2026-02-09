import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para sincronizar identidad del usuario
 * POST /api/auth/sync-user-identity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      development = 'bodasdehoy',
    } = body;

    // Por ahora, solo confirmamos que se recibió la solicitud
    // En el futuro, aquí se podría migrar datos anónimos, etc.

    return NextResponse.json({
      development,
      has_migrated_data: false,
      message: 'Identidad sincronizada',
      migration_result: null,
      success: true,
      user_id,
    });
  } catch (error: any) {
    console.error('Error en sync-user-identity:', error);
    return NextResponse.json(
      {
        error: error.message || 'Error al sincronizar identidad',
        success: false,
      },
      { status: 500 }
    );
  }
}

