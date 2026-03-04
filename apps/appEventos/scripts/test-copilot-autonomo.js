#!/usr/bin/env node

/**
 * Test COMPLETAMENTE AUTÓNOMO del Copilot
 * NO requiere cookies manuales
 * Usa el endpoint de testing para generar tokens automáticamente
 */

const { firefox } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

firefox.use(StealthPlugin());

const URL = 'https://app-test.bodasdehoy.com';
const USER_ID = 'upSETrmXc7ZnsIhrjDjbHd7u2up1'; // bodasdehoy.com@gmail.com

const QUESTIONS = [
  '¿Cuántos invitados tengo?',
  '¿Cuál es la boda de Raul?',
  'Muéstrame la lista de todas las bodas'
];

async function generateAuthToken() {
  console.log('\n🔑 Generando token de autenticación...\n');

  const response = await fetch(`${URL}/api/testing/generate-auth-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: USER_ID })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to generate token: ${error.error}`);
  }

  const data = await response.json();
  console.log(`✅ Token generado para: ${data.user.email}`);
  console.log(`   Válido por: ${data.expiresIn / 60} minutos\n`);

  return data.customToken;
}

async function main() {
  console.log('\n======================================================================');
  console.log('TEST COPILOT - COMPLETAMENTE AUTÓNOMO');
  console.log('======================================================================\n');

  let browser;

  try {
    // 1. Generar token de autenticación
    const customToken = await generateAuthToken();

    // 2. Abrir Firefox
    console.log('[PASO 1] Abriendo Firefox...\n');
    browser = await firefox.launch({
      headless: false,
      args: []
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // 3. Navegar a la app
    console.log('[PASO 2] Navegando a la app...\n');
    await page.goto(URL);
    await page.screenshot({ path: '/tmp/firefox-autonomo-01-before-auth.png' });

    // 4. Autenticar usando el custom token
    console.log('[PASO 3] Autenticando con custom token...\n');

    // Ejecutar autenticación en el navegador usando Firebase SDK
    await page.evaluate(async (token) => {
      // Esperar a que Firebase esté disponible
      while (!window.firebase) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Autenticar con custom token
      const auth = window.firebase.auth();
      await auth.signInWithCustomToken(token);

      // Esperar a que las cookies se establezcan
      await new Promise(resolve => setTimeout(resolve, 2000));
    }, customToken);

    console.log('✅ Autenticación exitosa\n');

    // Verificar que estamos autenticados
    const user = await page.evaluate(() => {
      return window.firebase?.auth()?.currentUser?.email || null;
    });

    if (!user) {
      throw new Error('❌ Autenticación falló - No hay usuario');
    }

    console.log(`✅ Usuario autenticado: ${user}\n`);
    await page.screenshot({ path: '/tmp/firefox-autonomo-02-authenticated.png' });

    // 5. Navegar a la página principal (después de login)
    console.log('[PASO 4] Navegando a página principal...\n');
    await page.goto(`${URL}/eventos`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/firefox-autonomo-03-eventos.png' });

    // 6. Abrir Copilot
    console.log('[PASO 5] Abriendo Copilot...\n');

    await page.click('button:has-text("Copilot")');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/firefox-autonomo-04-copilot-open.png' });

    console.log('✅ Copilot abierto\n');

    // 7. Ejecutar preguntas
    console.log('[PASO 6] Ejecutando preguntas de prueba...\n');

    for (const [index, question] of QUESTIONS.entries()) {
      console.log(`\n[PREGUNTA ${index + 1}/${QUESTIONS.length}]\n`);
      console.log(`   Pregunta: "${question}"`);

      try {
        // Encontrar iframe del Copilot
        const frame = page.frameLocator('iframe[src*="chat"], iframe[src*="copilot"]');
        const input = frame.locator('[contenteditable="true"], textarea, input[type="text"]').first();

        // Escribir y enviar pregunta
        await input.fill(question);
        await input.press('Enter');

        console.log('   ✅ Pregunta enviada');
        console.log('   ⏳ Esperando respuesta (90 segundos)...');

        // Esperar respuesta
        await page.waitForTimeout(90000);

        // Screenshot
        const filename = `/tmp/firefox-autonomo-q${index + 1}-${question.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        await page.screenshot({ path: filename });
        console.log(`   📸 Screenshot: ${filename}`);

      } catch (error) {
        console.error(`   ❌ Error en pregunta ${index + 1}:`, error.message);
      }
    }

    console.log('\n======================================================================');
    console.log('✅ TEST COMPLETADO');
    console.log('======================================================================\n');
    console.log('📊 Resultados:');
    console.log(`   - ${QUESTIONS.length} preguntas ejecutadas`);
    console.log('   - Usuario autenticado correctamente');
    console.log('   - Screenshots guardados en /tmp/firefox-autonomo-*.png\n');
    console.log('🦊 Firefox permanece abierto - Presiona Ctrl+C para cerrar\n');

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
