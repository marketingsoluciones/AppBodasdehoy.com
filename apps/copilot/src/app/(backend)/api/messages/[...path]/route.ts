import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const getBackendUrl = (): string =>
  process.env.PYTHON_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

/**
 * Proxy catch-all: /api/messages/[...path] → api-ia/api/messages/[...path]
 * Evita CORS cuando el browser llama desde chat-test.bodasdehoy.com o localhost.
 */
async function proxyRequest(request: NextRequest, path: string[]): Promise<NextResponse> {
  const backendUrl = getBackendUrl();
  const subpath = path.join('/');
  const { search } = new URL(request.url);
  const targetUrl = `${backendUrl}/api/messages/${subpath}${search}`;

  const headers: Record<string, string> = {};

  const auth = request.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const contentType = request.headers.get('content-type');

  try {
    if (contentType && !contentType.includes('multipart/form-data')) {
      headers['Content-Type'] = contentType.split(';')[0].trim();
    }

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    let bodyToSend: BodyInit | undefined;
    if (hasBody) {
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
    } else {
      const text = await response.text().catch(() => `HTTP ${responseStatus}`);
      return NextResponse.json(
        { detail: text || `HTTP ${responseStatus}` },
        { status: responseStatus },
      );
    }
  } catch (error: any) {
    console.error(`❌ [messages proxy] ${request.method} ${targetUrl}:`, error?.message || error);
    return NextResponse.json(
      { detail: error?.message || 'Error interno del proxy messages' },
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
