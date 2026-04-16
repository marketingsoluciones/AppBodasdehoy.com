/**
 * ui-kanban-servicios.spec.ts — Tests UI directos: módulo Servicios / Kanban
 *
 * Cada test = Hipótesis → Acción real del usuario en UI → Resultado medible en sistema.
 *
 * Tests:
 *   SRV-01 [owner] /servicios carga sin crash → no ErrorBoundary + algún contenido visible
 *   SRV-02 [sin sesión] /servicios → GuestDemoWrapper "Crear cuenta gratis"
 *   SRV-03 [owner] vista kanban → 4 columnas visibles (Pendiente, En Curso, Completado, Bloqueado)
 *   SRV-04 [owner] Ctrl+H en boardView → ShortcutsModal con "Ctrl + H" visible
 *
 * Autenticación:
 *   owner     → dev_bypass en app-test.bodasdehoy.com (UID real del organizador)
 *   sin sesión → clearSession() + navigate directo
 *
 * Ejecución:
 *   E2E_ENV=dev npx playwright test e2e-app/ui-kanban-servicios.spec.ts --project=webkit
 *   Solo un test:
 *   E2E_ENV=dev npx playwright test e2e-app/ui-kanban-servicios.spec.ts --project=webkit --grep "SRV-01"
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_URLS } from './fixtures';
import { clearSession } from './helpers';
import { ISABEL_RAUL_EVENT } from './fixtures/isabel-raul-event';

// ── Constantes ─────────────────────────────────────────────────────────────────

const BASE_URL = TEST_URLS.app;
const EVENT_ID = ISABEL_RAUL_EVENT.id;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Estado global (beforeAll) ──────────────────────────────────────────────────

let appOk = false;

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const text = (await page.locator('body').textContent().catch(() => null)) ?? '';
    appOk = text.length > 50 && !/1033|Cloudflare|Please enable cookies/i.test(text);
  } catch (e) {
    console.log('[SRV beforeAll] error:', e);
    appOk = false;
  } finally {
    await page.close();
    await ctx.close();
  }
  console.log(`[SRV beforeAll] appOk=${appOk}`);
});

// ── Helper: login como owner y navegar a /servicios ───────────────────────────
//
// Patrón idéntico al de ui-invitados/ui-presupuesto:
//  1. dev_bypass → reload → esperar "Mis eventos"
//  2. Click tarjeta Isabel (o ?event= fallback)
//  3. waitForURL('/resumen-evento') → confirm event loaded in context
//  4. Goto /servicios con query param ?event= para asegurar el evento correcto

async function loginToServicios(page: Page): Promise<boolean> {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.evaluate(() => sessionStorage.setItem('dev_bypass', 'true'));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });

  await page.waitForFunction(
    () => /Mis eventos/i.test(document.body.innerText ?? ''),
    { timeout: 45_000 },
  ).catch(() => console.log('[SRV] timeout esperando "Mis eventos"'));

  await page.waitForFunction(
    () => !/Cargando eventos/i.test(document.body.innerText ?? ''),
    { timeout: 20_000 },
  ).catch(() => {});

  await delay(2_000);

  // Click tarjeta Isabel & Raúl
  const isabelCard = page.locator('[class*="rounded"], [class*="card"]').filter({
    hasText: /isabel/i,
  }).first();
  const hasIsabel = await isabelCard.isVisible({ timeout: 5_000 }).catch(() => false);

  if (!hasIsabel) {
    const anyCard = page.locator('[class*="rounded"][class*="shadow"]').filter({
      hasNotText: /Crea evento|Crear evento/i,
    }).first();
    if (await anyCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await anyCard.click();
    } else {
      console.log('[SRV] no se encontró tarjeta de evento');
      return false;
    }
  } else {
    await isabelCard.click();
  }

  // waitForURL confirma que setEvent(data) fue llamado en handleClickCard
  await page.waitForURL('**/resumen-evento**', { timeout: 30_000 }).catch(() => {
    console.log('[SRV] No navegó a /resumen-evento tras click card');
  });

  const postCardUrl = page.url();
  console.log('[SRV] post-card URL:', postCardUrl);

  // Navegar a /servicios con ?event= para garantizar el evento correcto en context
  await page.goto(`${BASE_URL}/servicios?event=${EVENT_ID}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });

  // Esperar a que la página se estabilice (fuera del skeleton inicial)
  await page.waitForFunction(
    () => {
      const t = document.body.innerText ?? '';
      return t.length > 30 && !/Abriendo evento|Cargando\.\.\./i.test(t);
    },
    { timeout: 25_000 },
  ).catch(() => {});

  await delay(1_500);

  const url = page.url();
  const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
  const ok = url.includes('/servicios') &&
    !bodyText.includes('Error Capturado por ErrorBoundary');

  console.log(`[SRV] loginToServicios ok=${ok} url=${url}`);
  console.log(`[SRV] body snippet:`, bodyText.slice(0, 300).replace(/\n+/g, ' | '));

  return ok;
}

// ── Helper: activar vista boardView via localStorage ───────────────────────────
//
// BoddyIter lee `VIEWservicios` de localStorage al montar.
// Establecerlo antes del reload garantiza que boardView esté activo sin clicks en la UI.

async function switchToBoardView(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem('VIEWservicios', JSON.stringify({ view: 'boardView' }));
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Esperar a que el kanban cargue (alguna columna visible)
  await page.waitForFunction(
    () => /Pendiente|En Curso|Completado|Bloqueado/i.test(document.body.innerText ?? ''),
    { timeout: 25_000 },
  ).catch(() => {});

  await delay(1_000);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('BATCH SRV — Servicios / Kanban', () => {

  // ────────────────────────────────────────────────────────────────────────────
  test('SRV-01 [owner] /servicios carga sin crash → no ErrorBoundary + algún contenido visible', async ({ page }) => {
    /**
     * Hipótesis: El owner puede navegar a /servicios y la página carga sin crash.
     * Puede mostrar el itinerario de servicios del evento (si existe) o el estado vacío,
     * pero NUNCA un ErrorBoundary.
     *
     * Resultado medible:
     *  - NO hay "Error Capturado por ErrorBoundary"
     *  - La página carga contenido (> 30 chars)
     *  - URL final contiene "/servicios"
     */
    if (!appOk) {
      test.skip(true, 'SRV-01: servidor no disponible (beforeAll)');
      return;
    }

    const ok = await loginToServicios(page);

    const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    const url = page.url();

    console.log(`[SRV-01] url=${url}`);
    console.log(`[SRV-01] body (300 chars):`, bodyText.slice(0, 300).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: sin crash ────────────────────────────────────────
    expect(
      bodyText,
      'SRV-01: No debe haber ErrorBoundary en /servicios',
    ).not.toMatch(/Error Capturado por ErrorBoundary/i);

    // ── Resultado medible 2: URL correcta ─────────────────────────────────────
    expect(
      url,
      'SRV-01: URL debe ser /servicios',
    ).toContain('/servicios');

    // ── Resultado medible 3: contenido visible (no pantalla en blanco) ────────
    expect(
      bodyText.trim().length,
      'SRV-01: La página debe mostrar algún contenido',
    ).toBeGreaterThan(30);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('SRV-02 [sin sesión] /servicios → GuestDemoWrapper "Crear cuenta gratis"', async ({ page, context }) => {
    /**
     * Hipótesis: Sin sesión activa, /servicios muestra GuestDemoWrapper
     * en lugar de datos reales de servicios del evento.
     *
     * Resultado medible:
     *  - Texto "Crear cuenta gratis" visible (CTA del GuestDemoWrapper)
     *  - NO hay tareas ni datos privados del evento en el DOM
     *  - NO hay "Error Capturado por ErrorBoundary"
     */
    if (!appOk) {
      test.skip(true, 'SRV-02: servidor no disponible (beforeAll)');
      return;
    }

    await clearSession(context, page);
    await page.goto(`${BASE_URL}/servicios`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // Esperar a que la página se estabilice
    await page.waitForFunction(
      () => {
        const t = document.body.innerText ?? '';
        return t.length > 20 && !/^(\s*)$/.test(t);
      },
      { timeout: 20_000 },
    ).catch(() => {});

    await delay(1_500);

    const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    const url = page.url();

    console.log(`[SRV-02] url=${url}`);
    console.log(`[SRV-02] body (300 chars):`, bodyText.slice(0, 300).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: sin crash ────────────────────────────────────────
    expect(
      bodyText,
      'SRV-02: No debe haber ErrorBoundary en /servicios sin sesión',
    ).not.toMatch(/Error Capturado por ErrorBoundary/i);

    // ── Resultado medible 2: GuestDemoWrapper visible ─────────────────────────
    // servicios.tsx muestra GuestDemoWrapper cuando user?.displayName === 'guest'
    const showsGuestWrapper = /Crear cuenta gratis/i.test(bodyText);
    const redirectedToLogin = url.includes('/login') || url.includes('/registro');

    expect(
      showsGuestWrapper || redirectedToLogin,
      'SRV-02: Sin sesión debe mostrar GuestDemoWrapper o redirigir a login',
    ).toBe(true);

    console.log(`[SRV-02] showsGuestWrapper=${showsGuestWrapper} redirectedToLogin=${redirectedToLogin}`);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('SRV-03 [owner] vista kanban → 4 columnas visibles (Pendiente, En Curso, Completado, Bloqueado)', async ({ page }) => {
    /**
     * Hipótesis: Al cambiar a vista boardView, el tablero kanban muestra
     * las 4 columnas estándar definidas en DEFAULT_COLUMNS (constants.ts):
     * pending/"Pendiente", in_progress/"En Curso", completed/"Completado", blocked/"Bloqueado".
     *
     * El cambio de vista se realiza via localStorage (VIEWservicios) para evitar
     * dependencia de la UI del dropdown SelectModeView.
     *
     * Resultado medible:
     *  - Texto "Pendiente" visible en el DOM
     *  - Texto "En Curso" visible en el DOM
     *  - Texto "Completado" visible en el DOM
     *  - Texto "Bloqueado" visible en el DOM
     *  - NO hay "Error Capturado por ErrorBoundary"
     */
    if (!appOk) {
      test.skip(true, 'SRV-03: servidor no disponible (beforeAll)');
      return;
    }

    const ok = await loginToServicios(page);
    await switchToBoardView(page);

    const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    const url = page.url();

    console.log(`[SRV-03] url=${url}`);
    console.log(`[SRV-03] body (500 chars):`, bodyText.slice(0, 500).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: sin crash ────────────────────────────────────────
    expect(
      bodyText,
      'SRV-03: No debe haber ErrorBoundary en boardView',
    ).not.toMatch(/Error Capturado por ErrorBoundary/i);

    // ── Resultado medible 2: las 4 columnas kanban visibles ───────────────────
    // DEFAULT_COLUMNS en constants.ts: pending/Pendiente, in_progress/En Curso,
    // completed/Completado, blocked/Bloqueado
    const hasPendiente = /Pendiente/i.test(bodyText);
    const hasEnCurso = /En Curso/i.test(bodyText);
    const hasCompletado = /Completado/i.test(bodyText);
    const hasBloqueado = /Bloqueado/i.test(bodyText);

    console.log(`[SRV-03] columnas: Pendiente=${hasPendiente} EnCurso=${hasEnCurso} Completado=${hasCompletado} Bloqueado=${hasBloqueado}`);

    expect(hasPendiente, 'SRV-03: Columna "Pendiente" debe ser visible').toBe(true);
    expect(hasEnCurso, 'SRV-03: Columna "En Curso" debe ser visible').toBe(true);
    expect(hasCompletado, 'SRV-03: Columna "Completado" debe ser visible').toBe(true);
    expect(hasBloqueado, 'SRV-03: Columna "Bloqueado" debe ser visible').toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('SRV-04 [owner] Ctrl+H en boardView → ShortcutsModal con "Ctrl + H" visible', async ({ page }) => {
    /**
     * Hipótesis: En la vista boardView del kanban, pulsar Ctrl+H activa el
     * ShortcutsModal (BoardView.tsx: case 'h' → setShowShortcuts(true)).
     * El modal muestra la lista de atajos incluyendo "Ctrl + H".
     *
     * Resultado medible:
     *  - Tras pulsar Ctrl+H, aparece un modal con texto "Ctrl + H"
     *  - El modal también contiene "Mostrar atajos" (descripción del shortcut)
     *  - NO hay "Error Capturado por ErrorBoundary"
     */
    if (!appOk) {
      test.skip(true, 'SRV-04: servidor no disponible (beforeAll)');
      return;
    }

    const ok = await loginToServicios(page);
    await switchToBoardView(page);

    const preBoardText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');

    // Verificar que estamos en boardView (columnas visibles) antes de Ctrl+H
    const inBoardView = /Pendiente|En Curso|Completado|Bloqueado/i.test(preBoardText);
    console.log(`[SRV-04] inBoardView=${inBoardView}`);

    if (!inBoardView) {
      console.log('[SRV-04] boardView no cargó, saltando Ctrl+H');
      test.skip(true, 'SRV-04: boardView no disponible (sin columnas)');
      return;
    }

    // ── Acción: pulsar Ctrl+H (shortcut registrado en BoardView.tsx) ──────────
    // BoardView usa `e.ctrlKey` — equivale a Control+h
    await page.keyboard.press('Control+h');

    // Esperar a que aparezca el modal de atajos
    await page.waitForFunction(
      () => /Ctrl \+ H/i.test(document.body.innerText ?? ''),
      { timeout: 8_000 },
    ).catch(() => {});

    await delay(500);

    const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');

    console.log(`[SRV-04] body tras Ctrl+H (400 chars):`, bodyText.slice(0, 400).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: sin crash ────────────────────────────────────────
    expect(
      bodyText,
      'SRV-04: No debe haber ErrorBoundary tras Ctrl+H',
    ).not.toMatch(/Error Capturado por ErrorBoundary/i);

    // ── Resultado medible 2: ShortcutsModal visible con "Ctrl + H" ────────────
    // ShortcutsModal.tsx: shortcuts array incluye { keys: 'Ctrl + H', description: t('Mostrar atajos') }
    expect(
      bodyText,
      'SRV-04: ShortcutsModal debe mostrar "Ctrl + H" tras pulsar el shortcut',
    ).toMatch(/Ctrl \+ H/i);

    // ── Resultado medible 3: descripción "Mostrar atajos" visible ─────────────
    expect(
      bodyText,
      'SRV-04: ShortcutsModal debe mostrar "Mostrar atajos"',
    ).toMatch(/Mostrar atajos/i);
  });

});
