/**
 * persistencia-crud.spec.ts
 * Layer C — Persistencia de mutaciones (Round-trip DB)
 *
 * Cada test verifica que una mutación realizada desde el frontend realmente
 * se persiste en la base de datos y puede ser recuperada en una consulta posterior.
 *
 * Patrón:
 *   1. Login real con email+password (no dev_bypass — necesita Firebase auth para write ops)
 *   2. Ejecuta la mutación vía /api/proxy/graphql (sin mock)
 *   3. Re-consulta el evento con queryEvent para verificar que el dato está en DB
 *   4. Cleanup: elimina el dato creado
 *
 * Tests:
 *   C-02  Presupuesto — crear categoría → verificar en presupuesto_objeto.categorias_array
 *   C-04  Itinerario  — crear tarea    → verificar en itinerarios_array[0].tasks
 *
 * Si C-XX falla → el bug está en la API/BD (la UI puede funcionar con el dato cacheado).
 * Si la Capa B (consistencia-db-ui) falla → el bug está en la UI renderizando datos reales.
 *
 * Ejecutar:
 *   E2E_ENV=dev npx playwright test e2e-app/persistencia-crud.spec.ts --project=webkit
 *   E2E_ENV=test npx playwright test e2e-app/persistencia-crud.spec.ts --project=webkit
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { TEST_URLS } from './fixtures';
import { waitForAppReady, loginAndSelectEventByName } from './helpers';
import { ISABEL_RAUL_EVENT, TEST_USERS } from './fixtures/isabel-raul-event';
import { queryEvent, mutateEvent } from './lib/api';

const APP_URL = TEST_URLS.app;
const EVENT_ID = ISABEL_RAUL_EVENT.id;
const { email, password } = TEST_USERS.organizador;

// ─── Contexto compartido (login una vez para todos los C-tests) ───────────────

let sharedCtx: BrowserContext | null = null;
let sharedPage: Page | null = null;
let serverOk = false;

test.beforeAll(async ({ browser }) => {
  sharedCtx = await browser.newContext();
  sharedPage = await sharedCtx.newPage();

  const eventId = await loginAndSelectEventByName(
    sharedPage,
    email,
    password,
    APP_URL,
    'Isabel',
  );

  if (!eventId) {
    console.warn('[C] No se pudo seleccionar "Boda Isabel & Raúl" — todos los C-tests se saltarán');
    return;
  }

  serverOk = true;
  console.log(`[C] Login OK — eventId=${eventId}`);
});

test.afterAll(async () => {
  await sharedCtx?.close();
  sharedCtx = null;
  sharedPage = null;
});

// ─────────────────────────────────────────────────────────────────────────────
// C-02 — Presupuesto: crear categoría → verificar en DB → cleanup
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('C-02 — Presupuesto: crear categoría y verificar en DB', () => {
  const CAT_NAME = `E2E-Cat-${Date.now().toString().slice(-8)}`;
  let createdCatId: string | null = null;

  test.afterAll(async () => {
    if (!createdCatId || !sharedPage) return;
    // Cleanup: borrar la categoría de test
    await mutateEvent(
      sharedPage,
      `mutation($evento_id:String,$categoria_id:String){
        borraCategoria(evento_id:$evento_id, categoria_id:$categoria_id){ coste_final }
      }`,
      { evento_id: EVENT_ID, categoria_id: createdCatId },
    );
    console.log(`[C-02 afterAll] ✅ Cleanup: categoría ${createdCatId} (${CAT_NAME}) eliminada`);
    createdCatId = null;
  });

  test('[C-02a] nuevoCategoria → devuelve _id válido', async () => {
    if (!serverOk || !sharedPage) { test.skip(); return; }

    const data = await mutateEvent(
      sharedPage,
      `mutation($evento_id:String,$nombre:String){
        nuevoCategoria(evento_id:$evento_id, nombre:$nombre){ _id nombre }
      }`,
      { evento_id: EVENT_ID, nombre: CAT_NAME },
    );

    const cat = data?.nuevoCategoria;
    expect(cat, '[C-02a] nuevoCategoria devolvió null/undefined').toBeTruthy();
    expect(cat._id, '[C-02a] _id vacío').toBeTruthy();
    expect(cat.nombre, '[C-02a] nombre en respuesta no coincide').toBe(CAT_NAME);

    createdCatId = cat._id;
    console.log(`[C-02a] ✅ Categoría creada: id=${createdCatId} nombre="${cat.nombre}"`);
  });

  test('[C-02b] queryEvent → categoría persiste en presupuesto_objeto.categorias_array', async () => {
    if (!serverOk || !sharedPage || !createdCatId) { test.skip(); return; }

    const apiEvent = await queryEvent(
      sharedPage,
      EVENT_ID,
      'presupuesto_objeto { categorias_array { _id nombre } }',
    );

    expect(apiEvent, '[C-02b] queryEvent devolvió null').toBeTruthy();

    const cats: Array<{ _id: string; nombre: string }> =
      (apiEvent.presupuesto_objeto?.categorias_array ?? []).filter(Boolean);

    const found = cats.find((c) => c._id === createdCatId || c.nombre === CAT_NAME);

    if (found) {
      console.log(`[C-02b] ✅ Categoría verificada en DB: id=${found._id} nombre="${found.nombre}"`);
    } else {
      console.warn('[C-02b] Categorías en DB:', cats.map((c) => `${c.nombre}(${c._id})`).join(', '));
    }

    expect(found, `[C-02b] "${CAT_NAME}" no encontrado en presupuesto_objeto.categorias_array`).toBeTruthy();
    expect(found!.nombre, '[C-02b] nombre en DB no coincide').toBe(CAT_NAME);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// C-04 — Itinerario: crear tarea → verificar en DB → cleanup
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('C-04 — Itinerario: crear tarea y verificar en DB', () => {
  const TASK_DESC = `E2E-Task-${Date.now().toString().slice(-8)}`;
  let itinerarioId: string | null = null;
  let createdTaskId: string | null = null;

  test.afterAll(async () => {
    if (!createdTaskId || !itinerarioId || !sharedPage) return;
    await mutateEvent(
      sharedPage,
      `mutation($eventID:String,$itinerarioID:String,$taskID:String){
        deleteTask(eventID:$eventID, itinerarioID:$itinerarioID, taskID:$taskID)
      }`,
      { eventID: EVENT_ID, itinerarioID: itinerarioId, taskID: createdTaskId },
    );
    console.log(`[C-04 afterAll] ✅ Cleanup: tarea ${createdTaskId} (${TASK_DESC}) eliminada`);
    createdTaskId = null;
    itinerarioId = null;
  });

  test('[C-04a] queryEvent → obtener itinerarioID', async () => {
    if (!serverOk || !sharedPage) { test.skip(); return; }

    const apiEvent = await queryEvent(sharedPage, EVENT_ID, 'itinerarios_array { _id }');
    expect(apiEvent, '[C-04a] queryEvent devolvió null').toBeTruthy();

    const itin = (apiEvent.itinerarios_array ?? []).filter(Boolean)[0];
    expect(itin, '[C-04a] itinerarios_array vacío — evento sin itinerarios').toBeTruthy();

    itinerarioId = itin._id;
    console.log(`[C-04a] ✅ itinerarioID=${itinerarioId}`);
  });

  test('[C-04b] createTask → devuelve _id válido', async () => {
    if (!serverOk || !sharedPage || !itinerarioId) { test.skip(); return; }

    const data = await mutateEvent(
      sharedPage,
      `mutation($eventID:String,$itinerarioID:String,$fecha:String,$descripcion:String,$hora:String,$duracion:Int){
        createTask(eventID:$eventID, itinerarioID:$itinerarioID, fecha:$fecha, descripcion:$descripcion, hora:$hora, duracion:$duracion){
          _id descripcion hora
        }
      }`,
      {
        eventID: EVENT_ID,
        itinerarioID: itinerarioId,
        fecha: '2025-12-30',
        descripcion: TASK_DESC,
        hora: '14:00',
        duracion: 30,
      },
    );

    const task = data?.createTask;
    expect(task, '[C-04b] createTask devolvió null').toBeTruthy();
    expect(task._id, '[C-04b] _id vacío').toBeTruthy();
    expect(task.descripcion, '[C-04b] descripcion en respuesta no coincide').toBe(TASK_DESC);

    createdTaskId = task._id;
    console.log(`[C-04b] ✅ Tarea creada: id=${createdTaskId} desc="${task.descripcion}" hora=${task.hora}`);
  });

  test('[C-04c] queryEvent → tarea persiste en itinerarios_array[0].tasks', async () => {
    if (!serverOk || !sharedPage || !itinerarioId || !createdTaskId) { test.skip(); return; }

    const apiEvent = await queryEvent(
      sharedPage,
      EVENT_ID,
      'itinerarios_array { _id tasks { _id descripcion hora } }',
    );

    expect(apiEvent, '[C-04c] queryEvent devolvió null').toBeTruthy();

    const itin = (apiEvent.itinerarios_array ?? [])
      .filter(Boolean)
      .find((i: any) => i._id === itinerarioId);

    expect(itin, `[C-04c] itinerario ${itinerarioId} no encontrado en re-query`).toBeTruthy();

    const tasks: Array<{ _id: string; descripcion: string; hora: string }> =
      (itin.tasks ?? []).filter(Boolean);

    const found = tasks.find((t) => t._id === createdTaskId || t.descripcion === TASK_DESC);

    if (found) {
      console.log(`[C-04c] ✅ Tarea verificada en DB: id=${found._id} desc="${found.descripcion}" hora=${found.hora}`);
    } else {
      console.warn('[C-04c] Tasks en DB:', tasks.map((t) => `${t.descripcion}(${t._id})`).join(', '));
    }

    expect(found, `[C-04c] "${TASK_DESC}" no encontrado en itinerarios_array[].tasks`).toBeTruthy();
    expect(found!.descripcion, '[C-04c] descripcion en DB no coincide').toBe(TASK_DESC);
  });
});
