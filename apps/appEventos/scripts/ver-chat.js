#!/usr/bin/env node

const { firefox } = require('playwright');

async function main() {
  const browser = await firefox.launchPersistentContext('/tmp/firefox-copilot-profile', {
    headless: false,
    args: []
  });

  const page = browser.pages()[0];

  // Buscar iframe
  const frames = page.frames();
  let chatFrame = null;

  for (const frame of frames) {
    try {
      const url = frame.url();
      if (url.includes('chat') || url.includes('lobe')) {
        chatFrame = frame;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (chatFrame) {
    const chatText = await chatFrame.evaluate(() => document.body.innerText);
    console.log('\n======= CONTENIDO DEL CHAT =======\n');
    console.log(chatText);
    console.log('\n==================================\n');
    console.log('Longitud:', chatText.length, 'caracteres\n');
  } else {
    console.log('No se encontró iframe del chat\n');
  }

  await new Promise(() => {});
}

main();
