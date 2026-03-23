# Análisis: Internal Server Error (500)

## Qué es

**"Internal Server Error"** es el mensaje estándar que devuelve el servidor cuando ocurre un **HTTP 500**: un error no recuperable en el servidor (excepción no capturada, fallo de backend, etc.). El usuario puede verlo:

- Como **texto en la página** (p. ej. página de error de Next.js o body de la respuesta).
- En el **iframe del Copilot** (si la URL que carga el iframe devuelve 500).
- En **DevTools → Network** como status 500 en alguna petición.

---

## Dónde se genera en el código

### 1. Chat-ia (chat-test)

| Origen | Archivo | Cuándo devuelve 500 / "Internal Server Error" |
|--------|---------|-----------------------------------------------|
| **Webapi chat** | `apps/chat-ia/src/app/(backend)/webapi/chat/[provider]/route.ts` | `catch (e)` del handler: si el error tiene `errorType === InternalServerError` → `createErrorResponse(500, body)`. El **catch final** (líneas 560–573) devuelve **502** con mensaje "Error interno del servidor...", no 500. |
| **Auth middleware** | `apps/chat-ia/src/app/(backend)/middleware/auth/index.ts` | Cualquier error que no sea `ChatCompletionErrorPayload`: `createErrorResponse(ChatErrorType.InternalServerError, ...)` → **500**. También si el error tiene `errorType` y se reenvía → mismo status (500 si es InternalServerError). |
| **OIDC** | `apps/chat-ia/src/app/(backend)/oidc/[...oidc]/route.ts` | `catch`: `return new NextResponse('Internal Server Error: ' + message, { status: 500 })`. **Texto literal "Internal Server Error"** en el body. |
| **Webapi models** | `apps/chat-ia/src/app/(backend)/webapi/models/[provider]/route.ts` | En el catch se usa `errorType = ChatErrorType.InternalServerError` → `createErrorResponse` → **500**. |
| **Webapi models pull** | `apps/chat-ia/src/app/(backend)/webapi/models/[provider]/pull/route.ts` | Igual: fallo → `InternalServerError` → **500**. |
| **Text-to-image** | `apps/chat-ia/src/app/(backend)/webapi/text-to-image/[provider]/route.ts` | Catch → `InternalServerError` → **500**. |
| **API backend proxy** | `apps/chat-ia/src/app/(backend)/api/backend/[...path]/route.ts` | En error se puede devolver `status: 500`. |
| **API messages** | `apps/chat-ia/src/app/(backend)/api/messages/[...path]/route.ts` | En error se puede devolver 500. |
| **Desktop** | `apps/chat-ia/apps/desktop/.../StaticFileServerManager.ts` | `res.writeHead(500); res.end('Internal Server Error')`. |
| **Desktop proxy** | `apps/chat-ia/apps/desktop/.../RemoteServerSyncCtr.ts` | `statusText: 'Internal Server Error during proxy'`, status 500. |

**Tipo y status:** En `@lobechat/types` / `packages/types`: `ChatErrorType.InternalServerError = 500`. `createErrorResponse(errorType, body)` devuelve `Response` con `status: getStatus(errorType)`; para 500 el status es **500**.

### 2. App-eventos (app-test)

| Origen | Archivo | Cuándo |
|--------|---------|--------|
| **API seating pública** | `apps/appEventos/pages/api/public/seating/[eventId].ts` | `catch`: `res.status(500).json({ error: 'Internal Server Error' })`. |
| **API iCal** | `apps/appEventos/pages/api/ical/[eventId]/[itinerarioId].ts` | `catch`: `res.status(500).end('Internal Server Error')`. |
| **Proxy GraphQL** | `apps/appEventos/pages/api/proxy/graphql.ts` | Error de proxy → puede devolver 500 con mensaje de error. |
| **Proxy Bodas** | `apps/appEventos/pages/api/proxy-bodas/[...path].ts` | Si el backend responde 500 o hay error, se puede propagar. |

### 3. Next.js (ambas apps)

- Si un **route handler** o **Server Component** lanza una excepción **sin catch**, Next.js puede responder con su página de error por defecto, que suele incluir **"Internal Server Error"** (o similar).
- No hay en el repo una página custom `500.tsx` ni `global-error.tsx`; se usa el comportamiento por defecto del framework.

---

## Flujo típico: Copilot (app-test → iframe chat-test)

1. Usuario abre app-test y el Copilot (sidebar).
2. app-test carga un **iframe** con `src` = URL de chat-test (p. ej. `https://chat-test.bodasdehoy.com/.../chat?embed=1&...`).
3. El navegador pide a **chat-test** esa página.
4. Si **chat-test** responde **500** en esa ruta (o en recursos críticos de esa página), el iframe puede mostrar la página de error con el texto **"Internal Server Error"**.
5. Si chat-test responde **200**, el iframe muestra la UI del chat.

Conclusión: **"Internal Server Error" dentro del iframe del Copilot = fallo en chat-test** (ruta que sirve el iframe o APIs que esa página usa), no en app-test.

---

## Cómo depurar

### Paso 1: Dónde aparece

- **Solo dentro del iframe del Copilot** → El fallo es de **chat-test** (ruta del iframe o API llamada desde esa página).
- **Página completa de app-test** (sin iframe) → Fallo en **app-test** (p. ej. API route que devuelve 500).
- **Página completa de chat-test** → Fallo en **chat-test** (ruta actual o API).

### Paso 2: Qué petición devuelve 500

- Abrir **DevTools → Network**.
- Recargar o repetir la acción que provoca el error.
- Filtrar por status **500** o por **Failed**.
- Anotar **URL** y **método** (GET/POST, etc.) de la petición en rojo.

### Paso 3: Logs del servidor

- **Chat-test:** En la consola del proceso Next.js (o logs de despliegue) buscar el **stack trace** o el mensaje logueado en el handler que devuelve 500. En `webapi/chat/[provider]/route.ts` el catch hace `console.error`; el middleware de auth y OIDC también loguean.
- **App-test:** Igual en el proceso Next.js de appEventos; en APIs como `seating` e `ical` hay `console.error` en el catch.

### Paso 4: Causas frecuentes

- **Chat-test – webapi/chat:** Proxy a api-ia caído o timeout; variable de entorno (`PYTHON_BACKEND_URL`, etc.) mal configurada; error no capturado en `modelRuntime.chat()`.
- **Chat-test – auth:** JWT inválido o expirado; error en `checkAuth` o en la lógica de sesión.
- **Chat-test – OIDC:** Error en el flujo OIDC (provider, redirect, etc.).
- **App-test – proxy GraphQL/Bodas:** Backend (api2, api.bodasdehoy.com, etc.) devuelve 500 o no responde; timeout de proxy.
- **App-test – seating/ical:** Error al leer BD o al generar datos (excepción en el try que cae al catch y devuelve 500).

---

## Comandos útiles

```bash
# Health de chat-test
curl -s -o /dev/null -w "%{http_code}" https://chat-test.bodasdehoy.com/api/health

# Health de app-test
curl -s -o /dev/null -w "%{http_code}" https://app-test.bodasdehoy.com/api/health

# Cabeceras de la ruta que carga el iframe del Copilot
curl -sI "https://chat-test.bodasdehoy.com/bodasdehoy/chat"

# Respuesta cruda de una API que sospeches (sustituir URL)
curl -s -w "\n%{http_code}" "https://chat-test.bodasdehoy.com/api/..."
```

---

## Tests E2E que comprueban ausencia de Internal Server Error

- `e2e-app/copilot-chat.spec.ts`: iframe del Copilot no debe contener "Internal Server Error".
- `e2e-app/acciones-crud.spec.ts`: la página no debe contener "Internal Server Error".
- `e2e-app/billing-saldo.spec.ts`, `e2e-app/bandeja-mensajes.spec.ts`, `e2e-app/multi-developer.spec.ts`, `e2e-app/perfiles-visitante.spec.ts`, `e2e-app/billing.spec.ts`: comprobaciones similares.

---

## Resumen

| Dónde ves "Internal Server Error" | Origen más probable | Acción |
|-----------------------------------|---------------------|--------|
| **Dentro del iframe del Copilot** | **chat-test** (ruta del iframe o API usada por esa página) | Revisar logs de chat-test; health; proxy a api-ia y variables de entorno. |
| **Página completa app-test** | **app-test** (API route en 500) | Network → request en 500; logs de app-test; backend upstream (proxy GraphQL/Bodas, etc.). |
| **Página completa chat-test** | **chat-test** (ruta o API) | Network → request en 500; logs de chat-test; auth, OIDC, webapi. |

Referencia previa: `docs/REVISION-INTERNAL-SERVER-ERROR-CHAT-APP-TEST.md`.
