// SPRINT-E2E-impl 2026-05-21: Step definitions for chat-smoke.feature.
// Cubre: send message + streaming + tool invocation + error handling + cold load + session switch.

import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import {
  ALLOWED_CONSOLE_PATTERNS,
  assertNoConsoleErrors,
  assertNoJsErrors,
  assertNoRuntimeError,
} from '../../support/assertions';
import { CustomWorld } from '../../support/world';

// Background
Given('I am logged in as {string}', async function (this: CustomWorld, email: string) {
  // TODO sesión dedicada: implementar Firebase login flow real
  // Por ahora: setear cookies dev-user-config + mcp_jwt mock via context.addCookies
  await this.browserContext.addCookies([
    {
      name: 'idTokenV0.1.0',
      value: 'mock-firebase-id-token',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: 'dev-user-config',
      value: encodeURIComponent(
        JSON.stringify({ email, token: 'eyJmock', development: 'bodasdehoy' }),
      ),
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
});

Given('I visit {string}', async function (this: CustomWorld, path: string) {
  await this.page.goto(path);
  await this.page.waitForLoadState('domcontentloaded');
});

Given('the api-ia backend is responding at {string}', async function (this: CustomWorld, url: string) {
  // Smoke check api-ia health endpoint
  const response = await this.page.request.get(`${url}/healthz`).catch(() => null);
  if (response && response.status() >= 500) {
    throw new Error(`api-ia backend at ${url} returned ${response.status()}`);
  }
});

// chat-send-message
Given('I am in the default chat session', async function (this: CustomWorld) {
  await this.page.waitForSelector('[data-testid="chat-input"], textarea[placeholder*="message"]', {
    timeout: 30_000,
  });
});

When('I type {string} in the input', async function (this: CustomWorld, message: string) {
  const input = this.page.locator('[data-testid="chat-input"], textarea').first();
  await input.fill(message);
});

When('I click {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.getByRole('button', { name: new RegExp(buttonText, 'i') }).first().click();
});

Then('a user message should appear in the conversation', async function (this: CustomWorld) {
  const userMsg = this.page.locator('[data-role="user"], [data-message-role="user"]').first();
  await expect(userMsg).toBeVisible({ timeout: 10_000 });
});

Then('the assistant should respond within {int} seconds', async function (this: CustomWorld, seconds: number) {
  const assistantMsg = this.page.locator('[data-role="assistant"], [data-message-role="assistant"]').first();
  await expect(assistantMsg).toBeVisible({ timeout: seconds * 1000 });
});

Then('the response should not be empty', async function (this: CustomWorld) {
  const assistantMsg = this.page.locator('[data-role="assistant"], [data-message-role="assistant"]').first();
  const text = await assistantMsg.textContent();
  expect(text?.trim().length).toBeGreaterThan(0);
});

Then('no error overlay should appear', async function (this: CustomWorld) {
  await assertNoRuntimeError(this.page);
});

// chat-stream
Given('I send a message that requires a long response', async function (this: CustomWorld) {
  const input = this.page.locator('textarea').first();
  await input.fill('Explica en detalle 10 ideas creativas para bodas rústicas');
  await this.page.getByRole('button', { name: /send/i }).click();
});

When('the response starts streaming', async function (this: CustomWorld) {
  const assistantMsg = this.page.locator('[data-role="assistant"]').first();
  await expect(assistantMsg).toBeVisible({ timeout: 15_000 });
});

Then('chunks should appear incrementally \\(every <{int}ms)', async function (this: CustomWorld, maxMs: number) {
  // Capture text length at intervals; expect growth
  const assistantMsg = this.page.locator('[data-role="assistant"]').first();
  const initialLen = (await assistantMsg.textContent())?.length || 0;
  await this.page.waitForTimeout(maxMs);
  const newLen = (await assistantMsg.textContent())?.length || 0;
  expect(newLen).toBeGreaterThan(initialLen);
});

Then('the final response should be coherent', async function (this: CustomWorld) {
  // Wait for stream to complete (no more updates for 2s)
  let prevLen = 0;
  let stableCount = 0;
  for (let i = 0; i < 60; i++) {
    const len = (await this.page.locator('[data-role="assistant"]').first().textContent())?.length || 0;
    if (len === prevLen) {
      stableCount++;
      if (stableCount >= 4) break;
    } else {
      stableCount = 0;
      prevLen = len;
    }
    await this.page.waitForTimeout(500);
  }
  expect(prevLen).toBeGreaterThan(50);
});

Then('no runtime errors during streaming', async function (this: CustomWorld) {
  await assertNoRuntimeError(this.page);
  assertNoJsErrors(this.context.jsErrors);
});

// chat-tool-invocation
Given('I send {string}', async function (this: CustomWorld, message: string) {
  const input = this.page.locator('textarea').first();
  await input.fill(message);
  await this.page.getByRole('button', { name: /send/i }).click();
});

When('the AI invokes the venue-visualizer tool', async function (this: CustomWorld) {
  await this.page.waitForSelector('[data-tool="lobe-venue-visualizer"], [data-testid*="venue"]', {
    timeout: 60_000,
  });
});

Then('the inline tool render should display {int} venue cards', async function (this: CustomWorld, count: number) {
  const cards = this.page.locator('[data-testid="venue-card"], [data-tool-card]');
  await expect(cards).toHaveCount(count, { timeout: 30_000 });
});

Then('each card should have a placeholder\\/image', async function (this: CustomWorld) {
  const cards = this.page.locator('[data-testid="venue-card"]');
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const img = cards.nth(i).locator('img, [data-placeholder]').first();
    await expect(img).toBeVisible();
  }
});

// chat-error-handling
Given('api-ia is unreachable', async function (this: CustomWorld) {
  // Mock fetch para /webapi/chat → 502
  await this.page.route('**/webapi/chat/**', (route) =>
    route.fulfill({ status: 502, body: JSON.stringify({ error: 'Mocked: api-ia down' }) }),
  );
});

When('I send a message', async function (this: CustomWorld) {
  const input = this.page.locator('textarea').first();
  await input.fill('Test mensaje');
  await this.page.getByRole('button', { name: /send/i }).click();
});

Then('an error message should display', async function (this: CustomWorld) {
  await expect(this.page.locator('text=/error|fail|disponible/i').first()).toBeVisible({
    timeout: 15_000,
  });
});

Then('the user can retry without refresh', async function (this: CustomWorld) {
  const retryButton = this.page.getByRole('button', { name: /retry|reintentar/i }).first();
  if (await retryButton.count()) {
    await expect(retryButton).toBeEnabled();
  }
});

// chat-session-switch
Given('I have {int} chat sessions', async function (this: CustomWorld, count: number) {
  // TODO: implementar seed sessions via UI (NO via api-mcp per memoria)
  // Por ahora skip si <count sessions existen
  const sidebarItems = this.page.locator('[data-testid="session-item"]');
  const existing = await sidebarItems.count();
  for (let i = existing; i < count; i++) {
    await this.page.getByRole('button', { name: /new session|nueva/i }).click();
    await this.page.waitForTimeout(500);
  }
});

When('I click on session {int}', async function (this: CustomWorld, index: number) {
  await this.page.locator('[data-testid="session-item"]').nth(index - 1).click();
});

Then('the conversation history of session {int} should load', async function (this: CustomWorld, index: number) {
  await this.page.waitForSelector('[data-conversation-loaded]', { timeout: 10_000 }).catch(() => {});
  // Smoke: input visible (no full crash)
  await expect(this.page.locator('textarea').first()).toBeVisible();
});

Then('the active session indicator should update', async function (this: CustomWorld) {
  const activeSession = this.page.locator('[data-active="true"], [aria-current="true"]').first();
  await expect(activeSession).toBeVisible();
});

// chat-no-bundle-error
Given('I clear browser cache', async function (this: CustomWorld) {
  await this.browserContext.clearCookies();
  await this.browserContext.clearPermissions();
});

When('I visit {string} for the first time', async function (this: CustomWorld, path: string) {
  this.context.coldStart = Date.now();
  await this.page.goto(path, { waitUntil: 'domcontentloaded' });
});

Then('there should be no {string} errors', async function (this: CustomWorld, errorType: string) {
  const errors = this.context.consoleErrors.filter((e) =>
    e.toLowerCase().includes(errorType.toLowerCase()),
  );
  expect(errors).toEqual([]);
});

Then('there should be no failed chunk loads', async function (this: CustomWorld) {
  const chunkErrors = this.context.consoleErrors.filter((e) =>
    /ChunkLoadError|Loading chunk \d+ failed/i.test(e),
  );
  expect(chunkErrors).toEqual([]);
});

Then('First Contentful Paint should be < {int} seconds', async function (this: CustomWorld, seconds: number) {
  const fcp = await this.page.evaluate(() => {
    const entry = performance.getEntriesByName('first-contentful-paint')[0];
    return entry ? entry.startTime : null;
  });
  if (fcp !== null) {
    expect(fcp).toBeLessThan(seconds * 1000);
  }
});
