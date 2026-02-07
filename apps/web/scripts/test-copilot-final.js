#!/usr/bin/env node

/**
 * TEST FINAL - Copilot en localhost:8080 con preguntas reales
 */

const { chromium } = require('playwright');

const URL = 'http://localhost:8080';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/copilot-final-${name}.png`;
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
  console.log('TEST FINAL - COPILOT CON PREGUNTAS REALES');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('[PASO 1] Login...');
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      await page.evaluate(([email, pass]) => {
        function setNativeValue(element, value) {
          const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
          if (valueSetter) { valueSetter.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); }
        }
        const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input[name="email"]');
        const passInput = document.querySelector('input[type="password"]');
        if (emailInput) setNativeValue(emailInput, email);
        if (passInput) setNativeValue(passInput, pass);
      }, [USER_EMAIL, USER_PASSWORD]);

      await page.waitForTimeout(500);
      await page.evaluate(() => { const btn = document.querySelector('button[type="submit"]'); if (btn) btn.click(); });
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
      console.log('  ✅ Login completado');
    }

    await page.waitForTimeout(5000);

    console.log('\n[PASO 2] Abriendo Copilot...');
    await page.evaluate(() => { const btns = Array.from(document.querySelectorAll('button, a, [role="button"]')); const btn = btns.find(b => b.textContent?.trim() === 'Copilot'); if (btn) btn.click(); });
    await page.waitForTimeout(5000);

    console.log('\n[PASO 3] Esperando iframe (60s)...');
    for (let i = 15; i <= 60; i += 15) { await page.waitForTimeout(15000); console.log(`  ${i}s...`); }

    console.log('  ✅ Iframe listo\n');

    const questions = ['¿Cuántos invitados tengo?', '¿Cuál es la boda de Raul?', 'Muéstrame la lista de todas las bodas'];
    const results = [];

    for (let i = 0; i < questions.length; i++) {
      const success = await askQuestion(page, questions[i], i + 1);
      results.push({ question: questions[i], success });
      if (i < questions.length - 1) { console.log('\n⏸️  Pausa 10s...\n'); await page.waitForTimeout(10000); }
    }

    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN');
    console.log('='.repeat(70));
    results.forEach((r, i) => { console.log(`${i + 1}. ${r.success ? '✅' : '❌'} ${r.question}`); });
    console.log('='.repeat(70));

    console.log('\n✅ TEST COMPLETADO\n');
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await new Promise(() => {});
  }
})();
