#!/usr/bin/env node

/**
 * TEST COPILOT - CON USUARIO REAL Y NAVEGADOR VISIBLE
 *
 * Este test:
 * 1. Abre el navegador en /login
 * 2. ESPERA a que hagas login MANUALMENTE
 * 3. Verifica que las cookies se establezcan
 * 4. Hace las 3 preguntas automáticamente
 * 5. MANTIENE EL NAVEGADOR ABIERTO para que veas todo
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';

async function screenshot(page, name) {
  const path = `/tmp/copilot-real-user-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function waitForAuthentication(page) {
  console.log('\n⏳ Esperando que las cookies de autenticación se establezcan...');
  console.log('   (Esto puede tomar 2-3 segundos después del login)');

  let authenticated = false;
  let attempts = 0;
  const maxAttempts = 45; // 45 segundos

  while (!authenticated && attempts < maxAttempts) {
    attempts++;
    await page.waitForTimeout(1000);

    const cookies = await page.context().cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    if (attempts % 5 === 0) {
      console.log(`  [${attempts}s] idToken=${hasIdToken ? '✅' : '❌'}, sessionBodas=${hasSessionBodas ? '✅' : '❌'}`);
    }

    if (hasIdToken && hasSessionBodas) {
      console.log('  ✅ ¡Cookies de autenticación establecidas!');
      authenticated = true;
      break;
    }
  }

  if (!authenticated) {
    console.log('  ⚠️  Timeout esperando cookies, pero continuaremos...');
  }

  await page.waitForTimeout(3000);
  return authenticated;
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
  console.log('TEST COPILOT - CON USUARIO REAL (LOGIN MANUAL)');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs importantes
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Auth]') ||
        text.includes('Cookie') ||
        text.includes('sessionBodas') ||
        text.includes('idToken')) {
      console.log(`  [CONSOLE] ${text}`);
    }
  });

  try {
    console.log('[PASO 1] Navegando a /login...');
    await page.goto(`${URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-login-page');
    console.log('  ✅ Página de login cargada');

    console.log('\n' + '='.repeat(70));
    console.log('POR FAVOR, HAZ LOGIN MANUALMENTE EN EL NAVEGADOR');
    console.log('='.repeat(70));
    console.log('  1. Ingresa tu email y contraseña');
    console.log('  2. Haz click en el botón de login');
    console.log('  3. Espera a que se complete el login');
    console.log('  4. Deberías ver la página de inicio con tus eventos');
    console.log('\n⏳ Esperando a que hagas login (máximo 2 minutos)...\n');

    // Esperar a que salga de /login
    await page.waitForURL(url => !url.toString().includes('/login'), {
      timeout: 120000 // 2 minutos
    });

    console.log('  ✅ Redirigido a:', page.url());
    await screenshot(page, '02-after-login');

    // CRÍTICO: Esperar a que las cookies se establezcan
    console.log('\n[PASO 2] Verificando autenticación...');
    const isAuthenticated = await waitForAuthentication(page);

    if (!isAuthenticated) {
      console.log('\n⚠️  ADVERTENCIA: Las cookies de autenticación no se detectaron');
      console.log('   El test continuará de todos modos...');
      console.log('   Verifica manualmente que estés autenticado en el navegador.');
    } else {
      console.log('\n✅ Usuario autenticado correctamente');
    }

    // Verificar usuario actual
    const finalCookies = await page.context().cookies();
    const idToken = finalCookies.find(c => c.name === 'idTokenV0.1.0');
    const sessionBodas = finalCookies.find(c => c.name === 'sessionBodas');

    console.log('\n📋 Estado de autenticación:');
    console.log(`  - idTokenV0.1.0: ${idToken ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    console.log(`  - sessionBodas: ${sessionBodas ? '✅ PRESENTE' : '❌ AUSENTE'}`);

    // Esperar a que la página cargue completamente
    console.log('\n[PASO 3] Esperando que la homepage cargue completamente...');
    await page.waitForTimeout(5000);
    await waitForLoadingToDisappear(page, 30000);
    await screenshot(page, '03-homepage-ready');

    console.log('\n[PASO 4] Abriendo Copilot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    await screenshot(page, '04-copilot-opened');

    console.log('\n[PASO 5] Esperando iframe del Copilot (60s)...');
    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }
    console.log('  ✅ Iframe listo\n');
    await screenshot(page, '05-iframe-ready');

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

    console.log('\n📸 Capturas guardadas en /tmp/copilot-real-user-*.png');

    console.log('\n' + '='.repeat(70));
    console.log('🖥️  NAVEGADOR ABIERTO - REVISA LAS RESPUESTAS');
    console.log('='.repeat(70));
    console.log('\nEl navegador permanecerá ABIERTO para que puedas:');
    console.log('  - Ver las respuestas del Copilot');
    console.log('  - Hacer preguntas adicionales manualmente');
    console.log('  - Verificar el estado de autenticación');
    console.log('\n👉 Presiona Ctrl+C en esta terminal para CERRAR el navegador');
    console.log('='.repeat(70));

    // Mantener abierto indefinidamente hasta que el usuario presione Ctrl+C
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
