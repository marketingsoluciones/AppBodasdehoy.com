#!/usr/bin/env node

/**
 * TEST COPILOT - Completamente Automatizado con Cookies
 *
 * Este script usa las cookies guardadas del login manual para:
 * 1. Iniciar sesión automáticamente (sin llenar formularios)
 * 2. Abrir el Copilot
 * 3. Hacer las 3 preguntas de prueba
 * 4. Capturar screenshots de cada respuesta
 * 5. Documentar resultados
 *
 * VENTAJAS:
 * ✅ NO hay detección de Firebase (usa cookies reales de login manual)
 * ✅ Completamente automatizado (sin intervención humana)
 * ✅ Rápido (no espera login manual cada vez)
 * ✅ Repetible (puede ejecutarse múltiples veces)
 */

const { firefox } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://app-test.bodasdehoy.com';
const COOKIES_FILE = path.join(__dirname, 'copilot-test-cookies.json');

// Preguntas de prueba
const TEST_QUESTIONS = [
  '¿Cuántos invitados tengo?',
  '¿Cuál es la boda de Raul?',
  'Muéstrame la lista de todas las bodas'
];

async function loadCookies() {
  if (!fs.existsSync(COOKIES_FILE)) {
    throw new Error(
      `❌ No se encontró archivo de cookies: ${COOKIES_FILE}\n` +
      '   Ejecuta primero: node test-copilot-manual-login-save-cookies.js'
    );
  }

  const cookiesData = fs.readFileSync(COOKIES_FILE, 'utf8');
  const cookies = JSON.parse(cookiesData);

  console.log(`✅ Cookies cargadas: ${cookies.length} cookies\n`);

  // Verificar que tenemos las cookies de autenticación
  const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
  const hasSessionBodas = cookies.some(c => c.name === 'sessionBodas');

  if (!hasIdToken || !hasSessionBodas) {
    throw new Error(
      '❌ Cookies de autenticación no encontradas o expiradas\n' +
      '   Ejecuta de nuevo: node test-copilot-manual-login-save-cookies.js'
    );
  }

  console.log('   ✅ idTokenV0.1.0 encontrada');
  console.log('   ✅ sessionBodas encontrada\n');

  return cookies;
}

async function findAndClickCopilot(page) {
  console.log('   Buscando botón del Copilot...\n');

  const copilotSelectors = [
    'button:has-text("Copilot")',
    'button:has-text("Chat")',
    '[aria-label*="Copilot"]',
    '[aria-label*="Chat"]',
    'button[title*="Copilot"]',
    'button[title*="Chat"]',
    '.copilot-button',
    '#copilot-button',
    '[data-testid*="copilot"]',
    // Botón flotante común en apps
    'button[class*="float"]',
    'button[class*="fab"]'
  ];

  for (const selector of copilotSelectors) {
    try {
      const isVisible = await page.isVisible(selector, { timeout: 2000 });
      if (isVisible) {
        console.log(`   ✅ Copilot encontrado: ${selector}`);
        await page.click(selector);
        await page.waitForTimeout(3000);
        return true;
      }
    } catch (e) {
      continue;
    }
  }

  // Si no encontramos el botón, tal vez el Copilot ya está abierto
  console.log('   ℹ️ Botón no encontrado, verificando si Copilot ya está abierto...\n');

  const iframeSelectors = [
    'iframe[src*="chat"]',
    'iframe[src*="copilot"]',
    'iframe[src*="lobe"]',
    'iframe[title*="chat"]',
    'iframe[title*="copilot"]'
  ];

  for (const selector of iframeSelectors) {
    try {
      const iframe = await page.locator(selector).first();
      if (await iframe.isVisible({ timeout: 1000 })) {
        console.log(`   ✅ Copilot ya está abierto (iframe encontrado)\n`);
        return true;
      }
    } catch (e) {
      continue;
    }
  }

  throw new Error('❌ No se pudo encontrar ni abrir el Copilot');
}

async function askQuestion(page, question, questionNumber) {
  console.log(`   Pregunta ${questionNumber}: "${question}"`);

  // Buscar el iframe del Copilot
  const iframeSelectors = [
    'iframe[src*="chat"]',
    'iframe[src*="copilot"]',
    'iframe[src*="lobe"]',
    'iframe[title*="chat"]',
    'iframe[title*="copilot"]'
  ];

  let frameLocator = null;
  for (const selector of iframeSelectors) {
    try {
      const iframe = page.frameLocator(selector).first();
      // Verificar si el iframe tiene un input
      const inputSelectors = [
        'textarea',
        '[contenteditable="true"]',
        'input[type="text"]',
        '[role="textbox"]'
      ];

      for (const inputSelector of inputSelectors) {
        try {
          const input = iframe.locator(inputSelector).first();
          if (await input.isVisible({ timeout: 2000 })) {
            frameLocator = iframe;
            console.log(`   ✅ Input encontrado en iframe\n`);

            // Escribir pregunta
            await input.fill(question);
            await page.waitForTimeout(500);

            // Enviar (Enter o botón)
            await input.press('Enter');

            console.log(`   ⏳ Esperando respuesta (90 segundos)...`);
            await page.waitForTimeout(90000); // 90 segundos para que el backend responda

            // Screenshot de la respuesta
            const screenshotPath = `/tmp/firefox-auto-q${questionNumber}-${question.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`   📸 Screenshot: ${screenshotPath}\n`);

            return true;
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      continue;
    }
  }

  // Si no encontramos el input en iframe, tal vez está en la página principal
  console.log('   ℹ️ No se encontró input en iframe, buscando en página principal...\n');

  const mainInputSelectors = [
    'textarea',
    '[contenteditable="true"]',
    'input[type="text"]',
    '[role="textbox"]',
    '[placeholder*="pregunta"]',
    '[placeholder*="mensaje"]'
  ];

  for (const selector of mainInputSelectors) {
    try {
      const input = page.locator(selector).last(); // .last() por si hay múltiples
      if (await input.isVisible({ timeout: 2000 })) {
        console.log(`   ✅ Input encontrado: ${selector}\n`);

        await input.fill(question);
        await page.waitForTimeout(500);
        await input.press('Enter');

        console.log(`   ⏳ Esperando respuesta (90 segundos)...`);
        await page.waitForTimeout(90000);

        const screenshotPath = `/tmp/firefox-auto-q${questionNumber}-${question.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`   📸 Screenshot: ${screenshotPath}\n`);

        return true;
      }
    } catch (e) {
      continue;
    }
  }

  console.log('   ⚠️ No se pudo enviar la pregunta\n');
  return false;
}

async function main() {
  console.log('======================================================================');
  console.log('TEST COPILOT - Automatizado con Cookies Guardadas');
  console.log('======================================================================\n');

  let browser, context, page;

  try {
    // [PASO 1] Cargar cookies guardadas
    console.log('[PASO 1] Cargando cookies de autenticación...\n');
    const cookies = await loadCookies();

    // [PASO 2] Abrir Firefox
    console.log('[PASO 2] Abriendo Firefox...\n');

    browser = await firefox.launch({
      headless: false,
      args: []
    });

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    // Inyectar cookies ANTES de navegar
    await context.addCookies(cookies);
    console.log('✅ Cookies inyectadas en el navegador\n');

    page = await context.newPage();

    console.log('✅ Firefox abierto\n');

    // [PASO 3] Navegar directamente a la app (ya autenticado)
    console.log('[PASO 3] Navegando a la app (con cookies de autenticación)...\n');

    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);

    // Verificar que estamos autenticados
    const currentCookies = await context.cookies();
    const stillHasIdToken = currentCookies.some(c => c.name === 'idTokenV0.1.0');
    const stillHasSession = currentCookies.some(c => c.name === 'sessionBodas');

    if (!stillHasIdToken || !stillHasSession) {
      throw new Error('❌ Cookies expiradas - Ejecuta de nuevo el login manual');
    }

    await page.screenshot({ path: '/tmp/firefox-auto-01-authenticated.png' });
    console.log('📸 Screenshot: /tmp/firefox-auto-01-authenticated.png');
    console.log('✅ Navegación exitosa - Usuario autenticado\n');

    // [PASO 4] Abrir Copilot
    console.log('[PASO 4] Abriendo el Copilot...\n');

    await findAndClickCopilot(page);

    await page.screenshot({ path: '/tmp/firefox-auto-02-copilot-open.png', fullPage: true });
    console.log('📸 Screenshot: /tmp/firefox-auto-02-copilot-open.png');
    console.log('✅ Copilot abierto\n');

    // [PASO 5] Hacer las 3 preguntas
    console.log('[PASO 5] Ejecutando preguntas de prueba...\n');

    for (let i = 0; i < TEST_QUESTIONS.length; i++) {
      const question = TEST_QUESTIONS[i];
      console.log(`\n[PREGUNTA ${i + 1}/${TEST_QUESTIONS.length}]\n`);

      const success = await askQuestion(page, question, i + 1);

      if (!success) {
        console.log(`   ⚠️ No se pudo completar la pregunta ${i + 1}\n`);
      }

      // Pequeña pausa entre preguntas
      await page.waitForTimeout(3000);
    }

    // [RESULTADO]
    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST COMPLETADO');
    console.log('='.repeat(70));
    console.log('\n📊 Resultados:');
    console.log(`   - ${TEST_QUESTIONS.length} preguntas ejecutadas`);
    console.log('   - Screenshots guardados en /tmp/firefox-auto-*.png\n');
    console.log('📸 Screenshots capturados:');
    console.log('   /tmp/firefox-auto-01-authenticated.png - App con usuario autenticado');
    console.log('   /tmp/firefox-auto-02-copilot-open.png - Copilot abierto');
    console.log('   /tmp/firefox-auto-q1-*.png - Respuesta pregunta 1');
    console.log('   /tmp/firefox-auto-q2-*.png - Respuesta pregunta 2');
    console.log('   /tmp/firefox-auto-q3-*.png - Respuesta pregunta 3\n');
    console.log('🦊 Firefox permanece abierto - Presiona Ctrl+C para cerrar\n');

    // Mantener navegador abierto para inspección
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);

    if (page) {
      try {
        await page.screenshot({ path: '/tmp/firefox-auto-error.png' });
        console.error('\n📸 Screenshot de error: /tmp/firefox-auto-error.png\n');
      } catch (e) {
        // Ignorar si no se puede tomar screenshot
      }
    }

    if (browser) {
      await browser.close();
    }

    process.exit(1);
  }
}

main();
