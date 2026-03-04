#!/usr/bin/env node

/**
 * TEST COPILOT - Conectar a Chrome REAL del Usuario
 *
 * Este script se CONECTA a tu Chrome normal (donde tienes MCP instalado)
 * en lugar de abrir un nuevo Chromium.
 *
 * PASOS:
 * 1. TÚ abres tu Chrome normal con debugging habilitado
 * 2. Este script se conecta a ese Chrome
 * 3. Puedes hacer login manualmente
 * 4. El script continúa automáticamente
 */

const puppeteer = require('puppeteer');

const URL = 'https://app-test.bodasdehoy.com';
const CDP_PORT = 9222; // Puerto de Chrome DevTools Protocol

async function screenshot(page, name) {
  const path = `/tmp/copilot-real-${name}.png`;
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
    await inputElement.click();
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
  console.log('TEST COPILOT - CONECTAR A CHROME REAL');
  console.log('======================================================================\n');

  console.log('📋 INSTRUCCIONES:');
  console.log('');
  console.log('1️⃣  PRIMERO, abre tu Chrome normal con debugging:');
  console.log('');
  console.log('   En macOS:');
  console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug');
  console.log('');
  console.log('   O simplemente ejecuta este comando en otra terminal:');
  console.log('   open -a "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug');
  console.log('');
  console.log('2️⃣  Luego, ejecuta ESTE script de nuevo');
  console.log('');
  console.log('3️⃣  El script se conectará a tu Chrome y podrás hacer login manualmente');
  console.log('');
  console.log('======================================================================\n');

  console.log('⏳ Intentando conectar a Chrome en puerto 9222...\n');

  try {
    // Intentar conectar a Chrome existente
    const browserURL = `http://localhost:${CDP_PORT}`;
    const browser = await puppeteer.connect({ browserURL });

    console.log('✅ ¡Conectado a Chrome exitosamente!\n');

    const pages = await browser.pages();
    let page = pages[0];

    if (!page) {
      page = await browser.newPage();
    }

    console.log('[PASO 1] Navegando a /login...\n');
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('  ✅ Página cargada\n');
    await screenshot(page, '01-login-page');

    console.log('[PASO 2] Esperando que completes el login...\n');
    console.log('  👉 Por favor, haz login en el navegador con:');
    console.log('     Email: bodasdehoy.com@gmail.com');
    console.log('     Password: lorca2012M*+\n');

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

    console.log('\n📸 Capturas guardadas en /tmp/copilot-real-*.png');

    console.log('\n' + '='.repeat(70));
    console.log('🖥️  NAVEGADOR PERMANECE ABIERTO');
    console.log('='.repeat(70));
    console.log('\nPuedes:');
    console.log('  ✅ Ver las respuestas del Copilot en el navegador');
    console.log('  ✅ Hacer preguntas adicionales manualmente');
    console.log('  ✅ Verificar los datos mostrados');
    console.log('  ✅ Navegar por la aplicación');
    console.log('\n👉 Presiona Ctrl+C en esta terminal para DESCONECTAR (Chrome seguirá abierto)');
    console.log('='.repeat(70));

    // Mantener conexión abierta
    await new Promise(() => {});

  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n❌ ERROR: No se pudo conectar a Chrome\n');
      console.log('Por favor, primero abre Chrome con debugging:');
      console.log('');
      console.log('En macOS, ejecuta en otra terminal:');
      console.log('open -a "Google Chrome" --args --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug');
      console.log('');
      console.log('Luego ejecuta este script de nuevo.');
    } else {
      console.error('\n❌ ERROR:', error.message);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
})();
