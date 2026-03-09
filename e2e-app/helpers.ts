import { BrowserContext, Page } from '@playwright/test';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const FIREBASE_DBS = [
  'firebase-installations-database',
  'firebaseLocalStorageDb',
  'firebase-heartbeat-database',
];

async function clearStorageAtOrigin(page: Page): Promise<void> {
  await page.evaluate((dbs) =>
    Promise.all([
      new Promise<void>((resolve) => {
        try { window.localStorage.clear(); } catch { /* ignorar */ }
        try { window.sessionStorage.clear(); } catch { /* ignorar */ }
        resolve();
      }),
      ...dbs.map(
        (db) =>
          new Promise<void>((resolve) => {
            try {
              const req = window.indexedDB.deleteDatabase(db);
              req.onsuccess = () => resolve();
              req.onerror = () => resolve();
              req.onblocked = () => resolve();
            } catch {
              resolve();
            }
          }),
      ),
    ]), FIREBASE_DBS
  ).catch(() => {});
}

/**
 * Limpia completamente la sesión en app-test Y chat-test:
 * cookies (todas), localStorage e IndexedDB de Firebase en ambos orígenes.
 * Necesario para simular usuario guest de forma fiable sin que chat-test
 * redirigde de vuelta automáticamente por sesión Firebase en su propio storage.
 */
export async function clearSession(context: BrowserContext, page: Page): Promise<void> {
  await context.clearCookies();

  // 1. Limpiar app-test origin
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
  } catch { /* ignorar */ }
  await clearStorageAtOrigin(page);

  // 2. Limpiar chat-test origin (Firebase puede tener sesión ahí)
  const BASE_URL = process.env.BASE_URL || '';
  const isAppTest = BASE_URL.includes('app-test.') || BASE_URL.includes('.bodasdehoy.com');
  if (isAppTest) {
    try {
      await page.goto('https://chat-test.bodasdehoy.com/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await clearStorageAtOrigin(page);
    } catch { /* si chat-test no está disponible, ignorar */ }
    // Volver al origen principal
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20_000 });
    } catch { /* ignorar */ }
  }

  await context.clearCookies();
}

/**
 * Espera a que la app muestre contenido (body visible y con texto).
 * Útil tras goto para que el AuthContext termine de cargar.
 */
export async function waitForAppReady(page: Page, timeoutMs = 25_000): Promise<void> {
  const body = page.locator('body');
  await body.waitFor({ state: 'visible', timeout: Math.min(timeoutMs, 10_000) }).catch(() => {});
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const text = (await body.textContent()) ?? '';
    if (text.length > 80 && !text.includes('Error Capturado por ErrorBoundary')) return;
    await delay(400);
  }
}

/**
 * Login en app-test y selecciona el primer evento disponible.
 * Navega al home, hace click en la primera tarjeta de evento y espera
 * a que el contexto de evento esté activo (URL cambia o módulo carga).
 *
 * Retorna el ID del evento seleccionado, o null si no hay eventos.
 */
export async function loginAndSelectEvent(
  page: Page,
  email: string,
  password: string,
  baseUrl: string,
): Promise<string | null> {
  // 1. Login
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(1000);

  const emailInput = page.locator('input[type="email"]').first();
  if (!await emailInput.isVisible({ timeout: 8_000 }).catch(() => false)) return null;

  await emailInput.fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
  await waitForAppReady(page, 20_000);
  if (page.url().includes('/login')) return null;

  // 2. Ir al home y hacer click en el primer evento
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await waitForAppReady(page, 15_000);

  // Buscar tarjeta de evento (Card component) — excluye CardEmpty
  const eventCards = page.locator('[class*="rounded"][class*="shadow"]').filter({
    hasText: /\d{4}|boda|evento|fiesta|aniversario|cumpleaños/i,
  });
  const cardCount = await eventCards.count();
  if (cardCount === 0) {
    console.log('ℹ️ No hay eventos para seleccionar en la cuenta de prueba');
    return null;
  }

  // Click en primer evento
  const firstCard = eventCards.first();
  const cardText = (await firstCard.textContent()) ?? '';
  await firstCard.click();
  await page.waitForTimeout(2000);

  // Extraer event ID de la URL si cambió
  const url = page.url();
  const eventIdMatch = url.match(/event=([a-f0-9]{24})/);
  const eventId = eventIdMatch?.[1] ?? null;

  console.log(`✅ Evento seleccionado: "${cardText.slice(0, 40).trim()}" (id: ${eventId ?? 'desconocido'})`);
  return eventId ?? 'selected';
}

/**
 * Navega a una ruta del módulo asegurando que el evento esté seleccionado.
 * Si no hay evento seleccionado, intenta seleccionar el primero en home.
 */
export async function gotoModule(
  page: Page,
  path: string,
  baseUrl: string,
): Promise<void> {
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: 40_000 });
  await waitForAppReady(page, 20_000);

  // Si la página redirigió al home (sin evento), seleccionar el primero
  if (page.url().endsWith('/') || page.url().endsWith(baseUrl)) {
    const cards = page.locator('[class*="rounded"][class*="shadow"]').filter({
      hasText: /\d{4}|boda|evento/i,
    });
    if (await cards.count() > 0) {
      await cards.first().click();
      await page.waitForTimeout(1500);
      await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForAppReady(page, 15_000);
    }
  }
}
