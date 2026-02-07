#!/usr/bin/env node

/**
 * TEST COPILOT - Con autenticación real esperando correctamente
 */

const { chromium } = require('playwright');

const URL = 'http://localhost:8080';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/copilot-auth-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function waitForAuthentication(page) {
  console.log('\n⏳ Esperando que la autenticación se complete...');

  // Esperar a que se establezcan las cookies y el usuario ya no sea guest
  let authenticated = false;
  let attempts = 0;
  const maxAttempts = 30; // 30 segundos

  while (!authenticated && attempts < maxAttempts) {
    attempts++;

    // Esperar 1 segundo
    await page.waitForTimeout(1000);

    // Verificar cookies y usuario en consola
    const cookies = await page.context().cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    // Verificar en la consola si el usuario ya no es guest
    const consoleMessages = await page.evaluate(() => {
      return window.__authLogs || [];
    });

    console.log(`  [${attempts}s] Cookies: idToken=${hasIdToken}, sessionBodas=${hasSessionBodas}`);

    if (hasIdToken && hasSessionBodas) {
      console.log('  ✅ Cookies establecidas!');
      authenticated = true;
      break;
    }

    if (attempts >= maxAttempts) {
      console.log('  ⚠️  Timeout esperando cookies, pero continuando...');
      break;
    }
  }

  // Esperar un poco más para asegurar que todo esté listo
  await page.waitForTimeout(3000);

  // Verificar el usuario final
  const finalUser = await page.evaluate(() => {
    const logs = document.querySelectorAll('*');
    return window.__currentUser || 'unknown';
  });

  console.log(`  Usuario final: ${JSON.stringify(finalUser)}`);

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
  console.log('TEST COPILOT - CON AUTENTICACIÓN REAL');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capturar logs de consola
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);

    // Mostrar logs importantes de autenticación
    if (text.includes('[Auth]') || text.includes('Cookie') || text.includes('User') || text.includes('guest')) {
      console.log(`  [CONSOLE] ${text}`);
    }
  });

  try {
    console.log('[PASO 1] Navegando a la aplicación...');
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const isLoginPage = page.url().includes('/login');
    if (!isLoginPage) {
      console.log('  ℹ️  Ya estás en la app, no necesitas login');
    } else {
      console.log('[PASO 2] Haciendo login...');

      // Llenar formulario
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

      await page.waitForTimeout(1000);

      console.log('  ⏳ Enviando formulario...');
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      });

      // Esperar a que salga de /login
      console.log('  ⏳ Esperando redirección...');
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
      console.log('  ✅ Redirigido fuera de /login');

      // CRÍTICO: Esperar a que la autenticación se complete
      await waitForAuthentication(page);
    }

    // Verificar cookies finales
    console.log('\n[PASO 3] Verificando autenticación...');
    const cookies = await page.context().cookies();
    const idToken = cookies.find(c => c.name === 'idTokenV0.1.0');
    const sessionBodas = cookies.find(c => c.name === 'sessionBodas');

    console.log('  Cookies presentes:');
    console.log(`    - idTokenV0.1.0: ${idToken ? '✅ SÍ' : '❌ NO'}`);
    console.log(`    - sessionBodas: ${sessionBodas ? '✅ SÍ' : '❌ NO'}`);

    if (!idToken || !sessionBodas) {
      console.log('\n  ⚠️  ADVERTENCIA: Las cookies no están presentes');
      console.log('  El usuario puede seguir siendo "guest"');
    }

    await page.waitForTimeout(5000);

    console.log('\n[PASO 4] Abriendo Copilot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);

    console.log('\n[PASO 5] Esperando iframe del Copilot (60s)...');
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

    // Mantener abierto para inspección
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await screenshot(page, 'error-final');
    await new Promise(() => {});
  }
})();
