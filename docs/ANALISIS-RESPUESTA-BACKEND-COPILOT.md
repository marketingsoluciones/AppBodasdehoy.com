# Análisis de la respuesta del Backend (api-ia) – Copilot

**Fecha**: 2026-02-06  
**Origen**: Respuesta del Backend Team (2026-02-03) a las preguntas en `docs/PREGUNTAS-BACKEND-COPILOT.md`.

---

## Resumen ejecutivo

La respuesta del backend **marca la dirección** en varios puntos: historial, sessionId, eventos SSE y métricas ya están resueltos en api-ia/API2. El front debe **alinearse** con lo que ya existe y **dejar de duplicar** lógica (p. ej. guardado de mensajes).

| Tema | Lo que dice el backend | Acción en front |
|------|-------------------------|-----------------|
| **Historial** | Backend guarda en API2 al finalizar el stream. Leer con GraphQL `getChatMessages`. | Obtener historial vía API2 (query `getChatMessages`). No guardar mensajes en Next (evitar duplicados). |
| **SessionId** | Se usa `metadata.sessionId`. Cualquier UUID único. | Mantener `user_<uid>` / `guest_*`; ya lo enviamos en metadata. |
| **API2** | Query `getChatMessages`, mutation `CHAT_saveMessage` (solo la usa el backend). | Front solo **lee** historial con `getChatMessages`. |
| **Eventos SSE** | 9 tipos: text, tool_calls, tool_result, confirm_required, event_card, error, usage, reasoning, done. | Incluir `event_card`, `usage`, `reasoning` en tipos que reenviamos/parseamos. |
| **Métricas** | Todo automático en backend. | No reportar desde front; opcionalmente mostrar `event: usage` si se recibe. |
| **Auth** | JWT + headers actuales suficientes. api-ia no tiene BD de usuarios. | Sin cambios. |

---

## 1. Historial de chat

### Qué dice el backend

- Backend **guarda** user + assistant en API2 al **finalizar** el stream (`event: done`).
- Si el stream **se interrumpe** (timeout, error), **no** se guarda ese turno.
- **Leer historial**: GraphQL en API2, query `getChatMessages(sessionId, limit)`.
- **No** hace falta que el front llame a ningún endpoint para guardar; el backend lo hace solo.

### Implicaciones para el front

- **Dejar de persistir** en Next.js (no llamar a `POST /api/chat/messages` ni a `persistChatMessage`) para no duplicar mensajes.
- **Obtener historial** llamando a API2: query `getChatMessages`. Se puede hacer desde un API route en Next que haga de proxy (con token del usuario) y devuelva `{ messages: [...] }`, y que `getChatHistory()` del cliente use esa ruta.
- Nuestra ruta `GET /api/chat/messages` (store en memoria) puede quedar como **fallback** solo cuando API2 no esté disponible o no tenga datos; por defecto, priorizar API2.

---

## 2. SessionId

- Backend usa `metadata.sessionId`. Formato: “cualquier UUID único”.
- Nosotros enviamos `user_<uid>` o `guest_*`. **No hace falta cambiar**; solo asegurar que siga en `metadata.sessionId` en cada request de chat.

---

## 3. API2 / GraphQL

- **Leer**: `getChatMessages(sessionId: String!, limit: Int)` → `{ id, role, content, createdAt, metadata }`.
- **Guardar**: mutation `CHAT_saveMessage` la usa **solo el backend**; el front no debe llamarla para el flujo normal.
- URL indicada: `https://api2.eventosorganizador.com/graphql` (o el proxy que use la app hacia API2). Autenticación: `Authorization: Bearer {JWT}`, `X-Development`.

---

## 4. Eventos enriquecidos (SSE)

- Backend envía 9 tipos: `text`, `tool_calls`, `tool_result`, `confirm_required`, `event_card`, `error`, `usage`, `reasoning`, `done`.
- Formato: `event: <tipo>\ndata: <JSON>\n\n`.
- Tipos de `tool_result`: download, image, qr_code, data_table, ui_action, event_card. **Event card** incluye `event`, `actions`, `message`.

### Implicaciones para el front

- Incluir en la lista de “enriched” que reenviamos/parseamos: **event_card**, **usage**, **reasoning** (además de los que ya tenemos: tool_result, progress, tool_start, etc.).
- En el proxy de chat: reenviar estos eventos al cliente para que el embed pueda mostrar event cards, uso de tokens, etc.
- En el cliente: tratar `event_card` en la UI (tarjeta de evento con acciones).

---

## 5. Métricas y uso

- Backend registra billing, latencia, errores, etc. **No** hace falta que el front envíe métricas.
- Opcional: si el stream trae `event: usage` con `tokens` y `cost`, mostrarlo en la UI.

---

## 6. Auth

- api-ia **no** tiene base de datos de usuarios; es stateless.
- JWT + `X-Development` + `metadata.userId` son suficientes. Sin cambios en el front.

---

## Referencias de código (backend)

| Funcionalidad | Archivo (api-ia) | Líneas |
|---------------|------------------|--------|
| Guardado de mensajes | `rest_chat_handler.py` | ~2800-2850 |
| Eventos SSE | `rest_chat_handler.py` | 120-146 |
| Clasificación tool_result | `rest_chat_handler.py` | 151-231 |
| API2 save_message | `api/api2_client.py` | 1187-1258 |
| API2 get_messages | `api/api2_client.py` | 765-785 |

---

## Próximos pasos en el front (resumen)

1. **Historial**: Implementar obtención de historial vía API2 `getChatMessages` (p. ej. ruta `/api/copilot/chat-history` que proxy a API2) y hacer que `getChatHistory()` la use; dejar de llamar a `persistChatMessage` / POST de mensajes desde el sidebar.
2. **SSE**: Añadir `event_card`, `usage`, `reasoning` a los tipos de evento que el proxy reenvía y el cliente trata como enriquecidos; opcionalmente renderizar event cards y usage en el embed.
3. **SessionId**: Sin cambios; seguir enviando `metadata.sessionId` como hasta ahora.
4. **Métricas**: No añadir envío desde front; opcionalmente consumir `event: usage` del stream para mostrar en UI.
