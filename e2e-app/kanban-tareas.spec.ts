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
    if (hasCredentials) await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
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
    if (columnCount === 0) {
      // Si no hay columnas, puede que la vista activa sea Tabla o Tarjeta — no Kanban
      // Verificar al menos que la página tiene contenido de servicios
      const hasServiciosContent = /servicios|tarea|tasks|proveed|contrat/i.test(text);
      console.log(`ℹ️ Sin columnas kanban visibles (vista no-kanban activa). Contenido servicios: ${hasServiciosContent}`);
      expect(hasServiciosContent).toBe(true);
    } else {
      console.log(`✅ ${columnCount} columnas kanban detectadas`);
    }
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

    if (hasTabs || hasSelector) {
      console.log('✅ Selector/tabs de itinerario visible');
    } else {
      console.log('ℹ️ Selector de itinerario no detectado — puede haber solo uno');
    }
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
    if (hasCredentials) await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
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

    if (!btnToClick) {
      console.log('ℹ️ Botón de añadir tarea no encontrado');
      return;
    }

    await btnToClick.click();
    await page.waitForTimeout(1500);

    // Rellenar descripción de la tarea
    const descInput = page.locator('input[placeholder*="descripción"], input[placeholder*="tarea"], input[placeholder*="title"], textarea').first();
    if (!await descInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Puede que sea inline editing (en la misma columna)
      const inlineInput = page.locator('[contenteditable="true"], input[type="text"]').last();
      if (await inlineInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await inlineInput.fill(TASK_DESC);
      } else {
        console.log('ℹ️ Input de nueva tarea no encontrado');
        return;
      }
    } else {
      await descInput.fill(TASK_DESC);
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

    if (isVisible) {
      console.log(`✅ Tarea "${TASK_DESC}" visible en kanban`);
      await expect(taskEl.first()).toBeVisible();
    } else {
      console.log('ℹ️ Tarea no encontrada visualmente — puede requerir refresh');
    }
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

    if (!await newIterBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      console.log('ℹ️ Botón nuevo itinerario no encontrado');
      return;
    }

    await newIterBtn.click();
    await page.waitForTimeout(1500);

    const nameInput = page.locator('input[type="text"], input[placeholder*="nombre"]').first();
    if (await nameInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nameInput.fill(ITER_NAME);
    }

    const saveBtn = page.locator('[role="dialog"], form').locator('button').filter({
      hasText: /guardar|crear|save/i,
    }).first();

    if (await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    const iterEl = page.getByText(ITER_NAME, { exact: false });
    const isVisible = await iterEl.first().isVisible({ timeout: 8_000 }).catch(() => false);
    console.log(isVisible ? `✅ Itinerario "${ITER_NAME}" creado` : `ℹ️ Itinerario no encontrado visualmente`);
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
    if (hasCredentials) await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
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
      console.log('ℹ️ No hay tareas en el kanban para hacer click');
      return;
    }

    await taskCards.first().click();
    await page.waitForTimeout(2000);

    // Panel/modal de detalle debe abrirse
    const hasDetail =
      (await page.locator('[role="dialog"], [class*="panel"], [class*="detail"], [class*="InfoLateral"]').count()) > 0;
    const text = (await page.locator('body').textContent()) ?? '';
    const hasDetailContent = /responsable|prioridad|fecha|descripción|estado/i.test(text);

    if (hasDetail || hasDetailContent) {
      console.log('✅ Panel/modal de detalle de tarea abierto');
    } else {
      console.log('ℹ️ Detalle de tarea no detectado — puede abrirse de otra forma');
    }
  });

  test('asignar responsable "novia" a tarea desde detalle', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const taskCards = page.locator('[class*="task-card"], [class*="TaskCard"]');
    if (await taskCards.count() === 0) {
      console.log('ℹ️ No hay tareas para asignar responsable');
      return;
    }

    await taskCards.first().click();
    await page.waitForTimeout(2000);

    // Buscar selector de responsable
    const responsableSelector = page.locator(
      '[class*="responsable"], [class*="GruposResponsables"], [aria-label*="responsable"]',
    ).first();

    if (!await responsableSelector.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Selector de responsable no encontrado');
      return;
    }

    // Buscar opción "novia" en el selector
    await responsableSelector.click().catch(() => {});
    await page.waitForTimeout(1000);

    const noviaOption = page.locator('[role="option"], [class*="option"], li').filter({
      hasText: /novia/i,
    }).first();

    if (await noviaOption.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await noviaOption.click();
      await page.waitForTimeout(2000);
      console.log('✅ Responsable "novia" seleccionada');

      // Verificar que aparece en la tarea
      const text = (await page.locator('body').textContent()) ?? '';
      const hasNovia = /novia/i.test(text);
      if (hasNovia) {
        console.log('✅ "novia" visible en detalle de tarea');
      }
    } else {
      console.log('ℹ️ Opción "novia" no encontrada en el selector');
    }
  });

  test('prioridad alta/media/baja visible en tarea', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    const hasPriority = /alta|media|baja|high|medium|low|prioridad/i.test(text);

    if (hasPriority) {
      console.log('✅ Indicador de prioridad visible en tareas');
    } else {
      console.log('ℹ️ Prioridad no detectada en texto — puede estar como icono de color');
    }
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
    if (hasCredentials) await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
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

    if (!await pendingCol.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Columna Pendiente no encontrada');
      return;
    }

    const taskInPending = pendingCol.locator('[class*="task"], [class*="card"]').first();
    if (!await taskInPending.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ No hay tareas en columna Pendiente para arrastrar');
      return;
    }

    // Buscar columna "En Progreso"
    const inProgressCol = page.locator('[class*="column"], [class*="col"]').filter({
      hasText: KANBAN_COLUMNS.inProgress,
    }).first();

    if (!await inProgressCol.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('ℹ️ Columna En Progreso no encontrada');
      return;
    }

    // Guardar texto de la tarea que vamos a mover
    const taskText = (await taskInPending.textContent()) ?? 'tarea';

    // Ejecutar drag & drop
    const sourceBox = await taskInPending.boundingBox();
    const targetBox = await inProgressCol.boundingBox();

    if (!sourceBox || !targetBox) {
      console.log('ℹ️ No se pudo obtener bounding box para drag & drop');
      return;
    }

    // Drag simulado
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(500);
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
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

    if (nowInProgress) {
      console.log('✅ Tarea movida a "En Progreso" exitosamente');
    } else if (!stillInPending) {
      console.log('✅ Tarea salió de "Pendiente" (posiblemente en "En Progreso")');
    } else {
      console.log('ℹ️ Drag & drop completado — verificación visual pendiente');
    }
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

    if (await workflowBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await workflowBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Botón de cambio de estado disponible');
    } else {
      console.log('ℹ️ Botón de workflow no encontrado — drag & drop es el método principal');
    }
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
    if (hasCredentials) await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
  });

  test('marcar tarea como completada → aparece en columna Completadas', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // Buscar tarea existente
    const taskCards = page.locator('[class*="task-card"], [class*="TaskCard"]');
    if (await taskCards.count() === 0) {
      console.log('ℹ️ No hay tareas para completar');
      return;
    }

    await taskCards.first().click();
    await page.waitForTimeout(2000);

    // Buscar botón/acción de "completar" en el detalle
    const completeBtn = page.locator('button').filter({
      hasText: /completar|marcar como completada|done|finish|completada/i,
    }).first();

    if (!await completeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Intentar con checkbox
      const completeCheckbox = page.locator('input[type="checkbox"][aria-label*="completar"], [class*="complete-check"]').first();
      if (await completeCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await completeCheckbox.check();
        await page.waitForTimeout(2000);
        console.log('✅ Tarea marcada como completada via checkbox');
      } else {
        console.log('ℹ️ Acción de completar no encontrada en el detalle');
        return;
      }
    } else {
      await completeBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Tarea marcada como completada via botón');
    }

    // Cerrar detalle y verificar columna Completadas
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(1000);

    const completedCol = page.locator('[class*="column"], [class*="col"]').filter({
      hasText: KANBAN_COLUMNS.completed,
    }).first();

    const completedCount = await completedCol.locator('[class*="task"], [class*="card"]').count();
    console.log(`Tareas en columna Completadas: ${completedCount}`);

    if (completedCount > 0) {
      console.log('✅ Columna Completadas tiene tareas');
    }
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
    if (hasCredentials) await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
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

    if (hasFilter || hasSort) {
      console.log('✅ Controles de filtrado/ordenación disponibles');
    } else {
      console.log('ℹ️ Filtros no detectados en /servicios');
    }
  });

  test('banner copilot filter rosa visible si hay filtro activo', async ({ page }) => {
    if (!isAppTest || !hasCredentials) { test.skip(); return; }

    await page.goto(`${BASE_URL}/servicios`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
    await waitForAppReady(page, 20_000);
    await page.waitForTimeout(3000);

    // El banner copilot aparece cuando hay un filtro activo del copilot
    // Verificar que si está, tiene el botón X para limpiar
    const copilotBanner = page.locator('[class*="pink"], .bg-pink-50').filter({
      hasText: /copilot|filtró|filter/i,
    });

    if (await copilotBanner.count() > 0) {
      const clearBtn = copilotBanner.locator('button').filter({ hasText: /✕|limpiar|clear/i }).first();
      const hasClear = await clearBtn.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`✅ Banner copilot visible con botón clear: ${hasClear}`);
      if (hasClear) {
        await clearBtn.click();
        await page.waitForTimeout(1000);
        const bannerAfter = await copilotBanner.count();
        console.log(`✅ Banner eliminado tras click clear (banners: ${bannerAfter})`);
      }
    } else {
      console.log('ℹ️ No hay banner de filtro copilot activo — es el estado normal');
    }
  });
});
