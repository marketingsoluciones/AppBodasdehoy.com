#!/usr/bin/env node

/**
 * TEST COPILOT - STEALTH MODE - CONTROL TOTAL AUTOMÁTICO
 *
 * Este script usa playwright-extra con stealth plugin para:
 * - ✅ Evadir detección de Firebase
 * - ✅ Login AUTOMÁTICO (ingresar usuario y contraseña)
 * - ✅ Control TOTAL del navegador
 * - ✅ Ejecutar las 3 preguntas automáticamente
 */

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Añadir plugin stealth
chromium.use(StealthPlugin());

const URL = 'https://app-test.bodasdehoy.com';
const EMAIL = 'bodasdehoy.com@gmail.com';
const PASSWORD = 'lorca2012M*+';

const resultados = {
  login: null,
  usuario: null,
  preguntas: []
};

async function screenshot(page, name) {
  const path = `/tmp/copilot-stealth-${name}.png`;
  try {
    await page.screenshot({ path, fullPage: false });
    console.log(`  📸 ${path}`);
    return path;
  } catch (e) {
    console.log(`  ⚠️  Error capturando screenshot: ${e.message}`);
    return null;
  }
}

async function doLogin(page) {
  console.log('\n[LOGIN AUTOMÁTICO] Ingresando credenciales...\n');

  try {
    // Esperar que cargue el formulario
    await page.waitForTimeout(3000);

    // Screenshot antes de login
    await screenshot(page, '01-login-page');

    // Buscar campo de email - Esperar explícitamente
    console.log('  🔍 Buscando campo de email...');
    let emailInput = null;

    try {
      // Esperar que aparezca el input type="email"
      await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });
      emailInput = page.locator('input[type="email"]').first();
      console.log('  ✅ Campo email encontrado: input[type="email"]');
    } catch (e) {
      console.log('  ❌ Campo de email no encontrado después de 10s');
      await screenshot(page, 'error-no-email-input');
      return false;
    }

    // Buscar campo de password - Esperar explícitamente
    console.log('  🔍 Buscando campo de password...');
    let passwordInput = null;

    try {
      // Esperar que aparezca el input type="password"
      await page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 10000 });
      passwordInput = page.locator('input[type="password"]').first();
      console.log('  ✅ Campo password encontrado: input[type="password"]');
    } catch (e) {
      console.log('  ❌ Campo de password no encontrado después de 10s');
      await screenshot(page, 'error-no-password-input');
      return false;
    }

    // Ingresar credenciales
    console.log('  ⌨️  Ingresando email...');
    await emailInput.fill(EMAIL);
    await page.waitForTimeout(1000);

    console.log('  ⌨️  Ingresando password...');
    await passwordInput.fill(PASSWORD);
    await page.waitForTimeout(1000);

    await screenshot(page, '02-credentials-filled');

    // Buscar botón de submit
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Iniciar")',
      'button:has-text("Login")',
      'button:has-text("Entrar")'
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = await page.locator(selector).first();
        if (await submitButton.isVisible()) {
          console.log(`  ✅ Botón submit encontrado: ${selector}`);
          break;
        }
      } catch (e) {}
    }

    if (!submitButton) {
      console.log('  ⚠️  Botón submit no encontrado, intentando Enter...');
      await passwordInput.press('Enter');
    } else {
      console.log('  🖱️  Haciendo click en botón de login...');
      await submitButton.click();
    }

    // Esperar navegación después de login
    console.log('  ⏳ Esperando respuesta de Firebase...');

    // Esperar que desaparezca el overlay o que cambie la URL
    try {
      await page.waitForURL(url => !url.includes('/login'), { timeout: 30000 });
      console.log('  ✅ Login exitoso - URL cambió');
    } catch (e) {
      console.log('  ⚠️  Timeout esperando cambio de URL');
    }

    await page.waitForTimeout(5000);
    await screenshot(page, '03-after-login');

    // Verificar cookies
    const cookies = await page.context().cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    console.log(`\n  🍪 Cookies:`);
    console.log(`     - idTokenV0.1.0: ${hasIdToken ? '✅' : '❌'}`);
    console.log(`     - sessionBodas: ${hasSessionBodas ? '✅' : '❌'}`);

    if (hasIdToken && hasSessionBodas) {
      console.log('  ✅ Login COMPLETADO exitosamente\n');
      resultados.login = { success: true, method: 'stealth' };
      return true;
    } else {
      console.log('  ⚠️  Login completado pero cookies no establecidas\n');
      resultados.login = { success: false, reason: 'no_cookies' };
      return false;
    }

  } catch (error) {
    console.log(`  ❌ Error en login: ${error.message}`);
    await screenshot(page, 'error-login');
    resultados.login = { success: false, reason: 'error', error: error.message };
    return false;
  }
}

async function askQuestion(page, question, questionNumber) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`PREGUNTA ${questionNumber}: "${question}"`);
  console.log('='.repeat(70));

  try {
    // Esperar un poco
    await page.waitForTimeout(3000);

    // Buscar el iframe del Copilot
    const frames = page.frames();
    console.log(`  🔍 Buscando iframe del Copilot entre ${frames.length} frames...`);

    const copilotFrame = frames.find(f => {
      const url = f.url();
      return url.includes('chat') || url.includes('copilot') || url.includes(':3210') || url.includes('lobe');
    });

    if (!copilotFrame) {
      console.log('  ❌ Frame del Copilot no encontrado');
      await screenshot(page, `q${questionNumber}-no-frame`);
      return { success: false, reason: 'no_frame' };
    }

    console.log(`  ✅ Frame encontrado: ${copilotFrame.url().substring(0, 60)}...`);

    // Buscar el input en el frame
    const inputSelectors = [
      '[contenteditable="true"]',
      'textarea',
      'input[type="text"]',
      '[role="textbox"]',
      '.ProseMirror'
    ];

    let inputElement = null;
    for (const selector of inputSelectors) {
      try {
        inputElement = copilotFrame.locator(selector).first();
        if (await inputElement.isVisible()) {
          console.log(`  ✅ Input encontrado: ${selector}`);
          break;
        }
      } catch (e) {}
    }

    if (!inputElement) {
      console.log('  ❌ Input no encontrado');
      await screenshot(page, `q${questionNumber}-no-input`);
      return { success: false, reason: 'no_input' };
    }

    await screenshot(page, `q${questionNumber}-01-antes`);

    // Escribir pregunta
    console.log('  ⌨️  Escribiendo pregunta...');
    await inputElement.click();
    await page.waitForTimeout(1000);

    // Limpiar y escribir
    await inputElement.fill('');
    await page.waitForTimeout(500);
    await inputElement.type(question, { delay: 50 });
    await page.waitForTimeout(2000);

    await screenshot(page, `q${questionNumber}-02-escrita`);

    // Enviar
    console.log('  📤 Enviando...');

    const submitBtn = copilotFrame.locator('button[type="submit"]').first();
    try {
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        console.log('     Enviado con botón submit');
      } else {
        throw new Error('No visible');
      }
    } catch (e) {
      await inputElement.press('Enter');
      console.log('     Enviado con Enter');
    }

    await page.waitForTimeout(3000);
    await screenshot(page, `q${questionNumber}-03-enviada`);

    // Esperar respuesta
    console.log('  ⏳ Esperando respuesta (90s)...');

    for (let i = 15; i <= 90; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`     ${i}s...`);

      if (i === 45) {
        await screenshot(page, `q${questionNumber}-04-medio`);
      }

      if (i === 90) {
        await screenshot(page, `q${questionNumber}-05-final`);
      }
    }

    // Extraer respuesta
    const responseText = await copilotFrame.evaluate(() => {
      const messages = document.querySelectorAll('[data-role="assistant"], .message-assistant, .assistant-message');
      const lastMessage = messages[messages.length - 1];
      return lastMessage ? lastMessage.textContent : 'No se pudo extraer respuesta';
    }).catch(() => 'Error extrayendo respuesta');

    console.log('  ✅ Respuesta capturada\n');
    console.log(`  📝 Extracto: ${responseText.substring(0, 200)}...\n`);

    return {
      success: true,
      question,
      response: responseText
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    await screenshot(page, `q${questionNumber}-error`);
    return { success: false, reason: 'error', error: error.message };
  }
}

(async () => {
  console.log('======================================================================');
  console.log('TEST COPILOT - STEALTH MODE - AUTOMÁTICO');
  console.log('======================================================================\n');

  console.log('✅ Playwright + Stealth Plugin para evadir Firebase');
  console.log('✅ Login AUTOMÁTICO (ingresa usuario/contraseña)');
  console.log('✅ Control TOTAL del navegador');
  console.log('✅ Ejecuta las 3 preguntas automáticamente\n');
  console.log('======================================================================\n');

  let browser, page;

  try {
    console.log('🚀 Lanzando navegador en modo stealth...\n');

    browser = await chromium.launch({
      headless: false,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const context = await browser.newContext({
      viewport: null,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page = await context.newPage();

    console.log('[PASO 1] Navegando a /login...\n');
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('  ✅ Página cargada\n');

    // [PASO 2] Login AUTOMÁTICO
    console.log('[PASO 2] Login AUTOMÁTICO...\n');
    const loginSuccess = await doLogin(page);

    if (!loginSuccess) {
      console.log('\n❌ ERROR: Login falló');
      console.log('🖥️  NAVEGADOR ABIERTO - Presiona Ctrl+C para cerrar');

      // Guardar resultados parciales
      const fs = require('fs');
      fs.writeFileSync(
        '/tmp/copilot-stealth-resultados-error.json',
        JSON.stringify(resultados, null, 2)
      );

      await new Promise(() => {});
    }

    // [PASO 3] Verificar usuario
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

      resultados.usuario = userInfo;

      if (userInfo.displayName === 'guest') {
        console.log('\n⚠️  ADVERTENCIA: Usuario es "guest"');
        console.log('   El stealth plugin puede no haber funcionado\n');
      }
    } else {
      console.log('⚠️  No se pudo obtener info del usuario');
    }

    // [PASO 4] Navegar a homepage
    console.log('\n[PASO 4] Navegando a homepage...\n');
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    await screenshot(page, '04-homepage');

    // [PASO 5] Abrir Copilot
    console.log('\n[PASO 5] Abriendo Copilot...\n');

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.toLowerCase().includes('copilot'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    await page.waitForTimeout(8000);
    await screenshot(page, '05-copilot-opened');

    // [PASO 6] Esperar iframe
    console.log('\n[PASO 6] Esperando iframe del Copilot...\n');

    let iframeReady = false;
    for (let i = 1; i <= 12; i++) {
      await page.waitForTimeout(5000);
      const frames = page.frames();
      const copilotFrame = frames.find(f => {
        const url = f.url();
        return url.includes('chat') || url.includes('copilot') || url.includes(':3210') || url.includes('lobe');
      });

      if (copilotFrame) {
        console.log(`  ✅ Iframe encontrado después de ${i * 5}s`);
        iframeReady = true;
        break;
      }

      if (i % 3 === 0) {
        console.log(`  ⏳ ${i * 5}s... buscando iframe`);
      }
    }

    if (!iframeReady) {
      console.log('  ⚠️  Iframe no encontrado después de 60s');
    }

    await screenshot(page, '06-iframe-ready');

    // [PASO 7] Hacer las 3 preguntas
    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];

    for (let i = 0; i < questions.length; i++) {
      const result = await askQuestion(page, questions[i], i + 1);
      resultados.preguntas.push(result);

      if (i < questions.length - 1) {
        console.log('\n⏸️  Pausa 10s antes de siguiente pregunta...\n');
        await page.waitForTimeout(10000);
      }
    }

    // [RESUMEN]
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN DEL TEST');
    console.log('='.repeat(70));
    console.log(`Login: ${resultados.login?.success ? '✅' : '❌'}`);
    console.log(`Usuario: ${resultados.usuario?.displayName || 'N/A'} (${resultados.usuario?.email || 'N/A'})`);
    resultados.preguntas.forEach((r, i) => {
      console.log(`Pregunta ${i + 1}: ${r.success ? '✅' : '❌'} ${r.question || ''}`);
    });
    console.log('='.repeat(70));

    const allSuccess = resultados.preguntas.every(r => r.success);

    if (allSuccess) {
      console.log('\n✅✅✅ TEST COMPLETADO EXITOSAMENTE ✅✅✅');
    } else {
      console.log('\n⚠️  TEST COMPLETADO CON ALGUNOS ERRORES');
    }

    // Guardar resultados
    const fs = require('fs');
    fs.writeFileSync(
      '/tmp/copilot-stealth-resultados.json',
      JSON.stringify(resultados, null, 2)
    );
    console.log('\n📊 Resultados guardados en: /tmp/copilot-stealth-resultados.json');
    console.log('📸 Screenshots en: /tmp/copilot-stealth-*.png');

    console.log('\n' + '='.repeat(70));
    console.log('🖥️  NAVEGADOR PERMANECE ABIERTO');
    console.log('='.repeat(70));
    console.log('\nPresiona Ctrl+C para cerrar');
    console.log('='.repeat(70));

    // Mantener abierto
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    // Guardar resultados parciales
    const fs = require('fs');
    fs.writeFileSync(
      '/tmp/copilot-stealth-error.json',
      JSON.stringify({ error: error.message, resultados }, null, 2)
    );

    if (page) {
      await screenshot(page, 'error-final');
    }

    process.exit(1);
  }
})();
