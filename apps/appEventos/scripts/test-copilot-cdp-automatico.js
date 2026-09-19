#!/usr/bin/env node

/**
 * TEST COPILOT - Control Total con Chrome DevTools Protocol
 *
 * Este script se conecta al Chrome que YA está abierto en puerto 9222
 * y tiene CONTROL TOTAL sin que Firebase detecte automatización.
 *
 * Ventajas:
 * - Usa tu Chrome REAL (con MCP plugins instalados)
 * - Firebase NO detecta automatización
 * - Login MANUAL pero test AUTOMÁTICO
 * - Control total del navegador
 */

const puppeteer = require('puppeteer');

const URL = 'https://app-test.bodasdehoy.com';
const CDP_PORT = 9222;

// Resultados del test
const resultados = {
  login: null,
  usuario: null,
  eventos: [],
  pregunta1: null,
  pregunta2: null,
  pregunta3: null,
  screenshots: []
};

async function screenshot(page, name) {
  const path = `/tmp/copilot-cdp-${name}.png`;
  try {
    await page.screenshot({ path, fullPage: false });
    console.log(`  📸 ${path}`);
    resultados.screenshots.push({ name, path });
    return path;
  } catch (e) {
    console.log(`  ⚠️  Error capturando screenshot: ${e.message}`);
    return null;
  }
}

async function waitForCookies(page, maxAttempts = 90) {
  console.log('\n⏳ Esperando que hagas login...');
  console.log('   Por favor, haz login manualmente en el navegador\n');

  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000));

    const cookies = await page.cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    if (attempts % 10 === 0) {
      console.log(`   [${attempts * 2}s] Esperando login... (idToken=${hasIdToken ? '✅' : '❌'}, sessionBodas=${hasSessionBodas ? '✅' : '❌'})`);
    }

    if (hasIdToken && hasSessionBodas) {
      console.log('\n✅ Login completado! Cookies establecidas');
      resultados.login = { success: true, time: attempts * 2 };
      return true;
    }
  }

  console.log('\n⚠️  Timeout esperando login (3 minutos)');
  resultados.login = { success: false, reason: 'timeout' };
  return false;
}

async function askQuestion(page, question, questionNumber) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`PREGUNTA ${questionNumber}: "${question}"`);
  console.log('='.repeat(70));

  // Buscar el iframe del Copilot
  const frames = page.frames();
  console.log(`  🔍 Buscando iframe del Copilot entre ${frames.length} frames...`);

  const copilotFrame = frames.find(f => {
    const url = f.url();
    return url.includes('chat') || url.includes('copilot') || url.includes(':3210') || url.includes('lobe');
  });

  if (!copilotFrame) {
    console.log('  ❌ Frame del Copilot no encontrado');
    console.log(`  📋 Frames disponibles:`);
    frames.forEach((f, i) => {
      console.log(`     ${i + 1}. ${f.url().substring(0, 80)}...`);
    });
    await screenshot(page, `q${questionNumber}-no-frame`);
    return { success: false, reason: 'no_frame' };
  }

  console.log(`  ✅ Frame encontrado: ${copilotFrame.url().substring(0, 60)}...`);

  try {
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Buscar el input
    let inputElement = null;
    const selectors = [
      '[contenteditable="true"]',
      'textarea',
      'input[type="text"]',
      '[role="textbox"]',
      '.ProseMirror'
    ];

    for (const selector of selectors) {
      try {
        const elements = await copilotFrame.$$(selector);
        for (const element of elements) {
          const isVisible = await element.isVisible().catch(() => false);
          if (isVisible) {
            inputElement = element;
            console.log(`  ✅ Input encontrado con: ${selector}`);
            break;
          }
        }
        if (inputElement) break;
      } catch (e) {
        // Continuar con el siguiente selector
      }
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
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Limpiar el input primero
    await inputElement.evaluate(el => {
      if (el.tagName === 'DIV' || el.contentEditable === 'true') {
        el.textContent = '';
      } else {
        el.value = '';
      }
    });

    await inputElement.type(question, { delay: 50 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await screenshot(page, `q${questionNumber}-02-escrita`);

    // Enviar
    console.log('  📤 Enviando...');
    const sendBtn = await copilotFrame.$('button[type="submit"]');
    if (sendBtn) {
      await sendBtn.click();
      console.log('     Enviado con botón submit');
    } else {
      // Intentar Enter
      await inputElement.press('Enter');
      console.log('     Enviado con Enter');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
    await screenshot(page, `q${questionNumber}-03-enviada`);

    // Esperar respuesta
    console.log('  ⏳ Esperando respuesta (90s)...');

    for (let i = 15; i <= 90; i += 15) {
      await new Promise(resolve => setTimeout(resolve, 15000));
      console.log(`     ${i}s...`);

      if (i === 45) {
        await screenshot(page, `q${questionNumber}-04-medio`);
      }

      if (i === 90) {
        await screenshot(page, `q${questionNumber}-05-final`);
      }
    }

    // Extraer texto de la respuesta
    const responseText = await copilotFrame.evaluate(() => {
      const messages = document.querySelectorAll('[data-role="assistant"], .message-assistant, .assistant-message');
      const lastMessage = messages[messages.length - 1];
      return lastMessage ? lastMessage.textContent : 'No se pudo extraer respuesta';
    }).catch(() => 'Error extrayendo respuesta');

    console.log('  ✅ Respuesta capturada\n');
    console.log(`  📝 Extracto: ${responseText.substring(0, 200)}...`);

    return {
      success: true,
      question,
      response: responseText,
      screenshots: [
        `q${questionNumber}-01-antes`,
        `q${questionNumber}-02-escrita`,
        `q${questionNumber}-03-enviada`,
        `q${questionNumber}-04-medio`,
        `q${questionNumber}-05-final`
      ]
    };

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    await screenshot(page, `q${questionNumber}-error`);
    return { success: false, reason: 'error', error: error.message };
  }
}

(async () => {
  console.log('======================================================================');
  console.log('TEST COPILOT - CONTROL TOTAL CON CDP');
  console.log('======================================================================\n');

  console.log('✅ Este script se conecta a tu Chrome REAL en puerto 9222');
  console.log('✅ Firebase NO detecta automatización');
  console.log('✅ Tú haces login manualmente');
  console.log('✅ El test continúa automáticamente\n');
  console.log('======================================================================\n');

  console.log('⏳ Conectando a Chrome en puerto 9222...\n');

  try {
    const browserURL = `http://localhost:${CDP_PORT}`;
    const browser = await puppeteer.connect({
      browserURL,
      defaultViewport: null
    });

    console.log('✅ ¡Conectado a Chrome exitosamente!\n');

    const pages = await browser.pages();
    let page;

    // Buscar página con app-test o crear nueva
    page = pages.find(p => p.url().includes('app-test.bodasdehoy.com'));

    if (!page) {
      console.log('   Creando nueva pestaña...\n');
      page = await browser.newPage();
    } else {
      console.log(`   Usando pestaña existente: ${page.url()}\n`);
    }

    // [PASO 1] Navegar a login
    console.log('[PASO 1] Navegando a /login...\n');
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('  ✅ Página cargada\n');
    await screenshot(page, '01-login-page');

    // [PASO 2] Esperar login manual
    console.log('[PASO 2] Esperando login manual...\n');
    console.log('  👉 Por favor, haz login en el navegador con:');
    console.log('     Email: bodasdehoy.com@gmail.com');
    console.log('     Password: [definida en TEST_USER_PASSWORD]\n');

    const loginSuccess = await waitForCookies(page, 90);

    if (!loginSuccess) {
      console.log('\n❌ ERROR: Login no completado en 3 minutos');
      console.log('🖥️  NAVEGADOR ABIERTO - Presiona Ctrl+C para cerrar');

      // Guardar resultados parciales
      const fs = require('fs');
      fs.writeFileSync(
        '/tmp/copilot-test-resultados-parciales.json',
        JSON.stringify(resultados, null, 2)
      );

      await new Promise(() => {});
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    await screenshot(page, '02-after-login');

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
        console.log('   El login puede no haber funcionado correctamente\n');
      }
    } else {
      console.log('⚠️  No se pudo obtener info del usuario');
    }

    // [PASO 4] Navegar a homepage
    console.log('\n[PASO 4] Navegando a homepage...\n');
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    await screenshot(page, '03-homepage');

    // [PASO 5] Abrir Copilot
    console.log('\n[PASO 5] Abriendo Copilot...\n');

    const copilotOpened = await page.evaluate(() => {
      // Buscar botón del Copilot
      const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = btns.find(b => b.textContent?.toLowerCase().includes('copilot'));
      if (btn) {
        console.log('[Test] Copilot button found, clicking...');
        btn.click();
        return true;
      } else {
        console.log('[Test] Copilot button NOT found');
        // Intentar atajo de teclado
        const event = new KeyboardEvent('keydown', {
          key: 'c',
          code: 'KeyC',
          shiftKey: true,
          metaKey: true, // Cmd en Mac
          ctrlKey: false,
          bubbles: true
        });
        document.dispatchEvent(event);
        return false;
      }
    });

    if (copilotOpened) {
      console.log('  ✅ Botón Copilot encontrado y clickeado');
    } else {
      console.log('  ⚠️  Botón no encontrado, intentando atajo Cmd+Shift+C');
    }

    await new Promise(resolve => setTimeout(resolve, 8000));
    await screenshot(page, '04-copilot-opened');

    // [PASO 6] Esperar iframe
    console.log('\n[PASO 6] Esperando iframe del Copilot...\n');

    let iframeReady = false;
    for (let i = 1; i <= 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const frames = page.frames();
      const copilotFrame = frames.find(f => {
        const url = f.url();
        return url.includes('chat') || url.includes('copilot') || url.includes(':3210') || url.includes('lobe');
      });

      if (copilotFrame) {
        console.log(`  ✅ Iframe encontrado después de ${i * 5}s: ${copilotFrame.url().substring(0, 60)}...`);
        iframeReady = true;
        break;
      }

      if (i % 3 === 0) {
        console.log(`  ⏳ ${i * 5}s... aún buscando iframe`);
      }
    }

    if (!iframeReady) {
      console.log('  ⚠️  Iframe no encontrado después de 60s');
    }

    await screenshot(page, '05-iframe-ready');

    // [PASO 7] Hacer las 3 preguntas
    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];

    for (let i = 0; i < questions.length; i++) {
      const result = await askQuestion(page, questions[i], i + 1);

      if (i === 0) resultados.pregunta1 = result;
      if (i === 1) resultados.pregunta2 = result;
      if (i === 2) resultados.pregunta3 = result;

      if (i < questions.length - 1) {
        console.log('\n⏸️  Pausa 10s antes de siguiente pregunta...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // [RESUMEN]
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN DEL TEST');
    console.log('='.repeat(70));
    console.log(`Login: ${resultados.login?.success ? '✅' : '❌'}`);
    console.log(`Usuario: ${resultados.usuario?.displayName || 'N/A'} (${resultados.usuario?.email || 'N/A'})`);
    console.log(`Pregunta 1: ${resultados.pregunta1?.success ? '✅' : '❌'}`);
    console.log(`Pregunta 2: ${resultados.pregunta2?.success ? '✅' : '❌'}`);
    console.log(`Pregunta 3: ${resultados.pregunta3?.success ? '✅' : '❌'}`);
    console.log(`Screenshots capturados: ${resultados.screenshots.length}`);
    console.log('='.repeat(70));

    const allSuccess = resultados.pregunta1?.success &&
                       resultados.pregunta2?.success &&
                       resultados.pregunta3?.success;

    if (allSuccess) {
      console.log('\n✅✅✅ TEST COMPLETADO EXITOSAMENTE ✅✅✅');
    } else {
      console.log('\n⚠️  TEST COMPLETADO CON ALGUNOS ERRORES');
    }

    // Guardar resultados completos
    const fs = require('fs');
    fs.writeFileSync(
      '/tmp/copilot-test-resultados.json',
      JSON.stringify(resultados, null, 2)
    );
    console.log('\n📊 Resultados guardados en: /tmp/copilot-test-resultados.json');
    console.log('📸 Screenshots en: /tmp/copilot-cdp-*.png');

    console.log('\n' + '='.repeat(70));
    console.log('🖥️  NAVEGADOR PERMANECE ABIERTO');
    console.log('='.repeat(70));
    console.log('\nPuedes:');
    console.log('  ✅ Ver las respuestas del Copilot en el navegador');
    console.log('  ✅ Hacer preguntas adicionales manualmente');
    console.log('  ✅ Verificar los datos mostrados');
    console.log('  ✅ Revisar los resultados en /tmp/copilot-test-resultados.json');
    console.log('\n👉 Presiona Ctrl+C para DESCONECTAR (Chrome seguirá abierto)');
    console.log('='.repeat(70));

    // Mantener conexión
    await new Promise(() => {});

  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n❌ ERROR: No se pudo conectar a Chrome en puerto 9222\n');
      console.log('Por favor, primero abre Chrome con debugging:');
      console.log('open -a "Google Chrome" --args --remote-debugging-port=9222');
    } else {
      console.error('\n❌ ERROR:', error.message);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    }

    // Guardar resultados parciales en caso de error
    const fs = require('fs');
    fs.writeFileSync(
      '/tmp/copilot-test-error.json',
      JSON.stringify({ error: error.message, resultados }, null, 2)
    );

    process.exit(1);
  }
})();
