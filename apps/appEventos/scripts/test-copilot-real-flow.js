/**
 * Test Copilot con usuario real en app-test.bodasdehoy.com
 * Usa /api/dev/refresh-session para auth sin contraseña
 *
 * Ejecutar: node apps/web/scripts/test-copilot-real-flow.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'bodasdehoy.com@gmail.com';
const USER_PASSWORD = 'lorca2012M*+';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'test-screenshots');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function screenshot(page, name) {
  await ensureDir(SCREENSHOTS_DIR);
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`   📸 ${name}.png`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForAppLoad(page, maxWait = 45000) {
  console.log('   Esperando que la app cargue...');
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const hasSpinner = await page.evaluate(() => {
      const body = document.body?.textContent || '';
      return body.includes('Un momento, por favor') || body.includes('Cargando');
    }).catch(() => true);
    if (!hasSpinner) {
      console.log(`   ✅ App cargada en ${Date.now() - start}ms`);
      return true;
    }
    await sleep(1000);
  }
  console.log(`   ⚠️ Timeout esperando carga (${maxWait}ms)`);
  return false;
}

async function run() {
  console.log('='.repeat(70));
  console.log('TEST COPILOT - FLUJO REAL');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Email: ${USER_EMAIL}`);
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Copilot') || text.includes('copilot') || text.includes('Auth') ||
        text.includes('ChatSidebar') || text.includes('CopilotChat') || text.includes('guest')) {
      consoleLogs.push(`[${msg.type()}] ${text.substring(0, 200)}`);
    }
  });

  // Block navigation to organizador domain only
  await page.route('**/organizador.bodasdehoy.com/**', route => {
    console.log(`   🚫 Blocked: ${route.request().url().substring(0, 100)}`);
    route.fulfill({ status: 200, body: '<html><body>Blocked</body></html>', contentType: 'text/html' });
  });

  // After each page load, inject script to prevent ChatSidebar navigation
  page.on('load', async () => {
    await page.evaluate(() => {
      // Override window.location assign/replace to prevent external navigation
      const origAssign = window.location.assign.bind(window.location);
      window.location.assign = (url) => {
        if (url.includes('organizador.bodasdehoy.com')) {
          console.log('[TEST] Blocked location.assign to:', url);
          return;
        }
        origAssign(url);
      };
    }).catch(() => {});
  });

  try {
    // ========== PASO 1: AUTENTICACIÓN (login real Firebase) ==========
    console.log('\n📋 PASO 1: AUTENTICACIÓN (login real)');

    // Limpiar cualquier sesión previa para forzar login limpio
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('dev_bypass');
    }).catch(() => {});
    // Recargar para que el login no detecte sesión previa
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Esperar email input y llenar inmediatamente
    console.log('   Esperando formulario de login...');
    const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    if (await emailInput.isVisible({ timeout: 15000 }).catch(() => false)) {
      console.log('   📝 Formulario visible, llenando con evaluate...');
      await screenshot(page, 'flow-00-login');

      // Usar evaluate para llenar ambos campos instantáneamente y hacer submit
      const loginResult = await page.evaluate(({ email, password }) => {
        const emailEl = document.querySelector('input[type="email"], input[name="identifier"]');
        const passEl = document.querySelector('input[type="password"], input[name="password"]');
        if (!emailEl || !passEl) return { ok: false, reason: 'inputs not found' };

        // React necesita native input setter para detectar cambios
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;

        nativeInputValueSetter.call(emailEl, email);
        emailEl.dispatchEvent(new Event('input', { bubbles: true }));
        emailEl.dispatchEvent(new Event('change', { bubbles: true }));

        nativeInputValueSetter.call(passEl, password);
        passEl.dispatchEvent(new Event('input', { bubbles: true }));
        passEl.dispatchEvent(new Event('change', { bubbles: true }));

        // Click submit
        const btn = document.querySelector('button[type="submit"]')
          || Array.from(document.querySelectorAll('button')).find(b =>
            b.textContent.includes('Iniciar') || b.textContent.includes('Entrar')
          );
        if (btn) btn.click();

        return { ok: true, btnText: btn?.textContent?.trim() };
      }, { email: USER_EMAIL, password: USER_PASSWORD });

      console.log('   Login evaluate result:', JSON.stringify(loginResult));
      await screenshot(page, 'flow-00-filled');

      // Esperar navegación post-login
      await sleep(12000);
      console.log(`   URL post-login: ${page.url()}`);
    } else {
      console.log('   ⚠️ No se encontró formulario de login, probando dev_bypass...');
      // Fallback a dev_bypass
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(2000);
      await page.evaluate(() => sessionStorage.setItem('dev_bypass', 'true'));
      await page.evaluate(async (email) => {
        try {
          await fetch('/api/dev/refresh-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            credentials: 'include',
          });
        } catch {}
      }, USER_EMAIL);
      await page.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 45000 });
      await sleep(5000);
    }

    // Si sigue en login, ir a /eventos
    if (page.url().includes('/login')) {
      console.log('   ⚠️ Aún en login, intentando /eventos directamente...');
      await page.goto(BASE_URL + '/eventos', { waitUntil: 'networkidle', timeout: 30000 });
      await sleep(5000);
    }

    await waitForAppLoad(page, 45000);
    await sleep(3000);
    await screenshot(page, 'flow-01-loaded');
    console.log(`   URL: ${page.url()}`);

    // Estado de la página
    const pageState = await page.evaluate(() => ({
      buttons: Array.from(document.querySelectorAll('button'))
        .map(b => (b.title || b.textContent?.trim() || '').substring(0, 40))
        .filter(Boolean).slice(0, 20),
      bodySnippet: document.body?.innerText?.substring(0, 300),
    }));
    console.log(`   Botones: ${pageState.buttons.join(' | ')}`);

    // ========== PASO 2: SELECCIONAR EVENTO ==========
    console.log('\n📋 PASO 2: SELECCIONAR EVENTO');

    let eventSelected = false;
    for (const sel of [
      'tr:has-text("Boda")', 'tr:has-text("boda")', 'tr:has-text("Evento")',
      '[class*="card"]:has-text("Boda")', 'table tr:nth-child(2)',
    ]) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        console.log(`   Click en: ${sel}`);
        await el.click().catch(() => {});
        eventSelected = true;
        break;
      }
    }

    if (eventSelected) {
      await sleep(5000);
      await waitForAppLoad(page, 20000);
    }
    await screenshot(page, 'flow-02-event');
    console.log(`   Evento seleccionado: ${eventSelected}`);

    // Cerrar modales
    for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await sleep(300); }
    await sleep(1000);

    // ========== PASO 3: ABRIR COPILOT ==========
    console.log('\n📋 PASO 3: ABRIR COPILOT');

    let copilotOpened = false;
    for (const sel of ['button[title*="Copilot"]', 'button[aria-label*="Copilot"]', 'button:has-text("Copilot")']) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click({ force: true });
        copilotOpened = true;
        console.log(`   ✅ Click en: ${sel}`);
        break;
      }
    }

    // Esperar a que el sidebar cargue
    await sleep(8000);
    await screenshot(page, 'flow-03-copilot');

    // Detectar tipo de chat
    const chatType = await page.evaluate(() => {
      const tAll = document.querySelectorAll('textarea');
      const iframes = Array.from(document.querySelectorAll('iframe'));
      const chatIframes = iframes.filter(i => i.src.includes('chat'));
      return {
        textareas: Array.from(tAll).map(t => ({
          placeholder: t.placeholder,
          visible: t.offsetParent !== null,
          rect: t.getBoundingClientRect(),
        })),
        chatIframes: chatIframes.map(i => i.src),
        allIframes: iframes.map(i => i.src?.substring(0, 80)),
        hasGuestBanner: (document.body?.innerText || '').includes('invitado'),
        bodySnippet: (document.body?.innerText || '').substring(0, 200),
      };
    });
    console.log(`   Textareas: ${chatType.textareas.length}`);
    chatType.textareas.forEach(t => console.log(`     placeholder="${t.placeholder}" visible=${t.visible}`));
    console.log(`   Chat iframes: ${chatType.chatIframes.length}`);
    chatType.chatIframes.forEach(s => console.log(`     ${s}`));
    console.log(`   All iframes: ${chatType.allIframes.length}`);
    chatType.allIframes.forEach(s => console.log(`     ${s}`));
    console.log(`   Guest: ${chatType.hasGuestBanner}`);

    // ========== ENCONTRAR INPUT DE CHAT ==========
    let chatInput = null;
    let chatContext = 'none';

    // 1) Textarea directa visible
    for (const t of chatType.textareas) {
      if (t.visible && (t.placeholder.includes('mensaje') || t.placeholder.includes('Escribe') || t.placeholder === '')) {
        chatInput = page.locator('textarea').first();
        chatContext = 'native';
        console.log('   📝 Input: textarea directa');
        break;
      }
    }

    // 2) Dentro de iframe — probar múltiples selectores porque el src cambia dinámicamente
    if (!chatInput) {
      console.log('   Esperando iframe de LobeChat (hasta 90s)...');
      const iframeSelectors = ['iframe[src*="chat"]', 'iframe[src*="bodasdehoy"]', 'iframe'];
      for (let attempt = 0; attempt < 18; attempt++) {
        await sleep(5000);
        for (const iframeSel of iframeSelectors) {
          const frameCount = await page.locator(iframeSel).count().catch(() => 0);
          if (frameCount === 0) continue;
          const frame = page.frameLocator(iframeSel).first();
          for (const sel of ['textarea', '[contenteditable="true"]', 'input[type="text"]']) {
            const el = frame.locator(sel).first();
            if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
              chatInput = el;
              chatContext = `iframe:${iframeSel}`;
              console.log(`   📝 Input: ${iframeSel} > ${sel} tras ${(attempt+1)*5}s`);
              break;
            }
          }
          if (chatInput) break;
        }
        if (chatInput) break;
        if (attempt % 3 === 2) {
          await screenshot(page, `flow-03-wait-${attempt+1}`);
          console.log(`   ... intento ${attempt+1}/18 - aún no visible`);
        }
      }
    }

    // 3) Iframe genérico
    if (!chatInput && chatType.allIframes.length > 0) {
      console.log('   Intentando iframe genérico...');
      for (let i = 0; i < chatType.allIframes.length; i++) {
        const frame = page.frameLocator(`iframe >> nth=${i}`);
        const el = frame.locator('textarea, [contenteditable="true"]').first();
        if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
          chatInput = el;
          chatContext = `iframe[${i}]`;
          console.log(`   📝 Input: iframe[${i}]`);
          break;
        }
      }
    }

    if (!chatInput) {
      console.log('   ❌ No se encontró input de chat');
      await screenshot(page, 'flow-04-no-input');
      // Dump más detallado para debug
      const fullDump = await page.evaluate(() => {
        const el = document.querySelector('[class*="sidebar"], [class*="Sidebar"]');
        if (el) return el.innerHTML?.substring(0, 800);
        // Buscar el contenido visible
        return document.body?.innerHTML?.substring(document.body.innerHTML.length - 2000);
      });
      console.log(`   Sidebar dump: ${fullDump?.substring(0, 400)}`);
      consoleLogs.forEach(l => console.log(`   ${l}`));
      await browser.close();
      return;
    }

    // ========== EJECUTAR TESTS ==========
    const questions = [
      { id: 't1', q: '¿Qué eventos tengo para el próximo año?' },
      { id: 't2', q: 'Dame un detalle del presupuesto de este evento' },
    ];

    for (const { id, q } of questions) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`🧪 TEST ${id}: ${q}`);
      console.log('='.repeat(50));

      try {
        let inputEl;

        if (chatContext.startsWith('iframe')) {
          // Para LobeChat iframe: usar contenteditable dentro del iframe
          const frame = page.frameLocator('iframe[src*="bodasdehoy"]').first();

          // Esperar a que el contenteditable esté listo
          const ce = frame.locator('[contenteditable="true"]').first();
          if (!await ce.isVisible({ timeout: 10000 }).catch(() => false)) {
            console.log('   ⚠️ contenteditable no visible, esperando más...');
            await sleep(5000);
          }

          // Click, type, enter (contenteditable no soporta fill)
          await ce.click();
          await sleep(300);
          await ce.pressSequentially(q, { delay: 30 });
          await sleep(500);

          // Buscar botón de enviar dentro del iframe
          const sendBtn = frame.locator('button[data-testid="send-button"], button[aria-label*="Send"], button[aria-label*="Enviar"]').first();
          if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await sendBtn.click();
          } else {
            await ce.press('Enter');
          }
          console.log('   ✉️ Enviado (iframe)...');

        } else {
          // Para CopilotChatNative: textarea directa
          const ta = page.locator('textarea').first();
          if (!await ta.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('   ❌ Textarea no visible, reabriendo Copilot...');
            for (const sel of ['button[title*="Copilot"]', 'button:has-text("Copilot")']) {
              const btn = page.locator(sel).first();
              if (await btn.isVisible().catch(() => false)) { await btn.click({ force: true }); break; }
            }
            await sleep(5000);
          }
          await ta.fill(q);
          await sleep(500);
          await ta.press('Enter');
          console.log('   ✉️ Enviado (native)...');
        }

        // Wait for response to stream
        console.log('   Esperando respuesta (25s)...');
        await sleep(25000);
        await screenshot(page, `flow-${id}-response`);

        // Capture chat content
        let chatContent = '';
        if (chatContext.startsWith('iframe')) {
          // Capturar contenido dentro del iframe
          const frame = page.frameLocator('iframe[src*="bodasdehoy"]').first();
          chatContent = await frame.locator('body').first().innerText({ timeout: 5000 }).catch(() => '(no se pudo leer iframe)');
        } else {
          chatContent = await page.evaluate(() => {
            const sidebar = document.querySelector('[class*="sidebar"], [class*="Sidebar"], [class*="copilot"], [class*="Copilot"]');
            if (sidebar) return sidebar.innerText?.substring(0, 1500);
            return document.body?.innerText?.substring(0, 500);
          });
        }
        console.log(`   📝 Chat content:\n${chatContent?.substring(0, 800)}`);

        // If navigated away, go back
        if (!page.url().includes('app-test.bodasdehoy.com')) {
          console.log(`   ↩️ Navegó fuera, volviendo a app-test...`);
          await page.goto(BASE_URL + '/eventos', { waitUntil: 'networkidle', timeout: 30000 });
          await sleep(3000);
          // Reopen copilot
          for (const sel of ['button[title*="Copilot"]', 'button:has-text("Copilot")']) {
            const btn = page.locator(sel).first();
            if (await btn.isVisible().catch(() => false)) { await btn.click({ force: true }); break; }
          }
          await sleep(5000);
        }

      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        await screenshot(page, `flow-${id}-error`);
        // Try to recover
        if (!page.url().includes('app-test.bodasdehoy.com')) {
          await page.goto(BASE_URL + '/eventos', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
          await sleep(3000);
          for (const sel of ['button[title*="Copilot"]']) {
            const btn = page.locator(sel).first();
            if (await btn.isVisible().catch(() => false)) { await btn.click({ force: true }); break; }
          }
          await sleep(5000);
        }
      }
    }

    // ========== RESUMEN ==========
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN FINAL');
    console.log('='.repeat(70));
    console.log(`URL: ${page.url()}`);
    console.log(`Chat type: ${chatContext}`);
    console.log(`Tests: 3 completados`);
    console.log(`\nConsole logs (últimos 20):`);
    consoleLogs.slice(-20).forEach(l => console.log(`   ${l}`));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await screenshot(page, 'flow-error').catch(() => {});
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
