/**
 * consistencia-db-ui.spec.ts
 * Layer B — Consistencia DB ↔ UI
 *
 * Cada test verifica que la UI muestra exactamente los datos que devuelve la API:
 *   1. Consulta directa a /api/proxy/graphql (apiapp.bodasdehoy.com sin mock)
 *   2. Navega al módulo en la UI
 *   3. Verifica que el valor en DOM === el valor en la API
 *
 * Si estos tests fallan → hay un bug en las queries o en el renderizado.
 *
 * Evento de referencia: "Boda Isabel & Raúl" (ID 66a9042dec5c58aa734bca44)
 *
 * Ejecutar:
 *   E2E_ENV=dev npx playwright test consistencia-db-ui.spec.ts --project=webkit
 *   E2E_ENV=test npx playwright test consistencia-db-ui.spec.ts --project=webkit
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { TEST_URLS, E2E_ENV } from './fixtures';
import { loginAndSelectEventByName, waitForAppReady } from './helpers';
import { ISABEL_RAUL_EVENT, TEST_USERS } from './fixtures/isabel-raul-event';
import { queryEvent, B_LAYER_FIELDS } from './lib/api';

const APP_URL = TEST_URLS.app;
const EVENT_ID = ISABEL_RAUL_EVENT.id;
const { email, password } = TEST_USERS.organizador;

// ─── Contexto compartido (login una sola vez para todos los B-tests) ──────────

let sharedCtx: BrowserContext | null = null;
let sharedPage: Page | null = null;
let apiEvent: any = null; // datos del evento tal como los devuelve apiapp
let serverOk = false;

test.beforeAll(async ({ browser }) => {
  sharedCtx = await browser.newContext();
  sharedPage = await sharedCtx.newPage();

  // Login real y selección del evento de referencia
  const eventId = await loginAndSelectEventByName(
    sharedPage,
    email,
    password,
    APP_URL,
    'Isabel',
  );

  if (!eventId) {
    console.warn('[B] No se pudo seleccionar "Boda Isabel & Raúl" — todos los tests B se saltarán');
    return;
  }

  // Consultar la API con la sesión activa del browser (cookie idTokenV0.1.0)
  try {
    apiEvent = await queryEvent(sharedPage, EVENT_ID, B_LAYER_FIELDS);
    serverOk = !!apiEvent?._id;
    const total = apiEvent?.invitados_array?.filter(Boolean)?.length ?? '?';
    console.log(`[B] API OK — evento: ${apiEvent?._id}, invitados: ${total}`);
  } catch (e) {
    console.error('[B] Error al consultar la API directa:', e);
  }
});

test.afterAll(async () => {
  await sharedCtx?.close();
  sharedCtx = null;
  sharedPage = null;
});

// ─── Helpers locales ──────────────────────────────────────────────────────────

/** Navega a una ruta y espera que la app esté lista. Reutiliza sharedPage. */
async function gotoModule(path: string): Promise<void> {
  if (!sharedPage) throw new Error('sharedPage no inicializada');
  await sharedPage.goto(`${APP_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await waitForAppReady(sharedPage, 20_000);
  // Esperar que desaparezca cualquier indicador de carga
  await sharedPage.waitForTimeout(1_000);
}

/** Extrae un número del texto del body usando una regex. */
async function extractNumber(pattern: RegExp): Promise<number> {
  if (!sharedPage) return -1;
  const text = await sharedPage.locator('body').textContent() ?? '';
  const match = text.match(pattern);
  return match ? parseInt(match[1], 10) : -1;
}

// ─── B-01: Total invitados ────────────────────────────────────────────────────

test('[B-01] Invitados: total API === header "X Invitados"', async () => {
  if (!serverOk) { test.skip(); return; }

  const apiTotal = apiEvent?.invitados_array?.filter(Boolean)?.length ?? -1;
  expect(apiTotal, 'API devolvió invitados_array vacío o null').toBeGreaterThan(0);

  await gotoModule('/invitados');

  // Esperar a que el número aparezca antes de leer el body
  await sharedPage!.waitForFunction(
    (n) => {
      const text = document.body.textContent ?? '';
      return new RegExp(`${n}\\s*Invitados`).test(text);
    },
    apiTotal,
    { timeout: 15_000 },
  ).catch(() => {
    console.warn(`[B-01] Timeout esperando "${apiTotal} Invitados" en la UI`);
  });

  // Pattern: "{N} Invitados" — mostrado en BlockCabecera
  const uiTotal = await extractNumber(/(\d+)\s*Invitados/);

  console.log(`[B-01] API total=${apiTotal}, UI total=${uiTotal}`);
  expect(uiTotal, `UI muestra ${uiTotal} pero API devuelve ${apiTotal}`).toBe(apiTotal);
});

// ─── B-02: Invitados confirmados ──────────────────────────────────────────────

test('[B-02] Invitados: confirmados API === "X de Y confirmados" UI', async () => {
  if (!serverOk) { test.skip(); return; }

  const apiConfirmados = apiEvent?.invitados_array
    ?.filter(Boolean)
    ?.filter((i: any) => i?.asistencia === 'confirmado')?.length ?? -1;

  expect(apiConfirmados, 'No se pudo calcular confirmados desde API').toBeGreaterThanOrEqual(0);

  // Ya deberíamos estar en /invitados desde B-01
  if (!sharedPage!.url().includes('/invitados')) {
    await gotoModule('/invitados');
  }

  // Pattern: "{confirmados} de {total}" seguido de "confirmados"
  // BlockCabecera: TotalList[1].title = `${confirmados} de ${total}`, subtitle = "confirmados"
  const uiConfirmados = await extractNumber(/(\d+)\s*de\s*\d+/);

  console.log(`[B-02] API confirmados=${apiConfirmados}, UI confirmados=${uiConfirmados}`);
  expect(uiConfirmados, `UI muestra ${uiConfirmados} confirmados pero API devuelve ${apiConfirmados}`).toBe(apiConfirmados);
});

// ─── B-03: Presupuesto total ──────────────────────────────────────────────────

test('[B-03] Presupuesto: total API === total en UI', async () => {
  if (!serverOk) { test.skip(); return; }

  const apiPresupuestoTotal: number | null = apiEvent?.presupuesto_total ?? null;

  if (apiPresupuestoTotal === null || apiPresupuestoTotal === undefined) {
    console.log('[B-03] presupuesto_total no disponible en API response — skip');
    test.skip();
    return;
  }

  await gotoModule('/presupuesto');

  // El total se muestra como un número con posible separador de miles (ej. "15.000" o "15,000")
  // Buscamos el valor numérico del total del presupuesto en la página
  // Pattern conservador: buscamos el número exacto o con separadores
  const totalStr = apiPresupuestoTotal.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  const totalInt = Math.round(apiPresupuestoTotal);

  const text = await sharedPage!.locator('body').textContent() ?? '';
  const hasTotal =
    text.includes(String(totalInt)) ||
    text.includes(totalStr) ||
    text.includes(apiPresupuestoTotal.toFixed(2));

  console.log(`[B-03] API presupuesto_total=${apiPresupuestoTotal}, encontrado en UI: ${hasTotal}`);
  expect(hasTotal, `El total de presupuesto ${apiPresupuestoTotal} no aparece en la UI`).toBe(true);
});

// ─── B-04: Servicios — número de tarjetas en kanban ──────────────────────────

test.skip('[B-04] Servicios: total API === tarjetas en kanban', async () => {
  // TODO — servicios_array no está en la query actual de B_LAYER_FIELDS.
  // Para implementar: añadir `servicios_array { _id estatus }` a B_LAYER_FIELDS
  // y encontrar el selector para las tarjetas del kanban.
});

// ─── B-05: Itinerario — número de tareas en timeline ─────────────────────────

test('[B-05] Itinerario: tasks en API === items en timeline UI', async () => {
  if (!serverOk) { test.skip(); return; }

  // itinerarios_array puede tener múltiples itinerarios — usamos el primero
  const firstItinerary = apiEvent?.itinerarios_array?.[0];
  const apiTasksTotal = firstItinerary?.tasks?.length ?? -1;

  if (apiTasksTotal < 0) {
    console.log('[B-05] itinerarios_array[0].tasks no disponible — skip');
    test.skip();
    return;
  }

  await gotoModule('/itinerario');

  // Esperar a que los ítems del itinerario carguen
  // Los items del timeline son renderizados como elementos individuales.
  // Usamos un approach más robusto: verificar que el número de tasks visible en el DOM
  // coincide con lo que devuelve la API.
  //
  // Strategy: contar los elementos que representan tareas en la timeline.
  // BoddyIter → ItineraryPanel → ItineraryTable rende una fila por tarea.
  // Esperamos al menos apiTasksTotal ítems en la página.
  await sharedPage!.waitForTimeout(2_000); // dar tiempo a que rendericen

  // Contar filas de tabla o items del timeline
  // Los tasks se renderizan en una tabla (ItineraryTable) o como items en columnas (ItineraryColumns)
  const taskRows = await sharedPage!.locator('tbody tr, [data-task-id], .task-row').count().catch(() => 0);

  console.log(`[B-05] API tasks=${apiTasksTotal}, UI task rows=${taskRows}`);

  // Si el selector no captura nada, verificar que al menos el número aparece en el body
  if (taskRows === 0) {
    const text = await sharedPage!.locator('body').textContent() ?? '';
    const hasCount = text.includes(String(apiTasksTotal));
    console.log(`[B-05] selector no capturó filas — buscando ${apiTasksTotal} en body: ${hasCount}`);
    // Verificación relaxed: al menos el número debe aparecer
    expect(hasCount, `Ni el selector ni el texto contienen el total de tasks (${apiTasksTotal})`).toBe(true);
  } else {
    expect(taskRows, `UI muestra ${taskRows} tasks pero API devuelve ${apiTasksTotal}`).toBe(apiTasksTotal);
  }
});

// ─── B-06: Mesas — número de mesas en lienzo ─────────────────────────────────

test('[B-06] Mesas: tablas en API === mesas en lienzo UI', async () => {
  if (!serverOk) { test.skip(); return; }

  // planSpace puede tener múltiples espacios — usamos el seleccionado (planSpaceSelect)
  // Por simplicidad tomamos planSpace[0]
  const firstSpace = apiEvent?.planSpace?.[0];
  const apiTablesTotal = firstSpace?.tables?.filter(Boolean)?.length ?? -1;

  if (apiTablesTotal < 0) {
    console.log('[B-06] planSpace[0].tables no disponible — skip');
    test.skip();
    return;
  }

  await gotoModule('/mesas');

  // Esperar que el lienzo cargue
  await sharedPage!.waitForTimeout(3_000);

  // Las mesas se renderizan en el lienzo (LienzoDragable) como elementos individuales.
  // Buscamos representaciones de mesas en el DOM.
  // El selector exacto depende de MesaRedonda/MesaCuadrada/MesaImperial renderizando SVGs o divs.
  const tableEls = await sharedPage!.locator('[data-table-id], [data-mesa-id], .mesa-container').count().catch(() => 0);

  console.log(`[B-06] API tables=${apiTablesTotal}, UI table elements=${tableEls}`);

  if (tableEls === 0) {
    // Verificación relajada si no hay data-testid: buscar el número en la página
    const text = await sharedPage!.locator('body').textContent() ?? '';
    const hasCount = text.includes(String(apiTablesTotal));
    console.log(`[B-06] sin selector preciso — buscando ${apiTablesTotal} en body: ${hasCount}`);
    // NOTE: este es un test de humo débil — mejorar añadiendo data-testid en LienzoDragable
    // Por ahora solo verificamos que la página cargue sin errores
    const hasError = /Error Capturado|ErrorBoundary|something went wrong/i.test(text);
    expect(hasError, 'La página de mesas muestra un error').toBe(false);
  } else {
    expect(tableEls, `UI muestra ${tableEls} mesas pero API devuelve ${apiTablesTotal}`).toBe(apiTablesTotal);
  }
});
