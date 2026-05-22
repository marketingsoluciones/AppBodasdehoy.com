// SPRINT-I 2026-05-21 (adaptado): verifica estado auth post-login.
// Cross-app SSO smoke (chat-ia → appEventos) requiere appEventos :3220 estable;
// por ahora valida la mitad chat-ia: cookies + localStorage + user email correcto.
//
// Pre-requisito: save-storage-states.ts ejecutado.
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx tsx smoke-auth-state.ts

import { webkit } from 'playwright';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3210';
const STORAGE_DIR = resolve(__dirname, '.auth');

const USERS = [
  { tag: 'super-admin', expectedEmail: 'bodasdehoy.com@gmail.com' },
  { tag: 'collaborator', expectedEmail: 'jcc@marketingsoluciones.com' },
  { tag: 'invited', expectedEmail: 'jcc@bodasdehoy.com' },
];

interface Check { user: string; field: string; status: 'OK' | 'FAIL'; detail?: string }

async function checkAuthState(u: typeof USERS[0]): Promise<Check[]> {
  const checks: Check[] = [];
  const statePath = resolve(STORAGE_DIR, `${u.tag}.json`);
  if (!existsSync(statePath)) {
    checks.push({ user: u.tag, field: 'storage-state-file', status: 'FAIL', detail: 'missing' });
    return checks;
  }

  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 },
    storageState: statePath,
  });
  const page = await ctx.newPage();

  try {
    // Leer estado GUARDADO (no live post-goto) — refleja lo que reuso entre tests
    const state = JSON.parse(readFileSync(statePath, 'utf-8'));

    // Cookies
    const idTokenCookie = state.cookies.find((c) => c.name.startsWith('idTokenV') || c.name === 'idToken');
    checks.push({
      user: u.tag,
      field: 'idToken cookie',
      status: idTokenCookie ? 'OK' : 'FAIL',
      detail: idTokenCookie ? `domain=${idTokenCookie.domain}` : 'missing',
    });

    // localStorage tokens
    const origin = state.origins[0];
    const mcpJwt = origin?.localStorage.find((kv) => kv.name === 'mcp_jwt_token');
    const fbAuth = origin?.localStorage.find((kv) => kv.name.includes('firebase:authUser'));
    checks.push({
      user: u.tag,
      field: 'mcp_jwt_token',
      status: mcpJwt && mcpJwt.value.length > 50 ? 'OK' : 'FAIL',
      detail: mcpJwt ? `len=${mcpJwt.value.length}` : 'missing',
    });
    checks.push({
      user: u.tag,
      field: 'firebase:authUser',
      status: fbAuth ? 'OK' : 'FAIL',
      detail: fbAuth ? `len=${fbAuth.value.length}` : 'missing',
    });

    // Parse firebase auth user → verify email
    if (fbAuth) {
      try {
        const fbUser = JSON.parse(fbAuth.value);
        const email = fbUser.email || fbUser.providerData?.[0]?.email;
        checks.push({
          user: u.tag,
          field: 'email matches',
          status: email === u.expectedEmail ? 'OK' : 'FAIL',
          detail: email,
        });
      } catch {
        checks.push({ user: u.tag, field: 'email matches', status: 'FAIL', detail: 'parse error' });
      }
    }

    // Verify user-avatar testid visible (proves UI hydrated con user)
    await page.goto('/chat', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(2000);
    const avatarCount = await page.locator('[data-testid="user-avatar"]').count();
    checks.push({
      user: u.tag,
      field: 'user-avatar visible',
      status: avatarCount > 0 ? 'OK' : 'FAIL',
      detail: `count=${avatarCount}`,
    });
  } finally {
    await browser.close();
  }
  return checks;
}

async function main() {
  console.log(`SMOKE AUTH STATE → ${BASE_URL}`);
  const all: Check[] = [];
  for (const u of USERS) {
    const r = await checkAuthState(u);
    all.push(...r);
  }
  console.table(all);
  const fails = all.filter((c) => c.status === 'FAIL').length;
  console.log(`Total: ${all.length} · ${all.length - fails} OK · ${fails} FAIL`);
  process.exitCode = fails > 0 ? 1 : 0;
}

main();
