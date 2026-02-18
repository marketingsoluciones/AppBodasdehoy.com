# Error "Al conectar con el servidor de autenticación" / Failed to fetch (Copilot)

**Fecha:** 2026-02-12  
**Contexto:** Al abrir el Copilot desde app-test (o localhost:8080), el usuario ve "Error al conectar con el servidor de autenticación" y "Failed to fetch".

---

## 1. Qué ve el usuario

- Mensaje de notificación: **"Error al conectar con el servidor de autenticación"** (y descripción tipo "Por favor, intente nuevamente en unos momentos").
- En consola del navegador: **"Failed to fetch"** y errores de **CORS**:
  - `Access to fetch at 'https://api-ia.bodasdehoy.com/...' from origin 'http://localhost:3210' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`

---

## 2. Causa

El Copilot corre en **http://localhost:3210** (o en chat-test). Desde el **navegador**, el código hacía `fetch('https://api-ia.bodasdehoy.com/...')` para:

- `POST /api/auth/identify-user`
- `POST /api/auth/sync-user-identity`
- `POST /api/auth/save-user-config`
- `GET /api/config/bodasdehoy`
- `POST /graphql`

El servidor **api-ia.bodasdehoy.com** no envía cabeceras CORS que permitan el origen `http://localhost:3210`, por lo que el navegador bloquea las peticiones y se ve "Failed to fetch". El mensaje de usuario "Error al conectar con el servidor de autenticación" sale del `catch` en `EventosAutoAuth` cuando falla `identifyUser`.

---

## 3. Solución aplicada (mismo origen + proxy)

En el **navegador**, el cliente ya **no** llama a `https://api-ia.bodasdehoy.com` directamente. Se usa **same-origin** (rutas relativas al Copilot, p.ej. `http://localhost:3210`) y las **API routes de Next.js del Copilot** hacen de **proxy** al backend:

| Petición desde el cliente (navegador) | Proxy en Copilot (Next.js) | Destino real |
|---------------------------------------|----------------------------|--------------|
| `POST /api/auth/identify-user`        | Ya existía                 | api-ia `/api/auth/identify-user` |
| `POST /api/auth/sync-user-identity`   | Ya existía                 | Respuesta local / backend según implementación |
| `POST /api/auth/save-user-config`     | **Añadido**                | api-ia `/api/auth/save-user-config` |
| `GET /api/config/{developer}`          | Ya existía                 | api-ia `/api/config/{developer}` |
| `POST /api/graphql`                   | **Añadido**                | api-ia `/graphql` |

Cambios de código:

- **`apps/copilot/src/config/eventos-api.ts`**  
  En el navegador, `getBackendURL()` devuelve `''` para que todas las llamadas del cliente vayan al mismo origen (Copilot).

- **`apps/copilot/src/hooks/useWhitelabelMessages.ts`**  
  En el navegador se usa `backendUrl = ''` para pedir `/api/config/{developer}` al Copilot.

- **`apps/copilot/src/store/chat/slices/externalChat/action.ts`**  
  En el navegador se usa `BACKEND_URL = ''` para `save-user-config` contra el Copilot.

- **`apps/copilot/src/libs/graphql/client.ts`**  
  En el navegador se usa endpoint `/api/graphql` (mismo origen).

- **Rutas proxy nuevas en Copilot:**
  - `apps/copilot/src/app/(backend)/api/auth/save-user-config/route.ts`
  - `apps/copilot/src/app/(backend)/api/graphql/route.ts`

Con esto, las peticiones desde el Copilot en localhost (o chat-test) van a **localhost:3210** (same-origin) y el servidor Next.js del Copilot reenvía a api-ia, evitando CORS y el "Failed to fetch" / "Error al conectar con el servidor de autenticación" por este motivo.

---

## 4. Cómo reproducir y comprobar

1. Abrir **http://localhost:8080** (web) y abrir el Copilot (panel/iframe).
2. En DevTools → **Console**: no deberían aparecer errores CORS para `api-ia.bodasdehoy.com` en las rutas anteriores.
3. En DevTools → **Network**: las peticiones a auth/config/graphql deben ir a `http://localhost:3210/api/...` (o al mismo origen del Copilot) y responder 200 (o el código que corresponda del backend), no "Failed to fetch" por CORS.

Si api-ia no está disponible o devuelve error, el usuario puede seguir viendo un mensaje de error, pero ya no por CORS desde el Copilot.
