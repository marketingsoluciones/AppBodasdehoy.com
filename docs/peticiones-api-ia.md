# Instrucciones para el equipo de api-ia

> **Fecha:** Febrero 2026
> **Prioridad:** Ver sección de cada ítem
> **Contexto:** Somos el cliente (frontend copilot). Solo interactuamos como usuario final: compramos créditos, consumimos servicios, vemos nuestro extracto. Los márgenes y precios internos son vuestro negocio — lo que nos importa es que los datos que nos lleguen sean correctos y tengamos los endpoints que necesitamos.

---

## 🔴 BUGS CRÍTICOS (afectan calidad de datos que ve el cliente)

### Bug #1 — Nombre de modelo incorrecto en el tracking de consumo

**Impacto:** El cliente ve `anthropic_model` en lugar del modelo real (ej: `claude-3-5-sonnet-20241022`) en su historial de transacciones y métricas de uso. Esto hace los datos de facturación incomprensibles.

**Archivo:** `/opt/backend/core/billing_manager.py` — línea ~257

**Problema actual:**
```python
# INCORRECTO — genera model="anthropic_model", "openai_model", etc.
model=f"{provider}_model"
```

**Fix requerido:** Pasar el nombre real del modelo desde el orchestrator/handler al `record_usage()`:
```python
# CORRECTO — pasar el nombre real del modelo
billing_manager.record_usage(
    user_id=...,
    provider="anthropic",
    model="claude-3-5-sonnet-20241022",  # ← nombre real, no f-string
    input_tokens=...,
    output_tokens=...
)
```

**Lo que necesitamos nosotros:** Que en `wallet_getTransactions` (api2), el campo `metadata.model` contenga el nombre real del modelo usado. Actualmente siempre llega `"anthropic_model"` o similar, lo que inutiliza el breakdown de consumo por modelo.

---

### Bug #2 — Tablas de precios inconsistentes en 3 archivos

**Impacto:** Los costes calculados son inconsistentes según qué código path se ejecute. El cliente puede ver importes diferentes para el mismo servicio.

**Archivos afectados:**
- `billing_manager.py` — tabla de precios propia
- `usage_tracking.py` — tabla de precios propia
- `cost_monitor.py` — tabla de precios propia

**Ejemplo de inconsistencia detectada:** GPT-4o input tiene `$2.50/M` en un archivo y `$5.00/M` en otro.

**Fix requerido:** Crear una única fuente de verdad:
```python
# /opt/backend/core/pricing.py (nuevo)
PRICING_TABLE = {
    "gpt-4o": {"input_per_m": 2.50, "output_per_m": 10.00},
    "claude-3-5-sonnet-20241022": {"input_per_m": 3.00, "output_per_m": 15.00},
    # ... resto de modelos
}
```
E importarla en los 3 archivos en lugar de duplicar.

---

### Bug #3 — `get_usage_summary()` siempre devuelve ceros

**Impacto:** El endpoint de estadísticas de uso devuelve datos vacíos/cero. El cliente ve consumo 0 aunque haya gastado créditos.

**Archivo:** `/opt/backend/core/billing_manager.py` — función `get_usage_summary()` (~línea 455)

**Problema:** La función tiene un `TODO` sin implementar y devuelve estructura vacía.

**Fix requerido:** Implementar la función consultando MongoDB o api2 (GraphQL `getUsageStats`) para devolver datos reales del período solicitado.

---

### Bug #4 — Estadísticas de performance son datos inventados

**Impacto:** Si el cliente (en panel de administración o debug) consulta métricas de performance, ve datos falsos.

**Archivo:** `/opt/backend/api/stats_api2.py` — función `get_performance_stats()`

**Problema:** Devuelve hardcoded `850.5ms`, `0.98` success rate, etc. en lugar de datos reales.

**Fix requerido:** Calcular percentiles (p50/p95/p99) desde Redis, donde ya se almacenan métricas por request. Si Redis no tiene suficiente data, al menos devolver `null` / indicador de "sin datos" en vez de valores inventados.

---

## 🟡 NUEVOS ENDPOINTS NECESARIOS

### Endpoint #1 — `GET /api/wallet/auto-recharge` [PRIORIDAD ALTA]

**Para qué sirve:** Necesitamos leer la configuración actual de auto-recarga del usuario para mostrarla en la UI de facturación. Sin este endpoint, podemos activar/desactivar auto-recarga pero no podemos mostrar la configuración actual al usuario cuando vuelve a la pantalla.

**Actualmente existe:**
- `POST /api/wallet/auto-recharge` ✅
- `DELETE /api/wallet/auto-recharge` ✅
- `GET /api/wallet/auto-recharge` ❌ **FALTA**

**Spec del endpoint:**
```
GET /api/wallet/auto-recharge
Authorization: Bearer {JWT}

Response 200:
{
  "enabled": true,
  "threshold": 10.0,      // Umbral en EUR — recargar cuando saldo baje de X
  "amount": 50.0,         // Cuánto recargar automáticamente
  "payment_method_id": "pm_xxx" | null,  // Stripe payment method ID
  "last_triggered_at": "2026-02-15T10:30:00Z" | null,
  "success": true
}

Response 200 (sin auto-recarga configurada):
{
  "enabled": false,
  "threshold": null,
  "amount": null,
  "payment_method_id": null,
  "last_triggered_at": null,
  "success": true
}
```

**Implementación sugerida:** Leer desde MongoDB la config guardada por el `POST`, o hacer proxy a api2 si ya lo tiene almacenado allí.

---

### Endpoint #2 — `POST /api/wallet/adjustment` [PRIORIDAD MEDIA — admin]

**Para qué sirve:** Para herramientas de desarrollo (drenar saldo a 0 para probar flujos de pago) y para panel de administración (ajustar saldos manualmente sin pasar por Stripe).

**Actualmente en api2:** Existe `wallet_adjustment` como admin mutation de GraphQL pero no está expuesto como REST accesible desde el cliente.

**Spec del endpoint:**
```
POST /api/wallet/adjustment
Header: X-Admin-Key: {ADMIN_SECRET}  (o Bearer con rol admin)

Body:
{
  "user_id": "string",    // El user_id del usuario a ajustar
  "amount": -50.0,        // Positivo = añadir, Negativo = quitar
  "description": "Ajuste manual por soporte"
}

Response 200:
{
  "success": true,
  "new_balance": 25.50,
  "transaction_id": "txn_xxx"
}
```

**Nota de seguridad:** Este endpoint DEBE requerir autenticación admin (X-Admin-Key o rol admin en JWT). No es para usuarios finales.

---

### Endpoint #3 — `GET /api/wallet/payment-methods` [PRIORIDAD BAJA — futuro]

**Para qué sirve:** Listar los métodos de pago Stripe guardados del usuario, necesario para la UI de auto-recarga con tarjeta guardada.

**Spec:**
```
GET /api/wallet/payment-methods
Authorization: Bearer {JWT}

Response 200:
{
  "payment_methods": [
    {
      "id": "pm_xxx",
      "type": "card",
      "card_brand": "visa",
      "card_last4": "4242",
      "card_exp_month": 12,
      "card_exp_year": 2027,
      "is_default": true
    }
  ],
  "success": true
}
```

---

## ⚙️ MEJORAS DE CONFIGURACIÓN

Las siguientes constantes están hardcodeadas en el código pero deberían ser variables de entorno para facilitar ajustes sin redeploy:

| Constante | Valor actual | Variable de entorno propuesta |
|---|---|---|
| Mínimo de recarga | `5 EUR` hardcoded en `wallet_router.py` | `MIN_RECHARGE_AMOUNT` |
| Cooldown alertas de cuota | `12h` hardcoded en `quota_monitor.py` | `QUOTA_ALERT_COOLDOWN_HOURS` |
| Cooldown alertas de saldo | `12h` hardcoded en código | `BALANCE_ALERT_COOLDOWN_HOURS` |

---

## 📋 RESUMEN DE PRIORIDADES

| # | Tipo | Descripción | Prioridad |
|---|---|---|---|
| 1 | Bug | Nombre de modelo incorrecto en tracking | 🔴 Alta |
| 2 | Bug | Precios inconsistentes en 3 archivos | 🔴 Alta |
| 3 | Bug | `get_usage_summary()` devuelve ceros | 🟠 Media |
| 4 | Bug | Performance stats son datos inventados | 🟡 Baja |
| 5 | Endpoint nuevo | `GET /api/wallet/auto-recharge` | 🔴 Alta |
| 6 | Endpoint nuevo | `POST /api/wallet/adjustment` (admin) | 🟠 Media |
| 7 | Endpoint nuevo | `GET /api/wallet/payment-methods` | 🟡 Baja |
| 8 | Config | Hardcoded constants → env vars | 🟡 Baja |

---

## 🔗 Referencias

- Servidor: `backend-ia-v2` (164.92.81.153) — SSH con `~/.ssh/shared_key`
- Código base: `/opt/backend/`
- Los archivos afectados están en `/opt/backend/core/` y `/opt/backend/api/`
