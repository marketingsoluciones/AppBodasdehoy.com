/**
 * Test Filter Mechanism — Verifica que FILTER_VIEW postMessage
 * aplica la barra rosa y navega correctamente.
 * NO requiere login ni backend IA.
 *
 * Ejecutar: node apps/appEventos/scripts/test-filter-mechanism.js
 */

const { webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://app-test.bodasdehoy.com';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'test-screenshots', 'filter-mechanism');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
async function screenshot(page, name) {
  await ensureDir(SCREENSHOTS_DIR);
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`   📸 ${name}.png`);
}

// Inject a FILTER_VIEW postMessage as if the Copilot iframe sent it
async function injectFilter(page, entity, ids, query) {
  await page.evaluate(({ entity, ids, query }) => {
    window.postMessage({
      type: 'FILTER_VIEW',
      payload: { entity, ids, query },
    }, '*');
  }, { entity, ids, query });
}

// Check if the pink CopilotFilterBar is visible
async function checkFilterBar(page) {
  return page.evaluate(() => {
    const bars = document.querySelectorAll('[class*="bg-pink"]');
    for (const bar of bars) {
      if (bar.textContent?.includes('Filtro') || bar.textContent?.includes('🔍')) {
        return { visible: true, text: bar.textContent?.trim() };
      }
    }
    return { visible: false, text: '' };
  }).catch(() => ({ visible: false, text: '' }));
}

const TESTS = [
  { id: 'F1', entity: 'guests', route: '/invitados', query: 'Invitados confirmados', fakeIds: ['id1', 'id2', 'id3'] },
  { id: 'F2', entity: 'budget_items', route: '/presupuesto', query: 'Gastos de catering', fakeIds: ['cat1', 'cat2'] },
  { id: 'F3', entity: 'services', route: '/servicios', query: 'Tareas pendientes', fakeIds: ['svc1'] },
  { id: 'F4', entity: 'moments', route: '/itinerario', query: 'Momentos ceremonia', fakeIds: ['m1', 'm2'] },
  { id: 'F5', entity: 'tables', route: '/mesas', query: 'Mesa principal', fakeIds: ['t1'] },
];

async function run() {
  console.log('═'.repeat(60));
  console.log('TEST FILTER MECHANISM — Inyección directa de FILTER_VIEW');
  console.log(`URL: ${BASE_URL}`);
  console.log('═'.repeat(60));

  const browser = await webkit.launch({ headless: false, slowMo: 100 });
  const page = await browser.newContext({ viewport: { width: 1440, height: 900 } }).then(c => c.newPage());

  const results = [];

  try {
    // Load home
    console.log('\n📋 Cargando app...');
    await page.goto(BASE_URL + '/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
    await sleep(5000);

    // Check if logged in with real account (has events, not guest avatar "G")
    const needsLogin = async () => {
      const url = page.url();
      if (url.includes('/login')) return true;
      return page.evaluate(() => {
        const body = document.body?.textContent || '';
        // Guest = shows "Crea evento" without any event cards, or "invitado"
        const isGuest = body.includes('Crea evento') && !body.includes('Boda');
        const hasNoEvents = !document.querySelector('tr[class*="event"], [class*="card"]:not(:empty)');
        return isGuest || body.includes('Estás como invitado');
      }).catch(() => true);
    };

    if (await needsLogin()) {
      // Go to login page
      if (!page.url().includes('/login')) {
        await page.goto(BASE_URL + '/login', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
        await sleep(2000);
      }
      console.log('');
      console.log('   ╔══════════════════════════════════════════════╗');
      console.log('   ║  HAZ LOGIN EN EL BROWSER DE PLAYWRIGHT      ║');
      console.log('   ║  Luego selecciona un evento con datos       ║');
      console.log('   ║  El test continúa solo (timeout: 5 min)     ║');
      console.log('   ╚══════════════════════════════════════════════╝');
      console.log('');

      const start = Date.now();
      while (Date.now() - start < 300000) {
        await sleep(3000);
        // Check if logged in and on a page with event data
        const url = page.url();
        if (url.includes('/login')) continue;
        const ready = await page.evaluate(() => {
          const body = document.body?.textContent || '';
          // Must have event-related content (not just promo page)
          return !body.includes('Estás como invitado') &&
                 (body.includes('Resumen') || body.includes('Pendientes')) &&
                 !body.includes('Crear un evento');
        }).catch(() => false);
        if (ready) {
          console.log(`   ✅ Login + evento detectado (${Math.round((Date.now() - start) / 1000)}s)`);
          break;
        }
      }

      if (await needsLogin()) {
        console.log('   ❌ Timeout. Abortando.');
        await browser.close();
        return;
      }
    } else {
      console.log('   ✅ Ya logueado con evento');
    }

    await sleep(2000);
    await screenshot(page, '00-home');

    for (const test of TESTS) {
      console.log(`\n${'─'.repeat(50)}`);
      console.log(`🧪 ${test.id}: entity=${test.entity} → ${test.route}`);
      console.log('─'.repeat(50));

      try {
        // Navigate to the target route
        console.log(`   Navegando a ${test.route}...`);
        await page.goto(BASE_URL + test.route, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
        await sleep(3000);
        // Handle possible redirect
        if (page.url().includes('/login')) {
          console.log('   ⚠️ Redirigido a login, esperando...');
          await sleep(5000);
        }
        await screenshot(page, `${test.id}-01-before`);

        // Inject FILTER_VIEW postMessage
        console.log(`   Inyectando FILTER_VIEW: ${test.entity} (${test.fakeIds.length} ids)...`);
        await injectFilter(page, test.entity, test.fakeIds, test.query);
        await sleep(2000);

        // Check if filter bar appeared
        const bar = await checkFilterBar(page);
        await screenshot(page, `${test.id}-02-after`);

        if (bar.visible) {
          console.log(`   ✅ PASS — Barra filtro visible: "${bar.text}"`);
          results.push({ ...test, status: '✅ PASS', detail: bar.text });
        } else {
          console.log(`   ❌ FAIL — Barra filtro NO visible`);
          results.push({ ...test, status: '❌ FAIL', detail: 'No filter bar' });
        }

        // Clear filter for next test
        await page.evaluate(() => {
          window.postMessage({ type: 'CLEAR_FILTER', payload: {} }, '*');
        });
        await sleep(500);

      } catch (err) {
        console.log(`   ❌ ERROR: ${err.message.substring(0, 100)}`);
        await screenshot(page, `${test.id}-error`);
        results.push({ ...test, status: '❌ ERROR', detail: err.message.substring(0, 80) });
      }
    }

    // Summary
    console.log(`\n${'═'.repeat(60)}`);
    console.log('RESUMEN');
    console.log('═'.repeat(60));
    for (const r of results) {
      console.log(`  ${r.status}  ${r.id} ${r.entity} → ${r.route}`);
      if (r.detail) console.log(`         ${r.detail}`);
    }
    const passed = results.filter(r => r.status.includes('PASS')).length;
    console.log(`\n  Total: ${passed}/${results.length} pasaron`);
    console.log('═'.repeat(60));

  } catch (err) {
    console.error('\n❌ FATAL:', err.message);
    await screenshot(page, 'fatal').catch(() => {});
  } finally {
    await sleep(2000);
    await browser.close();
  }
}

run().catch(console.error);
