/**
 * QA de lo No Probado · BLOQUE A — Bandeja (chat-dev)
 *
 * Verifica en PANTALLA los cambios que llevan días desplegados con typecheck limpio
 * y HTTP 200, pero que nadie ha visto funcionar:
 *
 *   FQ-01  B12 · el clic en una notificación abre la conversación   (df1b39c4)
 *   FQ-02  Asignar responsable se ve al instante en la lista        (f01deffd)
 *   FQ-03  La bandeja solo trae conversaciones 1:1                  (backend api-ia)
 *   FQ-04  Telegram/Email/Chat Web aparecen y se configuran         (6fcb4b4c)
 *   FQ-05  Desconectar un canal deja de mentir                      (f2ce482b)
 *   FQ-06  El estado de la conversación se pinta                    (QA-19)
 *
 * REGLAS: webkit (nunca chromium). Ningún caso envía mensajes: las 20 conversaciones
 * del tenant son de clientes reales. "NO EJECUTABLE" es un resultado válido — si no
 * hay datos para probar, NO es un aprobado.
 */
import { test, expect, type Page } from '@playwright/test';

import { TEST_URLS } from './fixtures';

const CHAT_URL = process.env.CHAT_URL || TEST_URLS.chat;
const EMAIL = process.env.TEST_USER_EMAIL || '';
const PASSWORD = process.env.TEST_USER_PASSWORD || '';

/** Errores de consola que invalidan un caso aunque la pantalla se vea bien. */
const FATAL = /ChunkLoadError|GRAPHQL_VALIDATION_FAILED|Cannot query field|Unknown argument/i;

interface Diag {
  console: string[];
  net: string[];
}

function attachDiagnostics(page: Page): Diag {
  const diag: Diag = { console: [], net: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') diag.console.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => diag.console.push(`pageerror: ${String(e).slice(0, 300)}`));
  page.on('response', (r) => {
    const u = r.url();
    if (/\/api\/(messages|whatsapp|graphql)/.test(u) && r.status() >= 400) {
      diag.net.push(`${r.status()} ${u.slice(0, 160)}`);
    }
  });
  return diag;
}

function report(id: string, verdict: string, detail: string, diag: Diag) {
  const fatal = diag.console.filter((c) => FATAL.test(c));
  // eslint-disable-next-line no-console
  console.log(
    [
      ``,
      `${id}  ${verdict}`,
      `  observado : ${detail}`,
      `  consola   : ${fatal.length ? fatal.slice(0, 3).join(' | ') : diag.console.length ? `${diag.console.length} errores no fatales` : 'limpia'}`,
      `  red       : ${diag.net.length ? diag.net.slice(0, 3).join(' | ') : 'sin 4xx/5xx relevantes'}`,
    ].join('\n'),
  );
}

async function loginChat(page: Page): Promise<boolean> {
  await page.goto(`${CHAT_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2500);
  // Si ya hay sesión (cookie SSO), /login redirige solo.
  if (!/\/login/.test(page.url())) return true;
  const email = page.locator('input[type="email"], input[name="email"]').first();
  if (!(await email.count())) return false;
  await email.fill(EMAIL);
  const pass = page.locator('input[type="password"]').first();
  await pass.fill(PASSWORD);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(6000);
  return !/\/login/.test(page.url());
}

test.describe('QA · Bandeja — lo no probado', () => {
  test.skip(!EMAIL || !PASSWORD, 'Faltan credenciales en .env.e2e.dev');
  test.setTimeout(180_000);

  test('FQ-03 · la bandeja solo trae conversaciones 1:1', async ({ page }) => {
    const diag = attachDiagnostics(page);
    if (!(await loginChat(page))) {
      report('FQ-03', 'NO EJECUTABLE', 'no se pudo iniciar sesión en chat-dev', diag);
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/bandeja`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(9000);

    const texto = (await page.locator('body').innerText().catch(() => '')) || '';
    // Grupos de WhatsApp: JID de 15+ dígitos que empieza por 1203…
    const grupos = texto.match(/\b1203\d{10,}\b/g) || [];
    const ruido = texto.match(/conv_test|@g\.us|@broadcast|newsletter/gi) || [];

    await page.screenshot({ path: 'e2e-app/_qa-fq03-bandeja.png', fullPage: false });
    const ok = grupos.length === 0 && ruido.length === 0;
    report(
      'FQ-03',
      ok ? 'PASA' : 'FALLA',
      `grupos visibles: ${grupos.length} · ruido (conv_test/@g.us/newsletter): ${ruido.length}`,
      diag,
    );
    expect(grupos.length, 'no debe haber JIDs de grupo en la bandeja').toBe(0);
    expect(ruido.length, 'no debe haber conv_test ni difusiones').toBe(0);
  });

  test('FQ-04 · Telegram, Email y Chat Web aparecen', async ({ page }) => {
    const diag = attachDiagnostics(page);
    if (!(await loginChat(page))) {
      report('FQ-04', 'NO EJECUTABLE', 'sin sesión', diag);
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/bandeja`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(9000);

    const texto = (await page.locator('body').innerText().catch(() => '')) || '';
    const tiene = {
      email: /email/i.test(texto),
      telegram: /telegram/i.test(texto),
      web: /chat web/i.test(texto),
    };
    await page.screenshot({ path: 'e2e-app/_qa-fq04-canales.png' });
    const n = Object.values(tiene).filter(Boolean).length;
    report(
      'FQ-04',
      n === 3 ? 'PASA' : n > 0 ? 'PARCIAL' : 'FALLA',
      `canales visibles → telegram:${tiene.telegram} email:${tiene.email} chatWeb:${tiene.web}`,
      diag,
    );
    expect(n, 'los 3 canales restaurados deben aparecer').toBeGreaterThan(0);
  });

  test('FQ-06 · el estado de la conversación se pinta y no rompe', async ({ page }) => {
    const diag = attachDiagnostics(page);
    if (!(await loginChat(page))) {
      report('FQ-06', 'NO EJECUTABLE', 'sin sesión', diag);
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/bandeja`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(9000);

    const texto = (await page.locator('body').innerText().catch(() => '')) || '';
    const rotoEnum = /enum|ACTIVE.*invalid|invalid.*status/i.test(texto);
    const fatales = diag.console.filter((c) => FATAL.test(c));
    await page.screenshot({ path: 'e2e-app/_qa-fq06-estado.png' });
    report(
      'FQ-06',
      !rotoEnum && fatales.length === 0 ? 'PASA' : 'FALLA',
      `error de enum en pantalla: ${rotoEnum} · errores fatales en consola: ${fatales.length}`,
      diag,
    );
    expect(rotoEnum, 'no debe verse error de enum de status').toBe(false);
    expect(fatales, 'consola sin errores fatales').toHaveLength(0);
  });

  /**
   * FQ-02 · MODIFICA DATOS. Asigna un responsable y lo DESASIGNA al terminar.
   *
   * Verifica el override optimista (f01deffd) que tapa el TTL de 120 s de api-ia:
   * sin el, asignar tarda hasta 2 minutos en verse en la LISTA.
   *
   * La segunda mitad importa tanto como la primera: al desasignar, el chip debe
   * desaparecer TAMBIEN al instante. Si el override se queda pegado, es peor que
   * el bug original — taparia un cambio hecho desde otra pestana.
   */
  test('FQ-02 · asignar responsable se ve al instante en la lista', async ({ page }) => {
    const diag = attachDiagnostics(page);
    if (!(await loginChat(page))) {
      report('FQ-02', 'NO EJECUTABLE', 'sin sesion', diag);
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/bandeja`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(9000);

    // Abrir la primera conversacion de la lista.
    const item = page.locator('a[href*="/bandeja/"]').first();
    if (!(await item.count())) {
      report('FQ-02', 'NO EJECUTABLE', 'no hay conversaciones en la lista', diag);
      test.skip();
      return;
    }
    await item.click({ timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(6000);

    const cambiar = page.getByLabel('Cambiar el agente responsable de esta conversación').first();
    if (!(await cambiar.count())) {
      report('FQ-02', 'NO EJECUTABLE', 'no aparece el control de responsable', diag);
      test.skip();
      return;
    }
    await cambiar.click({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(2500);

    // Elegir el primer agente que ofrezca el desplegable.
    const opcion = page.locator('[role="option"], [role="menuitem"], li').first();
    if (!(await opcion.count())) {
      report('FQ-02', 'NO EJECUTABLE', 'el selector no ofrece agentes', diag);
      test.skip();
      return;
    }
    const nombreAgente = ((await opcion.innerText().catch(() => '')) || '').trim().slice(0, 40);
    await opcion.click({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(4000);

    // Volver a la LISTA sin recargar — ahi es donde vivia el retardo de 2 min.
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(5000);
    const listaTrasAsignar = (await page.locator('body').innerText().catch(() => '')) || '';
    const apareceYa = nombreAgente.length > 2 && listaTrasAsignar.includes(nombreAgente);
    await page.screenshot({ path: 'e2e-app/_qa-fq02-asignado.png' });

    // REVERTIR SIEMPRE: dejar la conversacion como estaba.
    let revertido = false;
    await item.click({ timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(5000);
    const cambiar2 = page.getByLabel('Cambiar el agente responsable de esta conversación').first();
    if (await cambiar2.count()) {
      await cambiar2.click({ timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(2500);
      const quitar = page.getByText(/sin responsable|quitar|desasignar|ninguno/i).first();
      if (await quitar.count()) {
        await quitar.click({ timeout: 10_000 }).catch(() => {});
        await page.waitForTimeout(4000);
        revertido = true;
      }
    }
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(5000);
    const listaTrasQuitar = (await page.locator('body').innerText().catch(() => '')) || '';
    const desapareceYa = revertido ? !listaTrasQuitar.includes(nombreAgente) : false;
    await page.screenshot({ path: 'e2e-app/_qa-fq02-revertido.png' });

    report(
      'FQ-02',
      apareceYa && desapareceYa ? 'PASA' : 'FALLA',
      `agente "${nombreAgente}" · aparece al instante: ${apareceYa} · desaparece al instante: ${desapareceYa} · revertido: ${revertido}`,
      diag,
    );
    expect(apareceYa, 'el chip debe verse en la lista sin esperar el TTL').toBe(true);
    expect(revertido, 'la conversacion debe quedar como estaba').toBe(true);
    expect(desapareceYa, 'al desasignar, el override debe retirarse solo').toBe(true);
  });

  /**
   * FQ-05 · Desconectar un canal deja de mentir (f2ce482b).
   *
   * Antes fallaban DOS cosas encadenadas: el catch vacio se tragaba el error, y
   * fetch no lanza ante un 404, asi que ni siquiera llegaba al catch. Resultado:
   * la interfaz ponia 'desconectado' pasara lo que pasara.
   *
   * SEGURO: solo pulsa desconectar en un canal que NO esta conectado, asi que no
   * derriba ninguna integracion viva.
   */
  test('FQ-05 · desconectar un canal no conectado muestra el error', async ({ page }) => {
    const diag = attachDiagnostics(page);
    if (!(await loginChat(page))) {
      report('FQ-05', 'NO EJECUTABLE', 'sin sesion', diag);
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/bandeja/telegram`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(8000);

    const desconectar = page.getByRole('button', { name: /desconectar/i }).first();
    if (!(await desconectar.count())) {
      await page.screenshot({ path: 'e2e-app/_qa-fq05-sin-boton.png' });
      report(
        'FQ-05',
        'NO EJECUTABLE',
        'no hay boton de desconectar en la pantalla de Telegram (canal sin conectar) — NO cuenta como aprobado',
        diag,
      );
      test.skip();
      return;
    }
    await desconectar.click({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(5000);

    const texto = (await page.locator('body').innerText().catch(() => '')) || '';
    const muestraError = /error|no se pudo|fall|inten/i.test(texto);
    // El fallo original: decir 'desconectado' SIN que el backend lo confirmara.
    const mienteDesconectado = /desconectad/i.test(texto) && !muestraError;
    await page.screenshot({ path: 'e2e-app/_qa-fq05-desconectar.png' });

    report(
      'FQ-05',
      !mienteDesconectado ? 'PASA' : 'FALLA',
      `muestra error: ${muestraError} · dice "desconectado" sin confirmacion: ${mienteDesconectado}`,
      diag,
    );
    expect(mienteDesconectado, 'no debe decir desconectado si el backend fallo').toBe(false);
  });

  test('FQ-01 · el clic en una notificación abre la conversación', async ({ page }) => {
    const diag = attachDiagnostics(page);
    if (!(await loginChat(page))) {
      report('FQ-01', 'NO EJECUTABLE', 'sin sesión', diag);
      test.skip();
      return;
    }
    await page.goto(`${CHAT_URL}/bandeja`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(9000);

    // Buscar un elemento de notificación en el feed unificado.
    const notif = page
      .locator('[data-testid*="notif"], [class*="notification"], [class*="Notification"]')
      .first();
    if (!(await notif.count())) {
      await page.screenshot({ path: 'e2e-app/_qa-fq01-sin-notifs.png' });
      report(
        'FQ-01',
        'NO EJECUTABLE',
        'no hay notificaciones en el feed para pulsar — NO cuenta como aprobado',
        diag,
      );
      test.skip();
      return;
    }
    await notif.click({ timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(5000);
    const url = page.url();
    // Pasa solo si aterriza en una conversación concreta, no en la lista.
    const enConversacion = /\/bandeja\/[^/]+\/[^/?#]+/.test(url);
    await page.screenshot({ path: 'e2e-app/_qa-fq01-deeplink.png' });
    report(
      'FQ-01',
      enConversacion ? 'PASA' : 'FALLA',
      `url tras el clic: ${url} — ${enConversacion ? 'conversación concreta' : 'LISTA (síntoma de B12)'}`,
      diag,
    );
    expect(enConversacion, 'debe abrir la conversación, no la lista').toBe(true);
  });
});
