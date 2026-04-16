# Listado (auditoría): llamadas a API2 en el monorepo

**Diseño objetivo:**  
- **AppBodasdehoy** no debe usar ni llamar a API2.  
- Las llamadas a API2 que hoy hace **Copilot/LobeChat** no deberían existir desde el front: lo que corresponda debe estar en **api-ia** (api-ia es quien debe hablar con API2 u otros backends).

Este documento lista **todas** las llamadas a API2 en el código para poder eliminarlas o moverlas a api-ia.

---

## 1. AppBodasdehoy (apps/web) – llamadas a API2

En AppBodasdehoy **no** se debería usar API2. Hoy hay **2 usos** relacionados con el Copilot:

| # | Archivo | Uso | Qué hace |
|---|---------|-----|----------|
| 1 | `pages/api/copilot/chat-history.ts` | `fetch(API2_GRAPHQL, ...)` | Llama a API2 `getChatMessages(sessionId, limit)` para **leer historial** del Copilot. |
| 2 | `pages/api/copilot/chat.ts` | `getWhitelabelApiKey()` → `fetch(API2_GRAPHQL_URL, ...)` | Llama a API2 `getWhiteLabelConfig(development, supportKey)` para obtener API key cuando **api-ia falla** (fallback a OpenAI/Anthropic directo). |

**Flujo actual:**  
- Cliente → `getChatHistory()` → `/api/copilot/chat-history` → **API2** getChatMessages.  
- Si api-ia no responde, el handler de chat → **API2** getWhiteLabelConfig → llama a OpenAI/Anthropic.

**Objetivo:**  
- Historial: que **api-ia** exponga algo tipo `GET /webapi/chat/history?sessionId=...` (api-ia internamente llama a API2). El front solo llamaría a api-ia; se puede **eliminar** la ruta que llama a API2 en `chat-history.ts` y que el front use la de api-ia.  
- Whitelabel/fallback: que **api-ia** gestione el fallback o que no se use API2 desde el front; **eliminar** `getWhitelabelApiKey()` que llama a API2 en `chat.ts`.

**Otros archivos que solo mencionan API2 (comentarios, tests, docs):**  
- `services/copilotChat.ts`: comentarios y llamada a `/api/copilot/chat-history` (esa ruta es la que llama a API2; ver punto 1).  
- `pages/api/copilot/__tests__/chat-history.test.ts`, `services/__tests__/copilotChat.test.ts`, `__fixtures__/copilot.ts`: tests/fixtures de la forma de API2.  
- `context/AuthContext.tsx`: solo comentario (getGeoInfo en api.bodasdehoy, no API2).  
- `api.js`: `fetchApiViewConfig` usa ahora la misma URL que el resto (`NEXT_PUBLIC_API2_GRAPHQL_URL` o `https://api2.eventosorganizador.com/graphql`). La función **no se usa** en ningún flujo; es legacy. Ver comentario en api.js.

---

## 2. Copilot / LobeChat (apps/copilot) – llamadas a API2

En Copilot/LobeChat las llamadas a API2 **no deberían existir** desde el front; lo que corresponda debe estar en api-ia. Hoy hay uso amplio de API2:

### 2.1 Cliente GraphQL API2

| Archivo | Uso |
|---------|-----|
| `src/services/api2/client.ts` | Define `API2_GRAPHQL_URL` y `API2Client` que hace `fetch(API2_GRAPHQL_URL, ...)` para todas las queries. |
| `src/services/api2/auth.ts` | Login contra API2 (GraphQL) para obtener JWT. |
| `src/services/api2/invite.ts` | `consumeInviteToken` (invite tokens). |
| `src/services/api2/invoices.ts` | Facturas: getInvoices, getInvoiceById, getInvoicePDF, getPaymentHistory, getUserSubscription, getUsageStats. |
| `src/services/api2/wallet.ts` | Wallet: getBalance, checkBalance, getServicePrice, getTransactions, createRechargeSession, checkAndConsume. |
| `src/services/api2/aiCredentials.ts` | Credenciales IA (whitelabel). |

### 2.2 Rutas de backend (Next) que llaman a API2

| Archivo | Uso |
|---------|-----|
| `src/app/(backend)/api/auth/login-with-jwt/route.ts` | Resuelve URL GraphQL (API2_GRAPHQL_URL), llama a API2 para generateCRMToken / login. |
| `src/app/(backend)/api/auth/login-with-google/route.ts` | Igual: llama a API2 GraphQL para auth. |

### 2.3 Componentes / hooks que usan servicios api2

| Archivo | Uso |
|---------|-----|
| `src/hooks/useBilling.ts` | Usa `@/services/api2/invoices`. |
| `src/hooks/useWallet.ts` | Usa `@/services/api2/wallet`. |
| `src/components/billing/InvoiceDetail.tsx` | Importa constantes de `@/services/api2/invoices`. |
| `src/components/credits/UsageMetrics.tsx`, `ConsumptionChart.tsx` | Importan tipos/UsageStats de `@/services/api2/invoices`. |
| `src/app/[variants]/(main)/settings/billing/transactions/page.tsx` | Importa tipo de `@/services/api2/wallet`. |
| `src/app/[variants]/(main)/settings/billing/index.tsx` | Importa `@/services/api2/invoices`. |
| `src/components/Wallet/RechargeModal.tsx` | Importa tipo de `@/services/api2/wallet`. |
| `src/app/dev-login/page.tsx` | Importa `loginAPI2` de `@/services/api2/auth`. |
| `src/features/EventosAutoAuth/index.tsx` | `consumeInviteToken` de `@/services/api2/invite`; `fetchAICredentials` de `@/services/api2/aiCredentials`. |
| `src/config/eventos-api.ts` | Importa `loginWithFirebase` de `@/services/api2/auth`. |

### 2.4 Otros archivos que referencian API2

| Archivo | Uso |
|---------|-----|
| `src/app/[variants]/layout.tsx` | `preconnect` a `https://api2.eventosorganizador.com`. |
| `src/utils/developmentDetector.ts` | `graphqlEndpoint: 'https://api2.eventosorganizador.com/graphql'` por whitelabel. |
| `src/utils/whitelabelDomainSync.ts` | Obtiene whitelabel desde API2. |
| `src/libs/graphql/wedding.ts` | Comentario endpoint API2. |
| `src/store/chat/slices/externalChat/action.ts` | Queries a “api2” (sesiones, eventos, getUserByEmail, etc.) vía Apollo/GraphQL. |
| `src/services/firebase-auth/index.ts` | Intercambio Firebase → JWT de API2, guarda `api2_jwt_token`. |
| `src/libs/trpc/lambda/context.ts` | Auth desde cookie API2 (dev-user-config). |

---

## 3. Resumen por app

| App | Nº de sitios que llaman a API2 | Objetivo |
|-----|--------------------------------|----------|
| **AppBodasdehoy** | 2 (chat-history, getWhitelabelApiKey en chat) | Eliminar: no usar API2; historial y fallback vía api-ia. |
| **Copilot/LobeChat** | Muchos (auth, billing, wallet, invoices, invite, aiCredentials, sesiones, whitelabel) | Esas llamadas no deberían existir; lo que corresponda debe estar en api-ia. |

---

## 4. Acciones recomendadas (alineadas con “todo en api-ia”)

1. **api-ia** debe exponer todo lo que hoy los fronts piden a API2 (o al menos lo relacionado con Copilot/IA):  
   - Historial de chat (ej. `GET /webapi/chat/history?sessionId=...`).  
   - Configuración whitelabel / credenciales IA (para que el front no llame a getWhiteLabelConfig a API2).  
   - Lo que corresponda de auth, billing, wallet, etc. para Copilot (si api-ia debe ser el único backend que el front use).

2. **AppBodasdehoy:**  
   - Dejar de llamar a API2:  
     - Historial: definir `API_IA_CHAT_HISTORY_URL`; `/api/copilot/chat-history` ya llama a api-ia cuando está definida.  
     - Whitelabel opción A: definir `SKIP_WHITELABEL_VIA_API2=true`. Opción B: definir `API_IA_WHITELABEL_URL`; el handler ya llama solo a api-ia para whitelabel cuando está definida (no llama a API2).  
   - `api.js`: URL legacy corregida (HTTPS + env); `fetchApiViewConfig` sigue sin usarse en ningún flujo (se puede eliminar si se confirma).

3. **Copilot/LobeChat:**  
   - Sustituir cada uso de `@/services/api2/*` y de rutas que llaman a API2 por llamadas a **api-ia** (o al backend que se defina como único).  
   - Mientras api-ia no exponga esos endpoints, este listado sirve como **inventario de deuda**: todo lo aquí listado son llamadas que “no deberían existir” y que hay que migrar a api-ia.

---

## 5. Referencias

- **Diseño objetivo:** AppBodasdehoy no usa API2; Copilot/LobeChat no deberían llamar a API2; api-ia centraliza y es quien habla con API2.  
- **Peticiones a api-ia:** docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md (incluye pregunta opcional de endpoint de historial en api-ia).  
- **Análisis previo:** docs/ANALISIS-USO-API2-Y-APIS.md (antes de este diseño objetivo).
