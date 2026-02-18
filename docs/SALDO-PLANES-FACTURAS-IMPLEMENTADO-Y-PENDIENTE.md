# Saldo, recarga, planes, facturas, multinivel – Qué está implementado y qué no (17 feb 2026)

Análisis detallado de todo lo relacionado con: **recargar saldo**, **ver crédito/saldo**, **planes contratados**, **histórico de pagos**, **ver y descargar facturas**, **ver planes**, **cambiar de plan / recargar servicio**, **multinivel** (saldo niveles inferiores), **dar crédito / saldo revendedor**, y **tratamiento del 402 (saldo agotado)** cuando el usuario se queda sin saldo.

---

## 1. Lo que SÍ está implementado (Copilot – API2)

### 1.1 Ver saldo / crédito

| Funcionalidad | Dónde | Cómo |
|---------------|-------|------|
| **Saldo total** | `apps/copilot` → Ajustes → Facturación | `useWallet()` → `walletService.getBalance()` (GraphQL `wallet_getBalance`). Muestra `totalBalance`, `balance` (principal), `bonusBalance` (bonificación). |
| **Formato de saldo** | Misma página | `formatBalance(totalBalance)` con moneda (EUR). |
| **Saldo bajo** | Misma página | `isLowBalance` (totalBalance <= lowBalanceThreshold). Mensaje: "Saldo bajo. Recarga para continuar usando los servicios." |
| **Estado de wallet** | API2 | `status`: ACTIVE | SUSPENDED | CLOSED. |

**Archivos:** `apps/copilot/src/hooks/useWallet.ts`, `apps/copilot/src/services/api2/wallet.ts`, `apps/copilot/src/app/[variants]/(main)/settings/billing/index.tsx`.

### 1.2 Recargar saldo

| Funcionalidad | Dónde | Cómo |
|---------------|-------|------|
| **Botón "Recargar Saldo"** | Facturación (Copilot) | Abre `RechargeModal`. |
| **Modal de recarga** | `RechargeModal` | `startRecharge(amount)` → API2 crea sesión de pago → devuelve `checkout_url` → redirección a Stripe (o pasarela). |
| **URLs de éxito/cancelación** | `startRecharge(amount, successUrl?, cancelUrl?)` | Opcionales para volver tras el pago. |

**Archivos:** `apps/copilot/src/components/Wallet/RechargeModal.tsx`, `apps/copilot/src/services/api2/wallet.ts` (mutación de sesión de recarga).

### 1.3 Ver plan contratado

| Funcionalidad | Dónde | Cómo |
|---------------|-------|------|
| **Plan actual** | Facturación → "Mi Plan" | `useBilling()` → `invoicesService.getSubscription()` (GraphQL `getUserSubscription`). Muestra `plan_name`, `plan_tier`, `status`, `current_period_end`. |
| **Límites del plan** | Misma sección | `subscription.limits`: monthly_ai_tokens, current_ai_tokens, monthly_images, current_images, etc. |
| **Próximo cobro** | Misma sección | `formatDate(subscription.current_period_end)`. |
| **Sin suscripción** | Misma sección | Mensaje: "No tienes una suscripción activa. Usa el sistema de prepago (wallet) para pagar por uso." |

**Archivos:** `apps/copilot/src/hooks/useBilling.ts`, `apps/copilot/src/services/api2/invoices.ts` (GET_SUBSCRIPTION_QUERY), `apps/copilot/src/app/[variants]/(main)/settings/billing/index.tsx`.

### 1.4 Histórico de pagos

| Funcionalidad | Dónde | Cómo |
|---------------|-------|------|
| **Tabla "Historial de Pagos"** | Facturación (Copilot) | `fetchPayments()` → `getPaymentHistory(page, 20)`. Columnas: Fecha, Descripción, Monto, Estado. |
| **Tipos de pago** | API2 | WALLET_RECHARGE, SUBSCRIPTION_PAYMENT, ONE_TIME_PURCHASE, OVERAGE_CHARGE. |
| **Paginación** | Misma tabla | `invoicesPagination`. |

**Archivos:** `apps/copilot/src/app/[variants]/(main)/settings/billing/index.tsx`, `apps/copilot/src/services/api2/invoices.ts` (GET_PAYMENT_HISTORY_QUERY).

### 1.5 Ver y descargar facturas

| Funcionalidad | Dónde | Cómo |
|---------------|-------|------|
| **Listado de facturas** | Facturación (Copilot) | `fetchInvoices()` con filtros (status, fechas, búsqueda). Tabla con invoice_number, period, total, status. |
| **Detalle de factura** | `/settings/billing/invoices/[id]` | Página de detalle por factura. |
| **Descargar PDF** | Listado y detalle | `downloadInvoicePDF(invoiceId)` → `getInvoicePDF` → `pdf_url` (temporal). |
| **Estados** | API2 | DRAFT, PENDING, PAID, VOID, UNCOLLECTIBLE. |

**Archivos:** `apps/copilot/src/services/api2/invoices.ts` (getInvoices, getInvoicePDF), `apps/copilot/src/app/[variants]/(main)/settings/billing/invoices/[id]/page.tsx`, componentes `InvoiceDetail`, etc.

### 1.6 Historial de transacciones (wallet) e historial de paquetes

| Funcionalidad | Dónde | Cómo |
|---------------|-------|------|
| **Historial de transacciones** | `/settings/billing/transactions` | `wallet_getTransactions` (RECHARGE, CONSUMPTION, REFUND, BONUS, ADJUSTMENT, TRANSFER, EXPIRATION). |
| **Historial de paquetes** | `/settings/billing/packages/history` | Compras de paquetes; botón "Exportar CSV". |

**Archivos:** `apps/copilot/src/app/[variants]/(main)/settings/billing/transactions/page.tsx`, `apps/copilot/src/app/[variants]/(main)/settings/billing/packages/history/page.tsx`.

### 1.7 Uso del mes y gráficos

| Funcionalidad | Dónde | Cómo |
|---------------|-------|------|
| **Uso este mes** | Facturación → "Uso Este Mes" | `getUsageStats(period)` → tokens IA por modelo, imágenes por proveedor, comunicaciones (WhatsApp, SMS, email), almacenamiento, total_cost. |
| **Gráficos de consumo** | "Gráficos de Consumo" | `ConsumptionChart`, `UsageMetrics`. |
| **Desglose por origen** | API2 | `billing_source_breakdown`: subscription, wallet, free_tier. |

**Archivos:** `apps/copilot/src/hooks/useBilling.ts`, `apps/copilot/src/services/api2/invoices.ts` (GET_USAGE_STATS_QUERY), `ConsumptionChart`, `UsageMetrics`.

### 1.8 Otros (Copilot)

- **WalletBadge:** componente que puede mostrar indicador de saldo (según uso en app).
- **UserInfo / PlanTag:** muestra etiqueta de plan de suscripción (subscriptionPlan del user store) en el panel de usuario.
- **Verificación de saldo antes de consumir:** `wallet_checkBalance(amount)`, `consumeService(sku, quantity)` en wallet service (para consumir saldo por servicio).

---

## 2. Lo que NO está implementado o está a medias

### 2.1 Cuando el usuario se queda sin saldo (402 desde api-ia)

| Funcionalidad | Estado | Detalle |
|---------------|--------|---------|
| **Detectar 402** en proxy de chat | ❌ No | En `apps/web/pages/api/copilot/chat.ts` todo `!backendResponse.ok` se trata igual; no hay `if (backendResponse.status === 402)`. |
| **Devolver 402** al cliente con body (saldo_agotado, message, payment_url, upgrade_url, plans) | ❌ No | No se lee ni se reenvía ese body. |
| **UI "Saldo agotado"** en Copilot / web | ❌ No | No hay componente que muestre mensaje específico ni botón "Recargar" / "Mejorar plan" cuando la IA devuelve 402. |
| **Enlace a recarga desde el error** | ❌ No | Si api-ia enviara `payment_url` o `upgrade_url`, no los usamos ni mostramos. |

**Conclusión:** El flujo "se queda sin saldo → api-ia devuelve 402 → usuario ve mensaje y puede recargar/ver planes" **no está implementado**. La recarga que sí existe es la del **wallet (Facturación)** del Copilot, no la reacción al 402 del chat.

### 2.2 Ver planes (catálogo) y cambiar de plan

| Funcionalidad | Estado | Detalle |
|---------------|--------|---------|
| **Listado de planes disponibles** | ❌ No | No hay pantalla "Planes" ni query tipo `getAvailablePlans` o catálogo de planes con precios. |
| **Cambiar de plan** (upgrade/downgrade suscripción) | ❌ No | Se muestra el plan actual pero no hay flujo "Cambiar plan" ni integración con Stripe/API2 para cambiar suscripción. |
| **Recargar un servicio específico** (ej. solo IA, solo SMS) | ⚠️ Parcial | El wallet es saldo global; la recarga es genérica. No hay "recargar solo servicio X" en UI (API2 podría tener SKUs por servicio). |

**Nota:** Existe `UpgradeToMaxModal` en el Copilot para "Upgrade a Auto Max" (modelos); no es el flujo de planes de facturación/suscripción.

### 2.3 Multinivel: saldo de niveles inferiores, revendedor

| Funcionalidad | Estado | Detalle |
|---------------|--------|---------|
| **Ver saldo de niveles inferiores** | ❌ No | No hay modelo ni UI de jerarquía (padre/hijos) ni consulta de saldo agregado por subcuentas. |
| **Saldo revendedor** | ❌ No | No hay concepto de "revendedor" ni vista de saldo asignado a revendedor o a cuentas hijas. |
| **Dar crédito** (admin a usuario o a nivel inferior) | ❌ No | No hay pantalla de admin "Dar crédito a usuario" ni mutación tipo "wallet_credit" o "wallet_adjust" expuesta en la UI del Copilot (API2 podría tener ajustes internos). |

**Nota:** El **admin billing** del Copilot (`/admin/billing`) es un dashboard de **costos** (por proveedor IA, canal, almacenamiento, etc.), no gestión de saldo multinivel ni revendedores.

### 2.4 Balance de keys (api-ia) en UI

| Funcionalidad | Estado | Detalle |
|---------------|--------|---------|
| **Mostrar balance de keys de IA** (whitelabel) | ❌ No | api-ia preguntó si queremos mostrarlo; no hay endpoint nuestro ni pantalla para "saldo de keys" (eso lo gestiona api-ia/API2). |
| **Notificaciones keys deshabilitadas** | ❌ No | Sin decisión ni UI (Slack/Email/Dashboard). |

---

## 3. apps/web (portal bodas) vs Copilot

| Área | apps/web | apps/copilot |
|------|----------|--------------|
| **Facturación** | `HistorialFacturacion` usa `queries.getInvoices` (API bodas/GraphQL propio). Lista facturas (id, fecha, total, estado) y permite descargar/ver. | Facturación vía API2: wallet, suscripción, facturas, pagos, uso. |
| **Saldo / recarga** | No hay pantalla de saldo ni recarga en la web principal. | Sí: wallet, recarga, historiales. |
| **Planes** | No hay sección "Planes" ni "Cambiar plan" en la web. | Solo "Mi Plan" (actual), sin catálogo ni cambio. |

La **experiencia completa de saldo, recarga, planes y facturas** está en el **Copilot** (API2); la web tiene solo historial de facturas (otro backend).

---

## 4. Resumen: qué falta para una experiencia completa

Ordenado por lo que pediste:

1. **Cuando se queda sin saldo (402):** Implementar detección 402 en proxy, body (saldo_agotado, payment_url, upgrade_url, plans), y UI que muestre mensaje + enlace a recarga/planes.
2. **Recargar:** ✅ Implementado (wallet + RechargeModal).
3. **Ver crédito/saldo:** ✅ Implementado (Facturación Copilot).
4. **Ver planes contratados:** ✅ Implementado ("Mi Plan").
5. **Histórico de pagos:** ✅ Implementado.
6. **Ver y descargar facturas:** ✅ Implementado (listado + PDF).
7. **Ver planes (catálogo):** ❌ No implementado.
8. **Cambiar de plan / recargar servicio específico:** ❌ Cambiar plan no; recarga es genérica (sí).
9. **Multinivel – saldo niveles inferiores:** ❌ No implementado.
10. **Dar crédito / saldo revendedor:** ❌ No implementado.
11. **Balance de keys en UI:** ❌ Pendiente decisión y posible endpoint api-ia/API2.

---

## 5. Referencias de código (rápidas)

| Tema | Archivos principales |
|------|----------------------|
| Wallet / saldo / recarga | `apps/copilot/src/hooks/useWallet.ts`, `apps/copilot/src/services/api2/wallet.ts`, `RechargeModal.tsx` |
| Facturación / facturas / pagos / suscripción | `apps/copilot/src/hooks/useBilling.ts`, `apps/copilot/src/services/api2/invoices.ts`, `settings/billing/index.tsx` |
| Transacciones y paquetes | `settings/billing/transactions/page.tsx`, `settings/billing/packages/history/page.tsx` |
| Proxy chat (402 no implementado) | `apps/web/pages/api/copilot/chat.ts` |
| Facturas en web | `apps/web/components/Facturacion/HistorialFacturacion.tsx`, `apps/web/utils/Fetching.ts` (getInvoices) |
| Admin costos (no multinivel) | `apps/copilot/src/app/[variants]/(main)/admin/billing/` |

Si quieres priorizar, lo que más impacta al usuario cuando "se queda sin saldo" en el chat es: **implementar 402 en proxy + UI** y, opcionalmente, **enlazar a la pantalla de Facturación/Recarga** que ya existe.
