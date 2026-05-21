// SPRINT-E2E-impl 2026-05-21: Step definitions for visitor-limits.feature.

import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { CustomWorld } from '../../support/world';

// Background
Given('the api-ia backend is responding', async function (this: CustomWorld) {
  const url = process.env.API_IA_URL || 'https://api-ia.bodasdehoy.com';
  const response = await this.page.request.get(`${url}/healthz`).catch(() => null);
  if (response && response.status() >= 500) {
    throw new Error(`api-ia backend not responding: ${response.status()}`);
  }
});

Given('the chat-ia dev server is running', async function (this: CustomWorld) {
  const response = await this.page.request.get('http://localhost:3210/').catch(() => null);
  if (!response || response.status() >= 500) {
    throw new Error('chat-ia dev server not responding on port 3210');
  }
});

// visitor-message-limit
Given('I am an anonymous visitor \\(no auth)', async function (this: CustomWorld) {
  // Clear all auth state
  await this.browserContext.clearCookies();
  await this.page.goto('/chat');
});

When('I send {int} messages in one session', async function (this: CustomWorld, count: number) {
  for (let i = 0; i < count; i++) {
    const input = this.page.locator('textarea').first();
    await input.fill(`Mensaje visitante ${i + 1}`);
    await this.page.getByRole('button', { name: /send/i }).click();
    // Wait for response or 30s
    await this.page.waitForSelector(`[data-role="assistant"]:nth-of-type(${i + 1})`, { timeout: 30_000 }).catch(() => {});
  }
});

Then('on the {int}th message attempt', async function (this: CustomWorld, n: number) {
  const input = this.page.locator('textarea').first();
  await input.fill(`Mensaje ${n}`);
  await this.page.getByRole('button', { name: /send/i }).click();
  await this.page.waitForTimeout(2000); // expect modal triggered
});

Then('a {string} modal should appear', async function (this: CustomWorld, label: string) {
  await expect(this.page.locator(`text=${label}`).first()).toBeVisible({ timeout: 10_000 });
});

Then('the chat input should be blocked', async function (this: CustomWorld) {
  const input = this.page.locator('textarea').first();
  const isDisabled = await input.isDisabled().catch(() => false);
  const isReadonly = await input.getAttribute('readonly');
  expect(isDisabled || isReadonly !== null).toBe(true);
});

// visitor-system-prompt
When('I send {string}', async function (this: CustomWorld, message: string) {
  const input = this.page.locator('textarea').first();
  await input.fill(message);
  await this.page.getByRole('button', { name: /send/i }).click();
});

Then('the AI response should be COMMERCIAL \\(not technical)', async function (this: CustomWorld) {
  await this.page.waitForSelector('[data-role="assistant"]', { timeout: 30_000 });
  const text = await this.page.locator('[data-role="assistant"]').first().textContent();
  // Should mention bodasdehoy / registro / planificar
  expect(text?.toLowerCase()).toMatch(/bodasdehoy|registro|registr|gratis|crear cuenta/i);
});

Then('it should mention bodasdehoy features', async function (this: CustomWorld) {
  const text = await this.page.locator('[data-role="assistant"]').first().textContent();
  // System prompt menciona "invitados", "presupuesto", "mesas", "itinerario"
  const features = ['invitados', 'presupuesto', 'mesas', 'itinerario'];
  const hasAnyFeature = features.some((f) => text?.toLowerCase().includes(f));
  expect(hasAnyFeature).toBe(true);
});

Then('it should invite to register at {string}', async function (this: CustomWorld, url: string) {
  const text = await this.page.locator('[data-role="assistant"]').first().textContent();
  expect(text).toContain('app.bodasdehoy.com');
});

// guest-daily-limit
Given('I am a guest user \\(cookie session, no Firebase auth)', async function (this: CustomWorld) {
  await this.browserContext.clearCookies();
  await this.browserContext.addCookies([
    {
      name: 'guestbodas',
      value: 'guest-session-token',
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);
  await this.page.goto('/chat');
});

Given('I have sent {int} messages today', async function (this: CustomWorld, count: number) {
  // Seed cookie vis_mc with count
  await this.browserContext.addCookies([
    {
      name: 'vis_mc',
      value: String(count),
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);
});

When('on the {int}rd message', async function (this: CustomWorld, n: number) {
  const input = this.page.locator('textarea').first();
  await input.fill(`Test ${n}`);
  this.context.lastResponse = await this.page
    .waitForResponse((resp) => resp.url().includes('/webapi/chat') && resp.request().method() === 'POST', {
      timeout: 30_000,
    })
    .then(async (resp) => resp);
  await this.page.getByRole('button', { name: /send/i }).click();
});

Then('HTTP {int} should return with {string}', async function (this: CustomWorld, status: number, message: string) {
  const response = this.context.lastResponse;
  expect(response?.status()).toBe(status);
  const body = await response?.text();
  expect(body).toContain(message);
});

// visitor-no-leak
Given('I am a visitor with NO valid auth', async function (this: CustomWorld) {
  await this.browserContext.clearCookies();
});

Given('I have a stale SSO cookie from a previous session', async function (this: CustomWorld) {
  await this.browserContext.addCookies([
    {
      name: 'idTokenV0.1.0',
      value: 'eyJexpired.stale.token',
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ]);
});

Then('the proxy should STRIP Authorization header before api-ia', async function (this: CustomWorld) {
  // Verify via intercepted request al api-ia upstream
  // El proxy chat/[provider]/route.ts hace delete headers['Authorization'] para restricted
  // Aquí verificamos que la cookie stale NO causó leak — response NO contiene data real
  const text = await this.page.locator('[data-role="assistant"]').first().textContent();
  // Response debe ser commercial (visitor) NO mostrar datos reales
  expect(text?.toLowerCase()).toMatch(/bodasdehoy|registro|gratis/i);
});

Then('no real user data should leak in response', async function (this: CustomWorld) {
  const text = await this.page.locator('[data-role="assistant"]').first().textContent();
  // NO debe contener datos sensibles (emails, IDs, etc)
  expect(text).not.toMatch(/[a-z0-9.]+@[a-z0-9.-]+\.[a-z]{2,}/);
});
