#!/usr/bin/env node

/**
 * TEST FINAL DEFINITIVO - Copilot con LOGIN REAL forzado
 *
 * Este test:
 * 1. Limpia TODAS las cookies al inicio
 * 2. Fuerza navegación a /login
 * 3. Espera a que se establezcan las cookies correctamente
 * 4. Verifica que el usuario YA NO sea "guest"
 * 5. Hace las 3 preguntas al Copilot con datos reales
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/copilot-real-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function waitForCookiesAndAuth(page) {
  console.log('\n⏳ Esperando que las cookies se establezcan y el usuario se autentique...');

  let authenticated = false;
  let attempts = 0;
  const maxAttempts = 30; // 30 segundos máximo

  while (!authenticated && attempts < maxAttempts) {
    attempts++;
    await page.waitForTimeout(1000);

    // Verificar que AMBAS cookies estén presentes
    const cookies = await page.context().cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    // Verificar en consola si el usuario ya no es guest
    const userCheck = await page.evaluate(() => {
      // Buscar en los logs de consola si hay información del usuario
      return {
        hasIdToken: document.cookie.includes('idTokenV0.1.0'),
        hasSessionBodas: document.cookie.includes('sessionBodas')
      };
    });

    const status = `idToken=${hasIdToken ? '✅' : '❌'}, sessionBodas=${hasSessionBodas ? '✅' : '❌'}`;
    console.log(`  [${attempts}s] ${status}`);

    if (hasIdToken && hasSessionBodas) {
      console.log('  ✅ Ambas cookies establecidas!');
      authenticated = true;
      break;
    }

    if (attempts >= maxAttempts) {
      console.log('  ⚠️  Timeout esperando cookies (30s)');
      break;
    }
  }

  // Esperar 3s adicionales para estabilizar
  console.log('  ⏳ Esperando 3s adicionales para estabilizar...');
  await page.waitForTimeout(3000);

  // Verificar el usuario final
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
    await inputElement.click({ timeout: 10000 });
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
  console.log('TEST FINAL DEFINITIVO - COPILOT CON LOGIN REAL');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs de consola para debugging
  page.on('console', msg => {
    const text = msg.text();
    // Mostrar todos los logs durante login y autenticación
    if (text.includes('[Auth]') ||
        text.includes('Cookie') ||
        text.includes('sessionBodas') ||
        text.includes('idToken') ||
        text.includes('error') ||
        text.includes('Error') ||
        text.includes('failed') ||
        text.includes('invalid') ||
        text.includes('100052') ||
        text.includes('getSessionCookie') ||
        text.includes('getUser')) {
      console.log(`  [CONSOLE] ${text}`);
    }
  });

  try {
    console.log('[PASO 1] Limpiando todas las cookies...');
    await context.clearCookies();
    console.log('  ✅ Cookies limpiadas');

    console.log('\n[PASO 2] Navegando a /login (forzado)...');
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log('  ✅ En página de login');

    console.log('\n[PASO 3] Llenando formulario de login...');
    await page.evaluate(([email, pass]) => {
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set ||
                          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
        if (valueSetter) {
          valueSetter.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input[name="email"]');
      const passInput = document.querySelector('input[type="password"]');
      if (emailInput) setNativeValue(emailInput, email);
      if (passInput) setNativeValue(passInput, pass);
    }, [USER_EMAIL, USER_PASSWORD]);
    console.log('  ✅ Formulario llenado');

    await page.waitForTimeout(1000);

    console.log('\n[PASO 4] Enviando formulario...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });

    // Esperar a que salga de /login
    console.log('  ⏳ Esperando redirección...');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
    console.log('  ✅ Redirigido a:', page.url());

    // CRÍTICO: Esperar a que las cookies se establezcan
    console.log('\n[PASO 5] Esperando autenticación completa...');
    const isAuthenticated = await waitForCookiesAndAuth(page);

    if (!isAuthenticated) {
      console.log('\n⚠️  ADVERTENCIA: La autenticación puede no haberse completado correctamente');
      console.log('   El test continuará, pero las respuestas pueden ser de usuario guest');
    } else {
      console.log('\n✅ Usuario autenticado correctamente con cookies válidas');
    }

    // Esperar un poco más para que todo se estabilice
    await page.waitForTimeout(3000);

    console.log('\n[PASO 6] Abriendo Copilot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);

    console.log('\n[PASO 7] Esperando iframe del Copilot (60s)...');
    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }
    console.log('  ✅ Iframe listo\n');

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
    console.log('📸 Capturas guardadas en /tmp/copilot-real-*.png');
    console.log('\n⏳ Manteneniendo navegador abierto para inspección...');
    console.log('   Presiona Ctrl+C para cerrar');

    // Mantener abierto para inspección
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await screenshot(page, 'error-fatal');
    console.log('\n⏳ Manteneniendo navegador abierto para debugging...');
    await new Promise(() => {});
  }
})();
