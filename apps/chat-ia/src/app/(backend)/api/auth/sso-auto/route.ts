import { NextRequest, NextResponse } from 'next/server';

import { resolveServerBackendOrigin } from '@/const/backendEndpoints';
import { resolveServerMcpGraphqlUrl } from '@/const/mcpEndpoints';

export const runtime = 'nodejs';

const BACKEND_URL = resolveServerBackendOrigin();
const MCP_GRAPHQL_URL = resolveServerMcpGraphqlUrl();

/**
 * BUG QA #2 (30-jun): `next start -H 0.0.0.0` hace que `request.url` sea
 * `https://0.0.0.0:3210/...` cuando estamos detrás de cloudflared tunnel.
 * `new URL('/login', request.url)` propaga ese host inválido al header
 * `Location` → el navegador lo recibe y trata de cargar 0.0.0.0:3210.
 *
 * Reconstruimos la base usando X-Forwarded-Host (Cloudflare) / Host header,
 * que SÍ tienen el dominio real (chat-dev.bodasdehoy.com).
 */
function buildPublicUrl(request: NextRequest, pathname: string): URL {
  const xfHost = request.headers.get('x-forwarded-host');
  const host = xfHost || request.headers.get('host') || new URL(request.url).host;
  const xfProto = request.headers.get('x-forwarded-proto');
  const proto = xfProto || (host.includes('localhost') ? 'http' : 'https');
  return new URL(pathname, `${proto}://${host}`);
}

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
    return NextResponse.redirect(buildPublicUrl(request, '/login'), 307);
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
      const resp = NextResponse.redirect(buildPublicUrl(request, '/login'), 307);
      resp.cookies.set('idTokenV0.1.0', '', {
        domain: '.bodasdehoy.com',
        expires: new Date(0),
        path: '/',
        sameSite: 'lax',
      });
      return resp;
    }

    // FIX α v2 QA #34 (29-jun): el fallback `data.user_id || data.email` metía
    // email como userId cuando backend NO devolvía user_id (caso save-user-config
    // 502/503). Resultado: dev-user-config.userId=email → TRPC ctx → MessageModel
    // recibía email donde la columna user_id espera UUID → INSERT fallaba.
    //
    // Fix: si backend NO devuelve user_id, EXTRAER uid del JWT Firebase
    // (ssoToken, payload.sub o payload.user_id). NUNCA caer a email.
    let userId = data.user_id;
    if (!userId && ssoToken) {
      try {
        // JWT payload está en el 2º segmento (separado por puntos), base64url-encoded
        const payloadB64 = ssoToken.split('.')[1];
        if (payloadB64) {
          const padded = payloadB64.padEnd(payloadB64.length + (4 - payloadB64.length % 4) % 4, '=');
          const json = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
          // Firebase ID token usa `user_id` o `sub` para el uid
          userId = json.user_id || json.sub || '';
        }
      } catch (e) {
        console.warn('[sso-auto] No se pudo extraer uid del JWT firebase:', (e as Error)?.message);
      }
    }
    // Último fallback: SOLO si no hay manera de obtener uid, usar email
    // (mejor login degradado que crash total). Loguear para diagnóstico.
    if (!userId) {
      userId = data.email || '';
      if (userId) console.warn('[sso-auto] FALLBACK email como userId — INSERT messages fallará:', userId);
    }
    const token = data.token || data.jwt_token || '';
    const email = data.email || '';

    // BUG QA #4 (30-jun): chat-dev login NO generaba sessionBodas → SSO
    // chat→app no funcionaba (appEventos espera esa cookie para considerarse
    // autenticado). appEventos llama a la mutation `auth(idToken)` de api-mcp
    // y guarda el resultado como sessionBodas. Replicamos esa llamada aquí
    // para que chat-dev produzca el mismo set de cookies que app-dev.
    let sessionBodas = '';
    try {
      const mcpAuthRes = await fetch(MCP_GRAPHQL_URL, {
        body: JSON.stringify({
          query: 'mutation Auth($idToken: String!) { auth(idToken: $idToken) { sessionCookie } }',
          variables: { idToken: ssoToken },
        }),
        headers: { 'Content-Type': 'application/json', Development: development },
        method: 'POST',
        signal: AbortSignal.timeout(5000),
      });
      const mcpAuthData = await mcpAuthRes.json().catch(() => null);
      sessionBodas = mcpAuthData?.data?.auth?.sessionCookie || '';
      if (!sessionBodas) {
        const errMsg = mcpAuthData?.errors?.[0]?.message || 'sin sessionCookie';
        console.warn('[sso-auto] mutation auth NO devolvió sessionCookie:', errMsg);
      }
    } catch (e: any) {
      console.warn('[sso-auto] mutation auth(idToken) falló:', e?.message);
    }

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
    // Cookie sessionBodas cross-subdomain (.bodasdehoy.com) — 30 días.
    // Si la mutación falló, queda vacío y NO seteamos cookie inválida.
    const sessionBodasCookieScript = sessionBodas
      ? `document.cookie = 'sessionBodas=' + ${JSON.stringify(encodeURIComponent(sessionBodas))} + '; path=/; domain=.bodasdehoy.com; max-age=' + (30 * 24 * 60 * 60) + '; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');`
      : `console.warn('[sso-auto] sessionBodas vacío — SSO chat→app no disponible esta sesión');`;

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
  ${sessionBodasCookieScript}
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
    const loginUrl = buildPublicUrl(request, '/login');
    if (isTimeout) loginUrl.searchParams.set('sso_timeout', '1');
    return NextResponse.redirect(loginUrl, 307);
  }
}
