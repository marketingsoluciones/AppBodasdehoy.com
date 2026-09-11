# Backend asks — 2026-06-04

Inventario de lo que necesitamos de los equipos `api-ia` y `api-mcp` para
desbloquear los siguientes hitos del proyecto AppBodasdehoy.

## Documentos

| # | Doc | DRI | Bloquea |
|---|---|---|---|
| 01 | [API-IA endpoints CAPA 2 PASO C](01-API-IA-endpoints-CAPA2.md) | api-ia | Borrar drizzle + pglite + @trpc/* del front (~25k módulos menos, build 10min→3-4min) |
| 02 | [API-MCP Categoría C — apagar apiapp](02-API-MCP-Categoria-C-apiapp.md) | api-mcp | Apagar droplet `apiapp.bodasdehoy.com` |
| 03 | [API-MCP P0 conexión eventos](03-API-MCP-P0-conexion-eventos.md) | api-mcp | E2E reales, certificar migración funcional, prerequisito Cat C |

## Orden recomendado

1. **Doc 03 (P0 eventos) PRIMERO.** Es prerequisito de los otros — sin conexión
   estable, Cat C hereda el mismo problema y los smoke E2E no son confiables.
2. **Doc 01 (api-ia)** y **Doc 02 (api-mcp Cat C)** en paralelo. Son dominios
   distintos (api-ia vs api-mcp), no compiten.
3. Dentro de cada doc: la propia priorización ALTA/MEDIA/BAJA. Empezar por ALTA.

## Cómo se postea a Slack

Cada doc es **standalone** — copiar el contenido a un mensaje Slack para el
equipo correspondiente (canal coordinación, hilo `1779046688.849779` o
escalación específica para el P0 hilo `1779939514`).

Plantilla cabecera Slack (añadir antes del contenido del doc):

```
DE: COORD-AppEventos
PARA: [api-ia | api-mcp]
DRI: backend_oncall
ASUNTO: [Doc 0X] <título corto>

(pegar contenido del .md aquí)

DRI: <equipo> → responder con plan + fecha en este hilo.
```

## Estado al 2026-06-04

- ✅ Sprint 1+2+3 cliente AppEventos: migrado a api-mcp (8/8 dominios)
- ✅ CAPA 1 PASO C: message/session/topic 100% api-ia (14 archivos tRPC borrados, commit `969fa493`)
- ✅ Sprint TESTS: T1+T2 verdes con TRAE-FRONT
- ⛔ **Aquí esperamos backend** ← este folder

## Cuando responda backend

1. COORD-FRONT lee plan + fechas.
2. Por cada endpoint listo: integra cliente REST/queries en chat-ia o appEventos,
   smoke, commit, push.
3. Iteración bloque a bloque, NO esperar al lote completo.

## Memoria proyecto referencias

- `memory/project_apiapp_legacy_305_calls.md` — mapa completo migración apiapp
- `memory/project_migracion_api_ia_estado_03jun.md` — estado CAPA 1 día previo
- `memory/project_adapter_apiapp_to_mcp.md` — 76 ops adapter actual
- `docs/PASO-C-BORRAR-DRIZZLE-PLAN.md` — plan completo capas 1-3
- `docs/IMPACTO-APIAPP-COMPLETO.md` — inventario Cat A/B/C apiapp
- `docs/PLAN-DEV-SERVERS-LECCIONES.md` — flujo dev local (heredado incidente Trae)
