import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

/**
 * GET /api/storage/proxy-image?url=<encoded-image-url>
 *
 * Proxy autenticado para imágenes almacenadas en api-ia / Cloudflare R2.
 * El browser no puede añadir headers X-User-ID a una etiqueta <img>, así que
 * este route los añade desde la sesión del servidor y retransmite la imagen.
 *
 * Uso:
 *   src={`/api/storage/proxy-image?url=${encodeURIComponent(imageUrl)}`}
 *
 * Solo redirige URLs del mismo dominio (api-ia.bodasdehoy.com) para evitar
 * que actúe como proxy abierto hacia dominios externos.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'url param requerido' }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'url inválida' }, { status: 400 });
  }

  // Seguridad: solo permitir URLs del backend conocido
  const allowedHostnames = [
    new URL(BACKEND_URL).hostname,
    'api-ia.bodasdehoy.com',
    'r2.bodasdehoy.com',
  ];
  if (!allowedHostnames.some((h) => targetUrl.hostname === h || targetUrl.hostname.endsWith(`.${h}`))) {
    return NextResponse.json({ error: 'dominio no permitido' }, { status: 403 });
  }

  // Leer identidad de usuario: primero desde headers, luego desde cookie dev-user-config
  let userId = request.headers.get('X-User-ID') || request.headers.get('X-User-Email') || '';
  let development = request.headers.get('X-Development') || '';
  const authHeader = request.headers.get('authorization') || '';

  if (!userId || !development) {
    try {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(/dev-user-config=([^;]+)/);
      if (match) {
        const config = JSON.parse(decodeURIComponent(match[1]));
        if (!userId) userId = config.user_id ?? config.userId ?? config.user_email ?? config.email ?? '';
        if (!development) development = config.development ?? config.developer ?? 'bodasdehoy';
      }
    } catch {
      // cookie malformada — continuar sin auth
    }
  }

  if (!development) development = 'bodasdehoy';

  const fetchHeaders: Record<string, string> = {
    'X-Development': development,
  };
  if (userId) fetchHeaders['X-User-ID'] = userId;
  if (authHeader) fetchHeaders['Authorization'] = authHeader;

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: fetchHeaders,
      method: 'GET',
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'Content-Type': contentType,
      },
      status: 200,
    });
  } catch (error: any) {
    console.error('[proxy-image] error:', error?.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
