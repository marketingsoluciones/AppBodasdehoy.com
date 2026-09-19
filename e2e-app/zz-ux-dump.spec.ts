import { test, type Page } from '@playwright/test';

const CHAT = (process.env.CHAT_URL || 'https://chat-dev.bodasdehoy.com').replace(/\/$/, '');
const EMAIL = process.env.TEST_USER_EMAIL || '';
const PASS = process.env.TEST_USER_PASSWORD || '';

async function login(page: Page) {
  await page.goto(`${CHAT}/login`, { timeout: 90_000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.locator('input[type="email"], input[placeholder="tu@email.com"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.locator('button').filter({ hasText: /iniciar sesión/i }).first().click();
  await page.waitForTimeout(9000);
}

/** Todo lo pulsable VISIBLE, en orden de lectura, con su tamaño. */
async function acciones(page: Page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('button, a, select, input')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          alto: Math.round(r.height),
          ancho: Math.round(r.width),
          etiqueta: (el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.textContent || '')
            .replace(/\s+/g, ' ').trim().slice(0, 48),
          tag: el.tagName.toLowerCase(),
          visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0',
          x: Math.round(r.x),
          y: Math.round(r.y),
        };
      })
      .filter((e) => e.visible && e.etiqueta)
      .sort((a, b) => a.y - b.y || a.x - b.x);
  });
}

test('volcado UX', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ height: 900, width: 1440 });
  await login(page);

  await page.goto(`${CHAT}/bandeja`, { timeout: 90_000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  const a1 = await acciones(page);
  console.log('[UX] === BANDEJA · acciones visibles:', a1.length, '===');
  a1.forEach((e) => console.log(`[UX] y=${String(e.y).padStart(4)} ${e.tag.padEnd(6)} ${e.ancho}x${e.alto} · ${e.etiqueta}`));

  const conv = await page.evaluate(() => {
    const f = [...document.querySelectorAll('button')]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.height >= 45 && r.height <= 90 && r.width > 250 && r.top > 150)
      .sort((x, y) => x.r.top - y.r.top)[0];
    return f ? { x: f.r.x + 20, y: f.r.y + f.r.height / 2 } : null;
  });
  if (conv) {
    await page.mouse.click(conv.x, conv.y);
    await page.waitForTimeout(7000);
    const a2 = await acciones(page);
    console.log('[UX] === CONVERSACIÓN · acciones visibles:', a2.length, '===');
    a2.forEach((e) => console.log(`[UX] y=${String(e.y).padStart(4)} ${e.tag.padEnd(6)} ${e.ancho}x${e.alto} · ${e.etiqueta}`));
    const texto = await page.evaluate(() => document.body.innerText.replace(/\n{2,}/g, '\n').slice(0, 1400));
    console.log('[UX] --- TEXTO VISIBLE DE LA CONVERSACIÓN ---\n' + texto);
  }
});
