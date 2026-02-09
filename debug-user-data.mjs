import { chromium } from 'playwright';

async function debugUserData() {
  console.log('🔍 Debugging user data after login...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400
  });

  const page = await (await browser.newContext({
    viewport: { width: 1400, height: 900 }
  })).newPage();

  await page.goto('http://localhost:8080', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  await page.waitForTimeout(3000);

  console.log('📍 Verificando datos del usuario en el navegador...\n');

  // Inyectar script para interceptar el contexto
  const userData = await page.evaluate(() => {
    // Intentar acceder al localStorage donde podría estar el usuario
    const localStorageUser = localStorage.getItem('user');

    // Cookies
    const cookies = document.cookie;
    const hasCookie = cookies.includes('sessionBodas');

    // Buscar en el DOM si hay información del usuario
    const userAvatar = document.querySelector('[class*="avatar"], [alt*="usuario"], [alt*="user"]');

    return {
      localStorageUser: localStorageUser ? JSON.parse(localStorageUser) : null,
      hasCookie,
      cookiePreview: cookies.substring(0, 300),
      hasUserAvatar: !!userAvatar,
    };
  });

  console.log('📊 Datos encontrados:');
  console.log('   Cookie de sesión:', userData.hasCookie ? '✅' : '❌');
  console.log('   Avatar de usuario:', userData.hasUserAvatar ? '✅' : '❌');

  if (userData.localStorageUser) {
    console.log('\n👤 Usuario en localStorage:');
    console.log('   displayName:', userData.localStorageUser.displayName);
    console.log('   email:', userData.localStorageUser.email);
    console.log('   uid:', userData.localStorageUser.uid);
    console.log('   emailVerified:', userData.localStorageUser.emailVerified);
  } else {
    console.log('\n⚠️  No hay usuario en localStorage');
  }

  console.log('\n📍 Abriendo Copilot para verificar el estado interno...');

  const btn = page.locator('button:has-text("Copilot")').first();
  if (await btn.isVisible({ timeout: 5000 })) {
    await btn.click();
    await page.waitForTimeout(2000);

    // Verificar si el overlay aparece
    const overlayState = await page.evaluate(() => {
      const overlayText = document.body.innerText;
      const hasLoginOverlay = overlayText.includes('Inicia sesión para usar');

      return {
        hasLoginOverlay,
        bodyTextSample: overlayText.substring(0, 500),
      };
    });

    console.log('\n📊 Estado del Copilot:');
    console.log('   Overlay "Inicia sesión":', overlayState.hasLoginOverlay ? '❌ VISIBLE (PROBLEMA)' : '✅ No visible');

    if (overlayState.hasLoginOverlay) {
      console.log('\n⚠️  PROBLEMA DETECTADO:');
      console.log('   El overlay sigue visible después del login');
      console.log('   Esto significa que isGuest === true');
      console.log('\n💡 Posibles causas:');
      console.log('   1. user.displayName === "guest"');
      console.log('   2. !user.email (email no disponible)');
      console.log('   3. AuthContext no se actualiza correctamente');
    }

    await page.screenshot({ path: 'debug-user-state.png', fullPage: true });
    console.log('\n📸 Screenshot guardado: debug-user-state.png');
  }

  console.log('\n⏳ Navegador abierto 60s para inspección manual...');
  console.log('   Puedes abrir DevTools (F12) y ejecutar:');
  console.log('   > JSON.parse(localStorage.getItem("user"))');
  console.log('   Para ver los datos completos del usuario\n');

  await page.waitForTimeout(60000);
  await browser.close();
}

debugUserData();
