import { NextRequest, NextResponse } from 'next/server';

import { resolveServerBackendOrigin } from '@/const/backendEndpoints';

export const runtime = 'nodejs';

const BACKEND_URL = resolveServerBackendOrigin();

// Dominios permitidos para redirect (misma lista que login/page.tsx)
const ALLOWED_REDIRECT_HOSTS = [
  'app.bodasdehoy.com', 'chat.bodasdehoy.com', 'memories.bodasdehoy.com',
  'editor.bodasdehoy.com', 'app-test.bodasdehoy.com', 'chat-test.bodasdehoy.com',
  'memories-test.bodasdehoy.com', 'app-dev.bodasdehoy.com', 'chat-dev.bodasdehoy.com',
  'memories-dev.bodasdehoy.com', 'localhost',
];

function isSafeRedirect(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return ALLOWED_REDIRECT_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
  } catch {
    return urlStr.startsWith('/');
  }
}

/**
 * GET /api/auth/sso-auto
 *
 * Server-side SSO handler: lee idTokenV0.1.0 de las cookies de la request,
 * llama a firebase-login, y retorna HTML que setea localStorage + redirige a /chat.
 *
 * Esto evita completamente los problemas de React/Suspense/hydration del useEffect client-side.
 */
export async function GET(request: NextRequest) {
  const ssoToken = request.cookies.get('idTokenV0.1.0')?.value;

  // Sin cookie SSO → redirigir al login normal para mostrar formulario
  if (!ssoToken) {
    return NextResponse.redirect(new URL('/login', request.url), 307);
  }

  const urlParams = new URL(request.url).searchParams;
  const development = urlParams.get('developer') || 'bodasdehoy';
  const redirectAfterLogin = urlParams.get('redirect');
  const safeRedirect = redirectAfterLogin && isSafeRedirect(redirectAfterLogin) ? redirectAfterLogin : '/chat';

  // BUG-CW-N14 (informe QA 23-jun 5ª ronda): /messages directo se quedaba
  // colgado >20s sin timeout. El fetch a firebase-login no tenía AbortController
  // → si el backend cuelga, el spinner dura indefinidamente. Fix: 5s timeout
  // + fallback explícito a /login con mensaje al usuario.
  const TIMEOUT_MS = 5000;
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/firebase-login`, {
      body: JSON.stringify({
        development,
        device: request.headers.get('user-agent') || 'sso-auto',
        fingerprint: 'sso-auto-server',
        firebaseIdToken: ssoToken,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: abortController.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => null);
    console.log(`[sso-auto] status=${response.status} | success=${data?.success} | user_id=${data?.user_id || 'NULL'}`);

    if (!data?.success) {
      // Token inválido/expirado → redirigir al login + limpiar cookie para evitar bucle infinito
      const resp = NextResponse.redirect(new URL('/login', request.url), 307);
      resp.cookies.set('idTokenV0.1.0', '', {
        domain: '.bodasdehoy.com',
        expires: new Date(0),
        path: '/',
        sameSite: 'lax',
      });
      return resp;
    }

    const userId = data.user_id || data.email || '';
    const token = data.token || data.jwt_token || '';
    const email = data.email || '';

    const config = {
      developer: development,
      development,
      email,
      timestamp: Date.now(),
      token,
      userId,
      user_id: userId,
      user_type: 'registered',
    };
    const configJson = JSON.stringify(config);

    // Retornar HTML con script que setea localStorage y redirige a /chat
    // Esto ejecuta inmediatamente sin necesidad de React/hydration
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Iniciando sesión...</title></head>
<body>
<script>
try {
  var cfg = ${configJson};
  localStorage.setItem('dev-user-config', JSON.stringify(cfg));
  localStorage.setItem('jwt_token', ${JSON.stringify(token)});
  localStorage.setItem('mcp_jwt_token', ${JSON.stringify(token)});
  document.cookie = 'dev-user-config=' + encodeURIComponent(JSON.stringify(cfg)) + '; path=/; max-age=' + (30 * 24 * 60 * 60) + '; SameSite=Lax';
} catch(e) {}
window.location.replace(${JSON.stringify(safeRedirect)});
</script>
<p>Iniciando sesión...</p>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 200,
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    const isTimeout = error?.name === 'AbortError';
    console.error('[sso-auto] Error:', isTimeout ? `TIMEOUT después de ${TIMEOUT_MS}ms` : error.message);
    // Timeout o error de red → redirigir al login con flag para mostrar mensaje
    const loginUrl = new URL('/login', request.url);
    if (isTimeout) loginUrl.searchParams.set('sso_timeout', '1');
    return NextResponse.redirect(loginUrl, 307);
  }
}
