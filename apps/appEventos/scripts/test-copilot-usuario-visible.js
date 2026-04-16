#!/usr/bin/env node

/**
 * TEST COPILOT - Login automático con navegador VISIBLE
 *
 * Este test:
 * 1. Hace login automáticamente con credenciales reales
 * 2. Mantiene el navegador VISIBLE todo el tiempo
 * 3. Hace las 3 preguntas automáticamente
 * 4. MANTIENE EL NAVEGADOR ABIERTO al final
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'bodasdehoy.com@gmail.com';
const USER_PASSWORD = 'lorca2012M*+';

async function screenshot(page, name) {
  const path = `/tmp/copilot-visible-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function waitForLoadingToDisappear(page, timeout = 30000) {
  console.log('  ⏳ Esperando que el loading desaparezca...');

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const hasLoading = await page.evaluate(() => {
      const loadingDiv = document.querySelector('.font-display.fixed.top-0.left-0.w-full.h-screen.z-50.bg-white');
      if (!loadingDiv) return false;

      const style = window.getComputedStyle(loadingDiv);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });

    if (!hasLoading) {
      console.log('  ✅ Loading desapareció');
      return true;
    }

    await page.waitForTimeout(500);
  }

  console.log('  ⚠️  Loading aún visible, pero continuando...');
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
  console.log('TEST COPILOT - LOGIN AUTOMÁTICO CON NAVEGADOR VISIBLE');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Auth]') || text.includes('Cookie') || text.includes('error')) {
      console.log(`  [CONSOLE] ${text}`);
    }
  });

  try {
    console.log('[PASO 1] Navegando a /login...');
    await page.goto(`${URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-login-page');
    console.log('  ✅ Página cargada');

    console.log('\n[PASO 2] Haciendo login automáticamente...');
    console.log(`  Email: ${USER_EMAIL}`);

    // Esperar a que el formulario esté listo
    await page.waitForTimeout(2000);

    // Llenar formulario de forma natural
    await page.click('input[type="email"]');
    await page.type('input[type="email"]', USER_EMAIL, { delay: 50 });
    await page.waitForTimeout(300);

    await page.click('input[type="password"]');
    await page.type('input[type="password"]', USER_PASSWORD, { delay: 50 });
    await page.waitForTimeout(500);

    await screenshot(page, '02-form-filled');
    console.log('  ✅ Formulario llenado');

    console.log('\n[PASO 3] Enviando formulario...');
    await page.click('button[type="submit"]');

    // Esperar redirección
    console.log('  ⏳ Esperando redirección...');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
    console.log('  ✅ Redirigido a:', page.url());

    await screenshot(page, '03-after-login');

    // Esperar a que cargue
    console.log('\n[PASO 4] Esperando que la página cargue...');
    await page.waitForTimeout(10000);
    await waitForLoadingToDisappear(page, 60000);
    await screenshot(page, '04-homepage');

    console.log('\n[PASO 5] Abriendo Copilot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    await screenshot(page, '05-copilot-opened');

    console.log('\n[PASO 6] Esperando iframe del Copilot (60s)...');
    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }
    console.log('  ✅ Iframe listo\n');
    await screenshot(page, '06-iframe-ready');

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

    console.log('\n📸 Capturas guardadas en /tmp/copilot-visible-*.png');

    console.log('\n' + '='.repeat(70));
    console.log('🖥️  NAVEGADOR PERMANECE ABIERTO');
    console.log('='.repeat(70));
    console.log('\nPuedes:');
    console.log('  ✅ Ver las respuestas del Copilot en el navegador');
    console.log('  ✅ Hacer preguntas adicionales manualmente');
    console.log('  ✅ Verificar los datos mostrados');
    console.log('\n👉 Presiona Ctrl+C en esta terminal para CERRAR el navegador');
    console.log('='.repeat(70));

    // Mantener abierto indefinidamente
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
