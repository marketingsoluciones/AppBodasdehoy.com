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

/** Captura de evidencia. Si falla —la página ocupada con SSE, la máquina cargada— se anota y
 *  se sigue: perder una foto no puede invalidar quince comprobaciones que ya pasaron. */
async function foto(page: Page, ruta: string) {
  try {
    await page.screenshot({ path: ruta, timeout: 15_000 });
  } catch {
    console.log(`[QA] (sin captura: ${ruta})`);
  }
}

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

  // ── 2-bis. La cabecera no se come la lista ────────────────────────────────
  // Owner 17-09: «ocupa mucho espacio, aporta poco valor». Se mide lo que hay entre el
  // borde superior y la primera conversación: eran ~340px para filas de 64.
  const altoCabecera = await page.evaluate(() => {
    const filas = [...document.querySelectorAll('button')].filter((b) =>
      /^Abrir /.test(b.getAttribute('aria-label') || ''),
    );
    if (filas.length === 0) return null;
    const primera = filas[0].getBoundingClientRect();
    return Math.round(primera.top);
  });
  anota('Cabecera de la bandeja contenida (objetivo ≤240px)',
    altoCabecera === null ? null : altoCabecera <= 240, `${altoCabecera ?? '?'}px hasta la 1ª conversación`);

  // ── 2-ter. El panel central dice algo útil ────────────────────────────────
  anota('El panel central orienta en vez de describirse',
    !/Bandeja unificada/.test(textoPagina) &&
      /esperan? respuesta|Todo contestado|Empieza por aquí|Aún no hay conversaciones/i.test(textoPagina),
    /Bandeja unificada/.test(textoPagina) ? 'sigue el cartel "Bandeja unificada"' : 'muestra por dónde empezar');

  anota('No invita a conectar lo que ya está conectado',
    !(/Conectar WhatsApp/i.test(textoPagina) && /esperan? respuesta|Empieza por aquí/i.test(textoPagina)),
    'CTA de conectar solo con la bandeja vacía');

  // ── 3. Chip de visibilidad ────────────────────────────────────────────────
  anota('Chip de conversación compartida visible', /Compartida ·|Equipo\b/.test(textoPagina) ? true : null,
    /Compartida ·|Equipo\b/.test(textoPagina) ? 'encontrado' : 'ninguna conversación compartida todavía (no concluyente)');

  await foto(page, 'test-results/qa-01-bandeja.png');

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
    await foto(page, 'test-results/qa-02-conversacion.png');

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
      await foto(page, 'test-results/qa-05-compartir.png');
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
      await foto(page, 'test-results/qa-03-menu.png');
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

    // ── Rediseño 17-09: salida del canal, acceso y modo de IA por conversación ──
    await page.goto(`${CHAT}/bandeja/wa-bodasdehoy`, { timeout: 90_000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(7000);
    const enCanal = await page.evaluate(() => document.body.innerText);
    // No basta con que el texto esté en el DOM, y tampoco vale con coger el primero: la lista
    // se pinta DOS veces (una copia para móvil, de 0x0, y la de escritorio). Medir sin filtrar
    // por lo que ocupa espacio da "0px" y hace cantar un fallo que no existe — ya ha pasado
    // tres veces en esta auditoría. Se mide el título que de verdad se ve.
    const tituloCanal = await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2')]
        .filter((el) => el.getBoundingClientRect().width > 0)
        .find((el) => /WhatsApp|Chat web|Instagram|Telegram|Messenger|Email/.test(el.textContent || ''));
      return h ? { ancho: Math.round(h.getBoundingClientRect().width), texto: (h.textContent || '').trim() } : null;
    });
    anota('La cabecera dice en qué canal estás y se lee',
      !!tituloCanal && tituloCanal.ancho > 40,
      tituloCanal ? `"${tituloCanal.texto}" · ${tituloCanal.ancho}px` : 'no hay título de canal');
    anota('Hay salida a todos los canales', /Todos los canales/i.test(enCanal));
    // El rótulo "IA por defecto" se quitó (se comía el ancho del título): ahora es el selector
    // con su tooltip, igual que los indicadores de las filas.
    const selectorIa = await page.evaluate(() => {
      const d = [...document.querySelectorAll('div[title*="Modo de IA"]')].filter(
        (el) => el.getBoundingClientRect().width > 0,
      );
      return d.length;
    });
    anota('Modo de IA por defecto de la bandeja, accesible', selectorIa > 0,
      selectorIa > 0 ? 'selector con tooltip en la cabecera' : 'no se encontró el selector');

    // Densidad de la lista POR CANAL: es otro componente que la bandeja, y la auditoría la
    // midió en 95px cuando la bandeja iba a 64. Dos densidades para lo mismo.
    const altoCanal = await page.evaluate(() => {
      const alturas = [...document.querySelectorAll('button')]
        .filter((el) => /^Abrir conversación/.test(el.getAttribute('aria-label') || ''))
        .filter((el) => el.getBoundingClientRect().width > 0)
        .map((el) => Math.round(el.parentElement!.getBoundingClientRect().height))
        .filter((h) => h > 30 && h < 140);
      const cuenta: Record<number, number> = {};
      alturas.forEach((h) => (cuenta[h] = (cuenta[h] || 0) + 1));
      const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0];
      return top ? Number(top[0]) : null;
    });
    anota('Densidad de la lista por canal igual a la de la bandeja (≤70px)',
      altoCanal === null ? null : altoCanal <= 70, `${altoCanal ?? '?'}px`);

    // Rediseño 17-09: el <select> pasó a una pastilla de 18px, y el acceso a 👥 con el
    // número. El de acceso solo sale en conversaciones compartidas (poner un icono apagado
    // en las noventa filas era el ruido que se quitó), así que 0 no es un fallo: es que
    // todavía no hay ninguna compartida.
    const modoIa = await page.locator('button[aria-label*="IA en modo"]').count();
    // Ojo: la lista se pinta dos veces (copia móvil de 0x0 + escritorio). Medir la primera
    // del DOM da 0px y parece un fallo que no existe; ya pasó en la auditoría anterior.
    anota('Indicador de modo de IA en las filas', modoIa > 0, `${modoIa} filas con indicador`);

    const anchoIndicador = await page.evaluate(() => {
      const b = [...document.querySelectorAll('button[aria-label*="IA en modo"]')].find(
        (el) => el.getBoundingClientRect().width > 0,
      );
      return b ? Math.round(b.getBoundingClientRect().width) : null;
    });
    anota('El indicador de IA no come la fila (≤40px)',
      anchoIndicador === null ? null : anchoIndicador <= 40, `${anchoIndicador ?? '?'}px`);

    const gestionAcceso = await page.locator('button[aria-label*="Compartida"]').count();
    anota('Indicador de acceso en las compartidas', gestionAcceso > 0 ? true : null,
      gestionAcceso > 0 ? `${gestionAcceso} filas` : 'ninguna conversación compartida (no concluyente)');

    const volverCanales = page.locator('button').filter({ hasText: /Todos los canales/i }).first();
    if (await volverCanales.count()) {
      await volverCanales.click();
      await page.waitForTimeout(4000);
      anota('"Todos los canales" devuelve a la bandeja', /\/bandeja\/?$/.test(page.url()), page.url().replace(CHAT, ''));
    }
    await foto(page, 'test-results/qa-06-canal.png');

  // ── 6. Integraciones: equipo con acceso ───────────────────────────────────
  await page.goto(`${CHAT}/settings/integrations`, { timeout: 90_000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(7000);
  const textoInt = await page.evaluate(() => document.body.innerText);
  anota('Sección de canales WhatsApp visible', /Canales WhatsApp|WhatsApp/i.test(textoInt));
  anota('Panel "Equipo con acceso" por número', /Equipo con acceso/i.test(textoInt),
    /Equipo con acceso/i.test(textoInt) ? 'presente' : 'no aparece (puede ser el gate de rol)');
  await foto(page, 'test-results/qa-04-integraciones.png');

  // ── Resumen ───────────────────────────────────────────────────────────────
  const ko = R.filter((r) => r.ok === false);
  const nc = R.filter((r) => r.ok === null);
  console.log(`\n[QA] RESUMEN: ${R.filter((r) => r.ok === true).length} OK · ${ko.length} KO · ${nc.length} no concluyentes`);
  ko.forEach((r) => console.log(`[QA] KO → ${r.punto}${r.dato ? ` (${r.dato})` : ''}`));
  nc.forEach((r) => console.log(`[QA] ?? → ${r.punto}${r.dato ? ` (${r.dato})` : ''}`));
});
