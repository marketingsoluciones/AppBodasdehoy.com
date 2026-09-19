# Flujo de autenticación AppBodasdehoy — mapa mental

Doc breve de "cómo funciona el auth end-to-end" y qué hacer cuando algo se rompe.
Última actualización: 2026-07-04 tras cerrar el trío de bugs `Evento.color` /
`imgInvitacion` / `imgEvento` + el timeout Mongo `save-user` (1-jul).

---

## Piezas del sistema

- **Firebase Auth** — proveedor de identidad. Emite `idToken` RS256 con 1h TTL.
  Configuración de developments en `apps/appEventos/firebase.tsx`.
- **api-mcp GraphQL** — `https://api-mcp.eventosorganizador.com/graphql`.
  Emite `sessionBodas` (JWT HS256) via mutation `auth(idToken)`. Guarda usuarios,
  eventos, invitados, etc. Autoritative source.
- **api-ia** — `https://api-ia.bodasdehoy.com/api/auth/firebase-login`. Autoriza
  al cliente chat-ia. Emite `mcp_jwt` para las llamadas de IA. NO emite
  `sessionBodas` — para eso llamamos aparte a `api-mcp`.
- **AppEventos** (`app-dev.bodasdehoy.com`) — Pages Router. Login directo con
  Firebase → llama api-mcp `auth(idToken)` → cookies.
- **Chat-ia** (`chat-dev.bodasdehoy.com`) — App Router. Login directo con
  Firebase → llama api-ia `firebase-login` → cookies + llama api-mcp
  `auth(idToken)` para tener `sessionBodas` cross-app.

## Cookies (todas cross-subdomain `.bodasdehoy.com`)

| Cookie | Emisor | Tipo | Uso |
|---|---|---|---|
| `idTokenV0.1.0` | AppEventos + chat-ia (via `setCrossAppIdToken`) | Firebase JWT RS256 (1h) | SSO cross-app. Fuente de verdad "usuario Firebase". |
| `sessionBodas` | api-mcp mutation `auth(idToken)` | JWT HS256 custom | Sesión appEventos. Backend valida en cada mutation. |
| `mcp_jwt` | api-ia via chat-ia proxy | JWT | Chat-ia proxy la lee para Authorization header. |
| `guestbodas` | AppEventos (invitados) | Cookie custom | Modo invitado. |
| `current_development` | AppEventos + chat-ia via `setCrossAppDevelopment` | String | Tenant whitelabel activo cross-app. |

## LocalStorage (per-origin, NO cross-subdomain)

| Key | Contenido |
|---|---|
| `dev-user-config` | JSON con `{ developer, development, token, userId, email, user_type }`. Formato que espera chat-ia (`useAuthCheck`). |
| `jwt_token` / `mcp_jwt_token` | Duplicado del JWT api-ia. |
| `user_email` / `user_uid` / `user_display_name` / `user_photo_url` | Info Firebase display-only. |
| `sessionBodas_fallback` | Fallback cuando cookie fue rechazada por el browser (BUG-11 QA 21-jun). |

---

## Flujo A — Login directo en app-dev

```
Usuario → app-dev/login
  └─ Firebase Auth (email/password o provider)
      └─ idToken emitido
  └─ Authentication.tsx#getSessionCookie(idToken)
      └─ Cookies.set('idTokenV0.1.0', idToken, Domain=.bodasdehoy.com)
      └─ mutation Auth(idToken) en api-mcp GraphQL vía `/api/proxy-bodas/graphql`
          └─ Backend valida idToken con Firebase Admin SDK
          └─ Emite sessionCookie (JWT HS256)
      └─ Cookies.set('sessionBodas', sessionCookie, Domain=.bodasdehoy.com)
  └─ setUser + redirect a home autenticada
```

## Flujo B — Login directo en chat-dev

```
Usuario → chat-dev/login
  └─ Firebase Auth (email/password o provider)
      └─ idToken emitido
  └─ services/firebase-auth/index.ts#loginWithFirebaseIdToken
      └─ setCrossAppIdToken(idToken) → cookie idTokenV0.1.0
      └─ POST api-ia /api/auth/firebase-login → devuelve mcp_jwt + user_id
      └─ localStorage: dev-user-config, jwt_token, mcp_jwt_token, current_development
      └─ document.cookie: mcp_jwt (Domain=chat-dev only)
      └─ callMcpAuthMutation(idToken, development) — helper compartido
          └─ mutation Auth(idToken) en api-mcp
          └─ Emite sessionCookie
      └─ writeSessionBodasCookie(sessionCookie) → cookie sessionBodas Domain=.bodasdehoy.com
```

## Flujo C — SSO chat-dev → app-dev (o app-dev → chat-dev)

Cookies con `Domain=.bodasdehoy.com` viajan automáticamente entre subdominios.
El usuario abre la otra app en pestaña nueva y **entra sin login**:

- Si viene con `idTokenV0.1.0` + `sessionBodas` → el middleware o el
  AuthContext detecta usuario existente y salta la pantalla `/login`.
- Si viene solo con `idTokenV0.1.0` (chat entró antes de que se emitiera
  sessionBodas) → `middleware.ts` chat-ia redirige a `/api/auth/sso-auto`
  → `sso-auto/route.ts` llama `callMcpAuthMutation` para obtener sessionBodas
  → HTML que setea la cookie y redirige.

## Flujo D — Bypass QA (DEV/TEST only)

`POST /api/dev/refresh-session` con `{ email, force: true }` emite:

- `sessionBodas` = pseudo-JWT `header.payload.signature` con `alg:none`. 3 partes
  (validable por `parseSessionJwt` en el front). Marcado con `dev:true + force:true`.
- Whitelist hosts: `localhost`, `-test`, `-dev`. Producción (`app.bodasdehoy.com`)
  bloqueada.

Uso desde consola:

```js
fetch('/api/dev/refresh-session', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ email: 'jcc@bodasdehoy.com', force: true }),
  credentials: 'include',
}).then(r=>r.json()).then(d=>{ console.log(d); if(d.success) location.reload(); });
```

---

## Estados degradados

- **CASO D — Firebase OK sin sessionBodas.** Firebase valida al usuario pero
  api-mcp NO devuelve sessionCookie (ej. errors[] en la respuesta). Antes
  aparecía como "silent" y llevaba al reporte "no tiene eventos". Ahora
  `AuthContext.tsx#verificator` marca `window.__authDegraded = {reason, uid,
  email, at}` visible en el **DebugFooter** (chip "deg" amarillo).

- **CASO C — Wrong password / credencial inválida.** Firebase devuelve
  `auth/wrong-password` o `auth/invalid-login-credentials`. `Login`
  wrapper (`components/Forms/Login/Forms.tsx`) traduce → banner rojo
  inline (`data-testid="login-inline-error"` con `role="alert"`).

---

## Diagnóstico rápido — DebugFooter (`app-dev` + `chat-dev`)

Pastilla flotante bottom-right en hosts `-dev` / `-test` / `localhost`.
Producción real (`app.bodasdehoy.com`, `chat.bodasdehoy.com`) → oculta.

Muestra:
- Commit SHA (inyectado via `git rev-parse --short HEAD` en `next.config`)
- BUILD_ID
- Hostname / tenant
- Flags cookies (`sB` sessionBodas, `iT` idTokenV0.1.0, `mcp` mcp_jwt en chat-ia)
- Flags localStorage (`dev-user-config`, `mcp_jwt_token`, `user_uid`)
- Chip `deg` amarillo si `window.__authDegraded` seteado
- Chip `err` rojo con último GraphQL error + trace_id **copiable con click**
  (`data-testid="debug-footer-traceid"`)

---

## Retry Mongo timeout (defensa cinturón-tirantes, inerte hoy)

`utils/Fetching.ts` reintenta `mutation Auth` con backoff exponencial
(1s / 2s / 4s) cuando el error match `/timeout.*mongo|mongo save user/i`.
Fue crítico R5 (30-jun). Backend cerró la causa raíz el 1-jul (fix audit
skipAudit en user.save). Retry queda por si vuelve un transitorio distinto.

## Helper unificado — `services/mcpAuth.ts` (chat-ia)

Antes duplicado entre `services/firebase-auth/index.ts` y
`app/(backend)/api/auth/sso-auto/route.ts`. Ahora ambos usan:

```ts
const result = await callMcpAuthMutation(firebaseIdToken, development, {
  timeoutMs: 6000, // opcional
});
// result: { sessionCookie: string | null, errorMessage?, traceId? }
```

Cliente (browser) usa además `writeSessionBodasCookie(sessionCookie)` para
setear la cookie cross-domain.

---

## Cuándo algo se rompe — checklist

1. **Verifica BUILD_ID** en DebugFooter contra el commit desplegado esperado.
   Cache CF / browser → hard-refresh Cmd+Shift+R o incógnito.
2. **Verifica cookies** en Application → Cookies para `.bodasdehoy.com`.
   Falta alguna → identifica cuál pieza no la emitió (ver flujos arriba).
3. **Verifica Console** con filtro `[Auth]`, `[fetchApiBodas]`, `[Verificator]`.
4. **Copia trace_id** del DebugFooter si aparece `err` — escala a backend con eso.
5. **E2E propio** (`e2e-app/smoke-qa-r6-gaps.spec.ts`) corre 9+ tests en <60s.
   Si el smoke pasa pero QA humano falla, el issue es específico del navegador
   del usuario (extensiones, cookies previas, etc.).

## Files de referencia

- `apps/appEventos/utils/Authentication.tsx` — flujo login directo appEventos
- `apps/appEventos/context/AuthContext.tsx` — AuthContext + verificator
- `apps/appEventos/utils/Fetching.ts` — `fetchApiBodas` + retry Mongo + `lastFetchApiBodasError`
- `apps/appEventos/pages/api/dev/refresh-session.ts` — bypass QA
- `apps/appEventos/pages/api/proxy-bodas/graphql.ts` — proxy Next.js a api-mcp
- `apps/chat-ia/src/services/firebase-auth/index.ts` — flujo login directo chat-ia
- `apps/chat-ia/src/services/mcpAuth.ts` — helper unificado mutation Auth
- `apps/chat-ia/src/app/(backend)/api/auth/sso-auto/route.ts` — handshake SSO
- `apps/appEventos/components/DebugFooter.tsx` / `apps/chat-ia/src/components/DebugFooter.tsx` — diagnóstico visual
- `packages/shared/src/auth/AuthBridge.ts` — puente Firebase ↔ LocalStorage ↔ cookies
- `packages/shared/src/auth/SessionBridge.ts` — helpers cookie cross-app
