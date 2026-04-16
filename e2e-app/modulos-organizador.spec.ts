/**
 * modulos-organizador.spec.ts
 *
 * Tests funcionales de los módulos del organizador en appEventos:
 *   - Crear evento (formulario, validaciones)
 *   - Invitados (carga, filtrar)
 *   - Presupuesto (carga, categorías)
 *   - Mesas (carga)
 *   - Itinerario (carga)
 *   - Resumen evento (datos visibles)
 *
 * Los tests "con sesión" requieren que la sesión ya esté establecida en el navegador
 * (el usuario se logueó antes o se usan las cookies de la sesión anterior).
 * Son "flexibles": si no hay sesión activa (guest), verifican que la UI responda
 * coherentemente (sin crash) en lugar de fallar.
 *
 * Para máxima cobertura funcional, ejecutar logueado:
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... pnpm test:e2e:app:todo
 */
import { test, expect } from '@playwright/test';
import { waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: navegar a una ruta y esperar contenido
// ─────────────────────────────────────────────────────────────────────────────
async function goToRoute(page: any, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 40_000 });
  await page.waitForLoadState('load').catch(() => {});
  await waitForAppReady(page, 20_000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Home — lista de eventos
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Home — lista de eventos', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await goToRoute(page, '/');
  });

  test('home carga y muestra contenido principal sin ErrorBoundary', async ({ page }) => {
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(100);
    const hasContent =
      /Mis\s+eventos|crear|evento|organiz|Iniciar\s+sesión|Bodas\s+de\s+Hoy/i.test(text);
    expect(hasContent).toBe(true);
  });

  test('tiene un botón o acceso para crear evento', async ({ page }) => {
    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';
    // Guest o logueado: debe existir alguna acción de crear evento o de login
    const hasAction =
      /crear.*evento|nuevo.*evento|add.*event|Iniciar\s+sesión/i.test(text) ||
      (await page.locator('button, a').filter({ hasText: /crear|nuevo|add|event/i }).count()) > 0;
    expect(hasAction).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Resumen del evento
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Resumen del evento (/resumen-evento)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await goToRoute(page, '/resumen-evento');
  });

  test('carga sin ErrorBoundary', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);
  });

  test('muestra datos del evento o mensaje de acceso', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    const hasContent =
      /Resumen|evento|boda|fecha|invitados|permiso|Iniciar\s+sesión/i.test(text);
    expect(hasContent).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Presupuesto
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Presupuesto (/presupuesto)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await goToRoute(page, '/presupuesto');
  });

  test('carga sin ErrorBoundary', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);
  });

  test('muestra secciones de presupuesto o acceso', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    const hasContent =
      /Presupuesto|categoría|partida|importe|total|permiso|Iniciar\s+sesión/i.test(text);
    expect(hasContent).toBe(true);
  });

  test('no muestra datos de 0€ como errores (total puede ser 0)', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    // Si hay sección de presupuesto, debe mostrar importes o cero — nunca NaN ni undefined
    if (/Presupuesto/i.test(text)) {
      expect(text).not.toMatch(/NaN|undefined.*€|€.*undefined/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Invitados
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Invitados (/invitados)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await goToRoute(page, '/invitados');
  });

  test('carga sin ErrorBoundary', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);
  });

  test('muestra lista de invitados, tabla o acceso', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    const hasContent =
      /Invitados|invitado|nombre|confirmad|asistencia|permiso|Iniciar\s+sesión/i.test(text);
    expect(hasContent).toBe(true);
  });

  test('hay un input de búsqueda o botón de añadir invitado', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    // Saltar si la página está cargando o muestra acceso denegado/upsell/login
    // - "Cargando" = VistaSinCookie durante verificación de sesión
    // - "permiso|sesión|cuenta|..." = distintos estados de acceso denegado
    const isAccessBlocked = /permiso|sesión|cuenta|cargando|plan\s+básico|acceso|login|register|gratis/i.test(text);
    if (!isAccessBlocked) {
      const hasControl =
        (await page.locator('input[placeholder*="Buscar" i], input[placeholder*="Search" i], input[placeholder*="buscar" i]').count()) > 0 ||
        (await page.locator('button').filter({ hasText: /añadir|nuevo|add|invitar/i }).count()) > 0 ||
        (await page.locator('[placeholder*="invitado" i]').count()) > 0;
      // Si la sección cargó, debe tener algún control de búsqueda o adición
      // Si no hay controles, al menos debe haber contenido de la lista
      const hasTableOrList =
        (await page.locator('table, [role="table"], [role="grid"]').count()) > 0 ||
        (await page.locator('tr, [role="row"]').count()) > 0;
      expect(hasControl || hasTableOrList).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Mesas
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Mesas (/mesas)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await goToRoute(page, '/mesas');
  });

  test('carga sin ErrorBoundary', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);
  });

  test('muestra plano de mesas o mensaje de acceso', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    const hasContent =
      /[Mm]esas?|[Tt]abla|[Ss]illas?|[Pp]lano|[Ss]eating|permiso|Iniciar\s+sesión/i.test(text);
    expect(hasContent).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Itinerario
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Itinerario (/itinerario)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await goToRoute(page, '/itinerario');
  });

  test('carga sin ErrorBoundary', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);
  });

  test('muestra itinerario o mensaje de acceso', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    const hasContent =
      /Itinerario|momento|hora|ceremonia|celebración|permiso|Iniciar\s+sesión/i.test(text);
    expect(hasContent).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Servicios
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Servicios (/servicios)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await goToRoute(page, '/servicios');
  });

  test('carga sin ErrorBoundary', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(50);
  });

  test('muestra servicios contratados o mensaje de acceso', async ({ page }) => {
    const text = (await page.locator('body').textContent()) ?? '';
    const hasContent =
      /[Ss]ervicios?|[Pp]roveedor|[Cc]ontratado|permiso|Iniciar\s+sesión/i.test(text);
    expect(hasContent).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Crear evento — formulario (requiere app-test activo)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Crear evento — formulario (app-test, con sesión)', () => {
  test.setTimeout(120_000);

  test('el formulario de crear evento es accesible (home o modal)', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await goToRoute(page, '/');

    // Buscar botón "Crear evento" o similar
    const createBtn = page
      .locator('button, a')
      .filter({ hasText: /crear.*evento|nuevo.*evento|add.*event|crear boda/i })
      .first();
    const visible = await createBtn.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!visible) {
      // Puede estar dentro de un menú o requiere login — verificar que no hay crash
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      console.log('ℹ️ Botón crear evento no visible (puede requerir login)');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(2000);

    // Debe aparecer un formulario o modal con campos de evento
    const text = (await page.locator('body').textContent()) ?? '';
    const hasForm =
      /nombre.*evento|tipo.*evento|fecha|boda|event name|crear/i.test(text) ||
      (await page.locator('input[name], input[placeholder]').count()) > 0;
    expect(hasForm).toBe(true);
    console.log('Formulario de crear evento accesible');
  });

  test('campo "nombre" vacío no avanza en el formulario', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }

    await goToRoute(page, '/');

    const createBtn = page
      .locator('button, a')
      .filter({ hasText: /crear.*evento|nuevo.*evento|add.*event/i })
      .first();
    if (!(await createBtn.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(1500);

    // Intentar submit sin rellenar nada
    const submitBtn = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /crear|guardar|siguiente|next|save/i })
      .first();

    if (!(await submitBtn.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await submitBtn.click();
    await page.waitForTimeout(1000);

    // No debe haber navegado a otra página (formulario sigue en pantalla) o muestra error
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    // El form sigue visible o hay mensaje de validación
    const stillOnForm =
      (await page.locator('input[name], input[placeholder]').count()) > 0 ||
      /requerido|required|obligatorio|nombre/i.test(text);
    expect(stillOnForm).toBe(true);
    console.log('Validación de campo vacío funciona');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Navegación entre módulos (no ErrorBoundary en ninguno)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navegación entre módulos — sin crash', () => {
  test.setTimeout(120_000);

  const MODULES = [
    '/invitados',
    '/presupuesto',
    '/mesas',
    '/itinerario',
    '/servicios',
    '/resumen-evento',
    '/facturacion',
    '/configuracion',
  ];

  for (const mod of MODULES) {
    test(`${mod} → regreso a home no causa ErrorBoundary`, async ({ page }) => {
      await goToRoute(page, mod);

      const text1 = (await page.locator('body').textContent()) ?? '';
      expect(text1).not.toMatch(/Error Capturado por ErrorBoundary/);

      // Volver a home
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForAppReady(page, 15_000);

      const text2 = (await page.locator('body').textContent()) ?? '';
      expect(text2).not.toMatch(/Error Capturado por ErrorBoundary/);
    });
  }
});
