# Análisis: cuándo y por qué se usa MCP (y otras APIs)

Resumen de **qué backend usa cada app** y **en qué casos** se usa MCP frente a api-ia o api.bodasdehoy.com.

**Diseño objetivo:** AppBodasdehoy no debe usar MCP directo; las llamadas a MCP directo en Copilot/LobeChat no deberían existir (debe estar en IA). Listado completo de llamadas a MCP y acciones recomendadas: **docs/LISTADO-LLAMADAS-MCP-AUDITORIA.md**.

---

## 1. Tres backends distintos

| Backend | URL típica | Qué es | Quién lo usa |
|---------|------------|--------|--------------|
| **api.bodasdehoy.com** | https://api.bodasdehoy.com (GraphQL) | API principal del **organizador** (eventos, invitados, mesas, itinerario, etc.). | **Solo AppBodasdehoy** (apps/web), vía `/api/proxy-bodas/graphql`. |
| **api-ia** | `API_IA_URL` (ej. https://api-ia.bodasdehoy.com) | Backend de **IA** (chat, streaming, herramientas). **Él** es quien escribe los mensajes del chat en MCP. | AppBodasdehoy (proxy `/api/copilot/chat` → api-ia). LobeChat también llama a api-ia para el chat. |
| **MCP (GraphQL)** | https://api3-mcp-graphql.eventosorganizador.com/graphql | API GraphQL de **negocio compartido** (whitelabels, facturación, wallet, auth JWT, **persistencia de mensajes del chat**). | **api-ia** (escribe mensajes). **AppBodasdehoy** (solo lectura: historial Copilot + whitelabel fallback). **LobeChat** (auth, billing, wallet, sesiones, etc.). |

**Conclusión:** MCP **no** es api-ia ni “apunta” a api-ia. Son dos servicios separados. **api-ia** es quien **habla con MCP** para guardar los mensajes del chat; las apps (web y copilot) usan MCP para otras cosas según la tabla siguiente.

---

## 2. AppBodasdehoy (apps/web) – qué API usa y para qué

| Caso de uso | API que usa | Dónde en código |
|-------------|-------------|------------------|
| Eventos, invitados, mesas, itinerario, etc. | **api.bodasdehoy.com** (vía `/api/proxy-bodas/graphql`) | api.js, _app.tsx, Fetching, proxy-bodas/[...path].ts |
| Enviar mensaje al Copilot / streaming | **api-ia** (vía `/api/copilot/chat` → proxy) | services/copilotChat.ts → /api/copilot/chat → chat.ts → PYTHON_BACKEND_URL |
| Cargar historial del Copilot | **MCP** (query `getChatMessages`) | getChatHistory() → /api/copilot/chat-history → chat-history.ts → MCP GraphQL URL (canon: `API_MCP_GRAPHQL_URL`) |
| Fallback cuando api-ia no está (obtener API key whitelabel) | **MCP** (query `getWhiteLabelConfig`) | pages/api/copilot/chat.ts → getWhitelabelApiKey() → MCP GraphQL URL (canon: `API_MCP_GRAPHQL_URL`) |

En **AppBodasdehoy**, MCP se usa **solo** para:
1. **Historial del Copilot** (leer mensajes guardados; api-ia es quien los escribe en MCP).
2. **Config whitelabel** cuando api-ia falla (para poder hacer fallback a OpenAI/Anthropic directo).

El resto de la app (pantallas de evento, invitados, etc.) usa **api.bodasdehoy.com**, no MCP.

---

## 3. LobeChat / Copilot (apps/copilot) – qué API usa y para qué

En la app **Copilot** (LobeChat / chat-ia), la propia app **sí** habla con **MCP** directamente para muchas cosas (no solo “a través de api-ia”):

| Caso de uso | API que usa | Dónde en código |
|-------------|-------------|------------------|
| Login / JWT (Firebase → JWT, generateCRMToken) | **MCP** | firebase-auth/index.ts, login-with-jwt, login-with-google |
| Facturación, facturas, suscripción, uso | **MCP** | src/services/mcpApi/invoices.ts, useBilling |
| Wallet, saldo, transacciones, recargas | **MCP** | src/services/mcpApi/wallet.ts, useWallet |
| Credenciales IA (whitelabel) | **MCP** (o backend que a su vez usa MCP) | src/services/mcpApi/aiCredentials.ts |
| Sesiones/chat en LobeChat (getSessions, etc.) | **MCP** (GraphQL) | store/chat/slices/externalChat/action.ts (cliente → MCP) |
| Whitelabel / dominio | **MCP** | whitelabelDomainSync.ts, developmentDetector.ts |
| Invite tokens | **MCP** | src/services/mcpApi/invite.ts |

El **chat en vivo** (enviar mensaje al modelo, streaming) en LobeChat lo hace **api-ia**; pero listar sesiones, auth, billing, etc., lo hace la app Copilot contra **MCP** directamente.

**Resumen LobeChat:** MCP se usa para auth, billing, wallet, sesiones, whitelabel. api-ia se usa para el contenido del chat (modelo, streaming). En Copilot **sí** se usa MCP, y no “solo api-ia”.

---

## 4. api-ia – qué hace con MCP

**api-ia** (backend Python) es el único que **escribe** mensajes del chat en MCP:

- Al finalizar cada respuesta (evento `event: done`), api-ia llama a MCP (mutation tipo `CHAT_saveMessage`) para guardar user + assistant.
- El front **nunca** escribe en MCP para el chat; solo **lee** historial (getChatMessages) desde AppBodasdehoy vía `/api/copilot/chat-history`.

---

## 5. Resumen en una frase por app

| App | Uso de API2 |
|-----|-------------|
| **AppBodasdehoy** | Solo para **Copilot**: leer historial (getChatMessages) y, si api-ia falla, leer getWhiteLabelConfig. El resto de la app usa **api.bodasdehoy.com**. |
| **LobeChat (Copilot)** | Uso amplio de **MCP**: auth, billing, wallet, sesiones, whitelabel. El chat en vivo va a **api-ia**; la persistencia de mensajes la hace api-ia en MCP. |
| **api-ia** | **Escribe** en MCP los mensajes del chat. No expone “historial” al front; el front que quiera historial lo lee de MCP (o en el futuro de un endpoint de api-ia que internamente llame a MCP). |

---

## 6. Por qué en AppBodasdehoy usamos MCP para historial

Por acuerdo con el equipo de api-ia: los mensajes se guardan en MCP y el front debe **leer** historial con la query `getChatMessages` en MCP. Por eso en apps/web tenemos:

- `getChatHistory()` → llama a `/api/copilot/chat-history` → esa ruta hace proxy a **MCP** (getChatMessages).

Si en el futuro api-ia expone algo tipo `GET /webapi/chat/history?sessionId=...` que internamente llame a MCP, se podría cambiar el front para **solo** hablar con api-ia y dejar de llamar a MCP desde AppBodasdehoy para el historial (ver docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md).
