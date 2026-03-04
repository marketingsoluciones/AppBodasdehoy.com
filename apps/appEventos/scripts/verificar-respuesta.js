#!/usr/bin/env node

/**
 * Verificar si el Copilot respondió - Extrae texto del chat
 */

const { firefox } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';

async function main() {
  console.log('\n======================================================================');
  console.log('VERIFICACIÓN DE RESPUESTA DEL COPILOT');
  console.log('======================================================================\n');

  let browser;

  try {
    // Conectar al Firefox que ya está abierto
    console.log('[1] Conectando a Firefox existente...\n');
    const userDataDir = '/tmp/firefox-copilot-profile';
    browser = await firefox.launchPersistentContext(userDataDir, {
      headless: false,
      args: []
    });

    const page = browser.pages()[0];

    console.log('[2] Extrayendo texto del Copilot...\n');

    // Buscar el iframe del chat
    const frames = page.frames();
    let chatFrame = null;

    for (const frame of frames) {
      try {
        const url = frame.url();
        if (url.includes('chat') || url.includes('copilot') || url.includes('lobe')) {
          chatFrame = frame;
          console.log(`   ✅ Iframe encontrado: ${url}\n`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (chatFrame) {
      // Extraer todo el texto del chat
      const chatText = await chatFrame.evaluate(() => {
        return document.body.innerText;
      });

      console.log('📝 CONTENIDO DEL CHAT:\n');
      console.log('---------------------------------------------------');
      console.log(chatText);
      console.log('---------------------------------------------------\n');

      // Buscar mensajes específicos
      const hasQuestion = chatText.includes('¿Cuántos eventos tengo?');
      const hasBienvenida = chatText.includes('Bienvenido');
      const hasResponse = chatText.length > 100; // Si tiene más de 100 caracteres, probablemente hay respuesta

      console.log('📊 ANÁLISIS:\n');
      console.log(`   ¿Contiene la pregunta?: ${hasQuestion ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   ¿Contiene "Bienvenido"?: ${hasBienvenida ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   Longitud del texto: ${chatText.length} caracteres`);
      console.log(`   ¿Hay contenido sustancial?: ${hasResponse ? '✅ SÍ' : '❌ NO'}\n');

      // Verificar si hay mensajes del asistente
      const hasAssistantMessage = chatText.toLowerCase().includes('evento') ||
                                   chatText.toLowerCase().includes('tienes') ||
                                   chatText.toLowerCase().includes('total');

      console.log(`   ¿Posible respuesta del asistente?: ${hasAssistantMessage ? '✅ SÍ' : '❌ NO'}\n`);

    } else {
      console.log('   ❌ NO se encontró iframe del chat\n');
    }

    console.log('======================================================================\n');
    console.log('🦊 Firefox permanece abierto\n');

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
