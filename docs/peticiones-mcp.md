# Instrucciones para el equipo de api2 (GraphQL)

> **Fecha:** Febrero 2026
> **Contexto:** Somos el equipo de frontend (copilot). Consumimos api2 vía GraphQL a través de api-ia como proxy. Las peticiones aquí descritas son necesarias para completar las funcionalidades de la UI de facturación y gestión de saldo del cliente.
> **Servidor api2:** `testapi2` (143.198.62.113) — SSH con `~/.ssh/shared_key`, código en `/var/www/api-production/`

---

## 🟡 PETICIONES NUEVAS

### Petición #1 — `getSubscriptionPlans` accesible sin autenticación [PRIORIDAD ALTA]

**Para qué sirve:** Mostrar el catálogo de planes disponibles (FREE/BASIC/PRO/MAX/ENTERPRISE) con precios y límites en la página pública `/settings/billing/planes`. Actualmente la página muestra un placeholder porque la query requiere autenticación.

**Estado actual:** La query `getSubscriptionPlans(development, tier, is_public)` ya existe en el schema de api2.

**Problema:** Requiere JWT de usuario autenticado para ejecutarse. El catálogo de planes debería ser visible sin necesidad de login (o al menos con solo el header `X-Development`).

**Solución propuesta:** Permitir que la query se ejecute con solo el header `X-Development: {dev_key}` cuando se pase `is_public: true` en los parámetros, sin requerir Bearer JWT.

**Alternativa aceptable:** Crear un endpoint REST separado en api2 (ej: `GET /api/plans/public`) que devuelva los planes sin auth, o exponer la query GraphQL sin auth en una ruta pública.

**Lo que necesitamos recibir:**
```graphql
query GetSubscriptionPlans($is_public: Boolean) {
  getSubscriptionPlans(is_public: $is_public) {
    id
    name          # "FREE", "BASIC", "PRO", "MAX", "ENTERPRISE"
    tier
    price_monthly
    price_yearly
    currency
    limits {
      ai_tokens_per_month
      images_per_month
      whatsapp_messages_per_month
      storage_gb
    }
    features       # Lista de strings con las características incluidas
    is_active
    is_highlighted  # Para destacar el plan recomendado
  }
}
```

---

### Petición #2 — `wallet_getAutoRechargeConfig` query [PRIORIDAD ALTA]

**Para qué sirve:** Mostrar al usuario su configuración actual de auto-recarga en la UI de billing. Sin esta query, podemos activar/desactivar pero no podemos mostrar los valores actuales configurados.

**Estado actual:** `wallet_getBalance` devuelve `auto_recharge_enabled: bool` pero no los detalles completos (umbral, importe, método de pago).

**Spec de la nueva query:**
```graphql
type AutoRechargeConfig {
  enabled: Boolean!
  threshold: Float          # EUR — recargar cuando saldo baje de X
  amount: Float             # EUR — cuánto recargar automáticamente
  payment_method_id: String  # Stripe PM ID
  payment_method_details: PaymentMethodDetails  # Info de la tarjeta (solo lectura)
  last_triggered_at: String  # ISO 8601 timestamp
  attempts_count: Int        # Cuántas veces se ha ejecutado
}

type PaymentMethodDetails {
  card_brand: String   # "visa", "mastercard", etc.
  card_last4: String   # Últimos 4 dígitos
}

type Query {
  wallet_getAutoRechargeConfig: AutoRechargeConfig
}
```

**Ejemplo de respuesta esperada:**
```json
{
  "wallet_getAutoRechargeConfig": {
    "enabled": true,
    "threshold": 10.0,
    "amount": 50.0,
    "payment_method_id": "pm_xxx",
    "payment_method_details": {
      "card_brand": "visa",
      "card_last4": "4242"
    },
    "last_triggered_at": "2026-02-15T10:30:00Z",
    "attempts_count": 3
  }
}
```

---

### Petición #3 — Confirmar campos `metadata` en `wallet_getTransactions` [PRIORIDAD ALTA]

**Para qué sirve:** El historial de transacciones del cliente muestra detalles de cada consumo de IA (modelo usado, tokens consumidos, sesión). Actualmente el campo `metadata` llega como JSON pero no sabemos si contiene los campos que necesitamos.

**Verificar que `WalletTransaction.metadata` incluye:**
```json
{
  "model": "claude-3-5-sonnet-20241022",   // Nombre real del modelo
  "provider": "anthropic",                  // Proveedor de IA
  "input_tokens": 1500,                     // Tokens de entrada
  "output_tokens": 350,                     // Tokens de salida
  "session_id": "sess_xxx"                  // ID de sesión del chat
}
```

**Acción requerida:**
1. Confirmar que estos campos están siendo guardados cuando se registra un consumo de tokens IA
2. Si `model` está llegando como `"anthropic_model"` (bug de api-ia), el fix de api-ia debería corregirlo automáticamente (ver `peticiones-api-ia.md` Bug #1)
3. Si algún campo no existe en el tipo GraphQL, añadirlo al schema

**Nota importante:** El campo `metadata` en el schema GraphQL está tipado como `JSON`. Es importante que el schema refleje la estructura real para que los clientes sepan qué esperar.

---

### Petición #4 — `wallet_getPaymentMethods` query [PRIORIDAD MEDIA — futuro]

**Para qué sirve:** Listar los métodos de pago Stripe guardados del usuario para la UI de configuración de auto-recarga con tarjeta guardada.

**Spec:**
```graphql
type PaymentMethod {
  id: String!
  type: String!            # "card"
  card_brand: String       # "visa", "mastercard", "amex"
  card_last4: String!      # Últimos 4 dígitos
  card_exp_month: Int!
  card_exp_year: Int!
  is_default: Boolean!
}

type Query {
  wallet_getPaymentMethods: [PaymentMethod!]!
}
```

---

### Petición #5 — `wallet_adjustment` mutation accesible como admin [PRIORIDAD MEDIA]

**Para qué sirve:** Ajustar saldos manualmente desde herramientas de dev/admin. Necesario para el panel de desarrollo (drenar saldo a 0 para probar flujos de pago) y para soporte al cliente.

**Estado actual:** Existe `wallet_adjustment` en api2 como admin mutation pero no está accesible desde el cliente copilot (ni directamente ni via proxy en api-ia).

**Lo que necesitamos:** Que api-ia exponga un endpoint REST `POST /api/wallet/adjustment` que internamente llame a esta mutation de api2 (ver `peticiones-api-ia.md` Endpoint #2).

**Si preferís exponer directamente desde api2:** Una mutation GraphQL accesible con header admin:
```graphql
mutation WalletAdjustment($input: WalletAdjustmentInput!) {
  wallet_adjustment(input: $input) {
    success
    new_balance
    transaction_id
  }
}

input WalletAdjustmentInput {
  user_id: String!
  amount: Float!        # Positivo = añadir, Negativo = quitar
  description: String!
}
```

---

## 📋 RESUMEN DE PRIORIDADES

| # | Query/Mutation | Descripción | Prioridad | Bloqueado en frontend |
|---|---|---|---|---|
| 1 | `getSubscriptionPlans` sin auth | Catálogo de planes público | 🔴 Alta | Página `/settings/billing/planes` vacía |
| 2 | `wallet_getAutoRechargeConfig` | Config actual de auto-recarga | 🔴 Alta | UI de auto-recarga no implementable |
| 3 | `metadata` en `wallet_getTransactions` | Confirmar campos de metadata | 🔴 Alta | Historial de transacciones incompleto |
| 4 | `wallet_getPaymentMethods` | Métodos de pago guardados | 🟠 Media | Futuro — auto-recarga con tarjeta guardada |
| 5 | `wallet_adjustment` (admin) | Ajuste manual de saldo | 🟠 Media | DevTools + soporte al cliente |

---

## 🔗 Lo que ya funciona (para referencia)

Estas queries/mutations ya están integradas y funcionando desde el cliente:

| Operación | Estado |
|---|---|
| `wallet_getBalance` | ✅ Funcionando |
| `wallet_checkBalance` | ✅ Funcionando |
| `wallet_getTransactions` | ✅ Funcionando (metadata pendiente de confirmar) |
| `wallet_createRechargeSession` | ✅ Funcionando (Stripe checkout) |
| `wallet_checkAndConsume` | ✅ Funcionando |
| `getInvoices` | ✅ Funcionando |
| `getPaymentHistory` | ✅ Funcionando |
| `getSubscription` (usuario autenticado) | ✅ Funcionando |
| `getUsageStats` | ✅ Funcionando (datos incorrectos por Bug #1 de api-ia) |

---

## 🔗 Referencias

- Servidor: `testapi2` (143.198.62.113) — SSH con `~/.ssh/shared_key`
- Código base: `/var/www/api-production/`
- Schema GraphQL: `/var/www/api-production/src/graphql/typeDefs/`
- Los tipos de wallet están en: `wallet.graphql`
- Los tipos de suscripción están en: `subscription.ts` (o `.graphql`)
