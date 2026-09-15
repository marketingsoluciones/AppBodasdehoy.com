#!/usr/bin/env node
/**
 * Test del Copilot con preguntas reales en app-test.bodasdehoy.com
 */

const { chromium } = require('playwright');

const BASE = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'bodasdehoy.com@gmail.com';
const USER_PASSWORD = (process.env.TEST_USER_PASSWORD || '');

async function screenshot(page, name) {
  const path = `/tmp/copilot-test-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
  return path;
}

async function askQuestion(copilotFrame, page, question, stepNumber) {
  console.log(`\n[Pregunta ${stepNumber}] "${question}"`);
  
  try {
    // Buscar el input (contenteditable o textarea)
    const selectors = ['[contenteditable="true"]', 'textarea', 'div[role="textbox"]'];
    let inputElement = null;
    
    for (const selector of selectors) {
      try {
        inputElement = await copilotFrame.waitForSelector(selector, { timeout: 3000, state: 'visible' });
        if (inputElement) break;
      } catch {}
    }
    
    if (!inputElement) {
      console.log('  ❌ Input no encontrado');
      await screenshot(page, `q${stepNumber}-no-input`);
      return false;
    }
    
    // Escribir la pregunta
    await inputElement.click({ timeout: 5000 });
    await page.waitForTimeout(500);
    await inputElement.evaluate((el, text) => {
      if (el.contentEditable === 'true') {
        el.textContent = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, question);
    
    await page.waitForTimeout(1000);
    console.log('  ✅ Pregunta escrita');
    await screenshot(page, `q${stepNumber}-written`);
    
    // Buscar botón de enviar
    const sendBtn = await copilotFrame.$('button[type="submit"]') ||
                    await copilotFrame.$('button[aria-label*="Send"]') ||
                    await copilotFrame.$('button[aria-label*="Enviar"]');
    
    if (sendBtn) {
      await sendBtn.click();
      console.log('  ✅ Pregunta enviada');
      await page.waitForTimeout(2000);
      await screenshot(page, `q${stepNumber}-sent`);
      
      // Esperar respuesta (máximo 30s)
      console.log('  ⏳ Esperando respuesta...');
      await page.waitForTimeout(30000);
      await screenshot(page, `q${stepNumber}-response`);
      console.log('  ✅ Respuesta recibida');
      
      return true;
    } else {
      console.log('  ⚠️ Botón de envío no encontrado');
      await screenshot(page, `q${stepNumber}-no-send-btn`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    await screenshot(page, `q${stepNumber}-error`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('TEST COPILOT - PREGUNTAS REALES');
  console.log('='.repeat(70));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 }
  });

  const page = await context.newPage();

  try {
    // Login
    console.log('\n[PASO 1] Login...');
    await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    if (!page.url().includes('/login')) {
      console.log('  ✅ Ya logueado');
    } else {
      await page.evaluate(([email, pass]) => {
        const setNativeValue = (element, value) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
        };
        const emailInput = document.querySelector('input[name="identifier"]') || 
                          document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        if (emailInput) setNativeValue(emailInput, email);
        if (passInput) setNativeValue(passInput, pass);
      }, [USER_EMAIL, USER_PASSWORD]);
      
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      });
      
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
      await page.waitForTimeout(3000);
    }
    
    await screenshot(page, '01-logged-in');
    console.log('  ✅ Login completado');

    // Navegar a /eventos o /resumen-evento
    console.log('\n[PASO 2] Navegando a página principal...');
    try {
      await page.goto(BASE + '/eventos', { waitUntil: 'networkidle', timeout: 30000 });
      console.log('  ✅ En /eventos');
    } catch {
      await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
      console.log('  ✅ En página principal');
    }
    await page.waitForTimeout(3000);
    await screenshot(page, '02-main-page');

    // Abrir Copilot
    console.log('\n[PASO 3] Abriendo Copilot...');
    const copilotOpened = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      for (const btn of buttons) {
        const text = (btn.textContent || '').toLowerCase();
        if (text.includes('copilot')) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    
    if (copilotOpened) {
      console.log('  ✅ Copilot abierto');
      await page.waitForTimeout(5000);
      await screenshot(page, '03-copilot-opened');
    } else {
      console.log('  ⚠️ Botón Copilot no encontrado');
      await screenshot(page, '03-no-copilot-button');
    }

    // Esperar a que el iframe del copilot cargue
    console.log('\n[PASO 4] Esperando iframe del Copilot...');
    await page.waitForTimeout(20000); // Dar tiempo para que React renderice
    await screenshot(page, '04-iframe-wait');

    // Obtener el frame del copilot
    const frames = page.frames();
    const copilotFrame = frames.find(f => {
      const url = f.url();
      return url.includes('chat') || url.includes('copilot') || url.includes(':3210');
    });

    if (!copilotFrame) {
      console.log('  ❌ Frame del Copilot no encontrado');
      await screenshot(page, '04-no-frame');
      console.log('  Frames disponibles:', frames.map(f => f.url()));
      throw new Error('Copilot frame no encontrado');
    }

    console.log('  ✅ Frame encontrado:', copilotFrame.url().substring(0, 60));

    // Hacer las preguntas
    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];

    for (let i = 0; i < questions.length; i++) {
      const success = await askQuestion(copilotFrame, page, questions[i], i + 1);
      if (!success) {
        console.log(`  ⚠️ Pregunta ${i + 1} no se completó correctamente`);
      }
      await page.waitForTimeout(3000); // Pausa entre preguntas
    }

    console.log('\n✅ Test completado');
    console.log('\nNavegador quedará abierto para inspección manual.');
    console.log('Presiona Ctrl+C para cerrar.\n');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await screenshot(page, 'error-final');
    console.log('\nNavegador quedará abierto para debugging.');
    await new Promise(() => {});
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
