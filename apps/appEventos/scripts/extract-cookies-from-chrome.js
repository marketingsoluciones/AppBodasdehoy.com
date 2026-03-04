#!/usr/bin/env node

/**
 * Script para extraer cookies desde Chrome usando Playwright
 * Sin necesidad de copiar manualmente - extrae desde el navegador actual
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIES_FILE = path.join(__dirname, 'copilot-test-cookies.json');
const URL = 'https://app-test.bodasdehoy.com';

async function main() {
  console.log('\n🚀 Extrayendo cookies desde Chrome...\n');

  let browser;
  try {
    // Conectar a Chrome existente en modo debug
    // Instrucciones: cerrar Chrome completamente y abrir con:
    // /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

    console.log('📋 INSTRUCCIONES:');
    console.log('');
    console.log('1. Asegúrate de estar logueado en https://app-test.bodasdehoy.com');
    console.log('2. Deja esa pestaña abierta');
    console.log('3. Este script extraerá las cookies automáticamente');
    console.log('');
    console.log('⏳ Esperando 5 segundos para que verifiques...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Abrir navegador nuevo y navegar (usuario debe estar logueado)
    console.log('\n🌐 Abriendo navegador...');
    browser = await chromium.launch({
      headless: false,
      channel: 'chrome' // Usar Chrome instalado
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`📍 Navegando a ${URL}...`);
    await page.goto(URL);

    console.log('⏳ Esperando 3 segundos para que la página cargue...');
    await page.waitForTimeout(3000);

    // Obtener cookies
    const cookies = await context.cookies();

    const idToken = cookies.find(c => c.name === 'idTokenV0.1.0');
    const sessionBodas = cookies.find(c => c.name === 'sessionBodas');

    if (!idToken || !sessionBodas) {
      console.log('\n❌ No se encontraron las cookies de autenticación.');
      console.log('');
      console.log('Cookies encontradas:', cookies.map(c => c.name).join(', '));
      console.log('');
      console.log('Por favor:');
      console.log('1. Asegúrate de hacer login en https://app-test.bodasdehoy.com');
      console.log('2. Vuelve a ejecutar este script');
      process.exit(1);
    }

    console.log('\n✅ ¡Cookies encontradas!');
    console.log(`  - idTokenV0.1.0: ${idToken.value.substring(0, 50)}...`);
    console.log(`  - sessionBodas: ${sessionBodas.value}`);

    // Guardar cookies en formato compatible
    const cookiesData = [
      {
        name: 'idTokenV0.1.0',
        value: idToken.value,
        domain: idToken.domain,
        path: idToken.path,
        expires: idToken.expires,
        httpOnly: idToken.httpOnly,
        secure: idToken.secure,
        sameSite: idToken.sameSite
      },
      {
        name: 'sessionBodas',
        value: sessionBodas.value,
        domain: sessionBodas.domain,
        path: sessionBodas.path,
        expires: sessionBodas.expires,
        httpOnly: sessionBodas.httpOnly,
        secure: sessionBodas.secure,
        sameSite: sessionBodas.sameSite
      }
    ];

    fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookiesData, null, 2));

    console.log('\n✅ Cookies guardadas exitosamente en:');
    console.log(`   ${COOKIES_FILE}`);
    console.log('');
    console.log('🚀 Ahora puedes ejecutar:');
    console.log('   node test-copilot-automated-with-cookies.js');
    console.log('');

    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

main();
