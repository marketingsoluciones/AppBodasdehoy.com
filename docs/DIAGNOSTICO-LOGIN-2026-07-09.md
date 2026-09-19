# Diagnóstico de LOGIN — appEventos / chat-ia (dev)

- **Fecha:** 2026-07-09
- **Entorno:** `dev` — https://app-dev.bodasdehoy.com · https://chat-dev.bodasdehoy.com
- **Build:** `BUILD_ID tFeavJjMr2isKZS57CB5r` · `dev @ 05da414f`
- **Navegador:** WebKit (Safari) — Chromium vetado
- **Spec:** `e2e-app/auth-diagnostic.spec.ts` (bloques 1/2/3/5)
- **Autor:** COORD-FRONT AppEventos

---

## VEREDICTO

> **El login NO está roto.** Los 3 sistemas reales de conexión funcionan (login en
> chat-dev, propagación SSO cross-domain, y login por formulario en app-dev — este
> último deja la cookie de sesión y muestra "Logged in successfully").
>
> El "login falla" que veníamos viendo en E2E era **señal falsa**, por DOS causas de
> test (no de producto):
> 1. **Bug del framework de test** — `page.waitForURL(url => url.includes('/login'))`.
>    En la versión actual de Playwright el predicado recibe un **objeto `URL`**, no un
>    string; `URL` no tiene `.includes()` → `TypeError: url.includes is not a function`
>    → el test revienta ANTES de comprobar nada. Afectaba a 18 líneas del spec.
>    **CORREGIDO** (`url.includes(` → `url.href.includes(`).
> 2. **Asunciones viejas del test** en 2 casos (detalle abajo).

---

## MÉTODO — sistemas/caminos de conexión probados

| # | Camino de conexión | Qué valida |
|---|---|---|
| 1.1 | app-dev `/login` directo (sin sesión) | ¿redirige a chat-dev para SSO? |
| 2.1 | app-dev `/login?local-login=1` | ¿muestra formulario local sin redirigir? |
| 2.2 | app-dev formulario email+password | ¿deja sesión (cookie) tras enviar? |
| 3.2 | chat-dev login → app-dev (cross-domain) | ¿`idTokenV0.1.0` se propaga a `.bodasdehoy.com` y app-dev reconoce la sesión? |
| 5.1 | chat-dev `/login` email+password | ¿llega al chat autenticado? |

---

## RESULTADOS (tras corregir el bug del framework)

| # | Resultado | Interpretación |
|---|-----------|----------------|
| **5.1 chat-dev login** | ✅ PASA | Login en chat-dev funciona, llega al chat. |
| **3.2 SSO cross-domain** | ✅ PASA | `idTokenV0.1.0` se propaga a `.bodasdehoy.com`; app-dev reconoce la sesión sin re-login. **El SSO funciona de punta a punta.** |
| **2.1 local-login=1** | ✅ PASA | Muestra el formulario local sin redirigir a chat-dev. |
| **2.2 formulario app-dev** | ⚠️ "falla" en el test, pero **login OK** | La cookie de sesión (`sessionBodas`/`idTokenV0.1.0`) **SÍ se pone** (pasó el check de cookie). Falla solo porque el test comprueba `dev-user-config` en localStorage — y esa clave la escribe el **Copilot** (`CopilotIframe.tsx:405`), **no** el login. Evidencia: el screenshot muestra toast **"Logged in successfully"** + "Cargando tus eventos…" + cookie `sB` en el debug footer. → **asunción vieja del test**. |
| **1.1 redirect SSO en /login directo** | ⚠️ "falla" en el test, pero **comportamiento correcto** | Visitar `/login` **directo** (sin `?d=` ni `session_expired`) **debe** mostrar el formulario, NO redirigir. Es **intencional** (anti-loop) — ver `pages/login.tsx:122-125`: `hasLoginIntent = !!queryD || sessionExpired; if (!hasLoginIntent) return`. El test esperaba el redirect + `sso_redirect_pending='1'`. → **asunción vieja del test**. |

**Marcador:** 3 de 5 verdes; los 2 "rojos" son tests desactualizados, no bugs de producto.

---

## EVIDENCIA CLAVE

Screenshot del caso 2.2 (post-login por formulario en app-dev):
- Toast verde **"Logged in successfully"**.
- Pantalla **"Cargando tus eventos…"** (sesión activa, cargando datos del usuario).
- Debug footer: commit `05da414` + indicador de cookie **`sB`** (sessionBodas presente).

→ El login por formulario en app-dev **establece sesión correctamente**.

---

## CAUSA RAÍZ del falso "login falla" en E2E

1. **`auth-diagnostic.spec.ts`** usaba `url.includes()` sobre el objeto `URL` que Playwright
   pasa al predicado de `waitForURL` → `TypeError` → todos los tests que dependían de
   esperar la redirección post-login petaban antes de cualquier assertion. **18 ocurrencias, corregidas.**
2. Dos assertions desactualizadas respecto al comportamiento actual del producto (1.1 y 2.2).

> ⚠️ El helper de la suite grande (`e2e-app/helpers.ts` → `loginAndSelectEvent`) **NO tiene
> este bug** (usa `u.pathname.includes`, correcto). Si `ui-smoke-dev` / `ui-invitados`
> siguen mostrando vista de invitado, es un problema **de timing/selector en el helper**, NO
> de autenticación — se investiga aparte.

---

## RECOMENDACIONES (para el equipo)

1. **1.1** — Actualizar la expectativa: `/login` directo muestra formulario; el redirect SSO
   solo debe esperarse cuando hay intención de login (`?d=<ruta>` o `session_expired=1`).
2. **2.2** — Comprobar los marcadores reales de sesión (cookie `sessionBodas`/`idTokenV0.1.0`,
   que ya pasan), no `dev-user-config` (que es del Copilot).
3. Re-ejecutar `auth-diagnostic.spec.ts` completo (bloques 4/6/7/8: logout, persistencia,
   panel copilot, traza de cookies) ahora que el bug de framework está corregido.
4. Revisar el helper `loginAndSelectEvent` para el síntoma de vista-invitado en `ui-smoke`
   (timing/selector, no auth).

---

## CÓMO REPRODUCIR

```bash
E2E_ENV=dev PLAYWRIGHT_BROWSER=webkit npx playwright test e2e-app/auth-diagnostic.spec.ts \
  -g "(1\.1|2\.1|2\.2|3\.2|5\.1) —" --reporter=list
```
Requiere `.env.e2e.dev` (credenciales; `TEST_PASSWORD`). NUNCA chromium.
