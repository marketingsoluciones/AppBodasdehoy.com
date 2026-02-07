#!/usr/bin/env node

/**
 * Test para el PROVEEDOR del backend
 * Captura TODOS los errores y requests para debugging
 */

const { firefox } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';

async function main() {
  console.log('\n======================================================================');
  console.log('TEST PARA PROVEEDOR BACKEND - CON CAPTURA COMPLETA');
  console.log('======================================================================\n');

  let browser;

  try {
    const userDataDir = '/tmp/firefox-copilot-profile';
    browser = await firefox.launchPersistentContext(userDataDir, {
      headless: false,
      args: []
    });

    const page = browser.pages()[0] || await browser.newPage();

    // Arrays para capturar TODO
    const consoleMessages = [];
    const errors = [];
    const requests = [];
    const responses = [];

    // Capturar TODOS los mensajes de consola
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(text);
      console.log(`CONSOLE: ${text}`);
    });

    // Capturar errores de página
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`❌ PAGE ERROR: ${error.message}`);
    });

    // Capturar TODAS las requests
    page.on('request', request => {
      const url = request.url();
      if (url.includes('copilot') || url.includes('chat') || url.includes('api')) {
        requests.push({ url, method: request.method() });
        console.log(`→ REQUEST: ${request.method()} ${url}`);
      }
    });

    // Capturar TODAS las responses
    page.on('response', response => {
      const url = response.url();
      if (url.includes('copilot') || url.includes('chat') || url.includes('api')) {
        responses.push({ url, status: response.status() });
        console.log(`← RESPONSE: ${response.status()} ${url}`);
      }
    });

    // Capturar requests fallidos
    page.on('requestfailed', request => {
      console.log(`⚠️ REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log('[1] Navegando a eventos...\n');
    await page.goto(`${URL}/eventos`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Verificar cookies
    const cookies = await browser.cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSession = cookies.some(c => c.name === 'sessionBodas');

    console.log(`\n[2] Estado de autenticación:`);
    console.log(`   idToken: ${hasIdToken ? 'PRESENTE' : 'AUSENTE'}`);
    console.log(`   sessionBodas: ${hasSession ? 'PRESENTE' : 'AUSENTE'}\n`);

    if (!hasIdToken || !hasSession) {
      throw new Error('NO HAY SESIÓN - Ejecuta primero test-copilot-auto-login.js');
    }

    await page.screenshot({ path: '/tmp/proveedor-01-eventos.png' });

    console.log('[3] Abriendo Copilot...\n');
    await page.click('button:has-text("Copilot")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/proveedor-02-copilot-abierto.png' });

    console.log('[4] Buscando iframe del chat...\n');
    const frames = page.frames();
    console.log(`   Total frames: ${frames.length}`);

    let chatFrame = null;
    for (const frame of frames) {
      try {
        const url = frame.url();
        console.log(`   Frame: ${url}`);
        if (url.includes('chat') || url.includes('copilot') || url.includes('lobe')) {
          chatFrame = frame;
          console.log(`   ✅ IFRAME DEL CHAT ENCONTRADO: ${url}\n`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!chatFrame) {
      throw new Error('NO SE ENCONTRÓ IFRAME DEL CHAT');
    }

    console.log('[5] Enviando pregunta de prueba...\n');
    console.log('   Pregunta: "¿Cuántos eventos tengo?"\n');

    const input = chatFrame.locator('textarea, [contenteditable="true"]').first();
    await input.fill('¿Cuántos eventos tengo?');
    await input.press('Enter');

    console.log('   ✅ Pregunta enviada\n');
    console.log('[6] Esperando respuesta (60 segundos)...\n');
    console.log('   (Capturando TODOS los requests/responses...)\n');

    // Esperar 60 segundos capturando TODO
    await page.waitForTimeout(60000);

    await page.screenshot({ path: '/tmp/proveedor-03-despues-pregunta.png' });

    console.log('\n======================================================================');
    console.log('RESUMEN PARA EL PROVEEDOR');
    console.log('======================================================================\n');

    console.log(`Total mensajes consola: ${consoleMessages.length}`);
    console.log(`Total errores página: ${errors.length}`);
    console.log(`Total requests capturados: ${requests.length}`);
    console.log(`Total responses capturados: ${responses.length}\n`);

    if (errors.length > 0) {
      console.log('ERRORES CAPTURADOS:');
      errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
      console.log('');
    }

    console.log('REQUESTS A API/COPILOT:');
    requests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
    });
    console.log('');

    console.log('RESPONSES DE API/COPILOT:');
    responses.forEach(res => {
      console.log(`  ${res.status} ${res.url}`);
    });
    console.log('');

    // Extraer contenido del chat
    const chatContent = await chatFrame.evaluate(() => document.body.innerText);
    console.log('CONTENIDO DEL CHAT:');
    console.log('-------------------');
    console.log(chatContent);
    console.log('-------------------\n');

    console.log('📸 Screenshots guardados:');
    console.log('   /tmp/proveedor-01-eventos.png');
    console.log('   /tmp/proveedor-02-copilot-abierto.png');
    console.log('   /tmp/proveedor-03-despues-pregunta.png\n');

    console.log('🦊 Firefox permanece abierto para inspección manual\n');
    console.log('======================================================================\n');

    // Mantener abierto
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
