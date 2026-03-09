# Análisis: cuándo y por qué se usa API2 (y otras APIs)

Resumen de **qué backend usa cada app** y **en qué casos** se usa API2 frente a api-ia o api.bodasdehoy.com.

**Diseño objetivo:** AppBodasdehoy no debe usar API2; las llamadas a API2 en Copilot/LobeChat no deberían existir (debe estar en api-ia). Listado completo de llamadas a API2 y acciones recomendadas: **docs/LISTADO-LLAMADAS-API2-AUDITORIA.md**.

---

## 1. Tres backends distintos

| Backend | URL típica | Qué es | Quién lo usa |
|---------|------------|--------|--------------|
| **api.bodasdehoy.com** | https://api.bodasdehoy.com (GraphQL) | API principal del **organizador** (eventos, invitados, mesas, itinerario, etc.). | **Solo AppBodasdehoy** (apps/web), vía `/api/proxy-bodas/graphql`. |
| **api-ia** | PYTHON_BACKEND_URL (ej. api-ia.bodasdehoy.com) | Backend de **IA** (chat, streaming, herramientas). **Él** es quien escribe los mensajes del chat en API2. | AppBodasdehoy (proxy `/api/copilot/chat` → api-ia). LobeChat también llama a api-ia para el chat. |
| **API2** | api2.eventosorganizador.com/graphql | API GraphQL de **negocio compartido** (whitelabels, facturación, wallet, auth JWT, **persistencia de mensajes del chat**). | **api-ia** (escribe mensajes). **AppBodasdehoy** (solo lectura: historial Copilot + whitelabel fallback). **LobeChat** (auth, billing, wallet, sesiones, etc.). |

**Conclusión:** API2 **no** es api-ia ni “apunta” a api-ia. Son dos servicios separados. **api-ia** es quien **habla con API2** para guardar los mensajes del chat; las apps (web y copilot) usan API2 para otras cosas según la tabla siguiente.

---

## 2. AppBodasdehoy (apps/web) – qué API usa y para qué

| Caso de uso | API que usa | Dónde en código |
|-------------|-------------|------------------|
| Eventos, invitados, mesas, itinerario, etc. | **api.bodasdehoy.com** (vía `/api/proxy-bodas/graphql`) | api.js, _app.tsx, Fetching, proxy-bodas/[...path].ts |
| Enviar mensaje al Copilot / streaming | **api-ia** (vía `/api/copilot/chat` → proxy) | services/copilotChat.ts → /api/copilot/chat → chat.ts → PYTHON_BACKEND_URL |
| Cargar historial del Copilot | **API2** (query `getChatMessages`) | getChatHistory() → /api/copilot/chat-history → chat-history.ts → API2_GRAPHQL_URL |
| Fallback cuando api-ia no está (obtener API key whitelabel) | **API2** (query `getWhiteLabelConfig`) | pages/api/copilot/chat.ts → getWhitelabelApiKey() → API2_GRAPHQL_URL |

En **AppBodasdehoy**, API2 se usa **solo** para:
1. **Historial del Copilot** (leer mensajes guardados; api-ia es quien los escribe en API2).
2. **Config whitelabel** cuando api-ia falla (para poder hacer fallback a OpenAI/Anthropic directo).

El resto de la app (pantallas de evento, invitados, etc.) usa **api.bodasdehoy.com**, no API2.

---

## 3. LobeChat / Copilot (apps/copilot) – qué API usa y para qué

En la app **Copilot** (LobeChat), la propia app **sí** habla con **API2** directamente para muchas cosas (no solo “a través de api-ia”):

| Caso de uso | API que usa | Dónde en código |
|-------------|-------------|------------------|
| Login / JWT (Firebase → JWT, generateCRMToken) | **API2** | firebase-auth/index.ts, login-with-jwt, login-with-google |
| Facturación, facturas, suscripción, uso | **API2** | services/api2/invoices.ts, useBilling |
| Wallet, saldo, transacciones, recargas | **API2** | services/api2/wallet.ts, useWallet |
| Credenciales IA (whitelabel) | **API2** (o backend que a su vez usa API2) | services/api2/aiCredentials.ts |
| Sesiones/chat en LobeChat (getSessions, etc.) | **API2** (GraphQL) | store/chat/slices/externalChat/action.ts (apolloClient → API2) |
| Whitelabel / dominio | **API2** | whitelabelDomainSync.ts, developmentDetector.ts |
| Invite tokens | **API2** | services/api2/invite.ts |

El **chat en vivo** (enviar mensaje al modelo, streaming) en LobeChat lo hace **api-ia**; pero listar sesiones, auth, billing, etc., lo hace la app Copilot contra **API2** directamente.

**Resumen LobeChat:** API2 se usa para auth, billing, wallet, sesiones, whitelabel. api-ia se usa para el contenido del chat (modelo, streaming). En Copilot **sí** se usa API2, y no “solo api-ia”.

---

## 4. api-ia – qué hace con API2

**api-ia** (backend Python) es el único que **escribe** mensajes del chat en API2:

- Al finalizar cada respuesta (evento `event: done`), api-ia llama a API2 (mutation tipo `CHAT_saveMessage`) para guardar user + assistant.
- El front **nunca** escribe en API2 para el chat; solo **lee** historial (getChatMessages) desde AppBodasdehoy vía `/api/copilot/chat-history`.

---

## 5. Resumen en una frase por app

| App | Uso de API2 |
|-----|-------------|
| **AppBodasdehoy** | Solo para **Copilot**: leer historial (getChatMessages) y, si api-ia falla, leer getWhiteLabelConfig. El resto de la app usa **api.bodasdehoy.com**. |
| **LobeChat (Copilot)** | Uso amplio de **API2**: auth, billing, wallet, sesiones, whitelabel. El chat en vivo va a **api-ia**; la persistencia de mensajes la hace api-ia en API2. |
| **api-ia** | **Escribe** en API2 los mensajes del chat. No expone “historial” al front; el front que quiera historial lo lee de API2 (o en el futuro de un endpoint de api-ia que internamente llame a API2). |

---

## 6. Por qué en AppBodasdehoy usamos API2 para historial

Por acuerdo con el equipo de api-ia: los mensajes se guardan en API2 y el front debe **leer** historial con la query `getChatMessages` en API2. Por eso en apps/web tenemos:

- `getChatHistory()` → llama a `/api/copilot/chat-history` → esa ruta hace proxy a **API2** (getChatMessages).

Si en el futuro api-ia expone algo tipo `GET /webapi/chat/history?sessionId=...` que internamente llame a API2, se podría cambiar el front para **solo** hablar con api-ia y dejar de llamar a API2 desde AppBodasdehoy para el historial (ver docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md).
