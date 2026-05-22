// Discovery: screenshots de páginas appEventos + dump del DOM mínimo
// para identificar selectors (botones CRUD, modales, etc) antes de escribir specs.
// Run: npx tsx discover-appeventos-ui.ts

import { webkit } from 'playwright';
import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

const CHAT_URL = process.env.BASE_URL || 'http://localhost:3210';
const APP_URL = process.env.APPEVENTOS_URL || 'http://localhost:3220';
const STATE_PATH = resolve(__dirname, '.auth/super-admin.json');
const OUT_DIR = '/tmp/appeventos-discover';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'eventos', path: '/eventos' },
  { name: 'invitados', path: '/invitados' },
  { name: 'mesas', path: '/mesas' },
  { name: 'presupuesto', path: '/presupuesto' },
  { name: 'itinerario', path: '/itinerario' },
  { name: 'invitaciones', path: '/invitaciones' },
  { name: 'lista-regalos', path: '/lista-regalos' },
  { name: 'configuracion', path: '/configuracion' },
  { name: 'facturacion', path: '/facturacion' },
];

async function main() {
  if (!existsSync(STATE_PATH)) {
    console.error(`❌ Missing ${STATE_PATH}`);
    process.exitCode = 1;
    return;
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // Pre-flight
  const appAlive = await fetch(APP_URL).then((r) => r.ok).catch(() => false);
  if (!appAlive) {
    console.error(`❌ appEventos no responde en ${APP_URL}`);
    process.exitCode = 2;
    return;
  }

  const state = JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  const idToken = state.cookies.find((c: any) => c.name === 'idTokenV0.1.0');

  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1024 },
  });
  await ctx.addCookies([
    {
      name: 'idTokenV0.1.0',
      value: idToken.value,
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);

  const page = await ctx.newPage();
  page.on('pageerror', (e) => {
    if (!/socket\.io|api3-ia|webkit-fix|reflection-target|access control/i.test(e.message)) {
      console.log(`  [pageerror] ${e.message.slice(0, 80)}`);
    }
  });

  for (const p of PAGES) {
    console.log(`\n=== ${p.name} (${p.path}) ===`);
    try {
      await page.goto(APP_URL + p.path, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      await page.waitForTimeout(4000);

      const screenshotPath = `${OUT_DIR}/${p.name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 15_000, animations: 'disabled' }).catch(() => null);
      console.log(`  📸 ${screenshotPath}`);

      // Dump interactive elements found
      const interactives = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button')).map((b) => ({
          text: (b.textContent || '').trim().slice(0, 60),
          testid: b.getAttribute('data-testid') || '',
          aria: b.getAttribute('aria-label') || '',
          disabled: b.disabled,
        })).filter((b) => b.text || b.testid || b.aria);
        const links = Array.from(document.querySelectorAll('a[href]')).map((a) => ({
          text: (a.textContent || '').trim().slice(0, 50),
          href: (a as HTMLAnchorElement).getAttribute('href') || '',
        })).filter((a) => a.text && !a.href.startsWith('#'));
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, .ant-modal-title')).map((h) => (h.textContent || '').trim()).filter(Boolean);
        return { buttons: buttons.slice(0, 20), links: links.slice(0, 15), headings: headings.slice(0, 10) };
      });

      console.log(`  Headings: ${interactives.headings.join(' | ').slice(0, 200)}`);
      console.log(`  Buttons (${interactives.buttons.length}): ${interactives.buttons.map((b) => b.text || b.aria || b.testid).filter(Boolean).join(' | ').slice(0, 250)}`);
      console.log(`  Links (${interactives.links.length}): ${interactives.links.map((l) => l.text).filter(Boolean).join(' | ').slice(0, 250)}`);

      writeFileSync(
        `${OUT_DIR}/${p.name}.json`,
        JSON.stringify({ url: page.url(), ...interactives }, null, 2),
      );
    } catch (e: any) {
      console.log(`  ❌ ${e.message.slice(0, 100)}`);
    }
  }

  await browser.close();
  console.log(`\nDone. Screenshots + dumps en ${OUT_DIR}/`);
}

main();
