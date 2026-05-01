# Coordinación API2 — análisis, preguntas y borrador Slack

**Ámbito:** `apps/appEventos` (GraphQL eventos + API2 planes + Socket.IO). 2026-04-18.

## Resumen técnico

| Origen | Env | Uso |
|--------|-----|-----|
| API app (eventos) | `NEXT_PUBLIC_BASE_URL` → POST `/graphql` | `getEventsByID`, invitados, `creaInvitado` (`fetchApiEventos`) |
| API2 (planes) | `NEXT_PUBLIC_API2_URL` (default `https://api2.eventosorganizador.com/graphql`) | `getSubscriptionPlans`, `getMySubscription` (`usePlanLimits`) |
| Socket.IO | `NEXT_PUBLIC_BASE_API_BODAS` normalizado (`apps/appEventos/utils/resolveApi2BaseUrl.ts`) | Tiempo real; **no** sustituye el listado por GraphQL |

GraphQL y socket son canales distintos; si el socket falla (404), los eventos dependen solo de que responda el GraphQL de la API app.


## Para qué sirve el socket (precisión frente a GraphQL)

- **No** es un “plan B” si GraphQL falla: los datos base (lista de eventos, CRUD) van por **HTTP GraphQL**.
- **Sí** es un canal **tiempo real** sobre la misma infraestructura de API: el cliente entra en **sala por `event_id`** (`joinRoom` / `app:message` en `SocketControlator.tsx`).
- Con el socket la app **sincroniza entre sesiones** cosas como: **cambios del evento** (`setEvent`), **espacio de plan activo** (`setPlanSpaceActive`), **estado de comunicaciones** con invitados (`setStatusComunicacion`: entregado, leído, etc.) y **notificaciones** (`notification`). También hay mensajes tipo **CMS/copilot** (`cms:message`: navegar, click en tarjeta).
- Si el socket **no conecta** (404, DNS): **pierdes actualizaciones en vivo** y estados de envío en caliente; **no** invalida por sí solo que GraphQL cargue listas. Para ver lo último sin socket hace falta **refrescar** o volver a abrir pantallas que hagan fetch.


## Hallazgos ya cubiertos en cliente (repo)

- Timeouts `getEventsByID`: ~20 s por consulta; axios GraphQL ~25 s en `apps/appEventos/api.js`.
- `getMySubscription`: la query ya no pide `status` ni `trial_end` cuando API2 devolvía valores incompatibles con el enum (p. ej. `"active"`); la UI usa `plan`. La corrección definitiva sigue siendo API2/datos.
- `api2.bodasdehoy.com` se normaliza a `api2.eventosorganizador.com` (DNS inestable documentado en código).

## Preguntas para API2 / backend (copiar a ticket o Slack)

1. **GraphQL eventos:** ¿SLA o p95/p99 para `getEventsByID` / `queryenEvento` (`usuario_id`, `compartido_array`)? ¿Cold start, colas o límites de conexión?
2. **Socket.IO:** ¿Host y path oficiales? Los 404 en `/socket.io/` sugieren proxy o servicio no expuesto en el host que usa el cliente.
3. **`SubscriptionStatus`:** ¿Normalizarán en resolver o BD para poder volver a exponer `status` sin romper el enum GraphQL?
4. **Multi-marca:** ¿Contrato estable de cabeceras `Development` (API app) y `X-Development` (API2)?
5. **Invitados:** ¿Cuándo la mutación en la API app aplicará la misma cuota que SKU `guests-per-event` en API2, con `errors[].code` alineado a `planLimitsCoordination.ts`?

## Información a adjuntar al escalar (rellenar; sin JWT)

- Entorno (`app-dev`, `app-test`, localhost, prod).
- Timestamp (UTC o local) y correlation id si existe en logs del servidor.
- Usuario de **prueba** (uid/email test).
- Captura o fragmento JSON: status HTTP, mensaje GraphQL (sin tokens).
- Solo **nombres** de variables de entorno relevantes (no valores secretos).

## Borrador mensaje Slack (`#copilot-api-ia`)

> **Para API2 / backend — integración app eventos**
>
> Necesitamos confirmación sobre: (1) latencia y salud del GraphQL de eventos para `getEventsByID` / `queryenEvento`; (2) URL y despliegue correctos de Socket.IO (404 en `/socket.io/`); (3) enum `SubscriptionStatus` en `getMySubscription` (valores tipo `active` rompen la query; en cliente omitimos `status` temporalmente); (4) alineación cuota invitados API app vs API2 (`guests-per-event`).
>
> Adjuntamos entorno, hora, uid de prueba y captura de red. ¿Hay incidencia conocida o ventana de fix?
>
> Gracias.

**Enviar** desde la raíz del monorepo (credenciales en `.env` local; **no pegar tokens en el chat**):

```bash
./scripts/slack-send.sh --copilot "Pegar mensaje anterior + datos del apartado anterior"
```

## Cuándo **no** hace falta escalar a API2

- Error solo por `.env` local mal apuntado o proxy caído.
- Puerto ocupado (PM2 vs `pnpm dev`).
- Cambios puramente de UI ya resueltos en el repo.

Si el fallo se reproduce en `app-dev`/`app-test` con las mismas URLs de API que producción, conviene abrir hilo con API2 usando este documento.
