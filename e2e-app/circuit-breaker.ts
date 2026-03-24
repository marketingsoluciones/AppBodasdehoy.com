/**
 * circuit-breaker.ts
 *
 * Estado compartido a nivel de módulo para detectar fallos sistémicos
 * (API caída, auth roto, saldo insuficiente) y abortar la suite temprano
 * en vez de correr 46 tests que van a fallar idénticamente.
 *
 * Funciona porque Playwright corre con `workers: 1` (serial).
 */

import type { Page } from '@playwright/test';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ErrorCategory = 'auth' | 'balance' | 'server' | 'timeout' | 'network';

export interface HttpError {
  status: number;
  category: ErrorCategory;
  errorType: string;
  url: string;
  timestamp: number;
}

interface BreakerState {
  consecutiveFailures: number;
  lastCategory: ErrorCategory | null;
  tripped: boolean;
  tripReason: string;
  allErrors: HttpError[];
  errorsByCategory: Record<ErrorCategory, number>;
}

// ─── Thresholds ──────────────────────────────────────────────────────────────

const TRIP_THRESHOLDS: Record<ErrorCategory, number> = {
  auth: 2,       // Sistémico: JWT roto nunca se arregla solo
  balance: 2,    // Sistémico: sin saldo
  server: 3,     // Puede ser transitorio
  timeout: 3,    // Puede ser transitorio
  network: 3,    // Sin respuesta
};

const TRIP_MESSAGES: Record<ErrorCategory, string> = {
  auth: 'Auth roto. Fix login/JWT antes de correr tests.',
  balance: 'Sin saldo. Recargar cuenta antes de correr tests.',
  server: 'api-ia caido. Check backend (ssh backend-ia-v2).',
  timeout: 'api-ia sobrecargado. Reintentar mas tarde.',
  network: 'Sin respuesta del chat. Check conexion/proxy.',
};

// ─── Shared State ────────────────────────────────────────────────────────────

const state: BreakerState = {
  consecutiveFailures: 0,
  lastCategory: null,
  tripped: false,
  tripReason: '',
  allErrors: [],
  errorsByCategory: { auth: 0, balance: 0, server: 0, timeout: 0, network: 0 },
};

let lastHttpError: HttpError | null = null;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Registra un fallo. Tripea el breaker si el mismo tipo de error
 * se repite consecutivamente más allá del umbral.
 */
export function recordFailure(event: Omit<HttpError, 'timestamp'> | { category: ErrorCategory; errorType: string }): void {
  const error: HttpError = {
    status: 'status' in event ? event.status : 0,
    category: event.category,
    errorType: event.errorType,
    url: 'url' in event ? event.url : '',
    timestamp: Date.now(),
  };

  state.allErrors.push(error);
  state.errorsByCategory[error.category]++;

  // Si es la misma categoría que el anterior, incrementar consecutivos
  if (state.lastCategory === error.category) {
    state.consecutiveFailures++;
  } else {
    state.consecutiveFailures = 1;
    state.lastCategory = error.category;
  }

  const threshold = TRIP_THRESHOLDS[error.category];
  if (state.consecutiveFailures >= threshold && !state.tripped) {
    state.tripped = true;
    state.tripReason = `[Circuit Breaker] ${TRIP_MESSAGES[error.category]} (${state.consecutiveFailures} fallos consecutivos de tipo "${error.category}")`;
    console.error(`\n${'═'.repeat(60)}`);
    console.error(` CIRCUIT BREAKER TRIPPED`);
    console.error(` ${state.tripReason}`);
    console.error(`${'═'.repeat(60)}\n`);
  }
}

/**
 * Registra un éxito. Resetea el contador de fallos consecutivos.
 */
export function recordSuccess(): void {
  state.consecutiveFailures = 0;
  state.lastCategory = null;
}

/**
 * Comprueba si el breaker está tripeado.
 */
export function shouldAbort(): { abort: boolean; reason: string } {
  return {
    abort: state.tripped,
    reason: state.tripReason,
  };
}

/**
 * Clasifica un status HTTP en categoría de error.
 */
export function classifyHttpStatus(status: number): ErrorCategory | null {
  if (status === 401 || status === 403) return 'auth';
  if (status === 402) return 'balance';
  if (status === 502 || status === 503) return 'server';
  if (status === 504) return 'timeout';
  if (status >= 500) return 'server';
  return null;
}

/**
 * Adjunta un interceptor HTTP a la página de Playwright.
 * Captura respuestas de `/webapi/chat/` y clasifica errores.
 */
export function attachHttpInterceptor(page: Page): void {
  page.on('response', (response) => {
    const url = response.url();
    if (!url.includes('/webapi/chat/') && !url.includes('/api/ai/chat')) return;

    const status = response.status();
    const category = classifyHttpStatus(status);

    if (category) {
      const error: HttpError = {
        status,
        category,
        errorType: `http_${status}`,
        url,
        timestamp: Date.now(),
      };
      lastHttpError = error;
      console.log(`[Circuit Breaker] HTTP ${status} en ${url} → categoria: ${category}`);
    }
  });
}

/**
 * Devuelve el último error HTTP capturado (o null).
 */
export function getLastHttpError(): HttpError | null {
  return lastHttpError;
}

/**
 * Limpia el último error HTTP (llamar antes de cada request).
 */
export function clearLastHttpError(): void {
  lastHttpError = null;
}

/**
 * Devuelve un resumen del estado del circuit breaker para logging.
 */
export function getSummary(): string {
  const lines: string[] = [];
  lines.push('═'.repeat(50));
  lines.push(' CIRCUIT BREAKER SUMMARY');
  lines.push(` Total HTTP errors: ${state.allErrors.length}`);
  lines.push(` Tripped: ${state.tripped ? 'YES' : 'NO'}${state.tripped ? ` — ${state.tripReason}` : ''}`);

  const activeCategories = Object.entries(state.errorsByCategory)
    .filter(([, count]) => count > 0)
    .reduce((acc, [cat, count]) => ({ ...acc, [cat]: count }), {});
  lines.push(` By category: ${JSON.stringify(activeCategories)}`);
  lines.push('═'.repeat(50));

  return lines.join('\n');
}
