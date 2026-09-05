# Respuesta API2 — GraphQL eventos, Socket.IO, getMySubscription, cuota invitados

Consolidado de respuesta API2/backend (2026-04-18). Asunto: *App eventos — GraphQL eventos, Socket.IO y API2 (getMySubscription)*.

## 1) GraphQL eventos (getEventsByID / queryenEvento)

En API2 las consultas van contra Mongo con esos filtros; hay índice en `compartido_array`. No hay SLA/p95 fijo publicado en código: depende de carga, tamaño del documento y red.

Si hay timeouts ~20 s, necesitan entorno, hora aproximada, id del evento y uid de prueba (sin tokens) para revisar logs y consultas lentas. No hay incidencia genérica documentada en repo; se analiza con trazas.

## 2) Socket.IO

El backend API2 (GraphQL en este flujo) **no sirve Socket.IO**; no existe `/socket.io/` ahí. Un 404 en `/socket.io/` sobre el mismo host que GraphQL suele indicar que el realtime va en **otro servicio/host** o falta **proxy/rewrite** en infra. `ERR_NAME_NOT_RESOLVED` hacia api2… es **DNS/registro o entorno**, no path en API2.

## 3) getMySubscription / SubscriptionStatus

Contrato del esquema: ACTIVE, CANCELLED, SUSPENDED, EXPIRED, TRIAL, PAST_DUE (mayúsculas). En BD los valores estaban en minúsculas; eso podía romper la query. En API2 se corrige **mapeando en el resolver** de `UserSubscription.status` al enum; tras desplegar el cliente puede **volver a pedir `status`** (y `trial_end` si aplica).

## 4) Cuota de invitados

La mutación `agregarInvitado` hoy **no aplica en servidor** la cuota del plan (p. ej. guests-per-event); solo permisos de edición y push al array. No devuelve errores de cuota alineados con la UI del plan hasta que exista esa lógica; es mejora/backlog (sin ETA en el mensaje original).

## Variables (solo nombres)

`NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_BASE_API_BODAS`, `NEXT_PUBLIC_API2_URL`.
