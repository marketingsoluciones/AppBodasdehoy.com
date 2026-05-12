# Pruebas reales api-ia y mcp – Cómo generar y enviar evidencia

## Comando único (todas las pruebas)

```bash
node scripts/ejecutar-pruebas-reales-todas.mjs
```

Incluye: chat-test y app-test (GET), api-ia (3 queries reales), mcp (getSubscriptionPlans). Genera `test-results/pruebas-reales-completo-*.json` y `.md`.

---

## Objetivo

Tener **queries reales** contra api-ia y mcp, con request/response completos, para **demostrar** si están fallando y poder enviar la evidencia al equipo de api-ia (o backend MCP).

## Script

```bash
node scripts/pruebas-reales-api-ia-mcp.mjs
```

Opcional (api-ia con usuario identificado):

```bash
FIREBASE_JWT=<token> node scripts/pruebas-reales-api-ia-mcp.mjs
```

## Qué hace el script

| Backend | Endpoint | Query real |
|---------|----------|------------|
| **api-ia** | `POST https://api-ia.bodasdehoy.com/webapi/chat/auto` | 3 mensajes: "Hola", "¿Cuántos invitados tengo?", "Dame un resumen de mi evento" (mismo formato que el chat) |
| **mcp** | `POST https://api3-mcp-graphql.eventosorganizador.com/graphql` | `getSubscriptionPlans(development: "bodasdehoy", is_public: true)` (query real del front) |

Genera en `test-results/`:

- **`pruebas-reales-api-ia-mcp-YYYYMMDDHHMMSS.json`** – Request completo (headers, body) y response (status, body preview) de cada llamada. Ideal para adjuntar o pegar en Slack/ticket.
- **`pruebas-reales-api-ia-mcp-YYYYMMDDHHMMSS.md`** – Resumen en tabla (OK/FALLO por query).

## Ejemplo de evidencia (12 mar 2026)

- **api-ia:** FALLO – La query "¿Cuántos invitados tengo?" devolvió **503** con `error_code: "TIMEOUT_ERROR"`, `timeout_seconds: 25`, sugerencia "Intenta con una pregunta más corta o específica."
- **mcp:** OK – getSubscriptionPlans respondió 200.

El JSON de esa ejecución incluye el `requestBody` y `responsePreview` exactos para esa query, para enviarlos a api-ia y demostrar el fallo.

## Qué enviar a api-ia cuando falle

1. El **.md** (resumen rápido).
2. El **.json** (o el fragmento `apiIa.results` del query que falló) para que vean request + response real.
3. Fecha/hora de la ejecución (viene en `timestamp` del JSON).

## Variables de entorno

| Variable | Por defecto | Uso |
|----------|-------------|-----|
| `BACKEND_URL` | `https://api-ia.bodasdehoy.com` | Base de api-ia |
| `API_MCP_GRAPHQL_URL` | `https://api3-mcp-graphql.eventosorganizador.com/graphql` | URL GraphQL MCP |
| `DEVELOPMENT` | `bodasdehoy` | Header X-Development |
| `FIREBASE_JWT` | (vacío) | Si se pone, api-ia recibe Authorization Bearer (usuario identificado) |
