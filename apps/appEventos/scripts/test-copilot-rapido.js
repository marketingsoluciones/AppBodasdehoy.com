#!/usr/bin/env node

/**
 * Test RÁPIDO del Copilot - Solo 1 pregunta, 30 segundos
 */

const { firefox } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';

async function main() {
  console.log('\n======================================================================');
  console.log('TEST RÁPIDO COPILOT - 1 PREGUNTA');
  console.log('======================================================================\n');

  let browser;

  try {
    // 1. Abrir Firefox con perfil persistente
    console.log('[1] Abriendo Firefox...\n');
    const userDataDir = '/tmp/firefox-copilot-profile';
    browser = await firefox.launchPersistentContext(userDataDir, {
      headless: false,
      args: []
    });

    const page = browser.pages()[0] || await browser.newPage();

    // 2. Ir a eventos
    console.log('[2] Navegando a eventos...\n');
    await page.goto(`${URL}/eventos`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 3. Verificar cookies
    const cookies = await browser.cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSession = cookies.some(c => c.name === 'sessionBodas');

    console.log(`   Cookies: idToken=${hasIdToken ? '✅' : '❌'}, session=${hasSession ? '✅' : '❌'}\n`);

    if (!hasIdToken || !hasSession) {
      throw new Error('❌ No hay sesión - Ejecuta primero test-copilot-auto-login.js');
    }

    await page.screenshot({ path: '/tmp/rapido-01-eventos.png' });

    // 4. Abrir Copilot
    console.log('[3] Abriendo Copilot...\n');
    await page.click('button:has-text("Copilot")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/rapido-02-copilot-abierto.png' });

    // 5. Hacer pregunta
    console.log('[4] Enviando pregunta: "¿Cuántos eventos tengo?"\n');

    const frames = page.frames();
    let chatFrame = null;

    for (const frame of frames) {
      try {
        const url = frame.url();
        if (url.includes('chat') || url.includes('copilot') || url.includes('lobe')) {
          chatFrame = frame;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!chatFrame) {
      console.log('   ⚠️ No se encontró iframe, usando selector directo\n');
      const frameLocator = page.frameLocator('iframe').first();
      const input = frameLocator.locator('textarea, [contenteditable="true"]').first();
      await input.fill('¿Cuántos eventos tengo?');
      await input.press('Enter');
    } else {
      console.log('   ✅ Iframe encontrado\n');
      const input = chatFrame.locator('textarea, [contenteditable="true"]').first();
      await input.fill('¿Cuántos eventos tengo?');
      await input.press('Enter');
    }

    console.log('   ✅ Pregunta enviada\n');
    console.log('[5] Esperando respuesta (30 segundos)...\n');

    // Esperar 30 segundos
    await page.waitForTimeout(30000);

    await page.screenshot({ path: '/tmp/rapido-03-respuesta.png' });

    console.log('\n======================================================================');
    console.log('✅ TEST COMPLETADO');
    console.log('======================================================================\n');
    console.log('📸 Screenshots:');
    console.log('   - /tmp/rapido-01-eventos.png');
    console.log('   - /tmp/rapido-02-copilot-abierto.png');
    console.log('   - /tmp/rapido-03-respuesta.png\n');
    console.log('🦊 Firefox permanece abierto - Presiona Ctrl+C para cerrar\n');

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
