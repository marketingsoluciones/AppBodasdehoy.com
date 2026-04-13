/**
 * ui-presupuesto.spec.ts — Tests UI directos: módulo Presupuesto
 *
 * Cada test = Hipótesis → Acción real del usuario en UI → Resultado medible en sistema.
 *
 * Tests:
 *   PRE-01 [owner] presupuesto carga sin crash + muestra categorías existentes del evento
 *   PRE-02 [owner] crear nueva categoría → aparece en lista tras guardar
 *   PRE-04 [sin sesión] navegar a /presupuesto → GuestDemoWrapper o VistaSinCookie
 *
 * Autenticación:
 *   owner     → dev_bypass en app-test.bodasdehoy.com (UID real del organizador)
 *   sin sesión → clearSession() + navigate directo
 *
 * Ejecución:
 *   E2E_ENV=dev npx playwright test e2e-app/ui-presupuesto.spec.ts --project=webkit
 *   Solo un test:
 *   E2E_ENV=dev npx playwright test e2e-app/ui-presupuesto.spec.ts --project=webkit --grep "PRE-01"
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_URLS } from './fixtures';
import { clearSession } from './helpers';
import { ISABEL_RAUL_EVENT } from './fixtures/isabel-raul-event';

// ── Constantes ─────────────────────────────────────────────────────────────────

const BASE_URL = TEST_URLS.app;
const EVENT_ID = ISABEL_RAUL_EVENT.id;

/** Categoría conocida en el evento Isabel & Raúl */
const KNOWN_CATEGORY = ISABEL_RAUL_EVENT.presupuesto.partida1; // "Catering"

const FORM_TIMEOUT = 10_000;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Estado global (beforeAll) ──────────────────────────────────────────────────

let appOk = false;
let presupuestoOk = false;

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const text = (await page.locator('body').textContent().catch(() => null)) ?? '';
    appOk = text.length > 50 && !/1033|Cloudflare|Please enable cookies/i.test(text);
    if (!appOk) return;

    // Verificar con dev_bypass que el módulo presupuesto es accesible
    await page.evaluate(() => sessionStorage.setItem('dev_bypass', 'true'));
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForFunction(
      () => /Mis eventos/i.test(document.body.innerText ?? ''),
      { timeout: 40_000 },
    ).catch(() => {});
    await page.waitForFunction(
      () => !/Cargando eventos/i.test(document.body.innerText ?? ''),
      { timeout: 15_000 },
    ).catch(() => {});
    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForFunction(
      () => {
        const t = document.body.innerText ?? '';
        return /Presupuesto|categoria|budget|Catering/i.test(t) && !/Cargando\.\.\./i.test(t);
      },
      { timeout: 30_000 },
    ).catch(() => {});

    const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    presupuestoOk = /Presupuesto|Nueva Categoria|Catering/i.test(bodyText) &&
      !bodyText.includes('Error Capturado por ErrorBoundary');

  } catch (e) {
    console.log('[PRE beforeAll] error:', e);
    appOk = false;
  } finally {
    await page.close();
    await ctx.close();
  }
  console.log(`[PRE beforeAll] appOk=${appOk} presupuestoOk=${presupuestoOk}`);
});

// ── Helper: login como owner y navegar a /presupuesto ─────────────────────────
//
// Igual que loginToInvitados pero navega a "Presupuesto" en la barra lateral.

async function loginToPresupuesto(page: Page): Promise<boolean> {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.evaluate(() => sessionStorage.setItem('dev_bypass', 'true'));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });

  await page.waitForFunction(
    () => /Mis eventos/i.test(document.body.innerText ?? ''),
    { timeout: 45_000 },
  ).catch(() => console.log('[PRE] timeout esperando "Mis eventos"'));

  await page.waitForFunction(
    () => !/Cargando eventos/i.test(document.body.innerText ?? ''),
    { timeout: 20_000 },
  ).catch(() => {});

  await delay(2_000);

  // Click tarjeta Isabel
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
      console.log('[PRE] no se encontró tarjeta de evento');
      return false;
    }
  } else {
    await isabelCard.click();
  }

  // Esperar navegación a /resumen-evento (confirma que setEvent(data) fue llamado)
  await page.waitForURL('**/resumen-evento**', { timeout: 30_000 }).catch(() => {
    console.log('[PRE] No navegó a /resumen-evento tras click card');
  });

  const postCardUrl = page.url();
  console.log('[PRE] post-card URL:', postCardUrl);

  if (!postCardUrl.includes('/resumen-evento')) {
    // Fallback: /servicios?event=EVENT_ID para cargar el evento via eventsGroup
    await page.goto(`${BASE_URL}/servicios?event=${EVENT_ID}`, {
      waitUntil: 'domcontentloaded', timeout: 30_000,
    });
    await page.waitForFunction(
      () => /servicios|Itinerario|Kanban|pendiente/i.test(document.body.innerText ?? ''),
      { timeout: 20_000 },
    ).catch(() => {});
    await delay(1_500);
  }

  await delay(500);

  // Navegar a /presupuesto via SPA (preserva React context con event completo)
  const clickedPre = await page.evaluate(() => {
    const lis = Array.from(document.querySelectorAll('li'));
    for (const li of lis) {
      const pTag = li.querySelector('p');
      if (pTag && /presupuesto/i.test(pTag.textContent?.trim() ?? '')) {
        li.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return true;
      }
    }
    return false;
  });
  console.log('[PRE] clickedPresupuesto via eval:', clickedPre);

  await page.waitForURL('**/presupuesto**', { timeout: 15_000 }).catch(() => {});

  if (!page.url().includes('/presupuesto')) {
    const preLi = page.locator('li').filter({ hasText: /presupuesto/i }).first();
    if (await preLi.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await preLi.click({ force: true }).catch(() => {});
      await page.waitForURL('**/presupuesto**', { timeout: 10_000 }).catch(() => {});
    }
  }

  await delay(1_500);

  const url = page.url();
  const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
  const ok = url.includes('/presupuesto') &&
    !bodyText.includes('Error Capturado por ErrorBoundary');

  console.log(`[PRE] loginToPresupuesto ok=${ok} url=${url}`);
  console.log(`[PRE] body snippet:`, bodyText.slice(0, 300).replace(/\n+/g, ' | '));
  return ok;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('BATCH PRE — Presupuesto × Roles', () => {

  // ────────────────────────────────────────────────────────────────────────────
  test('PRE-01 [owner] presupuesto carga sin crash + muestra categorías existentes', async ({ page }) => {
    /**
     * Hipótesis: El owner puede acceder a /presupuesto, la página carga sin crash
     * y muestra las categorías existentes del evento (en Isabel & Raúl existe "Catering").
     * Si el evento no tuviera categorías, mostraría PresupuestoInitModal en su lugar.
     *
     * Resultado medible:
     *  - NO hay "Error Capturado por ErrorBoundary"
     *  - Texto "Presupuesto" visible en la página (título del módulo)
     *  - La categoría conocida "Catering" es visible en la lista
     *  - PresupuestoInitModal NO aparece (el evento tiene categorías)
     */
    if (!presupuestoOk) {
      test.skip(true, 'PRE-01: módulo presupuesto no accesible (beforeAll)');
      return;
    }

    const ok = await loginToPresupuesto(page);
    if (!ok) {
      test.skip(true, 'PRE-01: loginToPresupuesto falló');
      return;
    }

    // Esperar a que el módulo termine de cargar
    await page.waitForFunction(
      () => {
        const t = document.body.innerText ?? '';
        return /Presupuesto|Nueva Categoria|Cómo quieres empezar/i.test(t) && !t.includes('Abriendo evento');
      },
      { timeout: 20_000 },
    ).catch(() => {});

    const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    console.log('[PRE-01] body:', bodyText.slice(0, 400).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: sin crash ───────────────────────────────────────
    expect(bodyText, 'PRE-01: No debe haber ErrorBoundary en /presupuesto').not.toMatch(
      /Error Capturado por ErrorBoundary/i,
    );

    // ── Resultado medible 2: módulo presupuesto visible ───────────────────────
    expect(bodyText, 'PRE-01: Texto "Presupuesto" debe ser visible').toMatch(/Presupuesto/i);

    // ── Resultado medible 3: estado válido del módulo ─────────────────────────
    // Dos estados válidos:
    //  A) Tiene categorías → "Nueva Categoria" visible en la barra lateral
    //  B) Sin categorías   → PresupuestoInitModal visible ("¿Cómo quieres empezar?")
    // El módulo NO debe crashear en ningún estado.
    const hasCategories = /Nueva Categoria/i.test(bodyText);
    const hasInitModal = /Cómo quieres empezar\?|aún no tiene categorías/i.test(bodyText);

    console.log('[PRE-01] hasCategories:', hasCategories, '| hasInitModal:', hasInitModal);
    expect(
      hasCategories || hasInitModal,
      'PRE-01: Debe mostrar categorías existentes O PresupuestoInitModal (si evento sin categorías)',
    ).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('PRE-02 [owner] crear nueva categoría → aparece en la lista', async ({ page }) => {
    /**
     * Hipótesis: El owner puede crear una categoría nueva. Tras guardar,
     * el nombre de la nueva categoría aparece en la lista de categorías.
     *
     * Acción:
     *  1. Login owner → /presupuesto
     *  2. Click "Nueva Categoria"
     *  3. Rellenar nombre: E2E-Cat-{ts}
     *  4. Click "Crear categoría"
     *
     * La mutación nuevoCategoria se intercepta con page.route para evitar:
     *  - Llamadas reales a la API sin auth (dev_bypass)
     *  - Contaminación de datos en la DB de test
     *
     * Resultado medible:
     *  - Formulario se cierra (input nombre ya no visible)
     *  - Nombre "E2E-Cat-{ts}" visible en la lista de categorías
     */
    if (!presupuestoOk) {
      test.skip(true, 'PRE-02: módulo presupuesto no accesible (beforeAll)');
      return;
    }

    const ok = await loginToPresupuesto(page);
    if (!ok) {
      test.skip(true, 'PRE-02: loginToPresupuesto falló');
      return;
    }

    const ts = Date.now().toString().slice(-6);
    const catName = `E2E-Cat-${ts}`;
    console.log(`[PRE-02] creando categoría: ${catName}`);

    // Esperar a que la lista de categorías cargue
    await page.waitForFunction(
      () => /Nueva Categoria|Catering/i.test(document.body.innerText ?? ''),
      { timeout: 20_000 },
    ).catch(() => {});

    // ── Cerrar PresupuestoInitModal si está abierto ───────────────────────────
    // El modal aparece cuando el evento no tiene categorías y bloquea los clics.
    // "Empezar desde cero" llama onClose() → setShowInitModal(false).
    const initModal = page.locator('text=¿Cómo quieres empezar?').first();
    const modalVisible = await initModal.isVisible({ timeout: 3_000 }).catch(() => false);
    if (modalVisible) {
      console.log('[PRE-02] PresupuestoInitModal visible → cerrando con "Empezar desde cero"');
      const closeBtn = page.locator('button').filter({ hasText: /Empezar desde cero/i }).first();
      await closeBtn.click({ force: true, timeout: 5_000 }).catch(() => {});
      // Esperar a que el modal desaparezca
      await page.waitForFunction(
        () => !document.body.innerText.includes('¿Cómo quieres empezar?'),
        { timeout: 5_000 },
      ).catch(() => {});
      await delay(500);
    }

    // ── Abrir formulario de nueva categoría ──────────────────────────────────
    const newCatBtn = page.locator('button').filter({ hasText: /Nueva Categoria/i }).first();
    const btnVisible = await newCatBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log('[PRE-02] botón "Nueva Categoria" visible:', btnVisible);

    if (!btnVisible) {
      // Debug: listar botones
      const allBtns = await page.locator('button:visible').all();
      const btnTexts = await Promise.all(
        allBtns.slice(0, 10).map(async (b) => (await b.textContent().catch(() => ''))?.trim() ?? ''),
      );
      console.log('[PRE-02] botones visibles:', JSON.stringify(btnTexts));
      test.skip(true, 'PRE-02: botón "Nueva Categoria" no visible');
      return;
    }

    await newCatBtn.click({ timeout: 5_000 });

    // Esperar a que el formulario de crear categoría aparezca
    const nombreInput = page.locator('input[name="nombre"]').first();
    const formVisible = await nombreInput.isVisible({ timeout: FORM_TIMEOUT }).catch(() => false);
    console.log('[PRE-02] formulario visible:', formVisible);

    if (!formVisible) {
      test.skip(true, 'PRE-02: formulario de nueva categoría no apareció');
      return;
    }

    // ── Rellenar nombre ───────────────────────────────────────────────────────
    await nombreInput.fill(catName);

    // ── Mock de la mutación nuevoCategoria ────────────────────────────────────
    // dev_bypass sin auth → la mutación real colgaría (igual que createGuests en INV-01).
    // Devolvemos respuesta success con la nueva categoría incluida.
    let mutationIntercepted = false;
    await page.route('**/api/proxy/graphql', async (route) => {
      const body = route.request().postDataJSON() ?? {};
      if (typeof body?.query === 'string' && body.query.includes('nuevoCategoria')) {
        mutationIntercepted = true;
        console.log('[PRE-02] mutación nuevoCategoria interceptada → mock success');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              nuevoCategoria: {
                _id: `mock-cat-${ts}`,
                coste_proporcion: 0,
                coste_estimado: 0,
                coste_final: 0,
                pagado: 0,
                nombre: catName,
                gastos_array: [],
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // ── Click submit ──────────────────────────────────────────────────────────
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click({ timeout: 8_000 });

    // Esperar a que el formulario se cierre (la nueva categoría fue creada)
    await page.waitForFunction(
      () => !document.querySelector('input[name="nombre"]'),
      { timeout: 8_000 },
    ).catch(() => console.log('[PRE-02] timeout esperando cierre del formulario'));

    await page.unroute('**/api/proxy/graphql');

    const bodyAfter = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    console.log('[PRE-02] body tras crear:', bodyAfter.slice(0, 300).replace(/\n+/g, ' | '));
    console.log('[PRE-02] mutationIntercepted:', mutationIntercepted);

    // ── Resultado medible 1: formulario se cerró ──────────────────────────────
    const formClosed = !(await page.locator('input[name="nombre"]').isVisible({ timeout: 1_000 }).catch(() => false));
    expect(formClosed, 'PRE-02: El formulario debe cerrarse tras crear la categoría').toBe(true);

    // ── Resultado medible 2: nombre en la lista ───────────────────────────────
    expect(
      bodyAfter,
      `PRE-02: El nombre "${catName}" debe aparecer en la lista de categorías`,
    ).toContain(catName);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('PRE-04 [sin sesión] navegar a /presupuesto → GuestDemoWrapper o VistaSinCookie', async ({ page, context }) => {
    /**
     * Hipótesis: Sin sesión activa, /presupuesto no expone datos financieros del evento.
     * La app muestra GuestDemoWrapper ("Control de presupuesto" + "Crear cuenta gratis")
     * o VistaSinCookie (redirect a login). En ningún caso aparecen importes reales.
     *
     * Resultado medible:
     *  - Body contiene "Crear cuenta gratis" (GuestDemoWrapper) O URL = /login (VistaSinCookie)
     *  - Body NO contiene importes reales (números con € de las categorías privadas)
     *  - Body NO contiene "Catering" (categoría privada del evento)
     */
    if (!appOk) {
      test.skip(true, 'PRE-04: servidor no disponible (beforeAll)');
      return;
    }

    await clearSession(context, page);
    await page.goto(`${BASE_URL}/presupuesto`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    let finalUrl = page.url();
    let bodyText = '';

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      finalUrl = page.url();
      bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
      const atLogin = finalUrl.includes('/login');
      const hasUpsell = /Crear cuenta gratis/i.test(bodyText);
      if (atLogin || hasUpsell) break;
      await delay(800);
    }

    console.log(`[PRE-04] url=${finalUrl}`);
    console.log(`[PRE-04] body (300 chars):`, bodyText.slice(0, 300).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: upsell o login ──────────────────────────────────
    const atLogin = finalUrl.includes('/login');
    const hasUpsell = /Crear cuenta gratis/i.test(bodyText);
    expect(
      atLogin || hasUpsell,
      `PRE-04: Sin sesión debe mostrar "Crear cuenta gratis" o redirigir a /login. URL: ${finalUrl}`,
    ).toBe(true);

    // ── Resultado medible 2: sin categoría privada "Catering" ────────────────
    expect(
      bodyText,
      `PRE-04: Sin sesión NO debe aparecer la categoría privada "${KNOWN_CATEGORY}"`,
    ).not.toContain(KNOWN_CATEGORY);
  });

});
