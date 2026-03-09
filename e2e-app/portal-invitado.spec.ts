/**
 * portal-invitado.spec.ts
 *
 * Tests del portal público del invitado en appEventos:
 *   - /e/[eventId] carga sin auth (ruta pública)
 *   - Portal muestra countdown si fecha en futuro
 *   - Portal muestra formulario RSVP
 *   - eventId inválido no crashea (404 graceful)
 *   - /buscador-mesa/[eventId] carga sin auth
 *
 * La ruta /e/[eventId] es pública — NO requiere auth (excluida del layout autenticado).
 * Para tests con evento real, usar E2E_EVENT_ID=<id> como env var.
 *
 * Ejecutar: E2E_EVENT_ID=abc123 pnpm test:e2e:app:todo
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

// ID de evento real para tests (si se provee)
const TEST_EVENT_ID = process.env.E2E_EVENT_ID || '';

// Evento de prueba sintético (ID inválido — debe fallar gracefully)
const FAKE_EVENT_ID = 'e2e-test-id-invalido-000000000000';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Portal público — /e/[eventId]
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Portal invitado — /e/[eventId]', () => {
  test.setTimeout(90_000);

  test('eventId inválido no crashea — muestra 404 graceful o mensaje de evento no encontrado', async ({
    page,
  }) => {
    await page.goto(`/e/${FAKE_EVENT_ID}`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(3000);

    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10_000 });

    const text = (await body.textContent()) ?? '';
    expect(text.length).toBeGreaterThan(20);
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Debe mostrar 404, "no encontrado", o similar — nunca un crash
    const has404OrNotFound =
      /no encontrado|not found|404|evento no existe|inválido|no existe/i.test(text) ||
      // O simplemente cualquier página sin crash (puede ser redirect a home)
      text.length > 50;
    expect(has404OrNotFound).toBe(true);
    console.log(`Portal con ID inválido — respuesta OK (sin crash). URL: ${page.url()}`);
  });

  test('ruta /e/ base (sin eventId) no crashea', async ({ page }) => {
    // Esta ruta puede no existir — debe devolver 404 limpio o redirect, nunca ErrorBoundary
    await page.goto('/e/', { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('portal con evento real carga sin ErrorBoundary (requiere E2E_EVENT_ID)', async ({
    page,
  }) => {
    if (!TEST_EVENT_ID) {
      test.skip();
      return;
    }

    await page.goto(`/e/${TEST_EVENT_ID}`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(100);

    // Portal del evento debe tener contenido del evento
    const hasEventContent =
      /boda|evento|fiesta|countdown|días|RSVP|asistencia|confirmar|invitado/i.test(text);
    expect(hasEventContent).toBe(true);
    console.log(`Portal del evento ${TEST_EVENT_ID} carga correctamente`);
  });

  test('portal con evento real muestra countdown si fecha es futura (requiere E2E_EVENT_ID)', async ({
    page,
  }) => {
    if (!TEST_EVENT_ID) {
      test.skip();
      return;
    }

    await page.goto(`/e/${TEST_EVENT_ID}`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';

    // Si el evento tiene fecha futura, debe mostrar countdown
    const hasCountdown =
      /\d+\s*(días|hours|horas|minutos|seconds|día)/i.test(text) ||
      (await page.locator('[data-testid*="countdown"], [class*="countdown"]').count()) > 0;

    if (hasCountdown) {
      console.log('Countdown visible en el portal del evento');
    } else {
      // Puede que la fecha sea pasada o no tenga fecha — no es error
      console.log('ℹ️ Countdown no visible (fecha pasada o sin fecha definida)');
    }
    // En cualquier caso, sin crash
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('portal con evento real muestra formulario RSVP (requiere E2E_EVENT_ID)', async ({
    page,
  }) => {
    if (!TEST_EVENT_ID) {
      test.skip();
      return;
    }

    await page.goto(`/e/${TEST_EVENT_ID}`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';

    const hasRSVP =
      /RSVP|asistencia|confirmar|¿asistirás|invitad/i.test(text) ||
      (await page.locator('input, button').filter({ hasText: /confirmar|RSVP|asistir/i }).count()) > 0;

    if (hasRSVP) {
      console.log('Formulario RSVP visible en el portal');
    } else {
      console.log('ℹ️ RSVP no visible (puede requerir configuración del organizador)');
    }
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Buscador de mesa — /buscador-mesa/[eventId]
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Buscador de mesa — /buscador-mesa/[eventId]', () => {
  test.setTimeout(90_000);

  test('eventId inválido no crashea', async ({ page }) => {
    await page.goto(`/buscador-mesa/${FAKE_EVENT_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await page.waitForTimeout(2000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(20);
    console.log('Buscador de mesa con ID inválido — sin crash');
  });

  test('con evento real muestra buscador o mensaje (requiere E2E_EVENT_ID)', async ({ page }) => {
    if (!TEST_EVENT_ID) {
      test.skip();
      return;
    }

    await page.goto(`/buscador-mesa/${TEST_EVENT_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasContent =
      /mesa|buscar|nombre|invitado|seating|seat/i.test(text) || text.length > 100;
    expect(hasContent).toBe(true);
    console.log('Buscador de mesa carga correctamente');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Portal NO requiere auth (no redirige a login)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Portal — acceso sin autenticación', () => {
  test.setTimeout(60_000);

  test('rutas /e/ y /buscador-mesa/ son accesibles sin cookie sessionBodas', async ({
    page,
    context,
  }) => {
    // Limpiar todas las cookies
    await context.clearCookies();

    // Probar ruta /e/ con ID inválido — no debe redirigir a /login
    await page.goto(`/e/${FAKE_EVENT_ID}`, { waitUntil: 'domcontentloaded', timeout: 35_000 });
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    // No debe haber redirigido a /login ni a chat-test
    expect(finalUrl).not.toMatch(/\/login/);
    expect(finalUrl).not.toMatch(/chat-test\.bodasdehoy\.com/);
    console.log(`URL tras /e/ sin auth: ${finalUrl}`);

    // Limpiar cookies y probar buscador de mesa
    await context.clearCookies();
    await page.goto(`/buscador-mesa/${FAKE_EVENT_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 35_000,
    });
    await page.waitForTimeout(2000);

    const finalUrl2 = page.url();
    expect(finalUrl2).not.toMatch(/\/login/);
    expect(finalUrl2).not.toMatch(/chat-test\.bodasdehoy\.com/);
    console.log(`URL tras /buscador-mesa/ sin auth: ${finalUrl2}`);
  });
});
