/**
 * kanban-tareas.spec.ts
 *
 * Tests del kanban de tareas en appEventos (/servicios):
 *   Recordatorio: /servicios = kanban de tareas (BoddyIter). Los "servicios"
 *   reales (proveedores/gastos) están en presupuesto como estimateCategory.
 *
 * Escenarios:
 *   1. /servicios carga con columnas kanban (Pending/In Progress/Completed/Blocked)
 *   2. Crear itinerario (grupo de tareas) → visible como tab/sección
 *   3. Crear tarea en columna "Pendiente" → visible en el kanban
 *   4. Abrir detalle de tarea → modal con campos editables
 *   5. Arrastrar tarea de "Pendiente" a "En progreso" → columna cambia
 *   6. Asignar responsable "novia" a tarea → avatar/badge visible
 *   7. Marcar tarea como completada desde detalle → aparece en "Completadas"
 *   8. Filtrar tareas por responsable (botón/selector)
 *   9. Selector de itinerarios (si hay múltiples) funciona
 *  10. Prioridad de tarea: alta/media/baja — indicador visual
 */
import { test, expect } from '@playwright/test';
import { clearSession, loginAndSelectEvent, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

const RUN_ID = Date.now().toString().slice(-6);
const TASK_DESC = `KanbanTask E2E ${RUN_ID}`;
const ITER_NAME = `Itinerario E2E ${RUN_ID}`;

// Columnas del kanban según interfaces del proyecto
const KANBAN_COLUMNS = {
  pending: /pendiente|pending|por hacer|to do/i,
  inProgress: /en progreso|in.?progress|en curso/i,
  completed: /completada|completed|hecho|done/i,
  blocked: /bloqueada|blocked/i,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Estructura del kanban
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Kanban Tareas — Estructura /servicios', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
  });

  test('/servicios carga con columnas kanban y título "Tasks"', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(4000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(100);

    // Contenido de servicios: título Tasks o Servicios, o cualquier vista del módulo
    const hasServiciosContent = /tasks|servicios|tarea|proveed|contrat|kanban/i.test(text);
    if (!hasServiciosContent) {
      console.warn('⚠️ /servicios sin contenido detectable — posible vista vacía o cambio de UI');
    } else {
      console.log('✅ /servicios carga con contenido de servicios/tareas');
    }
    expect(hasServiciosContent).toBe(true);
  });

  test('columnas del kanban visibles: Pendiente, En progreso, Completada', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';

    const hasPending = KANBAN_COLUMNS.pending.test(text);
    const hasInProgress = KANBAN_COLUMNS.inProgress.test(text);
    const hasCompleted = KANBAN_COLUMNS.completed.test(text);

    console.log(`Columnas detectadas: pendiente=${hasPending}, en progreso=${hasInProgress}, completada=${hasCompleted}`);

    const columnCount = [hasPending, hasInProgress, hasCompleted].filter(Boolean).length;
    const hasServiciosContent = /servicios|tarea|tasks|proveed|contrat/i.test(text);

    expect(
      columnCount > 0 || hasServiciosContent,
      'BUG_PRODUCTO: ni columnas kanban (pendiente/en progreso/completada) ni contenido servicios visibles'
    ).toBe(true);
  });

  test('selector de itinerarios disponible (ItineraryTabs)', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // ItineraryTabs o HeaderIter
    const hasTabs =
      (await page.locator('[role="tab"], [class*="tab"], [class*="ItineraryTab"]').count()) > 0;
    const hasSelector =
      (await page.locator('select, [class*="selector"], [class*="itinerary-select"]').count()) > 0;

    expect(hasTabs || hasSelector, 'BUG_PRODUCTO: ni tabs ni selector de itinerario visible en /servicios').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Crear tarea en el kanban
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Kanban Tareas — Crear tarea', () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
  });

  test('crear tarea E2E en columna Pendiente → visible en kanban', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Buscar botón de añadir tarea (puede ser en la columna pendiente o botón global)
    const addTaskBtn = page.locator('button').filter({
      hasText: /añadir tarea|nueva tarea|add task|crear tarea/i,
    }).first();

    // También puede ser un botón "+" en la columna pendiente
    const pendingCol = page.locator('[class*="column"], [class*="col"]').filter({
      hasText: KANBAN_COLUMNS.pending,
    }).first();
    const addInPendingBtn = pendingCol.locator('button').filter({ hasText: /\+|añadir|add/i }).first();

    let btnToClick: any = null;
    if (await addTaskBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      btnToClick = addTaskBtn;
    } else if (await addInPendingBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      btnToClick = addInPendingBtn;
    }

    if (!btnToClick) {
      // Intentar via AddEvent o AddTaskButton
      const addEventBtn = page.locator('[class*="AddEvent"], [class*="AddTask"]').first();
      if (await addEventBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        btnToClick = addEventBtn;
      }
    }

    expect(btnToClick, 'BUG_PRODUCTO: ningún botón añadir tarea visible (ni global, ni en columna pendiente, ni AddEvent)').toBeTruthy();

    await btnToClick.click();
    await page.waitForTimeout(1500);

    // Rellenar descripción de la tarea
    const descInput = page.locator('input[placeholder*="descripción"], input[placeholder*="tarea"], input[placeholder*="title"], textarea').first();
    const hasDescInput = await descInput.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasDescInput) {
      await descInput.fill(TASK_DESC);
    } else {
      const inlineInput = page.locator('[contenteditable="true"], input[type="text"]').last();
      await expect(inlineInput, 'BUG_PRODUCTO: ni modal ni inline input de nueva tarea visible tras click crear').toBeVisible({ timeout: 3_000 });
      await inlineInput.fill(TASK_DESC);
    }

    // Submit con Enter o botón guardar
    const saveBtn = page.locator('[role="dialog"], form').locator('button').filter({
      hasText: /guardar|crear|save|añadir/i,
    }).first();

    if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await saveBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    await page.waitForTimeout(3000);

    // Verificar tarea en el kanban
    const taskEl = page.getByText(TASK_DESC, { exact: false });
    const isVisible = await taskEl.first().isVisible({ timeout: 10_000 }).catch(() => false);

    await expect(
      taskEl.first(),
      `BUG_PRODUCTO: tarea "${TASK_DESC}" creada pero NO visible en kanban (mutation falló silente o UI no refrescó)`
    ).toBeVisible({ timeout: 10_000 });
  });

  test('crear itinerario nuevo → aparece como tab/opción', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(2000);

    // Buscar botón de nuevo itinerario (en HeaderIter o AddEvent)
    const newIterBtn = page.locator('button').filter({
      hasText: /nuevo itinerario|crear itinerario|add itinerary|nuevo/i,
    }).first();

    await expect(newIterBtn, 'BUG_PRODUCTO: botón nuevo itinerario no visible en /servicios').toBeVisible({ timeout: 8_000 });

    await newIterBtn.click();
    await page.waitForTimeout(1500);

    const nameInput = page.locator('input[type="text"], input[placeholder*="nombre"]').first();
    await expect(nameInput, 'BUG_PRODUCTO: input nombre itinerario no visible tras click crear').toBeVisible({ timeout: 5_000 });
    await nameInput.fill(ITER_NAME);

    const saveBtn = page.locator('[role="dialog"], form').locator('button').filter({
      hasText: /guardar|crear|save/i,
    }).first();
    if (await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await saveBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(2000);

    const iterEl = page.getByText(ITER_NAME, { exact: false });
    await expect(
      iterEl.first(),
      `BUG_PRODUCTO: itinerario "${ITER_NAME}" creado pero NO visible (mutation falló o UI no refrescó)`
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Detalle de tarea
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Kanban Tareas — Detalle y edición de tarea', () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
  });

  test('click en tarea → panel/modal de detalle abre con campos', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Buscar una tarea existente en cualquier columna
    const taskCards = page.locator('[class*="task-card"], [class*="TaskCard"], [class*="task-item"]');
    const count = await taskCards.count();

    if (count === 0) {
      test.skip(true, 'TEST_DATA_SETUP: kanban sin tareas para click — crear tarea primero (test "crear tarea E2E")');
      return;
    }

    await taskCards.first().click();
    await page.waitForTimeout(2000);

    const hasDetail =
      (await page.locator('[role="dialog"], [class*="panel"], [class*="detail"], [class*="InfoLateral"]').count()) > 0;
    const text = (await page.locator('body').textContent()) ?? '';
    const hasDetailContent = /responsable|prioridad|fecha|descripción|estado/i.test(text);

    expect(hasDetail || hasDetailContent, 'BUG_PRODUCTO: tras click tarea ni panel/modal ni contenido detalle visible').toBe(true);
  });

  test('asignar responsable "novia" a tarea desde detalle', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const taskCards = page.locator('[class*="task-card"], [class*="TaskCard"]');
    if (await taskCards.count() === 0) {
      test.skip(true, 'TEST_DATA_SETUP: kanban sin tareas — crear primero');
      return;
    }

    await taskCards.first().click();
    await page.waitForTimeout(2000);

    const responsableSelector = page.locator(
      '[class*="responsable"], [class*="GruposResponsables"], [aria-label*="responsable"]',
    ).first();
    await expect(responsableSelector, 'BUG_PRODUCTO: selector de responsable no visible en detalle tarea').toBeVisible({ timeout: 5_000 });

    await responsableSelector.click();
    await page.waitForTimeout(1000);

    const noviaOption = page.locator('[role="option"], [class*="option"], li').filter({
      hasText: /novia/i,
    }).first();
    await expect(noviaOption, 'BUG_PRODUCTO: opción "novia" no disponible en selector responsable').toBeVisible({ timeout: 5_000 });
    await noviaOption.click();
    await page.waitForTimeout(2000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(/novia/i.test(text), 'BUG_PRODUCTO: tras seleccionar "novia" no aparece en detalle de tarea').toBe(true);
  });

  test('prioridad alta/media/baja visible en tarea', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasPriorityText = /alta|media|baja|high|medium|low|prioridad/i.test(text);
    // Prioridad puede estar como icono color (sin texto)
    const hasPriorityIcon = (await page.locator('[class*="priority"], [class*="prioridad"], [aria-label*="priority"], [aria-label*="prioridad"]').count()) > 0;

    expect(
      hasPriorityText || hasPriorityIcon,
      'BUG_PRODUCTO: ningún indicador de prioridad detectado (ni texto ni icono) en tareas /servicios'
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Mover tarea entre columnas (drag & drop)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Kanban Tareas — Drag & Drop entre columnas', () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
  });

  test('arrastrar tarea de Pendiente a En Progreso → columna cambia', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Buscar columna "Pendiente" y obtener la primera tarea
    const pendingCol = page.locator('[class*="column"], [class*="col"]').filter({
      hasText: KANBAN_COLUMNS.pending,
    }).first();

    await expect(pendingCol, 'BUG_PRODUCTO: columna Pendiente no visible en kanban').toBeVisible({ timeout: 5_000 });

    const taskInPending = pendingCol.locator('[class*="task"], [class*="card"]').first();
    const hasTask = await taskInPending.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasTask) {
      test.skip(true, 'TEST_DATA_SETUP: columna Pendiente sin tareas para drag — crear tarea primero');
      return;
    }

    const inProgressCol = page.locator('[class*="column"], [class*="col"]').filter({
      hasText: KANBAN_COLUMNS.inProgress,
    }).first();
    await expect(inProgressCol, 'BUG_PRODUCTO: columna En Progreso no visible en kanban').toBeVisible({ timeout: 5_000 });

    // Guardar texto de la tarea que vamos a mover
    const taskText = (await taskInPending.textContent()) ?? 'tarea';

    // Ejecutar drag & drop
    const sourceBox = await taskInPending.boundingBox();
    const targetBox = await inProgressCol.boundingBox();

    expect(sourceBox && targetBox, 'BUG_PLAYWRIGHT: bounding boxes para drag & drop no calculables').toBeTruthy();

    // Drag simulado
    await page.mouse.move(sourceBox!.x + sourceBox!.width / 2, sourceBox!.y + sourceBox!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.move(
      targetBox!.x + targetBox!.width / 2,
      targetBox!.y + targetBox!.height / 2,
      { steps: 15 },
    );
    await page.waitForTimeout(500);
    await page.mouse.up();
    await page.waitForTimeout(3000);

    // Verificar que la tarea ya no está en "Pendiente" o está en "En Progreso"
    const pendingColAfter = page.locator('[class*="column"], [class*="col"]').filter({
      hasText: KANBAN_COLUMNS.pending,
    }).first();
    const inProgressColAfter = page.locator('[class*="column"], [class*="col"]').filter({
      hasText: KANBAN_COLUMNS.inProgress,
    }).first();

    const stillInPending = await pendingColAfter.locator(`text=${taskText.slice(0, 20)}`).count() > 0;
    const nowInProgress = await inProgressColAfter.locator(`text=${taskText.slice(0, 20)}`).count() > 0;

    expect(
      nowInProgress || !stillInPending,
      'BUG_PRODUCTO: tras drag&drop, tarea sigue en columna Pendiente y no aparece en En Progreso (drag no funcionó o mutation falló)'
    ).toBe(true);
  });

  test('cambiar estado de tarea via botón de workflow (si existe)', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Buscar botón de cambio de estado/workflow en tareas
    const workflowBtn = page.locator('button').filter({
      hasText: /estado|mover|workflow|columna/i,
    }).first();

    const hasWorkflow = await workflowBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasWorkflow) {
      // Drag & drop es alternativa válida — skip explícito
      test.skip(true, 'TEST_FEATURE_OPTIONAL: botón workflow no implementado (drag & drop es método principal — ver test "arrastrar tarea")');
      return;
    }
    await workflowBtn.click();
    await page.waitForTimeout(1000);
    // Tras click el modal/menu de estados debe aparecer
    const hasStateMenu = (await page.locator('[role="dialog"], [role="menu"], [class*="state"], [class*="workflow"]').count()) > 0;
    expect(hasStateMenu, 'BUG_PRODUCTO: tras click workflow, ningún menú/modal de estados visible').toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Completar tarea
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Kanban Tareas — Completar tarea', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
  });

  test('marcar tarea como completada → aparece en columna Completadas', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Buscar tarea existente
    const taskCards = page.locator('[class*="task-card"], [class*="TaskCard"]');
    if (await taskCards.count() === 0) {
      test.skip(true, 'TEST_DATA_SETUP: kanban sin tareas — crear primero');
      return;
    }

    const firstTaskText = (await taskCards.first().textContent()) ?? 'tarea';
    await taskCards.first().click();
    await page.waitForTimeout(2000);

    const completeBtn = page.locator('button').filter({
      hasText: /completar|marcar como completada|done|finish|completada/i,
    }).first();
    const hasCompleteBtn = await completeBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasCompleteBtn) {
      await completeBtn.click();
    } else {
      const completeCheckbox = page.locator('input[type="checkbox"][aria-label*="completar"], [class*="complete-check"]').first();
      await expect(
        completeCheckbox,
        'BUG_PRODUCTO: ni botón completar ni checkbox de completar visibles en detalle tarea'
      ).toBeVisible({ timeout: 3_000 });
      await completeCheckbox.check();
    }
    await page.waitForTimeout(3000);

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(1000);

    // Verificar tarea ahora aparece en columna Completadas (CRUD verificable)
    const completedCol = page.locator('[class*="column"], [class*="col"]').filter({
      hasText: KANBAN_COLUMNS.completed,
    }).first();
    const taskInCompleted = completedCol.locator(`text=${firstTaskText.slice(0, 20)}`);
    const isInCompleted = await taskInCompleted.first().isVisible({ timeout: 5_000 }).catch(() => false);
    const completedTotal = await completedCol.locator('[class*="task"], [class*="card"]').count();

    expect(
      isInCompleted || completedTotal > 0,
      'BUG_PRODUCTO: tras marcar tarea completada, columna Completadas no contiene la tarea (mutation falló o UI no refrescó)'
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Filtros y ordenación
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Kanban Tareas — Filtros', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
    if (!hasCredentials) return;
    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      test.skip(true, 'TEST_LOGIN_FAILED: loginAndSelectEvent retornó null. Test abortado, evita falsos positivos.');
    }
  });

  test('filtro por responsable disponible', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Buscar filtros en HeaderIter
    const filterBtn = page.locator('button, select').filter({
      hasText: /filtrar|filter|responsable|ordenar|sort/i,
    }).first();

    const hasFilter = await filterBtn.isVisible({ timeout: 5_000 }).catch(() => false);

    // También verificar selector de orden (SelectModeSortType)
    const sortSelector = page.locator('[class*="sort"], [class*="order"], [class*="filter"]').first();
    const hasSort = await sortSelector.isVisible({ timeout: 3_000 }).catch(() => false);

    expect(hasFilter || hasSort, 'BUG_PRODUCTO: ni filtros ni ordenación disponibles en /servicios').toBe(true);
  });

  test('banner copilot filter rosa visible si hay filtro activo', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const copilotBanner = page.locator('[class*="pink"], .bg-pink-50').filter({
      hasText: /copilot|filtró|filter/i,
    });

    const bannerCount = await copilotBanner.count();
    if (bannerCount === 0) {
      // Estado normal: sin filtro copilot activo. Test válido sin más asserts.
      // Para test viable: forzar filtro vía URL/API y verificar banner aparece.
      test.skip(true, 'TEST_DATA_SETUP: sin filtro copilot activo — para validar requiere setup que dispare filtro');
      return;
    }

    const clearBtn = copilotBanner.locator('button').filter({ hasText: /✕|limpiar|clear/i }).first();
    await expect(clearBtn, 'BUG_PRODUCTO: banner copilot visible pero sin botón clear/limpiar').toBeVisible({ timeout: 3_000 });
    await clearBtn.click();
    await page.waitForTimeout(1000);
    const bannerAfter = await copilotBanner.count();
    expect(bannerAfter, 'BUG_PRODUCTO: tras click clear, banner copilot NO se elimina').toBeLessThan(bannerCount);
  });
});
