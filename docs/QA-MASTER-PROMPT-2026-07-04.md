# QA MASTER PROMPT — appEventos + chat-ia — 2026-07-04

> Prompt QA MÁXIMO — 162 casos en 15 bloques. Ejecutable por equipo QA
> externo o agente IA que no conoce el código. ~3h 10min ejecución
> manual. Copy-paste directo desde este archivo o desde el chat.

> Para el contenido completo copy-paste ver el bloque code en el chat
> de coordinación (04-jul). Este archivo es el respaldo persistente.

Autor: COORD-AppEventos
Fecha: 2026-07-04
BUILD_ID app-dev al momento: `9EOq7bcEsb6Aor9wh65Ni`
BUILD_ID chat-dev al momento: `BL8upWQCGwqmqakPD3TeW`
Commit hotfix front: `08048f4b`

## Bloques (162 casos, ~3h10min)

| # | Bloque | Casos | Duración |
|---|---|---|---|
| 0 | Pre-check estado servidor | 5 | 5m |
| 1 | Login + sesión | 8 | 10m |
| 2 | Eventos crear/editar/borrar | 10 | 15m |
| 3 | Presupuesto (7 sub-bloques) | 35 | 40m |
| 4 | Invitados | 15 | 15m |
| 5 | Mesas | 12 | 10m |
| 6 | Itinerario | 9 | 10m |
| 7 | Servicios/Tareas | 8 | 10m |
| 8 | Invitaciones | 8 | 10m |
| 9 | Momentos | 7 | 10m |
| 10 | Notificaciones | 7 | 10m |
| 11 | Copilot IA + SSE | 13 | 15m |
| 12 | Multi-user / permisos | 7 | 15m |
| 13 | Edge cases + robustez | 14 | 10m |
| 14 | Cross-app integración | 4 | 5m |

## Cobertura

- Login, sesión, magic-link, OAuth
- Eventos CRUD (crear/editar/borrar/duplicar/compartir/revocar)
- Presupuesto completo: resumen, detalle Excel, pagos, pendientes, dashboard
- Invitados (CRUD, import/export CSV, estados, invitaciones, alérgenos)
- Mesas (canvas, tipos, sentar/mover, realtime multi-user)
- Itinerario (timeline, hitos, tareas, comentarios, adjuntos)
- Servicios/Tareas (Kanban, drag, permisos)
- Invitaciones (email + WhatsApp, estados envío, estadísticas)
- Momentos/álbumes fotos
- Notificaciones (campana, polling, realtime, comment_added)
- Copilot IA (streaming, contexto evento, SSE refresh)
- Multi-user + permisos + cross-tenant (crítico seguridad)
- Edge cases (XSS, SQL injection, upload malformado, timezone)
- Cross-app (SSO app↔chat, embeds)

## Verificaciones específicas de fixes recientes

- **EVT-01**: crear evento nuevo NO devuelve toast "servidor rechazó"
- **BUD-06**: Dashboard con presupuesto=0 muestra "0.0%" NO "NaN%"
- **Evento.color**: consola NO muestra "Expected Iterable"
- **DebugFooter**: visible en app-dev + chat-dev con commit SHA + trace_id copiable
- **retry auth Mongo**: login con backend lento → reintenta con backoff
- **Cross-tenant leak**: acceso a evento de otro whitelabel → 403/404

## Cómo reportar

Slack #coordinacion hilo `1778170638.897419` con formato:
```
DE: QA
PARA: COORD-AppEventos
ASUNTO: Reporte QA <fecha>

BUILD_ID: <valor>
Duración: <minutos>

FAILS:
P0: <ID> <resumen> · trace_id <valor>
P1: ...
```

Incluir siempre: screenshot + consola errors + network + trace_id del DebugFooter.
