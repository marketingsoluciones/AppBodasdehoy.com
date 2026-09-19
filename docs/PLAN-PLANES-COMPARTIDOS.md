# Plan: mejorar el sistema de planes y compartir catálogo entre developers (tenants)

## Objetivo

Tener un sistema de planes consistente y operable para múltiples tenants (developers/whitelabels), donde:

- El catálogo de planes se puede **compartir** entre tenants cuando conviene.
- Se puede **override** por tenant (precios, límites, features) sin duplicar todo.
- Los límites se **aplican de verdad** (enforcement) en los puntos críticos, no solo en UI.
- El frontend muestra límites coherentes con lo que el backend realmente hace.

## Estado actual (lo que el repo permite afirmar)

- Lista de tenants (11) y flags básicos en [developments.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/packages/shared/src/types/developments.ts).
- Contrato de límites por SKU compartido: `free_quota`, opcional `daily_quota`, opcional `hourly_velocity_limit`, `overage_enabled/price` en [types.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/packages/shared/src/plans/types.ts) y gating UI en [gates.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/packages/shared/src/plans/gates.ts).
- appEventos y memories-web cargan catálogo público por tenant y hacen fallback a FREE si no hay suscripción ([usePlanLimits.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos/hooks/usePlanLimits.ts), [usePlan.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/memories-web/hooks/usePlan.ts)).
- En appEventos hoy hay un gate UI claro para WhatsApp (no para events/guests): [SendButton.tsx](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos/components/Invitaciones/components/SendButton.tsx).
- En chat-ia existe infraestructura de “rate_limit/insufficient_balance” y banners, pero el enforcement fuerte depende de backend; el repo documenta un inventario en [AUDITORIA-PLANES-LIMITES-ENFORCEMENT.md](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/docs/AUDITORIA-PLANES-LIMITES-ENFORCEMENT.md).

## Decisión clave: ¿cómo “compartimos planes”?

Hay 2 modelos viables. Recomendación: **Modelo A** (catálogo base compartido + overrides por tenant).

## Aclaración: no es 1 solo “producto” (Eventos vs Memories vs Web/Creador vs Diseño)

Memories y el Creador/Web pueden tener pricing y límites distintos a “Eventos”, y “Diseño de espacios” puede consumir `ai-tokens` y/o `image-gen`.

Además de “compartir planes entre tenants”, hay que decidir si el catálogo es:

- Unificado (un solo plan incluye varias familias de SKUs)
- Multi-catálogo (cada producto tiene su catálogo)
- Híbrido (plan base + add-ons por producto)

Recomendación práctica: Híbrido.

### Opción 1: Plan unificado (un solo plan, muchas SKUs)

- Un plan (FREE/BASIC/PRO/…) contiene límites para Eventos, IA, Memories y Web/Creador.
- Ventaja: 1 suscripción, 1 pantalla de facturación, 1 conjunto de reglas.
- Riesgo: si una marca quiere vender un módulo aparte, el plan unificado obliga a overrides complejos.

### Opción 2: Multi-catálogo (planes separados por producto)

- Un tenant puede tener varios catálogos: `events-v1`, `ai-v1`, `memories-v1`, `wedding-web-v1`.
- Cada producto se compra/activa por separado.
- Ventaja: perfecto si cada producto tiene pricing y conversión distinta.
- Coste: más operativa y más edge cases en frontend.

### Opción 3 (recomendada): Híbrido (plan base + add-ons)

- Mantener un plan base (por tenant) para el core.
- Activar módulos como add-ons (packs) que añaden SKUs o aumentan cuotas: Memories, Wedding Web/Creador, Diseño/Imágenes IA.
- El “plan efectivo” se calcula como `plan_base` + merge de `addons[]` por SKU (regla: max o suma según el SKU).

#### Detalle importante: add-on “aparte”, pero incluido en algunos planes

Este es el caso típico que describes: p.ej. **Memories** se vende como add-on, pero en algunos tiers (o en algunos tenants) viene incluido.

Cómo modelarlo sin duplicar planes:

- Mantener el add-on como entidad/plan separado (ej. `addon_id="memories"`).
- Permitir que un plan base declare “incluye add-ons”:
  - Por tier (ej. PRO incluye Memories, BASIC no)
  - Por tenant override (ej. bodasdehoy incluye Memories en BASIC, vivetuboda no)
- En el cálculo del plan efectivo, tratar “incluido” igual que “comprado”, pero con precio 0:
  - `effective_addons = purchased_addons ∪ included_addons`

Regla de merge por SKU (recomendación):

- Para cuotas tipo “contador” (álbumes, fotos, eventos, invitados): usar **máximo** entre base y add-ons.
- Para cuotas tipo “pool” (tokens): usar **suma** si el add-on añade un paquete de tokens, o **máximo** si el add-on sustituye el plan.
- Para flags (feature_restrictions): aplicar OR (si algún componente lo permite, permitido) salvo que exista un “deny” explícito por negocio.

## Pregunta clave: ¿los tokens IA aplican a todo o por producto?

Hay dos modelos válidos; hay que escoger uno y reflejarlo en SKUs.

### Modelo Tokens A: “bolsa global” (ai-tokens compartidos)

- `ai-tokens` es un pool que consume chat/copilot, asistente del creador (si usa LLM) y diseño de espacios (si usa LLM).
- Ventaja: simple; 1 contador; 1 banner.
- Riesgo: un módulo puede consumir el presupuesto del otro.

### Modelo Tokens B: “tokens por producto” (recomendado si se vende separado)

- SKUs distintos: `ai-tokens-chat`, `ai-tokens-designer`, `ai-tokens-wedding-web`.
- Ventaja: pricing claro y controlado por módulo.
- Coste: más SKUs y más UI.

Regla de decisión:

- Si el tenant vende “IA” como un único paquete → Tokens A.
- Si el tenant vende módulos por separado → Tokens B.

### Modelo A (recomendado): catálogo base + overrides por tenant

- Existe un “catálogo base” (p.ej. `catalog_id="weddings-v1"`) con planes FREE/BASIC/PRO/MAX/ENTERPRISE.
- Cada tenant referencia ese catálogo y puede:
  - override de `pricing` (precio/trial) por tenant,
  - override de `product_limits` por SKU (solo los que cambian),
  - override de textos/marketing.
- Ventajas:
  - Coherencia global: el mismo tier significa lo mismo salvo override explícito.
  - Operación barata: cambiar 1 SKU base se propaga a todos salvo excepciones.
- Requisito: backend debe resolver “plan efectivo” con herencia.

### Modelo B: catálogos totalmente independientes por tenant

- Cada tenant tiene su propio set de planes completos.
- Ventajas:
  - Libertad total para cada marca.
- Coste:
  - Duplicación y riesgo de drift; es el camino típico hacia incoherencia UI vs enforcement.

## Contrato de planes (mínimo viable)

### Entidades (backend/BD)

- `Catalog`: `{ id, name, version, status(draft/published), created_at }`
- `Plan`: `{ plan_id, catalog_id, tier, name, description, is_public, is_active, pricing, product_limits[], feature_restrictions }`
- `AddOn`: `{ addon_id, name, description, product_limits[], feature_restrictions }`
- `PlanIncludedAddOn`: `{ plan_id, addon_id }` (relación “este plan incluye este add-on”)
- `TenantPlanOverride`: `{ development, plan_id, pricing?, product_limits_patch?, feature_restrictions_patch?, is_public?, is_active? }`
- `TenantAddOnOverride`: `{ development, addon_id, pricing?, product_limits_patch?, feature_restrictions_patch?, is_public?, is_active? }`
- `Subscription`: referencia a `plan_id` (más `development`) y guarda snapshot opcional del plan efectivo para auditoría.
- `SubscriptionAddOn`: `{ subscription_id, addon_id, status }` (si el usuario compra add-ons)

### Reglas de resolución del plan efectivo

1. Resolver `tenant` (development) por request/header.
2. Cargar `plan base` (por `plan_id` o por tier + catálogo).
3. Resolver `addons` efectivos:
   - `included_addons` (por plan base, más overrides por tenant)
   - `purchased_addons` (por suscripción del usuario)
4. Aplicar `override` del tenant si existe:
   - `pricing` reemplaza campos definidos,
   - `product_limits_patch` reemplaza por `sku` (solo ese sku),
   - `feature_restrictions_patch` reemplaza flags definidos.
5. Merge del plan base + addons por SKU/flag para construir el “plan efectivo”.
6. Emitir al frontend siempre el plan efectivo (ya mezclado).

## Enforcement: dónde aplicar qué

Principio: **todo lo que cuesta dinero o rompe experiencia debe estar enforceado en backend**. La UI solo ayuda.

### 1) Backend (hard enforcement)

Para cada SKU, definir el “punto de control” único:

- `ai-tokens`: antes de llamar al proveedor LLM.
- `image-gen`: antes de generar imagen.
- `storage-gb`: antes de subir/guardar.
- `memories-albums` / `memories-photos`: antes de crear álbum/subir foto.
- `events-count`: antes de crear evento.
- `guests-per-event`: antes de añadir invitado.
- `whatsapp-msg` / `sms-invitations` / `email-campaigns`: antes de enviar.

Contrato de errores (consistente):

- `401` login_required (no hay token/invalid)
- `402` insufficient_balance (sin cuota y sin overage/wallet)
- `429` rate_limit (daily_quota u hourly_velocity_limit)
- `403` feature_forbidden (feature restrictions explícitas)

### 2) Frontend (soft gating / UX)

Debe:

- Ocultar o deshabilitar botones si `canAccess(...)` es false.
- Mostrar mensaje de upgrade coherente (`getUpgradeMessage`) y redirigir a facturación cuando aplique.
- Nunca asumir “si falta SKU entonces permitido” para features nuevas: para features nuevas, el SKU debe existir en catálogo base.

## Casos al superar un plan (matriz completa)

Esta sección es la “lista de todos los casos” para que el sistema sea flexible con planes futuros.

### A. Mensual vs diario vs velocidad

1. **Dentro de cuota mensual (`free_quota`)** → permitido.
2. **Supera cuota mensual**:
   - `overage_enabled=true` → permitido, pero se cobra/consume saldo.
   - `overage_enabled=false` → bloqueado (upgrade o no disponible).
3. **Supera cuota diaria (`daily_quota`)** → bloqueado hasta `reset_at` (aunque haya overage mensual).
4. **Supera velocidad (`hourly_velocity_limit`)** → bloqueado temporalmente (rate limit), con `Retry-After`.

### B. Estados de usuario

5. **Usuario autenticado con suscripción activa** → aplica plan efectivo.
6. **Usuario autenticado sin suscripción** → fallback a FREE público + upsell.
7. **Guest/anónimo** → límites propios (p.ej. daily cap guest) + UX de login.
8. **Suscripción TRIAL** → aplica cuotas; al acabar el trial, pasa a política (FREE o bloqueos).
9. **Suscripción CANCELLED/EXPIRED/SUSPENDED** → backend decide fallback o bloqueo; frontend debe tratarlo como “sin acceso” consistente.

### C. “Incluido en plan” vs “add-on comprado”

10. **Add-on incluido** (por tier o por tenant) → se comporta igual que comprado, pero precio 0.
11. **Add-on comprado** → se suma al plan base para plan efectivo.
12. **Add-on no disponible en tenant** → debe bloquearse por catálogo/feature_forbidden.

### D. Discrepancias y compat

13. **SKU no existe en plan**:
   - Para compat hacia atrás, hoy `canAccess` permite.
   - Para features nuevas, política: “sin SKU = no se muestra/no se permite”.
14. **UI permite pero backend bloquea** → el frontend debe reaccionar a 402/429/403.
15. **UI bloquea pero backend permite** → experiencia mala; se corrige UI.

## Dónde validar hoy y cómo detectarlo

Para el mapa detallado por app/archivo, ver: [MAPA-VALIDACIONES-PLANES.md](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/docs/MAPA-VALIDACIONES-PLANES.md).

## Normalización de SKUs y compatibilidad

Problema actual: compatibilidad con esquemas antiguos (ej. alias `daily_quota`/`free_quota`) y riesgo de “missing sku => allowed”.

Plan de migración:

1. Congelar lista de SKUs “core” (mínimo):
   - `events-count`, `guests-per-event`
   - `ai-tokens`, `image-gen`
   - `storage-gb`
   - `whatsapp-msg`, `sms-invitations`, `email-campaigns`
   - `memories-albums`, `memories-photos`
2. Añadir SKUs para “Wedding Web / Creador” si se van a vender/limitar:
   - ejemplo: `wedding-webs-create`, `wedding-webs-publish`, `wedding-webs-custom-domain` (nombres a cerrar con backend; lo importante es que existan y sean consistentes).
3. Para features nuevas: nunca desplegar UI sin SKU en catálogo base (para no caer en `allowed=true` por compat).
4. Deprecar alias en frontend cuando backend esté estable:
   - mantener dual-query un tiempo, luego eliminar fallback.

## Operativa (cómo se trabaja con planes)

### Flujo recomendado

1. Definir/editar catálogo base (draft).
2. Validar con un “tenant piloto” (bodasdehoy) con overrides mínimos.
3. Publicar catálogo (published).
4. Asignar tenants al catálogo (por config en backend).
5. Crear overrides por tenant solo cuando haya razón comercial.

### Qué se puede automatizar

- Export de planes por tenant/tier/SKU a una tabla (para auditoría).
- Checks automáticos:
  - “todo SKU usado por frontend existe en catálogo base”
  - “no hay discrepancias UI vs BD (según auditoría)”

## Rollout y verificación

1. DEV: probar flujos reales (creación de evento, añadir invitado, envío WhatsApp/email, crear álbum/subir fotos, chat IA con daily cap).
2. E2E: añadir pruebas WebKit por tenant crítico, contra `*-dev` (según reglas del repo).
3. Métricas mínimas:
  - ratio de 402/429 por SKU
  - conversiones a billing
4. Rollback:
  - si falla, volver a catálogo anterior por `catalog_id`/`version`.

## Próxima salida (para decisión de negocio)

Una vez se decida “qué tenants comparten catálogo”, producir:

- Lista de tenants que apuntan a `catalog_id=weddings-v1`.
- Lista de tenants con overrides (qué cambia exactamente).
- Lista de discrepancias actuales detectadas por [AUDITORIA-PLANES-LIMITES-ENFORCEMENT.md](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/docs/AUDITORIA-PLANES-LIMITES-ENFORCEMENT.md) que requieren ajuste de BD o UI.
