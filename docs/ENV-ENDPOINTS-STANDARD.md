# Estándar de endpoints — env vars permitidas

> **Última revisión: 2026-05-15** (corrige error del 2026-05-14 que decía "solo 2 APIs")
> **Fuente de verdad única.** Verificado vía SSH al backend `api.bodasdehoy.com`.

## Realidad: hay 3 backends GraphQL + 1 API IA

Cada uno tiene **schema DISTINTO**. No son aliases entre sí. Apuntar una query al backend equivocado → `Unknown type` / `Cannot query field` / 400.

| Backend | Para qué sirve | Schema clave |
|---|---|---|
| `apiapp.bodasdehoy.com/graphql` | **Datos de evento**: queryenEvento, getPsTemplate, eventUpdate, invitados, mesas, presupuesto, itinerario | `inputEvent`, `inputInvitado`, `inputMesa`, `inputTask`, … |
| `api.bodasdehoy.com/graphql` | **Auth + Stripe + notificaciones + directorio**: auth mutation, updateCustomer (Stripe), getNotifications, getAllBusinesses, getEventTicket, getUser | `inputCustomer`, `sortCriteriaNotification`, `searchCriteriaBusiness`, `sortCriteriaBusiness` |
| `api-mcp.eventosorganizador.com/graphql` | **MCP-específico**: planes/suscripción MCP, R2 storage, queries MCP | resto |
| `api3-ia.eventosorganizador.com` (REST) | **Chat IA, memories, leads, tools** | n/a (no GraphQL) |

> **NO unificar** apiapp/api.bodasdehoy en api-mcp sin antes migrar los schemas en el lado del backend. Verificación SSH 2026-05-15 confirma que estos backends activamente sirven funcionalidad distinta a api-mcp.

## Resolvers en código

Usar los helpers de `apps/appEventos/utils/apiEndpoints.ts`:

```ts
import {
  resolveApiEventosOrigin, resolveApiEventosGraphqlUrl,         // → apiapp (eventos)
  resolveApiBodasAuthOrigin, resolveApiBodasAuthGraphqlUrl,     // → api.bodasdehoy (auth+Stripe+notif+directorio)
  resolveMcpOrigin, resolveApiBodasGraphqlUrl,                  // → api-mcp (MCP)
  resolveApiIaOrigin,                                            // → api3-ia (API IA)
} from '@/utils/apiEndpoints';
```

**Prohibido:** `process.env.<X>` directo con cualquier nombre de URL. Usar siempre los helpers.

## Variables canónicas por backend

### apiapp.bodasdehoy.com (eventos)
```
NEXT_PUBLIC_BASE_URL=https://apiapp.bodasdehoy.com
NEXT_PUBLIC_IMAGES_BASE_URL=https://apiapp.bodasdehoy.com
```

### api.bodasdehoy.com (auth + Stripe + notif + directorio)
```
NEXT_PUBLIC_BASE_API_BODAS=https://api.bodasdehoy.com
NEXT_PUBLIC_BASE_API_BODAS_URL=https://api.bodasdehoy.com
```

### api-mcp.eventosorganizador.com (MCP)
```
API_MCP_GRAPHQL_URL=https://api-mcp.eventosorganizador.com/graphql
NEXT_PUBLIC_API_MCP_GRAPHQL_URL=https://api-mcp.eventosorganizador.com/graphql
```

### api3-ia.eventosorganizador.com (API IA)
```
API_IA_URL=https://api3-ia.eventosorganizador.com
NEXT_PUBLIC_API_IA_URL=https://api3-ia.eventosorganizador.com
```

## Aliases retirados (NO usar)

<!--
  IMPORTANTE: la tabla siguiente contiene NOMBRES LEGACY A PROPÓSITO (referencia para migración).
  NO ejecutar sed/find-replace sobre este bloque ni sobre este archivo sin filtrar este rango.
-->

| Alias retirado | Migrar a |
|---|---|
| `API_BODAS_URL` | `NEXT_PUBLIC_BASE_API_BODAS` |
| `NEXT_PUBLIC_API_BODAS_URL` | `NEXT_PUBLIC_BASE_API_BODAS` |
| `API3_MCP_GRAPHQL_URL` | `API_MCP_GRAPHQL_URL` |
| `NEXT_PUBLIC_API3_MCP_GRAPHQL_URL` | `NEXT_PUBLIC_API_MCP_GRAPHQL_URL` |
| `NEXT_PUBLIC_API2_URL` | `NEXT_PUBLIC_BASE_URL` (apiapp) |
| `API3_IA_URL` | `API_IA_URL` |
| `NEXT_PUBLIC_API3_IA_URL` | `NEXT_PUBLIC_API_IA_URL` |
| `PYTHON_BACKEND_URL` / `BACKEND_URL` / `BACKEND_INTERNAL_URL` | `API_IA_URL` |
| `NEXT_PUBLIC_BACKEND_URL` | `NEXT_PUBLIC_API_IA_URL` |

## Plan de unificación futura (proyecto separado)

Si en el futuro queremos consolidar a `api-mcp` como único GraphQL canónico:
1. Pedir al equipo backend de `api-mcp` que cree los endpoints faltantes: `updateCustomer` (con Stripe), `getNotifications` (con sortCriteriaNotification), `getAllBusinesses` (con directorio), `queryenEvento` (con eventos), `getPsTemplate`, etc.
2. Validar que cada endpoint nuevo es funcionalmente equivalente al actual de apiapp/api.bodasdehoy.
3. Migrar el cliente gradualmente con feature flags.
4. **NO consolidar el cliente sin tener los endpoints reemplazo en el nuevo backend.**

Lección del 2026-05-15: consolidar URLs sin verificar que el destino tiene los schemas equivalentes provoca regresión de funcionalidad. La verificación correcta es SSH al backend + grep del schema, no asumir desde memoria.
