import { IWorldOptions, World, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, Response, chromium, webkit } from '@playwright/test';

export interface TestContext {
  [key: string]: any;
  consoleErrors: string[];
  jsErrors: Error[];
  lastResponse?: Response | null;
  previousUrl?: string;
}

export class CustomWorld extends World {
  browser!: Browser;
  browserContext!: BrowserContext;
  page!: Page;
  testContext: TestContext;

  constructor(options: IWorldOptions) {
    super(options);
    this.testContext = {
      consoleErrors: [],
      jsErrors: [],
    };
  }

  // Getter for easier access
  get context(): TestContext {
    return this.testContext;
  }

  async init() {
    const PORT = process.env.PORT ? Number(process.env.PORT) : 3010;
    const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

    // SPRINT-E2E-impl 2026-05-21: Default webkit per memoria proyecto
    // ("E2E: Playwright con webkit (NUNCA Chromium)"). chromium fallback via
    // BROWSER=chromium env si se necesita en CI con limitations.
    const browserType = process.env.BROWSER === 'chromium' ? chromium : webkit;
    this.browser = await browserType.launch({
      headless: process.env.HEADLESS !== 'false',
    });

    this.browserContext = await this.browser.newContext({
      baseURL: BASE_URL,
      viewport: { height: 720, width: 1280 },
    });

    // Set expect timeout for assertions (e.g., toBeVisible, toHaveText)
    this.browserContext.setDefaultTimeout(120_000);

    this.page = await this.browserContext.newPage();

    // Set up error listeners
    this.page.on('pageerror', (error) => {
      this.testContext.jsErrors.push(error);
      console.error('Page error:', error.message);
    });

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.testContext.consoleErrors.push(msg.text());
      }
    });

    this.page.setDefaultTimeout(120_000);
  }

  async cleanup() {
    await this.page?.close();
    await this.browserContext?.close();
    await this.browser?.close();
  }

  async takeScreenshot(name: string): Promise<Buffer> {
    console.log(name);
    return await this.page.screenshot({ fullPage: true });
  }
}

setWorldConstructor(CustomWorld);
