# Quién habla con qué API

**Resumen:** El frontend habla con dos backends, ambos referenciados por variables genéricas sin versión.

- **API IA (chat/memories/tools):** `API_IA_URL` (por defecto `https://api3-ia.eventosorganizador.com`)
- **API MCP GraphQL (datos):** `API_MCP_GRAPHQL_URL` (por defecto `https://api3-mcp-graphql.eventosorganizador.com/graphql`)

---

## 1. Flujo normal (quién llama a qué)

| Quién | Habla con | URL / uso |
|-------|-----------|-----------|
| **Copilot (LobeChat)** | **API IA** | `API_IA_URL` — chat (`/webapi/chat/auto`), config, auth `identify-user`, etc. |
| **App Bodas (web)** | **API IA** | Chat va por `/api/copilot/chat` → proxy a `API_IA_URL`. |
| **App Bodas (web)** | **API MCP** | Auth, usuarios, sesiones, GraphQL (proxy-bodas/graphql → API MCP). |
| **Imágenes/Assets** | **apiapp.bodasdehoy.com** | Temporal — futuro: dominio dedicado para imágenes. |

---

## 2. Dominios de producción

| App | URL |
|-----|-----|
| **appEventos** | `https://app.bodasdehoy.com` |
| **chat-ia** | `https://chat.bodasdehoy.com` |
| **memories-web** | `https://memories.bodasdehoy.com` |

---

## 3. Archivos de resolución de endpoints

| App | Archivo | Funciones |
|-----|---------|-----------|
| **appEventos** | `utils/apiEndpoints.ts` | `resolveApiBodasGraphqlUrl()`, `resolveApiIaOrigin()` |
| **chat-ia** | `src/const/mcpEndpoints.ts` | `resolvePublicMcpGraphqlUrl()`, `resolveServerMcpGraphqlUrl()` |
| **chat-ia** | `src/const/backendEndpoints.ts` | `resolvePublicBackendOrigin()`, `resolveServerBackendOrigin()` |
| **memories-web** | `utils/endpoints.ts` | `resolvePublicMcpGraphqlUrl()`, `resolvePublicApiIaOrigin()` |
| **shared** | `utils/resolveApiAppBaseUrl.ts` | `resolveApiAppBaseUrl()` (imágenes, temporal) |
