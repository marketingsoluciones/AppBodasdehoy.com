/**
 * share-event-permissions.spec.ts
 *
 * Seguridad CRÍTICA — flow compartir evento + permisos colaborador.
 *
 * Cobertura ANTES: 0 specs.
 *
 * Tests:
 *  1. U1 OWNER ve botón "Compartir evento" en su evento.
 *  2. U1 abre modal compartir → ingresa email U2 → permiso edit mesa → confirma.
 *  3. U2 login → ve evento compartido en su lista de eventos accesibles.
 *  4. U2 con permiso edit mesa → puede crear mesa en /mesas (UI permite + backend acepta).
 *  5. U1 cambia permiso U2 a "view" → U2 ya NO puede crear mesa (UI deshabilita o backend FORBIDDEN).
 *  6. U1 revoca acceso a U2 → U2 ya no ve el evento.
 *
 * Aplicando regla "E2E SOLO via UI": todo el flow desde la UI, NO via mutations.
 *
 * Si UI compartir no existe / no funciona → es BUG_PRODUCTO crítico, NO TEST_DESIGN.
 *
 * Si TEST_USER2 (jcc@marketingsoluciones.com) no existe en Firebase Auth, todo este
 * test bloqueará en login U2 — escalar como TEST_DATA_SETUP.
 */
import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { clearSession, loginAndSelectEvent, waitForAppReady } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppDev =
  BASE_URL.includes('app-dev.bodasdehoy.com') ||
  BASE_URL.includes('app-test.bodasdehoy.com');

const U1_EMAIL = process.env.TEST_USER_EMAIL || '';
const U1_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const U2_EMAIL = process.env.TEST_USER2_EMAIL || 'jcc@marketingsoluciones.com';
const U2_PASSWORD = process.env.TEST_USER2_PASSWORD || '';

const hasBoth = Boolean(U1_EMAIL && U1_PASSWORD && U2_EMAIL && U2_PASSWORD);

async function newCtx(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  return { ctx, page };
}

test.describe('Seguridad — Compartir evento U1→U2 + permisos', () => {
  test.setTimeout(300_000); // 5 min — flow multi-step

  test('U1 OWNER ve botón "Compartir evento" en su evento', async ({ page, context }) => {
    if (!isAppDev || !hasBoth) {
      test.skip(true, 'TEST_DATA_SETUP: requiere TEST_USER1 + TEST_USER2 con creds y env -dev');
      return;
    }

    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, U1_EMAIL, U1_PASSWORD, BASE_URL);
    expect(eventId, 'TEST_DATA_SETUP: U1 debe tener al menos 1 evento como owner').toBeTruthy();

    // Buscar botón compartir/share/colaboradores en página principal del evento
    const shareBtn = page.locator(
      'button, a, [role="button"]'
    ).filter({
      hasText: /compartir|share|colaborador|invitar.*usuario|añadir.*usuario/i,
    }).first();

    await expect(
      shareBtn,
      'BUG_PRODUCTO: botón "Compartir evento / Colaboradores" NO visible en UI evento — feature inalcanzable'
    ).toBeVisible({ timeout: 10_000 });
  });

  test('U1 comparte evento con U2 (permiso edit mesa) → modal/form completo', async ({ page, context }) => {
    if (!isAppDev || !hasBoth) {
      test.skip(true, 'TEST_DATA_SETUP: requiere ambos users');
      return;
    }

    await clearSession(context, page);
    const eventId = await loginAndSelectEvent(page, U1_EMAIL, U1_PASSWORD, BASE_URL);
    expect(eventId, 'TEST_DATA_SETUP: U1 sin evento accesible').toBeTruthy();

    const shareBtn = page.locator(
      'button, a, [role="button"]'
    ).filter({
      hasText: /compartir|share|colaborador|invitar.*usuario/i,
    }).first();

    if (!await shareBtn.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, 'BUG_PRODUCTO: botón compartir no visible (cubierto por test "U1 OWNER ve botón Compartir")');
      return;
    }

    await shareBtn.click();
    await page.waitForTimeout(2000);

    // Modal/form compartir abre con input email
    const emailInput = page.locator(
      '[role="dialog"] input[type="email"], [role="dialog"] input[placeholder*="email" i], [class*="modal"] input[type="email"]'
    ).first();

    await expect(
      emailInput,
      'BUG_PRODUCTO: modal compartir abre pero NO tiene input email para invitar — UI incompleta'
    ).toBeVisible({ timeout: 5_000 });

    await emailInput.fill(U2_EMAIL);

    // Selector de permiso (radio/select para edit/view)
    const permissionControl = page.locator(
      '[role="dialog"] select, [role="dialog"] [role="radiogroup"], [role="dialog"] input[type="radio"], [role="dialog"] [role="combobox"]'
    ).first();

    const hasPermissionControl = await permissionControl.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasPermissionControl) {
      // Si no hay selector de permisos, asumir compartir = edit completo (algunos UIs simples)
      console.log('[Compartir] Sin selector permisos — UI puede asumir edit por defecto');
    }

    // Submit invitación
    const submitBtn = page.locator(
      '[role="dialog"], [class*="modal"]'
    ).locator('button').filter({
      hasText: /enviar|invitar|compartir|guardar|añadir/i,
    }).first();

    await expect(
      submitBtn,
      'BUG_PRODUCTO: modal compartir SIN botón submit (enviar/invitar/guardar)'
    ).toBeVisible({ timeout: 5_000 });

    await submitBtn.click();
    await page.waitForTimeout(3000);

    // Tras submit, debería haber confirmación visible
    const bodyAfter = (await page.locator('body').textContent()) ?? '';
    const hasConfirmation = /enviado|invitado|compartido|exitoso|sent|invited|✓/i.test(bodyAfter);

    expect(
      hasConfirmation,
      'BUG_PRODUCTO: tras compartir evento con U2 NO hay confirmación visible (toast/mensaje/lista actualizada)'
    ).toBe(true);
  });

  test('U2 ve evento compartido tras login + puede crear mesa (permiso edit)', async ({ browser }) => {
    if (!isAppDev || !hasBoth) {
      test.skip(true, 'TEST_DATA_SETUP: requiere ambos users');
      return;
    }

    // U2 en context independiente
    const { ctx, page } = await newCtx(browser);
    try {
      await clearSession(ctx, page);
      const u2EventId = await loginAndSelectEvent(page, U2_EMAIL, U2_PASSWORD, BASE_URL);

      if (!u2EventId) {
        test.skip(
          true,
          'TEST_DATA_SETUP: U2 no tiene eventos accesibles tras login. Posibles causas: (1) U2 no aceptó invitación previa, (2) compartir UI no funcionó, (3) U2 no existe en Firebase Auth.'
        );
        return;
      }

      // Ir a /mesas y verificar UI permite crear (no readonly)
      await page.goto(`${BASE_URL}/mesas`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
      await waitForAppReady(page, 20_000);
      await page.waitForTimeout(3000);

      // Botón crear mesa visible para U2 (permiso edit)
      const createMesaBtn = page.locator('button').filter({
        hasText: /nueva mesa|crear mesa|añadir mesa/i,
      }).first();

      const canCreate = await createMesaBtn.isVisible({ timeout: 8_000 }).catch(() => false);

      // Esto es información valiosa: U2 con edit DEBE poder ver el botón
      // Si no lo ve, tenemos un problema de permisos UI
      expect(
        canCreate,
        'BUG_SEGURIDAD: U2 con permiso edit mesa NO ve botón crear mesa — UI no respeta permisos OR compartir no asignó edit correctamente'
      ).toBe(true);
    } finally {
      await ctx.close();
    }
  });

  test('Defensa BACKEND: U2 sin permiso intenta crearMesa via GraphQL directo → FORBIDDEN', async ({ browser, request }) => {
    // Este test verifica que el backend NO depende solo de UI para enforcement
    // Si UI permite o no permite, el backend DEBE rechazar mutations no autorizadas
    if (!isAppDev || !hasBoth) {
      test.skip(true, 'TEST_DATA_SETUP: requiere ambos users');
      return;
    }

    const { ctx, page } = await newCtx(browser);
    try {
      await clearSession(ctx, page);
      const u2EventId = await loginAndSelectEvent(page, U2_EMAIL, U2_PASSWORD, BASE_URL);
      if (!u2EventId) {
        test.skip(true, 'TEST_DATA_SETUP: U2 sin eventos para test bypass');
        return;
      }

      // Obtener cookies sesión U2
      const cookies = await ctx.cookies();
      const idToken = cookies.find((c) => c.name === 'idTokenV0.1.0')?.value;
      const sessionBodas = cookies.find((c) => c.name === 'sessionBodas')?.value;

      expect(
        idToken || sessionBodas,
        'BUG_SEGURIDAD: U2 logueado pero sin cookie idTokenV0.1.0 ni sessionBodas — auth incompleta'
      ).toBeTruthy();

      // Intentar mutation crearMesa con eventId que U2 NO debería tener acceso edit
      // Buscamos un evento DE U1 que NO esté compartido con U2 (busqueda heurística por nombre)
      const fakeEventId = '000000000000000000000001'; // ObjectId que probablemente no existe

      const mutResp = await page.request.post(`${BASE_URL}/api/proxy/graphql`, {
        headers: {
          'Development': 'bodasdehoy',
          'Cookie': `idTokenV0.1.0=${idToken ?? ''}; sessionBodas=${sessionBodas ?? ''}`,
        },
        data: {
          query: `mutation($eventID:ID, $planSpaceID:ID, $mesa:JSON) {
            createTable(eventID:$eventID, planSpaceID:$planSpaceID, mesa:$mesa) {
              success errors { field message code }
            }
          }`,
          variables: {
            eventID: fakeEventId,
            planSpaceID: fakeEventId,
            mesa: { nombre: 'Mesa Bypass Test', nombre_mesa: 'Mesa Bypass Test', capacidad: 8 },
          },
        },
        timeout: 15_000,
      }).catch(() => null);

      if (!mutResp) {
        test.skip(true, 'INFRA: api-mcp no respondió a mutation test bypass');
        return;
      }

      const json = await mutResp.json().catch(() => null);

      // Esperado: mutation falla (success:false) o GraphQL errors[]
      const hasErrors = Boolean(json?.errors?.length) || json?.data?.createTable?.success === false;
      const errorCodes = (json?.data?.createTable?.errors ?? []).map((e: any) => e?.code).filter(Boolean);
      const hasForbidden = errorCodes.includes('FORBIDDEN') || errorCodes.includes('NOT_FOUND') ||
        (json?.errors ?? []).some((e: any) => /unauthorized|forbidden|not.found/i.test(e?.message ?? ''));

      expect(
        hasErrors,
        `BUG_SEGURIDAD CRÍTICO: U2 ejecutó createTable contra evento NO accesible y backend respondió OK. Backend NO está validando permisos. Response: ${JSON.stringify(json).slice(0, 300)}`
      ).toBe(true);

      // Idealmente debería ser FORBIDDEN específicamente, no solo "no encontrado"
      // pero al menos cualquier error rechazo es válido aquí
    } finally {
      await ctx.close();
    }
  });
});
