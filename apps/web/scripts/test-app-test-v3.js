#!/usr/bin/env node

/**
 * Test V3 - Con LOGOUT forzado primero
 * Asegura que se haga login con charlie@test.com
 */

const { chromium } = require('playwright');

const BASE_URL = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'charlie@test.com';
const USER_PASSWORD = 'test1234';

async function screenshot(page, name) {
  const path = `/tmp/app-test-v3-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function askQuestion(page, question, questionNumber) {
  console.log(`\n[PREGUNTA ${questionNumber}] "${question}"`);

  const frames = page.frames();
  const copilotFrame = frames.find(f => {
    const url = f.url();
    return url.includes('chat') || url.includes('copilot') || url.includes(':3210');
  });

  if (!copilotFrame) {
    console.log('  ❌ Frame del Copilot no encontrado');
    await screenshot(page, `q${questionNumber}-no-frame`);
    return false;
  }

  try {
    await page.waitForTimeout(2000);

    let inputElement = null;
    const selectors = ['[contenteditable="true"]', 'textarea', 'input[type="text"]'];

    for (const selector of selectors) {
      try {
        const element = await copilotFrame.$(selector);
        if (element && await element.isVisible()) {
          inputElement = element;
          console.log(`  ✅ Input encontrado`);
          break;
        }
      } catch (e) {}
    }

    if (!inputElement) {
      console.log('  ❌ Input no encontrado');
      await screenshot(page, `q${questionNumber}-no-input`);
      return false;
    }

    await screenshot(page, `q${questionNumber}-01-before`);

    console.log('  Escribiendo...');
    await inputElement.click({ timeout: 5000 });
    await page.waitForTimeout(500);
    await inputElement.fill(question);
    await page.waitForTimeout(1000);
    await screenshot(page, `q${questionNumber}-02-written`);

    console.log('  Enviando...');
    const sendBtn = await copilotFrame.$('button[type="submit"]');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await inputElement.press('Enter');
    }

    await page.waitForTimeout(3000);
    await screenshot(page, `q${questionNumber}-03-sent`);

    console.log('  Esperando respuesta (60s)...');
    await page.waitForTimeout(60000);
    await screenshot(page, `q${questionNumber}-04-response`);
    console.log('  ✅ Respuesta capturada');
    return true;

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    await screenshot(page, `q${questionNumber}-error`);
    return false;
  }
}

(async () => {
  console.log('======================================================================');
  console.log('TEST APP-TEST V3 - CON LOGOUT FORZADO');
  console.log('======================================================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // ==========================================
    // PASO 1: Cerrar sesión si existe
    // ==========================================
    console.log('[PASO 1] Cerrando sesión (si existe)...');

    // Navegar a la página
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-inicio');

    // Intentar hacer logout
    console.log('  Buscando opción de logout...');
    const loggedOut = await page.evaluate(() => {
      // Buscar botón de perfil o menú de usuario
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));

      // Buscar por avatar/perfil (G, círculo con letra, etc)
      let profileBtn = buttons.find(b => {
        const hasAvatar = b.querySelector('[class*="avatar" i], [class*="profile" i]');
        const hasG = b.textContent?.trim() === 'G';
        return hasAvatar || hasG;
      });

      if (profileBtn) {
        console.log('[DEBUG] Click en perfil');
        profileBtn.click();
        return 'clicked-profile';
      }

      return 'no-profile-button';
    });

    console.log(`  Resultado: ${loggedOut}`);

    if (loggedOut === 'clicked-profile') {
      await page.waitForTimeout(2000);
      await screenshot(page, '02-menu-opened');

      // Buscar opción de logout en el menú
      const clickedLogout = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a, button, [role="menuitem"]'));
        const logoutLink = links.find(l => {
          const text = l.textContent?.toLowerCase() || '';
          return text.includes('cerrar sesión') ||
                 text.includes('logout') ||
                 text.includes('salir') ||
                 text.includes('desconectar');
        });

        if (logoutLink) {
          console.log('[DEBUG] Click en logout');
          logoutLink.click();
          return true;
        }
        return false;
      });

      if (clickedLogout) {
        console.log('  ✅ Logout clickeado, esperando...');
        await page.waitForTimeout(3000);
        await screenshot(page, '03-after-logout');
      }
    }

    // ==========================================
    // PASO 2: Ir a página de login
    // ==========================================
    console.log('\n[PASO 2] Navegando a /login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    await screenshot(page, '04-login-page');

    // ==========================================
    // PASO 3: Hacer login
    // ==========================================
    console.log('\n[PASO 3] Haciendo login con charlie@test.com...');

    await page.evaluate(([email, pass]) => {
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set
          || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;
        if (valueSetter) {
          valueSetter.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      const emailInput = document.querySelector('input[type="email"]') ||
                       document.querySelector('input[name="email"]');
      const passInput = document.querySelector('input[type="password"]');

      if (emailInput) setNativeValue(emailInput, email);
      if (passInput) setNativeValue(passInput, pass);
    }, [USER_EMAIL, USER_PASSWORD]);

    await page.waitForTimeout(500);
    await screenshot(page, '05-credentials-filled');

    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });

    console.log('  Esperando redirección...');
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
    console.log('  ✅ Login exitoso');

    await page.waitForTimeout(8000); // Esperar a que cargue todo
    await screenshot(page, '06-logged-in');

    // Verificar que NO sea guest
    const userInfo = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const hasGuest = text.includes('guest');
      const userAvatar = document.querySelector('[class*="avatar" i]')?.textContent?.trim() || '';
      return { hasGuest, userAvatar };
    });

    console.log(`  Usuario avatar: ${userInfo.userAvatar}, tiene guest: ${userInfo.hasGuest}`);

    // ==========================================
    // PASO 4: Esperar a que cargue la página
    // ==========================================
    console.log('\n[PASO 4] Esperando a que cargue la página principal...');

    try {
      await page.waitForSelector('text=Cargando eventos', { state: 'hidden', timeout: 30000 });
      console.log('  ✅ Eventos cargados');
    } catch (e) {
      console.log('  ⚠️ Loader no desapareció');
    }

    await page.waitForTimeout(5000);
    await screenshot(page, '07-page-ready');

    // ==========================================
    // PASO 5: Abrir Copilot
    // ==========================================
    console.log('\n[PASO 5] Abriendo Copilot...');

    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const btn = buttons.find(b => b.textContent?.trim() === 'Copilot');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!clicked) {
      try {
        await page.click('text=Copilot', { timeout: 5000 });
        console.log('  ✅ Click con Playwright');
      } catch (e) {
        console.log('  ❌ No se pudo hacer click');
        throw new Error('No se pudo abrir Copilot');
      }
    } else {
      console.log('  ✅ Copilot abierto');
    }

    await page.waitForTimeout(5000);
    await screenshot(page, '08-copilot-opened');

    // ==========================================
    // PASO 6: Esperar iframe
    // ==========================================
    console.log('\n[PASO 6] Esperando iframe (60s)...');

    for (let i = 15; i <= 60; i += 15) {
      await page.waitForTimeout(15000);
      console.log(`  ${i}s...`);
    }

    await screenshot(page, '09-iframe-ready');

    const iframeExists = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"]');
      return iframe !== null;
    });

    if (!iframeExists) {
      console.log('  ❌ Iframe no encontrado');
      throw new Error('Iframe no encontrado');
    }

    console.log('  ✅ Iframe listo');

    // ==========================================
    // PASO 7: Preguntas
    // ==========================================
    const questions = [
      '¿Cuántos invitados tengo?',
      '¿Cuál es la boda de Raul?',
      'Muéstrame la lista de todas las bodas'
    ];

    for (let i = 0; i < questions.length; i++) {
      const success = await askQuestion(page, questions[i], i + 1);
      console.log(success ? `  ✅ Pregunta ${i + 1} OK` : `  ⚠️ Pregunta ${i + 1} con problemas`);

      if (i < questions.length - 1) {
        console.log('\n  Esperando 5s...\n');
        await page.waitForTimeout(5000);
      }
    }

    console.log('\n✅ TEST COMPLETADO');
    await screenshot(page, '99-final');

    console.log('\nNavegador abierto. Ctrl+C para cerrar.\n');
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await screenshot(page, 'error-final');
    console.log('\nNavegador abierto. Ctrl+C para cerrar.\n');
    await new Promise(() => {});
  }
})();
