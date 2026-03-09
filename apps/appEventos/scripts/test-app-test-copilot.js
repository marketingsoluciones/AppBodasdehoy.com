#!/usr/bin/env node

/**
 * Test de Copilot en app-test.bodasdehoy.com con PREGUNTAS REALES
 * - ¿Cuántos invitados tengo?
 * - ¿Cuál es la boda de Raul?
 * - Muéstrame la lista de todas las bodas
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/app-test-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function askQuestion(page, question, questionNumber) {
  console.log(`\n[PREGUNTA ${questionNumber}] "${question}"`);

  // Buscar el iframe del copilot
  const frames = page.frames();
  const copilotFrame = frames.find(f => {
    const url = f.url();
    return url.includes('chat') || url.includes('copilot') || url.includes(':3210');
  });

  if (!copilotFrame) {
    console.log('  ❌ No se pudo encontrar el frame del Copilot');
    await screenshot(page, `q${questionNumber}-error-no-frame`);
    return false;
  }

  console.log(`  ✅ Frame encontrado: ${copilotFrame.url().substring(0, 60)}`);

  try {
    // Buscar el input (contenteditable o textarea)
    console.log('  Buscando input field...');

    let inputElement = null;
    const selectors = [
      '[contenteditable="true"]',
      'textarea',
      'input[type="text"]'
    ];

    for (const selector of selectors) {
      try {
        const element = await copilotFrame.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          if (isVisible) {
            inputElement = element;
            console.log(`  ✅ Input encontrado con selector: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }

    if (!inputElement) {
      console.log('  ❌ No se encontró input visible');
      await screenshot(page, `q${questionNumber}-error-no-input`);
      return false;
    }

    await screenshot(page, `q${questionNumber}-01-before-question`);

    // Hacer click en el input
    console.log('  Haciendo click en input...');
    await inputElement.click({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Escribir la pregunta
    console.log('  Escribiendo pregunta...');
    await inputElement.fill(question);
    await page.waitForTimeout(1000);
    await screenshot(page, `q${questionNumber}-02-question-written`);

    // Buscar y hacer click en el botón de enviar
    console.log('  Buscando botón de enviar...');
    const sendButton = await copilotFrame.$('button[type="submit"], button[aria-label*="send" i], button[aria-label*="enviar" i]');

    if (!sendButton) {
      console.log('  ⚠️ No se encontró botón de enviar, intentando Enter');
      await inputElement.press('Enter');
    } else {
      console.log('  ✅ Botón encontrado, haciendo click...');
      await sendButton.click();
    }

    await page.waitForTimeout(2000);
    await screenshot(page, `q${questionNumber}-03-after-send`);

    // Esperar respuesta (máximo 45 segundos)
    console.log('  Esperando respuesta del copilot (máximo 45s)...');
    try {
      await copilotFrame.waitForSelector('[data-message-id], .message, [role="article"]', {
        timeout: 45000,
        state: 'visible'
      });
      console.log('  ✅ Respuesta recibida!');
      await page.waitForTimeout(3000);
      await screenshot(page, `q${questionNumber}-04-response-received`);
      return true;
    } catch (waitError) {
      console.log('  ⚠️ Timeout esperando respuesta (45s)');
      await screenshot(page, `q${questionNumber}-04-timeout-no-response`);
      return false;
    }

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    await screenshot(page, `q${questionNumber}-error`);
    return false;
  }
}

(async () => {
  console.log('======================================================================');
  console.log('TEST APP-TEST - PREGUNTAS REALES AL COPILOT');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ==========================================
    // PASO 1: Login
    // ==========================================
    console.log('[PASO 1] Login en app-test.bodasdehoy.com...');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await screenshot(page, '01-inicio');

    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      console.log('  Rellenando credenciales...');
      await page.evaluate(([email, pass]) => {
        function setNativeValue(element, value) {
          const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set
            || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
          if (valueSetter) {
            valueSetter.call(element, value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }

        const emailInput = document.querySelector('input[type="email"]') ||
                         document.querySelector('input[name="email"]');
        const passInput = document.querySelector('input[type="password"]');

        if (emailInput) setNativeValue(emailInput, email);
        if (passInput) setNativeValue(passInput, pass);
      }, [USER_EMAIL, USER_PASSWORD]);

      await page.waitForTimeout(500);
      await screenshot(page, '02-credentials-filled');

      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      });

      console.log('  Esperando redirección...');
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
      await page.waitForTimeout(3000);
      console.log('  ✅ Login completado');
    }

    await screenshot(page, '03-logged-in');

    // ==========================================
    // PASO 2: Abrir Copilot
    // ==========================================
    console.log('\n[PASO 2] Abriendo Copilot...');

    const alreadyOpen = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"]');
      if (iframe) {
        const rect = iframe.getBoundingClientRect();
        return rect.width > 0;
      }
      return false;
    });

    if (!alreadyOpen) {
      const clicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        for (const btn of buttons) {
          const text = (btn.textContent || '').toLowerCase();
          const title = (btn.title || '').toLowerCase();
          if (text.includes('copilot') || title.includes('copilot')) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (clicked) {
        console.log('  ✅ Botón Copilot clickeado');
        await page.waitForTimeout(3000);
        await screenshot(page, '04-copilot-opened');
      } else {
        console.log('  ⚠️ No se encontró botón Copilot');
        await screenshot(page, '04-no-copilot-button');
      }
    } else {
      console.log('  ✅ Copilot ya estaba abierto');
    }

    // ==========================================
    // PASO 3: Esperar a que el iframe cargue
    // ==========================================
    console.log('\n[PASO 3] Esperando a que el iframe cargue completamente...');
    console.log('  Esperando 45 segundos para carga completa...');

    for (let i = 15; i <= 45; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
      if (i === 45) {
        await screenshot(page, '05-iframe-ready');
      }
    }

    // Verificar que el overlay haya desaparecido
    const overlayGone = await page.evaluate(() => {
      const text = document.body.innerText || '';
      return !text.includes('Cargando Copilot') && !text.includes('Inicializando interfaz');
    });

    if (overlayGone) {
      console.log('  ✅ Overlay de carga desapareció!');
    } else {
      console.log('  ⚠️ Overlay todavía visible, pero continuando...');
    }

    // ==========================================
    // PASO 4: Hacer las 3 preguntas
    // ==========================================
    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];

    for (let i = 0; i < questions.length; i++) {
      const success = await askQuestion(page, questions[i], i + 1);
      if (success) {
        console.log(`  ✅ Pregunta ${i + 1} completada`);
      } else {
        console.log(`  ⚠️ Pregunta ${i + 1} tuvo problemas`);
      }

      // Esperar entre preguntas
      if (i < questions.length - 1) {
        console.log('\n  Esperando 5s antes de la siguiente pregunta...\n');
        await page.waitForTimeout(5000);
      }
    }

    console.log('\n✅ Test completado');
    await screenshot(page, '99-final');

    console.log('\nNavegador quedará abierto. Presiona Ctrl+C para cerrar.\n');
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await screenshot(page, 'error-final');
    console.log('\nNavegador quedará abierto. Presiona Ctrl+C para cerrar.\n');
    await new Promise(() => {});
  }
})();
