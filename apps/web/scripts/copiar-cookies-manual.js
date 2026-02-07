#!/usr/bin/env node

/**
 * COPIAR COOKIES MANUALMENTE - Método Alternativo Rápido
 *
 * Si ya estás loggeado en app-test.bodasdehoy.com en otro navegador:
 * 1. Abre DevTools (F12)
 * 2. Ve a Application > Cookies
 * 3. Copia las cookies idTokenV0.1.0 y sessionBodas
 * 4. Pégalas cuando este script las pida
 *
 * MUCHO MÁS RÁPIDO que esperar login manual en Firefox
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const COOKIES_FILE = path.join(__dirname, 'copilot-test-cookies.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('======================================================================');
  console.log('COPIAR COOKIES MANUALMENTE - Método Alternativo');
  console.log('======================================================================\n');

  console.log('Este método es MÁS RÁPIDO si ya estás loggeado en otro navegador.\n');

  console.log('📋 PASOS:\n');
  console.log('1. Abre https://app-test.bodasdehoy.com en tu navegador');
  console.log('2. Haz login si aún no lo has hecho');
  console.log('3. Presiona F12 para abrir DevTools');
  console.log('4. Ve a Application (o Almacenamiento) > Cookies');
  console.log('5. Busca estas cookies:');
  console.log('   - idTokenV0.1.0');
  console.log('   - sessionBodas\n');

  const opcion = await question('¿Ya tienes las cookies? (s/n): ');

  if (opcion.toLowerCase() !== 's' && opcion.toLowerCase() !== 'si') {
    console.log('\nOk, primero abre el navegador, haz login y obtén las cookies.');
    console.log('Luego ejecuta este script de nuevo.\n');
    rl.close();
    return;
  }

  console.log('\n📝 Ingresa los valores de las cookies:\n');

  // Pedir idToken
  console.log('Cookie 1: idTokenV0.1.0');
  console.log('(Copia el valor completo desde DevTools)\n');
  const idTokenValue = await question('Valor de idTokenV0.1.0: ');

  if (!idTokenValue || idTokenValue.trim().length < 50) {
    console.log('\n❌ Error: El valor del token parece incorrecto (muy corto)');
    console.log('Asegúrate de copiar el valor COMPLETO desde DevTools\n');
    rl.close();
    return;
  }

  // Pedir sessionBodas
  console.log('\nCookie 2: sessionBodas');
  console.log('(Copia el valor completo desde DevTools)\n');
  const sessionValue = await question('Valor de sessionBodas: ');

  if (!sessionValue || sessionValue.trim().length < 10) {
    console.log('\n❌ Error: El valor de la sesión parece incorrecto');
    console.log('Asegúrate de copiar el valor COMPLETO desde DevTools\n');
    rl.close();
    return;
  }

  // Crear estructura de cookies compatible con Playwright
  const cookies = [
    {
      name: 'idTokenV0.1.0',
      value: idTokenValue.trim(),
      domain: 'app-test.bodasdehoy.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 días
      httpOnly: false,
      secure: true,
      sameSite: 'Lax'
    },
    {
      name: 'sessionBodas',
      value: sessionValue.trim(),
      domain: 'app-test.bodasdehoy.com',
      path: '/',
      expires: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 días
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    }
  ];

  // Guardar cookies
  fs.writeFileSync(
    COOKIES_FILE,
    JSON.stringify(cookies, null, 2),
    'utf8'
  );

  console.log('\n' + '='.repeat(70));
  console.log('✅ COOKIES GUARDADAS EXITOSAMENTE');
  console.log('='.repeat(70));
  console.log(`\n📁 Archivo: ${COOKIES_FILE}`);
  console.log(`📊 Tamaño: ${fs.statSync(COOKIES_FILE).size} bytes\n`);

  console.log('🚀 Ahora puedes ejecutar tests automatizados:');
  console.log('   node test-copilot-automated-with-cookies.js\n');

  rl.close();
}

main().catch(error => {
  console.error('\n❌ ERROR:', error.message);
  rl.close();
  process.exit(1);
});
