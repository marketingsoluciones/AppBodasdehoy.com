# Mapa: dónde se validan los planes y qué pasa al superar límites

## Objetivo

Tener una vista única y accionable de:

- Qué validaciones existen (backend vs frontend) cuando se supera un plan.
- Qué contrato de error se recibe (HTTP + body + headers).
- Qué UX se dispara en cada app.

## Tipos de límites (casos posibles)

### 1) Cuota mensual (`free_quota`)

- **Dentro de cuota**: permitido.
- **Fuera de cuota**:
  - Si `overage_enabled === true`: permitido (pago por uso / wallet / saldo).
  - Si `overage_enabled === false`: bloqueado.

### 2) Cuota diaria (`daily_quota`)

- **Dentro**: permitido.
- **Fuera**: bloqueado hasta `reset_at`.

### 3) Velocidad por hora (`hourly_velocity_limit`)

- **Dentro**: permitido.
- **Fuera**: bloqueado temporalmente (rate limit), normalmente con `Retry-After` o `reset_at`.

### 4) Restricción de feature (`feature_restrictions`)

- Bloqueo por permiso de plan (no depende de uso).

### 5) Estado de suscripción

- `ACTIVE/TRIAL`: se aplican cuotas.
- `CANCELLED/EXPIRED/SUSPENDED`: puede bloquear o caer a FREE según política del backend.

### 6) Sin suscripción

- Frontend suele caer a FREE público (fallback) y mostrar upsell.

### 7) Guest/anónimo

- Puede tener límites propios (daily/por sesión) distintos del usuario autenticado.

## Contrato de errores (recomendación unificada)

Estos códigos permiten al frontend diferenciar “no puedo porque plan” vs “no puedo por infra”.

- `401` → `login_required` / `session_expired`
- `402` → `insufficient_balance` o `upgrade_required` (cuota mensual sin overage / sin saldo)
- `403` → `feature_forbidden` (feature_restrictions)
- `429` → `rate_limit` (daily_quota u hourly_velocity_limit)

Campos recomendados en body (JSON):

- `error` (string estable)
- `message` (texto)
- `error_type` (subtipo si aplica)
- `trace_id` (para backend)
- Para 402: `payment_url` y/o `plans_url`
- Para 429: `retry_after`, `reset_at`, `used`, `limit`

Headers útiles:

- `X-Backend-Trace-Id`
- `X-Backend-Error-Code`
- `Retry-After`

## Mapa actual por app (lo que el repo muestra)

Leyenda:

- **Hard**: bloqueo real (server) o proxy que propaga el bloqueo.
- **Soft**: gating UI/UX (botón/CTA), pero el backend sigue siendo la fuente de verdad.

### apps/appEventos

- **Copilot (IA)**
  - Hard (proxy): [pages/api/copilot/chat.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos/pages/api/copilot/chat.ts)
    - Propaga 401/402/429 y adjunta `payment_url`, `retry_after`, `reset_at`, `trace_id`.
  - Soft (cliente): [services/copilotChat.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos/services/copilotChat.ts)
    - 402: muestra CTA de recarga.
    - 429: distingue cuota vs saturación con `Retry-After/reset_at`.

- **Límites de Eventos/Invitados/Comunicaciones**
  - Soft (cálculo de límites): [hooks/usePlanLimits.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos/hooks/usePlanLimits.ts)
    - `events-count`, `guests-per-event`, `email-campaigns`, `sms-invitations`, `whatsapp-msg`.
  - Soft (gate aplicado hoy): WhatsApp en Invitaciones [SendButton.tsx](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos/components/Invitaciones/components/SendButton.tsx#L240-L262)
  - Detección reactiva de “plan limit” desde errores backend: [planLimitFromApiError.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos/utils/planLimitFromApiError.ts) y coordinación [planLimitsCoordination.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/appEventos/utils/planLimitsCoordination.ts)

### apps/chat-ia

- Hard (proxy): [webapi/chat/[provider]/route.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia/src/app/(backend)/webapi/chat/[provider]/route.ts)
  - Normaliza 401/402/429 hacia `errorType` (`login_required`, `insufficient_balance`, `rate_limit`).
- Soft (cliente): [generateAIChat.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia/src/store/chat/slices/aiChat/actions/generateAIChat.ts)
  - Muestra modales/banners según `errorType`.
- Soft (cuotas/overage UX): [QuotaBanner.tsx](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/chat-ia/src/features/ChatInput/QuotaBanner.tsx)

### apps/memories-web

- Soft (cálculo y UX): [hooks/usePlan.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/memories-web/hooks/usePlan.ts)
  - `memories-albums`, `memories-photos`.

### packages/shared

- Soft (gating reusable):
  - `canAccess` / `canAccessDaily`: [gates.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/packages/shared/src/plans/gates.ts)
  - Componente `<UpgradeGate>`: [UpgradeGate.tsx](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/packages/shared/src/plans/UpgradeGate.tsx)

### e2e-app

- Observabilidad QA de límites (clasifica 401/402/5xx y parsea 402): [circuit-breaker.ts](file:///Users/juancarlosparra/Projects/AppBodasdehoy.com/e2e-app/circuit-breaker.ts)

## Gaps detectables (para priorizar)

- appEventos calcula `events-count` y `guests-per-event`, pero no aplica gates de forma consistente en la UI (solo WhatsApp está claro).
- `hourly_velocity_limit` no se usa en gating compartido; se ve como concepto que debe enforcear backend.
- “Missing SKU ⇒ allowed” en `canAccess` es compat hacia atrás; para features nuevas hay que exigir SKU.

