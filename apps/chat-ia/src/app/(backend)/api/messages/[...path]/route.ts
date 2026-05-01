import { NextRequest, NextResponse } from 'next/server';

import { resolveServerBackendOrigin } from '@/const/backendEndpoints';
import { resolveMcpOrigin } from '@/const/mcpEndpoints';

export const runtime = 'nodejs';

const getApiIaUrl = (): string => resolveServerBackendOrigin();

const getMcpOrigin = (): string =>
  process.env.API_MCP_ORIGIN || process.env.API2_URL || resolveMcpOrigin() || 'https://api3-mcp-graphql.eventosorganizador.com';

/**
 * Proxy catch-all: /api/messages/[...path]
 *
 * Arquitectura objetivo: TODO pasa por api-ia (orquestador).
 *
 * TEMPORAL (hasta que api-ia implemente GAP 1 del RFC 2026-03-05):
 *   /api/messages/whatsapp/* → MCP /api/whatsapp/*  (Baileys QR personal)
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
 *       y /api/messages/whatsapp/session/:dev, eliminar el bloque whatsapp→mcp.
 */
async function proxyRequest(request: NextRequest, path: string[]): Promise<NextResponse> {
  const subpath = path.join('/');
  const reqUrl = new URL(request.url);
  const { search } = reqUrl;

  let targetUrl: string;
  if (subpath.startsWith('whatsapp/')) {
    // TEMPORAL: WhatsApp Baileys va directo a API MCP hasta que api-ia lo orqueste
    const mcpPath = subpath.replace(/^whatsapp\//, '');
    targetUrl = `${getMcpOrigin()}/api/whatsapp/${mcpPath}${search}`;
  } else {
    // api-ia expone conversations/{id} sin el sufijo /messages — normalizar el path
    const normalizedSubpath = subpath.replace(/^(conversations\/[^/]+)\/messages$/, '$1');
    targetUrl = `${getApiIaUrl()}/api/messages/${normalizedSubpath}${search}`;
  }

  // Propagar headers de autenticación y contexto completos
  const headers: Record<string, string> = {};

  // EventSource no puede enviar headers custom → admitir token como query param
  const tokenFromQuery = reqUrl.searchParams.get('token');
  const auth = request.headers.get('authorization') || (tokenFromQuery ? `Bearer ${tokenFromQuery}` : null);
  if (auth) headers['Authorization'] = auth;

  const xDev = request.headers.get('x-development') || reqUrl.searchParams.get('development');
  if (xDev) headers['X-Development'] = xDev;

  const xUserId = request.headers.get('x-user-id');
  if (xUserId) headers['X-User-ID'] = xUserId;

  const xRole = request.headers.get('x-role');
  if (xRole) headers['X-Role'] = xRole;

  const contentType = request.headers.get('content-type');
  const acceptHeader = request.headers.get('accept') || '';
  const isSSE = subpath === 'stream' || acceptHeader.includes('text/event-stream');

  try {
    if (contentType && !contentType.includes('multipart/form-data')) {
      headers['Content-Type'] = contentType.split(';')[0].trim();
    }
    if (isSSE) headers['Accept'] = 'text/event-stream';

    const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
    let bodyToSend: ArrayBuffer | undefined;
    if (hasBody) {
      bodyToSend = await request.arrayBuffer();
    }

    const isWhatsappSession = /^whatsapp\/session\//.test(subpath);

    const response = await fetch(targetUrl, {
      body: bodyToSend,
      headers,
      method: request.method,
      // SSE: sin timeout. Session status: 5s (Baileys puede tardar 8s+ si está reconectando). Resto: 30s.
      signal: isSSE
        ? undefined
        : AbortSignal.timeout(isWhatsappSession ? 5000 : 30_000),
    });

    const responseContentType = response.headers.get('content-type') || '';
    const responseStatus = response.status;

    // SSE: hacer streaming transparente al cliente
    if (isSSE && responseContentType.includes('text/event-stream') && response.body) {
      return new NextResponse(response.body, {
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': 'text/event-stream',
          'X-Accel-Buffering': 'no',
        },
        status: responseStatus,
      });
    }

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
