# Trabajar solo con datos reales – Qué necesitamos de api-ia

**Objetivo**: Tests y flujo usando **solo datos reales**. Para lo que no podamos llamar en CI, necesitamos que **api-ia** nos confirme o nos dé ejemplos reales.

---

## Quién es quién (aclaración)

| Quién | Qué hace |
|-------|----------|
| **api-ia** | Backend de IA (Python). Recibe el chat desde nuestro proxy, hace el modelo, herramientas, streaming SSE. **Al finalizar** cada respuesta, **api-ia** guarda los mensajes (user + assistant) en **API2**. Todo el “cerebro” del Copilot está en api-ia. |
| **API2** | Servicio GraphQL (api2.eventosorganizador.com). Es donde **se persiste** el historial de mensajes. **api-ia** es quien **escribe** ahí (mutation interna). El front **solo lee** historial desde API2 con la query `getChatMessages`, porque así nos lo indicó el equipo de api-ia. |

En resumen: **hablamos con api-ia para el chat en vivo** (envío de mensaje, streaming, eventos). **El historial lo leemos desde API2** porque api-ia nos indicó que los mensajes se guardan allí y que leyéramos con `getChatMessages`. **API2 no apunta a api-ia**: son dos backends distintos; api-ia es quien llama a API2 para guardar. Si api-ia expusiera un endpoint “dame historial” (y llamara a API2 por detrás), el front podría **solo** apuntar a api-ia y no necesitaría `API2_GRAPHQL_URL`.

---

## 1. Lo que ya usamos (contratos actuales)

### 1.1 Request a api-ia (POST /webapi/chat/auto)

- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <JWT>`, `X-Development`, opcionales `X-Request-Id`, `X-User-Id`, `X-Event-Id`, `X-Page-Name`.
- **Body** (lo que envía el front vía nuestro proxy):
  - `messages`: array de `{ role: 'user' | 'assistant' | 'system', content: string }` (el proxy añade system + contexto).
  - `stream`: boolean.
  - `metadata`: `{ userId?, development?, eventId?, eventName?, sessionId?, pageContext? }`.
  - Opcional: `model`.

**Pregunta para api-ia**: ¿Algún campo más obligatorio o formato distinto (por ejemplo `metadata.sessionId` con otro nombre)?

---

### 1.2 Respuesta SSE (api-ia → front)

- **Formato**: `event: <tipo>\ndata: <JSON>\n\n`.
- **Tipos que tratamos como enriquecidos**: `tool_result`, `ui_action`, `confirm_required`, `progress`, `code_output`, `tool_start`, `event_card`, `usage`, `reasoning`.
- **Tipos que tratamos como texto/error**: `text`, `error`, `done`.
- **Texto**: `data` con `choices[0].delta.content` (stream) o `choices[0].message.content` (no stream).

**Pregunta para api-ia**: ¿Podéis enviarnos 1–2 ejemplos **reales** (anonimizados) de líneas SSE para cada uno de estos tipos?
- `event_card` (con `event`, `actions`, `message` si los tenéis).
- `usage` (con `tokens`, `cost` o los campos que realmente enviáis).
- `reasoning`.
- `tool_result` (por ejemplo tipo `ui_action` o `data_table` con la estructura real).

Así alineamos los tests y el parseo al formato real y no a suposiciones.

---

### 1.3 Historial (API2 getChatMessages – nos lo indicó api-ia)

Según lo que nos dijo api-ia: el historial **no** se pide a api-ia; se lee desde **API2** con la query `getChatMessages(sessionId, limit)`, porque api-ia guarda ahí los mensajes al finalizar cada stream.

- **Query**: `getChatMessages(sessionId: String!, limit: Int)` (GraphQL en API2).
- **Campos que usamos**: `id`, `role`, `content`, `createdAt`, `metadata`.

**Pregunta para api-ia**: ¿Podéis confirmar la forma exacta de la respuesta de `getChatMessages` (o pasarnos a quién preguntar en API2)? Necesitamos saber si siempre vienen `id`, `role`, `content`, `createdAt` y si `createdAt` es ISO string.

**Pregunta opcional (arquitectura):** Hoy el front usa **dos URLs**: api-ia para chat y API2 para historial. ¿Preferís que el front **solo** apunte a api-ia? En ese caso, si api-ia expusiera un endpoint “dame historial” (p. ej. `GET /webapi/chat/history?sessionId=...`) que internamente llame a API2, nosotros solo necesitaríamos `PYTHON_BACKEND_URL` y dejaríamos de llamar a API2 desde el front.

---

## 2. Entorno de pruebas con datos reales

Para poder ejecutar tests contra servicios reales (o al menos validar contra respuestas reales):

1. **¿Existe una URL de api-ia solo para pruebas** (staging/test) que podamos usar desde nuestro CI o desde máquinas de desarrollo? Si sí, ¿qué headers/credenciales necesitamos (JWT de test, API key, etc.)?
2. **¿Podéis facilitar un `sessionId` de prueba** (por ejemplo `test_session_xxx`) para el que ya haya mensajes guardados (api-ia los guarda en API2 al finalizar el stream)? Así podemos probar la lectura de historial (nuestro proxy a `getChatMessages` en API2) y comprobar que el front muestra el historial correcto.
3. **¿Hay un usuario/JWT de test** que podamos usar en automatización (por ejemplo para health o un único mensaje de chat) sin tocar producción?

Con eso podríamos:
- Añadir un test opcional de integración (por ejemplo `pnpm test:web:integration`) que llame a api-ia y/o API2 con datos reales cuando exista la config (env vars) y esté permitido.

---

## 3. Resumen de peticiones a api-ia

| # | Petición | Para qué |
|---|----------|----------|
| 1 | Confirmar contrato del body de chat (messages, metadata, stream) y headers | No inventar campos; tests con forma real. |
| 2 | Ejemplos reales (anonimizados) de SSE: `event_card`, `usage`, `reasoning`, `tool_result` | Fixtures y tests de parseo con datos reales. |
| 3 | Confirmar forma de la respuesta de `getChatMessages` (API2, donde api-ia guarda los mensajes) o indicar endpoint de historial en api-ia si lo hubiera | Normalizar historial sin asumir. |
| 4 | URL y credenciales de entorno de prueba de **api-ia** (y si aplica, acceso a API2 para historial) | Tests de integración con datos reales. |
| 5 | `sessionId` de prueba con mensajes ya guardados (api-ia los escribe en API2; nosotros leemos desde API2) | Probar flujo de historial de punta a punta. |

Cuando tengamos estas respuestas, actualizaremos los fixtures y los tests para que trabajen **solo con datos reales** y, si nos ayudan con el entorno, añadiremos tests de integración que llamen a **api-ia** (chat) y, para historial, a API2 según lo acordado.
