#!/usr/bin/env node

/**
 * Test mejorado de Copilot en app-test.bodasdehoy.com
 * Versión 2 - Busca el botón de forma más robusta
 */

const { chromium } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/app-test-v2-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function askQuestion(page, question, questionNumber) {
  console.log(`\n[PREGUNTA ${questionNumber}] "${question}"`);

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

  console.log(`  ✅ Frame encontrado`);

  try {
    // Esperar a que el contenido del iframe esté listo
    await page.waitForTimeout(2000);

    // Buscar el input dentro del iframe
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
            console.log(`  ✅ Input encontrado: ${selector}`);
            break;
          }
        }
      } catch (e) {
        // Continuar
      }
    }

    if (!inputElement) {
      console.log('  ❌ No se encontró input visible');
      await screenshot(page, `q${questionNumber}-error-no-input`);
      return false;
    }

    await screenshot(page, `q${questionNumber}-01-before`);

    // Hacer click y escribir
    console.log('  Escribiendo pregunta...');
    await inputElement.click({ timeout: 5000 });
    await page.waitForTimeout(500);
    await inputElement.fill(question);
    await page.waitForTimeout(1000);
    await screenshot(page, `q${questionNumber}-02-written`);

    // Enviar (buscar botón o presionar Enter)
    console.log('  Enviando...');
    const sendBtn = await copilotFrame.$('button[type="submit"]');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await inputElement.press('Enter');
    }

    await page.waitForTimeout(3000);
    await screenshot(page, `q${questionNumber}-03-sent`);

    // Esperar respuesta
    console.log('  Esperando respuesta (máximo 60s)...');
    try {
      // Esperar a que aparezca contenido nuevo
      await page.waitForTimeout(60000); // Esperar 60 segundos fijo para ver la respuesta
      console.log('  ✅ Tiempo de espera completado');
      await screenshot(page, `q${questionNumber}-04-response`);
      return true;
    } catch (e) {
      console.log('  ⚠️ Error esperando respuesta');
      await screenshot(page, `q${questionNumber}-04-error`);
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
  console.log('TEST APP-TEST V2 - PREGUNTAS REALES');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ==========================================
    // PASO 1: Navegar y Login
    // ==========================================
    console.log('[PASO 1] Navegando a app-test.bodasdehoy.com...');
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-inicio');

    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      console.log('  Haciendo login...');
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

      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      });

      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
      console.log('  ✅ Login completado');
    } else {
      console.log('  ✅ Ya estaba logueado');
    }

    await page.waitForTimeout(5000); // Esperar a que cargue la página principal
    await screenshot(page, '02-logged-in');

    // ==========================================
    // PASO 2: Buscar y abrir el Copilot
    // ==========================================
    console.log('\n[PASO 2] Buscando botón del Copilot...');

    // Esperar a que desaparezca el loader
    try {
      await page.waitForSelector('text=Cargando eventos', { state: 'hidden', timeout: 30000 });
      console.log('  ✅ Página cargada completamente');
    } catch (e) {
      console.log('  ⚠️ Loader no desapareció, continuando...');
    }

    await page.waitForTimeout(3000);
    await screenshot(page, '03-page-ready');

    // Buscar el botón del Copilot de múltiples formas
    console.log('  Buscando botón del Copilot...');
    const copilotButtonClicked = await page.evaluate(() => {
      // Método 1: Por texto exacto
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));

      // Buscar por texto "Copilot"
      let btn = buttons.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) {
        console.log('[DEBUG] Botón encontrado por texto exacto');
        btn.click();
        return true;
      }

      // Buscar por texto que contenga "copilot" (case insensitive)
      btn = buttons.find(b => b.textContent?.toLowerCase().includes('copilot'));
      if (btn) {
        console.log('[DEBUG] Botón encontrado por texto (case insensitive)');
        btn.click();
        return true;
      }

      // Buscar por aria-label
      btn = buttons.find(b => b.getAttribute('aria-label')?.toLowerCase().includes('copilot'));
      if (btn) {
        console.log('[DEBUG] Botón encontrado por aria-label');
        btn.click();
        return true;
      }

      // Buscar por title
      btn = buttons.find(b => b.getAttribute('title')?.toLowerCase().includes('copilot'));
      if (btn) {
        console.log('[DEBUG] Botón encontrado por title');
        btn.click();
        return true;
      }

      console.log('[DEBUG] No se encontró botón del Copilot');
      return false;
    });

    if (copilotButtonClicked) {
      console.log('  ✅ Botón del Copilot clickeado!');
      await page.waitForTimeout(5000);
      await screenshot(page, '04-copilot-opened');
    } else {
      console.log('  ❌ No se pudo hacer click en el botón del Copilot');
      await screenshot(page, '04-no-button');

      // Intentar con un selector más directo usando Playwright
      try {
        await page.click('text=Copilot', { timeout: 5000 });
        console.log('  ✅ Click con Playwright exitoso');
        await page.waitForTimeout(5000);
        await screenshot(page, '04-copilot-opened-pw');
      } catch (e) {
        console.log('  ❌ Tampoco funcionó con Playwright');
        throw new Error('No se pudo abrir el Copilot');
      }
    }

    // ==========================================
    // PASO 3: Esperar a que el iframe cargue
    // ==========================================
    console.log('\n[PASO 3] Esperando a que el iframe del Copilot cargue...');
    console.log('  Esperando 60 segundos para carga completa...');

    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }

    await screenshot(page, '05-iframe-ready');

    // Verificar que el iframe existe
    const iframeExists = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"]');
      return iframe !== null;
    });

    if (!iframeExists) {
      console.log('  ❌ No se encontró el iframe del Copilot');
      await screenshot(page, '05-no-iframe');
      throw new Error('Iframe no encontrado');
    }

    console.log('  ✅ Iframe encontrado!');

    // ==========================================
    // PASO 4: Hacer las preguntas
    // ==========================================
    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];

    for (let i = 0; i < questions.length; i++) {
      const success = await askQuestion(page, questions[i], i + 1);
      console.log(success ? `  ✅ Pregunta ${i + 1} completada` : `  ⚠️ Pregunta ${i + 1} con problemas`);

      if (i < questions.length - 1) {
        console.log('\n  Esperando 5s antes de siguiente pregunta...\n');
        await page.waitForTimeout(5000);
      }
    }

    console.log('\n✅ Test completado');
    await screenshot(page, '99-final');

    console.log('\nNavegador abierto para inspección. Presiona Ctrl+C para cerrar.\n');
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await screenshot(page, 'error-final');
    console.log('\nNavegador abierto. Presiona Ctrl+C para cerrar.\n');
    await new Promise(() => {});
  }
})();
