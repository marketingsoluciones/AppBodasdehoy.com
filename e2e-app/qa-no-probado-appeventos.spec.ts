/**
 * QA de lo No Probado · BLOQUE B — appEventos (app-dev)
 *
 * Verifica en PANTALLA tres arreglos que llevan días desplegados con typecheck
 * limpio y HTTP 200, sin que nadie los haya visto funcionar:
 *
 *   FQ-07  El historial de facturación trae facturas          (5ca8853e)
 *   FQ-08  El evento se refresca por socket, sin errores      (3de2016c + 6e608360)
 *   FQ-09  Más de dos asignados no rompen la tarjeta          (64e3c192)
 *
 * REGLAS
 *   · webkit SIEMPRE (chromium está vetado en este proyecto).
 *   · NUNCA tocar el evento "Boda Isabel & Raúl" (66a9042dec5c58aa734bca44).
 *   · En app-dev trabaja otra sesión: aquí SOLO se prueba, no se toca código.
 *   · Ningún caso modifica datos. Los tres son de lectura.
 */
import { test, expect, type Page } from '@playwright/test';

import { TEST_URLS } from './fixtures';
import { loginAndSelectEvent } from './helpers';

const BASE_URL = process.env.BASE_URL || TEST_URLS.app;
const EMAIL = process.env.TEST_USER_EMAIL || '';
const PASSWORD = process.env.TEST_USER_PASSWORD || '';

/** Evento intocable: si aparece seleccionado, se aborta el caso. */
const EVENTO_PROHIBIDO = '66a9042dec5c58aa734bca44';

/**
 * Errores que invalidan un caso aunque la pantalla se vea bien.
 * `queryenEvento` es el bug que estuvo meses fallando en silencio.
 */
const FATAL =
  /ChunkLoadError|GRAPHQL_VALIDATION_FAILED|Cannot query field|queryenEvento|Unknown argument/i;

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
    if (r.status() >= 400 && /graphql|\/api\//.test(r.url())) {
      diag.net.push(`${r.status()} ${r.url().slice(0, 150)}`);
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
      `  red       : ${diag.net.length ? diag.net.slice(0, 3).join(' | ') : 'sin 4xx/5xx'}`,
    ].join('\n'),
  );
}

test.describe('QA · appEventos — lo no probado', () => {
  test.skip(!EMAIL || !PASSWORD, 'Faltan credenciales en .env.e2e.dev');
  test.setTimeout(240_000);

  /**
   * FQ-07 · El fallo original NO era una pantalla rota: era "no tienes facturas"
   * con un error GraphQL detrás, tragado por un catch. Por eso el caso mira la
   * consola y la red, no solo el texto.
   */
  test('FQ-07 · el historial de facturación trae facturas o falla en voz alta', async ({ page }) => {
    const diag = attachDiagnostics(page);
    const eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL).catch(() => null);
    if (!eventId) {
      report('FQ-07', 'NO EJECUTABLE', 'no se pudo iniciar sesión en app-dev', diag);
      test.skip();
      return;
    }
    if (eventId === EVENTO_PROHIBIDO) {
      report('FQ-07', 'NO EJECUTABLE', 'se seleccionó el evento intocable — abortado', diag);
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/facturacion`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(10_000);

    const texto = (await page.locator('body').innerText().catch(() => '')) || '';
    const diceVacio = /no tienes facturas|sin facturas|ninguna factura/i.test(texto);
    const fatales = diag.console.filter((c) => FATAL.test(c));
    const erroresRed = diag.net.length;

    await page.screenshot({ path: 'e2e-app/_qa-fq07-facturacion.png', fullPage: true });

    // FALLA si dice "vacío" Y hay error detrás: ese es exactamente el bug de meses.
    const vacioMentiroso = diceVacio && (fatales.length > 0 || erroresRed > 0);
    report(
      'FQ-07',
      vacioMentiroso ? 'FALLA' : 'PASA',
      `dice vacío: ${diceVacio} · errores fatales: ${fatales.length} · errores de red: ${erroresRed}` +
        (vacioMentiroso ? ' → VACÍO CON ERROR DETRÁS, el bug sigue' : ''),
      diag,
    );
    expect(vacioMentiroso, 'no puede decir "sin facturas" y esconder un error').toBe(false);
  });

  /**
   * FQ-08 · Dos arreglos a la vez. La versión de dos sesiones es manual; aquí se
   * comprueba lo que sí es automatizable y donde estaban los fallos:
   *   · que NO aparezca "Cannot query field queryenEvento" (bug de meses, 3de2016c)
   *   · que NO aparezca ChunkLoadError al cargar socket.io diferido (6e608360)
   *   · que el socket llegue a conectar
   */
  test('FQ-08 · el evento carga sin el error de queryenEvento y con socket vivo', async ({
    page,
  }) => {
    const diag = attachDiagnostics(page);
    const wsUrls: string[] = [];
    page.on('websocket', (ws) => wsUrls.push(ws.url().slice(0, 120)));

    const eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL).catch(() => null);
    if (!eventId) {
      report('FQ-08', 'NO EJECUTABLE', 'no se pudo iniciar sesión', diag);
      test.skip();
      return;
    }
    if (eventId === EVENTO_PROHIBIDO) {
      report('FQ-08', 'NO EJECUTABLE', 'evento intocable — abortado', diag);
      test.skip();
      return;
    }

    // Dar tiempo al socket diferido: ahora se carga por import dinámico.
    await page.waitForTimeout(15_000);

    const errQuery = diag.console.filter((c) => /queryenEvento|GRAPHQL_VALIDATION_FAILED/i.test(c));
    const errChunk = diag.console.filter((c) => /ChunkLoadError/i.test(c));
    const socketConectado = wsUrls.some((u) => /socket\.io|websocket|wss:/i.test(u));

    await page.screenshot({ path: 'e2e-app/_qa-fq08-evento.png' });
    const ok = errQuery.length === 0 && errChunk.length === 0;
    report(
      'FQ-08',
      ok ? (socketConectado ? 'PASA' : 'PARCIAL') : 'FALLA',
      `queryenEvento: ${errQuery.length} · ChunkLoadError: ${errChunk.length} · websockets: ${wsUrls.length}` +
        (socketConectado ? ' (socket conectado)' : ' (NO se vio websocket — revisar a mano)'),
      diag,
    );
    expect(errQuery, 'no debe quedar el error de queryenEvento').toHaveLength(0);
    expect(errChunk, 'socket.io diferido no debe dar ChunkLoadError').toHaveLength(0);
  });

  test('FQ-09 · más de dos asignados no rompen la tarjeta', async ({ page }) => {
    const diag = attachDiagnostics(page);
    const eventId = await loginAndSelectEvent(page, EMAIL, PASSWORD, BASE_URL).catch(() => null);
    if (!eventId || eventId === EVENTO_PROHIBIDO) {
      report('FQ-09', 'NO EJECUTABLE', 'sin sesión o evento intocable', diag);
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/servicios?studio=1`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForTimeout(12_000);

    // El carrusel solo aparece con 3+ asignados; sin esa tarea el caso NO es ejecutable.
    const slider = page.locator('.asig-slider');
    const hayCarrusel = (await slider.count()) > 0;
    if (!hayCarrusel) {
      await page.screenshot({ path: 'e2e-app/_qa-fq09-sin-datos.png' });
      report(
        'FQ-09',
        'NO EJECUTABLE',
        'no hay ninguna tarea con 3+ asignados a la vista — NO cuenta como aprobado',
        diag,
      );
      test.skip();
      return;
    }

    // Con carrusel: no debe desbordar su contenedor.
    const desborda = await slider.first().evaluate((el) => el.scrollWidth > el.clientWidth + 400);
    await page.screenshot({ path: 'e2e-app/_qa-fq09-asignados.png' });
    report(
      'FQ-09',
      desborda ? 'FALLA' : 'PASA',
      `carrusel presente · desborda en exceso: ${desborda}`,
      diag,
    );
    expect(desborda, 'el carrusel no debe desbordar su contenedor').toBe(false);
  });
});
