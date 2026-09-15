import { test, expect, devices, Page } from '@playwright/test';

/**
 * QA Permisos — vía UI móvil (usuario real), caso por caso. Batería ITINERARIO.
 * Owner (bodasdehoy.com@gmail.com) comparte "ITEL2 S.L PRUEBA" con jcc@bodasdehoy.com y va
 * cambiando el permiso de itinerario; jcc verifica el gate en cada estado. Revoca + limpia al final.
 * NUNCA toca "Boda Isabel & Raúl". Dos contextos móviles → 1 login por usuario (mínimo).
 */

const IPHONE = devices['iPhone 13'];
const OWNER_EMAIL = process.env.TEST_USER_EMAIL || '';
const OWNER_PW = process.env.TEST_USER_PASSWORD || '';
const JCC_EMAIL = process.env.TEST_USER_EMAIL_3 || '';
const JCC_PW = process.env.TEST_USER_PASSWORD_3 || '';
const APP = (process.env.BASE_URL || '').replace(/\/$/, '');
// Evento REAL del owner (verificado en Mongo: usuario_id upSET…, dev=bodasdehoy,
// compartido_array vacío): "BODA RG" (6a9f21a3…). jcc (2eBU8…) NO lo tiene ni propio ni
// compartido → solo lo verá si el compartir PERSISTE de verdad. Evita el artefacto de que
// jcc mire su propio evento. (ITEL2 NO es del owner: es de tuxwgN7…, por eso fallaba.)
const TEST_EVENT = /BODA RG/i;
const PROTECTED = /isabel\s*&?\s*ra[uú]l/i;

async function loginApp(page: Page, email: string, pw: string): Promise<boolean> {
  await page.goto(`${APP}/login?local-login=1`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1800);
  const emailIn = page.locator('input[type="email"]').first();
  if (!(await emailIn.isVisible({ timeout: 12_000 }).catch(() => false))) return false;
  await emailIn.fill(email, { timeout: 10_000 });
  await page.locator('input[type="password"]').first().fill(pw);
  const submit = page.getByRole('button', { name: /iniciar sesión/i }).first(); // NO OAuth Google
  await expect(submit).toBeEnabled({ timeout: 10_000 });
  await submit.click();
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 40_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const cookies = await page.context().cookies();
  return cookies.some((c) => c.name === 'idTokenV0.1.0' || c.name === 'sessionBodas');
}

// Va al home "Mis eventos" (/) y clica la fila/tarjeta del evento que casa `match`
// (evitando el protegido). La rejilla son filas .tev-row (onClick→abrirFila) o tarjetas
// .evc-*; como fallback, clic por TEXTO (React burbujea el evento al onClick del row).
async function selectEvent(page: Page, match: RegExp): Promise<string | null> {
  await page.goto(`${APP}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2800);
  const clearPortals = () => page.locator('nextjs-portal').evaluateAll((els) => els.forEach((el) => el.remove())).catch(() => {});
  await clearPortals();
  const rowSel = '.tev-row, [class^="evc-"], [class*=" evc-"]';
  for (let t = 0; t < 12; t++) {
    // 1) filas/tarjetas de la rejilla
    const rows = page.locator(rowSel).filter({ hasText: match });
    const n = await rows.count().catch(() => 0);
    for (let i = 0; i < n; i++) {
      const txt = ((await rows.nth(i).textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      if (match.test(txt) && !PROTECTED.test(txt)) {
        await rows.nth(i).scrollIntoViewIfNeeded().catch(() => {});
        await rows.nth(i).click({ force: true }).catch(() => {});
        await page.waitForURL((u: URL) => u.pathname.includes('resumen-evento'), { timeout: 25_000 }).catch(() => {});
        await page.waitForTimeout(2500);
        return txt.slice(0, 50);
      }
    }
    // 2) fallback: clic directo por texto (burbujea al row/card clicable)
    const byText = page.getByText(match).first();
    if (await byText.isVisible().catch(() => false)) {
      const txt = ((await byText.textContent().catch(() => '')) || '').trim();
      if (!PROTECTED.test(txt)) {
        await byText.scrollIntoViewIfNeeded().catch(() => {});
        await byText.click({ force: true }).catch(() => {});
        await page.waitForURL((u: URL) => u.pathname.includes('resumen-evento'), { timeout: 20_000 }).catch(() => {});
        await page.waitForTimeout(2500);
        if (page.url().includes('resumen-evento')) return txt.slice(0, 50);
      }
    }
    await page.mouse.wheel(0, 1400).catch(() => {});
    await page.waitForTimeout(1600);
    await clearPortals();
  }
  return null;
}

async function openShareModal(page: Page) {
  await page.goto(`${APP}/resumen-evento`, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const share = page.locator('[title="Compartir"]:visible').first();
  await expect(share).toBeVisible({ timeout: 12_000 });
  await share.click();
  await expect(page.getByText('Compartir evento').first()).toBeVisible({ timeout: 8_000 });
}

// Invita a jcc si no está aún en la lista de personas con acceso.
async function inviteIfNeeded(page: Page, email: string) {
  const row = page.locator('.mcs-row', { hasText: email });
  if (await row.count() > 0) return;
  await page.locator('input[type="email"]').first().fill(email);
  await page.getByRole('button', { name: /^invitar$/i }).first().click();
  await expect(page.locator('.mcs-row', { hasText: email })).toBeVisible({ timeout: 12_000 });
}

// Abre "Permisos:" de la persona, fija itinerario al valor dado (none/view/edit) y guarda.
async function setItinerarioPerm(page: Page, email: string, value: 'none' | 'view' | 'edit') {
  await openShareModal(page);
  await inviteIfNeeded(page, email);
  const row = page.locator('.mcs-row', { hasText: email }).first();
  await row.locator('.mcs-perm').click();
  const sub = page.locator('.mcs-secrow', { hasText: 'Itinerario' }).first();
  await expect(sub).toBeVisible({ timeout: 8_000 });
  const title = value === 'none' ? 'Sin acceso' : value === 'view' ? 'Ver' : 'Editar';
  await sub.locator(`button[title="${title}"]`).click();
  await page.getByRole('button', { name: /^guardar$/i }).click();
  await page.waitForTimeout(1500);
  // cerrar modal
  await page.getByRole('button', { name: /^hecho$/i }).click().catch(() => {});
  await page.waitForTimeout(500);
}

async function revokeShare(page: Page, email: string) {
  await openShareModal(page);
  const row = page.locator('.mcs-row', { hasText: email }).first();
  if (await row.count() === 0) return;
  await row.locator('.mcs-x').click();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^hecho$/i }).click().catch(() => {});
}

// jcc: estado de /itinerario en un CONTEXTO NUEVO (login limpio) → fuerza re-consulta al backend,
// sin caché de estados anteriores (events_bodasdehoy_<uid> enmascaraba el resultado real).
async function jccCheckFresh(
  browser: any,
): Promise<{ event: 'visible' | 'no-event'; itinerario: 'visible' | 'blocked' | 'view-only' | 'no-event' }> {
  const ctx = await browser.newContext({ ...IPHONE });
  const jcc = await ctx.newPage();
  try {
    if (!(await loginApp(jcc, JCC_EMAIL, JCC_PW))) return { event: 'no-event', itinerario: 'no-event' };
    const ev = await selectEvent(jcc, TEST_EVENT);
    console.log('[diag] jcc seleccionó evento:', ev ?? '(ninguno)');
    if (!ev) return { event: 'no-event', itinerario: 'no-event' };
    await jcc.goto(`${APP}/itinerario`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await jcc.waitForTimeout(4000);
    const body = ((await jcc.locator('body').textContent().catch(() => '')) || '');
    let itinerario: 'visible' | 'blocked' | 'view-only' = 'visible';
    if (/No tienes permisos para acceder/i.test(body)) itinerario = 'blocked';
    else if (/No tienes permisos para editar/i.test(body)) itinerario = 'view-only';
    return { event: 'visible', itinerario };
  } finally {
    await ctx.close().catch(() => {});
  }
}

test('DIAG persistencia: admin-check + read-back mutación + estado jcc', async ({ browser }) => {
  test.setTimeout(600_000);
  const ctxO = await browser.newContext({ ...IPHONE });
  const owner = await ctxO.newPage();
  // Capturar respuestas GraphQL de las mutaciones de compartición
  owner.on('response', async (r) => {
    const u = r.url();
    if (!/graphql|backend|proxy-bodas/i.test(u)) return;
    try {
      const j: any = await r.json();
      const s = JSON.stringify(j);
      if (/ompartition|compartid|permis|evento/i.test(s) && s.length < 4000) {
        console.log('[diag] RESP', u.slice(-32), '→', s.slice(0, 260));
      }
    } catch { /* noop */ }
  });
  try {
    expect(await loginApp(owner, OWNER_EMAIL, OWNER_PW)).toBeTruthy();
    expect(await selectEvent(owner, TEST_EVENT)).toBeTruthy();

    // Estado limpio: revocar jcc si estuviera
    await revokeShare(owner, JCC_EMAIL).catch(() => {});

    // (A) ADMIN CHECK: ¿jcc ve ITEL2 SIN compartir?
    const a = await jccCheckFresh(browser);
    console.log('[diag] A sin-compartir → jcc =', JSON.stringify(a), '(esperado: no-event)');

    // (B) compartir + itinerario=none, luego LEER de vuelta el estado del botón en el owner
    await setItinerarioPerm(owner, JCC_EMAIL, 'none');
    await openShareModal(owner);
    const row = owner.locator('.mcs-row', { hasText: JCC_EMAIL }).first();
    await row.locator('.mcs-perm').click();
    const iti = owner.locator('.mcs-secrow', { hasText: 'Itinerario' }).first();
    await expect(iti).toBeVisible({ timeout: 8_000 });
    const bg = async (title: string) => iti.locator(`button[title="${title}"]`).evaluate((el) => getComputedStyle(el as Element).backgroundColor).catch(() => '?');
    // activo = rgb(252,231,240) (#FCE7F0); inactivo = rgb(247,247,249)
    console.log('[diag] B read-back itinerario → none-bg:', await bg('Sin acceso'), '| view-bg:', await bg('Ver'), '| edit-bg:', await bg('Editar'));
    await owner.getByRole('button', { name: /^guardar$/i }).click().catch(() => {});
    await owner.getByRole('button', { name: /^hecho$/i }).click().catch(() => {});

    // (C) estado real de jcc con none
    const c = await jccCheckFresh(browser);
    console.log('[diag] C none → jcc =', JSON.stringify(c), '(esperado: bloqueado o no-event)');
  } finally {
    await revokeShare(owner, JCC_EMAIL).catch(() => {});
    await ctxO.close().catch(() => {});
  }
});

test('Batería Itinerario: view/none/edit + revocar (owner ITEL2 ↔ jcc) — jcc FRESH por estado', async ({ browser }) => {
  test.setTimeout(900_000);
  const ctxOwner = await browser.newContext({ ...IPHONE });
  const owner = await ctxOwner.newPage();
  const results: Record<string, string> = {};

  try {
    // --- Owner (persistente, 1 login) ---
    expect(await loginApp(owner, OWNER_EMAIL, OWNER_PW), 'login owner').toBeTruthy();
    expect(await selectEvent(owner, TEST_EVENT), 'owner selecciona ITEL2').toBeTruthy();

    // B1: itinerario = view → jcc fresh
    await setItinerarioPerm(owner, JCC_EMAIL, 'view');
    console.log('[perm-ui] owner: compartido + itinerario=view');
    const b1 = await jccCheckFresh(browser);
    results.B1 = `${b1.event}/${b1.itinerario}`;
    console.log('[perm-ui] B1 view → jcc evento/itinerario =', results.B1, '(esperado: visible/visible|view-only)');

    // B2: itinerario = none → jcc fresh (esperado: bloqueado)
    await setItinerarioPerm(owner, JCC_EMAIL, 'none');
    const b2 = await jccCheckFresh(browser);
    results.B2 = `${b2.event}/${b2.itinerario}`;
    console.log('[perm-ui] B2 none → jcc evento/itinerario =', results.B2, '(esperado: visible/blocked)');

    // B3: itinerario = edit → jcc fresh (esperado: acceso)
    await setItinerarioPerm(owner, JCC_EMAIL, 'edit');
    const b3 = await jccCheckFresh(browser);
    results.B3 = `${b3.event}/${b3.itinerario}`;
    console.log('[perm-ui] B3 edit → jcc evento/itinerario =', results.B3, '(esperado: visible/visible)');

    // Z1: revocar → jcc fresh (esperado: evento desaparece)
    await revokeShare(owner, JCC_EMAIL);
    const z1 = await jccCheckFresh(browser);
    results.Z1 = `${z1.event}/${z1.itinerario}`;
    console.log('[perm-ui] Z1 revocado → jcc evento/itinerario =', results.Z1, '(esperado: no-event/no-event)');
  } finally {
    console.log('[perm-ui] RESULTADOS:', JSON.stringify(results));
    await revokeShare(owner, JCC_EMAIL).catch(() => {}); // limpieza: jcc sin acceso
    await ctxOwner.close().catch(() => {});
  }
});
