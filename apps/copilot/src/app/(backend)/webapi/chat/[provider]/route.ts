import {
  AGENT_RUNTIME_ERROR_SET,
  ChatCompletionErrorPayload,
  ModelRuntime,
} from '@lobechat/model-runtime';
import { ChatErrorType } from '@lobechat/types';

import { checkAuth } from '@/app/(backend)/middleware/auth';
import { createTraceOptions, initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';
import { ChatStreamPayload } from '@/types/openai/chat';
import { createErrorResponse } from '@/utils/errorResponse';
import { getTracePayload } from '@/utils/trace';

export const maxDuration = 300;

// Configuración del backend - Siempre usa api-ia.bodasdehoy.com (no hay backend local)
const getPythonBackendUrl = (): string => {
  return process.env.PYTHON_BACKEND_URL
    || process.env.NEXT_PUBLIC_BACKEND_URL
    || 'https://api-ia.bodasdehoy.com';
};

// Cache de URL para evitar recalcular en cada request
let cachedBackendUrl: string | null = null;

/**
 * Elimina original_provider del payload de forma eficiente
 * OPTIMIZADO: Una sola pasada con JSON.parse/delete/stringify
 */
function cleanPayload(bodyText: string): string {
  try {
    const parsed = JSON.parse(bodyText);

    // Función recursiva para limpiar objetos
    const cleanObject = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj;

      if (Array.isArray(obj)) {
        return obj.map(cleanObject);
      }

      const cleaned: any = {};
      for (const key in obj) {
        if (key !== 'original_provider' && key !== 'originalProvider') {
          cleaned[key] = cleanObject(obj[key]);
        }
      }
      return cleaned;
    };

    return JSON.stringify(cleanObject(parsed));
  } catch {
    // Si no es JSON válido, hacer limpieza con regex simple
    return bodyText
      .replaceAll(/"original_provider"\s*:\s*"[^"]*"\s*,?\s*/g, '')
      .replaceAll(/"originalProvider"\s*:\s*"[^"]*"\s*,?\s*/g, '')
      .replaceAll(/,\s*}/g, '}')
      .replaceAll(/{\s*,/g, '{');
  }
}

/**
 * Handler que hace proxy directo al backend Python
 */
async function proxyToPythonBackend(req: Request, provider: string): Promise<Response | null> {
  // Usar URL cacheada o calcular
  const currentBackendUrl = cachedBackendUrl || (cachedBackendUrl = getPythonBackendUrl());

  if (process.env.USE_PYTHON_BACKEND === 'false') {
    return null;
  }

  if (!currentBackendUrl) {
    return null;
  }

  try {
    new URL(currentBackendUrl);
  } catch {
    console.error(`❌ [502] URL del backend Python inválida: ${currentBackendUrl}`);
    return new Response(
      JSON.stringify({
        error: {
          message: `URL del backend Python inválida: ${currentBackendUrl}`,
          type: 'invalid_backend_url',
        },
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 502 }
    );
  }

  try {
    // Obtener y limpiar body
    let bodyText = await req.text();
    bodyText = cleanPayload(bodyText);

    // Reconstruir headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    req.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['host', 'connection', 'content-length', 'transfer-encoding'].includes(lowerKey)) {
        headers[key] = value;
      }
    });

    // Extraer JWT de cookie si no hay Authorization
    if (!headers['Authorization'] && !headers['authorization']) {
      try {
        const cookieHeader = req.headers.get('cookie');
        if (cookieHeader) {
          const match = cookieHeader.match(/dev-user-config=([^;]+)/);
          if (match) {
            const decoded = decodeURIComponent(match[1]);
            if (decoded.startsWith('{')) {
              const config = JSON.parse(decoded);
              if (config.token) {
                headers['Authorization'] = `Bearer ${config.token}`;
              }
            }
          }
        }
      } catch {
        // Continuar sin auth
      }
    }

    // Timeout de 60 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    const fetchUrl = `${currentBackendUrl}/webapi/chat/${provider}`;

    try {
      const backendResponse = await fetch(fetchUrl, {
        body: bodyText,
        headers,
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text().catch(() => '');
        console.error(
          `❌ [502] Backend IA error: status=${backendResponse.status} url=${fetchUrl} body=${errorText.slice(0, 300)}`
        );

        if (backendResponse.status === 502) {
          return new Response(
            JSON.stringify({
              error: {
                details: `Backend: ${currentBackendUrl}. Revisa que api-ia.bodasdehoy.com esté operativo.`,
                message: 'Backend IA no disponible (502). Intenta de nuevo en unos momentos.',
                type: 'backend_unavailable',
              },
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 502 }
          );
        }

        return null; // Fallback a lógica original
      }

      // Transformar SSE del backend (event: text/done) a formato OpenAI-compatible
      // que LobeChat espera (data: {"choices":[{"delta":{"content":"..."}}]})
      const contentType = backendResponse.headers.get('content-type') || '';
      const isCustomSSE = contentType.includes('text/event-stream');

      if (isCustomSSE && backendResponse.body) {
        const reader = backendResponse.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';
        let chunkIndex = 0;

        const transformedStream = new ReadableStream({
          cancel() {
            reader.cancel();
          },
          async pull(controller) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                // No enviar [DONE] — LobeChat no lo parsea como JSON y lanza error
                controller.close();
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              let currentEvent = '';
              for (const line of lines) {
                if (line.startsWith('event: ')) {
                  currentEvent = line.slice(7).trim();
                } else if (line.startsWith('data: ') && currentEvent) {
                  const rawData = line.slice(6);

                  if (currentEvent === 'text') {
                    // Extraer el texto del data (puede ser JSON string o texto plano)
                    let text = rawData;
                    try {
                      text = JSON.parse(rawData);
                    } catch {
                      // Es texto plano, usar tal cual
                    }

                    const openAIChunk = {
                      choices: [{ delta: { content: text }, finish_reason: null, index: 0 }],
                      created: Math.floor(Date.now() / 1000),
                      id: `chatcmpl-proxy-${chunkIndex++}`,
                      model: 'auto',
                      object: 'chat.completion.chunk',
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
                  } else if (currentEvent === 'done') {
                    const doneChunk = {
                      choices: [{ delta: {}, finish_reason: 'stop', index: 0 }],
                      created: Math.floor(Date.now() / 1000),
                      id: `chatcmpl-proxy-${chunkIndex++}`,
                      model: 'auto',
                      object: 'chat.completion.chunk',
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneChunk)}\n\n`));
                    controller.close();
                    return;
                  }
                  currentEvent = '';
                }
              }
            } catch (err) {
              controller.error(err);
            }
          },
        });

        return new Response(transformedStream, {
          headers: {
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'text/event-stream',
          },
          status: 200,
        });
      }

      // Si no es SSE custom, pasar tal cual (ya en formato OpenAI)
      return new Response(backendResponse.body, {
        headers: {
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Type': backendResponse.headers.get('content-type') || 'application/json',
        },
        status: backendResponse.status,
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            error: {
              message: 'La solicitud tardó más de 60 segundos. Intenta con una pregunta más específica.',
              type: 'timeout',
            },
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 504 }
        );
      }

      const isConnectionError =
        fetchError.message?.includes('ECONNREFUSED') ||
        fetchError.message?.includes('fetch failed') ||
        fetchError.message?.includes('ENOTFOUND');

      if (isConnectionError) {
        console.error(
          `❌ [502] No se pudo conectar al backend IA: url=${fetchUrl} error=${fetchError?.message || fetchError}`
        );
        return new Response(
          JSON.stringify({
            error: {
              backend_url: currentBackendUrl,
              details: fetchError?.message || String(fetchError),
              message: 'No se pudo conectar al backend IA (api-ia.bodasdehoy.com). Intenta de nuevo.',
              type: 'network_error',
            },
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 502 }
        );
      }

      return null;
    }
  } catch (proxyError: any) {
    console.warn(`⚠️ Error en proxy: ${proxyError.message}`);
    return null;
  }
}

/**
 * Handler principal del chat
 */
export const POST = async (req: Request, { params }: { params: Promise<{ provider: string }> }) => {
  try {
    const { provider } = await params;

    // Intentar proxy al backend Python primero
    const proxyResponse = await proxyToPythonBackend(req.clone(), provider);
    if (proxyResponse) {
      return proxyResponse;
    }

    // Fallback: usar lógica original con checkAuth
    return checkAuth(async (authReq: Request, { jwtPayload, createRuntime }) => {
      const bodyText = await authReq.text();

      try {
        let modelRuntime: ModelRuntime;
        if (createRuntime) {
          modelRuntime = createRuntime(jwtPayload);
        } else {
          modelRuntime = await initModelRuntimeWithUserPayload(provider, jwtPayload);
        }

        const data = JSON.parse(bodyText) as ChatStreamPayload;
        delete (data as any).original_provider;
        delete (data as any).originalProvider;

        const tracePayload = getTracePayload(authReq);
        let traceOptions = {};
        if (tracePayload?.enabled) {
          traceOptions = createTraceOptions(data, { provider, trace: tracePayload });
        }

        return await modelRuntime.chat(data, {
          user: jwtPayload.userId,
          ...traceOptions,
          signal: authReq.signal,
        });
      } catch (e) {
        const {
          errorType = ChatErrorType.InternalServerError,
          error: errorContent,
          ...res
        } = e as ChatCompletionErrorPayload;

        const error = errorContent || e;
        const logMethod = AGENT_RUNTIME_ERROR_SET.has(errorType as string) ? 'warn' : 'error';
        console[logMethod](`Route: [${provider}] ${errorType}:`, error);

        return createErrorResponse(errorType, { error, ...res, provider });
      }
    })(req, { params });
  } catch (error: any) {
    console.error(`❌ [502] Error no manejado en /webapi/chat: ${error?.message}`, error?.stack?.slice(0, 500));

    return new Response(
      JSON.stringify({
        error: {
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          message: 'Error interno del servidor. Intenta de nuevo más tarde.',
          type: 'internal_server_error',
        },
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 502 }
    );
  }
};
