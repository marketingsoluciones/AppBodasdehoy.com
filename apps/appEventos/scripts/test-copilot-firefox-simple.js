#!/usr/bin/env node

/**
 * TEST COPILOT - FIREFOX SIMPLE (Sin playwright-extra)
 *
 * Este script:
 * - Usa FIREFOX en lugar de Chrome/Chromium
 * - Playwright estándar (sin playwright-extra)
 * - Firefox NO usa CDP → Usa WebDriver BiDi
 * - Login AUTOMÁTICO
 * - Firebase NO lo detecta
 */

const { firefox } = require('playwright');
const fs = require('fs');

const URL = 'https://app-test.bodasdehoy.com';
const EMAIL = 'bodasdehoy.com@gmail.com';
const PASSWORD = 'lorca2012M*+';

async function screenshot(page, name) {
  const path = `/tmp/firefox-${name}.png`;
  await page.screenshot({ path });
  console.log(`📸 Screenshot: ${path}`);
  return path;
}

async function main() {
  console.log('======================================================================');
  console.log('TEST COPILOT - FIREFOX SIMPLE');
  console.log('======================================================================\n');

  let browser, context, page;

  try {
    // [PASO 1] Abrir Firefox
    console.log('[PASO 1] Abriendo Firefox...\n');

    browser = await firefox.launch({
      headless: false,
      firefoxUserPrefs: {
        // Preferencias para evitar detección
        'dom.webdriver.enabled': false,
        'useAutomationExtension': false
      }
    });

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    page = await context.newPage();

    console.log('✅ Firefox abierto\n');

    // [PASO 2] Navegar a login
    console.log('[PASO 2] Navegando a /login...\n');

    await page.goto(`${URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-login-page');

    console.log('✅ Página de login cargada\n');

    // [PASO 3] Login AUTOMÁTICO
    console.log('[PASO 3] Login AUTOMÁTICO...\n');
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Password: ${'*'.repeat(PASSWORD.length)}\n`);

    // Esperar y llenar email
    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.fill('input[type="email"]', EMAIL);
    await page.waitForTimeout(1000);

    // Esperar y llenar password
    await page.waitForSelector('input[type="password"]', { state: 'visible' });
    await page.fill('input[type="password"]', PASSWORD);
    await page.waitForTimeout(1000);

    await screenshot(page, '02-credentials-filled');

    // Hacer clic en submit - Múltiples selectores
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Iniciar sesión")',
      'button:has-text("Iniciar")',
      'button:has-text("Entrar")',
      'button:has-text("Login")',
      'form button[type="button"]',
      'form button',
      '[type="submit"]'
    ];

    let submitClicked = false;
    for (const selector of submitSelectors) {
      try {
        if (await page.isVisible(selector)) {
          console.log(`   ✅ Botón submit encontrado: ${selector}`);
          await page.click(selector);
          submitClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!submitClicked) {
      console.log('   ⚠️ Intentando presionar Enter en el campo de password...');
      await page.press('input[type="password"]', 'Enter');
    }

    console.log('   ⏳ Esperando redirect después del login...');

    // Esperar redirect (máximo 30 segundos)
    try {
      await page.waitForURL(`${URL}/**`, { timeout: 30000 });
      console.log('✅ Redirect completado\n');
    } catch (e) {
      console.log('⚠️  No hubo redirect explícito, verificando cookies...\n');
    }

    await page.waitForTimeout(5000);
    await screenshot(page, '03-after-login');

    // [PASO 4] Verificar cookies
    console.log('[PASO 4] Verificando cookies...\n');

    const cookies = await context.cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

    console.log(`   idToken: ${hasIdToken ? '✅' : '❌'}`);
    console.log(`   sessionBodas: ${hasSessionBodas ? '✅' : '❌'}\n`);

    if (!hasIdToken || !hasSessionBodas) {
      console.log('⚠️  Cookies no establecidas - Verificando si hay overlay de Firebase...');
      await screenshot(page, '04-firebase-overlay');

      // Verificar si hay overlay
      const overlayVisible = await page.isVisible('text=Un momento, por favor');
      console.log(`   Overlay Firebase visible: ${overlayVisible ? '❌ SÍ' : '✅ NO'}\n`);

      if (overlayVisible) {
        throw new Error('❌ Firebase detectó automatización (overlay visible)');
      } else {
        console.log('   Esperando 10s más para cookies...\n');
        await page.waitForTimeout(10000);

        const cookiesRetry = await context.cookies();
        const hasIdTokenRetry = cookiesRetry.some(c => c.name === 'idTokenV0.1.0');
        const hasSessionBodasRetry = cookiesRetry.some(c => c.name === 'sessionBodas');

        console.log(`   idToken (retry): ${hasIdTokenRetry ? '✅' : '❌'}`);
        console.log(`   sessionBodas (retry): ${hasSessionBodasRetry ? '✅' : '❌'}\n`);

        if (!hasIdTokenRetry || !hasSessionBodasRetry) {
          throw new Error('❌ Cookies no se establecieron después de 2 intentos');
        }
      }
    }

    console.log('✅ Login exitoso - Cookies establecidas\n');

    // [PASO 5] Navegar a home
    console.log('[PASO 5] Navegando a homepage...\n');
    await page.goto(URL);
    await page.waitForTimeout(5000);
    await screenshot(page, '05-homepage');

    // [PASO 6] Buscar y abrir Copilot
    console.log('[PASO 6] Buscando botón del Copilot...\n');

    // Esperar un poco para que la UI cargue
    await page.waitForTimeout(3000);

    // Buscar botón del Copilot (múltiples selectores)
    const copilotSelectors = [
      'button:has-text("Copilot")',
      'button:has-text("Chat")',
      '[aria-label*="Copilot"]',
      '[aria-label*="Chat"]',
      'button[title*="Copilot"]',
      'button[title*="Chat"]'
    ];

    let copilotFound = false;
    for (const selector of copilotSelectors) {
      try {
        if (await page.isVisible(selector)) {
          console.log(`✅ Copilot encontrado con: ${selector}`);
          await page.click(selector);
          copilotFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!copilotFound) {
      console.log('⚠️  Botón de Copilot no encontrado con selectores estándar');
      console.log('   Capturando screenshot para debug...\n');
      await screenshot(page, '06-no-copilot-button');
    } else {
      await page.waitForTimeout(8000);
      await screenshot(page, '06-copilot-opened');
      console.log('✅ Copilot abierto\n');
    }

    // Guardar resultados
    fs.writeFileSync(
      '/tmp/firefox-simple-resultados.json',
      JSON.stringify({
        browser: 'Firefox',
        playwrightVersion: 'standard',
        detectedByFirebase: false,
        loginAutomatic: true,
        cookiesEstablished: true,
        copilotFound
      }, null, 2)
    );

    console.log('='.repeat(70));
    console.log('✅ TEST COMPLETADO');
    console.log('='.repeat(70));
    console.log('\n📊 Resultados: /tmp/firefox-simple-resultados.json');
    console.log('📸 Screenshots: /tmp/firefox-*.png\n');
    console.log('🦊 Firefox permanece abierto - Presiona Ctrl+C para cerrar\n');

    await new Promise(() => {}); // Mantener abierto

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);

    if (page) {
      await screenshot(page, 'error-final');
    }

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
}

main();
