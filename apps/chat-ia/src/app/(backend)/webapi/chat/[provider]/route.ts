import {
  AGENT_RUNTIME_ERROR_SET,
  ChatCompletionErrorPayload,
  ModelRuntime,
} from '@lobechat/model-runtime';
import { ChatErrorType } from '@lobechat/types';

import { checkAuth } from '@/app/(backend)/middleware/auth';
import { getSupportKey } from '@/const/supportKeys';
import { createTraceOptions, initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';
import { ChatStreamPayload } from '@/types/openai/chat';
import { createErrorResponse } from '@/utils/errorResponse';
import { getTracePayload } from '@/utils/trace';
import { resolveServerBackendOrigin } from '@/const/backendEndpoints';

export const maxDuration = 300;

// Configuración del backend - Siempre usa api-ia.bodasdehoy.com (no hay backend local)
const getPythonBackendUrl = (): string => {
  return resolveServerBackendOrigin();
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
 * System prompt comercial para visitantes — se fuerza en el proxy para que api-ia
 * reciba siempre el prompt correcto, sin importar lo que el frontend envíe.
 * Duplicado de services/chat/index.ts:127-148 (fuente de verdad del frontend).
 */
const VISITOR_SYSTEM_PROMPT =
  'Eres un asistente comercial de Bodas de Hoy, la plataforma líder para organizar bodas y eventos en España.\n\n' +
  'MODO: VISITANTE NO REGISTRADO — SOLO RESPUESTAS COMERCIALES.\n\n' +
  'TU ÚNICO OBJETIVO es:\n' +
  '1. Despertar el interés del visitante en la plataforma.\n' +
  '2. Presentar los beneficios de registrarse (gestión de invitados, presupuesto, mesas, itinerario, chat IA 24/7).\n' +
  '3. Conseguir sus datos de contacto (nombre, teléfono o email) para que el equipo haga seguimiento.\n' +
  '4. Invitarle a crear una cuenta gratuita en: https://app.bodasdehoy.com/login?q=register\n\n' +
  'REGLAS ESTRICTAS:\n' +
  '- NO respondas preguntas técnicas detalladas de planificación (presupuestos, listas de invitados, proveedores, etc.). Esas son funciones exclusivas de usuarios registrados.\n' +
  '- Si el usuario pregunta cómo hacer algo específico, dile que esa función está disponible en la plataforma al registrarse y anímale a probarla gratis.\n' +
  '- Sé cálido, empático y orientado a ventas. Usa emojis con moderación.\n' +
  '- Pide datos de contacto de forma natural, NO insistente — solo una vez por conversación.\n' +
  '- Si el usuario da su teléfono o email, agradécelo, dile que el equipo le contactará pronto y ofrece el enlace de registro.\n' +
  '- NUNCA menciones funciones de facturación, API, configuración técnica ni paneles de administración.\n\n' +
  'BENEFICIOS CLAVE QUE PUEDES MENCIONAR:\n' +
  '✅ Gestión completa de invitados y confirmaciones\n' +
  '✅ Mapa de mesas interactivo\n' +
  '✅ Control de presupuesto en tiempo real\n' +
  '✅ Itinerario del evento\n' +
  '✅ Asistente IA personalizado disponible 24/7\n' +
  '✅ Página web del evento personalizada\n\n' +
  'Enlace de registro: https://app.bodasdehoy.com/login?q=register';

/**
 * Techo de mensajes para visitantes en el backend (seguridad).
 * La lógica real es en cliente: 5 el primer día, 2/día después (ver @/utils/visitorLimit).
 * Configurable via VISITOR_MSG_LIMIT_CAP env var (útil para dev/test).
 */
const VISITOR_MSG_LIMIT_CAP = parseInt(process.env.VISITOR_MSG_LIMIT_CAP || '10', 10);

/**
 * Verifica si la request viene de un visitante anónimo y si superó el techo.
 * Los visitantes tienen userId con prefijo "visitor_" (sin Firebase auth → sin JWT válido).
 * El cliente aplica 5 mensajes día 1 y 2/día; aquí solo evitamos abusos.
 */
function checkVisitorLimit(req: Request): Response | null {
  const userId = req.headers.get('X-User-ID') ?? '';

  if (!userId.startsWith('visitor_')) return null;

  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/vis_mc=(\d+)/);
  const msgCount = match ? parseInt(match[1], 10) : 0;

  if (msgCount >= VISITOR_MSG_LIMIT_CAP) {
    return new Response(
      JSON.stringify({
        error: {
          message: 'Has alcanzado el límite de mensajes gratuitos. Crea una cuenta para continuar.',
          type: 'login_required',
        },
        errorType: 'login_required',
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 401 },
    );
  }

  return null;
}

/**
 * Bloquea requests cuando el cliente indica sesión expirada (X-Session-Expired: 1).
 * Devuelve 401 session_expired para que el frontend muestre el banner de re-login.
 * La cookie JWT puede seguir activa en el servidor aunque el cliente la haya marcado
 * como expirada — este check evita el data leak.
 */
function checkSessionExpired(req: Request): Response | null {
  const sessionExpired = req.headers.get('X-Session-Expired');
  if (sessionExpired !== '1') return null;

  const userId = req.headers.get('X-User-ID') ?? '';
  console.warn(`[chat-proxy] ⛔ Sesión expirada (userId="${userId}") — request bloqueado antes de llegar a api-ia`);

  return new Response(
    JSON.stringify({
      error: {
        message: 'Tu sesión ha expirado. Inicia sesión para continuar gestionando tu evento.',
        type: 'session_expired',
      },
      errorType: 'session_expired',
    }),
    { headers: { 'Content-Type': 'application/json' }, status: 401 },
  );
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

    // Enforce sistema prompt comercial para visitantes y roles sin acceso a datos
    const userId = req.headers.get('X-User-ID') ?? '';
    const userRole = req.headers.get('X-User-Role') ?? '';
    const isRestrictedAccess =
      userId.startsWith('visitor_') ||
      userRole === 'guest' ||
      userRole === 'invited' ||
      userRole === 'invitado';
    if (isRestrictedAccess) {
      try {
        const parsed = JSON.parse(bodyText);
        if (Array.isArray(parsed.messages)) {
          const sysIdx = parsed.messages.findIndex((m: any) => m.role === 'system');
          if (sysIdx >= 0) {
            parsed.messages[sysIdx].content = VISITOR_SYSTEM_PROMPT;
          } else {
            parsed.messages.unshift({ content: VISITOR_SYSTEM_PROMPT, role: 'system' });
          }
          bodyText = JSON.stringify(parsed);
        }
      } catch {
        // Si no se puede parsear, continuar sin modificar
      }
    }

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

    // Inyectar X-Support-Key para que api-ia pueda resolver la API key del developer vía MCP
    if (!headers['X-Support-Key'] && !headers['x-support-key']) {
      const dev = req.headers.get('x-development') || 'bodasdehoy';
      headers['X-Support-Key'] = getSupportKey(dev);
    }

    // Extraer JWT de cookie si no hay Authorization
    // Prioridad: 1) cookie api2_jwt (dedicada)
    //            2) cookie dev-user-config.token (JWT de MCP guardado tras login)
    // ⚠️ idTokenV0.1.0 NO se usa aquí: es Firebase ID token para SSO cross-app,
    //    NO un JWT de MCP — enviarlo a api-ia causaría fallo de verificación JWT.
    if (!headers['Authorization'] && !headers['authorization']) {
      try {
        const cookieHeader = req.headers.get('cookie') || '';

        // 1) Cookie dedicada api2_jwt
        const jwtMatch = cookieHeader.match(/api2_jwt=([^;]+)/);
        if (jwtMatch) {
          const jwt = decodeURIComponent(jwtMatch[1]);
          if (jwt && jwt.startsWith('eyJ')) {
            headers['Authorization'] = `Bearer ${jwt}`;
          }
        }

        // 2) Fallback: dev-user-config.token (JWT de MCP)
        if (!headers['Authorization']) {
          const match = cookieHeader.match(/dev-user-config=([^;]+)/);
          if (match) {
            const decoded = decodeURIComponent(match[1]);
            if (decoded.startsWith('{')) {
              const config = JSON.parse(decoded);
              if (config.token && (config.token as string).startsWith('eyJ')) {
                headers['Authorization'] = `Bearer ${config.token}`;
              }
            }
          }
        }
      } catch {
        // Continuar sin auth
      }
    }

    // SEGURIDAD CRÍTICA: Si el acceso es restringido (visitor/guest/invited),
    // eliminar CUALQUIER Authorization header antes de reenviar a api-ia.
    // El visitante puede tener una cookie SSO activa de sesión previa en .bodasdehoy.com,
    // lo cual haría que api-ia lo autentique y devuelva datos reales de usuarios registrados.
    if (isRestrictedAccess) {
      delete headers['Authorization'];
      delete headers['authorization'];
      console.warn(`[chat-proxy] ⚠️ Acceso restringido (userId="${userId}" role="${userRole}") — Authorization ELIMINADO para api-ia`);
    }

    // DEBUG: verificar si Authorization se envía a api-ia
    const authSnippet = headers['Authorization'] ? 'Bearer ' + headers['Authorization'].slice(7, 27) + '...' : 'NONE';
    console.log(`[chat-proxy] → ${provider} | Auth: ${authSnippet} | Support-Key: ${headers['X-Support-Key'] ? 'YES' : 'NO'}`);

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
              error: {
                message: 'Crea una cuenta gratuita para continuar usando el asistente IA.',
                type: 'login_required',
              },
              errorType: 'login_required',
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 401 }
          );
        }

        if (backendResponse.status === 429) {
          // Límite de mensajes alcanzado (guest, daily cap o velocity throttle)
          // api-ia devuelve: {"error": "...", "message": "...", "screen_type": "...", "reset_at": "ISO"}
          let message = 'Has alcanzado el límite diario de mensajes. Regístrate gratis para continuar sin límites.';
          let screen_type: string | undefined;
          let reset_at: string | undefined;
          try {
            // El body puede venir como SSE: "data: {...}\n\ndata: [DONE]" o JSON plano
            const cleanText = errorText.replaceAll(/^data:\s*/gm, '').replaceAll('[DONE]', '').trim();
            const parsed = JSON.parse(cleanText.split('\n')[0] || cleanText);
            const detail = parsed?.detail;
            // Aceptar campos en top-level o anidados en detail (FastAPI HTTPException)
            if (detail?.message) message = String(detail.message);
            else if (parsed?.message) message = String(parsed.message);
            screen_type = typeof detail?.screen_type === 'string' ? detail.screen_type
              : typeof parsed?.screen_type === 'string' ? parsed.screen_type : undefined;
            reset_at = typeof detail?.reset_at === 'string' ? detail.reset_at
              : typeof parsed?.reset_at === 'string' ? parsed.reset_at : undefined;
          } catch { /* usar mensaje por defecto */ }
          return new Response(
            JSON.stringify({
              body: { message, reset_at, screen_type, type: 'rate_limit' },
              errorType: 'rate_limit',
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 429 }
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
          let screen_type: string | undefined;
          let recharge_url: string | undefined;
          let plans_url: string | undefined;
          try {
            const parsed = JSON.parse(errorText);
            const detail = parsed?.detail;
            // FastAPI HTTPException anida el detalle en "detail"; aceptar también top-level
            if (typeof detail === 'string') {
              message = detail;
            } else if (typeof detail === 'object') {
              if (detail?.message) message = String(detail.message);
              else if (detail?.error) message = String(detail.error);
              // screen_type, recharge_url y plans_url vienen dentro del objeto detail
              if (typeof detail.screen_type === 'string') screen_type = detail.screen_type;
              if (typeof detail.recharge_url === 'string') recharge_url = detail.recharge_url;
              if (typeof detail.plans_url === 'string') plans_url = detail.plans_url;
            }
            // Fallback: campos a nivel raíz (algunos handlers de api-ia devuelven así)
            if (!screen_type && typeof parsed?.screen_type === 'string') screen_type = parsed.screen_type;
          } catch { /* usar mensaje por defecto */ }
          // Devolver en formato LobeChat ErrorResponse (errorType + body con detail/screen_type para la UI)
          return new Response(
            JSON.stringify({
              body: { message, plans_url, recharge_url, screen_type, type: 'insufficient_balance' },
              errorType: 'insufficient_balance',
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 402 }
          );
        }

        if (backendResponse.status === 503) {
          let message = 'Servicio no disponible. Intenta de nuevo en unos momentos.';
          let screen_type: string | undefined;
          try {
            const parsed = JSON.parse(errorText);
            const detail = parsed?.detail;
            screen_type = typeof parsed?.screen_type === 'string' ? parsed.screen_type : undefined;
            if (typeof detail === 'string') message = detail;
            else if (typeof detail === 'object' && detail?.message) message = String(detail.message);
          } catch { /* usar mensaje por defecto */ }
          return new Response(
            JSON.stringify({
              body: { message, screen_type, type: 'service_unavailable' },
              errorType: 'ServiceUnavailable',
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 503 }
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
                    switch (currentEvent) {
                    case 'text': {
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
                    
                    break;
                    }
                    case 'done': {
                      // Stream terminado — cerrar sin emitir (fetchSSE detecta el close)
                      controller.close();
                      return;
                    }
                    case 'tool_calls': {
                      // Translate api-ia function names to LobeChat builtin format.
                      // api-ia sends e.g. { function: { name: "filter_view" } } but LobeChat expects
                      // the full schema name "lobe-filter-app-view____filter_view____builtin".
                      // Without this translation, LobeChat treats it as a default plugin call,
                      // triggers a second AI request, and overwrites the text response with empty content.
                      const BUILTIN_TOOL_MAP: Record<string, string> = {
                        
                        
'add_note': 'lobe-crm-actions____add_note____builtin',
                        


'complete_task': 'lobe-crm-actions____complete_task____builtin',
                        

// CRM Actions
'create_lead': 'lobe-crm-actions____create_lead____builtin',
                        'create_task': 'lobe-crm-actions____create_task____builtin',
                        

// Filter
'filter_view': 'lobe-filter-app-view____filter_view____builtin',
                        


'get_campaign_performance': 'lobe-crm-analytics____get_campaign_performance____builtin',
                        


'get_contact': 'lobe-crm____get_contact____builtin',
                        



'get_kpis': 'lobe-crm-analytics____get_kpis____builtin',
                        




'get_lead': 'lobe-crm____get_lead____builtin',
                        
                        



'get_lead_funnel': 'lobe-crm-analytics____get_lead_funnel____builtin',
                        



'get_opportunity': 'lobe-crm____get_opportunity____builtin',
                        


// CRM Analytics
'get_pipeline_summary': 'lobe-crm-analytics____get_pipeline_summary____builtin',
                        


'get_revenue_report': 'lobe-crm-analytics____get_revenue_report____builtin',
                        


'get_tasks': 'lobe-crm-actions____get_tasks____builtin',
                        


'list_campaigns': 'lobe-crm____list_campaigns____builtin',
                        
                        

'list_contacts': 'lobe-crm____list_contacts____builtin',
                        
// CRM Data
'list_leads': 'lobe-crm____list_leads____builtin',
                        
'list_opportunities': 'lobe-crm____list_opportunities____builtin',
                        
'search_crm': 'lobe-crm____search_crm____builtin',
                        
'send_message': 'lobe-crm-actions____send_message____builtin',

                        'update_lead_status': 'lobe-crm-actions____update_lead_status____builtin',
                        'update_opportunity_stage': 'lobe-crm-actions____update_opportunity_stage____builtin',
                        'update_task': 'lobe-crm-actions____update_task____builtin',
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
                    
                    break;
                    }
                    case 'reasoning': {
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
                    
                    break;
                    }
                    case 'tool_start': 
                    case 'tool_result': 
                    case 'event_card': {
                      // Enriquecer UI con resultados de tools (tarjetas, imágenes, tablas...)
                      controller.enqueue(
                        encoder.encode(`event: ${currentEvent}\ndata: ${rawData}\n\n`)
                      );
                    
                    break;
                    }
                    // No default
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

    // Short-circuit: sesión expirada señalada por el cliente → bloquear antes de api-ia
    const sessionExpiredResponse = checkSessionExpired(req);
    if (sessionExpiredResponse) return sessionExpiredResponse;

    // Short-circuit: rechazar visitantes que superaron el límite sin llamar a api-ia
    const visitorLimitResponse = checkVisitorLimit(req);
    if (visitorLimitResponse) return visitorLimitResponse;

    // Intentar proxy al backend Python primero
    const proxyResponse = await proxyToPythonBackend(req.clone(), provider);
    if (proxyResponse) {
      return proxyResponse;
    }

    // Si USE_PYTHON_BACKEND está activo (no 'false'), el proxy DEBERÍA haber respondido.
    // Si retornó null inesperadamente (error en SSE, catch interno, etc.), NO hacer fallback
    // al ModelRuntime de LobeChat — eso requiere OPENAI_API_KEY y muestra "auto API Key is incorrect".
    // En su lugar, devolver un error descriptivo para que el usuario sepa qué pasó.
    if (process.env.USE_PYTHON_BACKEND !== 'false') {
      console.error(`[chat-proxy] ❌ proxyToPythonBackend retornó null inesperadamente (provider="${provider}"). El backend Python está activo pero el proxy falló sin respuesta.`);
      return new Response(
        JSON.stringify({
          body: { message: 'El asistente IA no está disponible en este momento. Intenta de nuevo en unos segundos.', type: 'service_unavailable' },
          errorType: 'ServiceUnavailable',
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 503 },
      );
    }

    // Fallback: usar lógica original con checkAuth (solo cuando USE_PYTHON_BACKEND=false explícito)
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
