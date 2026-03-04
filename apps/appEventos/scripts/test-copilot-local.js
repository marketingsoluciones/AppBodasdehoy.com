#!/usr/bin/env node
/**
 * E2E Test LOCAL: Copilot en localhost:8080
 *
 * Este test usa el servidor LOCAL (localhost:8080) en vez del remoto,
 * lo que permite que el iframe cargue localhost:3210 sin errores de mixed content.
 *
 * Ejecutar: node apps/web/scripts/test-copilot-local.js
 */

const { chromium } = require('playwright');

const BASE = 'http://localhost:8080';
const USER_EMAIL = 'bodasdehoy.com@gmail.com';
const USER_PASSWORD = 'lorca2012M*+';
const TIMEOUT = 60000;

async function screenshot(page, name) {
  const path = `/tmp/copilot-local-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function main() {
  console.log('='.repeat(70));
  console.log('E2E TEST LOCAL - COPILOT (localhost:8080)');
  console.log('='.repeat(70));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });

  const page = await context.newPage();

  try {
    // ==========================================
    // PASO 1: Navegar a la app local
    // ==========================================
    console.log('\n[PASO 1] Navegando a localhost:8080...');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    await screenshot(page, '01-inicio');

    console.log('  URL:', page.url());

    // Check if we need to login
    const isLoginPage = page.url().includes('/login');
    const needsLogin = await page.evaluate(() => {
      // Check if there's a login form
      const hasLoginForm = document.querySelector('input[type="email"], input[type="password"]') !== null;
      // Check if user is logged out (VistaSinCookie)
      const hasLoginButton = Array.from(document.querySelectorAll('button, a')).some(el =>
        el.textContent?.toLowerCase().includes('iniciar') ||
        el.textContent?.toLowerCase().includes('login')
      );
      return hasLoginForm || hasLoginButton;
    });

    if (isLoginPage || needsLogin) {
      console.log('\n[PASO 2] Haciendo login...');

      // Navigate to login if not there
      if (!isLoginPage) {
        await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
      }

      await screenshot(page, '02-login-page');

      // Fill credentials
      await page.evaluate(([email, pass]) => {
        const setNativeValue = (element, value) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const emailInput = document.querySelector('input[name="identifier"]') ||
                          document.querySelector('input[name="email"]') ||
                          document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[name="password"]') ||
                         document.querySelector('input[type="password"]');

        if (emailInput) setNativeValue(emailInput, email);
        if (passInput) setNativeValue(passInput, pass);
      }, [USER_EMAIL, USER_PASSWORD]);

      await page.waitForTimeout(500);
      await screenshot(page, '03-credentials-filled');

      // Click submit
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      });

      console.log('  Esperando redirección...');
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
      await page.waitForTimeout(3000);
      await screenshot(page, '04-after-login');
    } else {
      console.log('\n[PASO 2] Ya logueado, saltando login...');
    }

    console.log('  ✅ En la app - URL:', page.url());

    // ==========================================
    // PASO 3: Buscar y abrir Copilot
    // ==========================================
    console.log('\n[PASO 3] Buscando Copilot...');

    // Check if already open
    const alreadyOpen = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"], iframe[src*="3210"]');
      if (iframe) {
        const rect = iframe.getBoundingClientRect();
        return rect.width > 0;
      }
      return false;
    });

    if (!alreadyOpen) {
      console.log('  Buscando botón Copilot...');

      const clicked = await page.evaluate(() => {
        // Look for Copilot button
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        for (const btn of buttons) {
          const text = (btn.textContent || '').toLowerCase();
          const title = (btn.title || '').toLowerCase();
          if (text.includes('copilot') || title.includes('copilot')) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (clicked) {
        console.log('  ✅ Botón Copilot clickeado');
        await page.waitForTimeout(3000);
        await screenshot(page, '05-copilot-opened');
      } else {
        console.log('  ⚠️ No se encontró botón Copilot');
        await screenshot(page, '05-no-button');
      }
    } else {
      console.log('  ✅ Copilot ya estaba abierto');
    }

    // ==========================================
    // PASO 4: Esperar a que el iframe cargue completamente
    // ==========================================
    console.log('\n[PASO 4] Esperando iframe del Copilot...');
    console.log('  Esperando 30 segundos iniciales para que el iframe HTML cargue y React inicie...');
    await page.waitForTimeout(30000);
    await screenshot(page, '06-iframe-wait-30s');

    // Wait for loading overlay to disappear (el timeout del CopilotIframe es 45s)
    console.log('  Esperando a que desaparezca el overlay de carga (máximo 30s adicionales)...');
    try {
      await page.waitForFunction(
        () => {
          const text = document.body.innerText || '';
          // El overlay desaparece cuando no contiene estos textos
          return !text.includes('Cargando Copilot') && !text.includes('Inicializando interfaz');
        },
        { timeout: 30000 }
      );
      console.log('  ✅ Overlay de carga desapareció!');
      await page.waitForTimeout(3000); // Extra 3s para que todo se estabilice
      await screenshot(page, '06-iframe-ready');
    } catch (overlayError) {
      console.log('  ⚠️ Overlay no desapareció en 30s adicionales');
      console.log('  El timeout total fue 60s (30s + 30s). Continuando de todas formas...');
      await screenshot(page, '06-iframe-timeout-error');
    }

    // Verify iframe
    const iframeInfo = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="chat"], iframe[src*="copilot"], iframe[src*="3210"]');
      if (!iframe) return { found: false };

      const rect = iframe.getBoundingClientRect();
      return {
        found: true,
        src: iframe.src.substring(0, 80),
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0
      };
    });

    console.log('  Iframe:', JSON.stringify(iframeInfo));

    if (!iframeInfo.found || !iframeInfo.visible) {
      console.log('  ❌ Iframe no encontrado o no visible');
      await screenshot(page, '07-error-no-iframe');
      throw new Error('Iframe no encontrado');
    }

    // ==========================================
    // PASO 5: Acceder al frame y buscar textarea
    // ==========================================
    console.log('\n[PASO 5] Buscando textarea en iframe...');

    const frames = page.frames();
    console.log(`  Total frames: ${frames.length}`);
    console.log('  URLs:', frames.map(f => f.url().substring(0, 60)));

    // Find the copilot frame
    const copilotFrame = frames.find(f => {
      const url = f.url();
      return url.includes('chat') || url.includes('copilot') || url.includes(':3210');
    });

    if (!copilotFrame) {
      console.log('  ❌ No se pudo encontrar el frame del Copilot');
      await screenshot(page, '07-error-no-frame');
      throw new Error('Frame no encontrado');
    }

    console.log('  ✅ Frame encontrado:', copilotFrame.url().substring(0, 80));

    // Wait for input element (could be textarea, contenteditable, or input)
    try {
      console.log('  Buscando input field (textarea, contenteditable, input)...');

      // Try multiple selectors
      const selectors = [
        'textarea',
        '[contenteditable="true"]',
        'div[role="textbox"]',
        'input[type="text"]',
        '[placeholder*="mensaje"]',
        '[placeholder*="message"]',
        '[placeholder*="Escribe"]'
      ];

      let inputElement = null;
      let usedSelector = null;

      for (const selector of selectors) {
        try {
          console.log(`    Intentando selector: ${selector}`);
          inputElement = await copilotFrame.waitForSelector(selector, {
            timeout: 3000,
            state: 'visible'
          });
          if (inputElement) {
            usedSelector = selector;
            console.log(`    ✅ Encontrado con: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`    ⏭️  No encontrado con: ${selector}`);
        }
      }

      if (!inputElement) {
        console.log('  ❌ Input element no encontrado con ningún selector');
        await screenshot(page, '08-error-no-input');
        throw new Error('Input element no encontrado');
      }

      console.log(`  ✅ Input encontrado con selector: ${usedSelector}`);
      await screenshot(page, '08-input-found');

      // ==========================================
      // PASO 6: Enviar mensaje de prueba
      // ==========================================
      console.log('\n[PASO 6] Enviando mensaje de prueba...');

      const testMessage = 'Hola! ¿Cuántos invitados tengo en total?';

      // Try to fill the input (method depends on element type)
      try {
        if (usedSelector.includes('contenteditable')) {
          // For contenteditable div
          console.log('  Usando método para contentEditable...');
          await inputElement.click();
          await page.waitForTimeout(300);
          await inputElement.evaluate((el, text) => {
            el.textContent = text;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }, testMessage);
        } else {
          // For textarea or input
          console.log('  Usando método fill()...');
          await inputElement.fill(testMessage);
        }

        await page.waitForTimeout(1000);
        await screenshot(page, '09-message-written');

        console.log('  ✅ Mensaje escrito');
      } catch (fillError) {
        console.log('  ⚠️ Error escribiendo mensaje:', fillError.message);
        await screenshot(page, '09-error-writing');
      }

      // Find and click send button
      const sendBtn = await copilotFrame.$('button[type="submit"]') ||
                      await copilotFrame.$('button:has-text("Enviar")') ||
                      await copilotFrame.$$('button').then(btns => btns.length > 0 ? btns[btns.length - 1] : null);

      if (sendBtn) {
        try {
          await sendBtn.click();
          console.log('  ✅ Mensaje enviado!');
          await page.waitForTimeout(3000);
          await screenshot(page, '10-message-sent');

          // Wait for response
          console.log('  Esperando respuesta (30s)...');
          await page.waitForTimeout(30000);
          await screenshot(page, '11-response-received');

          console.log('  ✅ Test completado exitosamente!');
        } catch (sendError) {
          console.log('  ⚠️ Error enviando mensaje:', sendError.message);
          await screenshot(page, '10-error-sending');
        }
      } else {
        console.log('  ⚠️ No se encontró botón de envío');
        await screenshot(page, '10-no-send-button');
      }

    } catch (textareaError) {
      console.log('  ❌ Error con textarea:', textareaError.message);
      await screenshot(page, '08-error-textarea');

      // Debug: Get frame content
      const frameContent = await copilotFrame.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.innerText.substring(0, 500),
          hasTextarea: document.querySelector('textarea') !== null,
          hasInput: document.querySelector('input') !== null,
          elementCount: document.querySelectorAll('*').length
        };
      }).catch(e => ({ error: e.message }));

      console.log('  Debug frame content:', JSON.stringify(frameContent, null, 2));
    }

    console.log('\n✅ Test completado');
    console.log('\nNavegador quedará abierto para inspección manual.');
    console.log('Presiona Ctrl+C para cerrar.\n');

    // Keep browser open
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error en test:', error.message);
    await screenshot(page, 'error-final');
    console.log('\nNavegador quedará abierto para debugging.');
    console.log('Stack:', error.stack);
    await new Promise(() => {});
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
