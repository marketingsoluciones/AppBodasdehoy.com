import { NextRequest, NextResponse } from 'next/server';

// Forzar uso del runtime de Node.js para poder hacer peticiones HTTP
export const runtime = 'nodejs';

const getBackendUrl = (): string =>
  process.env.PYTHON_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

/**
 * API Route: Identificar Usuario
 * Proxy al backend Python para identificar tipo de usuario (guest o registered)
 * 
 * POST /api/auth/identify-user
 * Body: { developer?: string, email?: string, phone?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { developer = 'bodasdehoy', email, phone } = body;

    console.log('📥 /api/auth/identify-user proxy recibido:', {
      developer,
      email: email ? `${email.slice(0, 10)}...` : undefined,
      hasEmail: !!email,
      hasPhone: !!phone,
      phone: phone ? `${phone.slice(0, 10)}...` : undefined,
    });

    const PYTHON_BACKEND_URL = getBackendUrl();
    console.log(`📡 Haciendo proxy a: ${PYTHON_BACKEND_URL}/api/auth/identify-user`);

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/auth/identify-user`, {
      body: JSON.stringify({
        developer,
        email: email || undefined,
        phone: phone || undefined,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: AbortSignal.timeout(10_000), // 10 segundos timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error ${response.status} del backend Python:`, errorText);
      return NextResponse.json(
        {
          error: `Backend error: ${response.statusText}`,
          success: false,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log('✅ Respuesta del backend Python:', {
      development: data.development,
      success: data.success,
      user_id: data.user_id ? `${data.user_id.slice(0, 20)}...` : undefined,
      user_type: data.user_type,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Error en /api/auth/identify-user:', error?.message || error);
    const isConnectionError =
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('fetch failed') ||
      error?.message?.includes('ENOTFOUND');
    const status = isConnectionError ? 502 : 500;
    return NextResponse.json(
      {
        error: isConnectionError
          ? 'No se pudo conectar al backend IA (api-ia.bodasdehoy.com). Intenta más tarde.'
          : error?.message || 'Error interno del servidor',
        success: false,
      },
      { status }
    );
  }
}
