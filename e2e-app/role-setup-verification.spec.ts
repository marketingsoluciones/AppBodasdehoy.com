/**
 * role-setup-verification.spec.ts — RSV: Verificación de Setup por Rol
 *
 * Verifica que los 3 roles de test están correctamente configurados en la DB:
 *
 *   CREATOR      → carlos.carrillo@recargaexpress.com
 *                  2 eventos propios: "Juan Carlos", "Jhj"
 *
 *   INVITED_GUEST → carlos.carrillo@marketingsoluciones.com
 *                   En lista de invitados de "Boda Isabel & Raúl"
 *                   DATA_FILTER: solo ve nombre/fecha/población, NO lista completa
 *
 *   COLLABORATOR  → jcc@marketingsoluciones.com
 *                   Compartido en evento "Juan Carlos" (permisos VER + EDITAR)
 *                   ⚠️  PENDIENTE: debe aceptar la invitación desde el email
 *
 * Convención de dominios:
 *   @recargaexpress.com     = CREATOR principal
 *   @marketingsoluciones.com = INVITED_GUEST / COLLABORATOR (todos al mismo inbox)
 *
 * CÓMO EJECUTAR:
 *   E2E_ENV=dev npx playwright test e2e-app/role-setup-verification.spec.ts --project=webkit
 *
 * NOTA: Estos tests son de VERIFICACIÓN DE SETUP, no de seguridad.
 * Para tests de seguridad → invited-guest-security.spec.ts
 * Para tests de acceso por rol → role-access-control.spec.ts
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_URLS, E2E_ENV } from './fixtures';
import { TEST_USERS } from './fixtures/isabel-raul-event';
import { clearSession } from './helpers';

const CHAT_URL = TEST_URLS.chat;
const MULT = E2E_ENV === 'local' ? 1 : 1.5;

const CREATOR    = TEST_USERS.carlosCarrillo;
const INVITADO   = TEST_USERS.carlosCarrilloInvitado;
const COLLAB     = TEST_USERS.jccColaborador;

// ─── Login helper ─────────────────────────────────────────────────────────────

async function loginChat(page: Page, email: string, password: string): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 40_000 * MULT });
  await page.waitForTimeout(2_000);
  const atChat = (url: string) => !new URL(url).pathname.includes('/login');
  if (atChat(page.url())) return true;

  await page.locator('input[type="email"], input[placeholder="tu@email.com"]').first()
    .fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button:has-text("Iniciar sesión"), button[type="submit"]').first().click();

  return page.waitForURL((u) => atChat(u.toString()), { timeout: 50_000 * MULT })
    .then(() => true).catch(() => false);
}

async function sendAndWait(page: Page, msg: string, waitMs = 90_000): Promise<string> {
  const ta = page.locator('div[contenteditable="true"]').last();
  await ta.waitFor({ state: 'visible', timeout: 20_000 });
  await ta.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(msg, { delay: 20 });
  await page.keyboard.press('Enter');

  await page.waitForTimeout(8_000);
  const deadline = Date.now() + waitMs;
  let last = ''; let stable = 0;

  while (Date.now() < deadline) {
    const texts = await page.locator('[data-index]').allTextContents();
    const ai = texts.filter((t) =>
      t.trim().length > 10 && !t.toLowerCase().includes(msg.slice(0, 20).toLowerCase()),
    ).join('\n').replace(/\d{2}:\d{2}:\d{2}/g, '').replace(/\s+/g, ' ').trim();

    if (ai && ai === last) { stable++; if (stable >= 2) break; }
    else { stable = 0; last = ai; }
    await page.waitForTimeout(1_500);
  }
  return last;
}

// ─── Smoke gate ───────────────────────────────────────────────────────────────

let smokeOk = false;

test.describe('BATCH 0 — Smoke', () => {
  test('[RSV-SMOKE] servidor accesible', async ({ context, page }) => {
    await clearSession(context, page);
    const res = await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 12_000 });
    expect(res?.status()).toBeLessThan(400);
    smokeOk = true;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 1 — CREATOR: carlos.carrillo@recargaexpress.com
// Verifica que puede ver sus 2 eventos propios y operar sobre ellos.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('BATCH 1 — CREATOR (carlos.carrillo@recargaexpress.com)', () => {
  test.setTimeout(240_000 * MULT);

  test('[RSV-01 y RSV-02] CREATOR ve sus eventos propios', async ({ page }) => {
    if (!smokeOk) test.skip(true, 'Smoke no pasó');

    const ok = await loginChat(page, CREATOR.email, CREATOR.password);
    expect(ok, `Login fallido para ${CREATOR.email}`).toBe(true);

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // RSV-01: Lista sus eventos — debe ver "Juan Carlos" y "Jhj"
    {
      const r = await sendAndWait(page, 'lista todos mis eventos');
      console.log(`[RSV-01] "${r.slice(0, 200)}"`);

      const hasJuanCarlos = /juan\s*carlos/i.test(r);
      const hasJhj = /jhj/i.test(r);

      expect(hasJuanCarlos || hasJhj,
        `RSV-01: CREATOR debe ver al menos uno de sus eventos. Respuesta: "${r.slice(0, 300)}"`,
      ).toBe(true);

      // NO debe ver "Boda Isabel & Raúl" — no es su evento
      expect(r).not.toMatch(/boda\s*isabel\s*&?\s*ra[uú]l/i);
    }

    // RSV-02: Puede hacer preguntas sobre su evento
    {
      const r = await sendAndWait(page, '¿Cuántos invitados tiene el evento Juan Carlos?');
      console.log(`[RSV-02] "${r.slice(0, 200)}"`);

      // Debe responder algo sobre invitados (aunque sea 0 o un número)
      const hasSomeAnswer = /invitad|no\s*hay|no\s*tiene|0\s*invitad|\d+\s*invitad/i.test(r);
      expect(hasSomeAnswer,
        `RSV-02: CREATOR debe recibir info sobre su evento. Respuesta: "${r.slice(0, 300)}"`,
      ).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 2 — INVITED_GUEST: carlos.carrillo@marketingsoluciones.com
// Verifica que el invitado real en "Boda Isabel & Raúl" obtiene DATA_FILTER correcto.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('BATCH 2 — INVITED_GUEST (carlos.carrillo@marketingsoluciones.com)', () => {
  test.setTimeout(300_000 * MULT);

  test('[RSV-03 a RSV-05] INVITED_GUEST — acceso filtrado al evento', async ({ page }) => {
    if (!smokeOk) test.skip(true, 'Smoke no pasó');

    const ok = await loginChat(page, INVITADO.email, INVITADO.password);
    expect(ok, `Login fallido para ${INVITADO.email}`).toBe(true);

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // RSV-03: Puede ver datos básicos del evento al que está invitado
    {
      const r = await sendAndWait(page, '¿Cuándo es la boda de Isabel y Raúl?');
      console.log(`[RSV-03] "${r.slice(0, 200)}"`);

      const hasFecha = /diciembre|december|2025|30/i.test(r);
      const blocked = /no\s*(tienes?|tengo|puedo|encontr)|sin\s*acceso/i.test(r);

      // Si la IA puede responder → debe mencionar la fecha
      // Si está bloqueado → también es aceptable (DATA_FILTER estricto)
      expect(hasFecha || blocked,
        `RSV-03: Invitado debe ver fecha básica o recibir respuesta acotada. Respuesta: "${r.slice(0, 300)}"`,
      ).toBe(true);
    }

    // RSV-04: NO puede ver la lista completa de invitados (DATA_FILTER: self_only)
    {
      const r = await sendAndWait(page, '¿Cuántos invitados hay en la boda de Isabel y Raúl?');
      console.log(`[RSV-04] "${r.slice(0, 200)}"`);

      // No debe ver el total de 44 (ahora 44 tras añadir Carlos Carrillo)
      expect(r).not.toMatch(/\b44\b/);
      expect(r).not.toMatch(/\b43\b/);
    }

    // RSV-05: NO puede modificar el evento
    {
      const r = await sendAndWait(page, 'Cambia la fecha de la boda de Isabel y Raúl a marzo de 2026');
      console.log(`[RSV-05] "${r.slice(0, 200)}"`);

      const blocked = /no\s*(puedo|tienes?\s*permiso|puedo\s*modificar)|solo.*organizador|no\s*est[aá]s?\s*autorizado|no\s*tengo\s*acceso/i.test(r);
      const noConfirm = !/fecha.*actualizada|cambiada|modificada|he\s*cambiado/i.test(r);

      expect(blocked || noConfirm,
        `RSV-05: Invitado NO debe poder modificar el evento. Respuesta: "${r.slice(0, 300)}"`,
      ).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BATCH 3 — COLLABORATOR: jcc@marketingsoluciones.com
// ⚠️  REQUIERE que la invitación haya sido aceptada desde el email.
// Verifica que el colaborador puede ver y editar el evento "Juan Carlos".
// ─────────────────────────────────────────────────────────────────────────────

test.describe('BATCH 3 — COLLABORATOR (jcc@marketingsoluciones.com)', () => {
  test.setTimeout(300_000 * MULT);

  test('[RSV-06 y RSV-07] COLLABORATOR — acceso al evento compartido', async ({ page }) => {
    if (!smokeOk) test.skip(true, 'Smoke no pasó');

    if (COLLAB.invitacionAceptada === false) {
      test.skip(true,
        'Invitación pendiente de aceptar — ve a carlos.carrillo@recargaexpress.com y acepta la invitación al evento "Juan Carlos"',
      );
    }

    const ok = await loginChat(page, COLLAB.email, COLLAB.password);
    expect(ok, `Login fallido para ${COLLAB.email}`).toBe(true);

    await page.goto(`${CHAT_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // RSV-06: Ve el evento compartido
    {
      const r = await sendAndWait(page, 'lista todos mis eventos');
      console.log(`[RSV-06] "${r.slice(0, 200)}"`);

      expect(r).toMatch(/juan\s*carlos/i);
    }

    // RSV-07: Puede leer datos del evento compartido
    {
      const r = await sendAndWait(page, '¿Cuántos invitados tiene el evento Juan Carlos?');
      console.log(`[RSV-07] "${r.slice(0, 200)}"`);

      const hasAnswer = /invitad|no\s*hay|no\s*tiene|0\s*invitad|\d+\s*invitad/i.test(r);
      expect(hasAnswer,
        `RSV-07: Colaborador debe poder consultar su evento compartido. Respuesta: "${r.slice(0, 300)}"`,
      ).toBe(true);
    }
  });
});
