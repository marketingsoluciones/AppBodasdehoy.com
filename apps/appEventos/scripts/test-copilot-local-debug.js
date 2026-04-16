#!/usr/bin/env node
/**
 * Test de Debug: Ver Copilot en localhost:8080
 *
 * Captura:
 * - Screenshots en cada paso
 * - Logs de consola del navegador
 * - Errores de red
 * - Estado del copilot (izquierda/derecha)
 */

const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:8080';
const USER_EMAIL = 'bodasdehoy.com@gmail.com';
const USER_PASSWORD = 'lorca2012M*+';

async function main() {
  console.log('='.repeat(70));
  console.log('DEBUG: Copilot en localhost:8080');
  console.log('='.repeat(70));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    args: ['--window-size=1600,1000']
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    recordVideo: { dir: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/videos/' }
  });

  const page = await context.newPage();

  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    console.log(`[CONSOLE ${msg.type()}] ${text}`);
  });

  // Capture errors
  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  // Capture network failures
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()}`);
  });

  try {
    // STEP 1: Navigate to home
    console.log('\n[STEP 1] Navegando a home...');
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/debug-01-home.png',
      fullPage: true
    });
    console.log('  Screenshot: debug-01-home.png');

    const currentUrl = page.url();
    console.log('  URL actual:', currentUrl);

    // Check if redirected to login
    if (currentUrl.includes('/login')) {
      console.log('\n[STEP 2] Login necesario...');

      await page.waitForTimeout(2000);
      await page.screenshot({
        path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/debug-02-login.png',
        fullPage: true
      });

      // Fill login form
      console.log('  Buscando formulario de login...');
      const emailInput = await page.locator('input[name="identifier"], input[name="email"], input[type="email"]').first();
      const passwordInput = await page.locator('input[name="password"], input[type="password"]').first();

      if (await emailInput.count() > 0) {
        console.log('  Ingresando email...');
        await emailInput.fill(USER_EMAIL);
        await page.waitForTimeout(500);

        console.log('  Ingresando password...');
        await passwordInput.fill(USER_PASSWORD);
        await page.waitForTimeout(500);

        await page.screenshot({
          path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/debug-03-login-filled.png',
          fullPage: true
        });

        console.log('  Haciendo clic en submit...');
        const submitButton = page.locator('button[type="submit"]').first();
        await submitButton.click();

        console.log('  Esperando navegación post-login...');
        await page.waitForTimeout(5000);

        await page.screenshot({
          path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/debug-04-post-login.png',
          fullPage: true
        });
      } else {
        console.log('  ⚠️ No se encontró formulario de login');
      }
    }

    // STEP 3: Check copilot position
    console.log('\n[STEP 3] Verificando layout del copilot...');

    const layoutInfo = await page.evaluate(() => {
      // Find ChatSidebar element
      const sidebar = document.querySelector('[class*="ChatSidebar"], [class*="copilot"]');
      const mainContent = document.querySelector('#rootElementMain, main');

      if (!sidebar) return { found: false };

      const sidebarRect = sidebar.getBoundingClientRect();
      const contentRect = mainContent?.getBoundingClientRect();

      return {
        found: true,
        sidebar: {
          left: sidebarRect.left,
          right: sidebarRect.right,
          width: sidebarRect.width,
          position: window.getComputedStyle(sidebar).position,
          classes: sidebar.className
        },
        content: contentRect ? {
          left: contentRect.left,
          right: contentRect.right,
          width: contentRect.width,
          marginLeft: window.getComputedStyle(mainContent).marginLeft
        } : null,
        isLeftSided: sidebarRect.left === 0 || sidebarRect.left < 10
      };
    });

    console.log('  Layout Info:');
    console.log(JSON.stringify(layoutInfo, null, 2));

    // STEP 4: Try to open copilot
    console.log('\n[STEP 4] Intentando abrir copilot...');

    // Try keyboard shortcut first
    console.log('  Presionando Cmd+Shift+C...');
    await page.keyboard.press('Meta+Shift+C');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/debug-05-copilot-opened.png',
      fullPage: true
    });

    // Check if copilot is visible
    const copilotVisible = await page.evaluate(() => {
      const copilot = document.querySelector('[class*="ChatSidebar"], iframe[title*="Copilot"]');
      if (!copilot) return { visible: false, reason: 'Element not found' };

      const rect = copilot.getBoundingClientRect();
      const styles = window.getComputedStyle(copilot);

      return {
        visible: styles.display !== 'none' && styles.visibility !== 'hidden' && rect.width > 0,
        position: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        },
        styles: {
          display: styles.display,
          visibility: styles.visibility,
          position: styles.position
        }
      };
    });

    console.log('  Copilot Visibility:');
    console.log(JSON.stringify(copilotVisible, null, 2));

    // STEP 5: Check iframe URL
    console.log('\n[STEP 5] Verificando iframe del copilot...');

    const iframeInfo = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe'));
      return iframes.map(iframe => ({
        src: iframe.src,
        title: iframe.title,
        width: iframe.offsetWidth,
        height: iframe.offsetHeight,
        sandbox: iframe.getAttribute('sandbox')
      }));
    });

    console.log('  Iframes encontrados:', iframeInfo.length);
    iframeInfo.forEach((info, i) => {
      console.log(`  [${i}] ${info.src.substring(0, 100)}...`);
    });

    // STEP 6: Console logs from [CopilotDirect]
    console.log('\n[STEP 6] Logs relevantes del navegador:');
    const relevantLogs = consoleLogs.filter(log =>
      log.text.includes('CopilotDirect') ||
      log.text.includes('ChatSidebar') ||
      log.text.includes('copilot')
    );

    relevantLogs.forEach(log => {
      console.log(`  [${log.type}] ${log.text}`);
    });

    // Final screenshot
    await page.screenshot({
      path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/debug-final.png',
      fullPage: true
    });

    console.log('\n='.repeat(70));
    console.log('RESUMEN');
    console.log('='.repeat(70));
    console.log('Screenshots guardados en apps/web/scripts/debug-*.png');
    console.log('Copilot visible:', copilotVisible.visible);
    console.log('Copilot a la izquierda:', layoutInfo.isLeftSided);
    console.log('Console logs capturados:', consoleLogs.length);
    console.log('\nEl navegador queda abierto. Presiona Ctrl+C para cerrar.');

    // Keep browser open
    await new Promise(() => {});

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    await page.screenshot({
      path: '/Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts/debug-error.png',
      fullPage: true
    });
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
