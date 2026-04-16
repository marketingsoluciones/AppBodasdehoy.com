# Sistema de referidos — Integración para marcas blancas

Todos los white-labels del ecosistema usan el **mismo repositorio** con distintas variables de entorno.
El sistema de referidos y tracking está integrado en el código base — funciona automáticamente.

---

## Cómo funciona

```
Usuario llega a tu-dominio.com?ref=MEMXXX
        │
        ▼ captureTrackingParams() guarda código en localStorage
        │
Usuario se registra (Firebase / Google / Email)
        │
        ▼ registerReferralIfPending() llama a setMyReferralCode en api2
        │
api2 guarda el referral_code en el perfil del usuario
        │
Usuario paga un plan → Stripe webhook → creditReferralCommission() automático
```

---

## Setup para un nuevo white-label (4 pasos)

### 1. Variables de entorno

```bash
# .env.local de tu instalación
NEXT_PUBLIC_DEVELOPMENT=tu_development_id   # ej: champagneevents, vivetuboda
NEXT_PUBLIC_BACKEND_URL=https://api2.eventosorganizador.com
```

### 2. Pedir al equipo de api2 añadir tu dominio

```
Archivo: src/graphql/resolvers/referral.resolver.ts → función getInvitationLink()
Añadir:  'tu_development_id': 'https://tu-dominio.com',
```

Si no se añade, el fallback automático usa `https://tu_development_id.com?ref=MEMXXX`.

### 3. El código ya está integrado — no hay nada más que hacer

- `captureTrackingParams()` se ejecuta en el layout raíz de todas las apps al aterrizar
- `registerReferralIfPending()` se ejecuta tras cada login/registro exitoso
- Las comisiones se acreditan automáticamente vía Stripe webhook

### 4. Probar la integración

```bash
# 1. Visitar tu-dominio.com?ref=TEST123
# 2. Abrir DevTools → Application → Local Storage
#    → pending_referral_code = 'TEST123'        ✓
# 3. Registrarse con Google o Email
# 4. Verificar que pending_referral_code desaparece del localStorage
# 5. En MongoDB: db.users.findOne({ uid: '...' }).referral_code === 'TEST123'  ✓
```

---

## Configurar GTM y Meta Pixel para tu white-label

Los IDs **no van en `.env`** — van en `packages/shared/src/types/developments.ts`:

```typescript
{
  development: 'champagneevents',
  gtm_id: 'GTM-XXXXXXX',        // ← tu contenedor GTM
  metaPixel_id: '123456789',     // ← tu píxel de Meta
  ...
}
```

Si no se añaden, los scripts simplemente no se inyectan en tu despliegue.

---

## Panel del afiliado

| Quién | Dónde |
|-------|-------|
| Afiliado (ver sus conversiones) | `/app/referral` en memories-web |
| Admin (ver todos los afiliados) | GraphQL playground api2 → `getMyReferralDashboard` |

---

## Resumen

| Qué | Quién | Estado |
|-----|-------|--------|
| Capturar `?ref=` al aterrizar | Código base (automático) | ✅ |
| Llamar `setMyReferralCode` tras login | Código base (automático) | ✅ |
| Generar link de invitación único | api2 `getMyReferral` | ✅ |
| Acreditar comisión al pagar | api2 Stripe webhook | ✅ |
| Añadir dominio al mapa de links | **Acción requerida por api2** (1 línea) | 📋 |
| Configurar GTM/Meta Pixel | **Acción opcional del partner** (env var) | 📋 |
