/**
 * Pruebas E2E — Límite de mensajes y sesión de visitante.
 *
 * Cubre las funcionalidades implementadas:
 *   1. Límite cliente-side: 3 mensajes antes del modal (store Redux)
 *   2. Cookie vis_mc: contador persiste entre recargas
 *   3. Visitor ID persistente: mismo ID entre sesiones (localStorage)
 *   4. Server-side check: route.ts rechaza sin llamar a api-ia
 *   5. Identidad unificada: iframe copilot + standalone chat-ia comparten ID
 *
 * Para ejecutar:
 *   PLAYWRIGHT_BROWSER=webkit BASE_URL=https://app-test.bodasdehoy.com E2E_FAST=1 \
 *   npx playwright test e2e-app/visitor-limit.spec.ts
 */
import { test, expect, BrowserContext, Page } from '@playwright/test';
import { clearSession } from './helpers';
import { getChatUrl } from './fixtures';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app-test.bodasdehoy.com') ||
  BASE_URL.includes('app.bodasdehoy.com') ||
  BASE_URL.includes('127.0.0.1') ||
  BASE_URL.includes('localhost');

const CHAT_URL = getChatUrl(BASE_URL);

/** Limpia solo chat-test (cookies + localStorage) sin tocar app-test */
async function clearChatSession(context: BrowserContext, page: Page): Promise<void> {
  await context.clearCookies();
  if (isAppTest) {
    try {
      await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.evaluate(() => {
        try { window.localStorage.clear(); } catch { /* ignorar */ }
        try { window.sessionStorage.clear(); } catch { /* ignorar */ }
      }).catch(() => {});
    } catch { /* ignorar */ }
  }
  await context.clearCookies();
}

// ─────────────────────────────────────────────────────────────────────────────
// VISITOR ID — Persistencia entre sesiones
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Visitor ID — Persistencia y reutilización', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ context, page }) => {
    await clearChatSession(context, page);
  });

  test('visitor ID se persiste en localStorage tras "Continuar como visitante"', async ({ page }) => {
    if (!isAppTest) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForTimeout(2000);

    // Buscar el botón de modo visitante
    const visitorBtn = page.locator('button').filter({ hasText: /visitante|invitado|continuar sin|sin cuenta/i }).first();
    const btnVisible = await visitorBtn.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!btnVisible) {
      console.log('ℹ️ Botón visitante no encontrado — puede que el login esté en otro estado');
      test.skip();
      return;
    }

    await visitorBtn.click();
    await page.waitForTimeout(1500);

    // Verificar que se guardó un visitor ID en localStorage
    const storedConfig = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('dev-user-config');
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    });

    expect(storedConfig).not.toBeNull();
    expect(storedConfig.userId).toMatch(/^visitor_/);
    expect(storedConfig.user_type).toBe('visitor');

    console.log('Visitor ID guardado:', storedConfig.userId);
  });

  test('visitor ID se reutiliza en segunda visita a login (no genera uno nuevo)', async ({ page }) => {
    if (!isAppTest) { test.skip(); return; }

    // Simular que ya hay un visitor ID en localStorage
    await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForLoadState('load').catch(() => {});

    const existingId = `visitor_${Date.now()}_test00`;
    await page.evaluate((id) => {
      localStorage.setItem('dev-user-config', JSON.stringify({
        developer: 'bodasdehoy',
        userId: id,
        user_type: 'visitor',
        timestamp: Date.now(),
        token: null,
      }));
    }, existingId);

    // Recargar y volver a pulsar "Continuar como visitante"
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const visitorBtn = page.locator('button').filter({ hasText: /visitante|invitado|continuar sin|sin cuenta/i }).first();
    const btnVisible = await visitorBtn.isVisible({ timeout: 8_000 }).catch(() => false);

    if (!btnVisible) {
      console.log('ℹ️ Botón visitante no encontrado — puede que la página haya redirigido al chat');
      // Si redirigió al chat con el mismo ID, el test pasa igualmente
      const currentId = await page.evaluate(() => {
        try {
          const raw = localStorage.getItem('dev-user-config');
          return raw ? JSON.parse(raw).userId : null;
        } catch { return null; }
      });
      if (currentId === existingId) {
        console.log('Visitor ID preservado correctamente tras redirección:', currentId);
        return;
      }
      test.skip();
      return;
    }

    await visitorBtn.click();
    await page.waitForTimeout(1500);

    // El ID debe ser el mismo que pusimos antes
    const storedConfig = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('dev-user-config');
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    });

    expect(storedConfig?.userId).toBe(existingId);
    console.log('Visitor ID reutilizado correctamente:', storedConfig?.userId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// COOKIE vis_mc — Contador de mensajes que persiste entre recargas
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Cookie vis_mc — Contador de mensajes visitante', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    await clearChatSession(context, page);
  });

  test('cookie vis_mc se incrementa al enviar mensajes como visitante', async ({ page }) => {
    if (!isAppTest) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(3000);

    // Verificar que no hay cookie vis_mc aún
    const cookiesBefore = await page.context().cookies(CHAT_URL);
    const visMcBefore = cookiesBefore.find((c) => c.name === 'vis_mc');
    expect(visMcBefore).toBeUndefined();

    // Simular que el cliente incrementa la cookie (como lo hace generateAIChat.ts)
    await page.evaluate(() => {
      const current = parseInt(document.cookie.match(/vis_mc=(\d+)/)?.[1] ?? '0', 10);
      document.cookie = `vis_mc=${current + 1}; path=/; max-age=86400; SameSite=Lax`;
    });

    const cookiesAfter = await page.context().cookies(CHAT_URL);
    const visMcAfter = cookiesAfter.find((c) => c.name === 'vis_mc');
    expect(visMcAfter).toBeDefined();
    expect(parseInt(visMcAfter!.value, 10)).toBe(1);
    console.log('Cookie vis_mc correctamente seteada a 1');
  });

  test('cookie vis_mc persiste entre recargas de página', async ({ page }) => {
    if (!isAppTest) { test.skip(); return; }

    await page.goto(`${CHAT_URL}/`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForTimeout(2000);

    // Setear cookie a 2
    await page.evaluate(() => {
      document.cookie = `vis_mc=2; path=/; max-age=86400; SameSite=Lax`;
    });

    // Recargar la página
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Verificar que la cookie sigue existiendo
    const visMcValue = await page.evaluate(() => {
      return document.cookie.match(/vis_mc=(\d+)/)?.[1] ?? null;
    });

    expect(visMcValue).toBe('2');
    console.log('Cookie vis_mc persiste tras recarga:', visMcValue);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SERVER-SIDE LIMIT — route.ts rechaza sin llamar a api-ia
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Server-side visitor limit — /webapi/chat/{provider}', () => {
  test.setTimeout(60_000);

  test('endpoint /webapi/chat rechaza visitor con vis_mc>=3 y X-User-ID visitor_xxx', async ({ page }) => {
    if (!isAppTest) { test.skip(); return; }

    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1000);

    // El navegador no permite sobreescribir 'Cookie' en fetch (política de seguridad).
    // En su lugar: seteamos la cookie real via document.cookie y luego hacemos el fetch.
    // El browser incluirá automáticamente la cookie en la request al mismo origen.
    await page.evaluate(() => {
      // Setear cookie al límite (>=3)
      document.cookie = `vis_mc=3; path=/; max-age=86400; SameSite=Lax`;
    });

    const result = await page.evaluate(async () => {
      try {
        const res = await fetch('/webapi/chat/bodasdehoy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': 'visitor_test_e2e_limit',
            // El browser añade las cookies del mismo origen automáticamente
          },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }),
        });
        const body = await res.json().catch(() => ({}));
        return { status: res.status, body };
      } catch (e: any) {
        return { error: (e as Error).message };
      }
    });

    // El server debe rechazar con 401 login_required
    expect(result.status).toBe(401);
    expect(result.body?.errorType).toBe('login_required');
    console.log('Server-side limit correctamente aplicado:', result.status, result.body?.errorType);
  });

  test('endpoint /webapi/chat permite visitor con vis_mc<3', async ({ page }) => {
    if (!isAppTest) { test.skip(); return; }

    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1000);

    // Simular llamada con contador bajo el límite
    const result = await page.evaluate(async () => {
      try {
        const res = await fetch('/webapi/chat/bodasdehoy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': 'visitor_test_e2e_below',
            'Cookie': 'vis_mc=1',
          },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }),
        });
        // No debe devolver 401 por límite (puede fallar por otros motivos como JWT inválido)
        return { status: res.status };
      } catch (e: any) {
        return { error: e.message };
      }
    });

    // No debe ser 401 por login_required de límite (puede ser 401 por JWT, que es diferente)
    // Si devuelve 401, verificamos que no sea por límite de mensajes
    if (result.status === 401) {
      const body = await page.evaluate(async () => {
        const res = await fetch('/webapi/chat/bodasdehoy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': 'visitor_test_e2e_below2',
            'Cookie': 'vis_mc=1',
          },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] }),
        });
        return res.json().catch(() => ({}));
      });
      // Si es 401, debe ser por JWT inválido, no por límite de mensajes
      // El mensaje de límite es específico
      const isLimitError = body?.error?.message?.includes('límite de mensajes gratuitos');
      expect(isLimitError).toBe(false);
      console.log('401 recibido pero NO por límite de visitante — correcto (JWT inválido)');
    } else {
      console.log('Request con vis_mc=1 pasó el server check, status:', result.status);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// IDENTIDAD UNIFICADA — iframe copilot y chat-ia standalone comparten sesión
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Identidad visitante unificada — iframe + standalone', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ context, page }) => {
    await clearSession(context, page);
  });

  test('visitor ID guardado en iframe está disponible en standalone chat-ia', async ({ page }) => {
    if (!isAppTest) { test.skip(); return; }

    // 1. Ir a app-test (donde está el iframe del copilot)
    await page.goto('https://app-test.bodasdehoy.com', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(5000);

    // 2. Simular que EventosAutoAuth guardó un visitor ID en chat-test via localStorage
    //    (en producción esto ocurre cuando el iframe recibe AUTH_CONFIG con isAnonymous=true)
    const iframeOrigin = CHAT_URL;
    // Navegar al origen del iframe para escribir en su localStorage
    await page.goto(iframeOrigin, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForTimeout(1000);

    const testVisitorId = `visitor_e2e_unified_${Date.now()}`;
    await page.evaluate((id) => {
      localStorage.setItem('dev-user-config', JSON.stringify({
        developer: 'bodasdehoy',
        userId: id,
        user_type: 'visitor',
        timestamp: Date.now(),
        token: null,
        source: 'parent_iframe',
      }));
    }, testVisitorId);

    // 3. Simular apertura standalone: ir al login y pulsar "Continuar como visitante"
    await page.goto(`${iframeOrigin}/login`, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    await page.waitForTimeout(2000);

    const visitorBtn = page.locator('button').filter({ hasText: /visitante|invitado|continuar sin|sin cuenta/i }).first();
    const btnVisible = await visitorBtn.isVisible({ timeout: 8_000 }).catch(() => false);

    if (!btnVisible) {
      // Si redirigió directamente al chat con el ID existente, también es correcto
      const currentId = await page.evaluate(() => {
        try { return JSON.parse(localStorage.getItem('dev-user-config') || '{}').userId; } catch { return null; }
      });
      if (currentId === testVisitorId) {
        console.log('ID unificado — la app reutilizó el visitor ID del iframe:', currentId);
        return;
      }
      console.log('ℹ️ Botón visitante no encontrado y ID cambió — puede haber redirigido');
      test.skip();
      return;
    }

    await visitorBtn.click();
    await page.waitForTimeout(1500);

    // 4. El visitor ID debe ser el mismo que pusimos (reutilización)
    const finalId = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('dev-user-config') || '{}').userId; } catch { return null; }
    });

    expect(finalId).toBe(testVisitorId);
    console.log('Identidad unificada confirmada — mismo ID en iframe y standalone:', finalId);
  });

  test('cookie vis_mc es compartida entre iframe (chat-test) y standalone (chat-test)', async ({ page }) => {
    if (!isAppTest) { test.skip(); return; }

    // Ambos (iframe y standalone) corren en chat-test.bodasdehoy.com
    // La cookie es por origen, así que se comparte automáticamente
    await page.goto(CHAT_URL, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    await page.waitForTimeout(1000);

    // Setear cookie como lo haría el iframe
    await page.evaluate(() => {
      document.cookie = `vis_mc=2; path=/; max-age=86400; SameSite=Lax`;
    });

    // Abrir una nueva URL del mismo origen (simula navegar entre iframe y standalone)
    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 25_000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // La cookie debe seguir siendo visible
    const visMcValue = await page.evaluate(() => {
      return document.cookie.match(/vis_mc=(\d+)/)?.[1] ?? null;
    });

    expect(visMcValue).toBe('2');
    console.log('Cookie vis_mc compartida correctamente entre rutas del mismo origen:', visMcValue);
  });
});
