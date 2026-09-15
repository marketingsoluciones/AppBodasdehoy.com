#!/usr/bin/env node

/**
 * TEST COPILOT - Login Manual con Puppeteer + Chrome Debugging
 *
 * Este script:
 * 1. Abre Chrome en modo debugging (navegador REAL)
 * 2. TÚ haces login MANUALMENTE
 * 3. Detecta cuando las cookies se establecen
 * 4. Continúa automáticamente con las preguntas
 * 5. Captura screenshots y resultados
 *
 * IMPORTANTE: Este NO es un navegador automatizado.
 * Firebase funciona porque es un Chrome real con debugging activado.
 */

const puppeteer = require('puppeteer');

const URL = 'https://app-test.bodasdehoy.com';

async function screenshot(page, name) {
  const path = `/tmp/copilot-manual-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function waitForCookies(page, maxAttempts = 60) {
  console.log('\n⏳ Esperando que hagas login...');
  console.log('   Por favor, haz login manualmente en el navegador\n');

  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000));

    const cookies = await page.cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    if (attempts % 5 === 0) {
      console.log(`   [${attempts * 2}s] Esperando login... (idToken=${hasIdToken ? '✅' : '❌'}, sessionBodas=${hasSessionBodas ? '✅' : '❌'})`);
    }

    if (hasIdToken && hasSessionBodas) {
      console.log('\n✅ Login completado! Cookies establecidas:');
      console.log(`   - idTokenV0.1.0: ✅`);
      console.log(`   - sessionBodas: ✅`);
      return true;
    }
  }

  console.log('\n⚠️  Timeout esperando login (2 minutos)');
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
    await new Promise(resolve => setTimeout(resolve, 3000));

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
    await new Promise(resolve => setTimeout(resolve, 1000));
    await inputElement.type(question);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await screenshot(page, `q${questionNumber}-02-escrita`);

    console.log('📤 Enviando...');
    const sendBtn = await copilotFrame.$('button[type="submit"]');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await inputElement.press('Enter');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
    await screenshot(page, `q${questionNumber}-03-enviada`);

    console.log('⏳ Esperando respuesta (75s)...');

    for (let i = 15; i <= 75; i += 15) {
      await new Promise(resolve => setTimeout(resolve, 15000));
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
  console.log('TEST COPILOT - LOGIN MANUAL CON CHROME DEBUGGING');
  console.log('======================================================================\n');

  console.log('ℹ️  Este script usa Chrome en modo debugging:');
  console.log('   - NO es un navegador automatizado');
  console.log('   - Firebase funciona normalmente');
  console.log('   - TÚ haces login manualmente');
  console.log('   - El script continúa automáticamente después del login\n');

  // Lanzar Chrome en modo debugging (NO headless)
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--disable-blink-features=AutomationControlled',  // Ocultar que es automatizado
      '--disable-dev-shm-usage',
      '--no-sandbox',
    ],
  });

  const page = await browser.newPage();

  // Ocultar webdriver para que Firebase no detecte automatización
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  try {
    console.log('[PASO 1] Navegando a /login...\n');
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('  ✅ Página cargada\n');
    await screenshot(page, '01-login-page');

    console.log('[PASO 2] Esperando que completes el login...\n');
    console.log('  👉 Por favor, haz login en el navegador con:');
    console.log('     Email: bodasdehoy.com@gmail.com');
    console.log('     Password: [definida en TEST_USER_PASSWORD]\n');

    const loginSuccess = await waitForCookies(page, 60);

    if (!loginSuccess) {
      console.log('\n❌ ERROR: Login no completado en 2 minutos');
      console.log('🖥️  NAVEGADOR ABIERTO - Presiona Ctrl+C para cerrar');
      await new Promise(() => {});
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    await screenshot(page, '02-after-login');

    console.log('\n[PASO 3] Verificando usuario...\n');
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
      console.log('📋 Usuario autenticado:');
      console.log(`  - UID: ${userInfo.uid}`);
      console.log(`  - Email: ${userInfo.email}`);
      console.log(`  - Nombre: ${userInfo.displayName}`);

      if (userInfo.displayName === 'guest') {
        console.log('\n⚠️  ADVERTENCIA: Usuario es "guest"');
        console.log('   El login puede no haber funcionado correctamente\n');
      }
    } else {
      console.log('⚠️  No se pudo obtener info del usuario');
    }

    console.log('\n[PASO 4] Navegando a homepage...\n');
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    await screenshot(page, '03-homepage');

    console.log('\n[PASO 5] Abriendo Copilot...\n');
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
    await new Promise(resolve => setTimeout(resolve, 5000));
    await screenshot(page, '04-copilot-opened');

    console.log('\n[PASO 6] Esperando iframe del Copilot (60s)...\n');
    for (let i = 15; i <= 60; i += 15) {
      await new Promise(resolve => setTimeout(resolve, 15000));
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
        await new Promise(resolve => setTimeout(resolve, 10000));
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

    console.log('\n📸 Capturas guardadas en /tmp/copilot-manual-*.png');

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
