# Spec operaciones pendientes api-mcp (para BACKEND)

> 2026-05-27. Tras triage por consumidores REALES en el front: de las "5 faltantes"
> solo **2 tienen uso real**. Las otras 3 son dead-code (las elimino del front).

## ✅ 2 operaciones que SÍ implementar (con consumidores reales)

### 1. `getAllProducts` — productos Stripe (facturación + ticketing)
**Consumidores (4):** facturacion.tsx, EntradasGratis.tsx, VentasEntradas.tsx, index.tsx
**⚠️ Posible duplicado:** ¿esto ya lo cubre `getSubscriptionPlans` (que SÍ existe)? Si el shape es compatible, me adapto y NO hace falta resolver nuevo. Confirmad.

```graphql
query ($grupo: String) {
  getAllProducts(grupo: $grupo) {
    currency
    total
    results {
      id name description images usage subscriptionId
      current_period_start current_period_end
      prices {
        id currency unit_amount
        recurring { interval trial_period_days }
      }
      metadata { grupo includes segmento tipo caracteristica }
    }
  }
}
```
Semántica: lista de productos/planes Stripe filtrables por `grupo`. Devuelve precios + metadata de segmentación.

### 2. `getAllBusiness` → resolver `getAllBusinesses` — directorio de negocios/lugares
**Consumidor (1):** BlockLugarEvento.tsx (selector de lugar del evento)

```graphql
query ($criteria: searchCriteriaBusiness, $sort: sortCriteriaBusiness, $skip: Int, $limit: Int, $development: String!) {
  getAllBusinesses(searchCriteria: $criteria, sort: $sort, skip: $skip, limit: $limit, development: $development) {
    total
    results {
      _id city businessName slug content
      imgMiniatura { i1024 i800 i640 i320 }
    }
  }
}
```
Semántica: directorio de negocios/lugares del development, con búsqueda + orden + paginación skip/limit.
Nota: usa input types `searchCriteriaBusiness` + `sortCriteriaBusiness` (legacy apiapp) — pueden simplificarse a `JSON` si preferís.

## 🟢 3 operaciones DEAD-CODE (NO implementar — las elimino del front)

Definidas en Fetching.ts pero **sin consumidores reales** (verificado `queries.X` y `queries?.X`):
- `generatePdf` — el PDF se genera client-side en utils/pdfGenerator.ts (función local, no esta mutation)
- `getGeoInfo` — utils/geo.ts no la llama (función local homónima)
- `updateTasksOrder` — sin uso

## Estado de lo demás (ya cerrado por BACKEND, re-probado live ✅)
- 6 campos `type Evento` (estilo, tematica, listIdentifiers, templateEmailSelect, templateWhatsappSelect, imgInvitacion) → FIXED (f96e997)
- 6 ops (nuevoPago/editPago/borraPago, getPlanSpaceSelect, getPsTemplate, getItinerario) → existen (44a6301, d48c871)
- Conexión DB eventos → OK (getEventosByUsuario=158, getEventos=228)

## Pendiente infra (no es operación)
- Host destino de imágenes de eventos (hoy apiapp vía UrlImage) → a stakeholders.
