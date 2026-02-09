#!/usr/bin/env node
import { chromium } from 'playwright';

async function checkServiceWorkers() {
  console.log('🔍 Verificando Service Workers y caché...\n');

  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // Verificar Service Workers
    const swInfo = await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker?.getRegistrations() || [];
      return {
        hasServiceWorkers: registrations.length > 0,
        count: registrations.length,
        scopes: registrations.map(reg => reg.scope),
      };
    });

    console.log('📊 Service Workers:');
    console.log(`   Total: ${swInfo.count}`);
    if (swInfo.count > 0) {
      console.log(`   Scopes: ${swInfo.scopes.join(', ')}`);
      console.log('   ⚠️  HAY SERVICE WORKERS ACTIVOS - pueden estar cacheando código viejo\n');

      // Desregistrar todos los Service Workers
      console.log('🧹 Desregistrando Service Workers...');
      await page.evaluate(async () => {
        const registrations = await navigator.serviceWorker?.getRegistrations() || [];
        for (const reg of registrations) {
          await reg.unregister();
        }
      });
      console.log('   ✅ Service Workers desregistrados\n');
    } else {
      console.log('   ✅ No hay Service Workers activos\n');
    }

    // Limpiar todos los cachés
    console.log('🧹 Limpiando Cache Storage API...');
    const cacheNames = await page.evaluate(async () => {
      if (!window.caches) return [];
      return await window.caches.keys();
    });

    console.log(`   Cachés encontrados: ${cacheNames.length}`);
    if (cacheNames.length > 0) {
      console.log(`   Nombres: ${cacheNames.join(', ')}`);

      await page.evaluate(async () => {
        if (!window.caches) return;
        const names = await window.caches.keys();
        for (const name of names) {
          await window.caches.delete(name);
        }
      });
      console.log('   ✅ Todos los cachés eliminados\n');
    } else {
      console.log('   ✅ No hay cachés\n');
    }

    // Recargar la página después de limpiar
    console.log('🔄 Recargando página con cachés limpios...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('   ✅ Página recargada\n');

    // Tomar screenshot
    await page.screenshot({ path: 'after-sw-cleanup.png', fullPage: true });
    console.log('📸 Screenshot: after-sw-cleanup.png\n');

    console.log('✅ Limpieza completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkServiceWorkers().catch(console.error);
