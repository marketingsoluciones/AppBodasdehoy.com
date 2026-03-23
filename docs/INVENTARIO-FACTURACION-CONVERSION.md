# Inventario de Facturación, Precios y Embudo de Conversión

> Generado: 2026-03-22 | Análisis completo de todas las rutas, componentes y gaps de conversión

---

## 1. Inventario de URLs por App

### 1.1 chat-ia (`chat-test.bodasdehoy.com` / `iachat.bodasdehoy.com`)

| URL | Componente/Archivo | Propósito | Tipo acceso |
|-----|-------------------|-----------|-------------|
| `/settings/billing` | `settings/billing/index.tsx` | Dashboard personal: balance, recarga, auto-recarga | Usuario autenticado |
| `/settings/billing/planes` | `settings/billing/planes/page.tsx` | Selector de planes con toggle mensual/anual | Usuario autenticado |
| `/settings/billing/transactions` | `settings/billing/transactions/page.tsx` | Historial completo de transacciones con filtros y gráfica | Usuario autenticado |
| `/settings/billing/packages/history` | `settings/billing/packages/history/page.tsx` | Historial de compras/recargas | Usuario autenticado |
| `/settings/billing/invoices/[id]` | `settings/billing/invoices/[id]/page.tsx` | Detalle de factura individual | Usuario autenticado |
| `/settings/billing?recharge=success` | `settings/billing/index.tsx` | Callback de Stripe tras recarga exitosa | Usuario autenticado |
| `/settings/billing?recharge=cancelled` | `settings/billing/index.tsx` | Callback de Stripe si cancela | Usuario autenticado |
| `/admin/billing` | `admin/billing/page.tsx` | Dashboard global: ingresos, wallets, costos por canal | Admin |
| `/admin/billing/wallet-test` | `admin/billing/wallet-test/page.tsx` | Tool de testing de endpoints de wallet | Admin |
| `/admin/billing/dar-credito` | `admin/billing/dar-credito/page.tsx` | Conceder crédito manual a usuarios | Admin |

**Modales y overlays (no tienen URL propia):**
- `RechargeModal` — Aparece al hacer click en WalletBadge o desde `InsufficientBalanceModal`
- `InsufficientBalanceModal` — Se dispara automáticamente cuando chat devuelve HTTP 402
- `NegativeBalanceBanner` — Banner naranja en parte superior cuando balance < 0

---

### 1.2 appEventos (`app-test.bodasdehoy.com` / `organizador.bodasdehoy.com`)

| URL | Componente/Archivo | Propósito | Tipo acceso |
|-----|-------------------|-----------|-------------|
| `/facturacion` | `pages/facturacion.tsx` | Hub de facturación: planes, métodos pago, dirección, historial | Usuario autenticado |
| `/facturacion#planes` | `PlanesAPI2` (inline) | Grid de planes con toggle mensual/anual | Usuario autenticado |
| `/facturacion#metodos` | `MetodosDePago.tsx` | Placeholder — "sin métodos de pago" | Usuario autenticado |
| `/facturacion#informacion` | `InformacionFacturacion.tsx` | Formulario dirección de facturación | Usuario autenticado |
| `/facturacion#historial` | `HistorialFacturacion.tsx` | Tabla de facturas con ver/descargar | Usuario autenticado |
| `/pro` | *(destino de CTAs de Memories)* | Página de upgrade — **verificar si existe** | Cualquiera |

**CTAs que llevan a `/facturacion` desde otras páginas:**
- `ActivatorPremium` component — mostrado en páginas que requieren plan de pago
- Límites de plan en `usePlanLimits` → banner de `UpgradeGate`

---

### 1.3 memories-web (`memories.bodasdehoy.com`)

| URL | Componente/Archivo | Propósito | Tipo acceso |
|-----|-------------------|-----------|-------------|
| `/#precios` | `components/landing/Pricing.tsx` | Sección pricing en landing — 3 planes estáticos/dinámicos | Público |
| `/pro` | *(destino de CTAs de Pricing)* | Página upgrade de Memories — **verificar si existe** | Cualquiera |

---

## 2. Componentes Clave de Facturación

### 2.1 chat-ia

| Componente | Archivo | Función | Estado |
|-----------|---------|---------|--------|
| `WalletBadge` | `src/components/Wallet/WalletBadge.tsx` | Badge con saldo actual, colores dinámicos, click abre recarga | ✅ Funcional |
| `RechargeModal` | `src/components/Wallet/RechargeModal.tsx` | Modal de recarga: presets €5/10/20/50/100 + custom €5-1000 | ✅ Funcional |
| `NegativeBalanceBanner` | `src/components/Wallet/NegativeBalanceBanner.tsx` | Banner naranja cuando saldo negativo | ✅ Funcional |
| `InsufficientBalanceModal` | `src/features/InsufficientBalanceModal/index.tsx` | Wraps RechargeModal, se dispara con 402 | ✅ Funcional |
| `AutoRechargeCard` | `src/components/credits/AutoRechargeCard.tsx` | Config auto-recarga (umbral + importe) | ✅ Funcional |
| `PriceComparison` | `src/components/credits/PriceComparison.tsx` | Tabla comparativa de todos los planes | ❌ **HUÉRFANO — no enlazado desde ningún sitio** |
| `ReloginBanner` | `src/components/ReloginBanner.tsx` | Banner rojo cuando JWT expirado | ✅ Funcional (con listener api2:token-expired) |

### 2.2 appEventos

| Componente | Archivo | Función | Estado |
|-----------|---------|---------|--------|
| `PlanesAPI2` | `pages/facturacion.tsx` (inline) | Grid planes con toggle mensual/anual | ✅ Funcional |
| `Planes` (legacy) | `components/Facturacion/Planes.tsx` | Planes Stripe legacy | ❌ **OBSOLETO — montar pero no usado** |
| `Productos` | `components/Facturacion/Productos.tsx` | Add-to-cart de productos/módulos | ✅ Funcional |
| `MetodosDePago` | `components/Facturacion/MetodosDePago.tsx` | Métodos de pago | ❌ **PLACEHOLDER — solo texto** |
| `InformacionFacturacion` | `components/Facturacion/InformacionFacturacion.tsx` | Formulario dirección | ✅ Funcional |
| `HistorialFacturacion` | `components/Facturacion/HistorialFacturacion.tsx` | Historial facturas + descarga | ✅ Funcional |
| `ActivatorPremium` | `components/ActivatorPremium.tsx` | CTA de upgrade en páginas premium | ✅ Funcional |

### 2.3 Shared (`@bodasdehoy/shared/plans`)

| Export | Propósito | Usado en |
|--------|-----------|---------|
| `PlanCard` | Tarjeta de plan reutilizable | chat-ia settings/billing |
| `UpgradeGate` | Bloquea feature, muestra CTA de upgrade | appEventos (feature gates) |
| `humanizeQuota(sku, quota)` | "~100 consultas IA" | appEventos facturacion, memories Pricing |
| `usageColor(percent)` | Color verde/amarillo/rojo según uso | UI de límites |
| `TIER_COLORS` | Colores hex por tier | Ambas apps |

---

## 3. Servicios y APIs

### 3.1 chat-ia API endpoints (via Next.js proxy → api2 GraphQL)

| Endpoint | Método | Autenticación | Propósito |
|---------|--------|---------------|-----------|
| `/api/wallet/balance` | GET | JWT | Saldo actual |
| `/api/wallet/transactions` | GET | JWT | Historial paginado |
| `/api/wallet/check-balance` | POST | JWT | Verificar saldo suficiente |
| `/api/wallet/recharge-session` | POST | JWT | Crear sesión Stripe |
| `/api/wallet/auto-recharge` | GET/POST | JWT | Config auto-recarga |
| `/api/wallet/service-price` | POST | JWT | Precio de SKU específico |
| `/api/invoices` | GET | JWT | Lista facturas |
| `/api/invoices/[id]` | GET | JWT | Detalle factura |
| `/api/invoices/[id]/pdf` | GET | JWT | URL PDF temporal |
| `/api/payments` | GET | JWT | Historial pagos |
| `/api/subscription` | GET | JWT | Suscripción activa |
| `/api/usage-stats` | GET | JWT | Stats de consumo |

### 3.2 api2 GraphQL queries relevantes

```graphql
wallet_getBalance → WalletBalance { balance, bonus, credit_limit, status, currency }
wallet_checkBalance(amount: Float!) → { allowed, shortfall, required_amount }
wallet_createRechargeSession(amount: Float!, success_url, cancel_url) → { checkout_url }
wallet_getTransactions(page, limit, filter) → TransactionsResponse
wallet_configureAutoRecharge(enabled, threshold, amount) → config
getSubscriptionPlans(development, is_public: true) → Plan[]
getMySubscription → Subscription { tier, status, trial_end, ... }
```

---

## 4. SKUs de Servicios (precios)

| SKU | Servicio | Afecta a |
|-----|---------|----------|
| `SRV-AI-ANTHROPIC-HAIKU` | Claude Haiku | Consumo chat |
| `SRV-AI-ANTHROPIC-SONNET` | Claude Sonnet | Consumo chat |
| `SRV-AI-OPENAI-GPT4O` | GPT-4o | Consumo chat |
| `SRV-AI-IMAGE-DALLE3` | DALL-E 3 | Generación imágenes |
| `SRV-WHATSAPP-MSG-OUTBOUND` | WhatsApp saliente | Bandeja mensajes |
| `SRV-WHATSAPP-MSG-INBOUND` | WhatsApp entrante | Bandeja mensajes |
| `SRV-EMAIL-SES-SEND` | Email vía SES | Invitaciones |
| `SRV-SMS-TWILIO-ES` | SMS España | Invitaciones |
| `SRV-STORAGE-CDN-GB` | Almacenamiento R2 | Fotos/archivos |
| `events-count` | Límite de eventos | Plan limit |
| `guests-per-event` | Invitados/evento | Plan limit |
| `ai-tokens` | Tokens IA | Plan limit |
| `memories-albums` | Álbumes Memories | Plan limit |
| `memories-photos` | Fotos Memories | Plan limit |

---

## 5. Análisis de Conversión — Gaps y Oportunidades

### 🔴 CRÍTICOS (impacto alto, urgente)

#### C1 — `PriceComparison` huérfano
- **Dónde**: `src/components/credits/PriceComparison.tsx` en chat-ia
- **Problema**: Componente de comparativa de planes completo que NO está enlazado desde ninguna página
- **Fix**: Añadirlo en `/settings/billing/planes` debajo del plan selector
- **Impacto estimado**: +15-25% conversión en página de planes (usuarios ven comparativa clara antes de comprar)

#### C2 — Sin mensaje en estado vacío de chat para visitantes
- **Dónde**: `/chat` cuando no hay sesión / usuario guest
- **Problema**: No hay mensaje claro de "Para usar la IA sin límites, crea una cuenta gratis"
- **Fix**: Añadir `GuestWelcomeMessage` con CTA de registro antes de que aparezca el límite
- **Impacto estimado**: +20-30% registros de nuevos usuarios

#### C3 — memories-web `/pro` puede no existir
- **Dónde**: `Pricing.tsx` → `<Link href="/pro">`
- **Problema**: Todos los CTAs de la landing de Memories van a `/pro` — si la página no existe es un 404 que mata la conversión
- **Acción**: Verificar que `/pro` existe en memories-web con formulario de registro/pago

#### C4 — Sin notificaciones de facturación
- **Dónde**: Sistema de notificaciones `/notifications`
- **Problema**: No hay notificaciones push/email para: saldo bajo, pago fallido, factura lista, trial expirando
- **Fix**: Activar notificaciones de facturación en api2 + mostrarlas en `NotificationBell`

---

### 🟡 IMPORTANTES (impacto medio)

#### I1 — Sin stats de consumo en dashboard principal de billing
- **Dónde**: `/settings/billing`
- **Problema**: El usuario no ve "cuánto has gastado este mes" en la pantalla principal
- **Fix**: Añadir card de `usageStats` con gráfica de consumo mensual (el hook `useBilling.fetchUsageStats()` ya existe)
- **Impacto**: Usuarios entienden el valor que reciben → menor churn

#### I2 — Sin countdown de trial expirando
- **Dónde**: `/settings/billing/planes` cuando `subscription.status = 'TRIAL'`
- **Problema**: No hay aviso visible de "Tu prueba termina en X días"
- **Fix**: Banner amarillo en la página de planes con los días restantes
- **Impacto**: +30-40% conversión de trial a pago

#### I3 — Sin flujo de downgrade/cancelación
- **Dónde**: `/settings/billing/planes`
- **Problema**: No hay botón de "Cancelar plan" ni "Cambiar a plan inferior" (solo el plan actual aparece como disabled)
- **Fix**: Botón "Cambiar plan" que abra un modal con opciones de downgrade + confirmación
- **Impacto**: Reduce solicitudes de soporte, mejora UX

#### I4 — Métodos de pago en appEventos es placeholder
- **Dónde**: `/facturacion` tab "Métodos de Pago"
- **Problema**: Solo muestra "Aún no has registrado un método de pago" con un botón que lleva a la pestaña de Planes
- **Fix**: Integrar Stripe Elements para gestionar tarjetas, o enlazar al portal de cliente de Stripe
- **Impacto**: Usuarios no pueden actualizar tarjeta caducada → pagos fallidos → churn

#### I5 — `Planes.tsx` legacy montado pero no usado
- **Dónde**: `components/Facturacion/Planes.tsx` importado en `facturacion.tsx`
- **Problema**: El componente legacy de Stripe aparece en el código pero `PlanesAPI2` ya lo reemplaza. Puede causar confusión visual si se renderiza.
- **Fix**: Eliminar el import de `Planes` de `facturacion.tsx` (ya no se usa)

#### I6 — Sin VAT/IVA visible en precios
- **Dónde**: Todos los precios en UI
- **Problema**: "€9.99/mes" — ¿incluye IVA? La ley EU requiere claridad
- **Fix**: Añadir "IVA no incluido" o "Precio final con IVA" debajo del precio
- **Impacto**: Compliance EU + confianza del usuario

---

### 🟢 MEJORAS DE CONVERSIÓN (bajo esfuerzo, alto impacto)

#### M1 — Añadir social proof en páginas de pricing
- **Dónde**: `/settings/billing/planes` y `/facturacion`
- **Propuesta**: "Más de X organizadores ya usan el plan PRO" + logos o avatars
- **Impacto estimado**: +10-15% conversión en página de planes

#### M2 — Urgencia en trial
- **Dónde**: `/settings/billing/planes` cuando hay trial disponible
- **Propuesta**: "⚡ Primer mes gratis — Oferta limitada" con contador o badge
- **Impacto**: +20% clickthrough en botón de plan

#### M3 — Mensaje contextual en InsufficientBalanceModal
- **Dónde**: `InsufficientBalanceModal` / `RechargeModal`
- **Propuesta**: Añadir "La mayoría de usuarios recargan €20 — 200 conversaciones de IA" (social proof + contexto de valor)
- **Impacto**: Usuarios saben cuánto recargar → mayor ticket medio

#### M4 — Email de onboarding con enlace a billing tras registro
- **Dónde**: Flujo post-registro
- **Propuesta**: Email D+1 "Activa tu plan para acceso completo" con link directo a `/settings/billing/planes`
- **Impacto estimado**: +15-20% activación de plan en primera semana

#### M5 — Badge de plan en el header de chat-ia
- **Dónde**: Sidebar de chat-ia junto a WalletBadge
- **Propuesta**: "Plan FREE" badge que al hacer click va a `/settings/billing/planes`
- **Impacto**: Awareness constante del plan → más upgrades

#### M6 — Comparativa anual más prominente
- **Dónde**: Toggle mensual/anual en planes
- **Propuesta**: "Ahorra €24/año" en badge verde junto al toggle, más visible que el "-20%" actual
- **Impacto**: +10-15% preferencia por pago anual → mejor cash flow

---

## 6. Flujo del Embudo de Conversión

```
TRÁFICO ENTRADA
    │
    ├── memories-web/#precios ──────────────────────→ /pro (¿existe?)
    │                                                     │
    │                                                     ↓
    ├── appEventos (visita limitada) ──────────────→ ActivatorPremium
    │                                                     │
    │                                                     ↓
    ├── chat-ia/chat (guest) ─────────────────────→ GuestWelcomeMessage → /login
    │                                                     │
    │                                                     ↓
    │                                               REGISTRO
    │                                                     │
    │                                                     ↓
    │                                         chat-ia Plan FREE
    │                                                     │
    ├── Límite de tokens (chat 402) ────────────→ InsufficientBalanceModal
    │                                                     │
    ├── Trial expiry ───────────────────────────→ [FALTA banner countdown]
    │                                                     │
    │                                                     ↓
    │                                         /settings/billing/planes
    │                                                     │
    │                                                     ↓
    │                                         RechargeModal / Stripe
    │                                                     │
    │                                                     ↓
    │                                         PAGO EXITOSO
    │                                                     │
    │                                                     ↓
    │                                     /settings/billing?recharge=success
    │
    └── Auto-recarga (backend) ─────────────────→ [FALTA notificación de éxito/fallo]
```

---

## 7. Checklist de Tests Manuales

### 7.1 chat-ia — Tests manuales

- [ ] `/settings/billing` muestra saldo actual con valor numérico
- [ ] WalletBadge pulsante cuando saldo < €5
- [ ] RechargeModal abre al hacer click en WalletBadge
- [ ] RechargeModal muestra presets €5, €10, €20, €50, €100
- [ ] Custom amount acepta valores entre €5 y €1000
- [ ] Click "Recargar €X" redirige a Stripe Checkout (no 500)
- [ ] Vuelta desde Stripe con `?recharge=success` muestra confirmación
- [ ] `/settings/billing/planes` muestra todos los planes con precios
- [ ] Toggle Mensual/Anual cambia precios correctamente (anual = -20%)
- [ ] Plan actual aparece con badge "Actual" y botón deshabilitado
- [ ] Click en plan de pago redirige a Stripe
- [ ] `/settings/billing/transactions` lista transacciones con tipos (RECHARGE, CONSUMPTION)
- [ ] Filtros de transacciones funcionan (por tipo, fecha)
- [ ] "Exportar CSV" descarga archivo
- [ ] NegativeBalanceBanner aparece cuando saldo negativo
- [ ] InsufficientBalanceModal aparece cuando chat devuelve saldo insuficiente
- [ ] AutoRechargeCard guarda configuración correctamente
- [ ] `/admin/billing` requiere rol admin (redirige si no admin)
- [ ] KPIs del admin dashboard cargan correctamente
- [ ] Grant credit modal funciona en admin

### 7.2 appEventos — Tests manuales

- [ ] `/facturacion` carga sin error
- [ ] Tab "Planes" muestra grid de planes con toggle mensual/anual
- [ ] Plan actual marcado con "Actual"
- [ ] Click en plan no-actual → (verificar qué pasa — ¿crea sesión Stripe?)
- [ ] Tab "Métodos de Pago" muestra estado actual (placeholder o cards)
- [ ] Tab "Información de Facturación" — formulario guarda correctamente
- [ ] Tab "Historial de Facturación" — tabla carga facturas
- [ ] "Ver factura" abre URL de Stripe en nueva pestaña
- [ ] "Descargar factura" descarga PDF
- [ ] `ActivatorPremium` visible en páginas con features de pago
- [ ] Click en ActivatorPremium va a `/facturacion`

### 7.3 memories-web — Tests manuales

- [ ] `/#precios` visible en la landing
- [ ] 3 planes visibles con precios
- [ ] Plan PRO destacado (rosa/gradient)
- [ ] CTAs "Empezar gratis" / "Elegir X" dirigen a `/pro`
- [ ] `/pro` existe y carga sin 404 ← **VERIFICAR URGENTE**

---

## 8. Tests E2E Automatizados

Ver: `e2e-app/facturacion-billing.spec.ts` — cubre tests 4.1–4.7

**Tests pendientes de implementar:**
- Test de appEventos `/facturacion` (ver sección 4.8 en spec)
- Test de memories-web `/#precios` y CTAs
- Test de cross-app: ActivatorPremium en appEventos → redirect a `/facturacion`

---

## 9. Prioridades de Implementación

| Prioridad | Item | Esfuerzo | Impacto |
|-----------|------|----------|---------|
| 🔴 P0 | Verificar que `/pro` existe en memories-web | 30min | Elimina 404 en CTAs de landing |
| 🔴 P0 | Conectar `PriceComparison` en `/settings/billing/planes` | 1h | +20% conversión planes |
| 🔴 P0 | Añadir notificaciones de billing (saldo bajo, factura) | 2h | Retención activa |
| 🟡 P1 | Countdown de trial en página de planes | 2h | +30% conversión trial→pago |
| 🟡 P1 | Stats de consumo en billing dashboard principal | 3h | Reducir churn |
| 🟡 P1 | Eliminar `Planes.tsx` legacy de facturacion.tsx | 30min | Limpieza código |
| 🟡 P1 | IVA/VAT disclaimer en precios | 1h | Compliance EU |
| 🟢 P2 | Social proof en páginas de pricing | 2h | +10% conversión |
| 🟢 P2 | Badge de plan actual en sidebar chat-ia | 1h | Awareness de plan |
| 🟢 P2 | Mensaje contextual en RechargeModal | 1h | Mayor ticket medio |
| 🟢 P2 | Flujo de cancelación/downgrade | 4h | Reducir soporte |
