# Estándar de endpoints — env vars permitidas

> **Última revisión: 2026-05-14**
> **Fuente de verdad única.** Cualquier otro nombre está retirado y dispara error en runtime.

## Solo hay 2 APIs en este proyecto

| API | Para qué sirve |
|---|---|
| **API MCP GraphQL** | Datos: eventos, invitados, mesas, presupuesto, itinerario, notificaciones |
| **API IA** | Chat IA, memories, leads (sub-router), tools/function-calling |

> **Leads no es una API separada.** Vive como router dentro de API IA (`/api/leads/*`). No requiere env var propia.

## Variables canónicas (las únicas válidas)

### API MCP GraphQL

```
API_MCP_GRAPHQL_URL=https://api-mcp.eventosorganizador.com/graphql
NEXT_PUBLIC_API_MCP_GRAPHQL_URL=https://api-mcp.eventosorganizador.com/graphql
```

### API IA

```
API_IA_URL=https://api3-ia.eventosorganizador.com
NEXT_PUBLIC_API_IA_URL=https://api3-ia.eventosorganizador.com
```

**Regla:** server (sin prefix) + public (con `NEXT_PUBLIC_`). Mismo valor en ambos. Nada más.

## Cómo se usan en código

Usa siempre el helper de `apps/appEventos/utils/apiEndpoints.ts`:

```ts
import { resolveApiBodasGraphqlUrl, resolveApiIaOrigin } from '@/utils/apiEndpoints';

const graphqlUrl = resolveApiBodasGraphqlUrl();  // → MCP GraphQL
const apiIaOrigin = resolveApiIaOrigin();        // → API IA base
```

**Prohibido:** usar `process.env.<X>` directo con cualquier alias legacy. El helper detecta y rechaza en arranque.

## Aliases retirados (NO usar)

Cualquiera de estos en `.env` dispara error `Legacy env vars detected (retired 2026-05-14)` con sugerencia de migración:

<!--
  IMPORTANTE: la tabla siguiente contiene NOMBRES LEGACY A PROPÓSITO (referencia para migración).
  NO ejecutar sed/find-replace sobre este bloque ni sobre este archivo sin filtrar este rango.
  Si reaplicas la limpieza masiva, excluye explícitamente docs/ENV-ENDPOINTS-STANDARD.md.
-->

| Alias retirado | Migrar a |
|---|---|
| `API_BODAS_URL` | `API_MCP_GRAPHQL_URL` |
| `NEXT_PUBLIC_API_BODAS_URL` | `NEXT_PUBLIC_API_MCP_GRAPHQL_URL` |
| `API3_MCP_GRAPHQL_URL` | `API_MCP_GRAPHQL_URL` |
| `NEXT_PUBLIC_API3_MCP_GRAPHQL_URL` | `NEXT_PUBLIC_API_MCP_GRAPHQL_URL` |
| `API2_URL` / `NEXT_PUBLIC_API2_URL` | `API_MCP_GRAPHQL_URL` / `NEXT_PUBLIC_API_MCP_GRAPHQL_URL` |
| `API3_IA_URL` | `API_IA_URL` |
| `NEXT_PUBLIC_API3_IA_URL` | `NEXT_PUBLIC_API_IA_URL` |
| `PYTHON_BACKEND_URL` / `NEXT_PUBLIC_PYTHON_BACKEND_URL` | `API_IA_URL` / `NEXT_PUBLIC_API_IA_URL` |
| `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` | `API_IA_URL` / `NEXT_PUBLIC_API_IA_URL` |
| `BACKEND_INTERNAL_URL` | `API_IA_URL` |

## Vercel: configuración

En `vercel.com → Project → Settings → Environment Variables`:
- Define **solo las 4 canónicas** (2 server + 2 public).
- Borra cualquier alias legacy que aparezca.
- Aplica a los 3 entornos (Production / Preview / Development).

## Local

En `.env.local` de cada app: copia los 4 valores. Si tu .env tiene aliases legacy, **migra**, no acumules.
