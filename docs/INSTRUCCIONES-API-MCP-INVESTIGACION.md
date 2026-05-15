# Instrucciones para equipo api-mcp — investigación de endpoints legacy

**Generado**: 2026-05-15 por COORD-AppBodas
**Para**: equipo backend api-mcp (corre en server `api-v2`, IP pública `143.198.62.113`)
**Objetivo**: que api-mcp pueda investigar los 2 backends viejos (`api.bodasdehoy.com` y `apiapp.bodasdehoy.com`) y replicar los endpoints que el cliente AppEventos aún consume.

---

## 1. Acceso SSH ya configurado (read-only)

Desde el server de api-mcp (`api-v2-ts-graphql-mcp`), ya tienes acceso vía aliases:

```bash
# Server viejo 1: api.bodasdehoy.com (auth, Stripe, notifications, business, eventTicket)
ssh investigate-bodas

# Server viejo 2: APP-GestionBodas (45.55.44.46:11000) — multi-uso, contiene código frontend legacy
ssh investigate-apiapp
```

**Llaves**: ambas usan `~/.ssh/api-bodas-investigate` (ed25519, generada por COORD el 2026-05-15).

Para revocar acceso después:
```bash
# Desde COORD:
ssh api-bodas "sed -i '/api-mcp-investigate/d' /root/.ssh/authorized_keys"
ssh -p 11000 -i ~/.ssh/coord-apiapp root@45.55.44.46 "sed -i '/api-mcp-investigate/d' /root/.ssh/authorized_keys"
```

---

## 2. Dónde está el código en cada server

### `investigate-bodas` (api.bodasdehoy.com → 137.184.148.28)

| Servicio | Puerto interno | Path código | Cubre endpoints |
|---|---|---|---|
| **api-bodas** | `:4500` (proceso `yarn dev ./src/index.js`) | `/root/api-bodas/` | Auth, Stripe, notifications, business, eventTicket, user |
| api-convert | `:4004` | `/root/api-convert/` | PDF converter (no relevante) |

**Schemas GraphQL**:
```
ssh investigate-bodas "ls /root/api-bodas/db/schemas/"
# stripe.js, business.js, notifications.js, user.js, eventTicket.js, …
```

**Buscar definición exacta de un endpoint** (ejemplo `updateCustomer`):
```bash
ssh investigate-bodas "grep -B2 -A12 'updateCustomer' /root/api-bodas/db/schemas/stripe.js"
```

**Buscar resolver completo**:
```bash
ssh investigate-bodas "grep -A30 'Mutation:' /root/api-bodas/db/schemas/stripe.js | head -50"
```

### `investigate-apiapp` (45.55.44.46:11000) — **NO contiene apiapp real**

Este server es **multi-uso del owner** (mediamtx streaming, n8n, redis, frontend dev legacy). **No tiene el backend de producción de apiapp.bodasdehoy.com**:

- 0 procesos Node corriendo
- `/root/api-eventos` = "basic-apollo-auth-demo" (demo, no producción)
- `queryenEvento`, `getPsTemplate`, etc. NO existen en el filesystem
- nginx proxy_pass a `10.8.0.6:3000` (VPN cliente desconectado)

**El backend real de `apiapp.bodasdehoy.com` está detrás de Cloudflare** en un origen que no localizamos por SSH. DNS público devuelve solo IPs Cloudflare (`104.21.62.168`, `172.67.137.140`).

**Pero** apiapp.bodasdehoy.com SÍ responde queries GraphQL desde internet:
```bash
curl -s -X POST https://apiapp.bodasdehoy.com/graphql \
  -H "Content-Type: application/json" -H "Development: bodasdehoy" \
  -d '{"query":"query{queryenEvento(variable:\"a\",valor:\"b\",development:\"bodasdehoy\"){__typename}}"}'
# → {"data":{"queryenEvento":[]}}
```

Para introspección del shape: hacer queries con variables incorrectas para que el error revele el tipo esperado:
```bash
curl -X POST https://apiapp.bodasdehoy.com/graphql -H "Content-Type: application/json" \
  -d '{"query":"query($a:JSON){queryenEvento(args:$a){__typename}}"}'
# → "Variable $a of type JSON used in position expecting type STRING" etc.
```

---

## 3. Informe completo de endpoints faltantes

**Archivo**: `docs/INFORME-MIGRACION-API-MCP.md` (2550 líneas, 106 endpoints agrupados en 16 dominios).

Para cada endpoint incluye:
- Tipo (`query` / `mutation`)
- Nombre del endpoint en el backend
- Key del cliente en `Fetching.ts`
- **Fragmento exacto del cliente** (la query GraphQL que envía el cliente)
- Schema actual del backend viejo (cuando viene de `api.bodasdehoy.com`)

**Recomendación**: empezar por los dominios más críticos para login:
1. **Auth / Usuario** (`auth`, `getUser`, `createUser`) → `api.bodasdehoy.com/graphql`
2. **Notificaciones** (`getNotifications`, `createNotifications`) → `api.bodasdehoy.com/graphql`
3. **Stripe / Billing** (`updateCustomer`, `createCheckoutSession`) → `api.bodasdehoy.com/graphql`
4. **Eventos** (`queryenEvento`, `eventCreate`, `eventUpdate`) → `apiapp.bodasdehoy.com/graphql`
5. **Invitados, Mesas, Presupuesto, Itinerario** → `apiapp.bodasdehoy.com/graphql`

---

## 4. Tipos custom legacy → simplificación a JSON

Algunos endpoints de `api.bodasdehoy.com` usan tipos custom `inputCustomer`, `sortCriteriaNotification`, `searchCriteriaBusiness`, etc.

Tendencia recomendada en api-mcp: aceptar `JSON` genérico en `args` y `sort`/`searchCriteria` en lugar de tipos custom específicos. Esto:
- Reduce mantenimiento del schema
- Permite cambios en cliente sin breaking changes
- Es lo que ya hace api-mcp en endpoints existentes (verificado vía introspección)

Ejemplo migración:
```graphql
# Antes (api.bodasdehoy.com viejo):
getNotifications(args: inputNotification, sort: sortCriteriaNotification, skip: Int, limit: Int): salidaNotification

# Nuevo (api-mcp):
getNotifications(args: JSON, sort: JSON, skip: Int, limit: Int): NotificationsResponse
```

---

## 5. Pendientes para coordinación

- **Acceso al origen real de apiapp.bodasdehoy.com**: no localizado por SSH. ¿Puede el equipo backend confirmar la IP origen detrás de Cloudflare? Con SSH ahí podríamos extraer schemas exactos en lugar de inferir por error de tipo.
- **Decisión sobre 3 endpoints removidos en api-mcp**: `updateCustomer` (Stripe), `getAllBusinesses` (directorio venues), `getEventTicket`. El cliente los llama; backend debe decidir si reimplementar o cliente eliminar callsites.
