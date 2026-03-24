/**
 * circuit-breaker.ts
 *
 * Detecta fallos sistémicos (API caída, auth roto, saldo insuficiente) y
 * aborta la suite temprano en vez de correr 46 tests que van a fallar.
 *
 * Parsea el body de la respuesta HTTP para extraer errores específicos
 * de la API (saldo_agotado, chat_processing_error, etc.) según el
 * mapa de errores del backend.
 *
 * Usa un archivo temporal para persistir estado entre describe blocks.
 */

import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ErrorCategory = 'auth' | 'balance' | 'server' | 'timeout' | 'network';

export interface HttpError {
  status: number;
  category: ErrorCategory;
  errorType: string;
  message: string;
  url: string;
  timestamp: number;
  /** Para 402 saldo_agotado con screen_type=recharge_plans */
  rechargeUrl?: string;
  plansUrl?: string;
}

interface BreakerState {
  consecutiveFailures: number;
  lastCategory: ErrorCategory | null;
  tripped: boolean;
  tripReason: string;
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  /** Ultimo mensaje legible para el usuario */
  lastUserMessage: string;
}

// ─── Thresholds ──────────────────────────────────────────────────────────────

const TRIP_THRESHOLDS: Record<ErrorCategory, number> = {
  auth: 2,       // Sistémico: JWT roto nunca se arregla solo
  balance: 1,    // 1 solo 402 ya es suficiente — sin saldo no hay nada que hacer
  server: 3,     // Puede ser transitorio
  timeout: 3,    // Puede ser transitorio
  network: 3,    // Sin respuesta
};

const TRIP_MESSAGES: Record<ErrorCategory, string> = {
  auth: 'Autenticacion fallida. Revisar JWT/login. Los tests no pueden continuar sin auth valido.',
  balance: 'SALDO AGOTADO. El desarrollo no tiene credito. Recargar saldo o cambiar de plan antes de correr tests.',
  server: 'api-ia no responde (5xx). Verificar estado del backend: ssh backend-ia-v2',
  timeout: 'api-ia sobrecargado (504). Reintentar mas tarde.',
  network: 'Sin respuesta del chat. Verificar conexion de red y que el proxy este up.',
};

// ─── File-based persistence ──────────────────────────────────────────────────

const STATE_FILE = path.join(os.tmpdir(), 'e2e-circuit-breaker-state.json');

function defaultState(): BreakerState {
  return {
    consecutiveFailures: 0,
    lastCategory: null,
    tripped: false,
    tripReason: '',
    totalErrors: 0,
    errorsByCategory: { auth: 0, balance: 0, server: 0, timeout: 0, network: 0 },
    lastUserMessage: '',
  };
}

function readState(): BreakerState {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as BreakerState;
    // Si el archivo tiene mas de 10 min, es de un run anterior — resetear
    const stat = fs.statSync(STATE_FILE);
    if (Date.now() - stat.mtimeMs > 10 * 60 * 1000) {
      return defaultState();
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

function writeState(state: BreakerState): void {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state), 'utf8');
  } catch { /* ignore */ }
}

// In-memory: ultimo error HTTP capturado (page-scoped)
let lastHttpError: HttpError | null = null;

// ─── Public API ──────────────────────────────────────────────────────────────

/** Resetea el circuit breaker. Llamar en globalSetup al inicio de cada run. */
export function resetBreaker(): void {
  writeState(defaultState());
}

/**
 * Registra un fallo. Tripea si el mismo tipo de error se repite mas alla del umbral.
 */
export function recordFailure(event: Partial<HttpError> & { category: ErrorCategory; errorType: string }): void {
  const state = readState();
  state.totalErrors++;
  state.errorsByCategory[event.category]++;

  if (state.lastCategory === event.category) {
    state.consecutiveFailures++;
  } else {
    state.consecutiveFailures = 1;
    state.lastCategory = event.category;
  }

  // Mensaje legible
  if (event.message) {
    state.lastUserMessage = event.message;
  }

  const threshold = TRIP_THRESHOLDS[event.category];
  if (state.consecutiveFailures >= threshold && !state.tripped) {
    state.tripped = true;

    // Construir mensaje claro para el skip
    let reason = TRIP_MESSAGES[event.category];
    if (event.category === 'balance' && event.rechargeUrl) {
      reason += `\n  -> Recargar: ${event.rechargeUrl}`;
    }
    if (event.category === 'balance' && event.plansUrl) {
      reason += `\n  -> Cambiar plan: ${event.plansUrl}`;
    }
    reason += ` (${state.consecutiveFailures}x "${event.category}" consecutivos)`;
    state.tripReason = reason;

    console.error('');
    console.error('='.repeat(60));
    console.error(' CIRCUIT BREAKER TRIPPED');
    console.error('');
    console.error(` ${reason}`);
    if (event.message) {
      console.error(` API dice: "${event.message}"`);
    }
    console.error('');
    console.error('='.repeat(60));
    console.error('');
  }

  writeState(state);
}

/** Registra un exito. Resetea el contador de fallos consecutivos. */
export function recordSuccess(): void {
  const state = readState();
  state.consecutiveFailures = 0;
  state.lastCategory = null;
  writeState(state);
}

/** Comprueba si el breaker esta tripeado. */
export function shouldAbort(): { abort: boolean; reason: string } {
  const state = readState();
  return { abort: state.tripped, reason: state.tripReason };
}

/** Clasifica un status HTTP en categoría de error. */
export function classifyHttpStatus(status: number): ErrorCategory | null {
  if (status === 401 || status === 403) return 'auth';
  if (status === 402) return 'balance';
  if (status === 502 || status === 503) return 'server';
  if (status === 504) return 'timeout';
  if (status >= 500) return 'server';
  return null;
}

/**
 * Parsea el body de una respuesta de error de la API.
 * Sigue el mapa de errores del backend:
 *   402 → { detail: { error: "saldo_agotado", message, screen_type, recharge_url, plans_url } }
 *   500 → { detail: { error: "chat_processing_error", response } } o { error: "internal_error", trace_id }
 *   502 → { detail: "No se pudieron obtener mensajes..." }
 */
function parseApiErrorBody(status: number, body: string): Partial<HttpError> {
  const result: Partial<HttpError> = {};
  try {
    const json = JSON.parse(body);
    const detail = json.detail ?? json;

    if (status === 402) {
      // 402 saldo_agotado
      result.errorType = detail.error || 'saldo_agotado';
      result.message = detail.message || 'Saldo agotado';
      if (detail.screen_type === 'recharge_plans') {
        result.rechargeUrl = detail.recharge_url;
        result.plansUrl = detail.plans_url;
        result.message += ' — Recarga saldo o cambia de plan para continuar.';
      } else {
        result.message += ' — El administrador debe anadir credito.';
      }
    } else if (status >= 500 && status < 600) {
      if (detail.error === 'chat_processing_error') {
        result.errorType = 'chat_processing_error';
        result.message = detail.response || 'Error procesando mensaje. Reintentar.';
      } else if (detail.error === 'internal_error') {
        result.errorType = 'internal_error';
        result.message = `Error interno (trace: ${detail.trace_id || 'N/A'}). Revisar logs del backend.`;
      } else if (typeof detail === 'string') {
        result.errorType = 'server_error';
        result.message = detail.slice(0, 200);
      } else {
        result.errorType = detail.error || `http_${status}`;
        result.message = detail.message || detail.response || `Error HTTP ${status}`;
      }
    }
  } catch {
    // Body no es JSON — usar como string
    result.errorType = `http_${status}`;
    result.message = body ? body.slice(0, 200) : `Error HTTP ${status}`;
  }
  return result;
}

/**
 * Adjunta un interceptor HTTP a la pagina de Playwright.
 * Captura respuestas de /webapi/chat/ y parsea el body para errores especificos.
 */
export function attachHttpInterceptor(page: Page): void {
  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('/webapi/chat/') && !url.includes('/api/ai/chat')) return;

    const status = response.status();
    const category = classifyHttpStatus(status);
    if (!category) return;

    // Intentar leer el body para extraer error especifico
    let bodyText = '';
    try {
      bodyText = await response.text();
    } catch { /* body no disponible */ }

    const parsed = parseApiErrorBody(status, bodyText);

    lastHttpError = {
      status,
      category,
      errorType: parsed.errorType || `http_${status}`,
      message: parsed.message || `Error HTTP ${status}`,
      url,
      timestamp: Date.now(),
      rechargeUrl: parsed.rechargeUrl,
      plansUrl: parsed.plansUrl,
    };

    // Log claro segun tipo de error
    if (category === 'balance') {
      console.log(`[Circuit Breaker] HTTP 402 SALDO AGOTADO en ${url}`);
      console.log(`  -> ${lastHttpError.message}`);
      if (lastHttpError.rechargeUrl) console.log(`  -> Recargar: ${lastHttpError.rechargeUrl}`);
      if (lastHttpError.plansUrl) console.log(`  -> Planes: ${lastHttpError.plansUrl}`);
    } else {
      console.log(`[Circuit Breaker] HTTP ${status} (${lastHttpError.errorType}) en ${url} -> ${category}`);
      if (lastHttpError.message) console.log(`  -> ${lastHttpError.message}`);
    }
  });
}

/** Devuelve el ultimo error HTTP capturado (o null). */
export function getLastHttpError(): HttpError | null {
  return lastHttpError;
}

/** Limpia el ultimo error HTTP (llamar antes de cada request). */
export function clearLastHttpError(): void {
  lastHttpError = null;
}

/** Resumen del estado del circuit breaker. */
export function getSummary(): string {
  const state = readState();
  const lines: string[] = [];
  lines.push('='.repeat(60));
  lines.push(' CIRCUIT BREAKER SUMMARY');
  lines.push(` Total errors: ${state.totalErrors}`);
  lines.push(` Tripped: ${state.tripped ? 'YES' : 'NO'}`);

  if (state.tripped) {
    lines.push('');
    lines.push(` RAZON: ${state.tripReason}`);
  }

  if (state.lastUserMessage) {
    lines.push(` Ultimo error API: ${state.lastUserMessage}`);
  }

  const active = Object.entries(state.errorsByCategory)
    .filter(([, n]) => n > 0);
  if (active.length > 0) {
    lines.push('');
    lines.push(' Desglose:');
    for (const [cat, n] of active) {
      lines.push(`   ${cat}: ${n} errores`);
    }
  }
  lines.push('='.repeat(60));
  return lines.join('\n');
}
