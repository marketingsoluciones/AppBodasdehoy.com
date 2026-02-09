import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Iniciando test del Copilot sidebar...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
  });

  try {
    const page = await browser.newPage();

    // 1. Ir a la home
    console.log('1️⃣ Navegando a http://localhost:8080...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Screenshot inicial
    await page.screenshot({ path: 'test-1-home.png', fullPage: false });
    console.log('   ✅ Screenshot: test-1-home.png\n');

    // 2. Buscar el botón del Copilot (puede tener varios selectores)
    console.log('2️⃣ Buscando botón del Copilot...');

    const selectors = [
      'button:has-text("Copilot")',
      '[title*="Copilot" i]',
      '[aria-label*="Copilot" i]',
      'button:has(svg) >> text=/copilot/i',
      '#copilot-button',
      '.copilot-button',
    ];

    let copilotButton = null;
    for (const selector of selectors) {
      try {
        copilotButton = await page.$(selector);
        if (copilotButton) {
          console.log(`   ✅ Encontrado con selector: ${selector}\n`);
          break;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }

    if (!copilotButton) {
      console.log('   ⚠️  No se encontró botón de Copilot');
      console.log('   📝 Elementos con "Copilot" en el texto:');
      const elements = await page.$$eval('*', nodes =>
        nodes
          .filter(el => el.textContent?.toLowerCase().includes('copilot'))
          .map(el => ({
            tag: el.tagName,
            text: el.textContent?.substring(0, 50),
            classes: el.className,
          }))
          .slice(0, 5)
      );
      console.log(elements);
      await browser.close();
      return;
    }

    // 3. Click en el botón de Copilot
    console.log('3️⃣ Haciendo click en el botón de Copilot...');
    await copilotButton.click();
    await page.waitForTimeout(3000); // Esperar a que se abra el sidebar

    // Screenshot con sidebar abierto
    await page.screenshot({ path: 'test-2-copilot-abierto.png', fullPage: false });
    console.log('   ✅ Screenshot: test-2-copilot-abierto.png\n');

    // 4. Verificar que hay un iframe
    console.log('4️⃣ Verificando iframe del Copilot...');
    const iframes = await page.$$('iframe');
    console.log(`   📊 Total iframes encontrados: ${iframes.length}`);

    if (iframes.length > 0) {
      for (let i = 0; i < iframes.length; i++) {
        const src = await iframes[i].evaluate(el => el.src);
        const title = await iframes[i].evaluate(el => el.title);
        console.log(`   Iframe ${i + 1}:`);
        console.log(`     - src: ${src}`);
        console.log(`     - title: ${title}`);
      }
      console.log('   ✅ Iframe encontrado - debería mostrar LobeChat\n');
    } else {
      console.log('   ❌ No se encontró iframe - el Copilot no está usando iframe\n');
    }

    // 5. Verificar contenido del DOM
    console.log('5️⃣ Analizando contenido del sidebar...');
    const sidebarContent = await page.evaluate(() => {
      // Buscar elementos que podrían ser el sidebar
      const possibleSidebars = [
        document.querySelector('[class*="sidebar"]'),
        document.querySelector('[class*="Sidebar"]'),
        document.querySelector('[class*="chat"]'),
        document.querySelector('[class*="Chat"]'),
        document.querySelector('[class*="copilot"]'),
        document.querySelector('[class*="Copilot"]'),
      ].filter(Boolean);

      if (possibleSidebars.length > 0) {
        const sidebar = possibleSidebars[0];
        return {
          found: true,
          innerHTML: sidebar.innerHTML.substring(0, 500),
          hasIframe: sidebar.querySelector('iframe') !== null,
          hasLobeChat: sidebar.textContent?.includes('LobeHub') || sidebar.textContent?.includes('Lobe'),
        };
      }
      return { found: false };
    });

    if (sidebarContent.found) {
      console.log('   ✅ Sidebar encontrado');
      console.log(`   📊 Tiene iframe: ${sidebarContent.hasIframe}`);
      console.log(`   📊 Tiene contenido de LobeChat: ${sidebarContent.hasLobeChat}`);
    } else {
      console.log('   ❌ No se encontró sidebar\n');
    }

    // 6. Screenshot final con zoom al sidebar
    console.log('\n6️⃣ Screenshot final...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-3-copilot-final.png', fullPage: false });
    console.log('   ✅ Screenshot: test-3-copilot-final.png');

    console.log('\n✅ Test completado!');
    console.log('\n📸 Screenshots creados:');
    console.log('   - test-1-home.png (página inicial)');
    console.log('   - test-2-copilot-abierto.png (después de abrir Copilot)');
    console.log('   - test-3-copilot-final.png (estado final)');

    // Esperar 5 segundos antes de cerrar para que el usuario pueda ver
    console.log('\n⏰ Esperando 5 segundos antes de cerrar el navegador...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
