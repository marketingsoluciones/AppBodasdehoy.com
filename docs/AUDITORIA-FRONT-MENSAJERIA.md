# Auditoría: implementación en el front de la mensajería (api-ia)

Este documento traza todas las llamadas desde este repositorio a api-ia para mensajería (WhatsApp, Telegram, inbox), documenta qué envía el front, qué espera recibir y lista posibles fallos de implementación para comprobar.

---

## 1. Resumen de puntos de llamada

| Flujo | Archivo(s) | API | URL efectiva |
|-------|------------|-----|--------------|
| Lista de chats (sidebar) | `apps/copilot/src/store/chat/slices/externalChat/action.ts` | GraphQL getSessions | Navegador: same-origin → proxy → `NEXT_PUBLIC_BACKEND_URL/graphql` |
| Enviar mensaje (sidebar) | Mismo + `SEND_MESSAGE` | GraphQL sendMessage | Igual |
| Lista conversaciones (/messages) | `apps/copilot/src/app/.../messages/hooks/useConversations.ts` | REST GET | `NEXT_PUBLIC_BACKEND_URL/api/messages/conversations` |
| Mensajes de una conversación | `apps/copilot/src/app/.../messages/hooks/useMessages.ts` | REST GET | `NEXT_PUBLIC_BACKEND_URL/api/messages/conversations/:id` |
| Enviar mensaje (/messages) | `apps/copilot/src/app/.../messages/hooks/useSendMessage.ts` | REST POST | `NEXT_PUBLIC_BACKEND_URL/api/messages/send` |

---

## 2. GraphQL (chats externos – sidebar)

### 2.1 Cliente y URL

- **Cliente:** `apps/copilot/src/libs/graphql/client.ts` (Apollo).
- **HTTP_ENDPOINT:**  
  - Si `NEXT_PUBLIC_GRAPHQL_ENDPOINT` está definido → se usa ese.  
  - Si no, en navegador `getBackendUrl()` devuelve `''` (same-origin), luego `HTTP_ENDPOINT` = `'/api/graphql'` (o `/graphql` según fallback).  
  - En servidor (SSR) `getBackendUrl()` = `NEXT_PUBLIC_BACKEND_URL` → `HTTP_ENDPOINT` = `{BACKEND_URL}/graphql`.

- **Proxy:** `apps/copilot/src/app/(backend)/api/graphql/route.ts`  
  - Recibe POST al Copilot en `/api/graphql`.  
  - Reenvía a `getBackendUrl()/graphql` = `NEXT_PUBLIC_BACKEND_URL/graphql` (por defecto `https://api-ia.bodasdehoy.com/graphql`).  
  - Reenvía headers: Authorization, Developer, SupportKey, Origin, Content-Type.  
  - **Posible fallo:** En `client.ts` la variable se llama `supportkey` (minúscula) al leer del contexto; el proxy lee `supportkey`. Verificar que api-ia espere el mismo nombre.

### 2.2 getSessions

- **Query:** `GET_USER_CHATS` en `apps/copilot/src/libs/graphql/queries.ts`.  
- **Variables que envía el front:**  
  - `userId`: string (currentUserId del store).  
  - `development`: string (del store).  
  - `pagination`: `{ limit: 50, page: 1 }`.  

- **Respuesta esperada (según código):**  
  - `data.getSessions.success`, `data.getSessions.sessions` (array).  
  - Cada sesión: `id`, `session_type`, `lastMessageAt`, `participants`, `messages` (opcional), `unreadCount`, `status`.  
  - El front mapea `session_type === 'WHATSAPP'` → `source: 'whatsapp'`, `'API'` → `'api'`, resto → `'chat'`.

- **Posibles fallos:**  
  - Si api-ia devuelve otro nombre de campos (p. ej. `sessionType` en camelCase) el mapeo falla.  
  - Si la query en api-ia exige otros argumentos o otro tipo de `pagination`, la petición puede ser rechazada.  
  - Usuarios UUID o `visitante@guest.local` no llaman a getSessions (se considera guest); si el usuario real tiene otro formato, comprobar que `currentUserId` y `development` estén bien seteados antes de la llamada.

### 2.3 sendMessage

- **Mutation:** `SEND_MESSAGE` en `apps/copilot/src/libs/graphql/queries.ts`.  
- **Variables que envía el front:**  
  - `chatId`: ID (en código se usa el mismo `sessionId` como chatId en algunos flujos).  
  - `sessionId`: string.  
  - `content`: string (texto del mensaje).  

- **Posibles fallos:**  
  - Si api-ia espera `chatId` y `sessionId` con significados distintos, enviar el mismo valor puede ser incorrecto.  
  - Verificar en api-ia el contrato exacto (nombres y tipos) de la mutation sendMessage.

---

## 3. REST (/messages – inbox)

### 3.1 GET /api/messages/conversations

- **Archivo:** `useConversations.ts`.  
- **URL:** `${backendUrl}/api/messages/conversations?development=...&email=...&user_id=...&channel=...`  
  - `backendUrl` = `process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030'`.  

- **Headers:**  
  - `Content-Type: application/json`.  
  - `Authorization: Bearer ${token}` si hay token (desde `auth-token`, `sessionStorage` o `dev-user-config.token`).  

- **Respuesta esperada:** Array de objetos con `channel`, `id`, `contact`, `lastMessage`, `unreadCount` (formato `Conversation` en el hook).  
- **Comportamiento en desarrollo:** Si el fetch falla, se usa datos mock (solo en dev). En producción no hay mock; si falla, la lista queda vacía.

- **Posibles fallos:**  
  - CORS: si api-ia no permite el origen del Copilot, el fetch falla en el navegador.  
  - 401/403: si api-ia exige un token o header adicional (p. ej. X-Development), el front solo envía Authorization y query params; puede faltar header.  
  - Formato de respuesta: si api-ia devuelve `{ data: [...] }` en lugar de un array directo, el código actual asume `Array.isArray(data)`; si no, podría no mapear bien.

### 3.2 GET /api/messages/conversations/:conversationId

- **Archivo:** `useMessages.ts`.  
- **URL:** `${backendUrl}/api/messages/conversations/${conversationId}`.  
- **Headers:** Igual que arriba (Content-Type, Authorization).  

- **Respuesta esperada:** Array de mensajes con `id`, `text` o `content`, `fromUser` o `role`, `timestamp` o `createdAt`, `attachments`, `status`.  

- **Posibles fallos:**  
  - Mismo tipo de problemas CORS/auth que en 3.1.  
  - Si la respuesta es un objeto con una clave (p. ej. `messages`) en lugar de array directo, el código que hace `Array.isArray(data)` falla.

### 3.3 POST /api/messages/send

- **Archivo:** `useSendMessage.ts`.  
- **URL:** `${backendUrl}/api/messages/send`.  
- **Body:** `{ channel: string, conversationId: string, text: string }`.  
- **Headers:** Content-Type: application/json, Authorization si hay token.  

- **Posibles fallos:**  
  - api-ia podría esperar nombres distintos (p. ej. `conversation_id`, `message`).  
  - Si api-ia devuelve 4xx/5xx, el front muestra el mensaje de error de `errorData.detail` o `errorData.message`; si api-ia devuelve otro formato, el usuario podría ver un mensaje genérico.

---

## 4. Checklist de verificación (front y coordinación con api-ia)

- [ ] **Variables de entorno:** En el entorno donde se prueba el Copilot, `NEXT_PUBLIC_BACKEND_URL` apunta a api-ia (p. ej. https://api-ia.bodasdehoy.com). Si se usa GraphQL directo, `NEXT_PUBLIC_GRAPHQL_ENDPOINT` coherente con api-ia.
- [ ] **Login / token:** Usuario con sesión válida; token en `localStorage` o `dev-user-config` para que las peticiones lleven Authorization. Sin token, api-ia puede devolver 401.
- [ ] **Headers GraphQL:** En una petición getSessions desde la UI, comprobar en DevTools (Network) que la petición al proxy (o a graphql) lleve Developer, SupportKey, X-Development si api-ia los requiere.
- [ ] **Proxy /api/graphql:** Comprobar que la petición POST al Copilot en `/api/graphql` devuelve 200 y que la respuesta tiene la estructura que espera el front (getSessions.success, getSessions.sessions).
- [ ] **REST /api/messages/conversations:** Llamar desde la página /messages; en Network comprobar que la URL sea la de api-ia y que la respuesta sea un array (o el formato que api-ia documente). Comprobar que no haya error CORS.
- [ ] **REST /api/messages/send:** Enviar un mensaje desde /messages; comprobar que el body sea `{ channel, conversationId, text }` y que api-ia responda 200 con un formato que el front sepa leer (id, timestamp, etc.).
- [ ] **Usuarios invitados:** Si el usuario es “guest” (p. ej. por UUID o visitante@guest.local), el front no llama a getSessions ni a /api/messages; la lista sale vacía. Para probar con datos reales, usar un usuario no guest con development correcto.
- [ ] **Manejo de errores:** Probar respuestas 401, 403, 502 de api-ia y comprobar que la UI muestre un mensaje útil y no solo pantalla en blanco o lista vacía sin explicación.

---

## 5. Referencias de código

- GraphQL client y endpoint: `apps/copilot/src/libs/graphql/client.ts` (getBackendUrl, HTTP_ENDPOINT, authLink).
- Proxy GraphQL: `apps/copilot/src/app/(backend)/api/graphql/route.ts`.
- Queries y mutations: `apps/copilot/src/libs/graphql/queries.ts` (GET_USER_CHATS, SEND_MESSAGE, GET_CHAT_MESSAGES, GET_CHAT_SOURCE).
- Store externalChat: `apps/copilot/src/store/chat/slices/externalChat/action.ts` (fetchExternalChats, sendExternalMessage).
- Hooks REST: `apps/copilot/src/app/[variants]/(main)/messages/hooks/useConversations.ts`, `useMessages.ts`, `useSendMessage.ts`.

Documento de estado general: **docs/ESTADO-WHATSAPP-TELEGRAM-INBOX.md**.  
Coordinación con api-ia (Slack): **docs/SLACK-COORDINACION-API-IA-MENSAJERIA.md**.
