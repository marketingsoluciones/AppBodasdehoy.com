#!/usr/bin/env node

/**
 * EXTRAER COOKIES DEL NAVEGADOR ACTUAL - MÉTODO MÁS RÁPIDO
 *
 * Este script se conecta a tu navegador actual (si tienes Chrome abierto con debugging)
 * y extrae las cookies automáticamente.
 *
 * MUCHO MÁS RÁPIDO que login manual o copiar/pegar.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const COOKIES_FILE = path.join(__dirname, 'copilot-test-cookies.json');

async function extractCookiesFromBrowser() {
  console.log('======================================================================');
  console.log('EXTRAER COOKIES DEL NAVEGADOR ACTUAL');
  console.log('======================================================================\n');

  console.log('📋 OPCIÓN 1: Conectar a Chrome con debugging\n');
  console.log('Si tienes Chrome abierto, ciérralo y ejecuta:\n');
  console.log('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\');
  console.log('     --remote-debugging-port=9222 \\');
  console.log('     --user-data-dir="/tmp/chrome-debug-profile"\n');
  console.log('Luego navega a https://app-test.bodasdehoy.com y haz login.\n');
  console.log('Presiona Enter cuando estés listo...');

  // Esperar confirmación del usuario
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  try {
    console.log('\n⏳ Conectando al navegador...\n');

    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();

    if (contexts.length === 0) {
      throw new Error('No se encontraron contextos de navegador');
    }

    const context = contexts[0];
    const cookies = await context.cookies();

    // Filtrar solo cookies del dominio
    const relevantCookies = cookies.filter(c =>
      c.domain.includes('bodasdehoy.com')
    );

    const hasIdToken = relevantCookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = relevantCookies.some(c => c.name === 'sessionBodas');

    if (!hasIdToken || !hasSessionBodas) {
      console.log('⚠️ No se encontraron cookies de autenticación.');
      console.log('   Asegúrate de estar loggeado en app-test.bodasdehoy.com\n');
      await browser.close();
      process.exit(1);
    }

    // Guardar cookies
    fs.writeFileSync(
      COOKIES_FILE,
      JSON.stringify(relevantCookies, null, 2),
      'utf8'
    );

    console.log('✅ ¡COOKIES EXTRAÍDAS EXITOSAMENTE!\n');
    console.log(`📁 Archivo: ${COOKIES_FILE}`);
    console.log(`📊 Total de cookies: ${relevantCookies.length}\n`);
    console.log('📋 Cookies de autenticación:');
    console.log(`   ✅ idTokenV0.1.0: Guardada`);
    console.log(`   ✅ sessionBodas: Guardada\n`);

    await browser.close();

    console.log('🚀 Ahora puedes ejecutar tests automatizados:');
    console.log('   node test-copilot-automated-with-cookies.js\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nAsegúrate de:');
    console.error('1. Chrome está ejecutándose con debugging habilitado');
    console.error('2. Estás loggeado en app-test.bodasdehoy.com\n');
    process.exit(1);
  }
}

// Opción alternativa más simple
async function createTemplateFile() {
  console.log('\n======================================================================');
  console.log('OPCIÓN 2: Crear Archivo de Template');
  console.log('======================================================================\n');

  const template = [
    {
      name: 'idTokenV0.1.0',
      value: 'PEGA_AQUI_EL_VALOR_DE_idTokenV0.1.0',
      domain: 'app-test.bodasdehoy.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      httpOnly: false,
      secure: true,
      sameSite: 'Lax'
    },
    {
      name: 'sessionBodas',
      value: 'PEGA_AQUI_EL_VALOR_DE_sessionBodas',
      domain: 'app-test.bodasdehoy.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    }
  ];

  const templateFile = path.join(__dirname, 'copilot-test-cookies.TEMPLATE.json');

  fs.writeFileSync(
    templateFile,
    JSON.stringify(template, null, 2),
    'utf8'
  );

  console.log(`✅ Template creado: ${templateFile}\n`);
  console.log('📋 PASOS:\n');
  console.log('1. Abre https://app-test.bodasdehoy.com en tu navegador');
  console.log('2. Haz login');
  console.log('3. Abre DevTools (F12) > Application > Cookies');
  console.log('4. Copia los valores de:');
  console.log('   - idTokenV0.1.0');
  console.log('   - sessionBodas');
  console.log(`5. Edita ${templateFile}`);
  console.log('6. Reemplaza PEGA_AQUI_EL_VALOR_DE_... con los valores reales');
  console.log(`7. Renombra el archivo a: ${COOKIES_FILE}\n`);
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--template')) {
    await createTemplateFile();
  } else {
    await extractCookiesFromBrowser();
  }
}

main().catch(console.error);
