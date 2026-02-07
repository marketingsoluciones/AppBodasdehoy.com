# Preguntas al Backend (API-IA / API2) – Copilot e integración

Documento para enviar al equipo de backend y aclarar qué está ya implementado y qué debemos usar desde el front (monorepo AppBodasdehoy + Copilot embed).

---

## 1. Historial de chat (mensajes por sesión)

**Contexto:** En la app web tenemos un panel del Copilot (embed) que envía mensajes a `/api/copilot/chat` (proxy a api-ia). Queremos mostrar historial al reabrir el panel.

- ¿El backend de **api-ia** (Python) ya persiste los mensajes de chat por `sessionId` o por `userId`?
- Si **sí**: ¿qué endpoint debemos usar para **obtener** el historial? (ej. `GET /api/chat/history?sessionId=xxx` o similar). ¿Formato de respuesta (lista de mensajes con `id`, `role`, `content`, `createdAt`)?
- Si **sí**: ¿hay que **enviar** cada mensaje a algún endpoint para guardarlo, o el backend ya los guarda al procesar la petición a `/webapi/chat/auto` (o el que usemos)?
- Si **no**: ¿tenéis previsto exponer persistencia de historial? Mientras tanto en la web persistimos en memoria en `GET/POST /api/chat/messages` (Next.js).

---

## 2. SessionId en las peticiones de chat

**Contexto:** En el front enviamos `sessionId` en el metadata (ej. `user_<uid>` para usuario logueado o `guest_<id>` para invitado).

- ¿El backend de api-ia **usa** ya el `sessionId` (o un campo equivalente) para agrupar mensajes o para contexto de conversación?
- ¿Hay que enviar el `sessionId` en algún header o campo concreto (nombre y formato)?

---

## 3. API2 / GraphQL – historial de chat

**Contexto:** La app web usa API2 (GraphQL, api2.eventosorganizador.com) para eventos, usuarios, etc.

- ¿Existe en **API2** alguna **query** o **mutación** para:
  - **Leer** historial de mensajes del Copilot por usuario o por sesión?
  - **Guardar** mensajes del Copilot (user/assistant)?
- Si existe: ¿podéis indicar nombre de la operación, argumentos y formato de respuesta para conectarla desde la web?

---

## 4. Eventos enriquecidos (SSE)

**Contexto:** El front parsea eventos SSE con `event:` (tool_result, progress, tool_start, ui_action, confirm_required, etc.) y los muestra en la UI del embed.

- ¿El backend de api-ia **envía** ya estos eventos en el stream (con `event: tool_result` etc.)?
- Si **sí**: ¿hay documentación o lista de los tipos de evento y el formato de `data` (ej. para `tool_result`: `tool`, `result.type`, `result.message`, `result.url`)?
- Si **no**: ¿está previsto? Así podemos preparar la UI para cuando estén disponibles.

---

## 5. Métricas y uso del Copilot

**Contexto:** En el front hacemos un log básico por mensaje (tiempo de respuesta). Queremos saber si ya hay algo en backend para no duplicar.

- ¿El backend de api-ia **registra** ya métricas de uso del chat (mensajes enviados, errores, latencia, por usuario o por desarrollo)?
- Si **sí**: ¿hay que llamar a algún endpoint desde el front para reportar eventos (ej. “mensaje enviado”, “error”), o todo se deriva de las propias peticiones al chat?
- Si **no**: ¿preferís que el front envíe eventos a algún endpoint vuestro (URL y contrato) o de momento nos quedamos con logs/analítica solo en front?

---

## 6. Identificación de usuario (auth)

**Contexto:** Usamos `/api/auth/identify-user` (api-ia) para identificar usuario; en algunos entornos ha habido 404 si el usuario no existe en la BD de api-ia.

- ¿Los usuarios de **Firebase** (o el IdP que use la web) se sincronizan automáticamente con la BD de api-ia, o hay que crearlos/actualizarlos manualmente o por otro proceso?
- Para el Copilot embed: ¿basta con enviar el token (Bearer) y los headers que ya enviamos (`X-Development`, etc.) para que api-ia identifique al usuario y asocie la conversación?

---

## Resumen de lo que hace hoy el front

- **Chat:** POST a `/api/copilot/chat` (Next.js) → proxy a api-ia. Enviamos `metadata.sessionId`, `metadata.userId`, `metadata.pageContext`, etc.
- **Historial:** Por ahora `GET /api/chat/messages?sessionId=xxx` (Next.js) devuelve mensajes guardados **en memoria** en la app web; tras cada respuesta llamamos a `POST /api/chat/messages` (Next.js) para guardar user + assistant. Si backend o API2 ya exponen historial, podemos dejar de persistir en Next y usar vuestros endpoints.
- **SessionId:** Usamos `user_<uid>` si hay usuario logueado y `guest_<id>` si no.

Con vuestras respuestas ajustamos la integración (quitar persistencia en memoria si backend lo cubre, conectar API2 si hay queries/mutations, etc.).
