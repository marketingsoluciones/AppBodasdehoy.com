import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const getBackendUrl = (): string =>
  process.env.PYTHON_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

/**
 * Proxy catch-all: /api/memories/[...path] → api-ia/api/memories/[...path]
 * Evita CORS cuando el browser llama desde chat-test.bodasdehoy.com o localhost.
 * Soporta JSON y multipart/form-data (subida de fotos).
 */
async function proxyRequest(request: NextRequest, path: string[]): Promise<NextResponse> {
  const backendUrl = getBackendUrl();
  const subpath = path.join('/');
  const { search } = new URL(request.url);
  const targetUrl = `${backendUrl}/api/memories/${subpath}${search}`;

  const headers: Record<string, string> = {};

  // Pasar headers relevantes al backend
  const auth = request.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const contentType = request.headers.get('content-type');

  try {
    // Pass content-type for non-multipart requests (multipart needs boundary from original)
    if (contentType && !contentType.includes('multipart/form-data')) {
      headers['Content-Type'] = contentType.split(';')[0].trim();
    }

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    let bodyToSend: BodyInit | undefined;
    if (hasBody) {
      // Read as arrayBuffer to avoid stream consumption issues
      bodyToSend = await request.arrayBuffer();
    }

    const response = await fetch(targetUrl, {
      body: bodyToSend,
      headers,
      method: request.method,
      signal: AbortSignal.timeout(30_000),
    });

    const responseContentType = response.headers.get('content-type') || '';
    const responseStatus = response.status;

    if (responseContentType.includes('application/json')) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: responseStatus });
    } else if (responseContentType.startsWith('image/') || responseContentType.startsWith('video/') || responseContentType.startsWith('audio/')) {
      // Binary media — pass through as-is
      const buf = await response.arrayBuffer();
      return new NextResponse(buf, {
        headers: { 'Content-Type': responseContentType },
        status: responseStatus,
      });
    } else {
      // text/html, text/plain, or unknown error — always return JSON so client can parse
      const text = await response.text().catch(() => `HTTP ${responseStatus}`);
      return NextResponse.json(
        { detail: text || `HTTP ${responseStatus}` },
        { status: responseStatus },
      );
    }
  } catch (error: any) {
    console.error(`❌ [memories proxy] ${request.method} ${targetUrl}:`, error?.message || error);
    return NextResponse.json(
      { detail: error?.message || 'Error interno del proxy memories' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}
