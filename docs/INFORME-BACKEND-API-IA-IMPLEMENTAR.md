# Informe para backend (api-ia): qué implementar para que el front deje de llamar a MCP

**Objetivo:** Que **AppEventos** y **chat-ia** no dependan de naming legacy “API2” ni tengan que llamar a **MCP** directamente para historial/whitelabel. Todo lo que aplique debería estar en **api-ia** (api-ia habla con MCP u otros backends por detrás).

Este documento es la petición formal al equipo de api-ia para implementar los siguientes puntos. Cuando estén listos, el front eliminará las llamadas directas a MCP (en esos flujos).

---

## Fase 1 – AppEventos (prioridad alta)

Para que **AppEventos** deje de usar MCP en estos flujos (historial/whitelabel), api-ia debe exponer lo siguiente.

### 1.1 Endpoint de historial de chat

**Necesidad:** Hoy el front (vía Next.js) llama a MCP `getChatMessages(sessionId, limit)` para mostrar el historial del Copilot. AppEventos no debería llamar a MCP para esto.

**Petición:** Exponer en api-ia un endpoint que devuelva el historial de mensajes de una sesión, llamando api-ia internamente a MCP (o a vuestro almacén).

**Propuesta de contrato:**

- **Método y ruta:** `GET /webapi/chat/history` (o la que prefiráis).
- **Query params:** `sessionId` (obligatorio), `limit` (opcional, default 50).
- **Headers:** Los mismos que para chat: `Authorization: Bearer <JWT>`, `X-Development`.
- **Respuesta:** `200 OK` con JSON: `{ "messages": [ { "id", "role", "content", "createdAt", "metadata?" } ] }`. Mismo formato que la query actual `getChatMessages` de MCP (para no cambiar el front más de lo necesario).

**Cuando esté implementado:** En el front ya está preparado: si definimos la variable de entorno `API_IA_CHAT_HISTORY_URL` (ej. `https://api-ia.bodasdehoy.com/webapi/chat/history`), la ruta `/api/copilot/chat-history` llamará a api-ia y dejará de llamar a MCP. No hará falta tocar código; solo configurar la env.

---

### 1.2 Fallback / whitelabel sin que el front llame a MCP

**Necesidad:** Cuando api-ia no está disponible, el handler de chat en Next.js llama a MCP `getWhiteLabelConfig(development, supportKey)` para obtener API key y llamar a OpenAI/Anthropic directo. AppEventos no debería llamar a MCP para esto.

**Petición:** Una de las dos (o ambas). **Recomendamos Opción B.**

- **Opción A:** api-ia asume siempre el fallback internamente (si no podéis responder, no exponéis; el front muestra “Servicio no disponible” y no hace fallback a otro proveedor). En ese caso el front eliminará por completo el código que llama a `getWhiteLabelConfig` en MCP.
- **Opción B:** api-ia expone un endpoint tipo `GET /webapi/config/whitelabel?development=...` (o similar) que devuelva la config whitelabel (incluida API key para IA), llamando vosotros a MCP por detrás. El front entonces llamaría solo a api-ia para ese fallback.

**Recomendamos Opción B.** El front ya está preparado: basta con que api-ia exponga el endpoint y definir `API_IA_WHITELABEL_URL`; no hace falta tocar código.

**Contrato Opción B – Endpoint whitelabel (api-ia):** `GET /webapi/config/whitelabel?development=<development>`, headers `Authorization`, `X-Development`. Respuesta 200 JSON: `apiKey` o `aiApiKey` (obligatorio), y opcionalmente `model`/`aiModel`, `provider`/`aiProvider`. Ejemplo: `{ "aiApiKey": "sk-...", "aiModel": "gpt-4o-mini", "aiProvider": "openai" }`. Con eso el handler llama solo a api-ia y **no llama a MCP**.

---

## Fase 2 – chat-ia (prioridad media; aclarar alcance)

En **chat-ia** hoy el front llama a MCP para: auth (JWT, login), facturación (invoices), wallet, invite tokens, credenciales IA (aiCredentials), sesiones/chat (GraphQL), whitelabel. El diseño objetivo es mantener naming MCP canónico y decidir qué parte (historial/whitelabel/IA) se delega a api-ia.

**Dudas para el backend:**

1. **Alcance:** ¿api-ia debe ser el único backend que el front de chat-ia use para todo (auth, billing, wallet, historial, sesiones), o solo para lo “de IA” (chat, historial, credenciales IA)? Si es solo “de IA”, ¿quién debe exponer auth/billing/wallet: otro servicio o sigue siendo MCP y se acepta que chat-ia siga llamando a MCP para eso?
2. **Auth (JWT):** ¿Hay o habrá en api-ia un flujo de login / intercambio de token (p. ej. Firebase → JWT) para que el front no llame a MCP para auth?
3. **Billing / wallet / invoices:** ¿Estos dominios los debe exponer api-ia (proxy a MCP) o se mantienen en MCP y el front de chat-ia sigue llamando a MCP solo para eso?

**Petición:** Que el backend confirme el alcance (qué debe exponer IA y qué puede seguir en MCP con el front llamando directo a MCP). Con eso el front podrá planificar la migración de los usos listados en **docs/LISTADO-LLAMADAS-MCP-AUDITORIA.md** (sección 2).

---

## Resumen de peticiones

| # | Petición | Prioridad | Para qué app |
|---|----------|-----------|--------------|
| 1 | Endpoint historial: `GET /webapi/chat/history?sessionId=...&limit=...` con respuesta `{ messages: [...] }` | Alta | AppEventos dejar de llamar a MCP getChatMessages |
| 2 | Fallback/whitelabel: **opción B recomendada** (endpoint en api-ia). Opción A: sin fallback con `SKIP_WHITELABEL_VIA_MCP` (legacy: `SKIP_WHITELABEL_VIA_API2`) | Alta | AppEventos dejar de llamar a MCP getWhiteLabelConfig |
| 3 | Aclarar alcance para chat-ia: ¿api-ia expone auth, billing, wallet, etc., o solo IA? | Media | Saber qué migrar en chat-ia |

---

## Referencias en el repo

- **Listado completo de llamadas a MCP:** docs/LISTADO-LLAMADAS-MCP-AUDITORIA.md  
- **Diseño objetivo:** naming MCP/IA (sin “API2/API3”) y mover a api-ia lo que aplique (historial/whitelabel) para no depender de MCP desde web.  
- **Preguntas anteriores (datos reales, tests):** docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md  

Cuando tengamos confirmación o los endpoints listos, actualizaremos el front y eliminaremos las llamadas a MCP según este informe.

---

## Pasos cuando el backend responda / implemente

| Petición | Acción en el front (sin tocar código si se usan env) |
|----------|------------------------------------------------------|
| **1.1 Historial** | Definir `API_IA_CHAT_HISTORY_URL` (ej. `https://api-ia.bodasdehoy.com/webapi/chat/history`). La ruta `/api/copilot/chat-history` ya usa api-ia cuando está definida. |
| **1.2 Opción A** (sin fallback desde front) | Definir `SKIP_WHITELABEL_VIA_MCP=true` (legacy: `SKIP_WHITELABEL_VIA_API2=true`). El handler de chat ya evita llamar a MCP para whitelabel; devuelve 503 si api-ia no responde. |
| **1.2 Opción B (recomendada)** | 1) Implementar en api-ia `GET /webapi/config/whitelabel?development=...` según el contrato de la sección 1.2. 2) En el front definir `API_IA_WHITELABEL_URL` (ej. `https://api-ia.bodasdehoy.com/webapi/config/whitelabel`). El handler ya llama solo a api-ia y **no llama a MCP** para whitelabel. No hace falta `SKIP_WHITELABEL_VIA_MCP` cuando se usa Opción B. |

### Checklist rápido – Activar Opción B

1. Backend api-ia: exponer `GET /webapi/config/whitelabel?development=<development>` con headers `Authorization`, `X-Development`; respuesta JSON con `apiKey` o `aiApiKey` (y opcionalmente `model`, `provider`).
2. Front: definir `API_IA_WHITELABEL_URL=https://api-ia.<dominio>/webapi/config/whitelabel` en el entorno de la app web.
3. Verificar: el Copilot en fallback debe usar credenciales sin que el front haga ninguna llamada a MCP.
