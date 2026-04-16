#!/usr/bin/env node

/**
 * TEST COPILOT - CDP con VISUALIZACIÓN COMPLETA
 *
 * Este script:
 * - Se conecta al Chrome en puerto 9222 (Chrome DevTools Protocol)
 * - Toma screenshots cada 3 segundos automáticamente
 * - Muestra EXACTAMENTE qué está pasando
 * - Permite login MANUAL
 * - Continúa automáticamente después
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs');

const URL = 'https://app-test.bodasdehoy.com';
let screenshotCounter = 0;
let screenshotInterval = null;

async function takeScreenshot(client, name) {
  try {
    const { data } = await client.Page.captureScreenshot({ format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    const path = `/tmp/cdp-visual-${name}.png`;
    fs.writeFileSync(path, buffer);
    console.log(`📸 Screenshot: ${path}`);
    return path;
  } catch (e) {
    console.log(`⚠️  Error screenshot: ${e.message}`);
    return null;
  }
}

async function startAutoScreenshots(client) {
  console.log('📹 Iniciando captura automática cada 3s...\n');

  screenshotInterval = setInterval(async () => {
    screenshotCounter++;
    await takeScreenshot(client, `auto-${String(screenshotCounter).padStart(3, '0')}`);
  }, 3000);
}

function stopAutoScreenshots() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    console.log('\n📹 Captura automática detenida\n');
  }
}

async function waitForCookies(client, maxAttempts = 90) {
  console.log('\n⏳ Esperando que hagas login MANUALMENTE...');
  console.log('   (Los screenshots se están capturando automáticamente)\n');

  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { cookies } = await client.Network.getCookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    if (attempts % 10 === 0) {
      console.log(`   [${attempts * 2}s] idToken=${hasIdToken ? '✅' : '❌'}, sessionBodas=${hasSessionBodas ? '✅' : '❌'}`);
    }

    if (hasIdToken && hasSessionBodas) {
      console.log('\n✅ Login detectado!\n');
      return true;
    }
  }

  console.log('\n⚠️  Timeout (3 minutos)\n');
  return false;
}

async function askQuestionCDP(client, question, questionNumber) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`PREGUNTA ${questionNumber}: "${question}"`);
  console.log('='.repeat(70));

  try {
    await takeScreenshot(client, `q${questionNumber}-01-antes`);

    // Buscar el iframe del Copilot
    const { frameTree } = await client.Page.getFrameTree();

    function findCopilotFrame(tree) {
      if (tree.frame.url && (
        tree.frame.url.includes('chat') ||
        tree.frame.url.includes('copilot') ||
        tree.frame.url.includes(':3210') ||
        tree.frame.url.includes('lobe')
      )) {
        return tree.frame;
      }

      if (tree.childFrames) {
        for (const child of tree.childFrames) {
          const found = findCopilotFrame(child);
          if (found) return found;
        }
      }

      return null;
    }

    const copilotFrame = findCopilotFrame(frameTree);

    if (!copilotFrame) {
      console.log('❌ Frame del Copilot no encontrado');
      await takeScreenshot(client, `q${questionNumber}-no-frame`);
      return { success: false, reason: 'no_frame' };
    }

    console.log(`✅ Frame encontrado: ${copilotFrame.url.substring(0, 60)}...`);

    // Buscar el input en el frame
    const inputSelectors = [
      '[contenteditable="true"]',
      'textarea',
      'input[type="text"]',
      '[role="textbox"]',
      '.ProseMirror'
    ];

    let inputFound = false;
    let inputSelector = null;

    for (const selector of inputSelectors) {
      const result = await client.Runtime.evaluate({
        expression: `
          const frame = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"], iframe[src*="3210"], iframe[src*="lobe"]');
          if (!frame) false;
          else {
            const doc = frame.contentDocument || frame.contentWindow.document;
            const input = doc.querySelector('${selector}');
            input && input.offsetParent !== null;
          }
        `,
        returnByValue: true
      });

      if (result.result.value) {
        inputFound = true;
        inputSelector = selector;
        console.log(`✅ Input encontrado: ${selector}`);
        break;
      }
    }

    if (!inputFound) {
      console.log('❌ Input no encontrado');
      await takeScreenshot(client, `q${questionNumber}-no-input`);
      return { success: false, reason: 'no_input' };
    }

    // Escribir la pregunta
    console.log('⌨️  Escribiendo pregunta...');

    await client.Runtime.evaluate({
      expression: `
        (function() {
          const frame = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"], iframe[src*="3210"], iframe[src*="lobe"]');
          if (!frame) return false;

          const doc = frame.contentDocument || frame.contentWindow.document;
          const input = doc.querySelector('${inputSelector}');
          if (!input) return false;

          // Limpiar
          if (input.tagName === 'DIV' || input.contentEditable === 'true') {
            input.textContent = '';
          } else {
            input.value = '';
          }

          // Enfocar
          input.focus();

          // Escribir
          if (input.tagName === 'DIV' || input.contentEditable === 'true') {
            input.textContent = \`${question}\`;
          } else {
            input.value = \`${question}\`;
          }

          // Trigger events
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          return true;
        })()
      `,
      returnByValue: true
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    await takeScreenshot(client, `q${questionNumber}-02-escrita`);

    // Enviar
    console.log('📤 Enviando...');

    await client.Runtime.evaluate({
      expression: `
        (function() {
          const frame = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"], iframe[src*="3210"], iframe[src*="lobe"]');
          if (!frame) return false;

          const doc = frame.contentDocument || frame.contentWindow.document;

          // Intentar botón submit
          const submitBtn = doc.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.click();
            return true;
          }

          // Intentar Enter
          const input = doc.querySelector('${inputSelector}');
          if (input) {
            const event = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true
            });
            input.dispatchEvent(event);
            return true;
          }

          return false;
        })()
      `,
      returnByValue: true
    });

    await new Promise(resolve => setTimeout(resolve, 3000));
    await takeScreenshot(client, `q${questionNumber}-03-enviada`);

    // Esperar respuesta
    console.log('⏳ Esperando respuesta (90s)...');

    for (let i = 15; i <= 90; i += 15) {
      await new Promise(resolve => setTimeout(resolve, 15000));
      console.log(`   ${i}s...`);

      if (i === 45) {
        await takeScreenshot(client, `q${questionNumber}-04-medio`);
      }

      if (i === 90) {
        await takeScreenshot(client, `q${questionNumber}-05-final`);
      }
    }

    // Extraer respuesta
    const responseResult = await client.Runtime.evaluate({
      expression: `
        (function() {
          const frame = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"], iframe[src*="3210"], iframe[src*="lobe"]');
          if (!frame) return 'Frame not found';

          const doc = frame.contentDocument || frame.contentWindow.document;
          const messages = doc.querySelectorAll('[data-role="assistant"], .message-assistant, .assistant-message');
          const lastMessage = messages[messages.length - 1];

          return lastMessage ? lastMessage.textContent : 'No response found';
        })()
      `,
      returnByValue: true
    });

    const responseText = responseResult.result.value;
    console.log('✅ Respuesta capturada\n');
    console.log(`📝 Extracto: ${responseText.substring(0, 200)}...\n`);

    return {
      success: true,
      question,
      response: responseText
    };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    await takeScreenshot(client, `q${questionNumber}-error`);
    return { success: false, reason: 'error', error: error.message };
  }
}

(async () => {
  console.log('======================================================================');
  console.log('TEST COPILOT - CDP con VISUALIZACIÓN COMPLETA');
  console.log('======================================================================\n');

  console.log('✅ Conecta al Chrome en puerto 9222 (DevTools Protocol)');
  console.log('✅ Screenshots automáticos cada 3 segundos');
  console.log('✅ VES EXACTAMENTE qué está pasando');
  console.log('✅ Login MANUAL + Test AUTOMÁTICO\n');
  console.log('======================================================================\n');

  let client;

  try {
    console.log('🔗 Conectando a Chrome DevTools Protocol...\n');

    // Conectar a Chrome
    client = await CDP({ port: 9222 });

    console.log('✅ Conectado a CDP!\n');

    // Habilitar dominios necesarios
    await Promise.all([
      client.Page.enable(),
      client.Network.enable(),
      client.Runtime.enable(),
      client.DOM.enable()
    ]);

    console.log('✅ Dominios CDP habilitados\n');

    // Iniciar captura automática
    startAutoScreenshots(client);

    // [PASO 1] Navegar a login
    console.log('[PASO 1] Navegando a /login...\n');
    await client.Page.navigate({ url: `${URL}/login` });
    await client.Page.loadEventFired();
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('✅ Página cargada\n');
    await takeScreenshot(client, 'paso1-login-page');

    // [PASO 2] Esperar login manual
    console.log('[PASO 2] Esperando login MANUAL...\n');
    console.log('👉 Por favor, haz login en el navegador con:');
    console.log('   Email: bodasdehoy.com@gmail.com');
    console.log('   Password: lorca2012M*+\n');

    const loginSuccess = await waitForCookies(client, 90);

    if (!loginSuccess) {
      console.log('❌ ERROR: Login no completado\n');
      stopAutoScreenshots();
      console.log('🖥️  Chrome sigue abierto - Presiona Ctrl+C\n');
      await new Promise(() => {});
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
    await takeScreenshot(client, 'paso2-after-login');

    // [PASO 3] Navegar a homepage
    console.log('[PASO 3] Navegando a homepage...\n');
    await client.Page.navigate({ url: URL });
    await client.Page.loadEventFired();
    await new Promise(resolve => setTimeout(resolve, 5000));
    await takeScreenshot(client, 'paso3-homepage');

    // [PASO 4] Abrir Copilot
    console.log('[PASO 4] Abriendo Copilot...\n');

    await client.Runtime.evaluate({
      expression: `
        (function() {
          const btns = Array.from(document.querySelectorAll('button, a, [role="button"]'));
          const btn = btns.find(b => b.textContent?.toLowerCase().includes('copilot'));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true
    });

    await new Promise(resolve => setTimeout(resolve, 8000));
    await takeScreenshot(client, 'paso4-copilot-opened');

    // [PASO 5] Esperar iframe
    console.log('[PASO 5] Esperando iframe del Copilot...\n');

    let iframeReady = false;
    for (let i = 1; i <= 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const result = await client.Runtime.evaluate({
        expression: `
          !!document.querySelector('iframe[src*="chat"], iframe[src*="copilot"], iframe[src*="3210"], iframe[src*="lobe"]')
        `,
        returnByValue: true
      });

      if (result.result.value) {
        console.log(`✅ Iframe encontrado después de ${i * 5}s\n`);
        iframeReady = true;
        break;
      }

      if (i % 3 === 0) {
        console.log(`⏳ ${i * 5}s... buscando iframe`);
      }
    }

    if (!iframeReady) {
      console.log('⚠️  Iframe no encontrado después de 60s\n');
    }

    await takeScreenshot(client, 'paso5-iframe-ready');

    // Detener screenshots automáticos para las preguntas
    stopAutoScreenshots();

    // [PASO 6] Hacer las 3 preguntas
    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];

    const resultados = [];

    for (let i = 0; i < questions.length; i++) {
      const result = await askQuestionCDP(client, questions[i], i + 1);
      resultados.push(result);

      if (i < questions.length - 1) {
        console.log('\n⏸️  Pausa 10s...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    // [RESUMEN]
    console.log('\n' + '='.repeat(70));
    console.log('RESUMEN');
    console.log('='.repeat(70));
    resultados.forEach((r, i) => {
      console.log(`${i + 1}. ${r.success ? '✅' : '❌'} ${r.question || questions[i]}`);
    });
    console.log('='.repeat(70));

    const allSuccess = resultados.every(r => r.success);

    if (allSuccess) {
      console.log('\n✅✅✅ TEST COMPLETADO EXITOSAMENTE ✅✅✅');
    } else {
      console.log('\n⚠️  TEST COMPLETADO CON ALGUNOS ERRORES');
    }

    // Guardar resultados
    fs.writeFileSync(
      '/tmp/cdp-visual-resultados.json',
      JSON.stringify({ resultados, screenshots: screenshotCounter }, null, 2)
    );

    console.log('\n📊 Resultados: /tmp/cdp-visual-resultados.json');
    console.log(`📸 Screenshots capturados: ${screenshotCounter + resultados.length * 5}`);
    console.log('📁 Ubicación: /tmp/cdp-visual-*.png\n');

    console.log('='.repeat(70));
    console.log('🖥️  CHROME PERMANECE ABIERTO');
    console.log('='.repeat(70));
    console.log('\nPresiona Ctrl+C para cerrar\n');

    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  No se pudo conectar a Chrome en puerto 9222\n');
      console.log('Por favor, abre Chrome con debugging:');
      console.log('open -a "Google Chrome" --args --remote-debugging-port=9222\n');
    }

    stopAutoScreenshots();

    if (client) {
      await client.close();
    }

    process.exit(1);
  }
})();
