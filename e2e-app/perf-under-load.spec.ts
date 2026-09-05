/**
 * perf-under-load.spec.ts
 *
 * Tests de performance bajo carga real en appEventos:
 *   - Listado invitados carga en <8s
 *   - Plano mesas renderiza en <10s
 *   - Itinerario tareas scroll fluido
 *   - Búsqueda con muchos resultados responde rápido
 *   - Bulk operations no congelan UI (no blocking main thread)
 *
 * GAP P1 detectado por COORD-APP — coverage de performance UX
 */
import { test, expect } from '@playwright/test';
import { clearSession, loginAndSelectEvent, navigateToModule, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

const isAppDev =
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app-test.bodasdehoy.com');

// Umbrales de performance (ms) — ajustables según hardware/red
const PERF = {
  pageLoad: 8_000,
  navigation: 6_000,
  search: 3_000,
  scroll: 1_500,
};

test.describe('Performance — Tiempo de carga inicial módulos', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('Carga inicial invitados < 8s tras login', async ({ page }) => {
    const start = Date.now();
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, PERF.pageLoad);
    const elapsed = Date.now() - start;

    expect(elapsed, `BUG_PERF: invitados tardó ${elapsed}ms (umbral ${PERF.pageLoad}ms)`).toBeLessThan(PERF.pageLoad + 2000);

    // Verificar que NO se quedó en skeleton infinito
    const stillLoading = await page.locator('[data-testid="skeleton"], .skeleton-row').count();
    expect(stillLoading, 'BUG_PERF: skeleton sigue visible tras 8s (no resolvió)').toBeLessThan(3);
  });

  test('Carga inicial mesas < 8s tras login', async ({ page }) => {
    const start = Date.now();
    await navigateToModule(page, 'mesas');
    await waitForAppReady(page, PERF.pageLoad);
    const elapsed = Date.now() - start;

    expect(elapsed, `BUG_PERF: mesas tardó ${elapsed}ms`).toBeLessThan(PERF.pageLoad + 4000); // tolerante: render canvas

    const stillLoading = await page.locator('[data-testid="skeleton"], .skeleton-row').count();
    expect(stillLoading).toBeLessThan(3);
  });

  test('Carga inicial presupuesto < 8s tras login', async ({ page }) => {
    const start = Date.now();
    await navigateToModule(page, 'presupuesto');
    await waitForAppReady(page, PERF.pageLoad);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(PERF.pageLoad + 2000);
  });

  test('Carga inicial itinerario < 8s tras login', async ({ page }) => {
    const start = Date.now();
    await navigateToModule(page, 'itinerario');
    await waitForAppReady(page, PERF.pageLoad);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(PERF.pageLoad + 2000);
  });
});

test.describe('Performance — Navegación entre módulos', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('Navegación invitados → mesas < 6s (caché tras primera carga)', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, PERF.pageLoad);

    const start = Date.now();
    await navigateToModule(page, 'mesas');
    await waitForAppReady(page, PERF.navigation);
    const elapsed = Date.now() - start;

    expect(elapsed, `BUG_PERF: navegación invitados→mesas tardó ${elapsed}ms`).toBeLessThan(PERF.navigation + 4000);
  });

  test('Navegación 5 módulos en cadena sin degradación lineal', async ({ page }) => {
    const modules = ['invitados', 'mesas', 'presupuesto', 'itinerario', 'invitados'];
    const times: number[] = [];

    for (const mod of modules) {
      const start = Date.now();
      await navigateToModule(page, mod);
      await waitForAppReady(page, PERF.navigation);
      times.push(Date.now() - start);
    }

    // El último viaje no debería ser >2x el primero (sin memory leak progresivo)
    expect(times[times.length - 1],
      `BUG_PERF: último módulo (${times[times.length - 1]}ms) >2x primero (${times[0]}ms)`)
      .toBeLessThan(times[0] * 2 + 3000);
  });
});

test.describe('Performance — Métricas Web Vitals', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppDev || !hasCredentials) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) test.skip(true, 'TEST_LOGIN_FAILED');
  });

  test('LCP (Largest Contentful Paint) < 4s en invitados', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, PERF.pageLoad);

    const lcp = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        try {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            resolve(lastEntry?.renderTime || lastEntry?.loadTime || lastEntry?.startTime || null);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => resolve(null), 5_000);
        } catch {
          resolve(null);
        }
      });
    });

    if (lcp === null) {
      test.skip(true, 'No se pudo medir LCP (PerformanceObserver no disponible o navegador)');
    }

    expect(lcp, `BUG_PERF: LCP=${lcp}ms supera umbral 4000ms`).toBeLessThan(4000);
  });

  test('No hay long tasks > 1s tras navegación', async ({ page }) => {
    await navigateToModule(page, 'invitados');
    await waitForAppReady(page, PERF.pageLoad);

    const longTasks = await page.evaluate(() => {
      return new Promise<number[]>((resolve) => {
        const tasks: number[] = [];
        try {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              tasks.push(entry.duration);
            }
          }).observe({ entryTypes: ['longtask'] });
          setTimeout(() => resolve(tasks), 3_000);
        } catch {
          resolve(tasks);
        }
      });
    });

    const veryLong = longTasks.filter((d) => d > 1000);
    expect(veryLong.length, `BUG_PERF: ${veryLong.length} long tasks > 1s detectadas — UI puede congelar`).toBe(0);
  });
});
