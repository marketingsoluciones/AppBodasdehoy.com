#!/usr/bin/env node

/**
 * TEST MEJORADO - Login con interacción más natural
 *
 * Este test:
 * 1. Usa .type() en lugar de .fill() para simular escritura real
 * 2. Espera que Formik y React procesen los cambios
 * 3. Verifica que las cookies se establezcan antes de continuar
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/copilot-mejora-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function waitForCookiesAndAuth(page) {
  console.log('\n⏳ Esperando que las cookies se establezcan...');

  let authenticated = false;
  let attempts = 0;
  const maxAttempts = 45; // 45 segundos

  while (!authenticated && attempts < maxAttempts) {
    attempts++;
    await page.waitForTimeout(1000);

    const cookies = await page.context().cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    const status = `idToken=${hasIdToken ? '✅' : '❌'}, sessionBodas=${hasSessionBodas ? '✅' : '❌'}`;
    console.log(`  [${attempts}s] ${status}`);

    if (hasIdToken && hasSessionBodas) {
      console.log('  ✅ Ambas cookies establecidas!');
      authenticated = true;
      break;
    }

    if (attempts >= maxAttempts) {
      console.log('  ⚠️  Timeout esperando cookies (45s)');
      break;
    }
  }

  await page.waitForTimeout(3000);

  const finalCookies = await page.context().cookies();
  const idToken = finalCookies.find(c => c.name === 'idTokenV0.1.0');
  const sessionBodas = finalCookies.find(c => c.name === 'sessionBodas');

  console.log('\n📋 Estado Final de Autenticación:');
  console.log(`  - idTokenV0.1.0: ${idToken ? '✅ PRESENTE' : '❌ AUSENTE'}`);
  console.log(`  - sessionBodas: ${sessionBodas ? '✅ PRESENTE' : '❌ AUSENTE'}`);

  return authenticated;
}

async function askQuestion(page, question, questionNumber) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`PREGUNTA ${questionNumber}: "${question}"`);
  console.log('='.repeat(70));

  const frames = page.frames();
  const copilotFrame = frames.find(f => {
    const url = f.url();
    return url.includes('chat') || url.includes('copilot') || url.includes(':3210');
  });

  if (!copilotFrame) {
    console.log('❌ Frame del Copilot no encontrado');
    await screenshot(page, `q${questionNumber}-no-frame`);
    return false;
  }

  try {
    await page.waitForTimeout(3000);

    let inputElement = null;
    const selectors = ['[contenteditable="true"]', 'textarea', 'input[type="text"]'];

    for (const selector of selectors) {
      try {
        const element = await copilotFrame.$(selector);
        if (element && await element.isVisible()) {
          inputElement = element;
          console.log(`✅ Input encontrado con: ${selector}`);
          break;
        }
      } catch (e) {}
    }

    if (!inputElement) {
      console.log('❌ Input no encontrado');
      await screenshot(page, `q${questionNumber}-no-input`);
      return false;
    }

    await screenshot(page, `q${questionNumber}-01-antes`);

    console.log('⌨️  Escribiendo pregunta...');

    // Esperar a que el overlay desaparezca antes de hacer click
    console.log('  ⏳ Esperando que el loading overlay desaparezca...');
    await page.waitForTimeout(5000);

    // Verificar si hay overlay bloqueando
    const hasOverlay = await page.evaluate(() => {
      const overlays = document.querySelectorAll('[class*="z-50"]');
      return Array.from(overlays).some(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
    });

    if (hasOverlay) {
      console.log('  ⚠️  Overlay todavía visible, esperando más...');
      await page.waitForTimeout(10000);
    }

    await inputElement.click({ timeout: 15000, force: true });
    await page.waitForTimeout(1000);
    await inputElement.fill(question);
    await page.waitForTimeout(2000);
    await screenshot(page, `q${questionNumber}-02-escrita`);

    console.log('📤 Enviando...');
    const sendBtn = await copilotFrame.$('button[type="submit"]');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await inputElement.press('Enter');
    }

    await page.waitForTimeout(3000);
    await screenshot(page, `q${questionNumber}-03-enviada`);

    console.log('⏳ Esperando respuesta (75s)...');

    for (let i = 15; i <= 75; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`   ${i}s...`);
      if (i === 75) await screenshot(page, `q${questionNumber}-04-respuesta`);
    }

    console.log('✅ Respuesta capturada');
    return true;

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    await screenshot(page, `q${questionNumber}-error`);
    return false;
  }
}

(async () => {
  console.log('======================================================================');
  console.log('TEST MEJORADO - LOGIN CON INTERACCIÓN NATURAL');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  // Inyectar script para ocultar webdriver
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  // Capturar logs de consola
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Auth]') ||
        text.includes('Cookie') ||
        text.includes('sessionBodas') ||
        text.includes('idToken') ||
        text.includes('error') ||
        text.includes('Error') ||
        text.includes('failed')) {
      console.log(`  [CONSOLE] ${text}`);
    }
  });

  try {
    console.log('[PASO 1] Limpiando todas las cookies...');
    await context.clearCookies();
    console.log('  ✅ Cookies limpiadas');

    console.log('\n[PASO 2] Navegando a /login...');
    await page.goto(`${URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-login-page');
    console.log('  ✅ En página de login');

    console.log('\n[PASO 3] Interactuando con el formulario...');

    // Esperar a que el formulario esté listo
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('  ✅ Formulario visible');

    // Click en el campo de email para enfocarlo
    await page.click('input[type="email"]');
    await page.waitForTimeout(500);

    // Escribir email letra por letra (más natural)
    console.log('  ⌨️  Escribiendo email...');
    await page.type('input[type="email"]', USER_EMAIL, { delay: 50 });
    await page.waitForTimeout(500);

    // Click en el campo de password para enfocarlo
    await page.click('input[type="password"]');
    await page.waitForTimeout(500);

    // Escribir password letra por letra
    console.log('  ⌨️  Escribiendo password...');
    await page.type('input[type="password"]', USER_PASSWORD, { delay: 50 });
    await page.waitForTimeout(1000);

    await screenshot(page, '02-form-filled');
    console.log('  ✅ Formulario llenado de forma natural');

    console.log('\n[PASO 4] Enviando formulario...');
    await screenshot(page, '03-before-submit');

    // Click en el botón de submit
    await page.click('button[type="submit"]');
    console.log('  ✅ Botón clicked');

    // Esperar redirección
    console.log('  ⏳ Esperando redirección...');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
    console.log('  ✅ Redirigido a:', page.url());

    await screenshot(page, '04-after-redirect');

    // CRÍTICO: Esperar a que las cookies se establezcan
    console.log('\n[PASO 5] Esperando autenticación completa...');
    const isAuthenticated = await waitForCookiesAndAuth(page);

    if (!isAuthenticated) {
      console.log('\n⚠️  ADVERTENCIA: La autenticación no se completó correctamente');
      console.log('   Capturando estado para debugging...');
      await screenshot(page, '05-auth-failed');

      // Verificar qué usuario está logueado
      const userInfo = await page.evaluate(() => {
        return {
          cookies: document.cookie,
          localStorage: Object.keys(localStorage).reduce((acc, key) => {
            acc[key] = localStorage.getItem(key);
            return acc;
          }, {})
        };
      });

      console.log('\n📋 Debug Info:');
      console.log('  Cookies:', userInfo.cookies.substring(0, 200) + '...');
      console.log('  LocalStorage keys:', Object.keys(userInfo.localStorage));

      console.log('\n❌ El test no puede continuar sin autenticación válida');
      console.log('⏳ Manteniendo navegador abierto para inspección manual...');
      console.log('   Presiona Ctrl+C para cerrar');
      await new Promise(() => {});
    }

    console.log('\n✅ Usuario autenticado correctamente');
    await page.waitForTimeout(5000);

    console.log('\n[PASO 6] Abriendo Copilot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    await screenshot(page, '06-copilot-opened');

    console.log('\n[PASO 7] Esperando iframe del Copilot (60s)...');
    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }
    console.log('  ✅ Iframe listo\n');
    await screenshot(page, '07-iframe-ready');

    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];
    const results = [];

    for (let i = 0; i < questions.length; i++) {
      const success = await askQuestion(page, questions[i], i + 1);
      results.push({ question: questions[i], success });
      if (i < questions.length - 1) {
        console.log('\n⏸️  Pausa 10s...\n');
        await page.waitForTimeout(10000);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN');
    console.log('='.repeat(70));
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.success ? '✅' : '❌'} ${r.question}`);
    });
    console.log('='.repeat(70));

    console.log('\n✅ TEST COMPLETADO\n');
    console.log('📸 Capturas guardadas en /tmp/copilot-mejora-*.png');
    console.log('\n⏳ Manteniendo navegador abierto para inspección...');
    console.log('   Presiona Ctrl+C para cerrar');

    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await screenshot(page, 'error-fatal');
    console.log('\n⏳ Manteniendo navegador abierto para debugging...');
    await new Promise(() => {});
  }
})();
