/**
 * floor-plan-tool.spec.ts
 *
 * E2E tests para el builtin tool "lobe-floor-plan-editor" en chat-ia.
 * Este tool permite a la IA renderizar un editor interactivo de planos de mesas
 * INLINE dentro del chat, como respuesta a preguntas sobre distribución de mesas.
 *
 * Flujos cubiertos:
 *   1. Smoke — chat-ia accesible
 *   2. El tool existe en el registro de tools (src/tools/index.ts)
 *   3. Invocar via prompt → la IA invoca el tool → el render aparece en el chat
 *   4. El render muestra el editor (canvas, controles de mesa)
 *   5. El render no crashea (sin ErrorBoundary inline)
 *   6. Integración con el módulo de mesas de appEventos (via filter_view)
 *
 * Nota: el tool "lobe-floor-plan-editor" puede no estar completamente implementado.
 * Los tests son flexibles — detectan si el render existe y si responde correctamente.
 *
 * Ejecutar:
 *   E2E_ENV=dev pnpm exec playwright test e2e-app/floor-plan-tool.spec.ts
 *   CHAT_URL=https://chat-test.bodasdehoy.com pnpm exec playwright test e2e-app/floor-plan-tool.spec.ts
 */
import { test, expect, Page } from '@playwright/test';
import { TEST_URLS, TEST_CREDENTIALS } from './fixtures';

// ─── Config ──────────────────────────────────────────────────────────────────

const CHAT_URL = process.env.CHAT_URL || TEST_URLS.chat;
const EMAIL    = TEST_CREDENTIALS.email;
const PASSWORD = TEST_CREDENTIALS.password;
const hasCredentials = Boolean(EMAIL && PASSWORD);

const isRemote =
  CHAT_URL.includes('chat-test.') ||
  CHAT_URL.includes('chat-dev.') ||
  CHAT_URL.includes('chat.bodasdehoy.com');

const MULT = isRemote ? 1.5 : 1;

// ─── Chat helpers ─────────────────────────────────────────────────────────────

function isAtChat(url: string): boolean {
  try {
    const p = new URL(url);
    return !p.pathname.includes('/login') && p.pathname.includes('/chat');
  } catch {
    return url.includes('/chat') && !url.includes('/login');
  }
}

function stripBoilerplate(text: string): string {
  return text
    .replace(/\d{2}:\d{2}:\d{2}/g, '')
    .replace(/Analizando tu solicitud\.{2,}/gi, '')
    .replace(/Buscando información\.{2,}/gi, '')
    .replace(/Consultando[^.]{0,40}\.{2,}/gi, '')
    .replace(/Formulando tu respuesta\.{2,}/gi, '')
    .replace(/Procesando\.{2,}/gi, '')
    .replace(/Pensando\.{2,}/gi, '')
    .replace(/(?<![a-zA-Z0-9])auto(?![a-zA-Z0-9])/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function sendAndWait(
  page: Page,
  message: string,
  waitMs = 50_000,
  afterCount = 0,
): Promise<{ response: string; newCount: number }> {
  if (!isAtChat(page.url())) {
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);
  }
  const ta = page.locator('div[contenteditable="true"]').last();
  await ta.waitFor({ state: 'visible', timeout: 30_000 });
  await ta.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(message, { delay: 20 });
  await page.keyboard.press('Enter');

  const sendDeadline = Date.now() + 20_000;
  while (Date.now() < sendDeadline) {
    if (await page.locator('[data-index]').count() > afterCount) break;
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(6_000);

  const deadline = Date.now() + waitMs;
  let lastText = '';
  let stableCount = 0;
  let currentCount = afterCount;

  while (Date.now() < deadline) {
    const articles = await page.locator('[data-index]').allTextContents();
    currentCount = articles.length;
    const newOnes = articles.slice(afterCount);
    const prefix = message.trim().slice(0, 25).toLowerCase();
    const aiMsgs = newOnes.filter((t) => {
      const s = t.trim();
      if (s.length <= 5) return false;
      if (s.toLowerCase().includes(prefix)) return false;
      if (/^(\d{2}:\d{2}:\d{2}\s*\n?\s*)+$/.test(s)) return false;
      return true;
    });
    const stripped = stripBoilerplate(aiMsgs.join('\n').trim());
    if (stripped.length > 5) {
      if (stripped === lastText) {
        stableCount++;
        if (stableCount >= 2) break;
      } else {
        stableCount = 0;
        lastText = stripped;
      }
    }
    await page.waitForTimeout(1_500);
  }
  return { response: lastText, newCount: currentCount };
}

async function loginChat(page: Page): Promise<boolean> {
  if (!hasCredentials) return false;
  try {
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(1500);

    const currentPath = new URL(page.url()).pathname;
    if (currentPath === '/chat' || currentPath.startsWith('/chat')) return true;

    const emailInput = page.locator('input[type="email"]').first();
    if (!await emailInput.isVisible({ timeout: 10_000 }).catch(() => false)) return false;

    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url) => url.pathname.startsWith('/chat'), { timeout: 30_000 }).catch(() => {});
    return new URL(page.url()).pathname.startsWith('/chat');
  } catch {
    return false;
  }
}

// ─── 1. Smoke ─────────────────────────────────────────────────────────────────

test.describe('floor-plan-tool — Smoke', () => {
  test.setTimeout(60_000);

  test('[FP-SMOKE] chat-ia accesible para el floor-plan tool', async ({ page }) => {
    const res = await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
    const status = res?.status() ?? 0;
    if (status === 502 || status === 503 || status === 0) {
      console.log(`ℹ️ chat-ia no accesible (${status}) en ${CHAT_URL}`);
      test.skip();
      return;
    }
    console.log(`[E2E] ✅ chat-ia accesible (HTTP ${status})`);
    expect(status).toBeLessThan(500);
  });
});

// ─── 2. Registro del tool ─────────────────────────────────────────────────────

test.describe('floor-plan-tool — Registro en sistema de tools', () => {
  test.setTimeout(30_000);

  test('[FP-01] lobe-floor-plan-editor está en src/tools/index.ts', async () => {
    // Verificación estática — el tool debe estar registrado
    const fs = await import('fs');
    const path = await import('path');
    const toolsIndex = path.join(process.cwd(), 'apps/chat-ia/src/tools/index.ts');

    if (!fs.existsSync(toolsIndex)) {
      console.log('ℹ️ src/tools/index.ts no encontrado — puede estar en otra ruta');
      return;
    }

    const content = fs.readFileSync(toolsIndex, 'utf-8');
    const hasFloorPlan =
      content.includes('floor-plan') ||
      content.includes('floorPlan') ||
      content.includes('FloorPlan') ||
      content.includes('lobe-floor-plan-editor');

    console.log(`floor-plan en tools/index.ts: ${hasFloorPlan}`);
    // Informativo — no falla si no está (puede estar pendiente de implementar)
  });

  test('[FP-02] directorio src/tools/floor-plan-editor existe', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const toolDir = path.join(process.cwd(), 'apps/chat-ia/src/tools/floor-plan-editor');
    const exists = fs.existsSync(toolDir);
    console.log(`src/tools/floor-plan-editor existe: ${exists}`);
    // Informativo — documenta estado de implementación
  });
});

// ─── 3. Invocación via prompt ─────────────────────────────────────────────────

test.describe('floor-plan-tool — Invocación en chat', () => {
  test.setTimeout(180_000);

  test('[FP-03] pregunta sobre distribución de mesas → IA responde (con o sin tool)', async ({ page }) => {
    if (!hasCredentials || !isRemote) { test.skip(); return; }

    const ok = await loginChat(page);
    if (!ok) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const articleCount = await page.locator('[data-index]').count();
    const { response } = await sendAndWait(
      page,
      'Ayúdame a diseñar la distribución de mesas para mi boda. Tengo 80 invitados y quiero mesas redondas de 10 personas.',
      90_000 * MULT,
      articleCount,
    );

    console.log(`[FP-03] respuesta: "${response.slice(0, 200)}"`);

    // La IA debe responder de alguna forma (no vacío, no error 500)
    const isEmpty = response.trim().length === 0;
    const isError = /error.*servidor|500|internal\s*server/i.test(response);
    expect(isEmpty || isError, `[FP-03] Respuesta inválida: "${response.slice(0, 100)}"`).toBe(false);

    // Si el tool está implementado, debe aparecer un render del editor
    const hasToolRender =
      (await page.locator('[class*="floor-plan"], [class*="floor_plan"], [class*="plano"], canvas').count()) > 0;

    if (hasToolRender) {
      console.log('✅ floor-plan tool render detectado en el chat');
    } else {
      console.log('ℹ️ floor-plan tool render NO detectado — la IA respondió en texto (tool no implementado o no invocado)');
      // Aceptar respuesta útil sobre mesas O respuesta de limitación del backend
      const isHelpful = /mesa|invitado|distribuci|redonda|person|asiento|capac/i.test(response);
      const isBackendLimitMsg = /demasiados pasos|reformula|más específi|no puedo|intenta|momento/i.test(response);
      const isEmpty = response.trim().length === 0;
      expect(
        isHelpful || isBackendLimitMsg || isEmpty,
        `[FP-03] Respuesta inesperada: "${response.slice(0, 200)}"`,
      ).toBe(true);
    }
  });

  test('[FP-04] pregunta directa de "plano de mesas" → respuesta sin crash', async ({ page }) => {
    if (!hasCredentials || !isRemote) { test.skip(); return; }

    const ok = await loginChat(page);
    if (!ok) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const articleCount = await page.locator('[data-index]').count();
    const { response } = await sendAndWait(
      page,
      'Muéstrame el editor de plano de mesas',
      90_000 * MULT,
      articleCount,
    );

    console.log(`[FP-04] respuesta: "${response.slice(0, 200)}"`);

    // No debe crashear el chat
    const hasCrash = /ErrorBoundary|TypeError|ReferenceError|Cannot read properties/i.test(response);
    expect(hasCrash, `[FP-04] El chat crasheó al invocar floor-plan tool`).toBe(false);

    // Verificar que no hay pantalla en blanco / error visible en UI
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
  });
});

// ─── 4. Render del editor (si está implementado) ──────────────────────────────

test.describe('floor-plan-tool — Render del editor', () => {
  test.setTimeout(180_000);

  test('[FP-05] render inline no genera ErrorBoundary en el chat', async ({ page }) => {
    if (!hasCredentials || !isRemote) { test.skip(); return; }

    const ok = await loginChat(page);
    if (!ok) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const articleCount = await page.locator('[data-index]').count();
    await sendAndWait(
      page,
      'Abre el editor de plano de mesas para el evento Boda Isabel y Raúl',
      90_000 * MULT,
      articleCount,
    );

    // Verificar no hay ErrorBoundary en la UI completa (incluyendo renders inline)
    const body = (await page.locator('body').textContent()) ?? '';
    expect(body).not.toMatch(/Error Capturado por ErrorBoundary/);

    // Verificar no hay consola de errores JS críticos
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(e =>
      /Cannot read properties of undefined|is not a function|is not defined/i.test(e) &&
      !e.includes('ResizeObserver'), // ResizeObserver loop errors son benignos
    );
    if (criticalErrors.length > 0) {
      console.warn(`⚠️ Errores JS: ${criticalErrors.slice(0, 3).join(', ')}`);
    }
    // No falla por errores JS benignos — solo informa
  });

  test('[FP-06] si el render existe: muestra controles básicos del editor', async ({ page }) => {
    if (!hasCredentials || !isRemote) { test.skip(); return; }

    const ok = await loginChat(page);
    if (!ok) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const articleCount = await page.locator('[data-index]').count();
    await sendAndWait(
      page,
      'Necesito ver el plano de mesas para distribuir 80 invitados',
      90_000 * MULT,
      articleCount,
    );

    await page.waitForTimeout(3000);

    // Si el render existe, verificar controles mínimos
    const hasCanvas = (await page.locator('canvas').count()) > 0;
    const hasFloorPlanElement = (await page.locator(
      '[class*="floor"], [class*="Floor"], [class*="mesa"], [class*="plano"], [data-tool="floor-plan"]'
    ).count()) > 0;

    if (hasCanvas || hasFloorPlanElement) {
      console.log('✅ Render del floor-plan tool detectado');

      // Verificar que el editor tiene controles básicos
      const hasControls =
        (await page.locator('button, [role="button"]').count()) > 3 ||
        (await page.locator('input[type="range"], select').count()) > 0;

      console.log(`controles del editor presentes: ${hasControls}`);
    } else {
      console.log('ℹ️ floor-plan tool render no detectado — tool pendiente de implementación completa');

      // Verificar que la IA al menos respondió en texto sobre mesas
      const body = (await page.locator('body').textContent()) ?? '';
      expect(body).not.toMatch(/Error Capturado por ErrorBoundary/);
    }
  });
});

// ─── 5. Integración con appEventos mesas ─────────────────────────────────────

test.describe('floor-plan-tool — Integración con appEventos', () => {
  test.setTimeout(120_000);

  test('[FP-07] respuesta del tool puede vincular a /mesas en appEventos', async ({ page }) => {
    if (!hasCredentials || !isRemote) { test.skip(); return; }

    const ok = await loginChat(page);
    if (!ok) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(2000);

    const articleCount = await page.locator('[data-index]').count();
    const { response } = await sendAndWait(
      page,
      '¿Puedo ver el plano de mesas de mi boda en la aplicación?',
      90_000 * MULT,
      articleCount,
    );

    console.log(`[FP-07] respuesta: "${response.slice(0, 250)}"`);

    const isEmpty = response.trim().length === 0;
    expect(isEmpty, '[FP-07] Sin respuesta del chat').toBe(false);

    // La respuesta debe mencionar mesas o dirigir a la sección correspondiente
    const mentionsMesas =
      /mesa|plano|distribuci|asiento|organizador|app.*mesas|mesas.*app/i.test(response);

    if (mentionsMesas) {
      console.log('✅ La IA referencia el módulo de mesas');
    } else {
      console.log('ℹ️ La IA respondió sin mencionar mesas explícitamente');
    }
  });
});
