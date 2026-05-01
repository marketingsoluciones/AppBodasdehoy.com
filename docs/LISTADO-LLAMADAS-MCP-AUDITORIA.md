# Listado (auditoría): llamadas a MCP en el monorepo

**Diseño objetivo:**  
- El repo no debe depender de nombres versionados tipo “API2/API3”.  
- Las apps deben hablar con **MCP** (backend GraphQL) y con **API IA** cuando corresponda, evitando “rutas mágicas” y nombres legacy.

Este documento lista **todas** las referencias/llamadas a MCP (legacy: “API2”) en el código para poder migrarlas a naming canónico y detectar deuda.

---

## 1. AppEventos (apps/appEventos) – llamadas a MCP

En AppEventos hay **2 usos** relacionados con el Copilot:

| # | Archivo | Uso | Qué hace |
|---|---------|-----|----------|
| 1 | `apps/appEventos/pages/api/copilot/chat-history.ts` | `fetch(MCP_GRAPHQL, ...)` | Llama a MCP `getChatMessages(sessionId, limit)` para **leer historial** del Copilot. |
| 2 | `apps/appEventos/pages/api/copilot/chat.ts` | `getWhitelabelApiKey()` → `fetch(MCP_GRAPHQL_URL, ...)` | Llama a MCP `getWhiteLabelConfig(development, supportKey)` para obtener API key cuando **api-ia falla** (fallback a OpenAI/Anthropic directo). |

**Flujo actual:**  
- Cliente → `getChatHistory()` → `/api/copilot/chat-history` → **MCP** getChatMessages.  
- Si api-ia no responde, el handler de chat → **MCP** getWhiteLabelConfig → llama a OpenAI/Anthropic.

**Objetivo:**  
- Historial: que **api-ia** exponga algo tipo `GET /webapi/chat/history?sessionId=...` (api-ia internamente llama a MCP). El front solo llamaría a api-ia; se puede **eliminar** la ruta que llama a MCP en `chat-history.ts` y que el front use la de api-ia.  
- Whitelabel/fallback: que **api-ia** gestione el fallback o que no se use MCP desde el front; **eliminar** `getWhitelabelApiKey()` que llama a MCP en `chat.ts`.

**Otros archivos que solo mencionan MCP (comentarios, tests, docs):**  
- `apps/appEventos/services/copilotChat.ts`: comentarios y llamada a `/api/copilot/chat-history` (esa ruta es la que llama a MCP; ver punto 1).  
- `apps/appEventos/pages/api/copilot/__tests__/chat-history.test.ts`, `apps/appEventos/services/__tests__/copilotChat.test.ts`, `apps/appEventos/__fixtures__/copilot.ts`: tests/fixtures de la forma de MCP.  
- `apps/appEventos/context/AuthContext.tsx`: solo comentario (getGeoInfo en api.bodasdehoy, no MCP).  
- `apps/appEventos/api.js`: `fetchApiViewConfig` es legacy y no se usa en ningún flujo.

---

## 2. chat-ia (apps/chat-ia) – llamadas a MCP

En chat-ia hay uso amplio de MCP (GraphQL) para features como auth, billing, wallet, etc.

### 2.1 Cliente GraphQL MCP

| Archivo | Uso |
|---------|-----|
| `apps/chat-ia/src/services/mcpApi/client.ts` | Resuelve la URL GraphQL de MCP y hace `fetch(...)` para todas las queries. |
| `apps/chat-ia/src/services/mcpApi/auth.ts` | Login contra MCP (GraphQL) para obtener JWT. |
| `apps/chat-ia/src/services/mcpApi/invite.ts` | `consumeInviteToken` (invite tokens). |
| `apps/chat-ia/src/services/mcpApi/invoices.ts` | Facturas: getInvoices, getInvoiceById, getInvoicePDF, getPaymentHistory, getUserSubscription, getUsageStats. |
| `apps/chat-ia/src/services/mcpApi/wallet.ts` | Wallet: getBalance, checkBalance, getServicePrice, getTransactions, createRechargeSession, checkAndConsume. |
| `apps/chat-ia/src/services/mcpApi/aiCredentials.ts` | Credenciales IA (whitelabel). |

### 2.2 Rutas de backend (Next) que llaman a MCP

| Archivo | Uso |
|---------|-----|
| `apps/chat-ia/src/app/(backend)/api/auth/login-with-jwt/route.ts` | Resuelve URL GraphQL (MCP) y llama a MCP para generateCRMToken / login. |
| `apps/chat-ia/src/app/(backend)/api/auth/login-with-google/route.ts` | Igual: llama a MCP GraphQL para auth. |

### 2.3 Componentes / hooks que usan servicios mcpApi

| Archivo | Uso |
|---------|-----|
| `apps/chat-ia/src/hooks/useBilling.ts` | Usa `@/services/mcpApi/invoices`. |
| `apps/chat-ia/src/hooks/useWallet.ts` | Usa `@/services/mcpApi/wallet`. |
| `apps/chat-ia/src/components/billing/InvoiceDetail.tsx` | Importa constantes de `@/services/mcpApi/invoices`. |
| `apps/chat-ia/src/components/credits/UsageMetrics.tsx`, `ConsumptionChart.tsx` | Importan tipos/UsageStats de `@/services/mcpApi/invoices`. |
| `apps/chat-ia/src/app/[variants]/(main)/settings/billing/transactions/page.tsx` | Importa tipo de `@/services/mcpApi/wallet`. |
| `apps/chat-ia/src/app/[variants]/(main)/settings/billing/index.tsx` | Importa `@/services/mcpApi/invoices`. |
| `apps/chat-ia/src/components/Wallet/RechargeModal.tsx` | Importa tipo de `@/services/mcpApi/wallet`. |
| `apps/chat-ia/src/app/dev-login/page.tsx` | Importa login de `@/services/mcpApi/auth`. |
| `apps/chat-ia/src/features/EventosAutoAuth/index.tsx` | `consumeInviteToken` de `@/services/mcpApi/invite`; `fetchAICredentials` de `@/services/mcpApi/aiCredentials`. |
| `apps/chat-ia/src/config/eventos-api.ts` | Importa `loginWithFirebase` de `@/services/mcpApi/auth`. |

### 2.4 Otros archivos que referencian MCP

| Archivo | Uso |
|---------|-----|
| `apps/chat-ia/src/app/[variants]/layout.tsx` | `preconnect` a MCP (según env). |
| `apps/chat-ia/src/utils/developmentDetector.ts` | Resuelve endpoint GraphQL de MCP por whitelabel. |
| `apps/chat-ia/src/utils/whitelabelDomainSync.ts` | Obtiene whitelabel desde MCP. |
| `apps/chat-ia/src/store/chat/slices/externalChat/action.ts` | Queries a MCP (sesiones, eventos, getUserByEmail, etc.) vía Apollo/GraphQL. |
| `apps/chat-ia/src/services/firebase-auth/index.ts` | Intercambio Firebase → JWT de MCP (guarda `mcp_jwt_token` y mantiene legacy `api2_jwt_token`). |
| `apps/chat-ia/src/libs/trpc/lambda/context.ts` | Auth desde cookie JWT (dev-user-config / mcp_jwt). |

---

## 3. Resumen por app

| App | Nº de sitios que llaman a API2 | Objetivo |
|-----|--------------------------------|----------|
| **AppEventos** | 2 (chat-history, getWhitelabelApiKey en chat) | Evitar legacy “API2”; si se migra historial/whitelabel a api-ia, eliminar llamadas directas a MCP desde esas rutas. |
| **chat-ia** | Muchos (auth, billing, wallet, invoices, invite, aiCredentials, sesiones, whitelabel) | Mantener naming MCP canónico y decidir qué parte se delega a API IA. |

---

## 4. Acciones recomendadas (alineadas con “MCP/IA sin nombres versionados”)

1. **api-ia** debe exponer lo que tenga sentido que el front no pida a MCP directamente (si se decide centralizar IA):  
   - Historial de chat (ej. `GET /webapi/chat/history?sessionId=...`).  
   - Configuración whitelabel / credenciales IA (para que el front no llame a getWhiteLabelConfig a MCP).  
   - Lo que corresponda de auth/billing/wallet si se decide que API IA sea el único backend para esas piezas.

2. **AppEventos:**  
   - Evitar legacy “API2” en variables y naming; usar variables canónicas de MCP (ver `docs/API-ENDPOINTS-SSH.md`).  
   - Historial/whitelabel: si se decide moverlo a api-ia, dejar de llamar a MCP desde esas rutas.

3. **chat-ia:**  
   - Mantener `@/services/mcpApi/*` como capa única para MCP (evita “API2” por todas partes).  
   - Si se decide que api-ia centraliza ciertas piezas, migrar esas llamadas desde `mcpApi` hacia api-ia.

---

## 5. Referencias

- **Diseño objetivo:** naming MCP/IA (sin “API2/API3”) y rutas claras por responsabilidad.  
- **Peticiones a api-ia:** docs/PREGUNTAS-API-IA-TEST-DATOS-REALES.md (incluye pregunta opcional de endpoint de historial en api-ia).  
- **Análisis previo:** docs/ANALISIS-USO-MCP-Y-APIS.md (antes de este diseño objetivo).
