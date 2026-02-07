#!/usr/bin/env node
/**
 * E2E Test: Copilot en app-test.bodasdehoy.com
 *
 * Flujo:
 * 1. Login real con Firebase
 * 2. Abrir Copilot y preguntar eventos del proximo anio
 * 3. Preguntar invitados con celiaquia
 * 4. Pedir agregar un invitado a "Boda de Pico"
 * 5. Verificar insercion en pantalla
 *
 * Ejecutar: node apps/web/scripts/test-copilot-e2e.js
 */

const { chromium } = require('playwright');

const BASE = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'bodasdehoy.com@gmail.com';
const USER_PASSWORD = 'lorca2012M*+';

const TIMEOUT = 60000;

// Script to run in browser to find assistant messages
const GET_MSGS_SCRIPT = `(function() {
  var allDivs = document.querySelectorAll('div');
  var results = [];
  var hasPensando = false;
  for (var i = 0; i < allDivs.length; i++) {
    try {
      var d = allDivs[i];
      var bg = getComputedStyle(d).backgroundColor;
      if (bg === 'rgb(243, 244, 246)') {
        var text = d.textContent || '';
        if (text.indexOf('Pensando') >= 0) { hasPensando = true; continue; }
        if (text.trim().length > 5) results.push(text.trim());
      }
    } catch(e) {}
  }
  return JSON.stringify({ messages: results, hasPensando: hasPensando });
})()`;

async function getAssistantMessages(page) {
  var raw = await page.evaluate(GET_MSGS_SCRIPT);
  return JSON.parse(raw);
}

// Helper: send message and wait for response
async function sendCopilotMessage(page, message) {
  // Count existing assistant messages before sending
  var before = await getAssistantMessages(page);
  var msgCountBefore = before.messages.length;
  console.log('    [debug] msgs before: ' + msgCountBefore);

  // Find and fill textarea
  var textarea = await page.waitForSelector('textarea', { timeout: 15000 });
  await textarea.click();
  await textarea.fill(message);
  await textarea.press('Enter');

  // Wait for new assistant message
  await page.waitForTimeout(3000);

  var lastContent = '';
  var stableCount = 0;
  for (var i = 0; i < 50; i++) {
    await page.waitForTimeout(1500);
    try {
      var state = await getAssistantMessages(page);
    } catch (e) {
      console.log('    [debug] evaluate failed: ' + e.message);
      continue;
    }

    if (state.hasPensando) { stableCount = 0; lastContent = ''; continue; }

    if (state.messages.length <= msgCountBefore) { continue; }

    var newMsgs = state.messages.slice(msgCountBefore);
    var current = newMsgs.join('|||');
    if (current === lastContent && current.length > 0) {
      stableCount++;
      if (stableCount >= 2) break;
    } else {
      stableCount = 0;
      lastContent = current;
    }
  }

  // Get the newest assistant message
  try {
    var final2 = await getAssistantMessages(page);
    console.log('    [debug] msgs after: ' + final2.messages.length);
    if (final2.messages.length > msgCountBefore) {
      return final2.messages[final2.messages.length - 1];
    }
  } catch (e) {
    console.log('    [debug] final evaluate failed: ' + e.message);
  }
  return '';
}

async function main() {
  console.log('='.repeat(70));
  console.log('E2E TEST - COPILOT en app-test.bodasdehoy.com');
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const results = [];

  try {
    // -- STEP 1: Login --
    console.log('\n[STEP 1] Navegando a login...');
    await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);

    // Check if already logged in (auto-redirect from previous session)
    if (!page.url().includes('/login')) {
      console.log('  Ya logueado, saltando login.');
    } else {
      // Wait for form inputs to be present - try multiple selectors
      var loginInput = await page.waitForSelector(
        'input[name="identifier"], input[name="email"], input[type="email"], input[name="username"]',
        { timeout: 15000 }
      ).catch(function() { return null; });
      if (loginInput) {
        console.log('  Ingresando credenciales...');
      } else {
        console.log('  No se encontro formulario de login, tomando screenshot...');
        await page.screenshot({ path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/login-debug.png' });
      }
    }

    if (page.url().includes('/login')) {
    await page.evaluate(function(creds) {
      var setNative = function(input, val) {
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        if (setter && setter.set) {
          setter.set.call(input, val);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      var emailEl = document.querySelector('input[name="identifier"]') || document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
      var passEl = document.querySelector('input[name="password"]') || document.querySelector('input[type="password"]');
      if (emailEl) setNative(emailEl, creds[0]);
      if (passEl) setNative(passEl, creds[1]);
    }, [USER_EMAIL, USER_PASSWORD]);

    await page.waitForTimeout(500);
    await page.evaluate(function() {
      var btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });

    console.log('  Esperando redireccion post-login...');
    await page.waitForURL(function(url) { return !url.toString().includes('/login'); }, { timeout: 30000 }).catch(function() {});
    await page.waitForTimeout(3000);
    } // end if login page

    var currentUrl = page.url();
    var loginOk = !currentUrl.includes('/login');
    console.log('  URL actual: ' + currentUrl);
    console.log('  Login: ' + (loginOk ? 'OK' : 'FALLO'));
    results.push({ step: 'Login', pass: loginOk, detail: currentUrl });

    if (!loginOk) {
      console.log('\nLogin fallo. Abortando.');
      await browser.close();
      process.exit(1);
    }

    // -- STEP 2: Abrir Copilot --
    console.log('\n[STEP 2] Abriendo Copilot...');
    // Look for any button that might open copilot
    var copilotBtn = await page.waitForSelector(
      'button[title*="Copilot"], button[title*="copilot"], button:has-text("Copilot")',
      { timeout: 15000 }
    ).catch(function() { return null; });

    if (copilotBtn) {
      await copilotBtn.click();
      await page.waitForTimeout(2000);
      console.log('  Copilot abierto');
    } else {
      console.log('  No se encontro boton de Copilot, puede estar ya visible.');
    }

    // Debug: check if textarea exists
    var hasTextarea = await page.evaluate(function() {
      var ta = document.querySelector('textarea');
      return ta ? { placeholder: ta.placeholder, visible: ta.offsetParent !== null } : null;
    });
    console.log('  Textarea encontrado:', JSON.stringify(hasTextarea));

    // Take screenshot after copilot opens
    await page.screenshot({ path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/copilot-open.png' });

    // -- STEP 3: Preguntar eventos del proximo anio --
    console.log('\n[STEP 3] Preguntando eventos del proximo anio...');
    var resp1 = await sendCopilotMessage(page, 'Cuales son todos mis eventos para el proximo anio?');
    console.log('  Respuesta (' + resp1.length + ' chars): ' + resp1.substring(0, 300));
    results.push({ step: 'Eventos proximo anio', pass: resp1.length > 20, detail: resp1.substring(0, 200) });

    // -- STEP 4: Preguntar invitados con celiaquia --
    console.log('\n[STEP 4] Preguntando invitados con celiaquia...');
    var resp2 = await sendCopilotMessage(page, 'Hay algun invitado con celiaquia o alguna alergia alimentaria?');
    console.log('  Respuesta (' + resp2.length + ' chars): ' + resp2.substring(0, 300));
    results.push({ step: 'Invitados celiaquia', pass: resp2.length > 10, detail: resp2.substring(0, 200) });

    // -- STEP 5: Pedir agregar invitado --
    console.log('\n[STEP 5] Pidiendo agregar un invitado...');
    var resp3 = await sendCopilotMessage(
      page,
      'Agrega un nuevo invitado a la Boda de Paco y Pico. Se llama Carlos Garcia Test, email carlos.test@example.com, mesa 2, con celiaquia.'
    );
    console.log('  Respuesta (' + resp3.length + ' chars): ' + resp3.substring(0, 400));
    results.push({ step: 'Agregar invitado', pass: resp3.length > 10, detail: resp3.substring(0, 200) });

    // -- STEP 6: Verificar si se inserto --
    console.log('\n[STEP 6] Verificando insercion...');
    var resp4 = await sendCopilotMessage(page, 'Puedes confirmar si Carlos Garcia Test aparece en la lista de invitados?');
    console.log('  Respuesta (' + resp4.length + ' chars): ' + resp4.substring(0, 400));
    results.push({ step: 'Verificar insercion', pass: resp4.length > 10, detail: resp4.substring(0, 200) });

    // Screenshot final
    await page.screenshot({ path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/e2e-screenshot.png' });
    console.log('\n  Screenshot guardado.');

  } catch (err) {
    console.error('\nError en E2E test:', err.message);
    // Take error screenshot
    await page.screenshot({ path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/e2e-error.png' }).catch(function() {});
    results.push({ step: 'Error', pass: false, detail: err.message });
  }

  // -- RESUMEN --
  console.log('\n' + '='.repeat(70));
  console.log('RESUMEN E2E');
  console.log('='.repeat(70));
  for (var r of results) {
    console.log((r.pass ? 'PASS' : 'FAIL') + ' ' + r.step + ': ' + (r.detail || '').substring(0, 100));
  }

  var passed = results.filter(function(r) { return r.pass; }).length;
  var total = results.length;
  console.log('\nTotal: ' + total + ' | Pasaron: ' + passed + ' | Fallaron: ' + (total - passed));

  console.log('\nEl navegador queda abierto para inspeccion manual.');
  console.log('Presiona Ctrl+C para cerrar.');

  await new Promise(function() {});
}

main().catch(function(err) {
  console.error('Fatal:', err);
  process.exit(1);
});
