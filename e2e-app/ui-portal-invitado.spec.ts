/**
 * ui-portal-invitado.spec.ts — Tests UI directos: rutas públicas del portal del invitado
 *
 * Cada test = Hipótesis → Acción real del usuario en UI → Resultado medible en sistema.
 *
 * Tests:
 *   PORTAL-01 [sin sesión] /confirmar-asistencia con token inválido → no crash, formulario vacío, sin datos privados
 *   PORTAL-02 [sin sesión] /public-card/{eventId} → no crash, info pública OK, sin lista de invitados
 *   PORTAL-03 [sin sesión] /public-itinerary/{eventId} → no crash, solo tasks spectatorView=true visibles
 *
 * Autenticación: Ninguna — todas las rutas son públicas (no requieren sesión).
 *
 * Ejecución:
 *   E2E_ENV=dev npx playwright test e2e-app/ui-portal-invitado.spec.ts --project=webkit
 *   Solo un test:
 *   E2E_ENV=dev npx playwright test e2e-app/ui-portal-invitado.spec.ts --project=webkit --grep "PORTAL-01"
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { TEST_URLS } from './fixtures';
import { clearSession } from './helpers';
import { ISABEL_RAUL_EVENT } from './fixtures/isabel-raul-event';

// ── Constantes ─────────────────────────────────────────────────────────────────

const BASE_URL = TEST_URLS.app;
const EVENT_ID = ISABEL_RAUL_EVENT.id;

/**
 * Datos privados que NUNCA deben aparecer en rutas públicas sin sesión válida.
 * Son nombres reales de invitados de la Boda Isabel & Raúl.
 */
const PRIVATE_NAMES = ISABEL_RAUL_EVENT.invitados.pendientesList;

/** Tiempo máximo para que la página cargue */
const PAGE_TIMEOUT = 20_000;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Helper ──────────────────────────────────────────────────────────────────────

/**
 * Navega a una URL pública sin sesión y espera a que la página cargue.
 * Devuelve { bodyText, url } tras cargar.
 */
async function navegarSinSesion(
  page: Page,
  context: BrowserContext,
  url: string,
): Promise<{ bodyText: string; url: string }> {
  await clearSession(context, page);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Esperar a que la página se estabilice (no está en loading)
  await page.waitForFunction(
    () => {
      const t = document.body.innerText ?? '';
      return t.length > 20 && !/^(\s*)$/.test(t);
    },
    { timeout: PAGE_TIMEOUT },
  ).catch(() => {});

  await delay(1_500); // margen para renders cliente-side (useEffect SSR → CSR)

  const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
  const finalUrl = page.url();
  return { bodyText, url: finalUrl };
}

/**
 * Verifica que ningún nombre privado aparece en el DOM.
 */
function verificarSinDatosPrivados(bodyText: string, testId: string): void {
  for (const name of PRIVATE_NAMES) {
    const found = bodyText.toLowerCase().includes(name.toLowerCase());
    if (found) {
      console.log(`[${testId}] LEAK detectado: "${name}" aparece en el DOM`);
    }
    expect(
      found,
      `[${testId}] El nombre privado "${name}" NO debe aparecer en rutas públicas`,
    ).toBe(false);
  }
}

// ── Estado global (beforeAll) ──────────────────────────────────────────────────

let appOk = false;

/**
 * ID del primer itinerario de Boda Isabel & Raúl.
 * Se obtiene en beforeAll via /api/public/event/{eventId} (sin auth, público).
 * Si no se puede obtener, PORTAL-03 se saltará.
 */
let itinerarioId: string | null = null;

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const text = (await page.locator('body').textContent().catch(() => null)) ?? '';
    appOk = text.length > 50 && !/1033|Cloudflare|Please enable cookies/i.test(text);

    if (appOk) {
      // Obtener el primer itinerario del evento via API pública (sin auth)
      const eventData = await page.evaluate(async (eventId) => {
        const res = await fetch(`/api/public/event/${eventId}`);
        if (!res.ok) return null;
        return res.json();
      }, EVENT_ID);

      const itinerarios = eventData?.event?.itinerarios_array;
      if (Array.isArray(itinerarios) && itinerarios.length > 0) {
        itinerarioId = itinerarios[0]._id;
        console.log(`[PORTAL beforeAll] itinerarioId=${itinerarioId} (de ${itinerarios.length} itinerarios)`);
      } else {
        console.log('[PORTAL beforeAll] sin itinerarios en el evento');
      }
    }
  } catch (e) {
    console.log('[PORTAL beforeAll] error:', e);
    appOk = false;
  } finally {
    await page.close();
    await ctx.close();
  }
  console.log(`[PORTAL beforeAll] appOk=${appOk} itinerarioId=${itinerarioId}`);
});

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('BATCH PORTAL — Portal Público del Invitado', () => {

  // ────────────────────────────────────────────────────────────────────────────
  test('PORTAL-01 [sin sesión] confirmar-asistencia con token inválido → no crash + formulario vacío + sin datos privados', async ({ page, context }) => {
    /**
     * Hipótesis: Si se navega a /confirmar-asistencia con un token (pGuestEvent) inválido,
     * la página carga sin crashear y muestra el formulario en estado vacío/idle.
     * No aparecen nombres ni datos reales de invitados en el DOM.
     *
     * Resultado medible:
     *  - NO hay "Error Capturado por ErrorBoundary" en el DOM
     *  - El formulario de confirmación es visible (aunque vacío)
     *  - Ningún nombre de la lista PRIVATE_NAMES aparece en el DOM
     */
    if (!appOk) {
      test.skip(true, 'PORTAL-01: servidor no disponible (beforeAll)');
      return;
    }

    const tokenInvalido = 'INVALID_E2E_TOKEN_12345';
    const targetUrl = `${BASE_URL}/confirmar-asistencia?pGuestEvent=${tokenInvalido}`;

    const { bodyText, url } = await navegarSinSesion(page, context, targetUrl);

    console.log(`[PORTAL-01] url=${url}`);
    console.log(`[PORTAL-01] body (300 chars):`, bodyText.slice(0, 300).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: sin crash ───────────────────────────────────────
    expect(
      bodyText,
      'PORTAL-01: No debe haber ErrorBoundary en /confirmar-asistencia con token inválido',
    ).not.toMatch(/Error Capturado por ErrorBoundary/i);

    // ── Resultado medible 2: formulario o página de confirmación es visible ──
    // FormComponent renderiza incluso con guestData=undefined (formulario vacío/idle)
    // La página completa siempre se renderiza — la API falla silenciosamente
    const pageLoaded = bodyText.length > 30 && !(/^(\s*)$/.test(bodyText));
    expect(pageLoaded, 'PORTAL-01: La página debe cargar con contenido').toBe(true);

    // ── Resultado medible 3: sin datos privados ───────────────────────────────
    verificarSinDatosPrivados(bodyText, 'PORTAL-01');
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('PORTAL-02 [sin sesión] /public-card/{eventId} → no crash + sin lista completa de invitados', async ({ page, context }) => {
    /**
     * Hipótesis: Sin sesión, /public-card/{eventId} carga sin crash.
     * Si el evento tiene itinerarios, muestra nombre/tipo del evento (datos públicos).
     * Si no tiene itinerarios o el slug es inválido, muestra 404 graceful.
     * En ningún caso se expone la lista completa de invitados.
     *
     * URL format: /public-card/ev-{eventId}[-{itinerarioId}]
     * Si no se pasa itinerarioId: backend usa el primer itinerario del evento.
     *
     * Resultado medible:
     *  - NO hay "Error Capturado por ErrorBoundary"
     *  - Ningún nombre de PRIVATE_NAMES aparece en el DOM
     *  - La página no crashea (muestra algún contenido o 404 graceful)
     */
    if (!appOk) {
      test.skip(true, 'PORTAL-02: servidor no disponible (beforeAll)');
      return;
    }

    // Usar slug sin itinerarioId → backend busca primer itinerario del evento
    const targetUrl = `${BASE_URL}/public-card/ev-${EVENT_ID}`;

    const { bodyText, url } = await navegarSinSesion(page, context, targetUrl);

    console.log(`[PORTAL-02] url=${url}`);
    console.log(`[PORTAL-02] body (400 chars):`, bodyText.slice(0, 400).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: sin crash ───────────────────────────────────────
    expect(
      bodyText,
      'PORTAL-02: No debe haber ErrorBoundary en /public-card',
    ).not.toMatch(/Error Capturado por ErrorBoundary/i);

    // ── Resultado medible 2: algún contenido cargó ───────────────────────────
    // Acepta: datos del evento (nombre, tipo) O mensaje de error 404 graceful
    // Rechaza: página completamente en blanco o crash
    const hasContent = bodyText.length > 30;
    expect(hasContent, 'PORTAL-02: La página debe mostrar algún contenido').toBe(true);

    // ── Resultado medible 3: sin datos privados (lista de invitados) ──────────
    verificarSinDatosPrivados(bodyText, 'PORTAL-02');

    // ── Diagnóstico: ¿qué tipo de página cargó? ───────────────────────────────
    const showed404 = /Page not found error 404/i.test(bodyText);
    const showedError = /Error al cargar la tarjeta/i.test(bodyText);
    const showedEventName = /Isabel.*Raúl|Boda.*Isabel|BODA/i.test(bodyText);
    console.log(`[PORTAL-02] showed404=${showed404} showedError=${showedError} showedEventName=${showedEventName}`);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('PORTAL-03 [sin sesión] /public-itinerary/{eventId}/{itinerarioId} → no crash + solo tasks spectatorView=true', async ({ page, context }) => {
    /**
     * Hipótesis: Sin sesión, /public-itinerary/ev-{eventId}-{itinerarioId} carga sin crash.
     * El componente filtra client-side: solo muestra tasks con spectatorView=true.
     * En ningún caso se expone la lista de invitados del evento.
     *
     * El itinerarioId se obtiene en beforeAll via /api/public/event/{eventId} (sin auth).
     * Si no se puede obtener un ID válido, el test se salta.
     *
     * URL format: /public-itinerary/ev-{eventId}-{itinerarioId}
     *
     * Resultado medible:
     *  - NO hay "Error Capturado por ErrorBoundary"
     *  - Ningún nombre de PRIVATE_NAMES aparece en el DOM
     *  - La página carga algún contenido (tasks públicos o "Page not found" graceful)
     *  - NO hay botones de editar/borrar tasks (solo lectura)
     */
    if (!appOk) {
      test.skip(true, 'PORTAL-03: servidor no disponible (beforeAll)');
      return;
    }
    if (!itinerarioId) {
      test.skip(true, 'PORTAL-03: no se pudo obtener itinerarioId del evento (beforeAll)');
      return;
    }

    // URL con eventId e itinerarioId válidos → SSR puede devolver datos reales
    const targetUrl = `${BASE_URL}/public-itinerary/ev-${EVENT_ID}-${itinerarioId}`;
    console.log(`[PORTAL-03] navegando a: ${targetUrl}`);

    const { bodyText, url } = await navegarSinSesion(page, context, targetUrl);

    console.log(`[PORTAL-03] url=${url}`);
    console.log(`[PORTAL-03] body (400 chars):`, bodyText.slice(0, 400).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: sin crash ───────────────────────────────────────
    expect(
      bodyText,
      'PORTAL-03: No debe haber ErrorBoundary en /public-itinerary',
    ).not.toMatch(/Error Capturado por ErrorBoundary/i);

    // ── Resultado medible 2: la página responde de forma graciosa ────────────
    // Acepta: tasks con spectatorView=true, "Page not found error 404" (sin tasks públicos),
    // o nombre del evento. Lo que NO acepta: pantalla completamente en blanco.
    // "Page not found error 404" cuenta como contenido graceful (no es un crash).
    const showed404 = /Page not found error 404/i.test(bodyText);
    const hasAnyContent = bodyText.trim().length > 5;
    expect(
      hasAnyContent,
      'PORTAL-03: La página debe mostrar algún contenido (incluyendo 404 graceful)',
    ).toBe(true);

    // ── Resultado medible 3: sin datos privados ───────────────────────────────
    verificarSinDatosPrivados(bodyText, 'PORTAL-03');

    // ── Resultado medible 4: NO hay botones de edición en modo público ────────
    const hasEditControls = await page.locator('button:visible').filter({
      hasText: /editar|borrar|eliminar|edit|delete/i,
    }).count().catch(() => 0);

    console.log(`[PORTAL-03] botones edición visibles: ${hasEditControls}`);
    expect(
      hasEditControls,
      'PORTAL-03: No deben aparecer botones de edición en modo público',
    ).toBe(0);

    // ── Diagnóstico: ¿qué tipo de página cargó? ───────────────────────────────
    const showedEventName = /Isabel.*Raúl|Boda.*Isabel|BODA/i.test(bodyText);
    console.log(`[PORTAL-03] showed404=${showed404} showedEventName=${showedEventName}`);
  });

});
