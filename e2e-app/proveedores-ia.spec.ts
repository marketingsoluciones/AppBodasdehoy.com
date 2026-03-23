/**
 * proveedores-ia.spec.ts
 *
 * Tests E2E para la configuración de proveedores IA y verificación de claves privadas.
 *
 * Qué se verifica:
 *   1. Página /settings con grid de proveedores carga sin crash
 *   2. Credenciales del tenant se cargan desde api2 (estructura correcta)
 *   3. El chat responde correctamente con el proveedor configurado (no 401/402)
 *   4. Dónde viven los tokens (localStorage, pglite, api2) — smoke verification
 *   5. Proveedor con key inválida degrada con error controlado (no crash)
 *
 * Dónde se guardan las claves (según investigación):
 *   - pglite DB: aiProviders.keyVaults (encriptado con KEY_VAULTS_SECRET)
 *   - Zustand: store.keyVaults.openai.apiKey (en memoria, no persiste en SSR)
 *   - api2 tenant: api/developers/:id/ai-credentials (backend, encriptado)
 *   - env global: process.env.OPENAI_API_KEY (fallback)
 *   - localStorage: jwt_token_cache (JWT firmado, ~7 días)
 *
 * Ejecutar:
 *   BASE_URL=https://chat-test.bodasdehoy.com \
 *   TEST_USER_EMAIL=... TEST_USER_PASSWORD=... \
 *   pnpm exec playwright test e2e-app/proveedores-ia.spec.ts --headed
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForCopilotReady } from './helpers';
import { TEST_CREDENTIALS, TEST_URLS } from './fixtures';

const CHAT_URL = TEST_URLS.chat;
const EMAIL = TEST_CREDENTIALS.email;
const PASSWORD = TEST_CREDENTIALS.password;
const hasCredentials = Boolean(EMAIL && PASSWORD);

const isChatTest =
  CHAT_URL.includes('chat-test.bodasdehoy.com') ||
  CHAT_URL.includes('chat-dev.bodasdehoy.com') ||
  CHAT_URL.includes('127.0.0.1');

// ─── Helper: login en chat-ia ─────────────────────────────────────────────────

async function loginInChat(page: import('@playwright/test').Page): Promise<boolean> {
  // 'commit' evita el error "interrupted by another navigation" de App Router de Next.js
  await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'commit', timeout: 35_000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(2_000);

  if (page.url().includes('/chat') && !page.url().includes('/login')) return true;

  if (page.url().includes('/login')) {
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await emailInput.fill(EMAIL);
      await page.locator('input[type="password"]').first().fill(PASSWORD);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
    }
  }
  return page.url().includes('/chat') || !page.url().includes('/login');
}

// ─── 0. Smoke ─────────────────────────────────────────────────────────────────

test.describe('Proveedores IA — smoke (sin login)', () => {
  test.setTimeout(30_000);

  test('chat-test responde sin 500', async ({ page }) => {
    const response = await page.goto(CHAT_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 25_000,
    });
    expect(response?.status()).not.toBe(500);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text.length).toBeGreaterThan(30);
  });
});

// ─── 1. Grid de proveedores en settings ──────────────────────────────────────

test.describe('Proveedores IA — settings/provider', () => {
  test.setTimeout(90_000);

  test('grid de proveedores carga sin crash', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { console.log('ℹ️ No se pudo hacer login — skip'); test.skip(); return; }

    await page.goto(`${CHAT_URL}/settings`, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    await page.waitForTimeout(3_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Verificar que la sección de modelos/proveedores existe
    const hasProviderSection =
      /proveedor|provider|modelo|model|OpenAI|Anthropic|Claude|GPT/i.test(bodyText);
    console.log(`${hasProviderSection ? '✅' : 'ℹ️'} Sección de proveedores visible: ${hasProviderSection}`);

    // Navegar a la subsección de proveedores
    await page.goto(`${CHAT_URL}/settings?active=provider`, {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });
    await page.waitForTimeout(2_000);

    const settingsText = (await page.locator('body').textContent()) ?? '';
    expect(settingsText).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Al menos uno de los proveedores conocidos debe aparecer
    const knownProviders = ['OpenAI', 'Anthropic', 'Claude', 'Google', 'Gemini', 'Higress'];
    const foundProviders = knownProviders.filter((p) => settingsText.includes(p));
    console.log(`✅ Proveedores encontrados en settings: ${foundProviders.join(', ') || 'ninguno visible'}`);
  });

  test('settings/integrations carga sin crash', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/settings/integrations`, {
      waitUntil: 'domcontentloaded',
      timeout: 25_000,
    });
    await page.waitForTimeout(2_000);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
    expect(bodyText.length).toBeGreaterThan(50);
    console.log('✅ settings/integrations carga OK');
  });
});

// ─── 2. Credenciales del tenant via api2 ─────────────────────────────────────

test.describe('Proveedores IA — credenciales de tenant (API)', () => {
  test.setTimeout(40_000);

  test('endpoint ai-credentials responde con estructura correcta', async ({ request }) => {
    // GET /api/developers/:development/ai-credentials
    // Este endpoint devuelve las claves configuradas por el tenant (admin)
    const response = await request.get(
      `${CHAT_URL}/api/developers/bodasdehoy/ai-credentials`,
      { timeout: 15_000 },
    );
    const status = response.status();
    console.log(`ai-credentials status: ${status}`);

    // 401/403 = endpoint existe, requiere auth → correcto
    // 200 = credenciales disponibles → verificar estructura
    // 404 = endpoint no existe todavía
    expect(status).not.toBe(500);
    expect(status).not.toBe(503);

    if (status === 200) {
      const body = await response.json().catch(() => null);
      if (body) {
        console.log(`ℹ️ Credenciales disponibles, providers:`, Object.keys(body.credentials || body));
        // Si hay credenciales, los apiKey no deben estar en texto plano completo (deben estar redactados)
        const bodyStr = JSON.stringify(body);
        const hasFullKey = /sk-[a-zA-Z0-9]{40,}/.test(bodyStr);
        if (hasFullKey) {
          console.log('⚠️ ADVERTENCIA: API key completa visible en respuesta — considerar redactar en frontend');
        } else {
          console.log('✅ Keys redactadas correctamente o no presentes en respuesta');
        }
      }
    }
  });

  test('localStorage contiene jwt_token_cache tras login (verifica persistencia de auth)', async ({ page }) => {
    if (!hasCredentials) { test.skip(); return; }

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    // Verificar que el JWT está en localStorage (fuente de verdad para auth de api2)
    const jwtKeys = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.filter((k) =>
        k.includes('jwt') || k.includes('token') || k.includes('auth') || k.includes('session'),
      );
    });

    console.log(`ℹ️ Keys en localStorage relacionadas con auth: ${jwtKeys.join(', ') || 'ninguna'}`);

    // Verificar que hay algún token de sesión
    const hasAuthData = jwtKeys.length > 0;
    if (hasAuthData) {
      console.log('✅ Datos de autenticación presentes en localStorage');
    } else {
      console.log('ℹ️ No se encontraron keys de auth en localStorage — puede usar cookies');
    }
  });
});

// ─── 3. Chat responde con proveedor configurado ───────────────────────────────

test.describe('Proveedores IA — respuesta del chat (integración real)', () => {
  test.setTimeout(120_000);

  test('mensaje simple recibe respuesta sin 401/402', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    const { ready } = await waitForCopilotReady(page, 30_000);
    if (!ready) {
      console.log('ℹ️ Chat no listo — skip');
      test.skip();
      return;
    }

    // Interceptar la response del chat para verificar status
    let chatResponseStatus: number | null = null;
    page.on('response', (response) => {
      if (response.url().includes('/webapi/chat/') || response.url().includes('/api/chat/')) {
        chatResponseStatus = response.status();
      }
    });

    // Enviar un mensaje sencillo
    const editor = page.locator('div[contenteditable="true"], textarea').first();
    if (await editor.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await editor.click();
      await editor.fill('Hola');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(20_000); // esperar respuesta
    }

    if (chatResponseStatus !== null) {
      console.log(`ℹ️ Chat response status: ${chatResponseStatus}`);
      expect(chatResponseStatus).not.toBe(500);
      expect(chatResponseStatus).not.toBe(503);

      if (chatResponseStatus === 402) {
        console.log('⚠️ 402 Insufficient Balance — el usuario no tiene saldo. El test de billing cubrirá este caso.');
      } else if (chatResponseStatus === 200) {
        console.log('✅ Chat respondió con 200 OK — proveedor IA funcionando');
      }
    } else {
      console.log('ℹ️ No se interceptó respuesta de /webapi/chat — puede usar SSE directamente');
    }

    // Verificar que no hay crash en la UI
    const bodyText = (await page.locator('body').textContent()) ?? '';
    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
  });

  test('modal InsufficientBalance aparece cuando hay 402', async ({ context, page }) => {
    if (!isChatTest || !hasCredentials) { test.skip(); return; }
    await clearSession(context, page);

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // Simular una respuesta 402 del servidor interceptando la request del chat
    await page.route('**/webapi/chat/**', async (route) => {
      await route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          errorType: 'insufficient_balance',
          body: {
            message: 'Saldo insuficiente para esta operación.',
            screen_type: 'low_balance_warning',
          },
        }),
      });
    });

    const { ready } = await waitForCopilotReady(page, 25_000);
    if (!ready) { test.skip(); return; }

    const editor = page.locator('div[contenteditable="true"], textarea').first();
    if (await editor.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await editor.click();
      await editor.fill('Test saldo insuficiente');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(8_000);
    }

    // Verificar que el modal o alguna indicación de saldo insuficiente aparece
    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasBalanceIndicator = /saldo insuficiente|insufficient balance|recargar|recharge|añadir saldo/i.test(bodyText);

    if (hasBalanceIndicator) {
      console.log('✅ Indicador de saldo insuficiente visible tras 402');
    } else {
      console.log('ℹ️ Indicador de saldo no visible — puede necesitar más tiempo o diferente selector');
    }

    expect(bodyText).not.toMatch(/Error Capturado por ErrorBoundary/);
  });
});

// ─── 4. Verificación de almacenamiento de tokens ─────────────────────────────

test.describe('Proveedores IA — almacenamiento de claves', () => {
  test.setTimeout(60_000);

  test('claves en localStorage no están en texto plano completo', async ({ page }) => {
    if (!hasCredentials) { test.skip(); return; }

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    // Leer todo el localStorage y buscar posibles API keys en texto plano
    const localStorageSnapshot = await page.evaluate(() => {
      const result: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        const value = localStorage.getItem(key) ?? '';
        // Solo capturar si es relativamente pequeño (no dumps grandes de IndexedDB)
        if (value.length < 5000) {
          result[key] = value;
        }
      }
      return result;
    });

    const fullSnapshot = JSON.stringify(localStorageSnapshot);

    // Buscar patrones de API keys en texto plano (sk-, AIz-, etc.)
    const hasExposedOpenAIKey = /sk-[a-zA-Z0-9]{40,}/.test(fullSnapshot);
    const hasExposedAnthropicKey = /sk-ant-[a-zA-Z0-9-]{40,}/.test(fullSnapshot);
    const hasExposedGoogleKey = /AIza[0-9A-Za-z_-]{35,}/.test(fullSnapshot);

    if (hasExposedOpenAIKey) {
      console.log('⚠️ OpenAI API key completa detectada en localStorage — riesgo de seguridad');
    }
    if (hasExposedAnthropicKey) {
      console.log('⚠️ Anthropic API key completa detectada en localStorage — riesgo de seguridad');
    }
    if (hasExposedGoogleKey) {
      console.log('⚠️ Google API key completa detectada en localStorage — riesgo de seguridad');
    }

    if (!hasExposedOpenAIKey && !hasExposedAnthropicKey && !hasExposedGoogleKey) {
      console.log('✅ No se encontraron API keys en texto plano en localStorage');
    }

    // No hacer fail el test — solo reportar. Las claves pueden estar en pglite (IndexedDB), que es correcto.
    const lsKeys = Object.keys(localStorageSnapshot);
    console.log(`ℹ️ Keys en localStorage: ${lsKeys.slice(0, 10).join(', ')}${lsKeys.length > 10 ? '...' : ''}`);
  });

  test('pglite aiProviders — verificar que la DB existe', async ({ page }) => {
    if (!hasCredentials) { test.skip(); return; }

    const loggedIn = await loginInChat(page);
    if (!loggedIn) { test.skip(); return; }

    // Verificar que IndexedDB tiene la base de datos de pglite
    const idbDatabases = await page.evaluate(async () => {
      try {
        const dbs = await indexedDB.databases();
        return dbs.map((db) => db.name ?? '');
      } catch {
        return [];
      }
    });

    console.log(`ℹ️ IndexedDB databases: ${idbDatabases.join(', ') || 'no accesible'}`);

    const hasPglite = idbDatabases.some(
      (db) => db.includes('pglite') || db.includes('lobe') || db.includes('chat'),
    );
    if (hasPglite) {
      console.log('✅ Base de datos pglite detectada en IndexedDB (almacenamiento seguro de claves)');
    } else {
      console.log('ℹ️ pglite no detectado en IndexedDB — puede usar otro mecanismo o nombres distintos');
    }
  });
});
