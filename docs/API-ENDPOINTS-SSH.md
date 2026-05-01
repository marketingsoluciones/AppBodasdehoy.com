# API (DEV/TEST): endpoints y SSH

## Endpoints

- API MCP GraphQL (sustituye a “API2” en el frontend)
  - Host: `api3-mcp-graphql.eventosorganizador.com`
  - URL: `https://api3-mcp-graphql.eventosorganizador.com`
  - GraphQL: `https://api3-mcp-graphql.eventosorganizador.com/graphql`
  - MCP: `https://api3-mcp-graphql.eventosorganizador.com/mcp`
  - SSE: `https://api3-mcp-graphql.eventosorganizador.com/sse`
  - Health: `https://api3-mcp-graphql.eventosorganizador.com/health`
  - Webhooks: `https://api3-mcp-graphql.eventosorganizador.com/api/webhook/`
  - DNS: registro `A api3-mcp-graphql → 178.104.209.139`
- API IA (sustituye a “api-ia” en DEV/TEST)
  - Host: `api3-ia.eventosorganizador.com`
  - URL: `https://api3-ia.eventosorganizador.com`
  - Health: `https://api3-ia.eventosorganizador.com/health`
  - Chat: `https://api3-ia.eventosorganizador.com/api/chat`
  - GraphQL: `https://api3-ia.eventosorganizador.com/graphql`
  - WebSocket: `wss://api3-ia.eventosorganizador.com/ws`
  - AI: `https://api3-ia.eventosorganizador.com/api/ai/*`
  - Jobs: `https://api3-ia.eventosorganizador.com/api/jobs`
  - DNS: registro `A api3-ia → 159.69.180.113`

## Variables de entorno

### API MCP GraphQL

- Canónicas:
  - `API_MCP_GRAPHQL_URL=https://api3-mcp-graphql.eventosorganizador.com/graphql`
  - `NEXT_PUBLIC_API_MCP_GRAPHQL_URL=https://api3-mcp-graphql.eventosorganizador.com/graphql`
- Aliases legacy soportados (evitar en entornos nuevos):
  - El repo también lee variables antiguas (por ejemplo `API3_MCP_GRAPHQL_URL`, `API2_GRAPHQL_URL`, `GRAPHQL_ENDPOINT`, etc.) para no romper despliegues previos.

### API IA

- Canónicas:
  - `API_IA_URL=https://api3-ia.eventosorganizador.com`
  - `NEXT_PUBLIC_API_IA_URL=https://api3-ia.eventosorganizador.com`
- Aliases legacy soportados (evitar en entornos nuevos):
  - El repo también lee variables antiguas (por ejemplo `API3_IA_URL`, `PYTHON_BACKEND_URL`, `BACKEND_URL`, etc.) para no romper despliegues previos.

En este repo hay ejemplos actualizados en:

- [`apps/chat-ia/.env.example`](../apps/chat-ia/.env.example)
- [`apps/chat-ia/.env.production.example`](../apps/chat-ia/.env.production.example)

## SSH

Se usa la misma key que ya se usa para “leadscarap”. Para evitar tocar `~/.ssh/config` de cada máquina, el repo trae:

- Plantilla: [`scripts/ssh/api.ssh.config.example`](../scripts/ssh/api.ssh.config.example)
- Script de prueba: [`scripts/ssh/test-api-ssh.sh`](../scripts/ssh/test-api-ssh.sh)

### Probar conectividad

1) Si conoces la ruta de tu key:

```bash
SSH_KEY_PATH=~/.ssh/TU_KEY_LEADSCARAP SSH_USER=TU_USUARIO bash scripts/ssh/test-api-ssh.sh
```

2) Si ya tienes un `Host leadscarap` en `~/.ssh/config` con `IdentityFile` y `User`, puedes omitir `SSH_KEY_PATH`/`SSH_USER`:

```bash
bash scripts/ssh/test-api-ssh.sh
```

Si añades la plantilla a tu `~/.ssh/config`, los alias quedan así:

```bash
ssh mcp
ssh ia
```

## Nota de red

Desde esta máquina, `https://api3-ia.eventosorganizador.com/health` devuelve `200`. Para GraphQL, usar `POST` a `https://api3-mcp-graphql.eventosorganizador.com/graphql` (un `GET` puede no responder según configuración del servidor).
