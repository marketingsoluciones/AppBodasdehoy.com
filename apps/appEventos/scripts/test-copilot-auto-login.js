#!/usr/bin/env node

/**
 * Test del Copilot con LOGIN AUTOMÁTICO REAL
 * - Hace login programáticamente con email/password
 * - Espera a que se establezcan las cookies correctamente
 * - Verifica autenticación real (NO guest)
 * - Ejecuta 3 preguntas de prueba
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
  console.log('TEST COPILOT - CON LOGIN AUTOMÁTICO REAL');
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

    // 2. Navegar a login
    console.log('[PASO 2] Navegando a login...\n');
    await page.goto(`${URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/firefox-auto-01-login-page.png' });

    // 3. Verificar si ya hay sesión válida
    console.log('[PASO 3] Verificando sesión existente...\n');

    let cookies = await browser.cookies();
    let hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
    let hasSession = cookies.some(c => c.name === 'sessionBodas');

    console.log(`   - idToken: ${hasIdToken ? '✅' : '❌'}`);
    console.log(`   - sessionBodas: ${hasSession ? '✅' : '❌'}\n`);

    if (hasIdToken && hasSession) {
      console.log('✅ Ya hay sesión válida - Saltando login\n');

      // Ir directamente a eventos
      await page.goto(`${URL}/eventos`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ No hay sesión válida - Haciendo login automático\n');

      // 4. Login automático
      console.log('[PASO 4] Llenando formulario de login...\n');

      try {
        // Esperar a que aparezca el formulario
        const emailInput = page.locator('input[type="email"]').first();
        await emailInput.waitFor({ timeout: 15000 });

        // Llenar email
        await emailInput.fill(EMAIL);
        console.log(`   ✅ Email ingresado: ${EMAIL}`);

        // Llenar password
        const passwordInput = page.locator('input[type="password"]').first();
        await passwordInput.fill(PASSWORD);
        console.log('   ✅ Password ingresado');

        await page.screenshot({ path: '/tmp/firefox-auto-02-form-filled.png' });

        // Click en submit
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();
        console.log('   ✅ Formulario enviado\n');

        console.log('[PASO 5] Esperando autenticación (30 segundos)...\n');

        // Esperar a que se establezcan las cookies y redirija
        await page.waitForTimeout(30000);

        await page.screenshot({ path: '/tmp/firefox-auto-03-after-login.png' });

        // Verificar que las cookies se establecieron
        cookies = await browser.cookies();
        hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
        hasSession = cookies.some(c => c.name === 'sessionBodas');

        console.log('   Verificación de cookies después del login:');
        console.log(`   - idToken: ${hasIdToken ? '✅' : '❌'}`);
        console.log(`   - sessionBodas: ${hasSession ? '✅' : '❌'}\n`);

        if (hasIdToken && hasSession) {
          console.log('✅ Login exitoso - Cookies establecidas correctamente\n');
        } else {
          console.log('⚠️ Login completado pero faltan cookies\n');

          // Esperar más tiempo para que se establezcan
          console.log('   Esperando 15 segundos adicionales...\n');
          await page.waitForTimeout(15000);

          // Verificar de nuevo
          cookies = await browser.cookies();
          hasIdToken = cookies.some(c => c.name === 'idTokenV0.1.0');
          hasSession = cookies.some(c => c.name === 'sessionBodas');

          console.log('   Verificación final de cookies:');
          console.log(`   - idToken: ${hasIdToken ? '✅' : '❌'}`);
          console.log(`   - sessionBodas: ${hasSession ? '✅' : '❌'}\n`);

          if (!hasIdToken || !hasSession) {
            throw new Error('❌ Las cookies no se establecieron después del login');
          }
        }

        // Navegar a eventos si no estamos ya ahí
        const currentUrl = page.url();
        if (!currentUrl.includes('/eventos')) {
          console.log('[PASO 6] Navegando a eventos...\n');
          await page.goto(`${URL}/eventos`, { waitUntil: 'domcontentloaded', timeout: 60000 });
          await page.waitForTimeout(3000);
        }

      } catch (error) {
        console.error('   ❌ Error en login automático:', error.message);
        throw error;
      }
    }

    await page.screenshot({ path: '/tmp/firefox-auto-04-eventos-page.png' });

    // 7. Verificar que NO es usuario "guest"
    console.log('[PASO 7] Verificando que NO es usuario guest...\n');

    const isGuest = await page.evaluate(() => {
      return document.body.textContent.includes('guest');
    });

    if (isGuest) {
      console.log('   ⚠️ ADVERTENCIA: El usuario aparece como "guest"\n');
      console.log('   Esto puede significar que el login no se completó correctamente.\n');
      await page.screenshot({ path: '/tmp/firefox-auto-ERROR-still-guest.png' });
    } else {
      console.log('   ✅ Usuario autenticado (NO guest)\n');
    }

    // 8. Abrir Copilot
    console.log('[PASO 8] Abriendo Copilot...\n');

    try {
      await page.click('button:has-text("Copilot")');
    } catch (e) {
      // Intentar selector alternativo
      await page.click('[aria-label*="Copilot"], [title*="Copilot"]');
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/firefox-auto-05-copilot-open.png' });

    console.log('✅ Copilot abierto\n');

    // 9. Ejecutar preguntas
    console.log('[PASO 9] Ejecutando preguntas de prueba...\n');

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
        const filename = `/tmp/firefox-auto-q${index + 1}-${question.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}.png`;
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
    console.log(`   - Usuario: ${EMAIL}`);
    console.log(`   - Login automático: ${hasIdToken && hasSession ? '✅ EXITOSO' : '❌ FALLÓ'}`);
    console.log(`   - ${QUESTIONS.length} preguntas ejecutadas`);
    console.log('   - Screenshots guardados en /tmp/firefox-auto-*.png\n');
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
