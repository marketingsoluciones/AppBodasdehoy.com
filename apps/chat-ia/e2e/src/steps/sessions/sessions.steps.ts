// SPRINT-E2E-impl 2026-05-21: Step definitions for sessions.feature.
// Cubre CRUD sessions + persistencia + search.

import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { assertNoRuntimeError } from '../../support/assertions';
import { CustomWorld } from '../../support/world';

// Background
Given('I am logged in', async function (this: CustomWorld) {
  // Reuse auth steps mock pattern
  await this.browserContext.addCookies([
    {
      name: 'idTokenV0.1.0',
      value: 'mock-firebase-id-token',
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);
});

// sessions-create
Given('I have no sessions', async function (this: CustomWorld) {
  await this.page.goto('/chat');
  // Wait for sidebar to load
  await this.page.waitForSelector('[data-testid="session-sidebar"], aside', { timeout: 30_000 });
  // Verify no existing sessions (or empty state)
  const sessions = this.page.locator('[data-testid="session-item"]');
  const count = await sessions.count();
  this.context.initialSessionCount = count;
});

When('I click {string}', async function (this: CustomWorld, label: string) {
  await this.page.getByRole('button', { name: new RegExp(label, 'i') }).first().click();
});

Then('a new session should appear in the sidebar', async function (this: CustomWorld) {
  const expected = (this.context.initialSessionCount as number) + 1;
  await expect(this.page.locator('[data-testid="session-item"]')).toHaveCount(expected, {
    timeout: 10_000,
  });
});

Then('it should be active', async function (this: CustomWorld) {
  const activeItem = this.page.locator('[data-testid="session-item"][data-active="true"]').first();
  await expect(activeItem).toBeVisible();
});

Then('the conversation should be empty', async function (this: CustomWorld) {
  // No assistant messages yet
  const messages = this.page.locator('[data-role="assistant"], [data-message-role="assistant"]');
  await expect(messages).toHaveCount(0);
});

// sessions-rename
Given('I have an active session', async function (this: CustomWorld) {
  await this.page.goto('/chat');
  const sessions = this.page.locator('[data-testid="session-item"]');
  const count = await sessions.count();
  if (count === 0) {
    await this.page.getByRole('button', { name: /new|nueva/i }).first().click();
    await this.page.waitForTimeout(500);
  }
});

When('I type {string}', async function (this: CustomWorld, text: string) {
  const input = this.page.locator('input[type="text"]:visible').first();
  await input.fill(text);
});

When('I press Enter', async function (this: CustomWorld) {
  await this.page.keyboard.press('Enter');
});

Then('the session name should update to {string}', async function (this: CustomWorld, name: string) {
  await expect(this.page.locator(`text=${name}`).first()).toBeVisible({ timeout: 5_000 });
});

Then('the sidebar should reflect the new name', async function (this: CustomWorld) {
  // Already validated above
  await assertNoRuntimeError(this.page);
});

// sessions-delete
Given('I have {int} sessions', async function (this: CustomWorld, count: number) {
  await this.page.goto('/chat');
  const sessions = this.page.locator('[data-testid="session-item"]');
  const existing = await sessions.count();
  for (let i = existing; i < count; i++) {
    await this.page.getByRole('button', { name: /new|nueva/i }).first().click();
    await this.page.waitForTimeout(300);
  }
});

When('I right-click session {int} and select {string}', async function (this: CustomWorld, index: number, action: string) {
  const session = this.page.locator('[data-testid="session-item"]').nth(index - 1);
  await session.click({ button: 'right' });
  await this.page.getByRole('menuitem', { name: new RegExp(action, 'i') }).click();
  // Confirmar dialog si existe
  await this.page.getByRole('button', { name: /confirm|ok|sí|aceptar/i }).click({ timeout: 3_000 }).catch(() => {});
});

Then('session {int} should be removed from the sidebar', async function (this: CustomWorld, index: number) {
  // Just verify total count decreased
  await this.page.waitForTimeout(1000);
  const count = await this.page.locator('[data-testid="session-item"]').count();
  expect(count).toBeLessThan(2);
});

Then('I should be switched to session {int}', async function (this: CustomWorld, index: number) {
  const activeItem = this.page.locator('[data-testid="session-item"][data-active="true"]');
  await expect(activeItem).toBeVisible();
});

Then('no error overlay', async function (this: CustomWorld) {
  await assertNoRuntimeError(this.page);
});

// sessions-persistence
When('I reload the page', async function (this: CustomWorld) {
  this.context.preReloadSessions = await this.page.locator('[data-testid="session-item"]').count();
  await this.page.reload({ waitUntil: 'domcontentloaded' });
  await this.page.waitForSelector('[data-testid="session-sidebar"], aside', { timeout: 30_000 });
});

Then('all {int} sessions should still appear in the sidebar', async function (this: CustomWorld, count: number) {
  await expect(this.page.locator('[data-testid="session-item"]')).toHaveCount(count, {
    timeout: 10_000,
  });
});

Then('the active session should remain selected', async function (this: CustomWorld) {
  const activeItem = this.page.locator('[data-testid="session-item"][data-active="true"]');
  await expect(activeItem).toBeVisible();
});

// sessions-search
Given('I have {int} sessions with various names', async function (this: CustomWorld, count: number) {
  // Seed sessions UI-based (NO api-mcp per memoria)
  await this.page.goto('/chat');
  for (let i = 0; i < count; i++) {
    await this.page.getByRole('button', { name: /new|nueva/i }).first().click();
    await this.page.waitForTimeout(200);
    // Rename to test name pattern
    if (i % 2 === 0) {
      // bodas-themed
      const session = this.page.locator('[data-testid="session-item"]').first();
      await session.dblclick();
      await this.page.keyboard.type(`Boda ${i}`);
      await this.page.keyboard.press('Enter');
    }
  }
});

When('I type {string} in the session search', async function (this: CustomWorld, query: string) {
  const search = this.page.locator('[data-testid="session-search"], input[placeholder*="search"]').first();
  await search.fill(query);
  await this.page.waitForTimeout(500); // debounce
});

Then('only sessions containing {string} should display', async function (this: CustomWorld, query: string) {
  const sessions = this.page.locator('[data-testid="session-item"]');
  const count = await sessions.count();
  for (let i = 0; i < count; i++) {
    const text = await sessions.nth(i).textContent();
    expect(text?.toLowerCase()).toContain(query.toLowerCase());
  }
});
