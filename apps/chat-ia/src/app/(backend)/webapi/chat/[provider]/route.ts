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

/** Límite de mensajes para visitantes anónimos (sin cuenta) */
const VISITOR_MSG_LIMIT = 3;

/**
 * Verifica si la request viene de un visitante anónimo y si superó su límite.
 * Los visitantes tienen userId con prefijo "visitor_" (sin Firebase auth → sin JWT válido).
 * Devuelve una Response de rechazo si aplica, null si el request puede continuar.
 */
function checkVisitorLimit(req: Request): Response | null {
  const userId = req.headers.get('X-User-ID') ?? '';

  // Solo aplica a usuarios visitantes (visitor_<timestamp>_<rand>)
  if (!userId.startsWith('visitor_')) return null;

  // Leer contador de mensajes desde cookie (incrementado por el cliente)
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/vis_mc=(\d+)/);
  const msgCount = match ? parseInt(match[1], 10) : 0;

  if (msgCount >= VISITOR_MSG_LIMIT) {
    return new Response(
      JSON.stringify({
        errorType: 'login_required',
        error: {
          message: 'Has alcanzado el límite de mensajes gratuitos. Crea una cuenta para continuar.',
          type: 'login_required',
        },
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 401 },
    );
  }

  return null;
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

        if (backendResponse.status === 401) {
          // Usuario no autenticado → mostrar modal de registro en lugar de "unauthorized"
          // Esto ocurre cuando community users sin JWT intentan usar la IA
          return new Response(
            JSON.stringify({
              errorType: 'login_required',
              error: {
                message: 'Crea una cuenta gratuita para continuar usando el asistente IA.',
                type: 'login_required',
              },
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 401 }
          );
        }

        if (backendResponse.status === 402) {
          const allowNegative = process.env.ALLOW_NEGATIVE_BALANCE === 'true';
          if (allowNegative) {
            // Modo saldo negativo: pasar al runtime nativo de LobeChat como fallback.
            // El runtime nativo usará OPENAI_API_KEY del servidor (variable de entorno).
            // El frontend detectará negativeBalanceMode: true y mostrará el banner de deuda.
            console.warn(`⚠️ [402] Saldo insuficiente — modo deuda activo, fallback a runtime nativo para ${provider}`);
            return null; // Cae al runtime nativo con OPENAI_API_KEY del servidor
          }
          // Modo estricto (por defecto): NO hacer fallback al runtime nativo
          let message = 'Saldo insuficiente. Recarga tu cuenta para continuar usando el asistente.';
          try {
            const parsed = JSON.parse(errorText);
            const detail = parsed?.detail;
            // FastAPI HTTPException devuelve detail como objeto o string
            if (typeof detail === 'string') {
              message = detail;
            } else if (typeof detail === 'object' && detail?.error) {
              message = String(detail.error);
            } else if (typeof detail === 'object' && detail?.message) {
              message = String(detail.message);
            }
          } catch { /* usar mensaje por defecto */ }
          // Devolver en formato LobeChat ErrorResponse (errorType + error)
          // parseError.ts usa data.errorType para construir ChatMessageError.type
          return new Response(
            JSON.stringify({
              errorType: 'insufficient_balance',
              error: { message, type: 'insufficient_balance' },
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 402 }
          );
        }

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

        // Para otros errores 4xx/5xx del backend, reenviar la respuesta tal cual
        // en lugar de hacer fallback al runtime nativo (que bypassearía validaciones del backend)
        if (backendResponse.status >= 400) {
          return new Response(errorText || JSON.stringify({ error: { status: backendResponse.status, type: 'backend_error' } }), {
            headers: { 'Content-Type': backendResponse.headers.get('content-type') || 'application/json' },
            status: backendResponse.status,
          });
        }

        return null; // Fallback a lógica original solo si no hay error de backend
      }

      // Transformar SSE del backend a formato OpenAI-compatible que LobeChat espera.
      // Soporta dos formatos de backend:
      //   A) Formato custom (event: text/done): backend propio con eventos nombrados
      //   B) Formato estándar OpenAI (data: {...}): chunks directos sin event prefix
      const contentType = backendResponse.headers.get('content-type') || '';
      const isCustomSSE = contentType.includes('text/event-stream');

      if (isCustomSSE && backendResponse.body) {
        const reader = backendResponse.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';
        let chunkIndex = 0;
        // null = aún no detectado, 'custom' = event:/data: pairs, 'openai' = data: directo
        let sseMode: 'custom' | 'openai' | null = null;

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
                const trimmedLine = line.trimEnd(); // Elimina \r en CRLF
                if (trimmedLine.startsWith('event: ')) {
                  currentEvent = trimmedLine.slice(7).trim();
                  if (sseMode === null) sseMode = 'custom';
                } else if (trimmedLine.startsWith('data: ')) {
                  const rawData = trimmedLine.slice(6);

                  if (sseMode === null) {
                    // Auto-detectar formato en el primer data: sin event: previo
                    sseMode = currentEvent ? 'custom' : 'openai';
                  }

                  if (sseMode === 'custom' && currentEvent) {
                    // Formato A: backend propio con event: text / event: done
                    // Re-emitir como event: text para que fetchSSE lo procese correctamente
                    if (currentEvent === 'text') {
                      let text: string = rawData;
                      try {
                        const parsed = JSON.parse(rawData);
                        // If parsed is an object with a .text string (e.g. Anthropic content_delta
                        // {"type":"text_delta","text":"..."}) extract the string to avoid [object Object].
                        // Otherwise use the parsed value directly (expected to be a string).
                        if (typeof parsed === 'object' && parsed !== null && typeof parsed.text === 'string') {
                          text = parsed.text;
                        } else {
                          text = parsed;
                        }
                      } catch {
                        // rawData is plain text, use as-is
                      }
                      // fetchSSE procesa ev.event='text' con data como string JSON
                      controller.enqueue(
                        encoder.encode(`event: text\ndata: ${JSON.stringify(text)}\n\n`)
                      );
                      chunkIndex++;
                    } else if (currentEvent === 'done') {
                      // Stream terminado — cerrar sin emitir (fetchSSE detecta el close)
                      controller.close();
                      return;
                    } else if (currentEvent === 'tool_calls') {
                      // Translate api-ia function names to LobeChat builtin format.
                      // api-ia sends e.g. { function: { name: "filter_view" } } but LobeChat expects
                      // the full schema name "lobe-filter-app-view____filter_view____builtin".
                      // Without this translation, LobeChat treats it as a default plugin call,
                      // triggers a second AI request, and overwrites the text response with empty content.
                      const BUILTIN_TOOL_MAP: Record<string, string> = {
                        'filter_view': 'lobe-filter-app-view____filter_view____builtin',
                        'visualize_venue': 'lobe-venue-visualizer____visualize_venue____builtin',
                      };
                      let translatedData = rawData;
                      try {
                        const toolCalls = JSON.parse(rawData) as Array<{ function?: { name?: string } }>;
                        const translated = toolCalls.map((tc) => {
                          const fnName = tc.function?.name;
                          if (fnName && BUILTIN_TOOL_MAP[fnName]) {
                            return { ...tc, function: { ...tc.function, name: BUILTIN_TOOL_MAP[fnName] } };
                          }
                          return tc;
                        });
                        translatedData = JSON.stringify(translated);
                      } catch {
                        // Parse failed — forward as-is
                      }
                      controller.enqueue(
                        encoder.encode(`event: tool_calls\ndata: ${translatedData}\n\n`)
                      );
                    } else if (currentEvent === 'reasoning') {
                      // Reasoning/thinking progress — muestra el bloque de "pensando" en el chat
                      // api-ia envía {text: "..."} pero fetchSSE espera un string JSON.
                      // Extraer .text si es objeto para evitar "[object Object]" en el bloque de razonamiento.
                      let reasoningData = rawData;
                      try {
                        const parsed = JSON.parse(rawData);
                        if (typeof parsed === 'object' && parsed !== null && typeof parsed.text === 'string') {
                          reasoningData = JSON.stringify(parsed.text);
                        }
                      } catch {
                        // rawData es texto plano, usar tal cual
                      }
                      controller.enqueue(
                        encoder.encode(`event: reasoning\ndata: ${reasoningData}\n\n`)
                      );
                    } else if (currentEvent === 'tool_start' || currentEvent === 'tool_result' || currentEvent === 'event_card') {
                      // Enriquecer UI con resultados de tools (tarjetas, imágenes, tablas...)
                      controller.enqueue(
                        encoder.encode(`event: ${currentEvent}\ndata: ${rawData}\n\n`)
                      );
                    }
                    currentEvent = '';
                  } else if (sseMode === 'openai') {
                    // Formato B: SSE estándar OpenAI → convertir a formato LobeChat (event: text)
                    // fetchSSE procesa por ev.event; sin event: prefix, ev.event es undefined → switch no matchea
                    if (rawData === '[DONE]') {
                      controller.close();
                      return;
                    }
                    try {
                      const parsed = JSON.parse(rawData);
                      const content = parsed?.choices?.[0]?.delta?.content;
                      if (content) {
                        // Re-emitir como event: text para que fetchSSE lo procese
                        controller.enqueue(
                          encoder.encode(`event: text\ndata: ${JSON.stringify(content)}\n\n`)
                        );
                      }
                      // Emitir usage si viene en el chunk
                      if (parsed?.usage) {
                        controller.enqueue(
                          encoder.encode(`event: usage\ndata: ${JSON.stringify(parsed.usage)}\n\n`)
                        );
                      }
                    } catch {
                      // Chunk inválido — ignorar
                    }
                  }
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

    // Short-circuit: rechazar visitantes que superaron el límite sin llamar a api-ia
    const visitorLimitResponse = checkVisitorLimit(req);
    if (visitorLimitResponse) return visitorLimitResponse;

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
