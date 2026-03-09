#!/usr/bin/env node
/**
 * E2E Test Mejorado: Copilot en app-test.bodasdehoy.com
 *
 * Mejoras:
 * - Espera a que Firebase auth se complete (verifica localStorage)
 * - Navega explícitamente a /resumen-evento donde el Copilot está disponible
 * - Espera a que el iframe se cargue completamente con React renderizado
 * - Toma screenshots en cada paso para debugging
 *
 * Ejecutar: node apps/web/scripts/test-copilot-improved.js
 */

const { chromium } = require('playwright');

const BASE = 'https://app-test.bodasdehoy.com';
const USER_EMAIL = 'bodasdehoy.com@gmail.com';
const USER_PASSWORD = 'lorca2012M*+';
const TIMEOUT = 60000;

async function screenshot(page, name) {
  const path = `/tmp/copilot-improved-${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  📸 ${path}`);
}

async function waitForAuth(page) {
  console.log('  Esperando autenticación de Firebase...');

  // Esperar a que localStorage tenga el token de Firebase
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    const hasAuth = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const hasFirebaseKey = keys.some(k => k.includes('firebase'));
      const hasUserKey = localStorage.getItem('user') !== null;
      return hasFirebaseKey || hasUserKey;
    });

    if (hasAuth) {
      console.log(`  ✅ Auth detectada (intento ${i + 1})`);
      return true;
    }

    await page.waitForTimeout(500);
  }

  console.log('  ⚠️ No se detectó auth en localStorage');
  return false;
}

async function main() {
  console.log('='.repeat(70));
  console.log('E2E TEST MEJORADO - COPILOT');
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
    // PASO 1: Login
    // ==========================================
    console.log('\n[PASO 1] Login...');
    await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    await screenshot(page, '01-login-page');

    // Check if already logged in
    if (!page.url().includes('/login')) {
      console.log('  Ya logueado, saltando login.');
    } else {
      // Fill credentials using JS to avoid React issues
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
      await screenshot(page, '02-credentials-filled');

      // Click submit button
      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      });

      console.log('  Esperando redirección...');
      await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    // Esperar a que Firebase complete la autenticación
    await waitForAuth(page);
    await page.waitForTimeout(2000);
    await screenshot(page, '03-after-login');

    const currentUrl = page.url();
    console.log('  ✅ Login OK - URL:', currentUrl);

    // ==========================================
    // PASO 2: Navegar a una página con Copilot
    // ==========================================
    console.log('\n[PASO 2] Navegando a página con Copilot...');

    // Try to navigate to resumen-evento, if it fails, try eventos
    try {
      await page.goto(BASE + '/resumen-evento', { waitUntil: 'networkidle', timeout: 30000 });
      console.log('  ✅ En /resumen-evento');
    } catch {
      console.log('  /resumen-evento no disponible, intentando /eventos');
      try {
        await page.goto(BASE + '/eventos', { waitUntil: 'networkidle', timeout: 30000 });
        console.log('  ✅ En /eventos');
      } catch {
        console.log('  ⚠️ No se pudo navegar a ninguna página, continuando...');
      }
    }

    await page.waitForTimeout(3000);
    await screenshot(page, '04-app-page');

    // ==========================================
    // PASO 3: Verificar si el Copilot está visible
    // ==========================================
    console.log('\n[PASO 3] Buscando Copilot...');

    // Check if sidebar is already open
    const sidebarInfo = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe');
      const sidebarIframe = Array.from(iframes).find(f =>
        f.src.includes('chat') || f.src.includes('copilot') || f.src.includes('3210')
      );

      if (sidebarIframe) {
        const rect = sidebarIframe.getBoundingClientRect();
        return {
          open: true,
          visible: rect.width > 0,
          src: sidebarIframe.src.substring(0, 80),
          width: rect.width,
          height: rect.height
        };
      }

      return { open: false };
    });

    console.log('  Sidebar estado:', JSON.stringify(sidebarInfo));

    // If sidebar not open, try to open it
    if (!sidebarInfo.open || !sidebarInfo.visible) {
      console.log('  Intentando abrir Copilot...');

      // Try to find and click Copilot button
      const copilotBtn = await page.evaluate(() => {
        // Look for Copilot button in header/navigation
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        for (const btn of buttons) {
          const text = (btn.textContent || '').toLowerCase();
          const title = (btn.title || '').toLowerCase();
          if (text.includes('copilot') || title.includes('copilot')) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.y < 200) {
              btn.click();
              return { found: true, text: btn.textContent };
            }
          }
        }
        return { found: false };
      });

      console.log('  Botón Copilot:', JSON.stringify(copilotBtn));

      if (copilotBtn.found) {
        await page.waitForTimeout(3000);
        await screenshot(page, '05-copilot-opened');
      }
    } else {
      console.log('  ✅ Copilot ya estaba abierto');
    }

    // ==========================================
    // PASO 4: Esperar a que el iframe cargue con React
    // ==========================================
    console.log('\n[PASO 4] Esperando carga completa del iframe...');

    // Wait extra time for React to render (based on previous tests)
    console.log('  Esperando 15 segundos para que React renderice...');
    await page.waitForTimeout(15000);
    await screenshot(page, '06-iframe-loaded');

    // Verify iframe and textarea
    const iframeCheck = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe');
      const chatIframe = Array.from(iframes).find(f =>
        f.src.includes('chat') || f.src.includes('copilot') || f.src.includes('3210')
      );

      if (!chatIframe) {
        return { found: false, reason: 'No iframe found' };
      }

      const rect = chatIframe.getBoundingClientRect();
      if (rect.width === 0) {
        return { found: true, visible: false, reason: 'Iframe width is 0', src: chatIframe.src };
      }

      // Try to access iframe content (will fail due to CORS, but we can check)
      return {
        found: true,
        visible: true,
        src: chatIframe.src.substring(0, 80),
        width: rect.width,
        height: rect.height
      };
    });

    console.log('  Iframe check:', JSON.stringify(iframeCheck));

    if (!iframeCheck.found) {
      console.log('  ❌ No se encontró iframe del Copilot');
      await screenshot(page, '07-error-no-iframe');
    } else if (!iframeCheck.visible) {
      console.log('  ❌ Iframe encontrado pero no visible');
      await screenshot(page, '07-error-iframe-not-visible');
    } else {
      console.log('  ✅ Iframe visible y cargado');

      // ==========================================
      // PASO 5: Buscar textarea dentro del iframe
      // ==========================================
      console.log('\n[PASO 5] Buscando textarea en iframe...');

      // Get frame by URL pattern
      const frames = page.frames();
      const chatFrame = frames.find(f => {
        const url = f.url();
        return url.includes('chat') || url.includes('copilot') || url.includes(':3210');
      });

      if (chatFrame) {
        console.log('  Frame encontrado:', chatFrame.url().substring(0, 80));

        try {
          // Wait for textarea with a reasonable timeout
          const textarea = await chatFrame.waitForSelector('textarea', {
            timeout: 10000,
            state: 'visible'
          });

          if (textarea) {
            console.log('  ✅ Textarea encontrado y visible!');
            await screenshot(page, '08-textarea-found');

            // Try to send a test message
            console.log('\n[PASO 6] Enviando mensaje de prueba...');
            await textarea.fill('Hola! ¿Cuántos invitados tengo?');
            await page.waitForTimeout(1000);
            await screenshot(page, '09-message-written');

            // Find and click send button
            const sendBtn = await chatFrame.$('button[type="submit"]');
            if (sendBtn) {
              await sendBtn.click();
              console.log('  ✅ Mensaje enviado!');
              await page.waitForTimeout(5000);
              await screenshot(page, '10-message-sent');

              // Wait for response
              console.log('  Esperando respuesta (30s)...');
              await page.waitForTimeout(30000);
              await screenshot(page, '11-final-state');
            } else {
              console.log('  ⚠️ No se encontró botón de envío');
            }
          }
        } catch (textareaError) {
          console.log('  ❌ Error buscando textarea:', textareaError.message);
          await screenshot(page, '08-error-textarea');

          // Debug: Get iframe content structure
          const iframeStructure = await chatFrame.evaluate(() => {
            const getElementInfo = (el, depth = 0) => {
              if (depth > 3) return null;
              return {
                tag: el.tagName,
                class: el.className,
                id: el.id,
                children: Array.from(el.children).slice(0, 5).map(c => getElementInfo(c, depth + 1))
              };
            };
            return getElementInfo(document.body);
          }).catch(() => ({ error: 'Could not read iframe content' }));

          console.log('  Estructura del iframe:', JSON.stringify(iframeStructure, null, 2));
        }
      } else {
        console.log('  ❌ No se pudo acceder al frame del Copilot');
        console.log('  Frames disponibles:', frames.map(f => f.url().substring(0, 50)));
      }
    }

    console.log('\n✅ Test completado');
    console.log('\nNavegador quedará abierto para inspección manual.');
    console.log('Presiona Ctrl+C para cerrar.\n');

    // Keep browser open for manual inspection
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Error en test:', error.message);
    await screenshot(page, 'error-final');
    console.log('\nNavegador quedará abierto para debugging.');
    await new Promise(() => {});
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
