/**
 * Test Copilot Filters — Verifica que las preguntas al Copilot
 * disparan filtros visibles en el panel derecho (barra rosa).
 *
 * Ejecutar:
 *   node apps/appEventos/scripts/test-copilot-filters.js
 *
 * Opciones:
 *   HEADED=1  → navegador visible (por defecto: visible)
 *   BASE_URL  → URL base (por defecto: https://app-test.bodasdehoy.com)
 */

const { webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3220';
const USER_EMAIL = process.env.USER_EMAIL || 'bodasdehoy.com@gmail.com';
const USER_PASSWORD = process.env.USER_PASSWORD || 'lorca2012M*+';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'test-screenshots', 'filters');
const HEADLESS = process.env.HEADLESS === '1';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function screenshot(page, name) {
  await ensureDir(SCREENSHOTS_DIR);
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`   📸 ${name}.png`);
}

async function waitForAppLoad(page, maxWait = 45000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const hasSpinner = await page
      .evaluate(() => {
        const body = document.body?.textContent || '';
        return body.includes('Un momento, por favor') || body.includes('Cargando');
      })
      .catch(() => true);
    if (!hasSpinner) return true;
    await sleep(1000);
  }
  return false;
}

// ─── Filter test cases ───────────────────────────────────────────────────────
const FILTER_TESTS = [
  {
    id: 'F1',
    question: '¿Cuántos invitados tengo?',
    expectedEntity: 'guests',
    expectedRoute: '/invitados',
    description: 'Filtro de invitados',
  },
  {
    id: 'F2',
    question: '¿Cuál es mi presupuesto de catering?',
    expectedEntity: 'budget_items',
    expectedRoute: '/presupuesto',
    description: 'Filtro de presupuesto',
  },
  {
    id: 'F3',
    question: '¿Qué tareas pendientes tengo?',
    expectedEntity: 'services',
    expectedRoute: '/servicios',
    description: 'Filtro de tareas/servicios',
  },
  {
    id: 'F4',
    question: 'Muéstrame el itinerario de la ceremonia',
    expectedEntity: 'moments',
    expectedRoute: '/itinerario',
    description: 'Filtro de itinerario',
  },
];

// ─── Login ───────────────────────────────────────────────────────────────────
async function login(page) {
  console.log('\n📋 PASO 1: LOGIN');
  // Navigate to home first to check if already logged in
  await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(3000);

  // Check if already logged in (has event data, not just "Crea evento")
  let isLoggedIn = await page.evaluate(() => {
    const body = document.body?.textContent || '';
    // Logged in = has event-related nav AND not showing guest banner
    return (body.includes('Resumen') || body.includes('Invitados')) &&
           !body.includes('Estás como invitado');
  }).catch(() => false);

  if (!isLoggedIn) {
    // Go to login page and wait for manual login
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.log('   ⏸️  HAZ LOGIN MANUALMENTE EN EL BROWSER');
    console.log('   ⏸️  El test continuará automáticamente cuando detecte sesión...');
    console.log('   ⏸️  (Timeout: 5 minutos)');

    const loginStart = Date.now();
    const LOGIN_TIMEOUT = 5 * 60 * 1000;

    while (Date.now() - loginStart < LOGIN_TIMEOUT) {
      await sleep(3000);
      const url = page.url();

      if (!url.includes('/login')) {
        console.log(`   ✅ Login detectado en ${Math.round((Date.now() - loginStart) / 1000)}s`);
        isLoggedIn = true;
        break;
      }
    }

    if (!isLoggedIn) {
      console.log('   ❌ Timeout de login (5 min). Abortando.');
      await browser.close();
      return;
    }
  } else {
    console.log('   ✅ Ya estás logueado');
  }

  await waitForAppLoad(page, 60000);
  await sleep(3000);
  await screenshot(page, '01-loaded');
  console.log(`   ✅ Loaded: ${page.url()}`);
}

// ─── Select first event ──────────────────────────────────────────────────────
async function selectEvent(page) {
  console.log('\n📋 PASO 2: SELECCIONAR EVENTO');
  for (const sel of [
    'tr:has-text("Boda")',
    'tr:has-text("boda")',
    'tr:has-text("Evento")',
    '[class*="card"]:has-text("Boda")',
    'table tr:nth-child(2)',
  ]) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      await el.click().catch(() => {});
      await sleep(5000);
      await waitForAppLoad(page, 20000);
      console.log(`   ✅ Evento seleccionado con: ${sel}`);
      break;
    }
  }
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Escape');
    await sleep(300);
  }
  await screenshot(page, '02-event');
}

// ─── Open Copilot ────────────────────────────────────────────────────────────
async function openCopilot(page) {
  console.log('\n📋 PASO 3: ABRIR COPILOT');
  for (const sel of [
    'button[title*="Copilot"]',
    'button[aria-label*="Copilot"]',
    'button:has-text("Copilot")',
  ]) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ force: true });
      console.log(`   ✅ Copilot abierto con: ${sel}`);
      break;
    }
  }
  await sleep(8000);
  await screenshot(page, '03-copilot');
}

// ─── Find chat input (inside iframe) ────────────────────────────────────────
async function findChatInput(page) {
  console.log('\n📋 PASO 4: BUSCAR INPUT DEL CHAT');

  // Textarea directa
  const ta = page.locator('textarea').first();
  if (await ta.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('   📝 Input: textarea directa');
    return { input: ta, type: 'native' };
  }

  // Iframe
  console.log('   Esperando iframe del Copilot (hasta 90s)...');
  const iframeSelectors = ['iframe[src*="chat"]', 'iframe[src*="bodasdehoy"]', 'iframe'];
  for (let attempt = 0; attempt < 18; attempt++) {
    await sleep(5000);
    for (const iframeSel of iframeSelectors) {
      const count = await page.locator(iframeSel).count().catch(() => 0);
      if (count === 0) continue;
      const frame = page.frameLocator(iframeSel).first();
      for (const sel of ['textarea', '[contenteditable="true"]', 'input[type="text"]']) {
        const el = frame.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`   📝 Input: ${iframeSel} > ${sel} (${(attempt + 1) * 5}s)`);
          return { input: el, type: 'iframe', frame, iframeSel };
        }
      }
    }
    if (attempt % 3 === 2) console.log(`   ... intento ${attempt + 1}/18`);
  }
  return null;
}

// ─── Send message to Copilot ─────────────────────────────────────────────────
async function sendMessage(chatInfo, question) {
  const { input, type, frame } = chatInfo;
  if (type === 'iframe') {
    const ce = frame.locator('[contenteditable="true"]').first();
    await ce.click();
    await sleep(300);
    await ce.pressSequentially(question, { delay: 25 });
    await sleep(500);
    const sendBtn = frame
      .locator(
        'button[data-testid="send-button"], button[aria-label*="Send"], button[aria-label*="Enviar"]',
      )
      .first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sendBtn.click();
    } else {
      await ce.press('Enter');
    }
  } else {
    await input.fill(question);
    await sleep(300);
    await input.press('Enter');
  }
}

// ─── Check filter bar visible ────────────────────────────────────────────────
async function checkFilterBar(page, expectedEntity, expectedRoute) {
  const result = {
    routeChanged: false,
    filterBarVisible: false,
    filterText: '',
    currentUrl: page.url(),
  };

  // Check route
  result.routeChanged = page.url().includes(expectedRoute);

  // Check for the pink filter bar (bg-pink-100)
  const filterBar = await page
    .evaluate(() => {
      // Look for the CopilotFilterBar
      const pinkBars = document.querySelectorAll('[class*="bg-pink"]');
      for (const bar of pinkBars) {
        if (bar.textContent?.includes('Filtro') || bar.textContent?.includes('🔍')) {
          return { visible: true, text: bar.textContent?.trim() };
        }
      }
      return { visible: false, text: '' };
    })
    .catch(() => ({ visible: false, text: '' }));

  result.filterBarVisible = filterBar.visible;
  result.filterText = filterBar.text;

  return result;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function run() {
  console.log('═'.repeat(70));
  console.log('TEST COPILOT FILTERS — Verificar filtros en panel derecho');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log(`Browser: WebKit  |  Headless: ${HEADLESS}`);
  console.log('═'.repeat(70));

  const browser = await webkit.launch({ headless: HEADLESS, slowMo: 200 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Capture postMessages for debugging
  const postMessages = [];
  await page.exposeFunction('__capturePostMessage', (type, payload) => {
    postMessages.push({ type, payload, time: new Date().toISOString() });
  });

  page.on('load', async () => {
    await page
      .evaluate(() => {
        const orig = window.postMessage.bind(window);
        window.postMessage = function (data, ...args) {
          if (data?.type) {
            window.__capturePostMessage?.(data.type, JSON.stringify(data.payload || {}));
          }
          return orig(data, ...args);
        };
      })
      .catch(() => {});
  });

  const results = [];

  try {
    await login(page);
    await selectEvent(page);
    await openCopilot(page);

    const chatInfo = await findChatInput(page);
    if (!chatInfo) {
      console.log('\n   ❌ No se encontró input del chat. Abortando.');
      await screenshot(page, 'error-no-input');
      await browser.close();
      return;
    }

    // ─── Run each filter test ────────────────────────────────────────────
    for (const test of FILTER_TESTS) {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`🧪 ${test.id}: ${test.description}`);
      console.log(`   Pregunta: "${test.question}"`);
      console.log(`   Esperado: entity=${test.expectedEntity}, ruta=${test.expectedRoute}`);
      console.log('─'.repeat(60));

      try {
        // Send question
        await sendMessage(chatInfo, test.question);
        console.log('   ✉️ Enviado');

        // Wait for AI response + filter action (up to 35s)
        console.log('   ⏳ Esperando respuesta + filtro (35s)...');
        let filterFound = false;
        for (let i = 0; i < 7; i++) {
          await sleep(5000);

          // Check if filter bar appeared
          const check = await checkFilterBar(page, test.expectedEntity, test.expectedRoute);
          if (check.filterBarVisible || check.routeChanged) {
            filterFound = true;
            console.log(`   ✅ Filtro detectado en ${(i + 1) * 5}s`);
            console.log(`      Ruta cambiada: ${check.routeChanged} (${check.currentUrl})`);
            console.log(`      Barra filtro: ${check.filterBarVisible}`);
            console.log(`      Texto: ${check.filterText}`);
            await screenshot(page, `${test.id}-filter-ok`);
            results.push({ ...test, status: '✅ PASS', detail: check.filterText });
            break;
          }

          // Also check the postMessages
          const relevantMsgs = postMessages.filter(
            (m) => m.type === 'FILTER_VIEW' || m.type === 'COPILOT_NAVIGATE',
          );
          if (relevantMsgs.length > 0) {
            console.log(`   📨 PostMessages: ${JSON.stringify(relevantMsgs.slice(-2))}`);
          }
        }

        if (!filterFound) {
          console.log('   ⚠️ No se detectó filtro tras 35s');
          await screenshot(page, `${test.id}-no-filter`);

          // Check if there was a response at all
          const chatContent = await getChatContent(page, chatInfo);
          console.log(`   📝 Respuesta del chat:\n${chatContent?.substring(0, 400)}`);
          results.push({ ...test, status: '❌ FAIL', detail: 'No filter detected' });
        }

        // Navigate back to event page for next test and reopen copilot if needed
        await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded', timeout: 90000 });
        await sleep(3000);
        await waitForAppLoad(page, 15000);

        // Re-select event
        for (const sel of ['tr:has-text("Boda")', 'tr:has-text("boda")', 'table tr:nth-child(2)']) {
          const el = page.locator(sel).first();
          if (await el.isVisible().catch(() => false)) {
            await el.click().catch(() => {});
            break;
          }
        }
        await sleep(3000);
        for (let i = 0; i < 3; i++) {
          await page.keyboard.press('Escape');
          await sleep(300);
        }

        // Reopen copilot
        for (const sel of [
          'button[title*="Copilot"]',
          'button[aria-label*="Copilot"]',
          'button:has-text("Copilot")',
        ]) {
          const btn = page.locator(sel).first();
          if (await btn.isVisible().catch(() => false)) {
            await btn.click({ force: true });
            break;
          }
        }
        await sleep(8000);
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        await screenshot(page, `${test.id}-error`);
        results.push({ ...test, status: '❌ ERROR', detail: err.message });
      }
    }

    // ─── Summary ─────────────────────────────────────────────────────────
    console.log(`\n${'═'.repeat(70)}`);
    console.log('RESUMEN DE FILTROS');
    console.log('═'.repeat(70));
    console.log('');
    for (const r of results) {
      console.log(`  ${r.status}  ${r.id} ${r.description}`);
      if (r.detail) console.log(`         ${r.detail}`);
    }
    const passed = results.filter((r) => r.status.includes('PASS')).length;
    console.log(`\n  Total: ${passed}/${results.length} pasaron`);
    console.log(`\n  PostMessages capturados: ${postMessages.length}`);
    postMessages.slice(-10).forEach((m) => console.log(`    [${m.type}] ${m.payload}`));
    console.log('═'.repeat(70));
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error.message);
    await screenshot(page, 'fatal-error').catch(() => {});
  } finally {
    await browser.close();
  }
}

// ─── Get chat content helper ─────────────────────────────────────────────────
async function getChatContent(page, chatInfo) {
  if (chatInfo.type === 'iframe') {
    const frame = page.frameLocator(chatInfo.iframeSel || 'iframe[src*="bodasdehoy"]').first();
    return frame
      .locator('body')
      .first()
      .innerText({ timeout: 5000 })
      .catch(() => '(no se pudo leer)');
  }
  return page
    .evaluate(() => {
      const sidebar = document.querySelector(
        '[class*="sidebar"], [class*="Sidebar"], [class*="copilot"], [class*="Copilot"]',
      );
      return sidebar?.innerText?.substring(0, 1500) || document.body?.innerText?.substring(0, 500);
    })
    .catch(() => '(error)');
}

run().catch(console.error);
