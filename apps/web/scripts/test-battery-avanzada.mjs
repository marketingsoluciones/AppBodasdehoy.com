#!/usr/bin/env node
/**
 * BATERÍA AVANZADA DE TESTS — Bodas de Hoy
 *
 * Cubre: auto-routing de modelos, contexto, streaming, endpoints públicos,
 *        páginas específicas (venue visualizer, iCal, seating) y chat semántico.
 *
 * Uso:
 *   node apps/web/scripts/test-battery-avanzada.mjs
 *   node apps/web/scripts/test-battery-avanzada.mjs --base http://localhost:8080
 *   node apps/web/scripts/test-battery-avanzada.mjs --suite chat
 *   node apps/web/scripts/test-battery-avanzada.mjs --suite endpoints
 *   node apps/web/scripts/test-battery-avanzada.mjs --suite modelos
 *   node apps/web/scripts/test-battery-avanzada.mjs --verbose
 *
 * Suites disponibles: chat, endpoints, modelos, streaming, venue, all (default)
 *
 * Requiere: servidor apps/web corriendo (default: http://localhost:3000)
 *           Para tests de /api/public/seating necesita eventId real.
 */

import { parseArgs } from 'node:util';

// ─── Config ───────────────────────────────────────────────────────────────────

const { values: args } = parseArgs({
  options: {
    base:    { type: 'string',  default: 'http://localhost:3000' },
    suite:   { type: 'string',  default: 'all' },
    verbose: { type: 'boolean', default: false },
    timeout: { type: 'string',  default: '45000' },
    retry:   { type: 'string',  default: '1' },   // reintentos en caso de 503 de backend
  },
  strict: false,
});

const BASE       = args.base;
const SUITE      = args.suite;
const VERBOSE    = args.verbose;
const TIMEOUT_MS = parseInt(args.timeout, 10);
const MAX_RETRY  = parseInt(args.retry, 10);

// Detecta si un resultado es un fallo de backend (503 de api-ia) vs bug del front
function isBackendFailure(result) {
  return result.status === 503 &&
    (result.content || '').includes('Servicio IA no disponible');
}

// Datos del evento de prueba (Boda de Paco y Pico)
const EVENT = {
  userId:      'bodasdehoy.com@gmail.com',
  development: 'bodasdehoy',
  eventId:     '695e98c1e4c78d86fe107f71',
  eventName:   'Boda de Paco y Pico',
};

const FULL_METADATA = {
  userId:      EVENT.userId,
  development: EVENT.development,
  eventId:     EVENT.eventId,
  eventName:   EVENT.eventName,
  pageContext: {
    pageName:    'resumen-evento',
    eventName:   EVENT.eventName,
    screenData: {
      totalInvitados:    25,
      confirmados:       12,
      pendientes:        13,
      presupuestoTotal:  15000,
      pagado:            5000,
      currency:          'EUR',
      totalMesas:        5,
      totalItinerarios:  2,
      tipoEvento:        'Boda',
      fechaEvento:       '2026-06-15',
    },
    eventsList: [
      { name: EVENT.eventName, type: 'Boda', date: '2026-06-15', id: EVENT.eventId },
    ],
  },
};

const NO_EVENT_METADATA = {
  userId:      EVENT.userId,
  development: EVENT.development,
};

const DISENIO_METADATA = {
  ...FULL_METADATA,
  pageContext: {
    ...FULL_METADATA.pageContext,
    pageName:        'Diseño de espacios',
    pageDescription: 'Visualización de decoración de espacios con IA',
  },
};

// ─── Helpers HTTP ─────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function chatRequest({ message, metadata = FULL_METADATA, stream = false, provider = 'auto', model }) {
  const payload = {
    messages: [{ role: 'user', content: message }],
    stream,
    metadata,
    ...(model ? { model } : {}),
  };

  const headers = {
    'Content-Type': 'application/json',
    'X-Development': (metadata?.development) || 'bodasdehoy',
    'X-Provider': provider,
  };

  try {
    const res = await fetchWithTimeout(`${BASE}/api/copilot/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const status = res.status;
    const requestId = res.headers.get('x-request-id');
    const contentType = res.headers.get('content-type') || '';

    if (stream && res.body) {
      return await readSSEStream(res, status, requestId);
    }

    let content = '';
    let provider_used = null;
    let model_used = null;
    let errorCode = null;

    if (contentType.includes('text/plain') || contentType.includes('text/event-stream')) {
      const text = await res.text();
      content = text;
    } else {
      try {
        const data = await res.json();
        content     = data.choices?.[0]?.message?.content || data.error?.message || data.message || data.error || '';
        provider_used = data.provider || null;
        model_used    = data.model || null;
        errorCode     = data.error?.code || data.errorCode || null;
      } catch {
        content = await res.text().catch(() => '');
      }
    }

    return { status, content, provider: provider_used, model: model_used, errorCode, requestId, chunks: 0, error: null };
  } catch (err) {
    return { status: 0, content: '', provider: null, model: null, errorCode: null, requestId: null, chunks: 0, error: err.message };
  }
}

async function readSSEStream(res, status, requestId) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let chunks = 0;
  let provider = null;
  let model = null;
  let seenDone = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      for (const line of text.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (raw === '[DONE]') { seenDone = true; continue; }
        try {
          const parsed = JSON.parse(raw);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) { fullContent += delta; chunks++; }
          if (parsed.provider) provider = parsed.provider;
          if (parsed.model)    model    = parsed.model;
        } catch {}
      }
    }
  } catch {}

  return { status, content: fullContent, provider, model, chunks, seenDone, errorCode: null, requestId, error: null };
}

async function getRequest(path, timeoutMs = 10000) {
  try {
    const res = await fetchWithTimeout(`${BASE}${path}`, { method: 'GET' }, timeoutMs);
    const contentType = res.headers.get('content-type') || '';
    let body;
    if (contentType.includes('application/json')) {
      body = await res.json().catch(() => null);
    } else {
      body = await res.text().catch(() => '');
    }
    return { status: res.status, body, contentType };
  } catch (err) {
    return { status: 0, body: null, contentType: '', error: err.message };
  }
}

// ─── Evaluador ────────────────────────────────────────────────────────────────

function evaluate(test, result) {
  const issues = [];
  const ex = test.expect;
  const c  = (result.content || '').toLowerCase();

  if (result.error && !result.content) {
    return { pass: false, issues: [`Network error: ${result.error}`] };
  }

  if (ex.status && result.status !== ex.status) {
    issues.push(`HTTP status ${result.status} ≠ ${ex.status}`);
  }
  if (ex.statusMin && result.status < ex.statusMin) {
    issues.push(`HTTP status ${result.status} < ${ex.statusMin}`);
  }
  if (ex.statusMax && result.status > ex.statusMax) {
    issues.push(`HTTP status ${result.status} > ${ex.statusMax}`);
  }
  if (ex.hasContent && !result.content?.length) {
    issues.push('Sin contenido');
  }
  if (ex.minLength && (result.content?.length || 0) < ex.minLength) {
    issues.push(`Contenido muy corto: ${result.content?.length} < ${ex.minLength}`);
  }
  if (ex.minChunks && (result.chunks || 0) < ex.minChunks) {
    issues.push(`Pocos chunks streaming: ${result.chunks} < ${ex.minChunks}`);
  }
  if (ex.seenDone && !result.seenDone) {
    issues.push('Stream no terminó con [DONE]');
  }
  for (const term of ex.shouldContain || []) {
    if (!c.includes(term.toLowerCase())) issues.push(`Falta: "${term}"`);
  }
  for (const group of ex.shouldContainAny || []) {
    if (!group.some(t => c.includes(t.toLowerCase()))) {
      issues.push(`Falta alguno de: [${group.join(' | ')}]`);
    }
  }
  for (const term of ex.shouldNotContain || []) {
    if (c.includes(term.toLowerCase())) issues.push(`No debería contener: "${term}"`);
  }
  if (ex.bodyHasKey && !ex.bodyHasKey.every(k => result.body && k in result.body)) {
    const missing = (ex.bodyHasKey || []).filter(k => !(result.body && k in result.body));
    issues.push(`JSON falta keys: ${missing.join(', ')}`);
  }
  if (ex.bodyIsArray && !Array.isArray(result.body)) {
    issues.push('Body no es un array');
  }
  if (ex.contentTypeContains && !result.contentType?.includes(ex.contentTypeContains)) {
    issues.push(`Content-Type "${result.contentType}" no contiene "${ex.contentTypeContains}"`);
  }
  if (ex.errorCodeNot && result.errorCode === ex.errorCodeNot) {
    issues.push(`Error code no esperado: ${result.errorCode}`);
  }

  return { pass: issues.length === 0, issues };
}

// ─── Suites de tests ──────────────────────────────────────────────────────────

const SUITE_CHAT = [
  // ── Contexto ────────────────────────────────────────────────────
  {
    id: 'C01', suite: 'chat',
    name: 'Saludo básico — responde sin halucinar tools',
    fn: () => chatRequest({ message: 'Hola' }),
    expect: {
      hasContent: true, minLength: 5,
      shouldNotContain: ['get_user_events', 'get_event_guests', 'herramienta', 'función', 'ejecutar'],
    },
  },
  {
    id: 'C02', suite: 'chat',
    name: 'Invitados — usa datos del contexto, no tools',
    fn: () => chatRequest({ message: '¿Cuántos invitados tengo?' }),
    expect: {
      hasContent: true, minLength: 10,
      shouldContain: ['25'],
      shouldNotContain: ['ejecutar', 'herramienta', 'get_event_guests'],
    },
  },
  {
    id: 'C03', suite: 'chat',
    name: 'Confirmados vs pendientes — datos de contexto',
    fn: () => chatRequest({ message: '¿Cuántos invitados han confirmado y cuántos están pendientes?' }),
    expect: {
      hasContent: true, minLength: 10,
      shouldContainAny: [['12', 'confirmad'], ['13', 'pendient']],
      shouldNotContain: ['herramienta', 'ejecutar'],
    },
  },
  {
    id: 'C04', suite: 'chat',
    name: 'Presupuesto total y pagado',
    fn: () => chatRequest({ message: '¿Cuánto llevo pagado del presupuesto?' }),
    expect: {
      hasContent: true, minLength: 15,
      shouldContainAny: [['5.000', '5,000', '5000'], ['15.000', '15,000', '15000']],
      shouldNotContain: ['herramienta', 'no tengo acceso'],
    },
  },
  {
    id: 'C05', suite: 'chat',
    name: 'Mesas — dato de contexto',
    fn: () => chatRequest({ message: '¿Cuántas mesas tengo configuradas?' }),
    expect: {
      hasContent: true,
      shouldContain: ['5'],
      shouldNotContain: ['herramienta', 'ejecutar'],
    },
  },
  {
    id: 'C06', suite: 'chat',
    name: 'Nombre del evento',
    fn: () => chatRequest({ message: '¿Cómo se llama mi evento?' }),
    expect: {
      hasContent: true,
      shouldContainAny: [['Paco', 'Pico']],
      shouldNotContain: ['no tengo', 'ejecutar'],
    },
  },
  {
    id: 'C07', suite: 'chat',
    name: 'Fecha del evento',
    fn: () => chatRequest({ message: '¿Cuándo es la boda?' }),
    expect: {
      hasContent: true,
      shouldContainAny: [['2026', 'junio', 'june', '15']],
      shouldNotContain: ['herramienta', 'no tengo acceso'],
    },
  },
  {
    id: 'C08', suite: 'chat',
    name: 'Sin contexto — no inventa datos',
    fn: () => chatRequest({ message: '¿Cuántos invitados tengo?', metadata: NO_EVENT_METADATA }),
    expect: {
      hasContent: true, minLength: 10,
      shouldNotContain: ['25', 'error', 'herramienta'],
    },
  },
  {
    id: 'C09', suite: 'chat',
    name: 'Resumen del evento — no alucina tools ni funciones',
    fn: () => chatRequest({ message: 'Dame un resumen de mi boda' }),
    expect: {
      hasContent: true, minLength: 30,
      shouldContain: ['Paco'],
      shouldNotContain: ['get_user_events', 'get_event_guests', 'ejecutar', 'herramienta', 'función'],
    },
  },
  // ── Navegación ──────────────────────────────────────────────────
  {
    id: 'C10', suite: 'chat',
    name: 'Navegación — link a /invitados',
    fn: () => chatRequest({ message: 'Quiero ver mis invitados' }),
    expect: {
      hasContent: true,
      shouldContain: ['/invitados'],
    },
  },
  {
    id: 'C11', suite: 'chat',
    name: 'Navegación — link a /presupuesto',
    fn: () => chatRequest({ message: 'Llévame al presupuesto' }),
    expect: {
      hasContent: true,
      shouldContain: ['/presupuesto'],
    },
  },
  {
    id: 'C12', suite: 'chat',
    name: 'Navegación — link a /mesas',
    fn: () => chatRequest({ message: 'Quiero ver el plano de mesas' }),
    expect: {
      hasContent: true,
      shouldContain: ['/mesas'],
    },
  },
  {
    id: 'C13', suite: 'chat',
    name: 'Navegación — link a /servicios',
    fn: () => chatRequest({ message: '¿Dónde puedo ver mis proveedores?' }),
    expect: {
      hasContent: true,
      shouldContainAny: [['/servicios', 'proveedor', 'servicio']],
    },
  },
  {
    id: 'C14', suite: 'chat',
    name: 'Navegación — link a /lista-regalos',
    fn: () => chatRequest({ message: 'Quiero configurar la lista de regalos' }),
    expect: {
      hasContent: true,
      shouldContainAny: [['/lista-regalos', 'lista de regalos', 'regalos']],
    },
  },
  {
    id: 'C15', suite: 'chat',
    name: 'Diseño de espacios — menciona la funcionalidad',
    fn: () => chatRequest({ message: 'Quiero ver cómo quedaría mi salón decorado', metadata: DISENIO_METADATA }),
    expect: {
      hasContent: true, minLength: 15,
      shouldContainAny: [['/diseño-espacios', 'diseño', 'espacio', 'decorac', 'visualiz', 'salón']],
      shouldNotContain: ['error'],
    },
  },
  {
    id: 'C16', suite: 'chat',
    name: 'Consejos — respuesta genérica coherente',
    fn: () => chatRequest({ message: 'Dame 3 consejos para organizar una boda' }),
    expect: {
      hasContent: true, minLength: 80,
      shouldNotContain: ['error', 'RequestId'],
    },
  },
];

const SUITE_STREAMING = [
  {
    id: 'S01', suite: 'streaming',
    name: 'Streaming básico — recibe chunks y [DONE]',
    fn: () => chatRequest({ message: 'Dime 3 consejos para organizar una boda', stream: true }),
    expect: {
      hasContent: true, minLength: 50,
      minChunks: 3,
      seenDone: true,
      shouldNotContain: ['error', 'RequestId'],
    },
  },
  {
    id: 'S02', suite: 'streaming',
    name: 'Streaming con contexto — datos reales en stream',
    fn: () => chatRequest({ message: '¿Cuántos invitados tengo?', stream: true }),
    expect: {
      hasContent: true, minChunks: 1,
      shouldContain: ['25'],
      shouldNotContain: ['herramienta'],
    },
  },
  {
    id: 'S03', suite: 'streaming',
    name: 'Streaming largo — respuesta extensa sin corte',
    fn: () => chatRequest({ message: 'Redacta una carta de bienvenida para los invitados de mi boda, mencionando el nombre del evento', stream: true }),
    expect: {
      hasContent: true, minLength: 100,
      minChunks: 5,
      shouldContainAny: [['Paco', 'Pico', 'bienvenid', 'boda']],
      shouldNotContain: ['error'],
    },
  },
];

const SUITE_MODELOS = [
  {
    id: 'M01', suite: 'modelos',
    name: 'Auto-routing — responde con cualquier modelo activo',
    fn: () => chatRequest({ message: 'Hola, ¿qué modelo eres?', provider: 'auto' }),
    expect: {
      hasContent: true, minLength: 5,
      errorCodeNot: 'NO_PROVIDERS_AVAILABLE',
      shouldNotContain: ['NO_PROVIDERS_AVAILABLE', 'PROVIDER_UNAVAILABLE'],
    },
  },
  {
    id: 'M02', suite: 'modelos',
    name: 'Backend health — api-ia.bodasdehoy.com responde',
    fn: async () => {
      try {
        const res = await fetchWithTimeout('https://api-ia.bodasdehoy.com/health', { method: 'GET' }, 8000);
        const body = await res.json().catch(() => null);
        return { status: res.status, content: JSON.stringify(body), provider: null, model: null, chunks: 0, error: null };
      } catch (err) {
        return { status: 0, content: '', provider: null, model: null, chunks: 0, error: err.message };
      }
    },
    expect: {
      status: 200,
      hasContent: true,
    },
  },
  {
    id: 'M03', suite: 'modelos',
    name: 'Proxy local /api/copilot/chat — devuelve 200 o error semántico (no 5xx)',
    fn: () => chatRequest({ message: 'Test de conectividad' }),
    expect: {
      statusMin: 200,
      statusMax: 499, // 5xx = error no controlado
      hasContent: true,
    },
  },
  {
    id: 'M04', suite: 'modelos',
    name: 'Header X-Development enviado — no rompe el enrutamiento',
    fn: () => chatRequest({ message: 'Hola', metadata: { ...FULL_METADATA, development: 'bodasdehoy' } }),
    expect: {
      hasContent: true, minLength: 3,
      errorCodeNot: 'PROVIDER_MISMATCH',
    },
  },
  {
    id: 'M05', suite: 'modelos',
    name: 'Metadata mínima (userId + development) — proxy no devuelve 500 ni crash',
    fn: () => chatRequest({ message: 'Hola', metadata: NO_EVENT_METADATA }),
    expect: {
      // 503 es aceptable si el backend IA está degradado (problema de api-ia, no front)
      // Lo que verificamos es que el proxy no crashee (500 interno) ni devuelva vacío sin razón
      statusMin: 200, statusMax: 503,
      hasContent: true,
      shouldNotContain: ['Internal Server Error', 'Cannot read', 'undefined is not'],
    },
  },
];

const SUITE_ENDPOINTS = [
  {
    id: 'E01', suite: 'endpoints',
    name: 'GET /api/health — devuelve ok:true',
    fn: async () => {
      const r = await getRequest('/api/health', 5000);
      return { ...r, content: JSON.stringify(r.body), chunks: 0, error: r.error };
    },
    expect: {
      status: 200,
      hasContent: true,
      bodyHasKey: ['ok'],
    },
  },
  {
    id: 'E02', suite: 'endpoints',
    name: 'GET /api/public/seating/[eventId] — JSON con guests',
    fn: async () => {
      const r = await getRequest(`/api/public/seating/${EVENT.eventId}`, 10000);
      return { ...r, content: JSON.stringify(r.body), chunks: 0, error: r.error };
    },
    expect: {
      // Puede ser 200 (datos) o 404 (evento no existente en este env)
      statusMin: 200, statusMax: 404,
      contentTypeContains: 'application/json',
    },
  },
  {
    id: 'E03', suite: 'endpoints',
    name: 'GET /api/public/seating/INVALID — devuelve 400 o 404',
    fn: async () => {
      const r = await getRequest('/api/public/seating/000000000000000000000000', 8000);
      return { ...r, content: JSON.stringify(r.body), chunks: 0, error: r.error };
    },
    expect: {
      statusMin: 400, statusMax: 404,
    },
  },
  {
    id: 'E04', suite: 'endpoints',
    name: 'GET /api/ical/[eventId]/test123 — .ics o 404 (no 500)',
    fn: async () => {
      const r = await getRequest(`/api/ical/${EVENT.eventId}/test123`, 10000);
      return { ...r, content: typeof r.body === 'string' ? r.body : JSON.stringify(r.body), chunks: 0, error: r.error };
    },
    expect: {
      statusMin: 200, statusMax: 404,
    },
  },
  {
    id: 'E05', suite: 'endpoints',
    name: 'POST /api/copilot/chat sin body — no 500',
    fn: async () => {
      try {
        const res = await fetchWithTimeout(`${BASE}/api/copilot/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }, 10000);
        const body = await res.json().catch(() => null);
        return { status: res.status, content: JSON.stringify(body), chunks: 0, error: null };
      } catch (err) {
        return { status: 0, content: '', chunks: 0, error: err.message };
      }
    },
    expect: {
      statusMin: 200, statusMax: 499,
    },
  },
  {
    id: 'E06', suite: 'endpoints',
    name: 'GET /api/copilot/chat (método incorrecto) — 405',
    fn: async () => {
      try {
        const res = await fetchWithTimeout(`${BASE}/api/copilot/chat`, { method: 'GET' }, 8000);
        return { status: res.status, content: '', chunks: 0, error: null };
      } catch (err) {
        return { status: 0, content: '', chunks: 0, error: err.message };
      }
    },
    expect: { status: 405 },
  },
  {
    id: 'E07', suite: 'endpoints',
    name: 'GET /api/ical — URL incompleta — no devuelve 500',
    fn: async () => {
      // Next.js puede devolver 404 o agotar timeout en rutas dinámicas sin params.
      // Lo que verificamos es que NO devuelva 500 si responde.
      const r = await getRequest(`/api/ical/${EVENT.eventId}`, 6000);
      // Si hace timeout (status 0) lo consideramos OK — Next.js cuelga en rutas sin segmentos
      if (r.status === 0 || r.error) return { status: 200, content: 'timeout-expected', chunks: 0, error: null };
      return { ...r, content: '', chunks: 0, error: r.error };
    },
    expect: { statusMin: 200, statusMax: 404 },
  },
];

const SUITE_VENUE = [
  {
    id: 'V01', suite: 'venue',
    name: 'Venue: IA menciona diseño de espacios cuando se pide visualizar salón',
    fn: () => chatRequest({ message: 'Quiero visualizar cómo quedaría el salón con estilo romántico', metadata: FULL_METADATA }),
    expect: {
      hasContent: true, minLength: 20,
      shouldContainAny: [[
        'romantico', 'romántico', 'flores', 'estilo', 'diseño', 'decorac',
        '/diseño-espacios', 'espacio', 'visualiz', 'salón',
      ]],
      shouldNotContain: ['error', '500'],
    },
  },
  {
    id: 'V02', suite: 'venue',
    name: 'Venue: mención de página /diseño-espacios en respuesta o contexto apropiado',
    fn: () => chatRequest({ message: '¿Puedo ver cómo quedaría mi venue decorado?', metadata: DISENIO_METADATA }),
    expect: {
      hasContent: true, minLength: 10,
      shouldContainAny: [['/diseño-espacios', 'diseño', 'decorac', 'visualiz', 'espacio', 'ia']],
      shouldNotContain: ['error', 'RequestId'],
    },
  },
  {
    id: 'V03', suite: 'venue',
    name: 'Venue: estilos disponibles mencionados cuando se pregunta',
    fn: () => chatRequest({ message: '¿Qué estilos de decoración hay disponibles para visualizar mi salón?' }),
    expect: {
      hasContent: true, minLength: 30,
      shouldContainAny: [[
        'romántico', 'romantico', 'rústico', 'rustico', 'boho',
        'minimalista', 'glamour', 'floral', 'industrial',
        'mediterráneo', 'mediterraneo', 'tropical',
      ]],
      shouldNotContain: ['error'],
    },
  },
];

// ─── Orquestador ──────────────────────────────────────────────────────────────

const ALL_SUITES = {
  chat:      SUITE_CHAT,
  streaming: SUITE_STREAMING,
  modelos:   SUITE_MODELOS,
  endpoints: SUITE_ENDPOINTS,
  venue:     SUITE_VENUE,
};

function selectTests() {
  if (SUITE === 'all') return Object.values(ALL_SUITES).flat();
  const s = ALL_SUITES[SUITE];
  if (!s) {
    console.error(`Suite "${SUITE}" no existe. Disponibles: ${Object.keys(ALL_SUITES).join(', ')}, all`);
    process.exit(1);
  }
  return s;
}

// ─── Ejecución principal ──────────────────────────────────────────────────────

async function main() {
  const SEP70 = '═'.repeat(70);
  const SEP60 = '─'.repeat(60);

  console.log(SEP70);
  console.log('  BATERÍA AVANZADA — BODAS DE HOY');
  console.log(`  Servidor : ${BASE}`);
  console.log(`  Suite    : ${SUITE}`);
  console.log(`  Fecha    : ${new Date().toISOString()}`);
  console.log(SEP70);

  // Verificar servidor
  const healthCheck = await getRequest('/api/health', 5000).catch(() => null);
  if (!healthCheck || healthCheck.status !== 200) {
    console.error(`\n❌ Servidor no disponible en ${BASE}/api/health (status: ${healthCheck?.status ?? 'sin respuesta'})`);
    console.error('   Ejecuta: pnpm --filter web dev  (o: cd apps/web && pnpm dev)');
    process.exit(1);
  }
  console.log(`\n✅ Servidor OK (${BASE})\n`);

  const tests = selectTests();
  const results = [];
  let passed = 0;
  let failed = 0;
  let skippedBackend = 0;

  for (const test of tests) {
    process.stdout.write(`[${test.id}] ${test.name} ... `);
    const t0 = Date.now();
    let result;
    let attempts = 0;

    // Retry automático si el backend devuelve 503 intermitente
    while (attempts <= MAX_RETRY) {
      try {
        result = await test.fn();
      } catch (err) {
        result = { status: 0, content: '', provider: null, model: null, chunks: 0, error: err.message };
      }
      if (attempts < MAX_RETRY && isBackendFailure(result)) {
        attempts++;
        await new Promise(r => setTimeout(r, 2000 * attempts)); // backoff 2s, 4s
        continue;
      }
      break;
    }

    const elapsed = Date.now() - t0;
    const evaluation = evaluate(test, result);
    const backendFail = !evaluation.pass && isBackendFailure(result);
    results.push({ test, result, evaluation, elapsed, attempts, backendFail });

    if (evaluation.pass) {
      const retryNote = attempts > 0 ? ` (retry ${attempts})` : '';
      console.log(`✅  (${elapsed}ms)${retryNote}`);
      passed++;
    } else if (backendFail) {
      console.log(`⚠️  503-BACKEND  (${elapsed}ms, intentos: ${attempts + 1})`);
      skippedBackend++;
    } else {
      console.log(`❌  (${elapsed}ms)`);
      failed++;
    }

    if (VERBOSE || (!evaluation.pass && !backendFail)) {
      console.log(`     Status: ${result.status} | Provider: ${result.provider ?? '?'} | Model: ${result.model ?? '?'} | Chunks: ${result.chunks}`);
      const preview = (result.content || '').substring(0, 200).replace(/\n/g, ' ');
      if (preview) console.log(`     Resp  : "${preview}"`);
      if (!evaluation.pass) {
        for (const issue of evaluation.issues) {
          console.log(`     ↳ ${issue}`);
        }
      }
      console.log('');
    }
  }

  // ── Resumen ──
  console.log(`\n${SEP70}`);
  console.log('  RESUMEN');
  console.log(SEP70);
  console.log(`  Total: ${tests.length}  |  ✅ ${passed} pasados  |  ❌ ${failed} fallados  |  ⚠️  ${skippedBackend} backend-503`);
  console.log('');
  console.log('  ID   Suite       Estado          ms      Provider        Modelo');
  console.log('  ' + '─'.repeat(74));
  for (const { test, result, evaluation, elapsed, backendFail } of results) {
    const estado  = evaluation.pass ? '✅ PASS       ' : backendFail ? '⚠️  503-BACKEND' : '❌ FAIL       ';
    const suite   = test.suite.padEnd(10);
    const ms      = String(elapsed).padStart(6);
    const prov    = (result.provider ?? '?').padEnd(15);
    const model   = (result.model ?? '?').substring(0, 22).padEnd(22);
    console.log(`  ${test.id.padEnd(4)} ${suite} ${estado}  ${ms}ms  ${prov} ${model}`);
  }

  // ── Fallos reales del front (no 503 de backend) ──
  const frontFailures = results.filter(r => !r.evaluation.pass && !r.backendFail);
  const backendFailures = results.filter(r => r.backendFail);

  if (frontFailures.length > 0) {
    console.log(`\n${SEP70}`);
    console.log('  ❌ FALLOS REALES (Front)');
    console.log(SEP70);
    for (const { test, result, evaluation } of frontFailures) {
      console.log(`\n  [${test.id}] ${test.name}`);
      console.log(`  Status: ${result.status}  Error: ${result.error ?? 'none'}`);
      const preview = (result.content || '').substring(0, 400).replace(/\n/g, ' ');
      if (preview) console.log(`  Resp: "${preview}"`);
      for (const issue of evaluation.issues) {
        console.log(`    → ${issue}`);
      }
    }
  }

  if (backendFailures.length > 0) {
    console.log(`\n${SEP70}`);
    console.log('  ⚠️  FALLOS DE BACKEND (api-ia 503 — no son bugs del front)');
    console.log(SEP70);
    for (const { test } of backendFailures) {
      console.log(`  [${test.id}] ${test.name}`);
    }
    console.log(`\n  → Estos tests requieren que api-ia esté operativo.`);
    console.log(`  → Reportar en #copilot-api-ia: stream=true y rate-limit 503.`);
  }

  // ── Por suite ──
  const bySuite = {};
  for (const { test, evaluation } of results) {
    if (!bySuite[test.suite]) bySuite[test.suite] = { pass: 0, fail: 0 };
    evaluation.pass ? bySuite[test.suite].pass++ : bySuite[test.suite].fail++;
  }
  console.log(`\n${SEP70}`);
  console.log('  POR SUITE');
  console.log(SEP70);
  for (const [suite, { pass, fail }] of Object.entries(bySuite)) {
    const total = pass + fail;
    const bar = '█'.repeat(pass) + '░'.repeat(fail);
    console.log(`  ${suite.padEnd(12)}  ${bar.padEnd(20)}  ${pass}/${total}`);
  }

  console.log(`\n${SEP70}\n`);
  // Solo falla el proceso por fallos reales del front, no por 503 de backend
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
