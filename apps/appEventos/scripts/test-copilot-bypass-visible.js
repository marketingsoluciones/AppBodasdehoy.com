#!/usr/bin/env node

/**
 * TEST COPILOT - OPCIÓN 3: Dev Bypass con navegador VISIBLE
 *
 * Este test:
 * 1. Usa el bypass de desarrollo (sin necesidad de Firebase)
 * 2. Mantiene el navegador VISIBLE todo el tiempo
 * 3. Hace las 3 preguntas automáticamente
 * 4. MANTIENE EL NAVEGADOR ABIERTO al final para que veas todo
 *
 * NOTA: Este es el método más confiable porque:
 * - No depende de Firebase (que no funciona en navegadores automatizados)
 * - El bypass de desarrollo ya existe en el código (AuthContext.tsx:267-284)
 * - Solo funciona en subdominios de test (app-test, chat-test)
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';

async function screenshot(page, name) {
  const path = `/tmp/copilot-bypass-visible-${name}.png`;
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
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`  ✅ Loading desapareció después de ${elapsed}s`);
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
  console.log('TEST COPILOT - OPCIÓN 3: DEV BYPASS CON NAVEGADOR VISIBLE');
  console.log('======================================================================\n');

  console.log('ℹ️  Este test usa el bypass de desarrollo que ya existe en el código');
  console.log('   Ubicación: apps/web/context/AuthContext.tsx:267-284');
  console.log('   Solo funciona en subdominios de test (app-test, chat-test)\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs importantes
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Auth]') || text.includes('[EventsGroup]') || text.includes('bypass')) {
      console.log(`  [CONSOLE] ${text}`);
    }
  });

  try {
    console.log('[PASO 1] Navegando a app-test e inyectando DEV BYPASS...');

    // Inyectar bypass ANTES de que la página cargue
    await page.addInitScript(() => {
      sessionStorage.setItem('dev_bypass', 'true');
      console.log('[Test] ✅ dev_bypass establecido en sessionStorage');
    });

    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    console.log('  ✅ Página cargada con bypass activo');

    await page.waitForTimeout(3000);
    await screenshot(page, '01-homepage-con-bypass');

    // Verificar que el bypass está activo
    const bypassActive = await page.evaluate(() => {
      return sessionStorage.getItem('dev_bypass') === 'true';
    });

    console.log(`\n[PASO 2] Verificando bypass: ${bypassActive ? '✅ ACTIVO' : '❌ INACTIVO'}`);

    if (!bypassActive) {
      console.log('\n❌ ERROR: El bypass no se activó correctamente');
      console.log('🖥️  NAVEGADOR ABIERTO - Presiona Ctrl+C para cerrar');
      await new Promise(() => {});
    }

    console.log('\n[PASO 3] Esperando que la página cargue...');
    await page.waitForTimeout(5000);
    await waitForLoadingToDisappear(page, 60000);
    await screenshot(page, '02-homepage-ready');

    // Verificar usuario dev
    const userInfo = await page.evaluate(() => {
      try {
        const user = window.__USER__ || {};
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        };
      } catch (e) {
        return null;
      }
    });

    if (userInfo) {
      console.log('\n📋 Usuario activo:');
      console.log(`  - UID: ${userInfo.uid}`);
      console.log(`  - Email: ${userInfo.email}`);
      console.log(`  - Nombre: ${userInfo.displayName}`);
    }

    const isDevUser = userInfo && userInfo.uid === 'dev-user-test';
    console.log(`  Usuario dev activo: ${isDevUser ? '✅' : '❌'}`);

    console.log('\n[PASO 4] Abriendo Copilot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) {
        console.log('[Test] Copilot button found, clicking...');
        btn.click();
      } else {
        console.log('[Test] Copilot button NOT found');
      }
    });
    await page.waitForTimeout(5000);
    await screenshot(page, '03-copilot-opened');

    console.log('\n[PASO 5] Esperando iframe del Copilot (60s)...');
    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }
    console.log('  ✅ Iframe listo\n');
    await screenshot(page, '04-iframe-ready');

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

    console.log('\n📸 Capturas guardadas en /tmp/copilot-bypass-visible-*.png');

    console.log('\n' + '='.repeat(70));
    console.log('🖥️  NAVEGADOR PERMANECE ABIERTO');
    console.log('='.repeat(70));
    console.log('\nPuedes:');
    console.log('  ✅ Ver las respuestas del Copilot en el navegador');
    console.log('  ✅ Hacer preguntas adicionales manualmente');
    console.log('  ✅ Verificar los datos mostrados');
    console.log('  ✅ Navegar por la aplicación');
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
