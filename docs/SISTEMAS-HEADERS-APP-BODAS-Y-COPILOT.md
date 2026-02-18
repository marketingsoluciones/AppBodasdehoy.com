# Sistemas de headers: App Bodas (web) y LobeChat Copilot

**Objetivo:** Analizar qué cabeceras usan la app web (bodas) y el Copilot (LobeChat) y cómo funcionan en las peticiones al chat y a api-ia.

**Importante:** Nosotros hablamos con **api-ia.bodasdehoy.com** (y App Bodas con **api.bodasdehoy.com** para auth). No hablamos con api2.eventosorganizador.com para el flujo de chat. Ver **docs/QUIEN-HABLA-CON-QUE-API.md**.

---

## 1. App Bodas (apps/web)

### 1.1 Origen de las peticiones de chat

- **Cliente (navegador):** `apps/web/services/copilotChat.ts` y componentes que llaman a `/api/copilot/chat`.
- **API route:** `apps/web/pages/api/copilot/chat.ts` recibe la petición y hace proxy a api-ia (`POST .../webapi/chat/{provider}`).

### 1.2 Headers que envía el cliente (web) al chat

| Header | Origen | Uso |
|--------|--------|-----|
| **Content-Type** | Fijo | `application/json` |
| **Authorization** | Cookie `idTokenV0.1.0` | `Bearer <Firebase idToken>`. El usuario hace login con Firebase; el idToken se guarda en cookie y se lee con `Cookies.get('idTokenV0.1.0')`. |
| **X-Development** | Contexto / config | `development` (p. ej. `bodasdehoy`). Identifica el whitelabel/tenant. |
| **X-Request-Id** | Generado en cliente | UUID para trazar la petición (opcional). |

**Código de referencia:** `copilotChat.ts` (líneas 205-207, 402-403):

```ts
'Authorization': `Bearer ${Cookies.get('idTokenV0.1.0') || ''}`,
'X-Development': development || 'bodasdehoy',
'X-Request-Id': requestId,
```

### 1.3 Headers que la API web reenvía a api-ia

La ruta `pages/api/copilot/chat.ts`:

- Toma **development** de `req.headers['x-development']` o de `metadata.development` (por defecto `bodasdehoy`).
- Toma **Authorization** de `req.headers['authorization']` y lo reenvía tal cual.
- Añade opcionales según metadata del body: **X-User-Id**, **X-Event-Id**, **X-Page-Name**.
- Añade **X-Request-Id** y, si hay apiKey de whitelabel, **X-API-Key**.

**Cabeceras que llegan a api-ia desde app web:**

- `Content-Type: application/json`
- `X-Development: bodasdehoy` (u otro development)
- `Authorization: Bearer <idToken>` (si el cliente envió Authorization)
- `X-Request-Id` (opcional)
- `X-User-Id`, `X-Event-Id`, `X-Page-Name` (si se envían en metadata)

### 1.4 Otros endpoints web que usan headers

- **chat-history:** Lee `x-development` y `authorization` y los reenvía al backend de historial (api-ia o API2).
- **proxy / proxy-bodas:** Reenvían `Authorization`, `x-development` / `Development`, `isproduction` al API de destino.
- **CopilotIframe (ping):** Envía solo `Content-Type` y `X-Development` (sin Authorization en el ejemplo de ping).

---

## 2. LobeChat Copilot (apps/copilot)

### 2.1 Dos mecanismos de auth para headers

| Mecanismo | Uso | Dónde se define |
|-----------|-----|------------------|
| **createHeaderWithAuth** | Chat y otras llamadas al backend del Copilot (SSE, modelos, plugins, etc.) | `apps/copilot/src/services/_auth.ts` |
| **buildAuthHeaders** | Llamadas directas a api-ia/API2 (historial, TestSuite, Playground, etc.) | `apps/copilot/src/utils/authToken.ts` |

### 2.2 createHeaderWithAuth (chat y runtime del Copilot)

- Construye el token interno de LobeChat (`LOBE_CHAT_AUTH_HEADER`) con key vaults / proveedor.
- En el **navegador**, añade **Authorization: Bearer &lt;JWT&gt;** si existe:
  - Primero `localStorage.getItem('jwt_token')` o `api2_jwt_token`;
  - Si no, cookie/`dev-user-config` en localStorage (objeto con `token`).
- No añade por sí mismo `X-Development`; quien llama puede meter en `params.headers` cabeceras extra (p. ej. en `chat/index.ts` se añaden **X-Development**, **X-User-UID** / **X-User-Email** / **X-User-Phone**, **X-Event-ID**).

**Flujo típico (chat):**

1. Cliente (store/servicios) llama a `createHeaderWithAuth({ headers: { ...userContextHeaders } })`.
2. userContextHeaders incluyen `X-Development`, `X-Event-ID` y, si hay usuario, `X-User-UID` o `X-User-Email` o `X-User-Phone`.
3. La petición va al **backend del Copilot** (mismo origen), no directamente a api-ia. El backend del Copilot es el que habla con api-ia.

### 2.3 Backend del Copilot: route webapi/chat/[provider]

- **Archivo:** `apps/copilot/src/app/(backend)/webapi/chat/[provider]/route.ts`.
- Reenvía a api-ia: **todas las cabeceras** de la petición entrante (excepto host, connection, content-length, transfer-encoding).
- Si no viene **Authorization**, intenta obtener JWT de la cookie `dev-user-config` (parsea JSON y usa `config.token`) y pone `Authorization: Bearer <token>`.
- Así, api-ia recibe lo que el cliente del Copilot envió (incl. `Authorization`, `X-Development`, etc.) o el token de `dev-user-config`.

### 2.4 buildAuthHeaders (peticiones directas a backend)

- **Función:** `buildAuthHeaders(headers?)` en `utils/authToken.ts`.
- **Token:** `getAuthToken()` busca en este orden:
  1. `localStorage.jwt_token`
  2. `localStorage.api2_jwt_token`
  3. `localStorage['dev-user-config']` → `parsed.token`
- Añade **Authorization: Bearer &lt;token&gt;** si hay token; el resto de cabeceras se pasan por argumento.
- Se usa en: TestSuite, Playground, ConversationHistory, BrandingAdmin, TrainingPanel, etc., para llamar a endpoints del backend del Copilot o a api-ia (según la URL que use cada uno).

### 2.5 Resumen de headers que puede enviar el Copilot a api-ia

- **Authorization:** Bearer &lt;JWT&gt; (Firebase idToken o API2 JWT, desde localStorage o dev-user-config).
- **X-Development:** tenant/whitelabel (p. ej. `bodasdehoy`).
- **Content-Type:** application/json.
- **X-User-UID / X-User-Email / X-User-Phone:** si el chat incluye contexto de usuario.
- **X-Event-ID:** si hay evento seleccionado.
- Cualquier otra cabecera que el cliente añada y el route `webapi/chat/[provider]` reenvíe.

---

## 3. Comparativa rápida

| Aspecto | App Bodas (web) | LobeChat Copilot |
|---------|------------------|-------------------|
| **Dónde está el token** | Cookie `idTokenV0.1.0` (Firebase idToken) | localStorage: `jwt_token`, `api2_jwt_token` o `dev-user-config.token` |
| **Quién hace proxy a api-ia** | Next.js API route `/api/copilot/chat` (apps/web) | Next.js route `/api/webapi/chat/[provider]` (apps/copilot) |
| **Header de desarrollo** | `X-Development` (desde contexto/config) | `X-Development` (desde store/context) |
| **Header de usuario** | Opcional en body (metadata.userId) → se manda como X-User-Id | X-User-UID / X-User-Email / X-User-Phone en headers |
| **Request ID** | X-Request-Id en web; API puede reenviarlo | No obligatorio; el route reenvía lo que llegue |

---

## 4. Flujo unificado (hacia api-ia)

1. **Usuario en app web:** Login Firebase → cookie `idTokenV0.1.0` → peticiones a `/api/copilot/chat` con `Authorization: Bearer <idToken>` y `X-Development: bodasdehoy` → API web reenvía a api-ia con esos headers más X-User-Id / X-Event-Id si hay metadata.
2. **Usuario en Copilot (chat-test):** Login (Firebase o API2) → token en localStorage → `createHeaderWithAuth` incluye `Authorization` y el chat añade `X-Development`, etc. → petición al backend del Copilot (`/api/webapi/chat/auto` o similar) → el route reenvía todas las cabeceras (o rellena Authorization desde `dev-user-config`) a api-ia.

En ambos casos api-ia recibe al menos **X-Development** y, si hay sesión, **Authorization: Bearer &lt;JWT&gt;** para identificar al usuario/tenant.
