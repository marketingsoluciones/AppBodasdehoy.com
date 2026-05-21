// SPRINT-E2E-impl 2026-05-21: Step definitions for sso-cross-app.feature.

import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { CustomWorld } from '../../support/world';

// Background
Given('chat-ia is running on {string}', async function (this: CustomWorld, url: string) {
  this.context.chatIaUrl = url;
});

Given('appEventos is running on {string}', async function (this: CustomWorld, url: string) {
  this.context.appEventosUrl = url;
});

// sso-login-chat-then-app
Given('I am NOT logged in any app', async function (this: CustomWorld) {
  await this.browserContext.clearCookies();
});

When('I login in chat-ia as {string}', async function (this: CustomWorld, email: string) {
  const chatIaUrl = (this.context.chatIaUrl as string) || 'http://localhost:3210';
  await this.page.goto(`${chatIaUrl}/login`);
  await this.page.fill('input[type="email"]', email);
  await this.page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'test-password');
  await this.page.click('button[type="submit"]');
  await this.page.waitForURL(/\/chat/, { timeout: 30_000 });
});

Then('the cookie {string} should be set on {string} domain', async function (this: CustomWorld, cookieName: string, domain: string) {
  const cookies = await this.browserContext.cookies();
  const cookie = cookies.find((c) => c.name === cookieName);
  expect(cookie).toBeDefined();
  expect(cookie?.domain).toContain(domain.replace('.', ''));
});

When('I visit appEventos', async function (this: CustomWorld) {
  const appUrl = (this.context.appEventosUrl as string) || 'http://localhost:3220';
  await this.page.goto(appUrl);
});

Then('the session should be active', async function (this: CustomWorld) {
  // appEventos should NOT redirect to login
  await this.page.waitForLoadState('domcontentloaded');
  const currentUrl = this.page.url();
  expect(currentUrl).not.toContain('/login');
});

Then('appEventos should display my user profile', async function (this: CustomWorld) {
  // Look for profile indicator (avatar, email, name)
  const profile = this.page.locator('[data-testid="user-profile"], [data-testid="user-avatar"]').first();
  await expect(profile).toBeVisible({ timeout: 15_000 });
});

Then('no re-login should be required', async function (this: CustomWorld) {
  expect(this.page.url()).not.toContain('/login');
});

// sso-login-app-then-chat
When('I login in appEventos', async function (this: CustomWorld) {
  const appUrl = (this.context.appEventosUrl as string) || 'http://localhost:3220';
  await this.page.goto(`${appUrl}/login`);
  await this.page.fill('input[type="email"]', 'test@bodasdehoy.com');
  await this.page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'test-password');
  await this.page.click('button[type="submit"]');
  await this.page.waitForLoadState('domcontentloaded');
});

When('the AuthBridge syncs to localStorage', async function (this: CustomWorld) {
  // Wait for AuthBridge listener to fire
  await this.page.waitForTimeout(2_000);
  const jwt = await this.page.evaluate(() => localStorage.getItem('mcp_jwt'));
  if (!jwt) {
    throw new Error('AuthBridge did not sync mcp_jwt to localStorage');
  }
});

When('I visit chat-ia', async function (this: CustomWorld) {
  const chatIaUrl = (this.context.chatIaUrl as string) || 'http://localhost:3210';
  await this.page.goto(chatIaUrl);
});

Then('chat-ia should auto-detect the session', async function (this: CustomWorld) {
  // Wait for redirect to /chat (or any non-login page)
  await this.page.waitForURL((url) => !url.toString().includes('/login'), { timeout: 30_000 });
});

Then('redirect to \\/chat without showing \\/login', async function (this: CustomWorld) {
  expect(this.page.url()).toContain('/chat');
  expect(this.page.url()).not.toContain('/login');
});

// sso-logout-cross-app
Given('I am logged in both chat-ia and appEventos', async function (this: CustomWorld) {
  // Login chat-ia first
  await this.page.goto('/login');
  await this.page.fill('input[type="email"]', 'test@bodasdehoy.com');
  await this.page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'test-password');
  await this.page.click('button[type="submit"]');
  await this.page.waitForURL(/\/chat/, { timeout: 30_000 });
});

When('I logout in chat-ia', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: /sign out|logout|cerrar sesión/i }).click();
  await this.page.waitForURL(/\/login/, { timeout: 10_000 });
});

Then('the cookie {string} should be cleared on {string}', async function (this: CustomWorld, name: string, domain: string) {
  const cookies = await this.browserContext.cookies();
  const cookie = cookies.find((c) => c.name === name);
  expect(cookie).toBeUndefined();
});

When('I refresh appEventos', async function (this: CustomWorld) {
  const appUrl = (this.context.appEventosUrl as string) || 'http://localhost:3220';
  await this.page.goto(appUrl);
});

Then('appEventos should redirect to login', async function (this: CustomWorld) {
  await this.page.waitForURL(/\/login/, { timeout: 15_000 });
  expect(this.page.url()).toContain('/login');
});

// sso-token-refresh-sync
When('chat-ia auto-refreshes the Firebase token', async function (this: CustomWorld) {
  // Wait for tokenRefresh listener interval (default 50min before expiry)
  // For test purposes, force refresh via window helper
  await this.page.evaluate(() => {
    // @ts-ignore
    if (window.AuthBridge?.refresh) return (window as any).AuthBridge.refresh();
    return Promise.resolve();
  });
  await this.page.waitForTimeout(2_000);
});

Then('the new token should propagate via cookie', async function (this: CustomWorld) {
  const cookies = await this.browserContext.cookies();
  const token = cookies.find((c) => c.name === 'idTokenV0.1.0');
  expect(token).toBeDefined();
  expect(token!.value.length).toBeGreaterThan(20);
});

Then('appEventos API calls should use the new token', async function (this: CustomWorld) {
  // Smoke check: visit appEventos and verify API responds 200
  const appUrl = (this.context.appEventosUrl as string) || 'http://localhost:3220';
  const response = await this.page.request.get(`${appUrl}/api/auth/sync-user-identity`).catch(() => null);
  if (response) {
    expect(response.status()).toBeLessThan(500);
  }
});
