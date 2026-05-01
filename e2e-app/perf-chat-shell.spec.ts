import { test } from '@playwright/test';
import { TEST_URLS } from './fixtures';

test('perf: tiempo a pantalla (chat-shell)', async ({ browser }) => {
  test.setTimeout(180_000);

  const url = `${TEST_URLS.chat}/chat`;

  {
    const context = await browser.newContext();
    const page = await context.newPage();
    const startedAt = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('chat-shell').waitFor({ state: 'visible', timeout: 120_000 });
    const timeToShellMs = Date.now() - startedAt;
    console.log(JSON.stringify({ run: 0, url, timeToShellMs, warmup: true }, null, 2));
    await context.close();
  }

  for (let i = 1; i <= 3; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const startedAt = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('chat-shell').waitFor({ state: 'visible', timeout: 60_000 });
    const timeToShellMs = Date.now() - startedAt;

    const nav = await page.evaluate(() => {
      const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (!entry) return null;
      return {
        domContentLoaded: entry.domContentLoadedEventEnd,
        loadEventEnd: entry.loadEventEnd,
        responseStart: entry.responseStart,
        startTime: entry.startTime,
      };
    });

    const ttfbMs = nav ? Math.max(0, nav.responseStart - nav.startTime) : null;

    console.log(
      JSON.stringify(
        {
          run: i,
          url,
          timeToShellMs,
          ttfbMs,
          domContentLoadedMs: nav?.domContentLoaded ?? null,
          loadEventEndMs: nav?.loadEventEnd ?? null,
        },
        null,
        2,
      ),
    );

    await context.close();
  }
});
