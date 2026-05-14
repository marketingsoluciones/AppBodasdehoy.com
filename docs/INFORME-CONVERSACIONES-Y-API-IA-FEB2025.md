# Informe: conversaciones app-test ↔ chat-test y respuestas api-ia (feb 2025)

**Fecha:** 12 feb 2025  
**Objetivo:** Analizar (1) visualización y recuperación de conversaciones entre app-test y chat-test, (2) por qué no responde a preguntas como "qué eventos tengo para el próximo año" y qué revisar en api-ia y logs.

---

## 1. Conversaciones: qué debería pasar y dónde se ven

### 1.1 Comportamiento esperado

- **app-test (web):** El usuario tiene una conversación en el panel del Copilot (embed). Esa conversación debería poder **verse también en chat-test** (y al revés) si ambos usan el mismo usuario y la misma sesión/historial persistido en el backend.
- **Al entrar con un usuario:** Deberíamos ver la **última conversación** o poder **recuperar** la última o una anterior. En la **parte superior** (sidebar o pestaña de historial) debería haber una forma de **recuperar** conversaciones.

### 1.2 Dónde está implementado

| Lugar | Qué hace | Fuente |
|-------|----------|--------|
| **app-test (web)** | Al abrir el Copilot embed se llama `getChatHistory(sessionId, development)` → **GET /api/copilot/chat-history?sessionId=...** → proxy a **api-ia** (si `API_IA_CHAT_HISTORY_URL`) o a **API2** `getChatMessages`. Se cargan los mensajes en el panel. | `apps/web/components/Copilot/CopilotEmbed.tsx`, `apps/web/services/copilotChat.ts`, `apps/web/pages/api/copilot/chat-history.ts` |
| **chat-test (Copilot)** | En el **sidebar izquierdo** (pestaña "Historial" o "Conversaciones"): **ConversationHistory** usa `useConversationHistory(development, userEmail)` → llama a **/api/conversations/last** (backend api-ia) con `email` y `development`. Muestra lista de conversaciones con búsqueda "🔍 Buscar en historial...". Al hacer clic en una conversación se debería cargar ese hilo. | `apps/copilot/src/app/.../SessionListContent/ConversationHistory/index.tsx`, `apps/copilot/src/hooks/useConversationHistory.ts` |
| **Recuperar** | En chat-test: la lista superior es la de **ConversationHistory** (conversaciones de API2/api-ia). No hay un botón explícito "Recuperar última"; se recupera **eligiendo una conversación de la lista**. Si la lista viene vacía, no hay nada que recuperar. | Mismo componente + `ConversationItem` |

### 1.3 Sincronización app-test ↔ chat-test

- **app-test** obtiene historial vía **GET /api/copilot/chat-history** (web) → proxy a api-ia o API2.
- **chat-test** obtiene lista de conversaciones vía **/api/conversations/last** (Copilot) → backend api-ia (EventosAPIClient, `API_IA_URL`).
- Para que **la misma conversación se vea en ambos** hace falta que:
  1. **api-ia** (o API2) **persista** los mensajes con un `sessionId` estable (p. ej. ligado al usuario).
  2. **app-test** y **chat-test** usen el **mismo sessionId** para ese usuario (p. ej. derivado de userId o email).
  3. **api-ia** exponga **GET /webapi/chat/history** (o equivalente) y que **chat-history** de web lo use si `API_IA_CHAT_HISTORY_URL` está definida; y que el Copilot use el mismo backend para `/api/conversations/last`.

Si api-ia no persiste aún o no devuelve historial por usuario/sesión, la lista en chat-test puede estar vacía o no coincidir con lo que se ve en app-test.

### 1.4 Recomendaciones (conversaciones / recuperar)

- **Parte superior en chat-test:** Ya existe la lista "Buscar en historial..." en **ConversationHistory**. Valorar añadir un botón tipo **"Recuperar última conversación"** que seleccione la primera de la lista (la más reciente).
- **Unificar origen de historial:** Que tanto app-test (chat-history) como chat-test (conversations/last) lean del **mismo backend** (api-ia) con el mismo criterio de usuario/sessionId, para que lo que se escribe en app-test se vea en chat-test y al revés.
- **Variable de entorno:** En web, definir **API_IA_CHAT_HISTORY_URL** (ej. `https://api-ia.bodasdehoy.com/webapi/chat/history`) cuando api-ia exponga ese endpoint, para que el historial no dependa de API2.

---

## 2. Por qué no responde a preguntas (ej. "qué eventos tengo para el próximo año")

### 2.1 Flujo de una pregunta

1. Usuario escribe en **app-test** (embed) o **chat-test** (Copilot).
2. Front envía mensaje al backend:
   - **Desde chat-test:** POST al **route del Copilot** (same-origin) → **/api/webapi/chat/[provider]** (provider puede ser `auto`) → **proxy** a **api-ia**: `POST https://api-ia.bodasdehoy.com/webapi/chat/auto` (o el provider que use).
   - **Desde app-test:** POST **/api/copilot/chat** (web) → proxy a api-ia (mismo tipo de llamada).
3. **api-ia** recibe la petición, usa el proveedor de IA configurado y, si aplica, herramientas/contexto (p. ej. eventos del usuario). Responde con streaming (SSE) o JSON.
4. Si api-ia devuelve **503** o error, el front muestra "no responde" o mensaje de error.

### 2.2 Prueba realizada contra api-ia (12 feb 2025)

- **GET /health** → **200** OK.
- **POST /webapi/chat/auto** (mensaje "Di hola en una palabra") → **503** con cuerpo: *"Error de autenticación con el proveedor de IA. La API key configurada no es válida."*
- **GET /api/config/bodasdehoy** → **200**.

Conclusión: la petición **sí llega** a api-ia; el fallo es **del lado de api-ia**: la **API key del proveedor de IA** no es válida o no está bien configurada. Por eso **ninguna** pregunta (incluida "qué eventos tengo para el próximo año") puede ser respondida por el modelo: el backend corta antes con 503.

### 2.3 Qué revisar en api-ia y logs

| Dónde | Qué revisar |
|-------|-------------|
| **api-ia (backend)** | Configuración de **API key** del proveedor de IA (OpenAI, Azure, o el que use `/webapi/chat/auto`). Mensaje literal: "La API key configurada no es válida." |
| **Logs api-ia** | Al recibir POST /webapi/chat/auto, buscar líneas con error de autenticación o "invalid API key". Ver si el 503 se lanza desde el orchestrator o desde el cliente del proveedor. |
| **Variables de entorno api-ia** | Claves tipo `OPENAI_API_KEY`, `AZURE_*`, o las que use el proveedor configurado para bodasdehoy. |
| **Front (Copilot)** | Si se ve en consola del navegador "502" o "Backend IA no disponible": es el proxy del Copilot reflejando el 503 de api-ia. No indica fallo de red; indica que api-ia respondió con error. |
| **Logs web (app-test)** | Si el chat va por apps/web: en terminal del servidor Next (apps/web) buscar `[Copilot API]` o "Backend response status: 503". Confirma que el proxy devuelve lo que api-ia devolvió. |

### 2.4 Preguntas tipo "eventos para el próximo año"

Para que api-ia pueda responder con datos de eventos del usuario:

1. **Primero** debe poder responder cualquier mensaje (arreglar 503 / API key).
2. **Después:** api-ia debe tener integración con la API de eventos (apiapp o la que corresponda) y recibir en el request **userId** o **sessionId** (y JWT si aplica) para consultar eventos de ese usuario. El front ya envía contexto (sessionId, userId, development); el backend debe usar ese contexto para llamar a la API de eventos y filtrar por año si la pregunta lo pide.

Si la API key se corrige y aun así "eventos para el próximo año" no devuelve datos, revisar en api-ia: llamada a la API de eventos, filtro por año y que el usuario esté identificado correctamente.

---

## 3. Resumen para Slack (equipo api-ia)

- **Conversaciones:** Para que lo de app-test se vea en chat-test (y recuperar última/anteriores), hace falta que el historial venga del mismo backend (api-ia) con mismo sessionId/usuario. Chat-test ya tiene lista de conversaciones en la parte superior (ConversationHistory); opcional añadir "Recuperar última". Si api-ia expone GET /webapi/chat/history, en web podemos usar `API_IA_CHAT_HISTORY_URL` y dejar de usar API2 para historial.
- **No responde a preguntas:** POST /webapi/chat/auto devuelve **503** con mensaje "Error de autenticación con el proveedor de IA. La API key configurada no es válida." Revisar en api-ia la API key del proveedor de IA y logs al recibir /webapi/chat/auto. Hasta que eso esté corregido, ninguna pregunta (incluida "eventos próximo año") puede ser respondida.
- **Pruebas:** Se ejecutó `./scripts/test-api-ia-y-enviar-slack.sh`; el resumen se envía a #copilot-api-ia. Informe detallado en repo: `docs/INFORME-CONVERSACIONES-Y-API-IA-FEB2025.md`.
