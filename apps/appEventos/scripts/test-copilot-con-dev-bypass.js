#!/usr/bin/env node

/**
 * TEST COPILOT - Con DEV BYPASS
 *
 * Usa el bypass de desarrollo que ya existe en AuthContext.tsx
 * para subdominios de test (app-test.bodasdehoy.com)
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';

async function screenshot(page, name) {
  const path = `/tmp/copilot-bypass-${name}.png`;
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

  console.log('  ⚠️  Loading aún visible');
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
  console.log('TEST COPILOT - CON DEV BYPASS');
  console.log('======================================================================\n');

  let browser;
  let success = false;

  try {
    console.log('[PASO 1] Abriendo navegador...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 50
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Capturar logs importantes
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Auth]') || text.includes('Bypass') || text.includes('🔓')) {
        console.log(`  [CONSOLE] ${text}`);
      }
    });

    console.log('\n[PASO 2] Navegando e inyectando DEV BYPASS...');

    // CRÍTICO: Establecer el bypass ANTES de que la app se cargue
    await page.addInitScript(() => {
      sessionStorage.setItem('dev_bypass', 'true');
      console.log('[Test] ✅ dev_bypass establecido en sessionStorage');
    });

    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('  ✅ Página cargada con bypass activo');

    // Verificar que el bypass funcionó
    const bypassActive = await page.evaluate(() => {
      return sessionStorage.getItem('dev_bypass') === 'true';
    });

    console.log(`\n[PASO 3] Verificando bypass: ${bypassActive ? '✅ ACTIVO' : '❌ NO ACTIVO'}`);

    if (!bypassActive) {
      console.log('❌ El bypass no se activó correctamente');
      await browser.close();
      process.exit(1);
    }

    // Esperar a que la aplicación cargue con el usuario dev
    console.log('\n[PASO 4] Esperando que la página cargue...');
    await page.waitForTimeout(5000);
    await waitForLoadingToDisappear(page, 30000);
    await screenshot(page, '01-homepage');

    // Verificar el usuario actual
    const userInfo = await page.evaluate(() => {
      return {
        hasBypass: sessionStorage.getItem('dev_bypass') === 'true',
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          if (key.includes('user') || key.includes('auth')) {
            acc[key] = localStorage.getItem(key);
          }
          return acc;
        }, {})
      };
    });

    console.log('  Usuario dev activo:', userInfo.hasBypass ? '✅' : '❌');

    console.log('\n[PASO 5] Abriendo Copilot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    await screenshot(page, '02-copilot-opened');

    console.log('\n[PASO 6] Esperando iframe del Copilot (60s)...');
    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }
    console.log('  ✅ Iframe listo\n');
    await screenshot(page, '03-iframe-ready');

    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];
    const results = [];

    for (let i = 0; i < questions.length; i++) {
      const questionSuccess = await askQuestion(page, questions[i], i + 1);
      results.push({ question: questions[i], success: questionSuccess });
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

    success = results.every(r => r.success);

    if (success) {
      console.log('\n✅✅✅ TEST COMPLETADO EXITOSAMENTE ✅✅✅');
    } else {
      console.log('\n⚠️  TEST COMPLETADO CON ALGUNOS ERRORES');
    }

    console.log('\n📸 Capturas guardadas en /tmp/copilot-bypass-*.png');
    console.log('\n⏳ Manteniendo navegador abierto 10s para verificación...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  } finally {
    if (browser) {
      console.log('\n🔴 Cerrando navegador...');
      await browser.close();
      console.log('✅ Navegador cerrado');
    }

    process.exit(success ? 0 : 1);
  }
})();
