# Informe para backend (api-ia): qué implementar para que el front deje de llamar a API2

**Objetivo:** Que **AppBodasdehoy** y **Copilot/LobeChat** no llamen a API2. Todo lo que hoy piden a API2 debe estar en **api-ia** (api-ia habla con API2 u otros backends por detrás).

Este documento es la petición formal al equipo de api-ia para implementar los siguientes puntos. Cuando estén listos, el front eliminará las llamadas directas a API2.

---

## Fase 1 – AppBodasdehoy (prioridad alta)

Para que **AppBodasdehoy** deje de usar API2 por completo, api-ia debe exponer lo siguiente.

### 1.1 Endpoint de historial de chat

**Necesidad:** Hoy el front (vía Next.js) llama a API2 `getChatMessages(sessionId, limit)` para mostrar el historial del Copilot. AppBodasdehoy no debe llamar a API2.

**Petición:** Exponer en api-ia un endpoint que devuelva el historial de mensajes de una sesión, llamando api-ia internamente a API2 (o a vuestro almacén).

**Propuesta de contrato:**

- **Método y ruta:** `GET /webapi/chat/history` (o la que prefiráis).
- **Query params:** `sessionId` (obligatorio), `limit` (opcional, default 50).
- **Headers:** Los mismos que para chat: `Authorization: Bearer <JWT>`, `X-Development`.
- **Respuesta:** `200 OK` con JSON: `{ "messages": [ { "id", "role", "content", "createdAt", "metadata?" } ] }`. Mismo formato que la query actual `getChatMessages` de API2 (para no cambiar el front más de lo necesario).

**Cuando esté implementado:** En el front ya está preparado: si definimos la variable de entorno `API_IA_CHAT_HISTORY_URL` (ej. `https://api-ia.bodasdehoy.com/webapi/chat/history`), la ruta `/api/copilot/chat-history` llamará a api-ia y dejará de llamar a API2. No hará falta tocar código; solo configurar la env.

---

### 1.2 Fallback / whitelabel sin que el front llame a API2

**Necesidad:** Cuando api-ia no está disponible, el handler de chat en Next.js llama a API2 `getWhiteLabelConfig(development, supportKey)` para obtener API key y llamar a OpenAI/Anthropic directo. AppBodasdehoy no debe llamar a API2.

**Petición:** Una de las dos (o ambas). **Recomendamos Opción B.**

- **Opción A:** api-ia asume siempre el fallback internamente (si no podéis responder, no exponéis; el front muestra “Servicio no disponible” y no hace fallback a otro proveedor). En ese caso el front eliminará por completo el código que llama a `getWhiteLabelConfig` en API2.
- **Opción B:** api-ia expone un endpoint tipo `GET /webapi/config/whitelabel?development=...` (o similar) que devuelva la config whitelabel (incluida API key para IA), llamando vosotros a API2 por detrás. El front entonces llamaría solo a api-ia para ese fallback.

**Recomendamos Opción B.** El front ya está preparado: basta con que api-ia exponga el endpoint y definir `API_IA_WHITELABEL_URL`; no hace falta tocar código.

**Contrato Opción B – Endpoint whitelabel (api-ia):** `GET /webapi/config/whitelabel?development=<development>`, headers `Authorization`, `X-Development`. Respuesta 200 JSON: `apiKey` o `aiApiKey` (obligatorio), y opcionalmente `model`/`aiModel`, `provider`/`aiProvider`. Ejemplo: `{ "aiApiKey": "sk-...", "aiModel": "gpt-4o-mini", "aiProvider": "openai" }`. Con eso el handler llama solo a api-ia y **no llama a API2**.

---

## Fase 2 – Copilot / LobeChat (prioridad media; aclarar alcance)

En **Copilot/LobeChat** hoy el front llama a API2 para: auth (JWT, login), facturación (invoices), wallet, invite tokens, credenciales IA (aiCredentials), sesiones/chat (GraphQL), whitelabel. El diseño objetivo es que **esas llamadas no existan** y que lo que corresponda esté en api-ia (o en un único backend que el front use).

**Dudas para el backend:**

1. **Alcance:** ¿api-ia debe ser el único backend que el front de Copilot/LobeChat use para todo (auth, billing, wallet, historial, sesiones), o solo para lo “de IA” (chat, historial, credenciales IA)? Si es solo “de IA”, ¿quién debe exponer auth/billing/wallet: otro servicio o sigue siendo API2 y se acepta que Copilot siga llamando a API2 para eso?
2. **Auth (JWT):** ¿Hay o habrá en api-ia un flujo de login / intercambio de token (p. ej. Firebase → JWT) para que el front no llame a API2 para auth?
3. **Billing / wallet / invoices:** ¿Estos dominios los debe exponer api-ia (proxy a API2) o se mantienen en API2 y el front de Copilot sigue llamando a API2 solo para eso?

**Petición:** Que el backend confirme el alcance (qué debe exponer api-ia y qué puede seguir en API2 con el front llamando a API2). Con eso el front podrá planificar la migración de los usos listados en **docs/LISTADO-LLAMADAS-API2-AUDITORIA.md** (sección 2).

---

## Resumen de peticiones

| # | Petición | Prioridad | Para qué app |
|---|----------|-----------|--------------|
| 1 | Endpoint historial: `GET /webapi/chat/history?sessionId=...&limit=...` con respuesta `{ messages: [...] }` | Alta | AppBodasdehoy dejar de llamar a API2 getChatMessages |
| 2 | Fallback/whitelabel: **opción B recomendada** (endpoint en api-ia). Opción A: sin fallback con `SKIP_WHITELABEL_VIA_API2` | Alta | AppBodasdehoy dejar de llamar a API2 getWhiteLabelConfig |
| 3 | Aclarar alcance para Copilot: ¿api-ia expone auth, billing, wallet, etc., o solo IA? | Media | Saber qué migrar en Copilot/LobeChat |

---

## Referencias en el repo

- **Listado completo de llamadas a API2:** docs/LISTADO-LLAMADAS-API2-AUDITORIA.md  
- **Diseño objetivo:** AppBodasdehoy no usa API2; lo que corresponda en api-ia.  
- **Preguntas anteriores (datos reales, tests):** docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md  

Cuando tengamos confirmación o los endpoints listos, actualizaremos el front y eliminaremos las llamadas a API2 según este informe.

---

## Pasos cuando el backend responda / implemente

| Petición | Acción en el front (sin tocar código si se usan env) |
|----------|------------------------------------------------------|
| **1.1 Historial** | Definir `API_IA_CHAT_HISTORY_URL` (ej. `https://api-ia.bodasdehoy.com/webapi/chat/history`). La ruta `/api/copilot/chat-history` ya usa api-ia cuando está definida. |
| **1.2 Opción A** (sin fallback desde front) | Definir `SKIP_WHITELABEL_VIA_API2=true`. El handler de chat ya evita llamar a API2 para whitelabel; devuelve 503 si api-ia no responde. |
| **1.2 Opción B (recomendada)** | 1) Implementar en api-ia `GET /webapi/config/whitelabel?development=...` según el contrato de la sección 1.2. 2) En el front definir `API_IA_WHITELABEL_URL` (ej. `https://api-ia.bodasdehoy.com/webapi/config/whitelabel`). El handler ya llama solo a api-ia y **no llama a API2** para whitelabel. No hace falta `SKIP_WHITELABEL_VIA_API2` cuando se usa Opción B. |

### Checklist rápido – Activar Opción B

1. Backend api-ia: exponer `GET /webapi/config/whitelabel?development=<development>` con headers `Authorization`, `X-Development`; respuesta JSON con `apiKey` o `aiApiKey` (y opcionalmente `model`, `provider`).
2. Front: definir `API_IA_WHITELABEL_URL=https://api-ia.<dominio>/webapi/config/whitelabel` en el entorno de la app web.
3. Verificar: el Copilot en fallback debe usar credenciales sin que el front haga ninguna llamada a API2.
