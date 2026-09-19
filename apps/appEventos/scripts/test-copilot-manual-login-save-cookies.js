#!/usr/bin/env node

/**
 * TEST COPILOT - Login Manual + Guardar Cookies
 *
 * ESTRATEGIA NUEVA:
 * 1. Abre Firefox NORMAL (sin automatización visible)
 * 2. Usuario hace login MANUAL
 * 3. Script captura las cookies de autenticación
 * 4. Guarda cookies en archivo JSON
 * 5. Tests futuros usan esas cookies (sin login)
 *
 * VENTAJAS:
 * ✅ Firebase NO detecta nada (login 100% manual)
 * ✅ Cookies se pueden reutilizar para tests automáticos
 * ✅ No más overlays ni bloqueos
 * ✅ Tests completamente automatizados después del login inicial
 */

const { firefox } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://app-test.bodasdehoy.com';
const COOKIES_FILE = path.join(__dirname, 'copilot-test-cookies.json');

async function waitForLogin(page, context) {
  console.log('\n⏳ Esperando que hagas login MANUALMENTE...\n');
  console.log('=' .repeat(70));
  console.log('📋 INSTRUCCIONES:');
  console.log('=' .repeat(70));
  console.log('\n1️⃣  Ve a la ventana de FIREFOX que se abrió');
  console.log('2️⃣  Ingresa tu email: bodasdehoy.com@gmail.com');
  console.log('3️⃣  Ingresa tu contraseña: [definida en TEST_USER_PASSWORD]');
  console.log('4️⃣  Haz clic en el botón "Continuar" o "Iniciar sesión"');
  console.log('5️⃣  Espera a que cargue la página principal');
  console.log('\n💡 El script detectará automáticamente cuando estés autenticado');
  console.log('💡 NO hay timeout - Toma el tiempo que necesites\n');
  console.log('=' .repeat(70));
  console.log('\n');

  // Esperar hasta que las cookies de autenticación existan
  let authenticated = false;
  let attempts = 0;

  while (!authenticated) {
    await page.waitForTimeout(1000);
    attempts++;

    const cookies = await context.cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    if (hasIdToken && hasSessionBodas) {
      authenticated = true;
      console.log('\n' + '='.repeat(70));
      console.log('✅ ¡LOGIN DETECTADO! Cookies de autenticación encontradas.');
      console.log('='.repeat(70));
      console.log('\n');
      break;
    }

    // Mostrar progreso cada 10 segundos
    if (attempts % 10 === 0) {
      console.log(`   ⏳ Esperando login... (${attempts}s transcurridos)`);
    }

    // Recordatorio cada minuto
    if (attempts % 60 === 0 && attempts > 0) {
      console.log(`\n   💡 Recordatorio: Ve a Firefox y completa el login`);
      console.log(`   📧 Email: bodasdehoy.com@gmail.com\n`);
    }
  }

  return true;
}

async function saveCookies(context) {
  const cookies = await context.cookies();

  // Guardar cookies en archivo JSON
  fs.writeFileSync(
    COOKIES_FILE,
    JSON.stringify(cookies, null, 2),
    'utf8'
  );

  console.log(`✅ Cookies guardadas en: ${COOKIES_FILE}\n`);

  // Mostrar resumen de cookies importantes
  const idToken = cookies.find(c => c.name === 'idTokenV0.1.0');
  const sessionBodas = cookies.find(c => c.name === 'sessionBodas');

  console.log('📋 Cookies de autenticación:');
  console.log(`   idTokenV0.1.0: ${idToken ? '✅ Guardada' : '❌ No encontrada'}`);
  console.log(`   sessionBodas: ${sessionBodas ? '✅ Guardada' : '❌ No encontrada'}`);
  console.log(`   Total de cookies: ${cookies.length}\n`);

  return cookies;
}

async function testCopilot(page) {
  console.log('\n[PASO EXTRA] Probando acceso al Copilot...\n');

  // Navegar a la página principal
  console.log('   Navegando a homepage...');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Tomar screenshot de la página principal
  await page.screenshot({ path: '/tmp/firefox-manual-01-homepage.png' });
  console.log('   📸 Screenshot: /tmp/firefox-manual-01-homepage.png\n');

  // Buscar botón del Copilot
  const copilotSelectors = [
    'button:has-text("Copilot")',
    'button:has-text("Chat")',
    '[aria-label*="Copilot"]',
    '[aria-label*="Chat"]',
    'button[title*="Copilot"]',
    'button[title*="Chat"]',
    // Puede estar en un sidebar o como botón flotante
    '.copilot-button',
    '#copilot-button',
    '[data-testid*="copilot"]'
  ];

  console.log('   Buscando botón del Copilot...');
  let copilotFound = false;

  for (const selector of copilotSelectors) {
    try {
      const isVisible = await page.isVisible(selector, { timeout: 1000 });
      if (isVisible) {
        console.log(`   ✅ Copilot encontrado: ${selector}`);
        await page.click(selector);
        copilotFound = true;
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (copilotFound) {
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/firefox-manual-02-copilot-open.png' });
    console.log('   📸 Screenshot: /tmp/firefox-manual-02-copilot-open.png');
    console.log('   ✅ Copilot abierto exitosamente\n');
  } else {
    console.log('   ⚠️ Botón de Copilot no encontrado (puede ser normal si no está visible)\n');
  }
}

async function main() {
  console.log('======================================================================');
  console.log('TEST COPILOT - Login Manual + Guardar Cookies');
  console.log('======================================================================\n');

  let browser, context, page;

  try {
    // [PASO 1] Abrir Firefox
    console.log('[PASO 1] Abriendo Firefox...\n');

    browser = await firefox.launch({
      headless: false,  // Visible para que puedas hacer login
      slowMo: 50,       // Más lento para que sea más natural
      args: []
    });

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0'
    });

    page = await context.newPage();

    console.log('✅ Firefox abierto\n');

    // [PASO 2] Navegar a login
    console.log('[PASO 2] Navegando a /login...\n');

    await page.goto(`${URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('✅ Página de login cargada\n');

    // [PASO 3] Esperar login manual
    console.log('[PASO 3] Login MANUAL (tú lo haces)...\n');

    await waitForLogin(page, context);

    // [PASO 4] Guardar cookies
    console.log('[PASO 4] Guardando cookies de autenticación...\n');

    await saveCookies(context);

    // [PASO 5] Test opcional del Copilot
    await testCopilot(page);

    // [RESULTADO]
    console.log('='.repeat(70));
    console.log('✅ PROCESO COMPLETADO');
    console.log('='.repeat(70));
    console.log(`\n📁 Cookies guardadas en: ${COOKIES_FILE}`);
    console.log('\n🚀 Ahora puedes ejecutar tests automáticos usando estas cookies:');
    console.log('   node test-copilot-automated-with-cookies.js\n');
    console.log('🦊 Firefox permanece abierto - Presiona Ctrl+C cuando termines\n');

    // Mantener navegador abierto
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
