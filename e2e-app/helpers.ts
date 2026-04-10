import { BrowserContext, Page } from '@playwright/test';
import { getChatUrl } from './fixtures';

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
      // Unregister service workers + clear SW caches to avoid ChunkLoadError from stale chunks
      new Promise<void>((resolve) => {
        try {
          const tasks: Promise<any>[] = [];
          if ('serviceWorker' in navigator) {
            tasks.push(
              navigator.serviceWorker.getRegistrations()
                .then((regs) => Promise.all(regs.map((r) => r.unregister())))
                .catch(() => {})
            );
          }
          if ('caches' in window) {
            tasks.push(
              (window as any).caches.keys()
                .then((keys: string[]) => Promise.all(keys.map((k: string) => (window as any).caches.delete(k))))
                .catch(() => {})
            );
          }
          Promise.all(tasks).then(() => resolve()).catch(() => resolve());
        } catch { resolve(); }
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

  // 2. Limpiar chat origin (Firebase puede tener sesión ahí)
  const BASE_URL = process.env.BASE_URL || '';
  const chatUrl = getChatUrl(BASE_URL);
  const isRemote = BASE_URL.includes('.bodasdehoy.com');
  if (isRemote) {
    try {
      await page.goto(`${chatUrl}/`, { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await clearStorageAtOrigin(page);
    } catch { /* si chat no está disponible, ignorar */ }
    // Volver al origen principal (usando URL absoluta para no quedar en chat-dev)
    const appBase = BASE_URL.startsWith('http') ? BASE_URL : '';
    if (appBase) {
      try {
        await page.goto(appBase, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      } catch { /* ignorar */ }
    }
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
    try {
      const text = (await body.textContent()) ?? '';
      if (text.length > 80 && !text.includes('Error Capturado por ErrorBoundary')) return;
    } catch {
      return; // Página cerrada o navegación en curso
    }
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
  const isRemoteEnv = baseUrl.includes('app-test') || baseUrl.includes('app-dev');
  const loginUrl = isRemoteEnv ? `${baseUrl}/login?local-login=1` : `${baseUrl}/login`;
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
  if (!await emailInput.isVisible({ timeout: 15_000 }).catch(() => false)) return null;

  await emailInput.fill(email, { timeout: 20_000 });
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
  await waitForAppReady(page, 20_000);
  if (page.url().includes('/login')) return null;

  // 2. Ir al home y hacer click en el primer evento
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await waitForAppReady(page, 15_000);

  // Buscar tarjeta de evento (Card component)
  let eventCards = page.locator('[class*="rounded"][class*="shadow"]').filter({
    hasText: /\d{4}|boda|evento|fiesta|aniversario|cumpleaños/i,
  });
  let cardCount = await eventCards.count();
  if (cardCount === 0) {
    eventCards = page.locator('[class*="rounded"][class*="shadow"], [class*="card"], [data-testid*="event"]').filter({
      hasText: /evento|isabel|raúl|invitado|\d{4}|boda/i,
    });
    cardCount = await eventCards.count();
  }
  if (cardCount === 0) {
    const anyEventLink = page.locator('a[href*="event"], [role="button"]').filter({ hasText: /evento|isabel|raúl|\d{4}/i });
    if ((await anyEventLink.count()) > 0) {
      await anyEventLink.first().click();
      await page.waitForTimeout(2000);
      const url = page.url();
      const eventIdMatch = url.match(/event=([a-f0-9]{24})/);
      console.log('✅ Evento seleccionado (enlace/fallback)');
      return eventIdMatch?.[1] ?? 'selected';
    }
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
 * Login en app-test y selecciona un evento cuyo nombre (tarjeta) contenga `eventName`.
 * Útil para tests que requieren un evento concreto (ej. "Raúl Isabel").
 * Retorna el ID del evento seleccionado o null si no se encuentra ninguna tarjeta con ese texto.
 */
export async function loginAndSelectEventByName(
  page: Page,
  email: string,
  password: string,
  baseUrl: string,
  eventName: string,
): Promise<string | null> {
  const loginUrl = (baseUrl.includes('app-test') || baseUrl.includes('app-dev')) ? `${baseUrl}/login?local-login=1` : `${baseUrl}/login`;
  try {
    await page.goto(loginUrl, { waitUntil: 'commit', timeout: 45_000 });
  } catch (e) {
    if (String(e).includes('interrupted by another navigation') && page.url().replace(/\/$/, '') === baseUrl.replace(/\/$/, '')) {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForAppReady(page, 15_000);
      const searchWords = eventName.replace(/\s+/g, ' ').trim().toLowerCase().split(' ').filter(Boolean);
      const eventCards = page.locator('[class*="rounded"][class*="shadow"]').filter({
        hasText: /\d{4}|boda|evento|fiesta|aniversario|cumpleaños/i,
      });
      const cardCount = await eventCards.count();
      if (cardCount === 0) return null;
      for (let i = 0; i < cardCount; i++) {
        const card = eventCards.nth(i);
        const text = (await card.textContent()) ?? '';
        const textLower = text.toLowerCase();
        if (searchWords.every((w: string) => textLower.includes(w))) {
          await card.click();
          await page.waitForTimeout(2000);
          const url = page.url();
          const eventIdMatch = url.match(/event=([a-f0-9]{24})/);
          return eventIdMatch?.[1] ?? 'selected';
        }
      }
      return null;
    }
    throw e;
  }
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForTimeout(2000);

  const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
  if (!(await emailInput.isVisible({ timeout: 15_000 }).catch(() => false))) return null;

  await emailInput.fill(email, { timeout: 20_000 });
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url: URL) => !url.pathname.includes('/login'), { timeout: 30_000 }).catch(() => {});
  await waitForAppReady(page, 20_000);
  if (page.url().includes('/login')) return null;

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await waitForAppReady(page, 15_000);

  const searchWords = eventName.replace(/\s+/g, ' ').trim().toLowerCase().split(' ').filter(Boolean);
  const eventCards = page.locator('[class*="rounded"][class*="shadow"]').filter({
    hasText: /\d{4}|boda|evento|fiesta|aniversario|cumpleaños/i,
  });
  const cardCount = await eventCards.count();
  if (cardCount === 0) return null;

  for (let i = 0; i < cardCount; i++) {
    const card = eventCards.nth(i);
    const text = (await card.textContent()) ?? '';
    const textLower = text.toLowerCase();
    const allWordsMatch = searchWords.every((w) => textLower.includes(w));
    if (allWordsMatch) {
      await card.click();
      await page.waitForTimeout(2000);
      const url = page.url();
      const eventIdMatch = url.match(/event=([a-f0-9]{24})/);
      const eventId = eventIdMatch?.[1] ?? null;
      console.log(`✅ Evento por nombre "${eventName}": "${text.slice(0, 50).trim()}" (id: ${eventId ?? 'desconocido'})`);
      return eventId ?? 'selected';
    }
  }
  for (const word of searchWords) {
    for (let i = 0; i < cardCount; i++) {
      const card = eventCards.nth(i);
      const text = (await card.textContent()) ?? '';
      if (text.toLowerCase().includes(word)) {
        await card.click();
        await page.waitForTimeout(2000);
        const url = page.url();
        const eventIdMatch = url.match(/event=([a-f0-9]{24})/);
        const eventId = eventIdMatch?.[1] ?? null;
        console.log(`✅ Evento por palabra "${word}": "${text.slice(0, 50).trim()}" (id: ${eventId ?? 'desconocido'})`);
        return eventId ?? 'selected';
      }
    }
  }

  console.log(`ℹ️ No se encontró evento con nombre que contenga "${eventName}"`);
  return null;
}

/** 1033/cookies/Cloudflare en body → skip para no dar falsos fallos */
export async function shouldSkipAppUnreachable(page: Page): Promise<boolean> {
  const text = (await page.locator('body').textContent()) ?? '';
  return /1033|Please enable cookies|Cloudflare/i.test(text);
}

/**
 * Comprueba si una URL está accesible Y sin errores visibles.
 * Usar en test.beforeAll para saltar todo un describe si el servidor no responde.
 *
 * @returns 'ok' | 'unreachable' | 'error'
 *  - 'ok': servidor accesible y sin errores
 *  - 'unreachable': servidor no responde (timeout, 0 chars) → skip tests
 *  - 'error': servidor accesible pero muestra error → falla tests
 */
export async function checkServerHealth(
  page: Page,
  url: string,
): Promise<'ok' | 'unreachable' | 'error'> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 }).catch(() => {});
  const text = await page.locator('body').textContent().catch(() => null) ?? '';
  if (text === null || text.length < 15) return 'unreachable';
  const errorPatterns =
    /Error Capturado por ErrorBoundary|Error al cargar|Internal Server Error|Something went wrong|Failed to load|No se pudo cargar|Ha ocurrido un error/i;
  if (errorPatterns.test(text)) return 'error';
  return 'ok';
}

/**
 * Copilot listo para escribir.
 *
 * Soporta DOS arquitecturas:
 *  A) CopilotEmbed (actual): textarea nativo en el DOM principal (no iframe).
 *  B) CopilotIframe (legacy): iframe con src*="chat".
 *
 * Devuelve { ready, mode } donde mode indica qué variante encontró.
 */
export async function waitForCopilotReady(
  page: Page,
  timeoutMs = 25_000,
): Promise<{ ready: boolean; mode: 'embed' | 'iframe' | null }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      // ── A) CopilotEmbed: textarea directamente en el DOM ──
      const embedTextarea = page.locator('textarea[placeholder*="Escribe"]').first();
      if (await embedTextarea.isVisible().catch(() => false)) {
        return { ready: true, mode: 'embed' };
      }

      // ── B) Legacy iframe ──
      const iframeCount = await page.locator('iframe[src*="chat"]').count().catch(() => 0);
      if (iframeCount > 0) {
        const iframe = page.frameLocator('iframe[src*="chat"]').first();
        const body = iframe.locator('body');
        await body.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => null);
        const bodyText = (await body.textContent()) ?? '';
        if (/Internal Server Error|500|Error al cargar/i.test(bodyText)) {
          await delay(2_000);
          continue;
        }
        const editor = iframe.locator('div[contenteditable="true"], textarea, input[type="text"]').last();
        if (await editor.isVisible().catch(() => false)) {
          return { ready: true, mode: 'iframe' };
        }
        const anyMessage = iframe.locator('[class*="markdown"], [class*="message"], [data-role="assistant"]').first();
        if (await anyMessage.isVisible().catch(() => false)) {
          return { ready: true, mode: 'iframe' };
        }
      }
    } catch {
      /* ignorar y reintentar */
    }
    await delay(1_500);
  }
  return { ready: false, mode: null };
}

/** @deprecated Usa waitForCopilotReady — este wrapper mantiene compatibilidad con specs existentes. */
export async function waitForCopilotIframeReady(
  page: Page,
  timeoutMs = 25_000,
): Promise<boolean> {
  const { ready } = await waitForCopilotReady(page, timeoutMs);
  return ready;
}

/** Espera a que el panel derecho muestre el resultado (URL o contenido). */
export async function waitForRightSideResult(
  page: Page,
  options: { timeoutMs?: number; urlContains?: string; bodyMatch?: RegExp } = {},
): Promise<boolean> {
  const { timeoutMs = 90_000, urlContains, bodyMatch } = options;
  if (!urlContains && !bodyMatch) return true;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (urlContains && page.url().includes(urlContains)) return true;
      if (bodyMatch) {
        const text = (await page.locator('body').textContent()) ?? '';
        if (bodyMatch.test(text)) return true;
      }
    } catch {
      return false; // Página cerrada
    }
    await delay(2_000);
  }
  return false;
}

/**
 * Pantalla de mensajes: respuesta del asistente visible (y opcionalmente filtro/URL).
 * Soporta embed (DOM directo) e iframe (legacy).
 */
export async function waitForMessagesScreen(
  page: Page,
  options: { timeoutMs?: number; requireFilterOrMesas?: boolean; mode?: 'embed' | 'iframe' | null } = {},
): Promise<boolean> {
  const { timeoutMs = 90_000, requireFilterOrMesas = false, mode } = options;
  const deadline = Date.now() + timeoutMs;
  let seenAssistantMessage = false;
  let seenFilterOrMesas = false;

  while (Date.now() < deadline) {
    // ── Buscar respuesta del asistente ──
    if (mode === 'embed' || !mode) {
      // CopilotEmbed: los mensajes están en el DOM principal
      try {
        const assistantMsgs = page.locator(
          '[class*="markdown"], [class*="message-content"], [class*="assistant"], [data-role="assistant"]',
        );
        const last = assistantMsgs.last();
        if (await last.isVisible().catch(() => false)) {
          const text = (await last.textContent()) ?? '';
          if (text.length > 10) seenAssistantMessage = true;
        }
      } catch { /* ignorar */ }
    }

    if (mode === 'iframe' || !mode) {
      // Legacy iframe
      try {
        const iframeCount = await page.locator('iframe[src*="chat"]').count().catch(() => 0);
        if (iframeCount > 0) {
          const iframe = page.frameLocator('iframe[src*="chat"]').first();
          const assistant = iframe.locator(
            '[class*="markdown"], [class*="message-content"], [class*="assistant"], [data-role="assistant"]',
          );
          const lastAssistant = assistant.last();
          if (await lastAssistant.isVisible().catch(() => false)) {
            const text = (await lastAssistant.textContent()) ?? '';
            if (text.length > 10) seenAssistantMessage = true;
          }
        }
      } catch { /* iframe puede no estar listo */ }
    }

    try {
      const appText = (await page.locator('body').textContent()) ?? '';
      if (/Filtro:|filtró|copilot filtró|✕|×/i.test(appText)) seenFilterOrMesas = true;
      if (page.url().includes('/mesas')) seenFilterOrMesas = true;
    } catch {
      // Página cerrada o navegación en curso — devolver lo que tengamos
      return seenAssistantMessage;
    }

    if (seenAssistantMessage && (!requireFilterOrMesas || seenFilterOrMesas)) return true;
    await delay(2_000);
  }
  return seenAssistantMessage;
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

/**
 * Obtiene el JWT de API2 del localStorage del navegador tras autenticarse.
 * Prioridad: jwt_token_cache → jwt_token → api2_jwt_token
 * Útil para adjuntar Authorization: Bearer <token> en llamadas directas a la API.
 */
export async function getAuthJwt(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    // 1. jwt_token_cache (token HS256 de api2, válido ~7 días)
    const cache = localStorage.getItem('jwt_token_cache');
    if (cache) {
      try {
        const { token, expiry } = JSON.parse(cache) as { expiry: number; token: string };
        if (token && expiry && Date.now() < expiry) return token;
      } catch { /* ignorar */ }
    }
    // 2. jwt_token (login directo API2 o Firebase)
    const direct = localStorage.getItem('jwt_token');
    if (direct && direct !== 'null' && direct !== 'undefined') return direct;
    // 3. api2_jwt_token (Firebase Auth)
    const firebase = localStorage.getItem('api2_jwt_token');
    if (firebase && firebase !== 'null' && firebase !== 'undefined') return firebase;
    return null;
  });
}
