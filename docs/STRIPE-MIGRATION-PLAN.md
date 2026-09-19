# Plan migración Stripe/Auth/Directorio (out-of-scope inicial)

> **Generado**: 2026-05-17  ·  **Autor**: COORD-AppEventos  ·  **Estado**: análisis previo

## Resumen ejecutivo

10 endpoints "out-of-scope" del cliente AppEventos apuntan a `api.bodasdehoy.com` (backend legacy auth/Stripe/directorio). Aplicando el patrón Sprint 1+2+3, se pueden agrupar en 3 caminos:

| Categoría | Endpoints | Camino |
|---|---|---|
| **Subscripciones usuario** (3) | `getCustomer`, `createCheckoutSession` (subs), `getAllProducts` (subs) | ✅ **Migrar a canonical api-mcp** — ya existen `getMySubscription`, `subscribeToPlan`, `getSubscriptionPlans` |
| **Stripe tickets PR** (3) | `getAllProducts` (tickets), `createCheckoutSession` (tickets PR), `setCheckoutItems` | ⏸️ **Mantener legacy** — `api.bodasdehoy.com` (no es subscripción usuario) |
| **Auth + Directorio + Tickets** (4) | `createUserWithPassword`, `getEmailValid`, `getEventTicket`, `getAllBusiness` | ⏸️ **Mantener legacy** — dominio backend distinto |

## Detalle por endpoint

### ✅ MIGRAR a canonical api-mcp

#### `getCustomer` (cliente facturación)
- **Cliente actual**: `InformacionFacturacion.tsx:19` via `fetchApiBodas`
- **Reemplazo canonical**: `getMySubscription(module: String): UserSubscription` en api-mcp
- **Cambio caller**:
  ```ts
  // Antes:
  fetchApiBodas({ query: queries.getCustomer, variables: {...} })
  // Después:
  fetchApiEventos({ query: queries.getMySubscription, variables: { module: "app" } })
  ```
- **Esfuerzo**: 15 min

#### `getAllProducts` con `grupo: "app"` (facturación subscripciones)
- **Cliente actual**: `facturacion.tsx:268-275` via `fetchApiBodas`
- **Reemplazo canonical**: `getSubscriptionPlans(development, is_public: true)` (ya usado en `usePlanLimits.ts`)
- **Esfuerzo**: 20 min

#### `createCheckoutSession` para subscripción
- **Cliente actual**: `EncabezadoFacturacion.tsx:26` via `fetchApiBodas`
- **Reemplazo canonical**: `subscribeToPlan(plan_id, billing_period, success_url, cancel_url): SubscribePlanCheckoutResponse`
- **Esfuerzo**: 30 min (cambio shape + flujo)

### ⏸️ MANTENER LEGACY (api.bodasdehoy.com)

#### `getAllProducts` SIN grupo: "app" (tickets eventos RR.PP.)
- **Cliente actual**: `VentasEntradas.tsx:21`, `EntradasGratis.tsx:30`
- **Propósito**: tickets de eventos (no subscripciones usuario)
- **Decisión**: dominio "Tickets" es separado, no parte de migración api-mcp
- **Acción**: ninguna (vivo en api.bodasdehoy.com)

#### `createCheckoutSession` para tickets PR
- **Cliente actual**: `EntradasGratis.tsx:47`
- **Propósito**: checkout Stripe para venta de tickets de evento
- **Acción**: ninguna (legacy ok)

#### `setCheckoutItems`
- **Cliente actual**: `DatosComprador.tsx:55` (RR.PP. ticket flow)
- **Acción**: ninguna

#### `getInvoices`
- **Cliente actual**: `HistorialFacturacion.tsx:33` (historial facturas suscripción)
- **Reemplazo canonical**: `getSubscriptionBillingPeriods(...)` o `getInvoice(invoiceId)` (existe en api-mcp `billing.ts`)
- **Esfuerzo**: 30-45 min (requiere ajustar tabla histórica)
- **Decisión pendiente**: ¿migrar o mantener? Depende de si el flujo de billing tickets PR comparte tabla con subscripciones.

#### `createUserWithPassword` (registro nuevo usuario email/password)
- **Cliente actual**: `FormRegister.tsx:148` via `fetchApiBodas`
- **Propósito**: signup flow legacy (Firebase Auth alternativa)
- **Decisión**: pendiente — depende si AuthBridge sigue dependiente de este flow

#### `getEmailValid(email)`
- **Cliente actual**: `FormRegister.tsx:75` via `fetchApiBodas`
- **Backend confirmó**: implementado en api-mcp pero NO migrado aún cliente
- **Esfuerzo**: 10 min (cambiar `fetchApiBodas` → `fetchApiEventos`)

#### `getEventTicket`
- **Cliente actual**: `AuthContext.tsx:188`
- **Estado backend**: api-mcp stub (`{total:0, results:[]}`)
- **Acción**: cliente ya está OK con stub

#### `getAllBusiness`
- **Cliente actual**: `BlockLugarEvento.tsx:24`
- **Backend**: aún no implementado en api-mcp
- **Acción**: legacy

#### `updateCustomer` (billing address)
- **Cliente actual**: `InformacionFacturacion.tsx:37`
- **Backend api-mcp tiene**: `updateCustomer(args: inputCustomer): String` (apiapp-compat)
- **Esfuerzo**: 15 min (shape ya compatible)

## Plan de ejecución

### Fase 3e — Migración Stripe Subscripciones (1.5-2h)

1. `getCustomer` → `getMySubscription` en `InformacionFacturacion.tsx`
2. `getAllProducts(grupo:"app")` → `getSubscriptionPlans` en `facturacion.tsx`
3. `createCheckoutSession` → `subscribeToPlan` en `EncabezadoFacturacion.tsx`
4. `getEmailValid` → migrar de `fetchApiBodas` → `fetchApiEventos`
5. `updateCustomer` → migrar a api-mcp (con `inputCustomer` shape)
6. Smoke test cada uno + commit

### Fase 3f — Decisión bilateral (pendiente coordinación)

- `getInvoices` → ¿migrar a `getInvoice` canonical? Coordinar con backend.
- `createUserWithPassword` → ¿Firebase Auth flow puro o seguir legacy?

### NO migrar (mantener `api.bodasdehoy.com`)

- `getAllProducts` para tickets PR (no es subscripción)
- `createCheckoutSession` tickets PR
- `setCheckoutItems`
- `getEventTicket` (cliente ya OK con stub)
- `getAllBusiness` (backend no implementa todavía)

## Riesgos

- Cambiar de `fetchApiBodas` a `fetchApiEventos` cambia el destino backend → si los datos no están sincronizados entre los 2 backends, se rompe.
- `updateCustomer` con shape `inputCustomer` necesita verificar campos coincidentes.
- Migrar billing puede tocar componentes shared con tickets PR — separar bien.
