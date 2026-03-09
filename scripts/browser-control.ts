/**
 * Browser Control Script using Playwright
 *
 * This script allows Claude to control the browser, take screenshots,
 * read console logs, and interact with the DOM.
 *
 * Usage:
 *   npx ts-node scripts/browser-control.ts <command> [options]
 *
 * Commands:
 *   open <url>           - Open a URL in the browser
 *   snapshot <url> [filename] - Open URL headless and screenshot (no session)
 *   screenshot [path]    - Take a screenshot
 *   console              - Read console logs from the log file
 *   click <selector>     - Click an element
 *   type <selector> <text> - Type text into an element
 *   scroll <direction> [amount] - Scroll the page
 *   eval <script>        - Evaluate JavaScript in the page
 *   info                 - Get current page info
 *   close                - Close the browser
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';

const STATE_FILE = path.join(process.cwd(), '.browser-state.json');
const LOG_FILE = path.join(process.cwd(), '.browser-logs.json');
const SCREENSHOT_DIR = path.join(process.cwd(), '.screenshots');

interface BrowserState {
  wsEndpoint?: string;
  currentUrl?: string;
  isRunning: boolean;
}

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function readState(): BrowserState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch {}
  return { isRunning: false };
}

function writeState(state: BrowserState) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function isPortFree(port: number): Promise<boolean> {
  return await new Promise((resolve) => {
    const server = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => server.close(() => resolve(true)))
      .listen(port, '127.0.0.1');
  });
}

async function findFreePort(start = 9222, end = 9322): Promise<number> {
  for (let port = start; port <= end; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found in range ${start}-${end}`);
}

async function getOrCreateBrowser(): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  const state = readState();

  let browser: Browser;

  if (state.wsEndpoint && state.isRunning) {
    try {
      browser = await chromium.connectOverCDP(state.wsEndpoint);
      const contexts = browser.contexts();
      if (contexts.length > 0) {
        const context = contexts[0];
        const pages = context.pages();
        if (pages.length > 0) {
          return { browser, context, page: pages[0] };
        }
      }
    } catch {
      // Browser was closed, start a new one
    }
  }

  // Launch new browser
  const debugPort = await findFreePort(9222, 9322);
  browser = await chromium.launch({
    headless: false,
    args: [`--remote-debugging-port=${debugPort}`],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Setup console logging
  page.on('console', (msg) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: msg.type() as 'log' | 'error' | 'warn' | 'info',
      data: [msg.text()],
      url: page.url(),
    };
    appendLog(logEntry);
  });

  page.on('pageerror', (error) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'error' as const,
      data: { message: error.message, stack: error.stack },
      url: page.url(),
    };
    appendLog(logEntry);
  });

  // Save state
  writeState({
    wsEndpoint: `http://127.0.0.1:${debugPort}`,
    isRunning: true,
  });

  return { browser, context, page };
}

function appendLog(entry: unknown) {
  try {
    let logs = { logs: [] as unknown[] };
    if (fs.existsSync(LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    }
    logs.logs.push(entry);
    // Keep last 500 logs
    logs.logs = logs.logs.slice(-500);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch {}
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Browser Control Script

Commands:
  open <url>              - Open a URL in the browser
  screenshot [filename]   - Take a screenshot (saved to .screenshots/)
  console [limit]         - Read last N console logs (default: 50)
  click <selector>        - Click an element by CSS selector
  type <selector> <text>  - Type text into an element
  scroll <up|down> [px]   - Scroll the page (default: 300px)
  eval <script>           - Evaluate JavaScript in the page
  info                    - Get current page info (URL, title, viewport)
  dom <selector>          - Get DOM info for elements matching selector
  close                   - Close the browser

Examples:
  npx ts-node scripts/browser-control.ts open http://localhost:3000
  npx ts-node scripts/browser-control.ts screenshot
  npx ts-node scripts/browser-control.ts console 20
  npx ts-node scripts/browser-control.ts click "button.submit"
  npx ts-node scripts/browser-control.ts type "#email" "test@example.com"
  npx ts-node scripts/browser-control.ts eval "document.title"
    `);
    return;
  }

  try {
    switch (command) {
      case 'open': {
        const url = args[1] || 'http://localhost:3000';
        const { page } = await getOrCreateBrowser();
        await page.goto(url, { waitUntil: 'networkidle' });
        console.log(JSON.stringify({
          success: true,
          url: page.url(),
          title: await page.title(),
        }));
        break;
      }

      case 'snapshot': {
        const url = args[1] || 'http://localhost:3000';
        const filename = args[2] || `snapshot-${Date.now()}.png`;
        const waitMs = Math.max(0, parseInt(args[3] || '1500', 10) || 1500);
        const filepath = path.join(SCREENSHOT_DIR, filename);

        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
        const page = await context.newPage();

        // En algunas apps con websockets "networkidle" nunca llega. Usamos domcontentloaded + pequeña espera.
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
        // Next oculta el body para evitar FOUC; espera a que se muestre.
        await page.waitForFunction(
          () => window.getComputedStyle(document.body).display !== 'none',
          undefined,
          { timeout: 60_000 }
        );
        // Si existe un iframe (Copilot), esperar a que esté presente para asegurar render.
        await page.waitForSelector('iframe', { timeout: 60_000 }).catch(() => undefined);
        await page.waitForTimeout(waitMs);

        await page.screenshot({ path: filepath, fullPage: false });
        await browser.close();

        console.log(JSON.stringify({
          success: true,
          path: filepath,
          url: page.url(),
        }));
        break;
      }

      case 'screenshot': {
        const { page } = await getOrCreateBrowser();
        const filename = args[1] || `screenshot-${Date.now()}.png`;
        const filepath = path.join(SCREENSHOT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: false });
        console.log(JSON.stringify({
          success: true,
          path: filepath,
          url: page.url(),
        }));
        break;
      }

      case 'console': {
        const limit = parseInt(args[1] || '50', 10);
        if (fs.existsSync(LOG_FILE)) {
          const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
          const recentLogs = logs.logs.slice(-limit);
          console.log(JSON.stringify({ logs: recentLogs, total: logs.logs.length }));
        } else {
          console.log(JSON.stringify({ logs: [], total: 0 }));
        }
        break;
      }

      case 'click': {
        const selector = args[1];
        if (!selector) {
          console.log(JSON.stringify({ error: 'Selector required' }));
          break;
        }
        const { page } = await getOrCreateBrowser();
        await page.click(selector);
        console.log(JSON.stringify({ success: true, selector }));
        break;
      }

      case 'type': {
        const selector = args[1];
        const text = args.slice(2).join(' ');
        if (!selector || !text) {
          console.log(JSON.stringify({ error: 'Selector and text required' }));
          break;
        }
        const { page } = await getOrCreateBrowser();
        await page.fill(selector, text);
        console.log(JSON.stringify({ success: true, selector, text }));
        break;
      }

      case 'scroll': {
        const direction = args[1] || 'down';
        const amount = parseInt(args[2] || '300', 10);
        const { page } = await getOrCreateBrowser();
        const scrollY = direction === 'up' ? -amount : amount;
        await page.evaluate((y) => window.scrollBy(0, y), scrollY);
        const position = await page.evaluate(() => ({
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          scrollHeight: document.documentElement.scrollHeight,
        }));
        console.log(JSON.stringify({ success: true, ...position }));
        break;
      }

      case 'keyboard': {
        const text = args.slice(1).join(' ');
        if (!text) {
          console.log(JSON.stringify({ error: 'Text required. Usage: keyboard <text> or keyboard --enter' }));
          break;
        }
        const { page } = await getOrCreateBrowser();
        if (text === '--enter') {
          await page.keyboard.press('Enter');
          console.log(JSON.stringify({ success: true, action: 'pressed Enter' }));
        } else if (text === '--tab') {
          await page.keyboard.press('Tab');
          console.log(JSON.stringify({ success: true, action: 'pressed Tab' }));
        } else {
          await page.keyboard.type(text, { delay: 50 });
          console.log(JSON.stringify({ success: true, typed: text }));
        }
        break;
      }

      case 'focus': {
        const selector = args[1];
        if (!selector) {
          console.log(JSON.stringify({ error: 'Selector required' }));
          break;
        }
        const { page } = await getOrCreateBrowser();
        await page.focus(selector);
        console.log(JSON.stringify({ success: true, focused: selector }));
        break;
      }

      case 'clickxy': {
        const x = parseInt(args[1], 10);
        const y = parseInt(args[2], 10);
        if (isNaN(x) || isNaN(y)) {
          console.log(JSON.stringify({ error: 'X and Y coordinates required. Usage: clickxy <x> <y>' }));
          break;
        }
        const { page } = await getOrCreateBrowser();
        await page.mouse.click(x, y);
        console.log(JSON.stringify({ success: true, clicked: { x, y } }));
        break;
      }

      case 'iframe': {
        const action = args[1];
        const { page } = await getOrCreateBrowser();
        const iframeLocator = page.frameLocator('iframe').first();

        if (action === 'click') {
          const selector = args[2];
          if (!selector) {
            console.log(JSON.stringify({ error: 'Selector required' }));
            break;
          }
          await iframeLocator.locator(selector).click({ timeout: 10000 });
          console.log(JSON.stringify({ success: true, action: 'iframe click', selector }));
        } else if (action === 'type') {
          const selector = args[2];
          const text = args.slice(3).join(' ');
          if (!selector || !text) {
            console.log(JSON.stringify({ error: 'Selector and text required' }));
            break;
          }
          await iframeLocator.locator(selector).fill(text);
          console.log(JSON.stringify({ success: true, action: 'iframe type', selector, text }));
        } else if (action === 'keyboard') {
          const text = args.slice(2).join(' ');
          const iframeElement = page.locator('iframe').first();
          const box = await iframeElement.boundingBox();
          if (box) {
            // Click near bottom of iframe where chat input usually is
            await page.mouse.click(box.x + box.width / 2, box.y + box.height - 50);
            await page.waitForTimeout(500);
            if (text === '--enter') {
              await page.keyboard.press('Enter');
            } else {
              await page.keyboard.type(text, { delay: 30 });
            }
            console.log(JSON.stringify({ success: true, action: 'iframe keyboard', text }));
          } else {
            console.log(JSON.stringify({ error: 'Could not find iframe bounds' }));
          }
        } else {
          console.log(JSON.stringify({ error: 'Usage: iframe click <selector> | iframe type <selector> <text> | iframe keyboard <text>' }));
        }
        break;
      }

      case 'eval': {
        const script = args.slice(1).join(' ');
        if (!script) {
          console.log(JSON.stringify({ error: 'Script required' }));
          break;
        }
        const { page } = await getOrCreateBrowser();
        const result = await page.evaluate(script);
        console.log(JSON.stringify({ success: true, result }));
        break;
      }

      case 'info': {
        const { page } = await getOrCreateBrowser();
        const info = await page.evaluate(() => ({
          url: window.location.href,
          title: document.title,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          scroll: {
            x: window.scrollX,
            y: window.scrollY,
            maxY: document.documentElement.scrollHeight - window.innerHeight,
          },
          readyState: document.readyState,
        }));
        console.log(JSON.stringify(info));
        break;
      }

      case 'dom': {
        const selector = args[1] || 'body';
        const { page } = await getOrCreateBrowser();
        const elements = await page.$$eval(selector, (els) =>
          els.slice(0, 10).map((el) => ({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            text: el.textContent?.slice(0, 100),
            rect: el.getBoundingClientRect(),
          }))
        );
        console.log(JSON.stringify({ elements, count: elements.length }));
        break;
      }

      case 'close': {
        const state = readState();
        if (state.wsEndpoint) {
          try {
            const browser = await chromium.connectOverCDP(state.wsEndpoint);
            await browser.close();
          } catch {}
        }
        writeState({ isRunning: false });
        console.log(JSON.stringify({ success: true, message: 'Browser closed' }));
        break;
      }

      default:
        console.log(JSON.stringify({ error: `Unknown command: ${command}` }));
    }
  } catch (error) {
    console.log(JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }));
    process.exit(1);
  }
}

main();
