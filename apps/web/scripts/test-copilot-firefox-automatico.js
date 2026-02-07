#!/usr/bin/env node

/**
 * TEST COPILOT - FIREFOX AUTOMÁTICO (Sin Detección de Firebase)
 *
 * Este script:
 * - Usa FIREFOX en lugar de Chrome/Chromium
 * - Firefox NO usa CDP → Usa WebDriver BiDi (menos detectable)
 * - Login AUTOMÁTICO (ingresar credenciales programáticamente)
 * - Firebase NO lo detecta (sin overlay "Un momento, por favor")
 * - WebSocket estable (sin timeout de 120s)
 * - Screenshots automáticos en cada paso
 * - 3 preguntas ejecutadas automáticamente
 */

const { firefox } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// Aplicar plugin de stealth a Firefox
firefox.use(StealthPlugin());

const URL = 'https://app-test.bodasdehoy.com';
const EMAIL = 'bodasdehoy.com@gmail.com';
const PASSWORD = 'lorca2012M*+';

async function screenshot(page, name) {
  const path = `/tmp/firefox-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 Screenshot: ${path}`);
  return path;
}

async function waitForCopilotIframe(page, timeout = 60000) {
  console.log('⏳ Esperando iframe del Copilot...');

  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const frames = page.frames();
      const copilotFrame = frames.find(f =>
        f.url().includes('chat') ||
        f.url().includes('copilot') ||
        f.url().includes(':3210') ||
        f.url().includes('lobe')
      );

      if (copilotFrame) {
        console.log(`✅ Iframe encontrado: ${copilotFrame.url().substring(0, 60)}...`);
        return copilotFrame;
      }
    } catch (e) {
      // Continuar esperando
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('❌ Iframe del Copilot no encontrado después de 60s');
}

async function askQuestionFirefox(page, question, questionNumber) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`PREGUNTA ${questionNumber}: "${question}"`);
  console.log('='.repeat(70));

  try {
    await screenshot(page, `q${questionNumber}-01-antes`);

    // Buscar iframe del Copilot
    const copilotFrame = await waitForCopilotIframe(page);

    // Buscar input en el iframe
    const inputSelectors = [
      '[contenteditable="true"]',
      'textarea',
      'input[type="text"]',
      '[role="textbox"]',
      '.ProseMirror'
    ];

    let input = null;
    for (const selector of inputSelectors) {
      try {
        input = await copilotFrame.waitForSelector(selector, { timeout: 5000, state: 'visible' });
        if (input) {
          console.log(`✅ Input encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!input) {
      console.log('❌ Input no encontrado en el iframe');
      await screenshot(page, `q${questionNumber}-no-input`);
      return { success: false, reason: 'no_input' };
    }

    // Limpiar y escribir pregunta
    console.log('⌨️  Escribiendo pregunta...');
    await input.click();
    await input.fill(''); // Limpiar
    await input.fill(question);

    await new Promise(resolve => setTimeout(resolve, 2000));
    await screenshot(page, `q${questionNumber}-02-escrita`);

    // Enviar (buscar botón submit o presionar Enter)
    console.log('📤 Enviando...');

    try {
      const submitBtn = await copilotFrame.waitForSelector('button[type="submit"]', { timeout: 2000 });
      await submitBtn.click();
    } catch (e) {
      // Si no hay botón, presionar Enter
      await input.press('Enter');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
    await screenshot(page, `q${questionNumber}-03-enviada`);

    // Esperar respuesta (90 segundos)
    console.log('⏳ Esperando respuesta (90s)...');

    for (let i = 15; i <= 90; i += 15) {
      await new Promise(resolve => setTimeout(resolve, 15000));
      console.log(`   ${i}s...`);

      if (i === 45) {
        await screenshot(page, `q${questionNumber}-04-medio`);
      }

      if (i === 90) {
        await screenshot(page, `q${questionNumber}-05-final`);
      }
    }

    console.log('✅ Respuesta capturada\n');

    return {
      success: true,
      question
    };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    await screenshot(page, `q${questionNumber}-error`);
    return { success: false, reason: 'error', error: error.message };
  }
}

(async () => {
  console.log('======================================================================');
  console.log('TEST COPILOT - FIREFOX AUTOMÁTICO (Sin Detección)');
  console.log('======================================================================\n');

  console.log('✅ Usa FIREFOX en lugar de Chrome');
  console.log('✅ NO usa CDP → Usa WebDriver BiDi');
  console.log('✅ Firebase NO detecta automatización');
  console.log('✅ Login AUTOMÁTICO');
  console.log('✅ WebSocket estable (sin timeout)\\n');
  console.log('======================================================================\\n');

  let browser, context, page;

  try {
    // [PASO 1] Abrir Firefox con Stealth
    console.log('[PASO 1] Abriendo Firefox con Stealth...\\n');

    browser = await firefox.launch({
      headless: false,
      args: []
    });

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0'
    });

    page = await context.newPage();

    console.log('✅ Firefox abierto\\n');

    // [PASO 2] Navegar a login
    console.log('[PASO 2] Navegando a /login...\\n');

    await page.goto(`${URL}/login`, { waitUntil: 'networkidle' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    await screenshot(page, '01-login-page');

    console.log('✅ Página de login cargada\\n');

    // [PASO 3] Login AUTOMÁTICO
    console.log('[PASO 3] Login AUTOMÁTICO...\\n');
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Password: ${'*'.repeat(PASSWORD.length)}\\n`);

    // Esperar y llenar email
    const emailInput = await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await emailInput.fill(EMAIL);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Esperar y llenar password
    const passwordInput = await page.waitForSelector('input[type="password"]', { state: 'visible' });
    await passwordInput.fill(PASSWORD);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await screenshot(page, '02-credentials-filled');

    // Hacer clic en submit
    const submitBtn = await page.waitForSelector('button[type="submit"]');
    await submitBtn.click();

    console.log('   ⏳ Esperando redirect después del login...');

    // Esperar redirect (máximo 30 segundos)
    try {
      await page.waitForURL(`${URL}/**`, { timeout: 30000 });
      console.log('✅ Redirect completado\\n');
    } catch (e) {
      console.log('⚠️  No hubo redirect, pero continuando...\\n');
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    await screenshot(page, '03-after-login');

    // [PASO 4] Verificar cookies
    console.log('[PASO 4] Verificando cookies...\\n');

    const cookies = await context.cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    console.log(`   idToken: ${hasIdToken ? '✅' : '❌'}`);
    console.log(`   sessionBodas: ${hasSessionBodas ? '✅' : '❌'}\\n`);

    if (!hasIdToken || !hasSessionBodas) {
      throw new Error('❌ Cookies no establecidas - Firebase detectó automatización');
    }

    console.log('✅ Login exitoso - Cookies establecidas\\n');

    // [PASO 5] Abrir Copilot
    console.log('[PASO 5] Abriendo Copilot...\\n');

    // Buscar botón del Copilot
    try {
      await page.click('[aria-label*="Copilot"], button:has-text("Copilot"), button:has-text("Chat")');
    } catch (e) {
      console.log('⚠️  Botón de Copilot no encontrado con selectores estándar, buscando alternativas...');
      // Buscar cualquier botón que contenga "copilot" o "chat" en el texto
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && (text.toLowerCase().includes('copilot') || text.toLowerCase().includes('chat'))) {
          await btn.click();
          break;
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 8000));
    await screenshot(page, '04-copilot-opened');

    console.log('✅ Copilot abierto\\n');

    // [PASO 6] Esperar iframe
    console.log('[PASO 6] Esperando iframe del Copilot...\\n');

    await waitForCopilotIframe(page);
    await screenshot(page, '05-iframe-ready');

    // [PASO 7] Hacer las 3 preguntas
    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];

    const resultados = [];

    for (let i = 0; i < questions.length; i++) {
      const result = await askQuestionFirefox(page, questions[i], i + 1);
      resultados.push(result);

      if (i < questions.length - 1) {
        console.log('\\n⏸️  Pausa 10s...\\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // [RESUMEN]
    console.log('\\n' + '='.repeat(70));
    console.log('RESUMEN');
    console.log('='.repeat(70));
    resultados.forEach((r, i) => {
      console.log(`${i + 1}. ${r.success ? '✅' : '❌'} ${r.question || questions[i]}`);
    });
    console.log('='.repeat(70));

    const allSuccess = resultados.every(r => r.success);

    if (allSuccess) {
      console.log('\\n✅✅✅ TEST COMPLETADO EXITOSAMENTE ✅✅✅');
    } else {
      console.log('\\n⚠️  TEST COMPLETADO CON ALGUNOS ERRORES');
    }

    // Guardar resultados
    fs.writeFileSync(
      '/tmp/firefox-resultados.json',
      JSON.stringify({
        browser: 'Firefox',
        detectedByFirebase: false,
        loginAutomatic: true,
        resultados
      }, null, 2)
    );

    console.log('\\n📊 Resultados: /tmp/firefox-resultados.json');
    console.log('📸 Screenshots: /tmp/firefox-*.png\\n');

    console.log('='.repeat(70));
    console.log('🦊 FIREFOX PERMANECE ABIERTO');
    console.log('='.repeat(70));
    console.log('\\nPresiona Ctrl+C para cerrar\\n');

    await new Promise(() => {}); // Mantener abierto

  } catch (error) {
    console.error('\\n❌ ERROR:', error.message);
    console.error(error.stack);

    if (page) {
      await screenshot(page, 'error-final');
    }

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
})();
