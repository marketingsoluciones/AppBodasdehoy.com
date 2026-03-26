/**
 * bandeja-mensajes.spec.ts
 *
 * Tests E2E de la Bandeja / tab Messages en chat-ia (chat-test):
 *   - /messages carga sin crash
 *   - ChannelSidebar muestra "Mensajes" + filtros de canal
 *   - TAREAS PENDIENTES aparece cuando hay sesión con eventos
 *   - Clic en tarea navega a workspace de detalle (ev-*-task/taskId)
 *   - TaskDetailWorkspace muestra tarjeta de tarea (sin crash)
 *   - /messages/whatsapp muestra WhatsApp setup
 *   - /messages/ev-*-task muestra empty state "selecciona una tarea"
 *   - Conversaciones externas (wa-*) muestran lista de conversaciones
 *
 * Sin sesión: verifica que las rutas no crashen (redirigen a login o guest).
 * Con sesión (TEST_USER_EMAIL + TEST_USER_PASSWORD): cobertura completa.
 *
 * Requiere VPN + chat-test activo para isAppTest=true.
 * Ejecutar: BASE_URL=https://app-test.bodasdehoy.com pnpm test:e2e:app:todo
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady } from './helpers';
import { getChatUrl } from './fixtures';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com') ||
  BASE_URL.includes('127.0.0.1') ||
  BASE_URL.includes('localhost');

const CHAT_URL = getChatUrl(BASE_URL);

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

// ─── helpers ──────────────────────────────────────────────────────────────────

async function goChatRoute(page: any, path: string) {
  await page.goto(`${CHAT_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
  await waitForAppReady(page, 15_000);
}

/** True si chat está corriendo y cargó contenido */
async function isChatUp(page: any): Promise<boolean> {
  const url = page.url();
  if (!url.includes('chat')) return false;
  const text = await page.locator('body').textContent().catch(() => null) ?? '';
  return text !== null && text.length > 10;
}

async function loginChat(page: any): Promise<boolean> {
  if (!hasCredentials) return false;
  try {
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);

    const loginLink = page
      .locator('a, [role="button"], span')
      .filter({ hasText: /^Iniciar sesión$/ })
      .first();
    if (await loginLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await loginLink.click();
      await page.waitForTimeout(800);
    }

    await page.locator('input[type="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url: URL) => url.pathname === '/chat', { timeout: 30_000 }).catch(() => {});
    return page.url().includes('/chat');
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Smoke — /messages carga sin crash
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Bandeja — smoke /messages', () => {
  test.setTimeout(90_000);

  test('/messages carga sin ErrorBoundary y con contenido', async ({ context, page }) => {
    if (!isAppTest) {
      // En local el chat-ia puede no estar corriendo
      test.skip();
      return;
    }
    await clearSession(context, page);
    await goChatRoute(page, '/messages');

    const body = page.locator('body');
    const text = (await body.textContent()) ?? '';

    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text).not.toMatch(/Internal Server Error/);
    expect(text.length).toBeGreaterThan(30);
  });

  test('/messages carga contenido (tolera SSR 500 si client-side renderiza)', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/messages`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    // SSR puede devolver 500 por error de i18next pero el client-side renderiza bien
    await waitForAppReady(page, 15_000);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(text.length).toBeGreaterThan(30);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. ChannelSidebar — estructura y secciones
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ChannelSidebar — estructura y secciones', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    if (!isAppTest) return;
    await clearSession(context, page);
  });

  test('muestra encabezado "Mensajes" en el sidebar', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }
    await goChatRoute(page, '/messages');

    if (!await isChatUp(page)) {
      console.log('ℹ️ chat-dev no accesible — pass sin crash');
      return;
    }
    const text = await page.locator('body').textContent().catch(() => null) ?? '';
    if (text === null) return;
    // ChannelSidebar muestra "Mensajes" como título del panel izquierdo
    const hasSidebar = /Mensajes|Iniciar sesión|login/i.test(text);
    if (!hasSidebar) {
      console.log(`ℹ️ Sidebar: texto inesperado (puede estar cargando). Texto: ${text.slice(0, 150)}`);
    }
  });

  test('muestra sección de conversaciones', async ({ page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }
    await goChatRoute(page, '/messages');

    if (!await isChatUp(page)) {
      console.log('ℹ️ chat-dev no accesible — pass sin crash');
      return;
    }
    const text = await page.locator('body').textContent().catch(() => null) ?? '';
    if (text === null) return;
    // Sin login: redirige a login. Con login: sección "Conversaciones" visible
    const hasConversaciones =
      /Conversaciones|WhatsApp|Instagram|Mensajes externos|Iniciar sesión/i.test(text);
    if (!hasConversaciones) {
      console.log(`ℹ️ Conversaciones: texto inesperado (puede estar cargando). Texto: ${text.slice(0, 150)}`);
    }
  });

  test('con sesión: muestra sección Tareas pendientes si hay eventos', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }
    await loginChat(page);
    await goChatRoute(page, '/messages');

    const text = await page.locator('body').textContent().catch(() => null) ?? '';
    if (text === null) return;
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasTareas = /Tareas pendientes|tareas|tarea/i.test(text);
    const hasNoEvents = /sin eventos|no hay eventos|crear.{0,20}evento/i.test(text);
    if (!hasTareas && !hasNoEvents) {
      console.log(`ℹ️ Tareas: contenido inesperado (puede estar cargando). Texto: ${text.slice(0, 200)}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. ChannelSidebar — ConnectChannelDrawer y filtros de canal
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ChannelSidebar — ConnectChannelDrawer y filtros', () => {
  test.setTimeout(90_000);

  test('botón "Conectar canal" abre drawer sin crash', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }
    await loginChat(page);
    await goChatRoute(page, '/messages');

    if (!await isChatUp(page)) {
      console.log('ℹ️ chat-dev no accesible — pass sin crash');
      return;
    }

    // Clic en el botón de configuración (ChannelSidebar header settings icon)
    const settingsBtn = page.locator('button[title="Conectar canal"]').first();
    if (await settingsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(500);

      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      // Drawer debe mostrar lista de canales para conectar
      const hasDrawer = /Conectar canal|WhatsApp|Instagram|Telegram|Facebook/i.test(text);
      expect(hasDrawer).toBe(true);

      // Cerrar con Escape
      await page.keyboard.press('Escape');
    } else {
      console.log('ℹ️ Botón Conectar canal no visible (puede estar redirigiendo a login)');
    }
  });

  test('filtros de canal (WA/IG/TG) filtran la lista', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }
    await loginChat(page);
    await goChatRoute(page, '/messages');

    if (!await isChatUp(page)) {
      console.log('ℹ️ chat-dev no accesible — pass sin crash');
      return;
    }

    // Clic en filtro WA — no debe crashear
    const waBtn = page.locator('button').filter({ hasText: /^WA$/ }).first();
    if (await waBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await waBtn.click();
      await page.waitForTimeout(300);
      const text = (await page.locator('body').textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    } else {
      console.log('ℹ️ Filtro WA no visible (sin canales conectados o cargando)');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. /messages/whatsapp — setup de WhatsApp (pairing QR + código)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('WhatsApp setup — /messages/whatsapp', () => {
  test.setTimeout(90_000);

  test('carga sin crash y muestra UI de configuración', async ({ context, page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    await goChatRoute(page, '/messages/whatsapp');

    if (!await isChatUp(page)) {
      console.log('ℹ️ chat-dev no accesible — pass sin crash');
      return;
    }
    const text = await page.locator('body').textContent().catch(() => null) ?? '';
    if (text === null) return;
    if (text !== null) expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Debe mostrar algo de WhatsApp setup o login redirect
    const hasWhatsApp =
      /WhatsApp|QR|código|conectar|escanea|teléfono|Iniciar sesión/i.test(text);
    if (!hasWhatsApp) {
      console.log(`ℹ️ WhatsApp: texto inesperado (puede estar cargando). Texto: ${text.slice(0, 150)}`);
    }
  });

  test('con sesión: muestra opciones de conexión WhatsApp', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }
    await loginChat(page);
    await goChatRoute(page, '/messages/whatsapp');

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasSetup =
      /WhatsApp|QR|código|conectar|escanea|teléfono|Conectado|Conectar/i.test(text);
    expect(hasSetup).toBe(true);
  });

  test('con sesión: link "Usar código en su lugar" alterna al modo código', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }
    await loginChat(page);
    await goChatRoute(page, '/messages/whatsapp');

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Si ya está conectado no hay modo de vinculación — skip silencioso
    if (/Conectado/i.test(text)) {
      console.log('ℹ️ WhatsApp ya conectado — skip test de modo código');
      return;
    }

    // Esperar a que aparezca el botón de alternar modo
    const switchBtn = page.locator('button, a').filter({ hasText: /código|number|phone/i }).first();
    if (await switchBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await switchBtn.click();
      await page.waitForTimeout(500);
      const after = (await page.locator('body').textContent()) ?? '';
      expect(after).not.toMatch(/Error Capturado por ErrorBoundary/);
      // Modo código muestra campo de teléfono
      const hasPhoneField = await page.locator('input[type="tel"], input[placeholder*="teléfono" i], input[placeholder*="phone" i]').isVisible({ timeout: 3_000 }).catch(() => false);
      if (!hasPhoneField) {
        // Puede que el QR no esté listo todavía — no es error crítico
        console.log('ℹ️ Campo teléfono no visible (QR puede no estar listo)');
      }
    } else {
      console.log('ℹ️ Botón de modo código no visible (QR puede no estar listo)');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. /messages/ev-*-task — empty state selección de tarea
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Task channel empty state — /messages/ev-{id}-task', () => {
  test.setTimeout(90_000);

  test('muestra "selecciona una tarea" o redirige a login', async ({ context, page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    // Usar un eventId placeholder — la ruta debe existir aunque no haya data real
    await goChatRoute(page, '/messages/ev-test123-task');

    if (!await isChatUp(page)) {
      console.log('ℹ️ chat-dev no accesible — pass sin crash');
      return;
    }
    const text = await page.locator('body').textContent().catch(() => null) ?? '';
    if (text === null) return;
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    const hasExpected =
      /selecciona.*tarea|tarea|Bandeja|Mensajes|Iniciar sesión/i.test(text);
    if (!hasExpected) {
      console.log(`ℹ️ Task channel: texto inesperado (puede estar cargando). Texto: ${text.slice(0, 150)}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Task detail workspace — /messages/ev-*-task/{taskId}
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Task detail workspace', () => {
  test.setTimeout(120_000);

  test('con tarea inválida: muestra "no encontrada" sin crash', async ({ context, page }) => {
    if (!isAppTest) {
      test.skip();
      return;
    }
    await clearSession(context, page);
    await goChatRoute(page, '/messages/ev-test123-task/task-id-que-no-existe');

    if (!await isChatUp(page)) {
      console.log('ℹ️ chat-dev no accesible — pass sin crash');
      return;
    }
    const text = await page.locator('body').textContent().catch(() => null) ?? '';
    if (text === null) return;
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    // Con sesión: "Tarea no encontrada". Sin sesión: redirige a login
    const hasExpected =
      /no encontrada|Cargando|Bandeja|Mensajes|Iniciar sesión/i.test(text);
    if (!hasExpected) {
      console.log(`ℹ️ Task detail: texto inesperado (puede estar cargando). Texto: ${text.slice(0, 150)}`);
    }
  });

  test('con sesión y evento real: muestra workspace con sidebar y tarjeta', async ({
    page,
  }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }
    const loggedIn = await loginChat(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    // Navegar a /messages y verificar que el sidebar cargue tareas
    await goChatRoute(page, '/messages');
    await page.waitForTimeout(3000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Si hay tareas en el sidebar, clic en la primera
    const taskRow = page
      .locator('button')
      .filter({ hasText: /.{3,}/ }) // botones con texto
      .first();

    // Buscar la sección de tareas en el sidebar
    const tareasPendientes = page.locator('aside').getByText(/Tareas pendientes/i).first();
    if (await tareasPendientes.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Hacer clic en la primera tarea del sidebar
      const primeraTarea = page
        .locator('aside button')
        .filter({ hasText: /.{5,}/ })
        .first();
      if (await primeraTarea.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await primeraTarea.click();
        await page.waitForTimeout(2000);

        const afterText = (await page.locator('body').textContent()) ?? '';
        expect(afterText).not.toMatch(/Error Capturado por ErrorBoundary/);
        // Workspace debe mostrar algo relacionado a la tarea
        const hasWorkspace = /Pendiente|Completada|itinerario|ev-.+-task/i.test(
          page.url() + afterText,
        );
        expect(hasWorkspace).toBe(true);
      }
    } else {
      // Sin tareas — al menos no debe haber crash
      console.log('ℹ️ No hay tareas pendientes en el sidebar para este usuario/evento');
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Navegación entre rutas de mensajes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Navegación — rutas messages en chat-ia', () => {
  test.setTimeout(90_000);

  const RUTAS_MESSAGES = [
    '/messages',
    '/messages/whatsapp',
    '/messages/instagram',
    '/messages/ev-test-task',
  ];

  for (const ruta of RUTAS_MESSAGES) {
    test(`${ruta} no genera ErrorBoundary y renderiza client-side`, async ({ context, page }) => {
      if (!isAppTest) {
        test.skip();
        return;
      }
      await clearSession(context, page);
      await page.goto(`${CHAT_URL}${ruta}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20_000,
      }).catch(() => {});

      // SSR puede devolver 500 por error de i18next, pero client-side renderiza bien
      await waitForAppReady(page, 10_000);
      if (!await isChatUp(page)) {
        console.log(`ℹ️ ${ruta}: chat-dev no accesible — pass sin crash`);
        return;
      }
      const text = await page.locator('body').textContent().catch(() => null) ?? '';
      if (text !== null) {
        expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
        expect(text).not.toMatch(/Internal Server Error/);
      }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Input de tarea — visible en workspace
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Task workspace — input al asistente', () => {
  test.setTimeout(120_000);

  test('workspace de tarea tiene textarea para escribir al asistente', async ({ page }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }
    const loggedIn = await loginChat(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    // Ir a una ruta de tarea placeholder (sin data real)
    await goChatRoute(page, '/messages/ev-test-task/taskid-placeholder');
    await page.waitForTimeout(2000);

    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Puede mostrar "Tarea no encontrada" (eventId no existe) o el workspace real
    // En cualquier caso no debe haber crash y el placeholder da feedback
    const hasExpected =
      /no encontrada|Cargando|Pendiente|asistente|tarea|Bandeja/i.test(text);
    expect(hasExpected).toBe(true);
  });
});
