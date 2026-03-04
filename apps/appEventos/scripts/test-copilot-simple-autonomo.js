#!/usr/bin/env node

/**
 * Test SIMPLE y COMPLETAMENTE AUTÓNOMO del Copilot
 * NO requiere cookies manuales
 * NO requiere Firebase Admin SDK
 * USA autenticación directa con email/password
 */

const { firefox } = require('playwright');

const URL = 'https://app-test.bodasdehoy.com';
const EMAIL = 'bodasdehoy.com@gmail.com';
const PASSWORD = 'lorca2012M*+';

const QUESTIONS = [
  '¿Cuántos invitados tengo?',
  '¿Cuál es la boda de Raul?',
  'Muéstrame la lista de todas las bodas'
];

async function main() {
  console.log('\n======================================================================');
  console.log('TEST COPILOT - AUTÓNOMO CON LOGIN DIRECTO');
  console.log('======================================================================\n');

  let browser;

  try {
    // 1. Abrir Firefox con perfil persistente
    console.log('[PASO 1] Abriendo Firefox con perfil persistente...\n');

    const userDataDir = '/tmp/firefox-copilot-profile';

    browser = await firefox.launchPersistentContext(userDataDir, {
      headless: false,
      args: []
    });

    const page = browser.pages()[0] || await browser.newPage();

    // 2. Navegar directamente a eventos (redirige a login si no autenticado)
    console.log('[PASO 2] Navegando a eventos (usa sesión si existe)...\n');
    await page.goto(`${URL}/eventos`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/firefox-simple-01-initial-page.png' });

    // 3. Verificar si ya está autenticado
    console.log('[PASO 3] Verificando autenticación...\n');

    const copilotButton = page.locator('button:has-text("Copilot")');
    const isAuthenticated = await copilotButton.count() > 0;

    if (isAuthenticated) {
      console.log('✅ Ya autenticado con sesión persistente\n');
    } else {
      console.log('❌ No autenticado - Se requiere login MANUAL\n');
      console.log('   Por favor, haz login manualmente en el navegador que se abrió.\n');
      console.log('   Una vez logueado, la sesión se guardará para futuras ejecuciones.\n');
      console.log('   Esperando 2 minutos para que hagas login...\n');

      // Esperar 2 minutos para login manual
      await page.waitForTimeout(120000);

      // Verificar de nuevo
      const stillNotAuth = await copilotButton.count() === 0;
      if (stillNotAuth) {
        throw new Error('❌ Todavía no autenticado después de 2 minutos');
      }

      console.log('✅ Login manual completado\n');
    }

    // 4. Verificar cookies
    console.log('[PASO 4] Verificando cookies...\n');

    const cookies = await browser.cookies();
    const hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    const hasSession = cookies.some(c => c.name === 'sessionBodas');

    console.log(`   Cookies: idToken=${hasIdToken}, session=${hasSession}\n`);
    await page.screenshot({ path: '/tmp/firefox-simple-02-authenticated.png' });

    // 5. Abrir Copilot
    console.log('[PASO 5] Abriendo Copilot...\n');

    try {
      await page.click('button:has-text("Copilot")');
    } catch (e) {
      // Intentar selector alternativo
      await page.click('[aria-label*="Copilot"], [title*="Copilot"]');
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/firefox-simple-04-copilot-open.png' });

    console.log('✅ Copilot abierto\n');

    // 6. Ejecutar preguntas
    console.log('[PASO 6] Ejecutando preguntas de prueba...\n');

    for (const [index, question] of QUESTIONS.entries()) {
      console.log(`\n[PREGUNTA ${index + 1}/${QUESTIONS.length}]\n`);
      console.log(`   Pregunta: "${question}"`);

      try {
        // Encontrar iframe del Copilot
        const frames = page.frames();
        let chatFrame = null;

        // Buscar el frame del chat
        for (const frame of frames) {
          try {
            const url = frame.url();
            if (url.includes('chat') || url.includes('copilot') || url.includes('lobe')) {
              chatFrame = frame;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!chatFrame) {
          console.log('   ⚠️ No se encontró iframe del chat, usando selector directo');
          // Intentar con frame locator
          const frameLocator = page.frameLocator('iframe').first();
          const input = frameLocator.locator('textarea, [contenteditable="true"], input[type="text"]').first();

          await input.fill(question);
          await input.press('Enter');
        } else {
          // Usar el frame encontrado
          const input = await chatFrame.locator('textarea, [contenteditable="true"], input[type="text"]').first();
          await input.fill(question);
          await input.press('Enter');
        }

        console.log('   ✅ Pregunta enviada');
        console.log('   ⏳ Esperando respuesta (90 segundos)...');

        // Esperar respuesta
        await page.waitForTimeout(90000);

        // Screenshot
        const filename = `/tmp/firefox-simple-q${index + 1}-${question.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
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
    console.log(`   - Usuario: bodasdehoy.com@gmail.com`);
    console.log(`   - ${QUESTIONS.length} preguntas ejecutadas`);
    console.log('   - Screenshots guardados en /tmp/firefox-simple-*.png\n');
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
