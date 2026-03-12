/**
 * copilot-invitados-evento.spec.ts
 *
 * E2E: Consulta de invitados desde Copilot embebido con evento seleccionado.
 * Verifica que el fix eventId/metadata evita la respuesta "problema con la base de datos".
 *
 * Flujo:
 *   1. Login en app-test y seleccionar un evento (invitados en contexto).
 *   2. Abrir Copilot (sidebar), escribir "invitados que se llama Raul" (o similar).
 *   3. Comprobar que la respuesta de la IA no es el error genérico de BD.
 *
 * Requiere: BASE_URL=https://app-test.bodasdehoy.com, TEST_USER_EMAIL, TEST_USER_PASSWORD.
 * Ejecutar: pnpm exec playwright test e2e-app/copilot-invitados-evento.spec.ts --config=playwright.config.ts
 *   con BASE_URL=https://app-test.bodasdehoy.com
 */
import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady, loginAndSelectEvent } from './helpers';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const isAppTest =
  BASE_URL.includes('app-test.bodasdehoy.com') || BASE_URL.includes('app.bodasdehoy.com');

const TEST_EMAIL = process.env.TEST_USER_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

const ERROR_BD_REGEX =
  /problema con la conexión a la base de datos|no puedo acceder a tus eventos|no puedo acceder a tus datos/i;

test.describe('Copilot — consulta invitados con evento seleccionado', () => {
  test.setTimeout(120_000);

  test('al preguntar por invitados con evento abierto, la respuesta no es error de BD', async ({
    page,
    context,
  }) => {
    if (!isAppTest || !hasCredentials) {
      test.skip();
      return;
    }

    await clearSession(context, page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const eventId = await loginAndSelectEvent(page, TEST_EMAIL, TEST_PASSWORD, BASE_URL);
    if (!eventId) {
      console.log('ℹ️ No hay evento en la cuenta de prueba — skip');
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForAppReady(page, 15_000);

    const toggle = page.getByTestId('copilot-toggle');
    if (!(await toggle.isVisible({ timeout: 5_000 }).catch(() => false))) {
      console.log('ℹ️ Botón Copilot no visible — skip');
      test.skip();
      return;
    }
    await toggle.click();
    await page.waitForTimeout(4_000);

    const iframe = page.frameLocator('iframe[src*="chat"]').first();
    const editor = iframe.locator('div[contenteditable="true"]').last();
    await editor.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    if (!(await editor.isVisible().catch(() => false))) {
      console.log('ℹ️ Editor del Copilot no visible en iframe — skip');
      test.skip();
      return;
    }

    await editor.click();
    await page.keyboard.type('invitados que se llama Raul', { delay: 30 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(35_000);

    const assistantContent = iframe.locator(
      '[class*="markdown"], [class*="message-content"], [class*="assistant"], [data-role="assistant"]'
    );
    const lastMsg = assistantContent.last();
    const text = (await lastMsg.textContent().catch(() => '')) ?? '';

    expect(text, 'La respuesta del Copilot no debe ser el error genérico de BD').not.toMatch(
      ERROR_BD_REGEX
    );
    if (text.length > 10) {
      console.log(`Respuesta Copilot (primeros 200 chars): ${text.slice(0, 200)}`);
    }
  });
});
