#!/usr/bin/env node

/**
 * Test DEBUG del Copilot
 * Captura errores de consola y verifica estado del iframe
 */

const { firefox } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';
const EMAIL = 'bodasdehoy.com@gmail.com';
const PASSWORD = 'lorca2012M*+';

async function main() {
  console.log('\n======================================================================');
  console.log('TEST DEBUG COPILOT - CON CAPTURA DE ERRORES');
  console.log('======================================================================\n');

  let browser;

  try {
    // 1. Abrir Firefox
    console.log('[PASO 1] Abriendo Firefox...\n');
    browser = await firefox.launch({
      headless: false,
      args: []
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Capturar errores de consola
    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      if (msg.type() === 'error' || msg.text().includes('error') || msg.text().includes('failed')) {
        console.log(`   CONSOLE: ${text}`);
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`   ❌ PAGE ERROR: ${error.message}`);
    });

    page.on('requestfailed', request => {
      console.log(`   ⚠️ REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // 2. Navegar a login
    console.log('[PASO 2] Navegando a login...\n');
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 3. Login
    console.log('[PASO 3] Haciendo login...\n');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.waitFor({ timeout: 15000 });
    await emailInput.fill(EMAIL);

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(PASSWORD);

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    await page.waitForTimeout(10000);
    console.log('✅ Login completado\n');

    // 4. Navegar a eventos
    console.log('[PASO 4] Navegando a eventos...\n');
    await page.goto(`${URL}/eventos`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 5. Abrir Copilot
    console.log('[PASO 5] Abriendo Copilot y esperando a que cargue...\n');
    await page.click('button:has-text("Copilot")');
    console.log('   Esperando 15 segundos para que el iframe cargue...\n');
    await page.waitForTimeout(15000);

    // 6. Inspeccionar iframes
    console.log('[PASO 6] Inspeccionando iframes...\n');
    const frames = page.frames();
    console.log(`   Total de frames: ${frames.length}\n`);

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      try {
        const url = frame.url();
        console.log(`   Frame ${i}: ${url}`);

        if (url.includes('chat') || url.includes('lobe')) {
          console.log(`      → Este es el iframe del chat`);
        }
      } catch (e) {
        console.log(`   Frame ${i}: [Sin acceso]`);
      }
    }

    // 7. Buscar el iframe del chat y verificar estado
    console.log('\n[PASO 7] Verificando estado del chat...\n');

    let chatFrame = null;
    for (const frame of frames) {
      try {
        const url = frame.url();
        if (url.includes('chat') || url.includes('lobe')) {
          chatFrame = frame;
          console.log(`   ✅ Iframe encontrado: ${url}\n`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (chatFrame) {
      // Verificar si el input está visible
      const inputSelectors = [
        'textarea',
        '[contenteditable="true"]',
        'input[type="text"]'
      ];

      for (const selector of inputSelectors) {
        try {
          const input = chatFrame.locator(selector).first();
          const count = await input.count();
          const isVisible = count > 0 ? await input.isVisible().catch(() => false) : false;

          console.log(`   Selector "${selector}": count=${count}, visible=${isVisible}`);

          if (isVisible) {
            console.log(`   ✅ Input encontrado y visible con selector: ${selector}\n`);
            console.log('   Enviando pregunta de prueba...\n');

            await input.fill('¿Cuántos invitados tengo?');
            await input.press('Enter');
            console.log('   ✅ Pregunta enviada\n');

            console.log('   Esperando 30 segundos para ver respuesta...\n');
            await page.waitForTimeout(30000);
            await page.screenshot({ path: '/tmp/copilot-debug-with-response.png' });

            break;
          }
        } catch (e) {
          console.log(`   Error con selector "${selector}": ${e.message}`);
        }
      }
    } else {
      console.log('   ❌ NO se encontró iframe del chat\n');
    }

    // 8. Resumen
    console.log('\n======================================================================');
    console.log('RESUMEN');
    console.log('======================================================================\n');

    console.log(`Total de errores capturados: ${errors.length}`);
    if (errors.length > 0) {
      console.log('\nERRORES:');
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    console.log('\n🦊 Firefox permanece abierto para inspección manual\n');
    console.log('Screenshot guardado en: /tmp/copilot-debug-with-response.png\n');

    // Mantener navegador abierto
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
}

main();
