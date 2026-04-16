# Integración de Tracking, Monitoreo y Trazabilidad
**AppBodasdehoy.com — Guía técnica de implementación**

---

## Estado actual de implementación

| Componente | Estado | Dónde |
|---|---|---|
| `captureTrackingParams()` | ✅ Implementado | `packages/shared/src/tracking/index.ts` |
| `registerReferralIfPending()` | ✅ Implementado | `packages/shared/src/tracking/index.ts` |
| `trackEvent()` + helpers | ✅ Implementado | `packages/shared/src/tracking/index.ts` |
| Wire en memories-web | ✅ Wired | `apps/memories-web/pages/_app.tsx` |
| Wire en chat-ia (layout) | ✅ Wired | `apps/chat-ia/src/components/TrackingCapture.tsx` |
| Wire en chat-ia (login) | ✅ Wired | `apps/chat-ia/src/services/firebase-auth/index.ts` |
| GTM script (memories-web) | ✅ Condicional con `NEXT_PUBLIC_GTM_ID` | `apps/memories-web/pages/_app.tsx` |
| GTM script (chat-ia) | ✅ Condicional con `NEXT_PUBLIC_GTM_ID` | `apps/chat-ia/src/app/layout.tsx` |
| Meta Pixel (ambas apps) | ✅ Condicional con `NEXT_PUBLIC_META_PIXEL_ID` | Ambos layouts |
| PostHog | ✅ Ya instalado | Env var `POSTHOG_KEY` |
| Clarity | ✅ Ya instalado | Env var `CLARITY_PROJECT_ID` |
| Sentry | ⬜ Pendiente instalar | `pnpm add @sentry/nextjs` |
| Server-side tracking (Meta CAPI) | ⬜ Pendiente | api2 stripe-webhook.ts |

---

## 1. Todas las fuentes y referencias posibles que hay que capturar

La tecnología actual permite trackear **14 tipos diferentes** de origen de tráfico:

### 1.1 Parámetros de URL (se capturan al aterrizar)

| Parámetro | Origen | Ejemplo |
|-----------|--------|---------|
| `?utm_source` | Estándar Google | `google`, `facebook`, `newsletter`, `whatsapp` |
| `?utm_medium` | Estándar Google | `cpc`, `organic`, `social`, `email`, `qr` |
| `?utm_campaign` | Estándar Google | `bodas_verano_2025`, `black_friday` |
| `?utm_content` | Estándar Google | `banner_a`, `video_b`, `cta_rojo` |
| `?utm_term` | Estándar Google | `organizador bodas madrid` |
| `?ref` | **Sistema de afiliados propio** | `MEMXXX123` — genera comisión en api2 |
| `?gclid` | Google Ads (auto) | `Cj0KCQiA...` — Google Ads click ID |
| `?fbclid` | Facebook/Instagram (auto) | `IwAR3...` — Facebook click ID |
| `?msclkid` | Microsoft Ads (auto) | `xxxxx` — Bing Ads click ID |
| `?ttclid` | TikTok Ads (auto) | `xxxxx` — TikTok click ID |
| `?twclid` | Twitter/X Ads (auto) | `xxxxx` — Twitter click ID |
| `?li_fat_id` | LinkedIn Ads (auto) | `xxxxx` — LinkedIn click ID |
| `?igshid` | Instagram orgánico | `xxxxx` — Instagram share ID |
| `?srsltid` | Google Shopping (auto) | `xxxxx` — Google Shopping click ID |

### 1.2 Referrer (sin parámetros — tráfico orgánico/directo)

| Fuente | Cómo detectar |
|--------|---------------|
| Google orgánico | `document.referrer` contiene `google.com` |
| Bing, Facebook, Instagram, LinkedIn, YouTube, TikTok | hostname detectado automáticamente |
| WhatsApp / Email app | Sin referrer → `direct` |
| Bookmark / Directo | `document.referrer === ''` → `direct` |

---

## 2. Modelo de atribución

**Implementado**: first_touch (permanente) + last_touch (actualizable por visita con parámetros).
Ambos se guardan en `localStorage['attribution_first_touch']` y `localStorage['attribution_last_touch']`.

```
EJEMPLO REAL:
─────────────────────────────────────────────────────────
Día 1: Usuario llega por Google Ads → first_touch: { source: 'google', medium: 'cpc' }
Día 5: Vuelve por email newsletter → last_touch actualizado
Día 8: Vuelve por link de afiliado (?ref=MEM123) → last_touch actualizado
Día 8: Se suscribe → conversión
─────────────────────────────────────────────────────────
Con last touch: crédito al afiliado MEM123
Con first touch: crédito a Google Ads
```

---

## 3. Stack de herramientas

### Capa 1 — Contenedor universal
**Google Tag Manager (GTM)**
- Script: ya en layouts, activado con `NEXT_PUBLIC_GTM_ID`
- Gestiona GA4, Google Ads y otros tags sin cambios de código

### Capa 2 — Analytics de tráfico
**Google Analytics 4 (GA4)**
- Env var: `GOOGLE_ANALYTICS_MEASUREMENT_ID` (ya existe)
- Configurar vía GTM → tag GA4 con trigger "All Pages"
- Eventos clave: `registration_complete`, `subscription_started`, `subscription_complete`

### Capa 3 — Analytics de producto
**PostHog** ✅ Ya instalado (`POSTHOG_KEY`)
- Enriquecer con: `posthog.identify(uid, { email, plan, utm_source })`
- `trackEvent()` ya envía a PostHog automáticamente

### Capa 4 — Heatmaps
**Microsoft Clarity** ✅ Ya instalado (`CLARITY_PROJECT_ID`)

### Capa 5 — Ads social
**Meta Pixel**
- Script: ya en layouts, activado con `NEXT_PUBLIC_META_PIXEL_ID`
- `trackEvent()` mapea automáticamente: `registration_complete` → `CompleteRegistration`, etc.

### Capa 6 — Ads búsqueda
**Google Ads**
- Configurar en GTM: trigger = evento `subscription_complete`
- Env var: `NEXT_PUBLIC_GOOGLE_ADS_ID=AW-XXXXXXXXX`

### Capa 7 — Error monitoring
**Sentry** (pendiente)
```bash
pnpm add @sentry/nextjs
npx @sentry/wizard -i nextjs
# Env vars: NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN
```

### Capa 8 — Afiliados y referidos ✅ Implementado
- `?ref=MEMXXX` → capturado en localStorage → `setMyReferralCode` tras login
- Stripe webhook → `creditReferralCommission()` automático

---

## 4. Código ya implementado

### `packages/shared/src/tracking/index.ts`

Módulo compartido por todas las apps. Exporta:
- `captureTrackingParams()` — llamar en useEffect de mount en cualquier layout
- `registerReferralIfPending(jwt, development)` — llamar tras login exitoso
- `trackEvent(name, props)` — emite a GTM + Meta Pixel + PostHog
- `trackRegistrationComplete(method, development)`
- `trackSubscriptionStarted(planId, amount, currency?)`
- `trackSubscriptionComplete(planId, amount, currency?)`
- `trackPlanView(planId)`
- `trackReferralLinkShared(channel)`
- `getAttributionData()` / `getFirstTouchData()`

### Wiring por app

**memories-web** — `apps/memories-web/pages/_app.tsx`
```tsx
useEffect(() => { captureTrackingParams(); }, []);
useEffect(() => {
  const auth = authBridge.getSharedAuthState();
  if (auth.isAuthenticated && auth.idToken) {
    registerReferralIfPending(auth.idToken, DEVELOPMENT, API2_URL);
  }
}, []);
```

**chat-ia** — `apps/chat-ia/src/components/TrackingCapture.tsx` (cliente)
```tsx
'use client';
useEffect(() => { captureTrackingParams(); }, []);
```
Renderizado en `apps/chat-ia/src/app/[variants]/layout.tsx`.

**chat-ia** — `apps/chat-ia/src/services/firebase-auth/index.ts`
```typescript
// Tras login exitoso (línea ~215):
registerReferralIfPending(data.token, development).catch(() => undefined);
trackRegistrationComplete(providerMethod, development);
```

**appEventos** — Pendiente. Añadir en `pages/_app.tsx`:
```tsx
useEffect(() => { captureTrackingParams(); }, []);
// + registerReferralIfPending en el auth callback de EventosAutoAuth
```

---

## 5. Configurar GTM y Meta Pixel por white-label

Los IDs de GTM y Meta Pixel van en **`packages/shared/src/types/developments.ts`**, no en `.env.local`.
Cada white-label tiene los suyos propios. Las apps leen el config del tenant activo en runtime.

```typescript
// packages/shared/src/types/developments.ts
{
  development: 'bodasdehoy',
  gtm_id: 'GTM-XXXXXXX',          // ← añadir aquí cuando el equipo de marketing lo provea
  metaPixel_id: '1234567890',      // ← ya existe el campo, añadir valor
  ...
}
```

**Para añadir GTM/Pixel a un white-label:**
1. Abrir `packages/shared/src/types/developments.ts`
2. Buscar el objeto del tenant (`development: 'champagne-events'`, etc.)
3. Añadir `gtm_id: 'GTM-XXXXXXX'` y/o `metaPixel_id: '123456'`
4. Commit — se activa automáticamente en el siguiente deploy

Si el tenant no tiene `gtm_id` ni `metaPixel_id`, los scripts simplemente no se inyectan.

**Variables de entorno que SÍ van en `.env.local` / Vercel:**
```bash
# Solo estas — definen qué tenant es el despliegue
NEXT_PUBLIC_DEVELOPMENT=bodasdehoy   # ya existe

# Sentry (pendiente instalar — sí es por despliegue, no por tenant)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o0.ingest.sentry.io/yyyyyyy
SENTRY_AUTH_TOKEN=sntrys_xxxxx
```

---

## 6. Verificación rápida

```bash
# 1. Visitar con parámetros:
http://localhost:3210?ref=TEST123&utm_source=google&utm_medium=cpc

# 2. DevTools → Application → Local Storage:
localStorage['pending_referral_code']   === 'TEST123'
localStorage['attribution_first_touch'] → { utm_source: 'google', utm_medium: 'cpc', ... }

# 3. Hacer login con Google

# 4. Verificar que pending_referral_code está VACÍO (fue registrado en api2)

# 5. GTM Preview Mode → verificar eventos: registration_complete, plan_view

# 6. Meta Events Manager → Test Events → CompleteRegistration
```

---

## 7. Pendiente (Semana 2-3)

```
□ Instalar Sentry en chat-ia y memories-web
□ Configurar GTM: GA4 tag + Meta Pixel tag + Google Ads conversion tag
□ Meta CAPI server-side en api2 stripe-webhook.ts (bypasear adblockers)
□ updateMyAttribution en api2 (guardar UTMs en perfil de usuario en MongoDB)
□ Wire captureTrackingParams + registerReferralIfPending en appEventos
□ PostHog identify enriquecido con UTMs tras login
```
