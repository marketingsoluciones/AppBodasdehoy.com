# Revisión: Internal Server Error en chat-test y app-test

## Dónde puede aparecer "Internal Server Error"

### 1. **Iframe del Copilot en app-test**

Cuando app-test carga el Copilot, el iframe apunta a **chat-test** (p. ej. `https://chat-test.bodasdehoy.com/...` o `localhost:3210`). Si **chat-test** devuelve **HTTP 500** al cargar esa ruta, el contenido del iframe puede mostrar literalmente **"Internal Server Error"** (o la página de error de Next.js).

- **E2E:** `e2e-app/copilot-chat.spec.ts` comprueba que el iframe **no** contenga "Internal Server Error" (`expect(iframeText).not.toMatch(/Internal Server Error/)`).
- **Causas típicas en chat-test:** fallo no capturado en una ruta, proxy a api-ia caído, variable de entorno faltante, error en el runtime del chat (modelRuntime.chat), timeout.

### 2. **chat-test (chat-ia) — rutas que pueden devolver 500**

| Origen | Archivo / ruta | Cuándo |
|--------|----------------|--------|
| **Webapi chat** | `apps/chat-ia/src/app/(backend)/webapi/chat/[provider]/route.ts` | Error no manejado en el handler (catch final) → Response 502 con `message`; errores del runtime → `createErrorResponse(InternalServerError, ...)` → 500. |
| **Auth middleware** | `apps/chat-ia/src/app/(backend)/middleware/auth/index.ts` | `createErrorResponse(ChatErrorType.InternalServerError, ...)` en fallos de auth. |
| **OIDC** | `apps/chat-ia/src/app/(backend)/oidc/[...oidc]/route.ts` | `return new NextResponse('Internal Server Error: ' + message, { status: 500 })`. |
| **API backend proxy** | `apps/chat-ia/src/app/(backend)/api/backend/[...path]/route.ts` | `{ status: 500 }` en error. |
| **API messages** | `apps/chat-ia/src/app/(backend)/api/messages/[...path]/route.ts` | `{ status: 500 }` en error. |
| **Static file server (desktop)** | `apps/chat-ia/apps/desktop/.../StaticFileServerManager.ts` | `res.writeHead(500); res.end('Internal Server Error')`. |

En **producción**, Next.js puede mostrar su página genérica de error (500) si un Server Component o route handler lanza sin catch.

### 3. **app-test (appEventos) — rutas que pueden devolver 500**

| Origen | Archivo / ruta | Cuándo |
|--------|----------------|--------|
| **Proxy GraphQL** | `apps/appEventos/pages/api/proxy/graphql.ts` | Error de red o timeout del proxy → `res.status(500).json({ error: 'Proxy error', message })`. |
| **Proxy Bodas** | `apps/appEventos/pages/api/proxy-bodas/[...path].ts` | Si el backend responde 500 o hay error de proxy, se puede propagar. |
| **API pública seating** | `apps/appEventos/pages/api/public/seating/[eventId].ts` | `return res.status(500).json({ error: 'Internal Server Error' })`. |
| **API iCal** | `apps/appEventos/pages/api/ical/[eventId]/[itinerarioId].ts` | `return res.status(500).end('Internal Server Error')`. |

Si el **front** de app-test hace una petición a una de estas APIs y recibe 500, puede mostrar un mensaje de error en pantalla (según el componente que consuma la API).

---

## Flujo Copilot (app-test → iframe chat-test)

1. Usuario abre app-test y el sidebar del Copilot.
2. app-test carga un **iframe** con `src` = URL de chat-test (p. ej. `https://chat-test.bodasdehoy.com/bodasdehoy/chat?embed=1&...`).
3. **Navegador** pide a **chat-test** esa página.
4. Si chat-test responde **500**, el iframe muestra la página de error (a menudo con el texto "Internal Server Error").
5. Si chat-test responde **200**, el iframe muestra la UI del chat.

Por tanto: **"Internal Server Error" dentro del iframe del Copilot = fallo en chat-test** (o en la ruta que está cargando el iframe), no en app-test.

---

## Qué revisar cuando veas Internal Server Error

### Si aparece **dentro del iframe del Copilot** (chat-test)

1. **Comprobar que chat-test esté levantado y responda:**  
   Abrir en otra pestaña la URL del iframe (p. ej. `https://chat-test.bodasdehoy.com/bodasdehoy/chat`) y ver si carga o devuelve 500.
2. **Logs del servidor chat-test:**  
   Buscar en consola del proceso Next.js (o logs de despliegue) el stack trace del error (el handler de `/webapi/chat` y el catch final loguean con `console.error`).
3. **Variables de entorno:**  
   `PYTHON_BACKEND_URL`, `USE_PYTHON_BACKEND`, etc. Si el proxy a api-ia falla o hay config incorrecta, puede acabar en 500.
4. **Health de api-ia:**  
   Si chat-test hace proxy a api-ia y api-ia está caído o devuelve error, el route puede convertir eso en 500/502.

### Si aparece **en una página de app-test** (fuera del iframe)

1. **Red:**  
   Pestaña DevTools → Network; ver qué petición devuelve 500 (por ejemplo `/api/proxy/graphql`, `/api/proxy-bodas/...`, etc.).
2. **Logs del servidor app-test:**  
   En el proceso Next.js de appEventos, buscar el error asociado a esa ruta.
3. **Backend upstream:**  
   Si app-test hace proxy (GraphQL, Bodas, etc.), comprobar que el backend de destino esté vivo y no devuelva 500.

### Comandos útiles

```bash
# Health de chat-test (si tiene ruta /api/health)
curl -s -o /dev/null -w "%{http_code}" https://chat-test.bodasdehoy.com/api/health

# Health de app-test
curl -s -o /dev/null -w "%{http_code}" https://app-test.bodasdehoy.com/api/health

# Ver respuesta completa de la raíz de chat-test (donde carga el iframe)
curl -sI https://chat-test.bodasdehoy.com/bodasdehoy/chat
```

---

## Resumen

| Dónde ves el error | Origen más probable | Acción |
|--------------------|---------------------|--------|
| **Dentro del iframe del Copilot** | **chat-test** (ruta que sirve el iframe o su API) | Revisar logs y health de chat-test; proxy a api-ia y env. |
| **Página completa de app-test** | **app-test** (API route que devolvió 500) | Network → ver request en 500; logs de app-test y backend proxy. |

Referencias en código: `e2e-app/copilot-chat.spec.ts` (test iframe sin Internal Server Error), `apps/chat-ia/src/app/(backend)/webapi/chat/[provider]/route.ts` (handler y catch), `apps/appEventos/pages/api/proxy/graphql.ts` (500 en proxy).
