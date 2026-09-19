import { test, expect, devices } from '@playwright/test';

/**
 * Verificación de CAMBIO DE WHITELABEL por dominio (sin login, sin build nuevo).
 * chat-dev.bodasdehoy.com → bodasdehoy (rosa #F7628C) vs
 * chat-dev.eventosorganizador.com → eventosorganizador (azul #6096B9).
 * El fix de marca (AppTheme usa getCurrentDevelopmentConfig().colors.primary) ya está desplegado.
 */
test.use({ ...devices['iPhone 13'] });

async function inspect(page: any, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(9000); // esperar a que LobeChat pase del splash y renderice
  return page.evaluate(() => {
    const dev = (() => { try { return localStorage.getItem('current_development'); } catch { return null; } })();
    // Buscar el color primario de marca: escanear TODAS las CSS custom properties del :root
    const cs = getComputedStyle(document.documentElement);
    const primaries: Record<string, string> = {};
    for (const name of ['--ant-color-primary', '--color-primary', '--lobe-color-primary', '--ant-color-primary-text', '--ant-primary-color']) {
      const v = cs.getPropertyValue(name)?.trim(); if (v) primaries[name] = v;
    }
    // Además, color computado de un botón/enlace de acento si existe
    const accentEl = document.querySelector('a, button[class*="primary"], [class*="Primary"], [data-testid*="send"]') as HTMLElement | null;
    const accentColor = accentEl ? getComputedStyle(accentEl).color : '';
    return { dev, primaries, accentColor, href: location.href };
  });
}

test('Whitelabel switch: bodasdehoy (rosa) vs eventosorganizador (azul)', async ({ browser }) => {
  test.setTimeout(180_000);
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  try {
    const p1 = await ctx.newPage();
    const bodas = await inspect(p1, 'https://chat-dev.bodasdehoy.com/login');
    console.log('[wl] bodasdehoy login →', JSON.stringify(bodas));
    await p1.screenshot({ path: 'e2e-app/_wl-bodasdehoy.png', fullPage: true }).catch(() => {});
    await p1.close();

    const p2 = await ctx.newPage();
    const eo = await inspect(p2, 'https://chat-dev.eventosorganizador.com/login');
    console.log('[wl] eventosorganizador login →', JSON.stringify(eo));
    await p2.screenshot({ path: 'e2e-app/_wl-eventosorganizador.png', fullPage: true }).catch(() => {});
    await p2.close();

    console.log('[wl] RESULTADO: dev bodas=', bodas.dev, '| dev eo=', eo.dev, '| ¿cambia el development?', bodas.dev !== eo.dev);
  } finally {
    await ctx.close().catch(() => {});
  }
});
