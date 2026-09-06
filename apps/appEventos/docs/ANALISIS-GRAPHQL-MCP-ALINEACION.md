# Análisis GraphQL / API2 — alineación app eventos vs chat-ia vs API app

**Objetivo:** inventario de operaciones hacia **API2** (suscripción/facturación) y separación de **API app** / **api.bodasdehoy** (eventos), para detectar **discrepancias** y coordinar con API2.

---

## 1. Tres backends distintos (no mezclar)

| Backend | URL típica (env) | Operaciones en repo |
|---------|------------------|---------------------|
| **API2 GraphQL** | `NEXT_PUBLIC_API2_URL` … `/graphql` | Planes, suscripción, checkout, portal, (rest push opcional) |
| **API app (eventos)** | `NEXT_PUBLIC_BASE_URL` + `api.ApiApp` → `/graphql` | `getEventsByID`, `creaInvitado`, eventos, invitados, etc. (`Fetching.ts` → decenas de queries/mutations) |
| **API bodas (graphql)** | `NEXT_PUBLIC_API_BODAS_URL` / proxy `proxy-bodas` | `fetchApiBodas` — auth, usuarios, notificaciones, WhatsApp, muchas queries distintas del grafo “bodas” |

**Socket.IO** no es GraphQL: base `NEXT_PUBLIC_SOCKET_URL` o `NEXT_PUBLIC_BASE_API_BODAS`.

---

## 2. Operaciones que van **directo a API2** (app eventos + chat-ia)

### 2.1 Misma operación, dos apps (revisar siempre juntos)

| Operación | app eventos | chat-ia | Notas / discrepancias resueltas |
|-----------|-------------|---------|----------------------------------|
| `getMySubscription` | `hooks/usePlanLimits.ts` (fetch + `X-Development`) | `services/api2/subscriptions.ts`, `invoices.ts` (`api2Client`) | **Alineado (2026-04):** ninguna app pide `status` hasta deploy resolver API2; `trial_end` y periodos sí. Antes chat-ia pedía `status` y podía romper como app eventos. |
| `getSubscriptionPlans` | Solo `development` + `is_public: true` | `development` + opcional `tier` + `is_public: true` por defecto en código | Firma distinta; API2 debe aceptar variables opcionales. |
| `subscribeToPlan` | `pages/facturacion.tsx` (fetch inline) | `subscriptions.ts` | Misma mutation; URLs retorno distintas (`/facturacion` vs `/settings/billing`). |
| `createCustomerPortalSession` | `MetodosDePago.tsx` (fetch) | (no duplicado en grep rápido) | Solo app eventos en este análisis. |

### 2.2 Solo en chat-ia (API2)

- `getInvoices`, detalle factura, PDF, `getPaymentHistory`, `getUsageStats`, etc. — `services/api2/invoices.ts`.

### 2.3 Solo app eventos (no GraphQL API2)

- `pages/api/push-subscribe.ts` — **REST** `POST {base}/api/push/subscribe` donde base es host API2 **sin** `/graphql` (revisar que API2 exponga ruta).

---

## 3. Riesgos conocidos con API2

1. **Enums** (`SubscriptionStatus`, etc.): BD en minúsculas vs esquema MAYÚSCULAS → **resolver** en API2; cliente no pide campo hasta verificación.
2. **Tipos duplicados:** `Subscription.status` en `invoices.ts` tenía `CANCELED` vs `CANCELLED` — unificar con esquema API2 cuando se documente.
3. **Cuota invitados:** mutaciones en **API app** (`creaInvitado`, …) vs límites UI en **API2** — backlog; nombre `agregarInvitado` en mensajes API2 ≠ `creaInvitado` en código app eventos.

---

## 4. Pedir a API2 (checklist de contrato)

- [ ] Documento/schema publicado o introspection estable para: `getMySubscription`, `getSubscriptionPlans`, `subscribeToPlan`, `createCustomerPortalSession`, facturas/uso en chat-ia.
- [ ] Confirmar valores enum exactos (`CANCELLED` vs `CANCELED`, `TRIAL` vs `TRIALING`, etc.).
- [ ] Confirmar REST `/api/push/subscribe` si se sigue usando desde app eventos.
- [ ] Roadmap cuota `guests-per-event` en mutación servidor (API app o API2 según diseño).

---

## 5. Cambios aplicados en repo (esta sesión)

- **chat-ia:** `getMySubscription` sin campo `status` en `subscriptions.ts` e `invoices.ts`; tipos con `status?`; tests ajustados.
- **app eventos:** ya omitía `status` en `usePlanLimits.ts` (con `trial_end`).

Mantener **paridad** entre ambas apps al añadir de nuevo `status` tras deploy API2.

