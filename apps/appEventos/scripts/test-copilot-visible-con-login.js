#!/usr/bin/env node

/**
 * TEST COPILOT - Con más tiempo y force clicks
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'bodasdehoy.com@gmail.com';
const USER_PASSWORD = 'lorca2012M*+';

async function screenshot(page, name) {
  const path = `/tmp/copilot-login-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
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
    return false;
  }
}

(async () => {
  console.log('======================================================================');
  console.log('TEST COPILOT - LOGIN FORZADO CON NAVEGADOR VISIBLE');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Auth]') || text.includes('error')) {
      console.log(`  [CONSOLE] ${text}`);
    }
  });

  try {
    console.log('[PASO 1] Navegando a /login...');
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('  ✅ Página cargada (domcontentloaded)');

    console.log('\n[PASO 2] Esperando 10 segundos para que cargue todo...');
    await page.waitForTimeout(10000);
    await screenshot(page, '01-login-page');

    console.log('\n[PASO 3] Intentando llenar formulario (con force)...');
    console.log(`  Email: ${USER_EMAIL}`);

    // Intentar interactuar CON FORCE ignorando overlays
    try {
      await page.fill('input[type="email"]', USER_EMAIL, { timeout: 5000 });
      console.log('  ✅ Email llenado');
    } catch (e) {
      console.log('  ⚠️  No pudo llenar email normalmente, intentando con force...');
      await page.evaluate((email) => {
        const input = document.querySelector('input[type="email"]');
        if (input) {
          input.value = email;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, USER_EMAIL);
    }

    await page.waitForTimeout(1000);

    try {
      await page.fill('input[type="password"]', USER_PASSWORD, { timeout: 5000 });
      console.log('  ✅ Password llenado');
    } catch (e) {
      console.log('  ⚠️  No pudo llenar password normalmente, intentando con force...');
      await page.evaluate((pass) => {
        const input = document.querySelector('input[type="password"]');
        if (input) {
          input.value = pass;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, USER_PASSWORD);
    }

    await page.waitForTimeout(1000);
    await screenshot(page, '02-form-filled');

    console.log('\n[PASO 4] Enviando formulario (con force)...');
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });

    console.log('  ⏳ Esperando redirección (60s)...');
    try {
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 60000 });
      console.log('  ✅ Redirigido a:', page.url());
    } catch (e) {
      console.log('  ⚠️  Timeout en redirección, verificando URL actual...');
      console.log('  URL actual:', page.url());
      if (page.url().includes('/login')) {
        console.log('  ❌ Aún en /login, el login falló');
        throw new Error('Login falló');
      }
    }

    await screenshot(page, '03-after-login');

    console.log('\n[PASO 5] Esperando 20 segundos para que cargue homepage...');
    await page.waitForTimeout(20000);
    await screenshot(page, '04-homepage');

    console.log('\n[PASO 6] Abriendo Copilot...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) {
        console.log('[TEST] Copilot button found, clicking...');
        btn.click();
      } else {
        console.log('[TEST] Copilot button NOT found');
      }
    });
    await page.waitForTimeout(5000);
    await screenshot(page, '05-copilot-opened');

    console.log('\n[PASO 7] Esperando iframe (60s)...');
    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }
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

    console.log('\n📸 Capturas en /tmp/copilot-login-*.png');

    console.log('\n' + '='.repeat(70));
    console.log('🖥️  NAVEGADOR PERMANECE ABIERTO');
    console.log('='.repeat(70));
    console.log('\n👉 Presiona Ctrl+C para cerrar el navegador');
    console.log('='.repeat(70));

    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('\n🖥️  NAVEGADOR ABIERTO');
    console.log('👉 Presiona Ctrl+C para cerrar');
    await new Promise(() => {});
  }
})();
