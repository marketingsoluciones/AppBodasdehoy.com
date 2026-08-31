# Plan de producción — Migración appEventos apiapp → api-mcp

> 2026-05-29 · COORD/FRONT-AppEventos. Visión global + meta + fases para salir a producción.

## META (definición de "listo para producción")
appEventos sale a producción cuando:
1. Todos los flujos de usuario funcionan sobre **api-mcp** (apiapp eliminado del data-layer).
2. **0** `fetchApiEventos` (apiapp) en call-sites de datos de eventos.
3. Los **3 bloqueos de backend** resueltos (ver abajo).
4. Imágenes: subidas nuevas en nuestro host + ficheros viejos servidos tras apagar apiapp.
5. Verificado sin regresión (compile + smoke por dominio).

## ESTADO HOY
- **Migrado (~72 call-sites):** invitados (CRUD), planSpace elements, editPresupuesto(monto), menús/grupos, eventUpdate-subset (timeZone/showChildrenGuest), editCategoria, imágenes-core (createURL robusto).
- **Restante: 179 call-sites · 58 ops** agrupados en 7 dominios.

## INVENTARIO POR DOMINIO (tamaño + estado)

| # | Dominio | ~sites | Estado api-mcp | Trabajo front |
|---|---------|--------|----------------|---------------|
| D1 | **Tasks/Itinerario** | ~71 | ops existen (getItinerario, editTask, createTask, deleteTask, comments, attachments) | reshape Task (id vs _id, TaskUpdateInput); el MÁS grande |
| D2 | **Evento core** | ~28 | eventUpdate (parcial), eventCreate, eventDelete, getEventoById | reshape variable/value→input; **estatus bloqueado (P-B)** |
| D3 | **Invitaciones/Email/WhatsApp** | ~25 | existen como alias apiapp-compat | verificar shape + fetcher swap |
| D4 | **Presupuesto** | ~23 | canónicos existen | reshape; **editGasto bloqueado (falta GastoPresupuestoUpdateInput)**; entity-reads tableBudgetV8 |
| D5 | **Mesas/PlanSpace** | ~18 | createTable/editTable NO existen → via updateEvento(planSpace) | reconstruir planSpace JSON; eliminar legacy |
| D6 | **Compartición** | ~3 | add/delete/updateCompartitions (verificar) | reshape |
| D7 | **Galería/Misc/User** | ~6 | createGalerySvgs, guardarListaRegalos, getPreregister, getEmailValid | verificar + swap |

## BLOQUEOS REALES DE BACKEND (impiden producción 100%) — en paralelo
1. **P-B estatus** → cambiar `estatus` en EventoUpdateInput de enum `EventoStatus` → `String` (su toUpperCase no aplica: el enum valida antes del resolver).
2. **GastoPresupuestoUpdateInput** (campos opcionales) → editGasto sin reenviar nombre.
3. **Ficheros de imagen viejos** → servir/migrar/proxear desde nuestro host antes de apagar apiapp (infra, no BD).

## FASES (orden por criticidad de flujo + tamaño)
- **FASE 0 — Bloqueos backend** (paralelo, ya reportados): P-B, GastoUpdateInput, ficheros imagen.
- **FASE 1 — Evento core (D2):** eventUpdate completo, eventCreate, eventDelete, getEventoById. *(estatus queda en apiapp hasta P-B)*. → crear/editar/borrar evento.
- **FASE 2 — Presupuesto (D4):** categorías+gastos+items. *(editGasto limpio tras GastoUpdateInput)*.
- **FASE 3 — Mesas/PlanSpace (D5):** todo vía updateEvento(planSpace).
- **FASE 4 — Tasks/Itinerario (D1):** el grande; reshape Task ops + getItinerario.
- **FASE 5 — Invitaciones/Templates (D3).**
- **FASE 6 — Compartición + Galería + User + Imágenes A4 (D6/D7).**

## MÉTODO (más rápido que caso-por-caso)
Migrar **por dominio en bloque** (todas las queries+call-sites del dominio) → **1 compile + 1 smoke live por dominio** (no lifecycle por op). El contrato ya está extraído del SDL, no hay que adivinar.

## CRITERIO DE SALIDA POR FASE
Compila 200 + ESLint 0 + smoke live OK del flujo principal + 0 `fetchApiEventos` en ese dominio.
