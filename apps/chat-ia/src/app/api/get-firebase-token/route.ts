import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint temporal para obtener el token de Firebase
 * SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener token del header Authorization
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        {
          error: 'No authorization header',
          message: 'Por favor asegúrate de estar logueado'
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    return NextResponse.json({
      length: token.length,
      message: 'Token obtenido exitosamente',
      success: true,
      token
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error al obtener token',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
