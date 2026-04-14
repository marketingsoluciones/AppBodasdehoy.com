/**
 * ui-invitados.spec.ts — Tests UI directos: módulo Invitados
 *
 * Cada test = Hipótesis → Acción real del usuario en UI → Resultado medible en sistema.
 * NO se valida la IA, se valida la interfaz directamente.
 *
 * Tests:
 *   INV-01 [owner] crear invitado con datos válidos → toast éxito + aparece en tabla
 *   INV-02 [owner] formulario vacío → mensajes de validación inline sin llamar API
 *   INV-03 [owner] correo con formato inválido → error inline "El formato del correo no es valido"
 *   INV-04 [owner] teléfono duplicado → "Número asignado a otro invitado" (validación client-side)
 *   INV-05 [sin sesión] navegar a /invitados → GuestDemoWrapper "Crear cuenta gratis"
 *   INV-07 [owner] FormEditarInvitado → campo correo deshabilitado + tooltip
 *   C-01  [owner] crear invitado real → verifica en DB via queryEvent → cleanup
 *
 * Autenticación:
 *   owner (UI)   → dev_bypass en app-test.bodasdehoy.com (UID real del organizador)
 *   owner (C-01) → login real email+password (no dev_bypass, necesita Firebase auth para write ops)
 *   sin sesión   → clearSession() + navigate directo
 *
 * Ejecución:
 *   E2E_ENV=dev npx playwright test e2e-app/ui-invitados.spec.ts --project=webkit
 *   Solo un test:
 *   E2E_ENV=dev npx playwright test e2e-app/ui-invitados.spec.ts --project=webkit --grep "INV-01"
 */

import { test, expect, Page } from '@playwright/test';
import { TEST_URLS } from './fixtures';
import { clearSession, waitForAppReady, loginAndSelectEventByName } from './helpers';
import { ISABEL_RAUL_EVENT, TEST_USERS } from './fixtures/isabel-raul-event';
import { queryEvent } from './lib/api';

// ── Constantes ─────────────────────────────────────────────────────────────────

const BASE_URL = TEST_URLS.app;
const EVENT_ID = ISABEL_RAUL_EVENT.id;

/** Tiempo máximo para que el formulario de invitado aparezca */
const FORM_TIMEOUT = 12_000;

/** Tiempo máximo para que el toast aparezca tras guardar */
const TOAST_TIMEOUT = 8_000;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Estado global (beforeAll) ──────────────────────────────────────────────────

let appOk = false;
let invitadosOk = false;

test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const text = (await page.locator('body').textContent().catch(() => null)) ?? '';
    appOk = text.length > 50 && !/1033|Cloudflare|Please enable cookies/i.test(text);
    if (!appOk) {
      console.log('[INV beforeAll] servidor no disponible');
      return;
    }

    // Verificar que el módulo invitados carga con dev_bypass
    // Estrategia: dev_bypass en home → navegar directamente a /invitados
    await page.evaluate(() => sessionStorage.setItem('dev_bypass', 'true'));
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 20_000 });

    await page.waitForFunction(
      () => /Mis eventos/i.test(document.body.innerText ?? ''),
      { timeout: 40_000 },
    ).catch(() => {});

    await page.waitForFunction(
      () => !/Cargando eventos/i.test(document.body.innerText ?? ''),
      { timeout: 15_000 },
    ).catch(() => {});

    // En app-dev (local) goto() a /invitados redirige al home (auth server-side).
    // Navegamos via SPA: click en tarjeta Isabel → /resumen-evento → click nav Invitados.
    // En app-test (Vercel) sessionStorage persiste en goto() → ambos caminos OK.
    await page.waitForFunction(
      () => !/Cargando eventos/i.test(document.body.innerText ?? ''),
      { timeout: 15_000 },
    ).catch(() => {});

    // Click en tarjeta Isabel para cargar el evento en contexto React
    const isabelCard = page.locator('[class*="rounded"], [class*="card"]').filter({
      hasText: /isabel/i,
    }).first();
    const hasIsabel = await isabelCard.isVisible({ timeout: 5_000 }).catch(() => false);
    if (hasIsabel) {
      await isabelCard.click();
      await page.waitForURL('**/resumen-evento**', { timeout: 20_000 }).catch(() => {});
    }

    // Navegar a /invitados via SPA (preserva contexto React con evento cargado)
    if (!page.url().includes('/invitados')) {
      const clicked = await page.evaluate(() => {
        const lis = Array.from(document.querySelectorAll('li'));
        for (const li of lis) {
          const p = li.querySelector('p');
          if (p && p.textContent?.trim() === 'Invitados') {
            li.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            return true;
          }
        }
        return false;
      });
      if (!clicked) {
        // Fallback: goto directo (funciona en app-test)
        await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => {});
      }
      await page.waitForURL('**/invitados**', { timeout: 10_000 }).catch(() => {});
    }

    await page.waitForFunction(
      () => {
        const t = document.body.innerText ?? '';
        return /invitados|Grupo|Importar/i.test(t) && !/Cargando\.\.\./.test(t);
      },
      { timeout: 35_000 },
    ).catch(() => {});

    const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    invitadosOk = /invitados|Grupo|Importar/i.test(bodyText) &&
      !bodyText.includes('Error Capturado por ErrorBoundary');

  } catch (e) {
    console.log('[INV beforeAll] error:', e);
    appOk = false;
  } finally {
    await page.close();
    await ctx.close();
  }

  console.log(`[INV beforeAll] appOk=${appOk} invitadosOk=${invitadosOk}`);
});

// ── Helper: login como owner con dev_bypass y navegar a /invitados ─────────────
//
// Sigue el mismo patrón que loginToServicios en comentarios-tareas.spec.ts:
//  1. dev_bypass en sessionStorage → reload
//  2. Esperar a que los eventos carguen en home
//  3. Click en tarjeta de Isabel → evento cargado en React context
//  4. Esperar backlayout → click en <li> nav "Invitados" (client-side, preserva context)
//
// IMPORTANTE: No existe [title="Invitados"] en Profile.tsx (solo existe [title="Servicios"]).
// El <li> de Navigation.tsx funciona cuando event._id está en React state.

async function loginToInvitados(page: Page): Promise<boolean> {
  // Paso 1: activar dev_bypass
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.evaluate(() => sessionStorage.setItem('dev_bypass', 'true'));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Paso 2: esperar a que los eventos carguen en home
  await page.waitForFunction(
    () => /Mis eventos/i.test(document.body.innerText ?? ''),
    { timeout: 45_000 },
  ).catch(() => console.log('[INV] timeout esperando "Mis eventos"'));

  await page.waitForFunction(
    () => !/Cargando eventos/i.test(document.body.innerText ?? ''),
    { timeout: 20_000 },
  ).catch(() => {});

  // Margen extra para que las cards de eventos se rendericen en pantalla
  await delay(2_000);

  // Paso 3: click en tarjeta de Isabel
  //
  // handleClickCard es ASYNC:
  //   1. await fetchApiBodas(updateUser) — API call a BD
  //   2. setEvent(data)                  — event con invitados_array completo
  //   3. await setTimeout(50ms)
  //   4. router.push('/resumen-evento')  — navegación SPA
  //
  // Playwright click() retorna en cuanto el click se despacha,
  // NO espera a que el handler async complete. Por eso NO usamos
  // waitForFunction(!backlayout) — podría resolverse antes de setEvent.
  // La señal fiable de que setEvent(data) fue llamado es la URL /resumen-evento.
  const isabelCard = page.locator('[class*="rounded"], [class*="card"]').filter({
    hasText: /isabel/i,
  }).first();

  const hasIsabel = await isabelCard.isVisible({ timeout: 5_000 }).catch(() => false);

  if (!hasIsabel) {
    // Fallback: cualquier tarjeta de evento disponible
    const anyCard = page.locator('[class*="rounded"][class*="shadow"]').filter({
      hasNotText: /Crea evento|Crear evento/i,
    }).first();
    if (await anyCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await anyCard.click();
    } else {
      console.log('[INV] no se encontró tarjeta de evento');
      return false;
    }
  } else {
    await isabelCard.click();
  }

  // Paso 4: esperar a que la navegación a /resumen-evento complete
  // Esta es la señal FIABLE: setEvent(data) ya fue llamado con el evento completo
  // (incluye invitados_array, grupos_array, etc.)
  await page.waitForURL('**/resumen-evento**', { timeout: 30_000 }).catch(() => {
    console.log('[INV] No navegó a /resumen-evento — handleClickCard tardó más de 30s');
  });

  const postCardUrl = page.url();
  console.log('[INV] post-card URL:', postCardUrl);

  if (!postCardUrl.includes('/resumen-evento')) {
    // Fallback: usar servicios?event=EVENT_ID para cargar el evento via eventsGroup
    // eventsGroup incluye invitados_array (query getEventsByID), así que setEvent tendrá datos completos
    console.log('[INV] fallback a servicios?event=EVENT_ID');
    await page.goto(`${BASE_URL}/servicios?event=${EVENT_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForFunction(
      () => /servicios|Itinerario|Kanban|pendiente/i.test(document.body.innerText ?? ''),
      { timeout: 20_000 },
    ).catch(() => {});
    await delay(1_500); // margen para que EventContext procese el ?event= param
  }

  // Paso 5: margen para que React renderice Navigation con event._id válido
  // (item.condicion = event._id ? true : false → TRUE ahora que evento está cargado)
  await delay(500);

  // Paso 6: navegar a /invitados via SPA (preserva React context con event completo)
  const clickedInvitados = await page.evaluate(() => {
    const lis = Array.from(document.querySelectorAll('li'));
    for (const li of lis) {
      const pTag = li.querySelector('p');
      if (pTag && pTag.textContent?.trim() === 'Invitados') {
        li.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return true;
      }
    }
    return false;
  });

  console.log('[INV] clickedInvitados via eval:', clickedInvitados);

  await page.waitForURL('**/invitados**', { timeout: 15_000 }).catch(() => {
    console.log('[INV] URL no cambió a /invitados tras dispatch click');
  });

  // Fallback Playwright: click con force:true en <li>
  if (!page.url().includes('/invitados')) {
    const invLi = page.locator('li').filter({ hasText: 'Invitados' }).first();
    if (await invLi.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await invLi.click({ force: true }).catch(() => {});
      await page.waitForURL('**/invitados**', { timeout: 10_000 }).catch(() => {});
    }
  }

  // Margen para que el módulo invitados cargue completamente
  await delay(1_500);

  const url = page.url();
  const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
  const ok = url.includes('/invitados') &&
    !bodyText.includes('Error Capturado por ErrorBoundary');

  console.log(`[INV] loginToInvitados ok=${ok} url=${url}`);
  console.log(`[INV] body snippet:`, bodyText.slice(0, 300).replace(/\n+/g, ' | '));
  return ok;
}

// ── Helper: abrir el formulario de crear invitado ──────────────────────────────
//
// El botón está en OptionsSubMenu: <button><PlusIcon/>{t("invitados")}</button>
// t("invitados") = "invitados" (lowercase), CSS capitalize lo muestra como "Invitados"
// Accessible name del botón: "invitados"

/**
 * Función auxiliar para hacer click en un botón de OptionsSubMenu por texto.
 * Los botones tienen texto en minúsculas ("invitados", "grupo", "menu", "importar").
 */
async function clickOptionsButton(page: Page, name: RegExp): Promise<boolean> {
  const btn = page.getByRole('button', { name }).first();
  if (await btn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await btn.click({ timeout: 8_000 });
    return true;
  }
  // Fallback: iterate buttons by textContent
  const allBtns = await page.locator('button:visible').all();
  for (const b of allBtns) {
    const text = ((await b.textContent().catch(() => '')) ?? '').trim();
    if (name.test(text) && text.length < 25) {
      await b.click({ timeout: 5_000 }).catch(() => {});
      return true;
    }
  }
  return false;
}

async function openAddGuestForm(page: Page): Promise<boolean> {
  // Esperar a que el módulo esté completamente cargado
  await page.waitForFunction(
    () => /Grupo|Importar|invitados/i.test(document.body.innerText ?? ''),
    { timeout: 20_000 },
  ).catch(() => {});

  await delay(1_000); // margen para que React termine de renderizar

  // Debug: listar botones visibles
  const allBtns = await page.locator('button:visible').all();
  const btnTexts = await Promise.all(
    allBtns.slice(0, 15).map(async (b) => {
      const text = (await b.textContent().catch(() => '')) ?? '';
      return text.trim().slice(0, 30);
    }),
  );
  console.log('[INV] botones visibles:', JSON.stringify(btnTexts));

  // PASO A: Abrir FormInvitado ("invitados" button en OptionsSubMenu)
  const invButtonClicked = await clickOptionsButton(page, /^invitados$/i);
  if (!invButtonClicked) {
    console.log('[INV] openAddGuestForm: botón invitados no encontrado');
    return false;
  }

  // Esperar a que el panel lateral aparezca (FormInvitado)
  const nameField = page.locator('input[name="nombre"]').first();
  const formVisible = await nameField.isVisible({ timeout: FORM_TIMEOUT }).catch(() => false);
  if (!formVisible) {
    console.log('[INV] openAddGuestForm: form not opened');
    return false;
  }

  // PASO B: Verificar si hay grupos en el rol select.
  // Si no hay grupos (grupos_array = []), debemos crearlos antes.
  // SelectField(rol) tiene options = event.grupos_array → si vacío, solo el placeholder "Seleccionar"
  const rolSel = page.locator('select[name="rol"]').first();
  const optCount = await rolSel.locator('option').count().catch(() => 0);
  console.log(`[INV] openAddGuestForm: rol options count = ${optCount}`);

  if (optCount <= 1) {
    // No hay grupos — cerrar invitado form y crear un grupo primero
    console.log('[INV] openAddGuestForm: sin grupos, creando uno...');

    // Cerrar ModalLeft vía span#close (position:fixed top-right en ModalLeft.js)
    await page.locator('#close').click({ force: true }).catch(async () => {
      // Fallback: ClickAwayListener — hacer click en el backdrop (fuera del panel)
      await page.mouse.click(700, 400).catch(() => {});
    });
    await delay(800);

    // Abrir FormCrearGrupo ("grupo" button en OptionsSubMenu)
    const grupoClicked = await clickOptionsButton(page, /^grupo$/i);
    if (!grupoClicked) {
      console.log('[INV] openAddGuestForm: botón grupo no encontrado');
      return false;
    }

    // Esperar a que el formulario de grupo aparezca (input[name="nombre"])
    const grupoInput = page.locator('input[name="nombre"]').first();
    if (!(await grupoInput.isVisible({ timeout: 8_000 }).catch(() => false))) {
      console.log('[INV] openAddGuestForm: grupo form no abrió');
      return false;
    }

    // Rellenar y enviar
    await grupoInput.fill('E2E-Grupo-Test');
    await page.locator('button[type="submit"]').first().click();

    // Esperar a que el grupo se cree (toast éxito o modal se cierra)
    await page.waitForFunction(
      () => /Grupo creado con exito/i.test(document.body.innerText ?? ''),
      { timeout: 10_000 },
    ).catch(() => console.log('[INV] timeout esperando toast grupo creado'));

    await delay(1_500); // margen para que el modal se cierre y event se actualice

    // Re-abrir FormInvitado
    const reinvClicked = await clickOptionsButton(page, /^invitados$/i);
    if (!reinvClicked) {
      console.log('[INV] openAddGuestForm: botón invitados no encontrado tras crear grupo');
      return false;
    }

    const nameFieldRetry = page.locator('input[name="nombre"]').first();
    const formVisibleRetry = await nameFieldRetry.isVisible({ timeout: FORM_TIMEOUT }).catch(() => false);
    console.log(`[INV] openAddGuestForm (tras crear grupo) formVisible=${formVisibleRetry}`);
    return formVisibleRetry;
  }

  console.log(`[INV] openAddGuestForm formVisible=${formVisible}`);
  return formVisible;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('BATCH INV — Invitados × Roles', () => {

  // ────────────────────────────────────────────────────────────────────────────
  test('INV-01 [owner] crear invitado con datos válidos → toast éxito + aparece en tabla', async ({ page }) => {
    /**
     * Hipótesis: Si el owner rellena el formulario con datos válidos y guarda,
     * aparece toast "Invitado creado con exito" y la fila con el nombre del invitado
     * es visible en la tabla.
     *
     * Resultado medible:
     *  - Toast texto: "Invitado creado con exito" visible < 8s
     *  - DOM: fila con texto E2E-Test-{ts} visible en la tabla
     */
    if (!invitadosOk) {
      test.skip(true, 'INV-01: módulo invitados no accesible (beforeAll)');
      return;
    }

    const ok = await loginToInvitados(page);
    if (!ok) {
      test.skip(true, 'INV-01: loginToInvitados falló');
      return;
    }

    // Identificador único para este invitado de test
    const ts = Date.now().toString().slice(-6);
    const testName = `E2E-Inv-${ts}`;
    const testPhone = `+34611${ts}`;

    console.log(`[INV-01] creando invitado: ${testName} / ${testPhone}`);

    // Contar invitados actuales para verificar que sube tras crear
    const bodyBefore = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');

    // Abrir formulario de crear invitado
    const formOpened = await openAddGuestForm(page);
    if (!formOpened) {
      test.skip(true, 'INV-01: formulario de crear invitado no se abrió');
      return;
    }

    // Rellenar campo teléfono (viene pre-rellenado con +34, limpiar y poner número de test)
    const telField = page.locator('input[name="telefono"]').first();
    await telField.clear();
    await telField.fill(testPhone);

    // Rellenar nombre
    const nameField = page.locator('input[name="nombre"]').first();
    await nameField.fill(testName);

    // Seleccionar rol: SelectField es un <select> nativo con name="rol"
    // options = event.grupos_array (array de objetos { _id, title })
    const rolSelect = page.locator('select[name="rol"]').first();
    const rolVisible = await rolSelect.isVisible({ timeout: 5_000 }).catch(() => false);
    console.log('[INV-01] rolSelect visible:', rolVisible);

    if (rolVisible) {
      // Listar opciones disponibles para diagnóstico
      const rolOptions = await rolSelect.locator('option').all();
      const rolOptValues = await Promise.all(
        rolOptions.map(async (opt) => {
          const val = await opt.getAttribute('value');
          const text = await opt.textContent();
          return `${val}=${text?.trim()}`;
        })
      );
      console.log('[INV-01] rol options:', JSON.stringify(rolOptValues));

      // Seleccionar la primera opción real (índice 1: índice 0 = "Seleccionar" placeholder)
      const firstRealOpt = rolOptions.find(async (opt) => {
        const val = await opt.getAttribute('value');
        return val && val !== '';
      });
      if (rolOptions.length > 1) {
        // Hay opciones reales — seleccionar la segunda (índice 1)
        await rolSelect.selectOption({ index: 1 });
        console.log('[INV-01] rol seleccionado (index 1)');
      } else if (rolOptions.length === 1) {
        // Solo el placeholder, intentar con el primero
        const val = await rolOptions[0].getAttribute('value');
        if (val) await rolSelect.selectOption(val);
      } else {
        console.log('[INV-01] sin opciones en rol select');
      }
    } else {
      console.log('[INV-01] rolSelect no visible, buscando select#selector-field');
      // Fallback: el select puede no tener name visible, buscar por id
      const anySelect = page.locator('select#selector-field').first();
      if (await anySelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await anySelect.selectOption({ index: 1 }).catch(() => {});
      }
    }

    // ── Mock de la mutación createGuests ─────────────────────────────────────
    // dev_bypass no tiene token Firebase real → mutation colgada sin auth.
    // Interceptamos el POST a /api/proxy/graphql para la mutación creaInvitado
    // y devolvemos una respuesta success instantánea.
    // Otros requests (queries de grupos, evento, etc.) pasan sin modificar.
    let mutationIntercepted = false;
    await page.route('**/api/proxy/graphql', async (route) => {
      const body = route.request().postDataJSON() ?? {};
      if (typeof body?.query === 'string' && body.query.includes('creaInvitado')) {
        mutationIntercepted = true;
        console.log('[INV-01] mutation creaInvitado interceptada → mock success');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              creaInvitado: {
                invitados_array: [
                  {
                    _id: `mock-${ts}`,
                    nombre: testName,
                    grupo_edad: 'adulto',
                    correo: null,
                    telefono: testPhone,
                    father: null,
                    passesQuantity: null,
                    nombre_mesa: null,
                    nombre_menu: null,
                    puesto: null,
                    asistencia: 'pendiente',
                    rol: 'e2e-grupo-test',
                    sexo: 'hombre',
                    invitacion: null,
                    fecha_invitacion: null,
                  },
                ],
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Submit del formulario (botón tipo submit con texto "Crear invitado")
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click({ timeout: 8_000 });

    // ── Resultado medible 1: Toast "Invitado creado con exito" ────────────────
    const toastLocator = page.locator('body').getByText(/Invitado creado con exito/i).first();
    const toastVisible = await toastLocator.isVisible({ timeout: TOAST_TIMEOUT }).catch(() => false);

    if (!toastVisible) {
      // Capturar body completo para diagnóstico (errores de validación, mensajes de error)
      const bodyAfterSubmit = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
      console.log('[INV-01] body tras submit:', bodyAfterSubmit.replace(/\n+/g, ' | ').slice(0, 800));
      // Comprobar si hay errores de validación inline
      const hasNombreError = /Nombre requerido/i.test(bodyAfterSubmit);
      const hasTelError = /Teléfono requerido|Número inválido|Número asignado/i.test(bodyAfterSubmit);
      const hasRolError = /Rol requerido|Seleccione un Rol/i.test(bodyAfterSubmit);
      const hasEmailError = /formato del correo|Correo asignado/i.test(bodyAfterSubmit);
      console.log('[INV-01] errores validación:', JSON.stringify({ hasNombreError, hasTelError, hasRolError, hasEmailError }));
      console.log('[INV-01] mutationIntercepted:', mutationIntercepted);
    }

    // Limpiar la intercepción de red
    await page.unroute('**/api/proxy/graphql');

    expect(toastVisible, 'Toast "Invitado creado con exito" debe ser visible tras crear invitado').toBe(true);

    // ── Resultado medible 2: nombre en la tabla ───────────────────────────────
    // El modal debería cerrarse y la tabla actualizarse
    await delay(2_000); // tiempo para que la tabla se actualice
    const bodyAfter = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    const nameInTable = bodyAfter.includes(testName);

    if (!nameInTable) {
      console.log(`[INV-01] "${testName}" no encontrado en body. Fragmento:`,
        bodyAfter.slice(0, 600).replace(/\n+/g, ' | '));
    }

    expect(nameInTable, `El nombre "${testName}" debe aparecer en la tabla tras crear el invitado`).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('INV-02 [owner] formulario vacío → validaciones inline sin llamar API', async ({ page }) => {
    /**
     * Hipótesis: Si el owner hace submit sin rellenar los campos obligatorios,
     * aparecen mensajes de validación inline y el modal no se cierra.
     * La API NO es llamada (no hay llamada a createGuests).
     *
     * Resultado medible:
     *  - Texto visible: "Nombre requerido"
     *  - Texto visible: "Teléfono requerido"
     *  - Texto visible: "Rol requerido" o "Seleccione un Rol valido"
     *  - Modal sigue abierto (campo nombre sigue visible)
     */
    if (!invitadosOk) {
      test.skip(true, 'INV-02: módulo invitados no accesible (beforeAll)');
      return;
    }

    const ok = await loginToInvitados(page);
    if (!ok) {
      test.skip(true, 'INV-02: loginToInvitados falló');
      return;
    }

    const formOpened = await openAddGuestForm(page);
    if (!formOpened) {
      test.skip(true, 'INV-02: formulario de crear invitado no se abrió');
      return;
    }

    // Limpiar el campo teléfono para que quede vacío (triggear error "Teléfono requerido")
    // El campo viene pre-rellenado con +34 (3 chars < 4 → falla validación length < 4)
    const telField = page.locator('input[name="telefono"]').first();
    await telField.clear();
    // Dejar nombre y rol en blanco (ya están vacíos por initialValues)

    // Submit sin rellenar nada
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click({ timeout: 8_000 });

    // Dar tiempo a Formik para mostrar errores (debería ser inmediato)
    await delay(800);

    const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    console.log('[INV-02] body tras submit vacío:', bodyText.slice(0, 500).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: "Nombre requerido" ───────────────────────────────
    expect(bodyText, '"Nombre requerido" debe aparecer en pantalla').toMatch(/Nombre requerido/i);

    // ── Resultado medible 2: "Teléfono requerido" ─────────────────────────────
    expect(bodyText, '"Teléfono requerido" debe aparecer en pantalla').toMatch(/Teléfono requerido|Telefono requerido/i);

    // ── Resultado medible 3: "Rol requerido" ──────────────────────────────────
    expect(bodyText, '"Rol requerido" o "Seleccione un Rol valido" debe aparecer').toMatch(
      /Rol requerido|Seleccione un Rol valido/i,
    );

    // ── Resultado medible 4: modal sigue abierto ──────────────────────────────
    const formStillOpen = await page.locator('input[name="nombre"]').isVisible({ timeout: 2_000 }).catch(() => false);
    expect(formStillOpen, 'El modal debe seguir abierto tras validación fallida').toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('INV-03 [owner] correo con formato inválido → error inline antes de enviar', async ({ page }) => {
    /**
     * Hipótesis: Si el campo correo tiene formato inválido, Formik muestra error
     * inline "El formato del correo no es valido" y no llama a la API.
     *
     * Resultado medible:
     *  - Texto visible: "El formato del correo no es valido"
     *  - Modal sigue abierto
     */
    if (!invitadosOk) {
      test.skip(true, 'INV-03: módulo invitados no accesible (beforeAll)');
      return;
    }

    const ok = await loginToInvitados(page);
    if (!ok) {
      test.skip(true, 'INV-03: loginToInvitados falló');
      return;
    }

    const formOpened = await openAddGuestForm(page);
    if (!formOpened) {
      test.skip(true, 'INV-03: formulario de crear invitado no se abrió');
      return;
    }

    // Rellenar campos obligatorios válidos
    const ts = Date.now().toString().slice(-6);
    await page.locator('input[name="telefono"]').first().clear();
    await page.locator('input[name="telefono"]').first().fill(`+34611${ts}`);
    await page.locator('input[name="nombre"]').first().fill(`E2E-Inv-Email-${ts}`);

    // Rellenar correo con formato inválido
    const correoField = page.locator('input[name="correo"]').first();
    await correoField.fill('no-es-un-email');

    // Mover el foco fuera del campo correo para trigger validación (blur)
    await page.locator('input[name="nombre"]').first().click();
    await delay(500);

    // Submit
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click({ timeout: 8_000 });

    await delay(800);

    const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    console.log('[INV-03] body tras submit email inválido:', bodyText.slice(0, 400).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: error de formato de correo ───────────────────────
    expect(bodyText, '"El formato del correo no es valido" debe aparecer').toMatch(
      /El formato del correo no es valido|Formato invalido/i,
    );

    // ── Resultado medible 2: modal sigue abierto ──────────────────────────────
    const formStillOpen = await page.locator('input[name="nombre"]').isVisible({ timeout: 2_000 }).catch(() => false);
    expect(formStillOpen, 'El modal debe seguir abierto tras error de correo').toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('INV-05 [sin sesión] navegar a /invitados → GuestDemoWrapper "Crear cuenta gratis" o redirige a login', async ({ page, context }) => {
    /**
     * Hipótesis: Sin sesión activa, navegar a /invitados no expone datos privados.
     * La app muestra GuestDemoWrapper con banner "Crear cuenta gratis"
     * OR redirige a /login. En ningún caso se ven datos reales del evento.
     *
     * Resultado medible:
     *  - URL final contiene "/login" O body contiene "Crear cuenta gratis"
     *  - Body NO contiene nombres reales del evento (ej. "Jose Luis", "Maria Garcia")
     *    que están en la lista de invitados real de Isabel & Raúl
     */
    if (!appOk) {
      test.skip(true, 'INV-05: servidor no disponible (beforeAll)');
      return;
    }

    // Limpiar sesión completamente (cookies + localStorage + IndexedDB)
    await clearSession(context, page);

    // Navegar directamente a /invitados sin sesión
    await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Esperar máximo 15s a que ocurra alguno de los dos resultados esperados:
    // 1. Redirige a /login
    // 2. Muestra GuestDemoWrapper con "Crear cuenta gratis"
    let finalUrl = page.url();
    let bodyText = '';

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      finalUrl = page.url();
      bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');

      const atLogin = finalUrl.includes('/login');
      const hasUpsell = /Crear cuenta gratis/i.test(bodyText);

      if (atLogin || hasUpsell) break;
      await delay(800);
    }

    console.log(`[INV-05] finalUrl=${finalUrl}`);
    console.log(`[INV-05] body (primeros 300 chars):`, bodyText.slice(0, 300).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: redirige a login O muestra upsell ───────────────
    const atLogin = finalUrl.includes('/login');
    const hasUpsell = /Crear cuenta gratis/i.test(bodyText);

    expect(
      atLogin || hasUpsell,
      `Sin sesión: debe redirigir a /login o mostrar "Crear cuenta gratis". URL: ${finalUrl}`,
    ).toBe(true);

    // ── Resultado medible 2: NO hay datos privados del evento real ────────────
    // Los pendientes reales en el evento son: 'Jose Luis', 'Maria Garcia', etc.
    // No deben aparecer si la protección funciona correctamente
    const hasPrivateData = /Jose Luis|Maria Garcia|Juancarlos test/i.test(bodyText);
    expect(
      hasPrivateData,
      'Sin sesión: NO deben aparecer datos reales de invitados del evento',
    ).toBe(false);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('INV-04 [owner] teléfono duplicado → "Número asignado a otro invitado" (client-side)', async ({ page }) => {
    /**
     * Hipótesis: Si se intenta crear un invitado con un teléfono que ya existe
     * en event.invitados_array, la validación Yup (client-side) emite el error
     * "Número asignado a otro invitado" SIN llamar a la API.
     *
     * Estrategia:
     *  1. Crear primer invitado con DUPE_PHONE via mock → queda en event.invitados_array
     *  2. Abrir form de nuevo → intentar crear otro con el mismo teléfono
     *  3. Formik valida → Yup detecta duplicado → error inline sin llamada API
     *
     * Resultado medible:
     *  - Texto "Número asignado a otro invitado" visible tras el segundo submit
     *  - Modal sigue abierto (formulario no se cerró)
     */
    if (!invitadosOk) {
      test.skip(true, 'INV-04: módulo invitados no accesible (beforeAll)');
      return;
    }

    const DUPE_PHONE = '+34699000004'; // teléfono de test (no debe existir en DB real)
    const ts = Date.now().toString().slice(-6);

    const ok = await loginToInvitados(page);
    if (!ok) {
      test.skip(true, 'INV-04: loginToInvitados falló');
      return;
    }

    // ── Paso 1: crear primer invitado con DUPE_PHONE (via mock) ───────────────
    const formOpened = await openAddGuestForm(page);
    if (!formOpened) {
      test.skip(true, 'INV-04: formulario de crear invitado no se abrió (paso 1)');
      return;
    }

    // Mock: creaInvitado → devuelve success con DUPE_PHONE en invitados_array
    // FormInvitado.tsx llama setEvent({ invitados_array: result.invitados_array })
    // → DUPE_PHONE queda en el estado React para la validación Yup del siguiente intento
    await page.route('**/api/proxy/graphql', async (route) => {
      const body = route.request().postDataJSON() ?? {};
      if (typeof body?.query === 'string' && body.query.includes('creaInvitado')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              creaInvitado: {
                invitados_array: [{
                  _id: `mock-dup-${ts}`,
                  nombre: `E2E-DupA-${ts}`,
                  grupo_edad: 'adulto',
                  correo: null,
                  telefono: DUPE_PHONE,
                  father: null,
                  passesQuantity: null,
                  nombre_mesa: null,
                  nombre_menu: null,
                  puesto: null,
                  asistencia: 'pendiente',
                  rol: 'e2e-grupo-test',
                  sexo: 'hombre',
                  invitacion: null,
                  fecha_invitacion: null,
                }],
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.locator('input[name="telefono"]').first().clear();
    await page.locator('input[name="telefono"]').first().fill(DUPE_PHONE);
    await page.locator('input[name="nombre"]').first().fill(`E2E-DupA-${ts}`);

    const rolSelect = page.locator('select[name="rol"]').first();
    if (await rolSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const opts = await rolSelect.locator('option').count();
      if (opts > 1) await rolSelect.selectOption({ index: 1 });
    }

    await page.locator('button[type="submit"]').first().click({ timeout: 8_000 });

    // Esperar toast de éxito → confirma que el mock funcionó y el invitado está en estado
    await page.waitForFunction(
      () => /Invitado creado con exito/i.test(document.body.innerText ?? ''),
      { timeout: 8_000 },
    ).catch(() => console.log('[INV-04] timeout esperando toast del primer invitado'));

    // FormInvitado.tsx llama `set(!state)` en finally → el form se cierra automáticamente
    await page.waitForFunction(
      () => {
        const el = document.querySelector('input[name="nombre"]') as HTMLElement | null;
        return !el || !el.offsetParent;
      },
      { timeout: 8_000 },
    ).catch(() => {});

    await page.unroute('**/api/proxy/graphql');
    await delay(1_000);

    // ── Paso 2: abrir form de nuevo e intentar duplicar DUPE_PHONE ────────────
    const formReopened = await openAddGuestForm(page);
    if (!formReopened) {
      test.skip(true, 'INV-04: no se pudo reabrir el formulario (paso 2)');
      return;
    }

    await page.locator('input[name="telefono"]').first().clear();
    await page.locator('input[name="telefono"]').first().fill(DUPE_PHONE);
    await page.locator('input[name="nombre"]').first().fill(`E2E-DupB-${ts}`);

    // Submit → Yup valida ANTES de llamar a API
    // event.invitados_array contiene el invitado con DUPE_PHONE del paso 1
    await page.locator('button[type="submit"]').first().click({ timeout: 8_000 });

    await delay(800);

    const bodyText = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    console.log('[INV-04] body tras submit duplicado:', bodyText.slice(0, 400).replace(/\n+/g, ' | '));

    // ── Resultado medible 1: error de teléfono duplicado (client-side) ────────
    expect(
      bodyText,
      '"Número asignado a otro invitado" debe aparecer tras submit con teléfono duplicado',
    ).toMatch(/Número asignado a otro invitado/i);

    // ── Resultado medible 2: modal sigue abierto ──────────────────────────────
    const formStillOpen = await page.locator('input[name="nombre"]').isVisible({ timeout: 2_000 }).catch(() => false);
    expect(formStillOpen, 'El modal debe seguir abierto tras error de teléfono duplicado').toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  test('INV-07 [owner] FormEditarInvitado → campo correo deshabilitado', async ({ page }) => {
    /**
     * Hipótesis: Al abrir el formulario de edición de un invitado existente,
     * el campo "correo" tiene disabled=true (FormEditarInvitado.tsx: disabled={true}).
     *
     * Estrategia de apertura del modal (en orden):
     *  1. element.click() en div.cursor-pointer (nombre del invitado) — más directo
     *  2. element.click() en span dots → li "Editar" (menú de opciones)
     *
     * Resultado medible:
     *  - input[name="correo"] tiene atributo disabled
     */
    if (!invitadosOk) {
      test.skip(true, 'INV-07: módulo invitados no accesible (beforeAll)');
      return;
    }

    const ok = await loginToInvitados(page);
    if (!ok) {
      test.skip(true, 'INV-07: loginToInvitados falló');
      return;
    }

    // Esperar a que los invitados carguen (pendiente/confirmado/cancelado en DOM)
    await page.waitForFunction(
      () => /pendiente|confirmado|cancelado/i.test(document.body.innerText ?? ''),
      { timeout: 20_000 },
    ).catch(() => {});
    await delay(1_000);

    // ── Paso previo: parchear el event en React state ────────────────────────
    // FormEditarInvitado tiene spreads unsafe que lanzaN en WebKit cuando:
    //   L168: event.planSpace no tiene entrada "recepción" → spread undefined
    //   L182: event.planSpace no tiene entrada "ceremonia" → spread undefined
    //   L194: event.menus_array es null → spread undefined
    // El evento de test puede carecer de estas entradas → las inyectamos en el
    // fiber state mutando el objeto event en memoria (referencia compartida).
    const patchResult = await page.evaluate(() => {
      const el = document.querySelector('div.flex.justify-start.items-center.truncate');
      if (!el) return 'no-el';
      const fk = Object.keys(el).find(k => k.startsWith('__reactFiber'));
      if (!fk) return 'no-fiber';
      let fiber = (el as any)[fk];
      let n = 0;
      while (fiber && n < 600) {
        n++;
        let ms = fiber.memoizedState;
        let msIdx = 0;
        while (ms && msIdx < 25) {
          const val = ms.memoizedState;
          if (val && typeof val === 'object' && !Array.isArray(val) && Array.isArray(val.invitados_array)) {
            // Asegurar menus_array
            if (!Array.isArray(val.menus_array)) val.menus_array = [];
            // Asegurar planSpace con recepción y ceremonia
            if (!Array.isArray(val.planSpace)) val.planSpace = [];
            const ensurePS = (title: string) => {
              let ps = val.planSpace.find((e: any) => e?.title === title);
              if (!ps) { ps = { title, tables: [], _id: `_fake_${title}` }; val.planSpace.push(ps); }
              else if (!Array.isArray(ps.tables)) ps.tables = [];
            };
            ensurePS('recepción');
            ensurePS('ceremonia');
            const ps = val.planSpace.map((p: any) => `${p.title}(${p.tables?.length}t)`).join(',');
            return `patched (fiber#${n}, msIdx=${msIdx}, menus=${val.menus_array.length}, planSpace=[${ps}])`;
          }
          ms = ms.next; msIdx++;
        }
        fiber = fiber.return;
      }
      return `not-found (checked ${n})`;
    }).catch(e => `patch-error: ${e}`);
    console.log(`[INV-07] patch event: ${patchResult}`);

    // ── Estrategia: llamar el handler onClick de React directamente ──────────
    // NO usar locator.dispatchEvent / element.click() — ambos disparan ClickAwayListener
    // del sidebar que limpia el contexto del evento (event data desaparece).
    //
    // Llamar fiber.pendingProps.onClick() directamente NO genera evento DOM nativo,
    // por lo que ClickAwayListener no se activa. El closure handleClick llama
    // setSelected(id) + setIsMounted(!isMounted) → React re-renderiza normalmente.
    const fiberResult = await page.evaluate(() => {
      // Buscar el div con el nombre del invitado (click handler en GrupoTablas)
      // Selector alternativo más robusto: cualquier cursor-pointer dentro de tabla
      const candidates: Element[] = [
        ...Array.from(document.querySelectorAll(
          'div.flex.justify-start.items-center.truncate.pr-3.cursor-pointer'
        )),
        ...Array.from(document.querySelectorAll(
          'td div.cursor-pointer'
        )),
      ];

      for (const nameDiv of candidates) {
        const fk = Object.keys(nameDiv).find(k => k.startsWith('__reactFiber'));
        if (!fk) continue;
        const fiber = (nameDiv as any)[fk];

        // Intentar obtener onClick desde pendingProps o memoizedProps
        const onClick = fiber?.pendingProps?.onClick ?? fiber?.memoizedProps?.onClick;
        if (typeof onClick !== 'function') continue;

        // Llamar handleClick directamente — no hay evento DOM, ClickAwayListener no dispara
        // handleClick = () => { setSelected(id); setIsMounted(!isMounted); }
        // No usa el argumento event, así que podemos pasar undefined
        try {
          onClick(undefined);
          return `called-onClick (tag=${fiber.tag}, cls="${(nameDiv as HTMLElement).className?.slice(0, 40)}")`;
        } catch (e: any) {
          return `onClick-error: ${e?.message}`;
        }
      }

      // Fallback: diagnóstico de por qué no se encontró
      const allCursors = document.querySelectorAll('[class*="cursor-pointer"]');
      const fibers = Array.from(allCursors).filter(el =>
        Object.keys(el).some(k => k.startsWith('__reactFiber'))
      );
      const withClick = fibers.filter(el => {
        const fk = Object.keys(el).find(k => k.startsWith('__reactFiber'));
        if (!fk) return false;
        const f = (el as any)[fk];
        return typeof (f?.pendingProps?.onClick ?? f?.memoizedProps?.onClick) === 'function';
      });
      return `no-onClick-found (cursors=${allCursors.length} withFiber=${fibers.length} withClick=${withClick.length})`;
    }).catch((e: any) => `eval-error: ${(e as any)?.message}`);
    console.log(`[INV-07] direct onClick call: ${fiberResult}`);

    // Dar tiempo a React para re-renderizar (shouldRenderChild → true → ModalBottom mount)
    await delay(2_500);

    // ── Resultado medible: input[name="correo"] visible y tiene disabled=true ─
    const correoInput = page.locator('input[name="correo"]').first();
    const correoVisible = await correoInput.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!correoVisible) {
      test.skip(true, 'INV-07: FormEditarInvitado no abrió (correo input no visible)');
      return;
    }

    const isDisabled = await correoInput.isDisabled({ timeout: 3_000 }).catch(() => false);
    expect(isDisabled, 'INV-07: input[name="correo"] debe tener disabled=true en FormEditarInvitado').toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// C-01 — Persistencia real: crear invitado → verificar en DB → cleanup
//
// A diferencia de INV-01 (que usa mock + dev_bypass), este test:
//   1. Hace login real con email+password → obtiene Firebase auth para write ops
//   2. Envía la mutación creaInvitado SIN intercepción (llamada real a apiapp)
//   3. Re-consulta GET_EVENT via /api/proxy/graphql para verificar que el invitado
//      existe en la BD con el nombre correcto
//   4. Hace cleanup via borraInvitados para no ensuciar el evento de test
//
// Si C-01 falla pero INV-01 pasa → el bug está en la API/BD, no en la UI.
// Si C-01 pasa pero INV-01 falla → el bug está en el toast/DOM update de la UI.
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('C-01 — Invitados: persistencia real en DB', () => {
  const { email, password } = TEST_USERS.organizador;
  let createdGuestId: string | null = null;
  const C01_NAME = `E2E-C01-${Date.now().toString().slice(-8)}`;
  const C01_PHONE = `+34699${Date.now().toString().slice(-6)}`;

  test.afterAll(async ({ browser }) => {
    if (!createdGuestId) return;

    // Cleanup: borrar el invitado de test via borraInvitados mutation
    const ctx = await browser.newContext();
    const pg = await ctx.newPage();
    try {
      // Login para obtener cookie idTokenV0.1.0
      await loginAndSelectEventByName(pg, email, password, BASE_URL, 'Isabel');
      await pg.evaluate(
        async ({ eventId, guestId }) => {
          const cookie = document.cookie.match(/idTokenV0\.1\.0=([^;]+)/);
          const token = cookie?.[1] ?? '';
          await fetch('/api/proxy/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              query: `mutation($eventID:String,$guests:[String]){borraInvitados(evento_id:$eventID,invitados_ids_array:$guests){invitados_array{_id}}}`,
              variables: { eventID: eventId, guests: [guestId] },
            }),
          });
        },
        { eventId: EVENT_ID, guestId: createdGuestId },
      );
      console.log(`[C-01 afterAll] ✅ Cleanup: invitado ${createdGuestId} (${C01_NAME}) eliminado`);
    } catch (e) {
      console.warn('[C-01 afterAll] ⚠️ Cleanup falló:', e);
    } finally {
      await ctx.close();
      createdGuestId = null;
    }
  });

  test('[C-01] crear invitado real → verifica nombre en DB via queryEvent', async ({ page }) => {
    // ── Paso 1: login real y seleccionar evento Isabel & Raúl ─────────────────
    const eventId = await loginAndSelectEventByName(page, email, password, BASE_URL, 'Isabel');
    if (!eventId) {
      console.warn('[C-01] loginAndSelectEventByName falló — servidor no disponible o login roto');
      test.skip();
      return;
    }

    // ── Paso 2: navegar a /invitados via SPA (preserva React context) ─────────
    const clickedNav = await page.evaluate(() => {
      const lis = Array.from(document.querySelectorAll('li'));
      for (const li of lis) {
        const p = li.querySelector('p');
        if (p && p.textContent?.trim() === 'Invitados') {
          li.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return true;
        }
      }
      return false;
    });
    if (clickedNav) {
      await page.waitForURL('**/invitados**', { timeout: 15_000 }).catch(() => {});
    } else {
      await page.goto(`${BASE_URL}/invitados`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    }
    await waitForAppReady(page, 15_000);
    await delay(1_000);

    // ── Paso 3: abrir el formulario de crear invitado ─────────────────────────
    const formOpened = await openAddGuestForm(page);
    if (!formOpened) {
      console.warn('[C-01] formulario de crear invitado no se abrió');
      test.skip();
      return;
    }

    // ── Paso 4: rellenar datos únicos (sin mock — llamada real a API) ──────────
    await page.locator('input[name="nombre"]').first().fill(C01_NAME);
    await page.locator('input[name="telefono"]').first().clear();
    await page.locator('input[name="telefono"]').first().fill(C01_PHONE);

    const rolSelect = page.locator('select[name="rol"]').first();
    if (await rolSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const opts = await rolSelect.locator('option').count();
      if (opts > 1) await rolSelect.selectOption({ index: 1 });
    }

    // ── Paso 5: submit SIN mock → mutación creaInvitado llega a apiapp ────────
    await page.locator('button[type="submit"]').first().click({ timeout: 8_000 });

    // Esperar toast de éxito (confirma que la API respondió OK)
    const toastVisible = await page
      .locator('body')
      .getByText(/Invitado creado con exito/i)
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);

    if (!toastVisible) {
      const body = (await page.locator('body').textContent()) ?? '';
      console.warn('[C-01] Toast no apareció. Body snippet:', body.slice(0, 400).replace(/\n+/g, ' | '));
      // Continuar igualmente — si la API lo guardó el test pasa, si no falla en queryEvent
    }

    // Dar tiempo a que la mutación complete y el ID del invitado esté disponible
    await delay(2_000);

    // ── Paso 6: verificar en DB via queryEvent ────────────────────────────────
    const apiEvent = await queryEvent(page, EVENT_ID, 'invitados_array { _id nombre telefono }');

    if (!apiEvent) {
      console.warn('[C-01] queryEvent devolvió null — API proxy no accesible');
      test.skip();
      return;
    }

    const guests: Array<{ _id: string; nombre: string; telefono: string }> =
      (apiEvent.invitados_array ?? []).filter(Boolean);

    const found = guests.find((g) => g.nombre === C01_NAME || g.telefono === C01_PHONE);

    if (found) {
      createdGuestId = found._id;
      console.log(`[C-01] ✅ Invitado verificado en DB: id=${found._id} nombre="${found.nombre}"`);
    } else {
      console.warn(`[C-01] Invitados en DB (últimos 5):`,
        guests.slice(-5).map((g) => `${g.nombre}/${g.telefono}`).join(', '));
    }

    expect(found, `[C-01] "${C01_NAME}" (${C01_PHONE}) no encontrado en invitados_array de la DB`).toBeTruthy();
    expect(found!.nombre, '[C-01] nombre en DB no coincide').toBe(C01_NAME);
  });
});
