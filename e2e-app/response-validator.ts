/**
 * response-validator.ts
 *
 * Módulo de clasificación y validación de respuestas IA para Playwright E2E.
 *
 * Reemplaza las assertions "fake green" (reply.length > 20) con validación
 * inteligente que clasifica la respuesta por categoría y compara contra
 * expectativas concretas por escenario.
 *
 * Patrones de AUTH_PATTERNS copiados de:
 *   apps/chat-ia/src/features/Conversation/Messages/Assistant/MessageContent.tsx:22-45
 * Scoring compatible con:
 *   apps/chat-ia/src/features/DevPanel/Playground/index.tsx:197-229
 */

import { Page, expect } from '@playwright/test';
import {
  shouldAbort,
  attachHttpInterceptor,
  clearLastHttpError,
  getLastHttpError,
  recordFailure,
  recordSuccess,
} from './circuit-breaker';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ResponseCategory =
  | 'greeting'       // Saludo genérico sin datos
  | 'auth_required'  // Pide login/registro
  | 'needs_event'    // Pregunta qué evento usar
  | 'tool_executed'  // Ejecutó tools, devolvió datos
  | 'tool_failed'    // Intentó tools pero falló
  | 'data_response'  // Respuesta con datos concretos (sin tool UI visible)
  | 'error'          // Error de app (500, timeout)
  | 'empty';         // Sin respuesta

export interface ToolDetection {
  apiName: string;
  isLoading: boolean;
}

export interface ChatResponse {
  text: string;
  category: ResponseCategory;
  toolsDetected: ToolDetection[];
  timing: { durationMs: number };
}

export interface TestExpectation {
  expectedCategory: ResponseCategory | readonly ResponseCategory[];
  requiredKeywords?: string[];
  forbiddenPatterns?: (string | RegExp)[];
  requiresToolExecution?: boolean;
  expectedTools?: string[];
  description?: string;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  message: string;
  response: ChatResponse;
  warnings: string[];
}

// ─── Capability misreport detection ─────────────────────────────────────────
// La IA a veces dice que no puede hacer algo que SÍ puede.
// Chat-ia tiene: web-browsing (SearXNG), tools de eventos, floor-plan-editor.

const CAPABILITY_LIES: { pattern: RegExp; truth: string }[] = [
  {
    pattern: /no (?:tengo|puedo|tiene?)\s+(?:la\s+)?capacidad\s+de\s+buscar.*internet/i,
    truth: 'Chat-ia SÍ tiene web-search (SearXNG + lobe-web-browsing plugin, botón globo)',
  },
  {
    pattern: /no puedo\s+(?:acceder|buscar)\s+(?:en\s+)?internet\s+en\s+tiempo\s+real/i,
    truth: 'Chat-ia SÍ puede buscar en internet via SearXNG (web-browsing tool)',
  },
  {
    pattern: /no tengo acceso\s+a\s+internet/i,
    truth: 'Chat-ia tiene plugin web-browsing activo con SearXNG',
  },
];

// ─── AUTH_PATTERNS (mirror of MessageContent.tsx:22-45) ──────────────────────

const AUTH_PATTERNS: RegExp[] = [
  /necesitas\s+[\s\w]*iniciar\s+sesi[oó]n/i,
  /necesitas\s+(una\s+cuenta|registrarte)/i,
  /necesito\s+que\s+te\s+registres/i,
  /debes?\s+(registrarte|iniciar\s+sesi[oó]n)/i,
  /tienes\s+que\s+(registrarte|iniciar\s+sesi[oó]n)/i,
  /bot[oó]n\s+de\s+["']?(iniciar\s+sesi[oó]n|registr)/i,
  /["']?registrarse\s+(gratis|ahora)["']?/i,
  /registr(arte|es)\s+(primero|para\s+continuar)/i,
  /inicia\s+sesi[oó]n\s+(primero|para\s+continuar)/i,
  /para\s+(crear|guardar|continuar)\s+.*(necesitas|registr)/i,
  /una\s+vez\s+que\s+te\s+hayas\s+registrado/i,
  /despu[eé]s\s+de\s+registrarte/i,
  /sesi[oó]n\s+ha\s+expirado/i,
  /session_expired/i,
];

// ─── Classifier ──────────────────────────────────────────────────────────────

/**
 * Clasifica la respuesta del chat IA por categoría usando una cadena de regex
 * ordenada por prioridad.
 */
export function classifyResponse(
  text: string,
  toolsDetected: ToolDetection[],
): ResponseCategory {
  // 1. empty
  if (text.trim().length < 15) return 'empty';

  // 2. error — errores de app o HTTP interceptados
  if (/Error 500|ErrorBoundary|TIMEOUT_ERROR|AUTO_ROUTING_ERROR|Internal Server Error/i.test(text)) {
    return 'error';
  }
  if (/^\[HTTP \d{3}\]/.test(text)) {
    return 'error';
  }

  // 3. auth_required — usa los mismos patrones que MessageContent.tsx
  if (AUTH_PATTERNS.some((p) => p.test(text))) {
    return 'auth_required';
  }

  // 4. Detect implicit tool execution from streaming phase text
  const hasStreamingPhases = /Analizando tu solicitud|Consultando tus eventos|Formulando tu respuesta|Ejecutando/i.test(text);
  const hasTools = toolsDetected.length > 0 || hasStreamingPhases;

  // 4a. tool_failed — tools detectados + señales de error
  if (hasTools && /error|fallo|no pude|no he podido|problema|couldn't|failed|no puedo acceder/i.test(text)) {
    return 'tool_failed';
  }

  // 5. tool_executed — tools detectados con resultado (no loading)
  if (hasTools && (toolsDetected.some((t) => !t.isLoading) || hasStreamingPhases)) {
    return 'tool_executed';
  }

  // 6. needs_event — pregunta por evento
  if (/qu[eé]\s+evento|cu[aá]l\s+evento|selecciona.*evento|elige.*evento|indica.*evento/i.test(text)) {
    return 'needs_event';
  }

  // 7. data_response — números y datos concretos
  if (/\d+\s*(invitado|mesa|tarea|servicio|proveedor)|presupuesto.*\d|€|\d+\s*EUR/i.test(text)) {
    return 'data_response';
  }

  // 8. greeting — saludo genérico + texto corto
  if (
    /I am your.*assistant|How can I assist|ayudarte|bienvenid|en qu[eé] puedo|c[oó]mo puedo ayudar/i.test(text) &&
    text.length < 300
  ) {
    return 'greeting';
  }

  // Default: si hay datos pero no encaja arriba → data_response
  if (text.length > 100) return 'data_response';

  return 'greeting';
}

// ─── Tool detection via DOM ──────────────────────────────────────────────────

/**
 * Detecta tools ejecutados en el DOM de LobeChat.
 * Inspector/index.tsx renderiza `span[class*="apiName"]` con el nombre de la tool.
 * También detecta loading state via `shinyText` class (shimmer animation).
 */
export async function detectToolsInDOM(page: Page): Promise<ToolDetection[]> {
  return page.evaluate(() => {
    const tools: { apiName: string; isLoading: boolean }[] = [];

    // Buscar spans con clase que contenga "apiName" (Inspector component)
    const apiNameSpans = document.querySelectorAll('span[class*="apiName"]');
    apiNameSpans.forEach((span) => {
      const name = span.textContent?.trim() ?? '';
      if (name) {
        // shinyText class = loading/streaming
        const container = span.closest('[class*="container"]');
        const isLoading = container
          ? container.querySelector('[class*="shinyText"]') !== null
          : false;
        tools.push({ apiName: name, isLoading });
      }
    });

    // Fallback: buscar en artículos con tool-call patterns (EN + ES)
    if (tools.length === 0) {
      const articles = document.querySelectorAll('article');
      articles.forEach((article) => {
        const text = article.textContent ?? '';
        // Tool call UI patterns — English
        const toolMatchEn = text.match(/(?:Using|Calling|Running)\s+(\w+)/i);
        if (toolMatchEn) {
          tools.push({ apiName: toolMatchEn[1], isLoading: false });
        }
        // Tool call UI patterns — Spanish (LobeChat streaming phases)
        // "Analizando tu solicitud..." / "Consultando tus eventos..." / "Formulando tu respuesta..."
        const toolMatchEs = text.match(/(?:Analizando|Consultando|Formulando|Ejecutando|Buscando)/i);
        if (toolMatchEs) {
          tools.push({ apiName: toolMatchEs[0].toLowerCase(), isLoading: false });
        }
      });
    }

    // Fallback 2: buscar ToolTitle component (div con class "tool" que contiene texto de función)
    if (tools.length === 0) {
      const toolDivs = document.querySelectorAll('[class*="tool"]');
      toolDivs.forEach((div) => {
        const text = div.textContent?.trim() ?? '';
        // Tool names suelen ser snake_case: get_user_events, add_guest, etc.
        const fnMatch = text.match(/\b(get_\w+|add_\w+|update_\w+|delete_\w+|create_\w+|list_\w+|search_\w+)\b/);
        if (fnMatch) {
          tools.push({ apiName: fnMatch[1], isLoading: false });
        }
      });
    }

    return tools;
  });
}

// ─── Assertion ───────────────────────────────────────────────────────────────

/**
 * Valida una ChatResponse contra una TestExpectation.
 * Produce mensajes claros para debug.
 */
export function assertExpectation(
  response: ChatResponse,
  expectation: TestExpectation,
): ValidationResult {
  const { text, category, toolsDetected } = response;
  const {
    expectedCategory,
    requiredKeywords = [],
    forbiddenPatterns = [],
    requiresToolExecution = false,
    expectedTools = [],
    description = '',
  } = expectation;

  const expectedCategories = Array.isArray(expectedCategory)
    ? expectedCategory
    : [expectedCategory];

  const errors: string[] = [];
  const warnings: string[] = [];
  let categoryScore = 0;
  let keywordScore = 0;

  // ── Capability lie detection (warnings, no fail) ──
  for (const { pattern, truth } of CAPABILITY_LIES) {
    if (pattern.test(text)) {
      warnings.push(`⚠️ IA miente sobre capacidades: ${truth}`);
    }
  }

  // ── Category check (60% of score) ──
  const categoryMatch = expectedCategories.includes(category);
  if (categoryMatch) {
    categoryScore = 60;
  } else {
    errors.push(
      `Expected [${expectedCategories.join('|')}], got "${category}"`,
    );
  }

  // ── Keyword check (40% of score) ──
  const textLower = text.toLowerCase();
  if (requiredKeywords.length > 0) {
    const found = requiredKeywords.filter((kw) =>
      textLower.includes(kw.toLowerCase()),
    );
    const missing = requiredKeywords.filter(
      (kw) => !textLower.includes(kw.toLowerCase()),
    );
    keywordScore = (found.length / requiredKeywords.length) * 40;
    if (missing.length > 0) {
      errors.push(`Missing keywords: ${missing.join(', ')}`);
    }
  } else {
    // No keywords required → full score for this section
    keywordScore = 40;
  }

  // ── Forbidden patterns ──
  const forbiddenHits: string[] = [];
  for (const pattern of forbiddenPatterns) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    if (regex.test(text)) {
      forbiddenHits.push(typeof pattern === 'string' ? pattern : pattern.source);
    }
  }
  if (forbiddenHits.length > 0) {
    errors.push(`Forbidden hit: "${forbiddenHits.join('", "')}"`);
    // Penalize 15 points per forbidden hit (up to 30)
    keywordScore = Math.max(0, keywordScore - forbiddenHits.length * 15);
  }

  // ── Tool execution check ──
  if (requiresToolExecution && toolsDetected.length === 0) {
    errors.push('No tools detected but requiresToolExecution=true');
    categoryScore = Math.max(0, categoryScore - 20);
  }

  // ── Expected tools ──
  if (expectedTools.length > 0) {
    const detectedNames = toolsDetected.map((t) => t.apiName.toLowerCase());
    const missingTools = expectedTools.filter(
      (t) => !detectedNames.some((d) => d.includes(t.toLowerCase())),
    );
    if (missingTools.length > 0) {
      errors.push(`Missing tools: ${missingTools.join(', ')}`);
    }
  }

  const score = Math.round(categoryScore + keywordScore);
  const passed = errors.length === 0 && score >= 70;

  const prefix = passed ? '✅ PASS' : '❌ FAIL';
  const descLine = description ? `\n   ${description}` : '';
  const categoryLine = `\n   Category: ${category} (expected: [${expectedCategories.join('|')}])`;
  const scoreLine = `\n   Score: ${score}/100`;
  const toolLine =
    toolsDetected.length > 0
      ? `\n   Tools: ${toolsDetected.map((t) => `${t.apiName}${t.isLoading ? ' (loading)' : ''}`).join(', ')}`
      : '';
  const errorLines = errors.map((e) => `\n   → ${e}`).join('');
  const warningLines = warnings.map((w) => `\n   ${w}`).join('');
  const timingLine = `\n   Duration: ${response.timing.durationMs}ms`;

  const message =
    `${prefix}: ${descLine}${categoryLine}${scoreLine}${toolLine}${errorLines}${warningLines}${timingLine}`;

  return { passed, score, message, response, warnings };
}

// ─── chatWithValidation (Playwright integration) ─────────────────────────────

/**
 * Envía un mensaje al chat, espera la respuesta, clasifica y valida.
 * Versión validada de la función `chat()` existente en el spec.
 *
 * @param page - Playwright Page
 * @param text - Mensaje a enviar
 * @param expectation - Expectativas de la respuesta
 * @param waitMs - Timeout máximo para esperar respuesta
 * @returns ValidationResult con toda la info
 */
export async function chatWithValidation(
  page: Page,
  text: string,
  expectation: TestExpectation,
  waitMs = 60_000,
): Promise<ValidationResult> {
  // ── Circuit breaker: abortar si ya tripeó ──
  const { abort, reason } = shouldAbort();
  if (abort) {
    const abortResponse: ChatResponse = {
      text: `[Circuit Breaker] ${reason}`,
      category: 'error',
      toolsDetected: [],
      timing: { durationMs: 0 },
    };
    const abortResult = assertExpectation(abortResponse, expectation);
    console.log(`⚡ CIRCUIT BREAKER — skipping chat: ${reason}`);
    return abortResult;
  }

  const startTime = Date.now();

  // ── Preparar interceptor HTTP ──
  clearLastHttpError();
  attachHttpInterceptor(page);

  // ── Enviar mensaje (misma lógica que chat() en el spec) ──
  const ta = page.locator('div[contenteditable="true"]').last();
  await ta.waitFor({ state: 'visible', timeout: 20_000 });
  await ta.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(text, { delay: 25 });
  await page.keyboard.press('Enter');

  // ── Esperar respuesta (polling) ──
  const deadline = Date.now() + waitMs;
  const msgSelector = 'article';
  let lastText = '';

  await page.waitForTimeout(5_000);

  // Patrones del welcome message de LobeChat que NO son respuestas reales
  const WELCOME_PATTERNS = [
    /I am your.*(?:personal|intelligent).*assistant/i,
    /How can I assist you today/i,
    /click \+ to create a custom assistant/i,
    /Soy tu asistente.*inteligente/i,
  ];

  while (Date.now() < deadline) {
    const articles = await page.locator(msgSelector).allTextContents();
    const assistantMsgs = articles.filter((t) => {
      const trimmed = t.trim();
      if (trimmed.length <= 5) return false;
      // Filtrar mensajes del propio usuario (bidireccional, case-insensitive)
      const userPrefix = text.trim().slice(0, 40).toLowerCase();
      const artPrefix = trimmed.slice(0, 40).toLowerCase();
      if (artPrefix.startsWith(userPrefix.slice(0, 25))) return false;
      if (userPrefix.startsWith(artPrefix.slice(0, 25))) return false;
      // Filtrar welcome message de LobeChat (no es respuesta real)
      if (WELCOME_PATTERNS.some((p) => p.test(trimmed)) && trimmed.length < 250) return false;
      return true;
    });
    const joined = assistantMsgs.join('\n').trim();
    if (joined.length > 10 && joined === lastText) {
      break; // Respuesta estable
    }
    lastText = joined;
    await page.waitForTimeout(2_000);
  }

  // Si no captamos nada después de filtrar welcome, verificar si solo había welcome message
  if (lastText.length <= 10) {
    const allArticles = await page.locator(msgSelector).allTextContents();
    const welcomeOnly = allArticles.some((t) => WELCOME_PATTERNS.some((p) => p.test(t)));
    if (welcomeOnly) {
      // La IA solo devolvió welcome message → marcar como greeting para diagnóstico
      lastText = allArticles.filter((t) => t.trim().length > 5).join('\n').trim();
    }
  }

  const durationMs = Date.now() - startTime;

  // ── Si respuesta vacía y hay error HTTP interceptado, inyectar info ──
  const httpErr = getLastHttpError();
  if (lastText.trim().length < 15 && httpErr) {
    lastText = `[HTTP ${httpErr.status}] ${httpErr.errorType}: ${httpErr.message}`;
    console.log(`[Circuit Breaker] Respuesta vacia + HTTP ${httpErr.status} -> inyectando: ${httpErr.message}`);
  }

  // ── Detectar tools en DOM ──
  const toolsDetected = await detectToolsInDOM(page);

  // ── Clasificar ──
  const category = classifyResponse(lastText, toolsDetected);

  const chatResponse: ChatResponse = {
    text: lastText,
    category,
    toolsDetected,
    timing: { durationMs },
  };

  // ── Validar ──
  const result = assertExpectation(chatResponse, expectation);

  // ── Registrar en circuit breaker ──
  if (category === 'error' || category === 'empty') {
    const errCategory = httpErr?.category ?? 'network';
    recordFailure({
      status: httpErr?.status ?? 0,
      category: errCategory,
      errorType: httpErr?.errorType ?? 'empty_response',
      message: httpErr?.message ?? 'Sin respuesta del asistente',
      url: httpErr?.url ?? page.url(),
      rechargeUrl: httpErr?.rechargeUrl,
      plansUrl: httpErr?.plansUrl,
    });
  } else {
    recordSuccess();
  }

  // ── Log ──
  console.log(result.message);
  console.log(`   Text preview: ${lastText.slice(0, 200)}`);

  return result;
}

// ─── chatValidated (convenience wrapper with Playwright expect) ──────────────

/**
 * Wrapper de chatWithValidation que ejecuta expect() de Playwright.
 * Falla el test con un mensaje descriptivo si la validación no pasa.
 */
export async function chatValidated(
  page: Page,
  text: string,
  expectation: TestExpectation,
  waitMs = 60_000,
): Promise<ChatResponse> {
  const result = await chatWithValidation(page, text, expectation, waitMs);

  // Siempre loguear el resultado para debug
  if (!result.passed) {
    // Fail with descriptive message
    expect(
      result.passed,
      `${result.message}\n   Full text (first 500): ${result.response.text.slice(0, 500)}`,
    ).toBe(true);
  }

  return result.response;
}
