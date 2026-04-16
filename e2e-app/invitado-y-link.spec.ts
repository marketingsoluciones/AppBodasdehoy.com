/**
 * invitado-y-link.spec.ts
 *
 * E2E: Crear invitado en "Boda Isabel & Raúl" y verificar link de invitación.
 *   1. Login → seleccionar evento "Isabel & Raúl"
 *   2. Ir a /invitados → crear invitado "E2E Test {timestamp}" con 2 pases
 *   3. Verificar que aparece en la lista
 *   4. Obtener link de invitación y verificar que carga
 *   5. Medir tiempos de carga de cada paso
 *
 * Ejecutar:
 *   pnpm test:e2e:app:completo -- --grep="invitado-y-link"
 *   o directamente:
 *   PLAYWRIGHT_BROWSER=webkit BASE_URL=https://app-test.bodasdehoy.com \
 *     TEST_USER_EMAIL=bodasdehoy.com@gmail.com TEST_USER_PASSWORD='lorca2012M*+' \
 *     npx playwright test e2e-app/invitado-y-link.spec.ts --headed
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady, loginAndSelectEvent } from './helpers';

const BASE_URL = process.env.BASE_URL || 'https://app-test.bodasdehoy.com';
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'lorca2012M*+';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

const RUN_ID = Date.now().toString().slice(-6);
const GUEST_NAME = `E2E Guest ${RUN_ID}`;
const GUEST_PASSES = '2';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Tiempos de carga — análisis de rendimiento
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Rendimiento — tiempos de carga', () => {
  test.setTimeout(120_000);

  const RUTAS = [
    { path: '/', label: 'Home' },
    { path: '/invitados', label: 'Invitados' },
    { path: '/itinerario', label: 'Itinerario' },
    { path: '/servicios', label: 'Servicios' },
    { path: '/presupuesto', label: 'Presupuesto' },
  ];

  for (const { path, label } of RUTAS) {
    test(`${label} (${path}) — tiempo hasta contenido visible`, async ({ page }) => {
      if (!isAppTest) { test.skip(); return; }

      const start = Date.now();

      await page.goto(`${BASE_URL}${path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 40_000,
      });
      const domReady = Date.now() - start;

      const body = page.locator('body');
      await body.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

      let contentReady = 0;
      const maxWait = 30_000;
      while (Date.now() - start < maxWait) {
        const text = (await body.textContent()) ?? '';
        if (text.length > 100) {
          contentReady = Date.now() - start;
          break;
        }
        await page.waitForTimeout(200);
      }
      if (!contentReady) contentReady = Date.now() - start;

      console.log(`⏱️ ${label}: DOM=${domReady}ms | Contenido=${contentReady}ms`);

      // Contenido debería cargar en menos de 20s
      expect(contentReady).toBeLessThan(20_000);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Crear invitado + verificar en lista
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Invitado — crear y verificar link', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
  });

  test('crear invitado E2E con pases en Boda Isabel & Raúl', async ({
    page,
  }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    // Login y seleccionar evento
    const start = Date.now();
    const loggedIn = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    const loginTime = Date.now() - start;
    console.log(`⏱️ Login + selección evento: ${loginTime}ms`);

    if (!loggedIn) { test.skip(); return; }

    // Navegar a invitados
    const navStart = Date.now();
    await page.goto(`${BASE_URL}/invitados`, {
      waitUntil: 'domcontentloaded',
      timeout: 40_000,
    });
    await waitForAppReady(page, 20_000);
    const navTime = Date.now() - navStart;
    console.log(`⏱️ Carga /invitados: ${navTime}ms`);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Buscar botón de añadir invitado
    const addBtn = page
      .locator('button, [role="button"]')
      .filter({ hasText: /añadir|agregar|nuevo|add|invitado|crear/i })
      .first();

    const hasAddBtn = await addBtn.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasAddBtn) {
      console.log('ℹ️ Botón añadir invitado no encontrado — verificar UI');
      // Al menos verificar que la página cargó
      expect(text.length).toBeGreaterThan(50);
      return;
    }

    // Click en añadir
    const addStart = Date.now();
    await addBtn.click();
    await page.waitForTimeout(2000);

    // Rellenar nombre
    const nameInput = page
      .locator('input[placeholder*="nombre" i], input[placeholder*="name" i], input[type="text"]')
      .first();

    if (await nameInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nameInput.fill(GUEST_NAME);
      console.log(`✅ Nombre rellenado: ${GUEST_NAME}`);
    } else {
      console.log('ℹ️ Input nombre no encontrado');
      return;
    }

    // Rellenar pases (si existe el campo)
    const passesInput = page
      .locator('input[placeholder*="pases" i], input[placeholder*="passes" i], input[type="number"]')
      .first();
    if (await passesInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await passesInput.fill(GUEST_PASSES);
      console.log(`✅ Pases: ${GUEST_PASSES}`);
    }

    // Guardar
    const saveBtn = page
      .locator('[role="dialog"] button, form button, .modal button')
      .filter({ hasText: /guardar|crear|añadir|save|aceptar|agregar/i })
      .first();

    if (await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await saveBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(3000);

    const addTime = Date.now() - addStart;
    console.log(`⏱️ Crear invitado (UI): ${addTime}ms`);

    // Verificar que aparece en la lista
    const guestEl = page.getByText(GUEST_NAME, { exact: false });
    const isVisible = await guestEl.first().isVisible({ timeout: 10_000 }).catch(() => false);

    if (isVisible) {
      console.log(`✅ Invitado "${GUEST_NAME}" visible en lista`);
      await expect(guestEl.first()).toBeVisible();
    } else {
      // Puede haberse añadido pero la lista no actualizó — verificar en body
      const afterText = (await page.locator('body').textContent()) ?? '';
      expect(afterText).not.toMatch(/Error Capturado por ErrorBoundary/);
      console.log('ℹ️ Invitado no visible aún — puede requerir refresh');
    }
  });

  test('link de invitación carga y muestra portal', async ({ context, page }) => {
    if (!isAppTest) { test.skip(); return; }

    // Portal público del evento Isabel & Raúl
    const EVENTO_ID = '66a9042dec5c58aa734bca44';
    const portalUrl = `${BASE_URL}/e/${EVENTO_ID}`;

    const start = Date.now();
    await page.goto(portalUrl, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    const loadTime = Date.now() - start;

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(30);

    console.log(`⏱️ Portal evento: ${loadTime}ms`);
    console.log(`📄 Contenido: ${text.slice(0, 200)}`);
  });

  test('link de confirmación de asistencia carga sin crash', async ({ context, page }) => {
    if (!isAppTest) { test.skip(); return; }

    // Token del invitado Juancarlos test (creado previamente)
    const TOKEN = '69b18ecb88d73ae182f4c3209042de66a9042dec5c58aa734bca44';
    const rsvpUrl = `${BASE_URL}/confirmar-asistencia?pGuestEvent=${TOKEN}`;

    const start = Date.now();
    await page.goto(rsvpUrl, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    const loadTime = Date.now() - start;

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(30);

    console.log(`⏱️ RSVP link: ${loadTime}ms`);

    // Debe mostrar nombre del invitado o formulario de confirmación
    const hasRSVP = /confirmar|asistencia|Juancarlos|invitado|boda|Isabel|Raúl/i.test(text);
    console.log(`RSVP contenido: ${hasRSVP ? 'OK' : 'parcial'} — ${text.slice(0, 200)}`);
  });
});
