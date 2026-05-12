# Estándar de endpoints por variables de entorno

Objetivo: evitar duplicados y errores por “variables legacy” que apuntan a la misma URL.

## Variables canónicas (mínimas)

### API IA (chat/memories/tools)

- Server: `API_IA_URL`
- Client (solo si hace falta en navegador): `NEXT_PUBLIC_API_IA_URL`

Default recomendado:

- `https://api3-ia.eventosorganizador.com`

### API MCP GraphQL (datos)

- Server: `API_MCP_GRAPHQL_URL`
- Client (solo si hace falta en navegador): `NEXT_PUBLIC_API_MCP_GRAPHQL_URL`

Default recomendado:

- `https://api3-mcp-graphql.eventosorganizador.com/graphql`

### Imágenes/assets (temporal)

- Client: `NEXT_PUBLIC_IMAGES_BASE_URL`

Default recomendado (temporal):

- `https://apiapp.bodasdehoy.com`

## Regla principal (para evitar duplicación)

- En cada entorno, define solo las canónicas.
- No declares aliases legacy apuntando a lo mismo.

Ejemplo mínimo (server-only):

```env
API_IA_URL=https://api3-ia.eventosorganizador.com
API_MCP_GRAPHQL_URL=https://api3-mcp-graphql.eventosorganizador.com/graphql
```

## Aliases legacy (compatibilidad)

El repo mantiene soporte de lectura para no romper entornos antiguos. Evitar declararlas si ya usas las canónicas:

- MCP GraphQL legacy: `API2_GRAPHQL_URL`, `NEXT_PUBLIC_API2_GRAPHQL_URL`, `GRAPHQL_ENDPOINT`, `NEXT_PUBLIC_API2_URL`, `API2_URL`, `API3_MCP_GRAPHQL_URL`, `NEXT_PUBLIC_API3_MCP_GRAPHQL_URL`
- IA legacy: `PYTHON_BACKEND_URL`, `NEXT_PUBLIC_BACKEND_URL`, `BACKEND_URL`, `BACKEND_INTERNAL_URL`, `API3_IA_URL`, `NEXT_PUBLIC_API3_IA_URL`
- Imágenes/assets legacy: `NEXT_PUBLIC_BASE_URL`

## Detección automática de duplicados

Usar `pnpm lint:env:endpoints` para detectar (por defecto solo `.env*.example`):

- canónicas ausentes cuando hay legacy
- valores en conflicto (dos variables del mismo grupo con URLs distintas)
- hardcodes antiguos en ejemplos de `.env.example` (cuando aplique)

Para incluir ficheros locales (`.env`, `.env.local`, etc.) en la validación:

```bash
LINT_ENV_INCLUDE_LOCAL=1 pnpm lint:env:endpoints
```
