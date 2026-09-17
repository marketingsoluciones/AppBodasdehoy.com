import { test, expect, type Page } from '@playwright/test';

/**
 * QA de usabilidad de la bandeja — comprueba en vivo, contra chat-dev, cada mejora de las
 * últimas 48 h, midiendo en vez de suponiendo. Incluye la navegación entre subopciones
 * (entrar en una conversación y volver), que es donde el owner dice que se pierde.
 *
 * No modifica datos: solo navega, mide y lee. No abre conversaciones de "Boda Isabel & Raúl".
 */

const CHAT = (process.env.CHAT_URL || 'https://chat-dev.bodasdehoy.com').replace(/\/$/, '');
const EMAIL = process.env.TEST_USER_EMAIL || '';
const PASS = process.env.TEST_USER_PASSWORD || '';

const R: Array<{ dato?: string; ok: boolean | null; punto: string }> = [];
const anota = (punto: string, ok: boolean | null, dato?: string) => {
  R.push({ dato, ok, punto });
  const marca = ok === null ? '–' : ok ? 'OK' : 'KO';
  console.log(`[QA] ${marca.padEnd(3)} ${punto}${dato ? ` · ${dato}` : ''}`);
};

async function login(page: Page) {
  await page.goto(`${CHAT}/login`, { timeout: 90_000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const email = page.locator('input[type="email"], input[placeholder="tu@email.com"]').first();
  await email.waitFor({ timeout: 30_000 });
  await email.fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.locator('button').filter({ hasText: /iniciar sesión/i }).first().click();
  await page.waitForTimeout(9000);
}

test('QA bandeja — usabilidad y navegación', async ({ page }) => {
  test.setTimeout(420_000);
  expect(EMAIL, 'falta TEST_USER_EMAIL').toBeTruthy();

  await login(page);
  await page.goto(`${CHAT}/bandeja`, { timeout: 90_000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);

  const urlTrasLogin = page.url();
  anota('Entra en la bandeja autenticado', !/\/login/.test(urlTrasLogin), urlTrasLogin.replace(CHAT, ''));

  // ── 1. Filas: ¿cuántas conversaciones caben? ──────────────────────────────
  const filas = page.locator('button, [role="button"]').filter({ hasText: /.{3,}/ });
  const alturas = await page.evaluate(() => {
    const candidatas = [...document.querySelectorAll('button, a')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height > 30 && r.height < 140 && r.width > 200;
      })
      .map((el) => Math.round(el.getBoundingClientRect().height));
    // la altura más repetida es la de la fila de conversación
    const cuenta: Record<number, number> = {};
    candidatas.forEach((h) => (cuenta[h] = (cuenta[h] || 0) + 1));
    const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0];
    return { alturaFila: top ? Number(top[0]) : null, repeticiones: top ? top[1] : 0 };
  });
  anota(
    'Fila de conversación compacta (objetivo ≤70px)',
    alturas.alturaFila === null ? null : alturas.alturaFila <= 70,
    `${alturas.alturaFila ?? '?'}px · ${alturas.repeticiones} filas visibles`,
  );

  // ── 2. Filtros: nombre completo y en una sola fila ────────────────────────
  const textoPagina = await page.evaluate(() => document.body.innerText);
  anota('Filtros con nombre de canal completo', /WhatsApp/i.test(textoPagina) && !/\bWA\b\s*$/m.test(textoPagina), 'busca "WhatsApp" en vez de "WA"');

  const filtrosAlto = await page.evaluate(() => {
    const cont = [...document.querySelectorAll('div')].find((d) =>
      /Todo|Todos/.test(d.textContent || '') && d.querySelectorAll('button').length >= 3 && d.getBoundingClientRect().height < 120,
    );
    return cont ? Math.round(cont.getBoundingClientRect().height) : null;
  });
  anota('Barra de filtros en una línea (objetivo ≤48px)', filtrosAlto === null ? null : filtrosAlto <= 48, `${filtrosAlto ?? '?'}px`);

  // ── 3. Chip de visibilidad ────────────────────────────────────────────────
  anota('Chip de conversación compartida visible', /Compartida ·|Equipo\b/.test(textoPagina) ? true : null,
    /Compartida ·|Equipo\b/.test(textoPagina) ? 'encontrado' : 'ninguna conversación compartida todavía (no concluyente)');

  await page.screenshot({ path: 'test-results/qa-01-bandeja.png', fullPage: false });

  // ── 4. Entrar en una conversación (subopción) ─────────────────────────────
  // Una FILA de conversación, no una pestaña: alto de fila y por debajo de la cabecera.
  const cajaFila = await page.evaluate(() => {
    const fila = [...document.querySelectorAll('button')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height >= 50 && r.height <= 90 && r.width > 250 && r.top > 150)
      .sort((a, b) => a.r.top - b.r.top)[0];
    if (!fila) return null;
    return { texto: (fila.el.textContent || '').slice(0, 40), x: fila.r.x + 20, y: fila.r.y + fila.r.height / 2 };
  });
  const hayConversaciones = cajaFila !== null;
  anota('Hay conversaciones en la bandeja', hayConversaciones, cajaFila ? `primera: ${cajaFila.texto}` : 'ninguna fila');

  if (hayConversaciones && cajaFila) {
    const urlAntes = page.url();
    await page.mouse.click(cajaFila.x, cajaFila.y);
    await page.waitForTimeout(6000);
    const urlDetalle = page.url();
    anota('Al pulsar una conversación entra en su detalle', urlDetalle !== urlAntes, urlDetalle.replace(CHAT, ''));

    const textoDetalle = await page.evaluate(() => document.body.innerText);
    anota('Botón "Compartir" en la conversación', /Compartir/i.test(textoDetalle));
    anota('Resumen del asistente disponible', /Resumir|Resumen/i.test(textoDetalle));
    await page.screenshot({ path: 'test-results/qa-02-conversacion.png' });

    // El panel de compartir: que abra y que el buscador encuentre gente. NO comparte nada:
    // comprobar que la búsqueda responde ya valida la parte frágil (searchUsers del backend).
    const cajaCompartir = await page.evaluate(() => {
      const el = [...document.querySelectorAll('button')]
        .filter((b) => /compartir/i.test(b.textContent || ''))
        .map((b) => ({ b, r: b.getBoundingClientRect() }))
        .find(({ r }) => r.width > 0 && r.height > 0);
      return el ? { x: el.r.x + el.r.width / 2, y: el.r.y + el.r.height / 2 } : null;
    });
    if (cajaCompartir) {
      await page.mouse.click(cajaCompartir.x, cajaCompartir.y);
      await page.waitForTimeout(2500);
      const panel = await page.evaluate(() => document.body.innerText);
      anota('El panel de compartir se abre', /Compartir conversación|Con acceso|Solo ver/i.test(panel));
      const buscador = page.locator('input[placeholder*="Buscar persona"]').first();
      if (await buscador.count()) {
        await buscador.fill('jc');
        await page.waitForTimeout(4000);
        const tras = await page.evaluate(() => document.body.innerText);
        const hayResultados = !/Sin resultados/i.test(tras);
        anota('El buscador de personas devuelve gente', hayResultados,
          hayResultados ? 'searchUsers responde' : 'searchUsers no encuentra usuarios de la marca (backend)');
      } else {
        anota('El buscador de personas existe', false, 'no se encontró el campo');
      }
      await page.screenshot({ path: 'test-results/qa-05-compartir.png' });
      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(1000);
    } else {
      anota('El panel de compartir se abre', false, 'no se encontró el botón visible');
    }

    // menú de tres puntos → bloquear
    // OJO: la cabecera pinta el botón de móvil y el de escritorio a la vez; el oculto mide
    // 0x0 y Playwright lo encuentra igual. Pulsar el primero daba falsos negativos.
    const cajaMenu = await page.evaluate(() => {
      const el = [...document.querySelectorAll('button')]
        .filter((b) => /opciones/i.test(b.getAttribute('aria-label') || b.getAttribute('title') || ''))
        .map((b) => ({ b, r: b.getBoundingClientRect() }))
        .find(({ r }) => r.width > 0 && r.height > 0);
      return el ? { x: el.r.x + el.r.width / 2, y: el.r.y + el.r.height / 2 } : null;
    });
    if (cajaMenu) {
      await page.mouse.click(cajaMenu.x, cajaMenu.y);
      await page.waitForTimeout(1500);
      const textoMenu = await page.evaluate(() => document.body.innerText);
      anota('Opción "Bloquear contacto" en el menú', /Bloquear contacto/i.test(textoMenu));
      await page.screenshot({ path: 'test-results/qa-03-menu.png' });
      await page.keyboard.press('Escape').catch(() => undefined);
    } else {
      anota('Opción "Bloquear contacto" en el menú', null, 'no se encontró el menú de tres puntos');
    }

    // ── 5. Volver atrás: el punto que falla según el owner ──────────────────
    const cajaVolver = await page.evaluate(() => {
      const el = [...document.querySelectorAll('button[aria-label="Volver a la bandeja"]')]
        .map((b) => ({ b, r: b.getBoundingClientRect() }))
        .find(({ r }) => r.width > 0 && r.height > 0);
      return el ? { x: el.r.x + el.r.width / 2, y: el.r.y + el.r.height / 2 } : null;
    });
    if (cajaVolver) {
      await page.mouse.click(cajaVolver.x, cajaVolver.y);
      await page.waitForTimeout(4000);
      anota('Botón "volver" devuelve a la bandeja', /\/bandeja\/?$/.test(page.url()), page.url().replace(CHAT, ''));
    } else {
      anota('Botón "volver" visible en la conversación', false, 'no existe en esta vista');
    }

    // volver con el navegador
    await page.goto(urlDetalle, { timeout: 60_000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.goBack({ timeout: 30_000 }).catch(() => undefined);
    await page.waitForTimeout(4000);
    anota('Atrás del navegador vuelve a la bandeja', /\/bandeja/.test(page.url()), page.url().replace(CHAT, ''));

    await page.goForward({ timeout: 30_000 }).catch(() => undefined);
    await page.waitForTimeout(4000);
    anota('Adelante del navegador vuelve al detalle', !/\/bandeja\/?$/.test(page.url()), page.url().replace(CHAT, ''));
  }

  // ── 6. Integraciones: equipo con acceso ───────────────────────────────────
  await page.goto(`${CHAT}/settings/integrations`, { timeout: 90_000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  const textoInt = await page.evaluate(() => document.body.innerText);
  anota('Sección de canales WhatsApp visible', /Canales WhatsApp|WhatsApp/i.test(textoInt));
  anota('Panel "Equipo con acceso" por número', /Equipo con acceso/i.test(textoInt),
    /Equipo con acceso/i.test(textoInt) ? 'presente' : 'no aparece (puede ser el gate de rol)');
  await page.screenshot({ path: 'test-results/qa-04-integraciones.png' });

  // ── Resumen ───────────────────────────────────────────────────────────────
  const ko = R.filter((r) => r.ok === false);
  const nc = R.filter((r) => r.ok === null);
  console.log(`\n[QA] RESUMEN: ${R.filter((r) => r.ok === true).length} OK · ${ko.length} KO · ${nc.length} no concluyentes`);
  ko.forEach((r) => console.log(`[QA] KO → ${r.punto}${r.dato ? ` (${r.dato})` : ''}`));
  nc.forEach((r) => console.log(`[QA] ?? → ${r.punto}${r.dato ? ` (${r.dato})` : ''}`));
});
