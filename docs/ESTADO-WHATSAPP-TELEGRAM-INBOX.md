# Estado: WhatsApp, Telegram e inbox unificado

Análisis de la integración para comunicarse con WhatsApp y Telegram desde un asistente en la web y responder desde el mismo sitio.

---

## Arquitectura y responsabilidades

- **Este repositorio (AppBodasdehoy):** Solo **frontend**. No gestiona mensajería; solo consume APIs. Incluye la app web (bodas) y el Copilot (UI de chat/inbox).
- **api-ia:** Es el servidor que **gestiona y comunica toda la mensajería** (WhatsApp, Telegram, inbox). Las APIs en api-ia **ya están desarrolladas**. Este front solo se comunica con api-ia.
- **Repositorio del Copilot:** Existe otro repositorio donde vive el Copilot con más detalle (esquemas, contratos); para un análisis más profundo se puede consultar. La fase actual es analizar lo que tenemos en este repo.

---

## 1. Qué hay en el código (dos flujos)

En este monorepo hay **dos formas** de mostrar conversaciones unificadas (WhatsApp, Telegram, etc.) y responder desde la web:

### A) Lista de chats externos (sidebar del Copilot)

- **Dónde:** Copilot (chat-test) → lista de conversaciones en el lateral (externalChat).
- **Qué hace:** Muestra sesiones de tipo **WHATSAPP**, **API** o **LOBE_CHAT** (chat web).
- **Código:**  
  - `apps/copilot/src/store/chat/slices/externalChat/action.ts` → `fetchExternalChats()`, `sendExternalMessage()`.  
  - Query GraphQL **getSessions** (variables: `userId`, `development`, `pagination`).  
  - Mutation GraphQL **sendMessage** (variables: `chatId`, `sessionId`, `content`).  
  - La respuesta se mapea con `session_type === 'WHATSAPP'` → `source: 'whatsapp'`, etc.

### B) Página “Messages” / Inbox (/messages)

- **Dónde:** Copilot → ruta **/messages** (inbox con filtros por canal: WhatsApp, Instagram, Telegram).
- **Qué hace:** Lista conversaciones por canal y permite enviar mensajes desde la web.
- **Código:**  
  - `apps/copilot/src/app/[variants]/(main)/messages/`  
  - Hooks: `useConversations.ts`, `useMessages.ts`, `useSendMessage.ts`.

---

## 2. A qué backend se conecta cada flujo (api-ia)

Todo el flujo de mensajería unificada apunta a **api-ia**. No hay otro backend para mensajería en este diseño.

### Flujo A – Chats externos (sidebar)

| Qué | Dónde en código | Backend / URL |
|-----|-----------------|----------------|
| Lista de sesiones | `externalChat/action.ts` → `GET_USER_CHATS` (getSessions) | **GraphQL** → api-ia |
| Enviar mensaje | `externalChat/action.ts` → `SEND_MESSAGE` | **GraphQL** → api-ia |

- **Cliente GraphQL:** `apps/copilot/src/libs/graphql/client.ts`.  
- **URL en navegador:** same-origin (`/api/graphql` o `NEXT_PUBLIC_GRAPHQL_ENDPOINT` si está definido). El proxy del Copilot (`apps/copilot/src/app/(backend)/api/graphql/route.ts`) reenvía a **`NEXT_PUBLIC_BACKEND_URL/graphql`** (por defecto `https://api-ia.bodasdehoy.com/graphql`).  
- **Headers que envía el front:** Authorization (Bearer token desde `jwt_token` o `dev-user-config`), Developer, SupportKey, Origin, X-Development, Content-Type.

### Flujo B – Página /messages (Inbox)

| Qué | Dónde en código | Backend / URL |
|-----|-----------------|----------------|
| Lista de conversaciones | `useConversations.ts` | **REST** `GET {NEXT_PUBLIC_BACKEND_URL}/api/messages/conversations` |
| Mensajes de una conversación | `useMessages.ts` | **REST** `GET {NEXT_PUBLIC_BACKEND_URL}/api/messages/conversations/{id}` |
| Enviar mensaje | `useSendMessage.ts` | **REST** `POST {NEXT_PUBLIC_BACKEND_URL}/api/messages/send` |

- **BACKEND_URL:** `NEXT_PUBLIC_BACKEND_URL` o, por defecto, `http://localhost:8030`. En producción suele ser `https://api-ia.bodasdehoy.com`.  
- **Headers REST:** Content-Type: application/json, Authorization: Bearer (desde `auth-token`, `sessionStorage` o `dev-user-config`).  
- **Query params (conversations):** `development`, `email`, `user_id`, `channel` (opcional).

---

## 3. Qué esperamos de api-ia (APIs ya desarrolladas)

Las APIs en api-ia **ya están hechas**. Este front las consume. Resumen de lo que el front usa:

- **GraphQL (mismo origen que BACKEND_URL/graphql):**
  - **getSessions**(userId, development, pagination) → devuelve sesiones con `session_type` (WHATSAPP, TELEGRAM, API, LOBE_CHAT), `id`, `titulo`, `participants`, `unreadCount`, `lastMessageAt`, `status`.
  - **sendMessage**(chatId, sessionId, input: { role: USER, content, type: TEXT }) → envía mensaje al canal correspondiente.
  - **getMessages**(sessionId, pagination) para cargar mensajes de una sesión.
  - **getSession**(sessionId) para detalle de una sesión.

- **REST (mismo BACKEND_URL):**
  - `GET /api/messages/conversations?development=...&email=...&user_id=...&channel=...` → lista de conversaciones (formato array con `channel`, `id`, `contact`, `lastMessage`, `unreadCount`).
  - `GET /api/messages/conversations/:conversationId` → mensajes de una conversación.
  - `POST /api/messages/send` → body `{ channel, conversationId, text }` → envía mensaje.

---

## 4. WhatsApp en la app web (bodasdehoy) – flujo distinto

En **apps/web** hay otra integración con WhatsApp (invitaciones, QR, etc.) que usa su propio GraphQL (p. ej. api.bodasdehoy.com), no el de mensajería unificada de api-ia. Es un flujo separado. No se detalla aquí.

---

## 5. App y backend por flujo (resumen)

| Funcionalidad | App | Backend |
|---------------|-----|---------|
| Lista de chats WhatsApp/Telegram en sidebar Copilot | Copilot | **api-ia** (GraphQL getSessions) |
| Enviar respuesta desde el Copilot a un chat externo | Copilot | **api-ia** (GraphQL sendMessage) |
| Inbox /messages (lista + mensajes + enviar) | Copilot | **api-ia** (REST /api/messages/*) |
| WhatsApp en invitaciones (QR, sesiones) en la web bodas | apps/web | Otro backend (p. ej. api.bodasdehoy.com) |

---

## 6. Qué revisar en el front para que funcione

1. **Variables de entorno del Copilot:**  
   - `NEXT_PUBLIC_BACKEND_URL` debe apuntar a api-ia (p. ej. `https://api-ia.bodasdehoy.com`).  
   - `NEXT_PUBLIC_GRAPHQL_ENDPOINT` (opcional): si se usa, debe ser la URL del GraphQL de api-ia; si no, el front usa same-origin y el proxy reenvía a BACKEND_URL/graphql.

2. **Revisar la implementación en el front:**  
   - Que las llamadas GraphQL y REST usen la URL correcta (incl. proxy).  
   - Que los headers (Authorization, Developer, SupportKey, X-Development) sean los que api-ia espera.  
   - Que el formato de variables (GraphQL) y body (REST) coincida con lo que api-ia implementa.  
   - Ver documento **docs/AUDITORIA-FRONT-MENSAJERIA.md** para trazado detallado y posibles fallos.

3. **Coordinación con api-ia:**  
   - Coordinar vía Slack con api-ia para que sus probadores prueben todo (APIs + flujos del front) y revisen lo planificado/implementado. Ver **docs/SLACK-COORDINACION-API-IA-MENSAJERIA.md**.
