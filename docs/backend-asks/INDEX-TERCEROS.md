# 📩 Pendientes de terceros — al 2026-06-04

Estado simplificado: 1 archivo por equipo, listo para copy-paste a Slack.

## Equipos y archivos

| # | Equipo | Archivo | Asks |
|---|---|---|---|
| 1 | **API-IA** | [PARA-API-IA.md](PARA-API-IA.md) | 6 endpoints `thread` + 1 decisión `ragEval` + 5 confirmaciones shape |
| 2 | **API-MCP** | [PARA-API-MCP.md](PARA-API-MCP.md) | 13 ops Cat C ALTA + 20 por verificar + 1 P0 conexión eventos |

## Orden recomendado de envío

1. **API-MCP — P0 conexión eventos PRIMERO**. Es prerequisito de todo. Sin
   conexión estable, las Cat C heredarían el problema.
2. **API-IA + API-MCP Cat C** en paralelo. Son equipos distintos, no compiten.
3. Por cada respuesta que llegue: COORD-FRONT integra bloque a bloque, sin
   esperar al lote completo.

## Cómo enviar

Cada `.md` tiene el contenido entre ``` ``` ``` listo para copy-paste directo a
Slack. Cabecera DE/PARA/DRI/ASUNTO ya incluida.

## Documentación detallada (background, no para enviar)

- [01-API-IA-endpoints-CAPA2.md](01-API-IA-endpoints-CAPA2.md) — Audit completo
  de los 347 endpoints api-ia + mapeo a servicios chat-ia
- [02-API-MCP-Categoria-C-apiapp.md](02-API-MCP-Categoria-C-apiapp.md) — Detalle
  por dominio Cat C con call-sites del front
- [03-API-MCP-P0-conexion-eventos.md](03-API-MCP-P0-conexion-eventos.md) —
  Análisis técnico P0 + plan de verificación

## Estado al 04-jun

✅ Hecho por COORD-FRONT:
- Sprint 1+2+3 cliente AppEventos (8/8 dominios migrados a api-mcp)
- CAPA 1 PASO C (message/session/topic 100% api-ia, 14 archivos tRPC borrados)
- Sprint TESTS T1+T2 verdes
- Infra dev servers (revert Trae + dual-mode HMR)
- Audit OpenAPI api-ia (descubrimos que la mayoría de CAPA 2 ya está cubierta)

⛔ Esperando respuesta backend:
- Lo de estos 2 docs

🚀 Avanzable HOY sin esperar (próximo trabajo COORD-FRONT):
- Fase 1 CAPA 2 — integrar contra endpoints api-ia EXISTENTES:
  upload + image + user + global → max impacto en bundle chat-ia
