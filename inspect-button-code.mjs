import { chromium } from 'playwright';

async function inspectButton() {
  console.log('🔍 Inspeccionando el código del botón...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 }
  });

  console.log('📍 Cargando localhost:8080...');
  await page.goto('http://localhost:8080', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await page.waitForTimeout(4000);

  console.log('📍 Abriendo Copilot...');
  const copilotBtn = page.locator('button:has-text("Copilot")').first();

  if (await copilotBtn.isVisible({ timeout: 5000 })) {
    await copilotBtn.click();
    await page.waitForTimeout(3000);

    console.log('\n🔍 Inspeccionando el botón "Abrir Copilot Completo"...\n');

    const buttonAnalysis = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent?.includes('Abrir Copilot Completo'));

      if (!btn) return { found: false };

      // Intentar obtener el handler
      const listenerInfo = {
        hasOnClick: btn.onclick !== null,
        onclickString: btn.onclick?.toString() || 'null',
        hasReactProps: Object.keys(btn).some(k => k.startsWith('__react')),
        reactKeys: Object.keys(btn).filter(k => k.startsWith('__react')),
      };

      // Intentar ejecutar el onClick manualmente
      let manualClickResult = null;
      try {
        if (btn.onclick) {
          manualClickResult = btn.onclick({ preventDefault: () => {}, stopPropagation: () => {} });
        }
      } catch (err) {
        manualClickResult = `Error: ${err.message}`;
      }

      return {
        found: true,
        text: btn.textContent,
        type: btn.type,
        disabled: btn.disabled,
        listenerInfo,
        manualClickResult,
        parentTag: btn.parentElement?.tagName,
        isInForm: btn.closest('form') !== null,
      };
    });

    console.log('📊 Análisis del Botón:');
    console.log(`   Texto: ${buttonAnalysis.text}`);
    console.log(`   Type: ${buttonAnalysis.type}`);
    console.log(`   Disabled: ${buttonAnalysis.disabled}`);
    console.log(`   Parent: ${buttonAnalysis.parentTag}`);
    console.log(`   Está en Form: ${buttonAnalysis.isInForm}`);
    console.log(`\n   Has onClick: ${buttonAnalysis.listenerInfo.hasOnClick}`);
    console.log(`   onClick String: ${buttonAnalysis.listenerInfo.onclickString.substring(0, 200)}`);
    console.log(`   React Props: ${buttonAnalysis.listenerInfo.hasReactProps ? '✅' : '❌'}`);
    console.log(`   React Keys: ${buttonAnalysis.listenerInfo.reactKeys.join(', ')}`);
    console.log(`\n   Manual Click Result: ${buttonAnalysis.manualClickResult}`);

    // Ahora intentar hacer el window.open directamente desde un click simulado
    console.log('\n📍 Intentando window.open() con interacción del usuario...');

    const popupPromise = page.waitForEvent('popup', { timeout: 8000 }).catch(() => null);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent?.includes('Abrir Copilot Completo'));

      if (btn) {
        // Simular click de usuario para evitar bloqueador de popups
        btn.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
      }
    });

    const popup = await popupPromise;

    if (popup) {
      console.log('✅ ¡Popup abierto con dispatchEvent!');
      console.log(`   URL: ${popup.url()}`);
    } else {
      console.log('❌ Popup no se abrió con dispatchEvent');

      // Último intento: Ejecutar el window.open directamente pero desde un click handler
      console.log('\n📍 Último intento: window.open desde dentro de click handler...');

      const popup2Promise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);

      await page.evaluate(() => {
        // Crear un botón temporal
        const tempBtn = document.createElement('button');
        tempBtn.onclick = () => {
          console.log('Ejecutando window.open...');
          const newWin = window.open('http://localhost:3210', '_blank', 'noopener,noreferrer');
          console.log('window.open returned:', newWin);
          return false;
        };
        document.body.appendChild(tempBtn);
        tempBtn.click();
        tempBtn.remove();
      });

      const popup2 = await popup2Promise;

      if (popup2) {
        console.log('✅ ¡Popup abierto con botón temporal!');
        console.log(`   URL: ${popup2.url()}`);
      } else {
        console.log('❌ Tampoco funcionó con botón temporal');
        console.log('\n💡 Posibles causas:');
        console.log('   1. Next.js no ha compilado los cambios (¿reiniciaste el servidor?)');
        console.log('   2. React está cachando el componente viejo');
        console.log('   3. El onClick de React no se está registrando correctamente');
        console.log('   4. Hay un Service Worker bloqueando');
      }
    }

  } else {
    console.log('❌ No se pudo abrir Copilot');
  }

  console.log('\n⏳ Navegador abierto 60s para inspección manual...');
  console.log('   Puedes abrir DevTools y revisar el elemento del botón');
  await page.waitForTimeout(60000);

  await browser.close();
  console.log('\n✅ Inspección completada');
}

inspectButton().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
