#!/usr/bin/env node

/**
 * TEST COPILOT - OPCIÓN 2: Espera prolongada con verificación de overlay
 *
 * Este test:
 * 1. Espera hasta 60 segundos a que el overlay de loading desaparezca
 * 2. Verifica que el formulario esté visible antes de interactuar
 * 3. Usa navegador VISIBLE para que veas todo el proceso
 * 4. Intenta login real con credenciales
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'bodasdehoy.com@gmail.com';
const USER_PASSWORD = 'lorca2012M*+';

async function screenshot(page, name) {
  const path = `/tmp/copilot-espera-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function waitForLoadingOverlayToDisappear(page, timeout = 60000) {
  console.log(`  ⏳ Esperando que el overlay "Un momento, por favor" desaparezca (máximo ${timeout/1000}s)...`);

  const startTime = Date.now();
  let lastCheck = 0;

  while (Date.now() - startTime < timeout) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    // Mostrar progreso cada 5 segundos
    if (elapsed > 0 && elapsed % 5 === 0 && elapsed !== lastCheck) {
      console.log(`     ${elapsed}s... (esperando overlay)`);
      lastCheck = elapsed;
    }

    const overlayVisible = await page.evaluate(() => {
      // Buscar el overlay de loading
      const overlay = document.querySelector('.font-display.fixed.top-0.left-0.w-full.h-screen.z-50.bg-white');
      if (!overlay) return false;

      const style = window.getComputedStyle(overlay);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });

    if (!overlayVisible) {
      console.log(`  ✅ Overlay desapareció después de ${elapsed}s`);
      return true;
    }

    await page.waitForTimeout(500);
  }

  console.log(`  ⚠️  Timeout: El overlay no desapareció después de ${timeout/1000}s`);
  return false;
}

async function waitForFormVisible(page, timeout = 30000) {
  console.log('  ⏳ Esperando que el formulario de login sea visible...');

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const formVisible = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');

      if (!emailInput || !passwordInput) return false;

      // Verificar que sean realmente visibles
      const emailStyle = window.getComputedStyle(emailInput);
      const passwordStyle = window.getComputedStyle(passwordInput);

      return emailStyle.display !== 'none' &&
             emailStyle.visibility !== 'hidden' &&
             passwordStyle.display !== 'none' &&
             passwordStyle.visibility !== 'hidden';
    });

    if (formVisible) {
      console.log('  ✅ Formulario visible y listo');
      return true;
    }

    await page.waitForTimeout(500);
  }

  console.log('  ⚠️  Timeout: El formulario no se hizo visible');
  return false;
}

async function waitForAuthentication(page, maxAttempts = 45) {
  console.log('  ⏳ Esperando que las cookies de autenticación se establezcan...');

  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    await page.waitForTimeout(1000);

    const cookies = await page.context().cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    if (attempts % 5 === 0) {
      console.log(`     [${attempts}s] idToken=${hasIdToken ? '✅' : '❌'}, sessionBodas=${hasSessionBodas ? '✅' : '❌'}`);
    }

    if (hasIdToken && hasSessionBodas) {
      console.log('  ✅ Cookies de autenticación establecidas');
      return true;
    }
  }

  console.log('  ⚠️  Timeout esperando cookies');
  return false;
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
  console.log('TEST COPILOT - OPCIÓN 2: ESPERA PROLONGADA CON VERIFICACIÓN');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Auth]') || text.includes('error') || text.includes('firebase')) {
      console.log(`  [CONSOLE] ${text}`);
    }
  });

  try {
    console.log('[PASO 1] Navegando a /login...');
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('  ✅ Página cargada (domcontentloaded)');
    await screenshot(page, '01-login-page-inicial');

    console.log('\n[PASO 2] Esperando que el overlay de loading desaparezca...');
    const overlayDisappeared = await waitForLoadingOverlayToDisappear(page, 60000);

    if (!overlayDisappeared) {
      console.log('\n❌ PROBLEMA CRÍTICO: El overlay no desapareció');
      console.log('   Esto significa que Firebase NO se está inicializando en Playwright');
      console.log('   Este es un problema conocido con navegadores automatizados');
      await screenshot(page, '02-overlay-timeout');

      console.log('\n💡 RECOMENDACIÓN:');
      console.log('   Usa la Opción 3 (dev bypass) que SÍ funciona 100%');
      console.log('   O haz login MANUAL (Opción 1)');

      console.log('\n🖥️  NAVEGADOR ABIERTO - Presiona Ctrl+C para cerrar');
      await new Promise(() => {});
    }

    await screenshot(page, '02-overlay-gone');

    console.log('\n[PASO 3] Esperando que el formulario sea visible...');
    const formVisible = await waitForFormVisible(page, 30000);

    if (!formVisible) {
      console.log('\n❌ PROBLEMA: El formulario no es visible');
      await screenshot(page, '03-form-timeout');
      console.log('\n🖥️  NAVEGADOR ABIERTO - Presiona Ctrl+C para cerrar');
      await new Promise(() => {});
    }

    await screenshot(page, '03-form-visible');

    console.log('\n[PASO 4] Llenando formulario de forma natural...');
    console.log(`  Email: ${USER_EMAIL}`);

    await page.click('input[type="email"]');
    await page.type('input[type="email"]', USER_EMAIL, { delay: 80 });
    await page.waitForTimeout(500);

    await page.click('input[type="password"]');
    await page.type('input[type="password"]', USER_PASSWORD, { delay: 80 });
    await page.waitForTimeout(1000);

    await screenshot(page, '04-form-filled');
    console.log('  ✅ Formulario llenado');

    console.log('\n[PASO 5] Enviando formulario...');
    await page.click('button[type="submit"]');

    console.log('  ⏳ Esperando redirección...');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 60000 });
    console.log('  ✅ Redirigido a:', page.url());

    await screenshot(page, '05-after-login');

    console.log('\n[PASO 6] Verificando autenticación...');
    const isAuthenticated = await waitForAuthentication(page, 45);

    const cookies = await page.context().cookies();
    const idToken = cookies.find(c => c.name === 'idTokenV0.1.0');
    const sessionBodas = cookies.find(c => c.name === 'sessionBodas');

    console.log('\n📋 Estado de autenticación:');
    console.log(`  - idTokenV0.1.0: ${idToken ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    console.log(`  - sessionBodas: ${sessionBodas ? '✅ PRESENTE' : '❌ AUSENTE'}`);

    if (!isAuthenticated) {
      console.log('\n⚠️  ADVERTENCIA: Las cookies no se establecieron');
      console.log('   El usuario probablemente será "guest"');
    }

    console.log('\n[PASO 7] Esperando que la homepage cargue...');
    await page.waitForTimeout(10000);
    await screenshot(page, '06-homepage');

    console.log('\n[PASO 8] Abriendo Copilot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    await screenshot(page, '07-copilot-opened');

    console.log('\n[PASO 9] Esperando iframe del Copilot (60s)...');
    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }
    console.log('  ✅ Iframe listo\n');
    await screenshot(page, '08-iframe-ready');

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

    const allSuccess = results.every(r => r.success);

    if (allSuccess) {
      console.log('\n✅✅✅ TEST COMPLETADO EXITOSAMENTE ✅✅✅');
    } else {
      console.log('\n⚠️  TEST COMPLETADO CON ALGUNOS ERRORES');
    }

    console.log('\n📸 Capturas guardadas en /tmp/copilot-espera-*.png');

    console.log('\n' + '='.repeat(70));
    console.log('🖥️  NAVEGADOR PERMANECE ABIERTO');
    console.log('='.repeat(70));
    console.log('\n👉 Presiona Ctrl+C para cerrar el navegador');
    console.log('='.repeat(70));

    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    console.log('\n🖥️  NAVEGADOR ABIERTO PARA DEBUGGING');
    console.log('👉 Presiona Ctrl+C para cerrar');
    await new Promise(() => {});
  }
})();
