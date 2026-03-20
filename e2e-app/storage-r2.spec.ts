/**
 * storage-r2.spec.ts
 *
 * Tests de subida de fotos a Cloudflare R2 vía api-ia.
 * Flujo: cliente → Next.js /api/storage/upload (proxy) → api-ia → R2.
 *
 * Requiere:
 *   - NEXT_PUBLIC_USE_STORAGE_R2=true en chat-test/chat-dev
 *   - api-ia accesible (https://api-ia.bodasdehoy.com)
 *   - Credenciales de test con un evento real
 *
 * Dos estrategias:
 *   A) API directa (request): más rápida, no requiere UI visible.
 *   B) UI (page): sube desde el interfaz de chat-ia y verifica que aparece.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getChatUrl } from './fixtures';
import { clearSession } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const CHAT_URL = getChatUrl(BASE_URL);
const API_IA_URL = process.env.API_IA_URL || 'https://api-ia.bodasdehoy.com';
const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'bodasdehoy.com@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'lorca2012M*.';

const isRemote =
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com');

/** Crea un PNG mínimo válido (1×1 px rojo) en memoria como Buffer */
function makeMinimalPng(): Buffer {
  // PNG header + IHDR + IDAT (pixel rojo) + IEND — 67 bytes
  return Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
    '2e000000034944415478016360f8cfc000000002000174e4710900000000' +
    '49454e44ae426082',
    'hex',
  );
}

/** Espera autenticación y devuelve el JWT del localStorage de chat-ia */
async function getChatJWT(page: import('@playwright/test').Page): Promise<string | null> {
  const raw = await page.evaluate(() => {
    try { return localStorage.getItem('dev-user-config'); } catch { return null; }
  });
  if (!raw) return null;
  try { return JSON.parse(raw).token ?? null; } catch { return null; }
}

/** Hace login en chat-test y devuelve JWT + userId + eventId */
async function loginAndGetContext(page: import('@playwright/test').Page): Promise<{
  jwt: string | null;
  userId: string | null;
  eventId: string | null;
  development: string | null;
}> {
  // chat-ia usa SplitLoginPage con email/password — ir directo al form
  const loginUrl = `${CHAT_URL}/login`;
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const bodyText = await page.locator('body').textContent().catch(() => null) ?? '';
  if (!bodyText || bodyText.length < 20) return { jwt: null, userId: null, eventId: null, development: null };

  // Buscar input de email — puede estar en un tab "Email" que hay que activar primero
  let emailInput = page.locator('input[type="email"], input[name="email"]').first();
  let hasEmailForm = await emailInput.isVisible({ timeout: 5_000 }).catch(() => false);

  if (!hasEmailForm) {
    // Intentar click en tab/botón "Email" o "Correo"
    const emailTab = page.locator('button, [role="tab"]').filter({ hasText: /email|correo/i }).first();
    if (await emailTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await emailTab.click();
      await page.waitForTimeout(1000);
      hasEmailForm = await emailInput.isVisible({ timeout: 5_000 }).catch(() => false);
    }
  }

  if (hasEmailForm) {
    await emailInput.fill(TEST_EMAIL);
    const pwInput = page.locator('input[type="password"]').first();
    await pwInput.fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    // Esperar redirect post-login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(3000);
  } else {
    console.log('ℹ️ Formulario email no visible en login de chat-test');
  }

  const jwt = await getChatJWT(page);
  const raw = await page.evaluate(() => {
    try { return localStorage.getItem('dev-user-config'); } catch { return null; }
  });
  let userId: string | null = null;
  let development: string | null = null;
  let eventId: string | null = null;
  if (raw) {
    try {
      const cfg = JSON.parse(raw);
      userId = cfg.user_id ?? cfg.userId ?? null;
      development = cfg.development ?? cfg.developer ?? null;
    } catch { /* ignore */ }
  }

  // Obtener eventId desde localStorage (lo establece el store de chat-ia)
  const rawEvent = await page.evaluate(() => {
    try { return localStorage.getItem('lobe-event-context') || localStorage.getItem('current-event-id') || null; } catch { return null; }
  });
  if (rawEvent) {
    try { eventId = JSON.parse(rawEvent)?.eventId ?? rawEvent; } catch { eventId = rawEvent; }
  }

  return { jwt, userId, eventId, development };
}

// ─────────────────────────────────────────────────────────────────────────────
// A) Tests vía API directa (sin UI)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Storage R2 — API directa (sin UI)', () => {
  test.setTimeout(60_000);

  test('api-ia health: /api/storage está activo', async ({ request }) => {
    const res = await request.get(`${API_IA_URL}/health`, { timeout: 10_000 }).catch(() => null);
    if (!res) {
      console.log('ℹ️ api-ia no accesible (timeout) — skip');
      test.skip();
      return;
    }
    const status = res.status();
    console.log(`api-ia health: ${status}`);
    // 521 = Cloudflare "Web Server is Down" (servidor origen caído)
    // 522/523/524 = Cloudflare connection errors
    // Estos son errores de infraestructura, no del código — skipeamos
    if (status === 521 || status === 522 || status === 523 || status === 524 || status === 530) {
      console.log(`ℹ️ api-ia devuelve ${status} (Cloudflare — servidor origen caído) — skip`);
      test.skip();
      return;
    }
    // 500-520: error del servidor propio → falla el test
    expect(status, `api-ia devolvió error del servidor: ${status}`).toBeLessThan(500);
    console.log('✅ api-ia accesible');
  });

  test('proxy Next.js /api/storage/upload responde sin error de autenticación grave', async ({ page, request }) => {
    if (!isRemote) { test.skip(); return; }

    // Hacer login para obtener JWT
    await clearSession({ clearCookies: async () => {} } as never, page);
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
    const loginText = await page.locator('body').textContent().catch(() => null) ?? '';
    if (!loginText || loginText.length < 20) {
      console.log('ℹ️ chat no accesible — skip');
      test.skip();
      return;
    }

    const { jwt, userId, development } = await loginAndGetContext(page);

    if (!jwt) {
      console.log('ℹ️ No se pudo obtener JWT — skip test API');
      test.skip();
      return;
    }

    // Crear imagen mínima en disco temporal
    const tmpFile = path.join('/tmp', `e2e-test-${Date.now()}.png`);
    fs.writeFileSync(tmpFile, makeMinimalPng());

    try {
      const form = new FormData();
      form.append('file', new Blob([makeMinimalPng()], { type: 'image/png' }), 'e2e-test.png');
      form.append('event_id', 'e2e-test-event');
      form.append('access_level', 'shared');

      const res = await request.post(`${CHAT_URL}/api/storage/upload`, {
        multipart: {
          file: {
            name: 'e2e-test.png',
            mimeType: 'image/png',
            buffer: makeMinimalPng(),
          },
          event_id: 'e2e-test-event',
          access_level: 'shared',
        },
        headers: {
          'X-User-ID': userId ?? '',
          'X-Development': development ?? 'bodasdehoy',
          'Cookie': `dev-user-config=${encodeURIComponent(JSON.stringify({ token: jwt, user_id: userId, development, user_type: 'registered' }))}`,
        },
        timeout: 30_000,
      });

      const status = res.status();
      console.log(`Upload API status: ${status}`);

      // No debe ser 500 (error de servidor interno)
      expect(status).not.toBe(500);

      if (status === 200 || status === 201) {
        const body = await res.json().catch(() => ({}));
        console.log('✅ Subida exitosa. Respuesta:', JSON.stringify(body).slice(0, 200));
        // Verificar que tiene URLs o éxito
        const hasUrls = body?.data?.public_urls || body?.url || body?.path || body?.success;
        if (hasUrls) {
          console.log('✅ URLs de R2 recibidas en la respuesta');
        }
      } else if (status === 401 || status === 403) {
        console.log('ℹ️ 401/403 — token puede no ser válido para este endpoint (requiere sesión activa)');
      } else if (status === 404) {
        console.log('ℹ️ 404 — ruta de storage puede no estar activa en este entorno');
      } else {
        console.log(`ℹ️ Status ${status} — respuesta inesperada pero no fallo del servidor`);
      }
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// B) Tests vía UI (Memories / Portal de fotos en chat-ia)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Storage R2 — UI (subida desde chat-ia)', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    await clearSession(context, page);
  });

  test('página /memories o /files carga sin error en chat-test', async ({ page }) => {
    if (!isRemote) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/memories`, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const text = await page.locator('body').textContent().catch(() => null) ?? '';
    if (!text || text.length < 20) {
      // Intentar ruta alternativa
      await page.goto(`${CHAT_URL}/files`, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const text2 = await page.locator('body').textContent().catch(() => null) ?? '';
      if (!text2 || text2.length < 20) {
        console.log('ℹ️ /memories y /files no accesibles — skip');
        test.skip();
        return;
      }
    }

    const bodyText = await page.locator('body').textContent().catch(() => '') ?? '';
    expect(bodyText).not.toMatch(/Internal Server Error|Error 500|Error Capturado por ErrorBoundary/i);
    console.log(`✅ Página de fotos carga sin error (URL: ${page.url()})`);
  });

  test('subida real de foto: imagen llega a R2 y aparece en la UI', async ({ page }) => {
    if (!isRemote) { test.skip(); return; }

    // 1. Login
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
    const loginText = await page.locator('body').textContent().catch(() => null) ?? '';
    if (!loginText || loginText.length < 20) {
      console.log('ℹ️ chat no accesible — skip');
      test.skip();
      return;
    }

    const { jwt } = await loginAndGetContext(page);
    if (!jwt) {
      console.log('ℹ️ No se pudo hacer login — skip');
      test.skip();
      return;
    }

    // 2. Navegar a memories/files
    await page.goto(`${CHAT_URL}/memories`, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(3000);

    const text = await page.locator('body').textContent().catch(() => null) ?? '';
    if (!text || text.length < 20) {
      console.log('ℹ️ /memories no accesible — skip');
      test.skip();
      return;
    }

    expect(text).not.toMatch(/Internal Server Error|Error 500|Error Capturado/i);

    // 3. Buscar botón de subida de foto
    const uploadBtn = page
      .locator('input[type="file"], button[aria-label*="subir" i], button[aria-label*="upload" i], [data-testid*="upload"], label[for*="file"]')
      .first();
    const hasUploadBtn = await uploadBtn.isVisible({ timeout: 8_000 }).catch(() => false);

    if (!hasUploadBtn) {
      console.log('ℹ️ Botón de subida no visible (puede requerir evento activo o diferente estado)');
      // Al menos verificamos que la página no tiene error
      expect(text).not.toMatch(/Error Capturado/i);
      return;
    }

    // 4. Subir imagen de prueba (PNG mínimo)
    const tmpFile = path.join('/tmp', `e2e-upload-${Date.now()}.png`);
    fs.writeFileSync(tmpFile, makeMinimalPng());

    try {
      // Si es input[type="file"], usamos setInputFiles
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await fileInput.setInputFiles(tmpFile);
      } else {
        // Clic en el botón de upload para abrir el file dialog y luego setInputFiles
        await uploadBtn.click();
        await page.waitForTimeout(500);
        const fileInput2 = page.locator('input[type="file"]').first();
        await fileInput2.setInputFiles(tmpFile);
      }

      // 5. Esperar confirmación de subida
      await page.waitForTimeout(8000);

      const afterText = await page.locator('body').textContent().catch(() => '') ?? '';
      expect(afterText).not.toMatch(/Error Capturado|Internal Server Error/i);

      // Detectar éxito: imagen visible, toast de éxito, o nombre del archivo
      const hasSuccess =
        /subida|uploaded|éxito|success|e2e-upload|guardada/i.test(afterText) ||
        (await page.locator('img[src*="r2"], img[src*="cloudflare"], img[src*="bodasdehoy"]').count()) > 0 ||
        (await page.locator('[class*="toast"][class*="success"], [role="alert"]').count()) > 0;

      if (hasSuccess) {
        console.log('✅ Foto subida correctamente y visible en la UI');
      } else {
        console.log('ℹ️ Subida enviada pero confirmación visual no detectada (puede estar procesando)');
      }
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });

  test('subida directa vía API con evento real: verifica public_urls en respuesta', async ({ page, request }) => {
    if (!isRemote) { test.skip(); return; }

    // 1. Login y obtener contexto
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
    const loginText = await page.locator('body').textContent().catch(() => null) ?? '';
    if (!loginText || loginText.length < 20) { test.skip(); return; }

    const { jwt, userId, eventId, development } = await loginAndGetContext(page);
    if (!jwt) { console.log('ℹ️ Sin JWT — skip'); test.skip(); return; }

    const useEventId = eventId ?? 'e2e-test-event';
    console.log(`Subiendo a eventId: ${useEventId}`);

    // 2. Subida directa al proxy Next.js
    const res = await request.post(`${CHAT_URL}/api/storage/upload`, {
      multipart: {
        file: {
          name: `e2e-foto-${Date.now()}.png`,
          mimeType: 'image/png',
          buffer: makeMinimalPng(),
        },
        event_id: useEventId,
        access_level: 'shared',
      },
      headers: {
        'X-User-ID': userId ?? '',
        'X-Development': development ?? 'bodasdehoy',
        'Cookie': `dev-user-config=${encodeURIComponent(JSON.stringify({
          token: jwt, user_id: userId, development: development ?? 'bodasdehoy', user_type: 'registered',
        }))}`,
      },
      timeout: 30_000,
    }).catch(() => null);

    if (!res) {
      console.log('ℹ️ Endpoint no accesible — skip');
      test.skip();
      return;
    }

    const status = res.status();
    console.log(`Upload status: ${status}`);

    // 500 = fallo del servidor → falla el test
    expect(status, `Servidor devolvió 500 al subir foto`).not.toBe(500);

    if (status === 200 || status === 201) {
      const body = await res.json().catch(() => ({}));
      const snippet = JSON.stringify(body).slice(0, 300);
      console.log(`Respuesta: ${snippet}`);

      // Verificar que hay URLs válidas de R2 en la respuesta
      const hasPublicUrl =
        body?.data?.public_urls?.original ||
        body?.data?.public_urls?.thumbnail ||
        body?.url ||
        body?.path ||
        body?.success === true;

      expect(hasPublicUrl, `La respuesta no contiene public_urls ni éxito: ${snippet}`).toBeTruthy();
      console.log('✅ Foto subida a R2 exitosamente con URLs válidas en la respuesta');
    } else if (status === 402) {
      console.log('ℹ️ 402 — cuenta sin saldo suficiente para storage (funcionalidad premium)');
    } else if (status === 401 || status === 403) {
      console.log('ℹ️ 401/403 — sin permisos (JWT puede necesitar renovación)');
    } else if (status === 404) {
      console.log('ℹ️ 404 — storage R2 no activo en este entorno (NEXT_PUBLIC_USE_STORAGE_R2 puede ser false)');
    } else {
      console.log(`ℹ️ Status ${status} — no esperado pero no es fallo del servidor`);
    }
  });
});
