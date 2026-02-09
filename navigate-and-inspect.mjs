#!/usr/bin/env node
import { chromium } from 'playwright';

async function navigateAndInspect() {
  console.log('🔍 Navegando a localhost y verificando Copilot...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    // Navegar a localhost
    console.log('📝 Navegando a localhost:8080...');
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    console.log(`   ✅ URL: ${page.url()}\n`);

    await page.screenshot({ path: 'localhost-home.png' });
    console.log('📸 Screenshot: localhost-home.png\n');

    // Buscar si hay algún textarea visible (del Copilot abierto)
    const hasTextarea = await page.locator('textarea').count();
    console.log(`📝 Textareas visibles: ${hasTextarea}\n`);

    if (hasTextarea > 0) {
      console.log('✅ Hay un Copilot abierto. Inspeccionando...\n');

      const result = await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return { found: false };

        const container = textarea.closest('div, form');
        if (!container) return { found: false };

        const buttons = Array.from(container.querySelectorAll('button'))
          .map(btn => ({
            title: btn.getAttribute('title') || '',
            hasSvg: !!btn.querySelector('svg')
          }))
          .filter(b => b.hasSvg && b.title);

        return {
          found: true,
          placeholder: textarea.placeholder,
          buttons: buttons.map(b => b.title)
        };
      });

      if (result.found) {
        console.log(`📝 Placeholder: "${result.placeholder}"`);
        console.log(`🔘 Botones: ${result.buttons.length}\n`);
        result.buttons.forEach((title, idx) => {
          console.log(`   ${idx + 1}. ${title}`);
        });
        console.log('');

        const hasAll4 = ['emoji', 'adjuntar', 'código', 'lista'].every(kw =>
          result.buttons.some(b => b.toLowerCase().includes(kw))
        );

        if (hasAll4) {
          console.log('🎉 ¡Los 4 botones están presentes!\n');
        }
      }
    } else {
      console.log('⚠️  No hay Copilot abierto. Abriendo con ⌘⇧C...\n');
      await page.keyboard.press('Meta+Shift+KeyC');
      await page.waitForTimeout(3000);

      await page.screenshot({ path: 'after-open-copilot.png' });
      console.log('📸 Screenshot: after-open-copilot.png\n');

      // Reintentar inspección
      const retry = await page.evaluate(() => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return { found: false };

        const container = textarea.closest('div, form');
        const buttons = container ? Array.from(container.querySelectorAll('button'))
          .map(btn => ({
            title: btn.getAttribute('title') || '',
            hasSvg: !!btn.querySelector('svg')
          }))
          .filter(b => b.hasSvg && b.title) : [];

        return {
          found: !!container,
          placeholder: textarea.placeholder,
          buttons: buttons.map(b => b.title)
        };
      });

      if (retry.found) {
        console.log('✅ Copilot abierto!\n');
        console.log(`📝 Placeholder: "${retry.placeholder}"`);
        console.log(`🔘 Botones: ${retry.buttons.length}\n`);
        retry.buttons.forEach((title, idx) => {
          console.log(`   ${idx + 1}. ${title}`);
        });
      } else {
        console.log('❌ No se pudo abrir el Copilot\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

navigateAndInspect().catch(console.error);
