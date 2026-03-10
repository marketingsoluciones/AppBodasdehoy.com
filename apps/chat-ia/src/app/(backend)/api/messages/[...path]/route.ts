import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const getApiIaUrl = (): string =>
  process.env.PYTHON_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://api-ia.bodasdehoy.com';

const getApi2Url = (): string =>
  process.env.API2_URL || 'https://api2.eventosorganizador.com';

/**
 * Proxy catch-all: /api/messages/[...path]
 *
 * Arquitectura objetivo: TODO pasa por api-ia (orquestador).
 *
 * TEMPORAL (hasta que api-ia implemente GAP 1 del RFC 2026-03-05):
 *   /api/messages/whatsapp/* → api2 /api/whatsapp/*  (Baileys QR personal)
 *
 * Definitivo:
 *   todo lo demás → api-ia /api/messages/*
 *
 * Canales soportados (todos via api-ia excepto whatsapp):
 *   /api/messages/instagram/*  → api-ia (OAuth + Graph API)
 *   /api/messages/telegram/*   → api-ia (Bot Token + Bot API)
 *   /api/messages/email/*      → api-ia (SMTP/IMAP o OAuth Gmail/Outlook)
 *   /api/messages/web/*        → api-ia (Widget embebible + SSE)
 *
 * TODO: Cuando api-ia implemente /api/messages/conversations con datos Baileys
 *       y /api/messages/whatsapp/session/:dev, eliminar el bloque whatsapp→api2.
 */
async function proxyRequest(request: NextRequest, path: string[]): Promise<NextResponse> {
  const subpath = path.join('/');
  const { search } = new URL(request.url);

  let targetUrl: string;
  if (subpath.startsWith('whatsapp/')) {
    // TEMPORAL: WhatsApp Baileys va directo a api2 hasta que api-ia lo orqueste
    const api2Path = subpath.replace(/^whatsapp\//, '');
    targetUrl = `${getApi2Url()}/api/whatsapp/${api2Path}${search}`;
  } else {
    targetUrl = `${getApiIaUrl()}/api/messages/${subpath}${search}`;
  }

  // Propagar headers de autenticación y contexto completos
  const headers: Record<string, string> = {};

  const auth = request.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  // X-Development y X-User-ID permiten a api2/api-ia aplicar
  // visibilidad por rol (admin ve todo, user ve solo lo suyo)
  const xDev = request.headers.get('x-development');
  if (xDev) headers['X-Development'] = xDev;

  const xUserId = request.headers.get('x-user-id');
  if (xUserId) headers['X-User-ID'] = xUserId;

  const xRole = request.headers.get('x-role');
  if (xRole) headers['X-Role'] = xRole;

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
