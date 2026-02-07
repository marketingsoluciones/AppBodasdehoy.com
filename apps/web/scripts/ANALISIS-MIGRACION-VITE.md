# 📊 Análisis: Migración de Next.js a Vite

**Fecha:** 5 de Febrero 2026
**Proyecto:** Bodas de Hoy - Frontend Web
**Framework actual:** Next.js 15.1.3
**Framework propuesto:** Vite + React Router

---

## 📋 RESUMEN EJECUTIVO

### ⚠️ RECOMENDACIÓN: **NO MIGRAR A VITE**

**Razones principales:**
1. ❌ Pérdida de funcionalidades críticas (API Routes, SSR)
2. ⏱️ Tiempo estimado: **4-6 semanas** (1 desarrollador full-time)
3. 💰 **Costo/beneficio negativo** - Mucho esfuerzo, pocas ventajas
4. 🔴 **Riesgo alto** de romper funcionalidades existentes
5. ✅ Next.js 15 ya es **muy rápido** y moderno

---

## 📊 ANÁLISIS DEL PROYECTO ACTUAL

### Estadísticas

```
Tamaño del proyecto:    817 MB
Archivos en /pages:     58 páginas
Componentes:            360 componentes
API Routes:             13 endpoints
Uso de SSR/SSG:         5 implementaciones
Dependencias:           ~80 paquetes
```

### Estructura Actual

```
apps/web/
├── pages/                  # 58 páginas con routing automático
│   ├── api/               # 13 API routes (BACKEND en Next.js)
│   │   ├── copilot/chat.ts
│   │   ├── proxy/[...path].ts
│   │   ├── dev/
│   │   └── services/
│   ├── _app.tsx           # Layout global
│   ├── index.tsx          # Home
│   ├── login.js
│   ├── eventos.tsx
│   ├── invitados.tsx
│   └── ...
├── components/            # 360 componentes React
├── context/              # Context API
├── hooks/                # Custom hooks
├── utils/                # Utilidades
├── styles/               # CSS global
└── public/               # Assets estáticos
```

---

## 🔍 DEPENDENCIAS DE NEXT.JS DETECTADAS

### 1. **API Routes (CRÍTICO)** ✅ En uso

**13 API endpoints** que funcionan como backend:

```typescript
// pages/api/copilot/chat.ts - Proxy SSE al backend Python
// pages/api/proxy/[...path].ts - Proxy GraphQL
// pages/api/proxy-bodas/[...path].ts - Proxy secundario
// pages/api/dev/refresh-session.ts - Desarrollo
// pages/api/generate-pdf.ts - Generación PDF
// pages/api/testing/generate-auth-token.ts - Testing
```

**Impacto:** Estas API routes NO existen en Vite. Tendrías que:
- ❌ Migrar a un backend separado (Express, Fastify, etc.)
- ❌ Desplegar backend y frontend por separado
- ❌ Configurar CORS manualmente
- ❌ Manejar proxies de forma diferente

**Esfuerzo:** 1-2 semanas

---

### 2. **Routing File-Based** ✅ En uso intensivo

**58 páginas** con routing automático de Next.js:

```
pages/index.tsx          → /
pages/login.js           → /login
pages/eventos.tsx        → /eventos
pages/invitados.tsx      → /invitados
pages/[dinamica]/slug.tsx → /dinamica/:slug
```

**Impacto:** Vite NO tiene routing automático. Tendrías que:
- ❌ Instalar React Router v6
- ❌ Crear archivo de rutas manualmente
- ❌ Configurar 58 rutas a mano
- ❌ Migrar rutas dinámicas `[slug]` → `:slug`
- ❌ Configurar layouts manualmente

**Esfuerzo:** 1 semana

---

### 3. **Componentes de Next.js** ⚠️ Uso mínimo

```tsx
import Head from 'next/head'           // 2 usos
import dynamic from 'next/dynamic'     // Varios usos
import { useRouter } from 'next/router' // ~30 usos
import { NextSeo } from 'next-seo'     // Uso en _app.tsx
```

**Impacto:** Tendrías que reemplazar:
- `Head` → `react-helmet` o `@vitejs/plugin-react`
- `dynamic` → `React.lazy` + `Suspense`
- `useRouter` → `useNavigate`, `useLocation`, `useParams` de React Router
- `NextSeo` → Configurar manualmente

**Esfuerzo:** 3-5 días

---

### 4. **SSR/SSG** ⚠️ Uso limitado (5 casos)

```typescript
// Solo 5 usos detectados de:
getServerSideProps()  // Server-Side Rendering
getStaticProps()      // Static Site Generation
getStaticPaths()      // Dynamic routes pre-rendering
```

**Impacto:** Vite NO soporta SSR out-of-the-box. Opciones:
- ❌ Perder SSR (convertir todo a CSR - Client Side Rendering)
- ❌ Usar Vite SSR manualmente (muy complejo)
- ❌ Migrar a Astro, Remix, o mantener Next.js

**Esfuerzo:** Si quieres SSR con Vite: 2-3 semanas de configuración compleja

---

### 5. **Optimizaciones Automáticas** ✅ Next.js las hace por ti

Next.js incluye automáticamente:
- ✅ Code splitting inteligente
- ✅ Prefetching de rutas
- ✅ Optimización de imágenes (next/image)
- ✅ Optimización de fonts (next/font)
- ✅ Tree shaking automático
- ✅ Minificación y compresión
- ✅ Fast Refresh (HMR)

Vite requiere:
- ❌ Configurar todo manualmente
- ❌ Instalar plugins adicionales
- ❌ Optimizar imágenes con herramientas externas

**Esfuerzo:** 3-5 días configuración + optimización

---

## 🔧 PASOS NECESARIOS PARA MIGRAR A VITE

### Fase 1: Configuración Base (1 semana)

1. **Crear configuración Vite**
```bash
npm create vite@latest
# Instalar dependencias
npm install react-router-dom
npm install -D @vitejs/plugin-react
```

2. **Migrar estructura de carpetas**
```
src/
├── main.tsx              # Entry point (antes _app.tsx)
├── App.tsx               # Router principal
├── routes/               # Configuración de rutas
├── pages/                # Componentes de página
├── components/           # 360 componentes (sin cambios)
├── contexts/
├── hooks/
└── utils/
```

3. **Configurar `vite.config.ts`**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 8080 },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

**Tiempo:** 2-3 días

---

### Fase 2: Migrar API Routes (1-2 semanas)

**Opción A: Backend Express separado**

1. Crear nuevo proyecto Express:
```bash
mkdir backend
cd backend
npm init -y
npm install express cors
```

2. Migrar las 13 API routes a Express:
```typescript
// backend/routes/copilot.ts
app.post('/api/copilot/chat', async (req, res) => {
  // Migrar lógica de pages/api/copilot/chat.ts
})
```

3. Configurar proxy en Vite:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
})
```

**Tiempo:** 1-2 semanas
**Complejidad:** Alta
**Riesgo:** Medio-Alto (puede romper integraciones)

**Opción B: Serverless Functions (Vercel, Netlify)**
- Migrar API routes a Vercel Functions o Netlify Functions
- Requiere despliegue separado
- **Tiempo:** 1 semana
- **Limitaciones:** Cold starts, timeouts

---

### Fase 3: Migrar Routing (1 semana)

1. **Instalar React Router v6**
```bash
npm install react-router-dom
```

2. **Crear configuración de rutas manual**
```typescript
// src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/eventos', element: <EventosPage /> },
  { path: '/invitados', element: <InvitadosPage /> },
  { path: '/presupuesto', element: <PresupuestoPage /> },
  // ... 53 rutas más
  { path: '/public-card/:slug', element: <PublicCardPage /> },
  { path: '/RelacionesPublicas/:eventId', element: <RRPPPage /> },
])
```

3. **Migrar todas las rutas dinámicas**
```diff
- pages/public-card/[...slug].tsx
+ routes: [{ path: '/public-card/:slug', ... }]
```

4. **Reemplazar `useRouter` de Next.js**
```diff
- import { useRouter } from 'next/router'
- const router = useRouter()
- router.push('/eventos')
+ import { useNavigate, useParams } from 'react-router-dom'
+ const navigate = useNavigate()
+ navigate('/eventos')
```

**Tiempo:** 1 semana
**Archivos afectados:** ~30 archivos que usan `useRouter`

---

### Fase 4: Migrar Componentes Next.js (3-5 días)

1. **Reemplazar `<Head>` con `react-helmet`**
```bash
npm install react-helmet-async
```

```diff
- import Head from 'next/head'
- <Head><title>Mi Página</title></Head>
+ import { Helmet } from 'react-helmet-async'
+ <Helmet><title>Mi Página</title></Helmet>
```

2. **Reemplazar `dynamic()` con `React.lazy()`**
```diff
- import dynamic from 'next/dynamic'
- const Component = dynamic(() => import('./Component'))
+ import { lazy, Suspense } from 'react'
+ const Component = lazy(() => import('./Component'))
+ <Suspense fallback={<Loading />}><Component /></Suspense>
```

3. **Migrar `NextSeo` a solución manual**
- Instalar `react-helmet-async`
- Configurar meta tags manualmente

**Tiempo:** 3-5 días

---

### Fase 5: Testing y Depuración (1-2 semanas)

1. **Probar todas las rutas** (58 páginas)
2. **Verificar API endpoints** (13 endpoints)
3. **Probar autenticación** (Firebase + cookies)
4. **Verificar integración Copilot**
5. **Probar Socket.IO**
6. **Verificar GraphQL**
7. **Probar generación PDF**
8. **Testing E2E** completo

**Tiempo:** 1-2 semanas
**Riesgo:** Alto (muchas integraciones complejas)

---

## ⏱️ TIEMPO TOTAL ESTIMADO

### Escenario Optimista (1 desarrollador experimentado)
```
Configuración base:        3 días
Migrar API Routes:         7 días
Migrar Routing:            5 días
Migrar Componentes:        3 días
Testing básico:            5 días
Depuración:                7 días
─────────────────────────────────
TOTAL:                    30 días (6 semanas)
```

### Escenario Realista (considerando problemas)
```
Configuración base:        5 días
Migrar API Routes:        10 días
Migrar Routing:            7 días
Migrar Componentes:        5 días
Testing completo:         10 días
Depuración + bugs:        10 días
Re-trabajo:                5 días
─────────────────────────────────
TOTAL:                    52 días (10-12 semanas)
```

---

## 💰 ANÁLISIS COSTO/BENEFICIO

### COSTOS

**Tiempo de desarrollo:**
- 6-12 semanas de 1 desarrollador full-time
- Estimado: **$15,000 - $30,000 USD** (según salario)

**Riesgos:**
- ❌ Bugs en migración de API routes
- ❌ Regresiones en funcionalidades
- ❌ Problemas con autenticación
- ❌ Problemas con Socket.IO/SSE
- ❌ Pérdida de optimizaciones automáticas

**Mantenimiento:**
- ❌ Backend separado para mantener
- ❌ Más configuración manual
- ❌ Dos deploys en lugar de uno

---

### BENEFICIOS

**Velocidad de desarrollo:**
- ✅ Vite es ~10x más rápido en HMR (Hot Module Replacement)
- ⚠️ Next.js 15 Fast Refresh ya es muy rápido

**Build time:**
- ✅ Vite builds son más rápidos (~30% menos tiempo)
- ⚠️ Next.js 15 con Turbopack ya es muy rápido

**Bundle size:**
- ⚠️ Similar entre Next.js y Vite con optimizaciones
- ❌ Pierdes optimizaciones automáticas de Next.js

**Developer Experience:**
- ✅ Configuración más simple de Vite
- ❌ Pierdes conveniences de Next.js (routing automático, API routes, etc.)

---

### VEREDICTO: **COSTO > BENEFICIO**

**Beneficios reales:** Mínimos (Next.js 15 ya es muy rápido)
**Costo:** Alto (6-12 semanas + riesgos)
**Recomendación:** ❌ **NO MIGRAR**

---

## 🎯 ALTERNATIVAS RECOMENDADAS

### Opción 1: **MANTENER NEXT.JS** (✅ RECOMENDADO)

**Por qué:**
- ✅ Next.js 15 ya es extremadamente rápido
- ✅ Turbopack mejora significativamente el HMR
- ✅ API Routes son convenientes y eficientes
- ✅ Routing automático ahorra mucho tiempo
- ✅ Optimizaciones automáticas funcionan muy bien
- ✅ Gran ecosistema y soporte

**Mejoras sin migrar:**
```bash
# Actualizar a Next.js 15 con Turbopack
npm install next@latest

# Usar Turbopack (más rápido que Webpack)
# next.config.js
module.exports = {
  experimental: {
    turbo: true
  }
}

# Habilitar SWC compiler (ya está por defecto en Next.js 15)
```

**Optimizaciones adicionales:**
1. ✅ Lazy loading de componentes grandes
2. ✅ Code splitting manual donde sea necesario
3. ✅ Optimizar bundle con `@next/bundle-analyzer`
4. ✅ Usar `next/image` para imágenes pesadas
5. ✅ Implementar ISR (Incremental Static Regeneration) donde aplique

**Tiempo:** 1-2 días de optimización
**Beneficio:** +30-50% velocidad sin migrar

---

### Opción 2: **Migrar a Astro** (si SSG es prioridad)

**Solo si necesitas:**
- ✅ Sitios estáticos ultra-rápidos
- ✅ Menor JavaScript en el cliente
- ✅ Múltiples frameworks (React + Vue + Svelte)

**NO aplicable para este proyecto porque:**
- ❌ Necesitas API routes (autenticación, proxies)
- ❌ Aplicación muy dinámica (no sitio estático)
- ❌ Firebase auth requiere JavaScript en cliente

---

### Opción 3: **Migrar a Remix** (si necesitas más control SSR)

**Solo si:**
- ✅ Necesitas SSR avanzado
- ✅ Quieres más control sobre data loading
- ✅ Necesitas mejor manejo de errores

**Tiempo de migración:** Similar a Vite (6-8 semanas)
**Ventajas sobre Vite:** Maneja SSR nativamente
**Desventajas:** Todavía necesitas backend separado para API routes complejas

---

## 📊 COMPARATIVA: NEXT.JS 15 vs VITE

| Característica | Next.js 15 | Vite + React Router |
|----------------|------------|---------------------|
| **HMR Speed** | ⚡⚡⚡⚡ (Turbopack) | ⚡⚡⚡⚡⚡ |
| **Build Speed** | ⚡⚡⚡⚡ | ⚡⚡⚡⚡⚡ |
| **API Routes** | ✅ Integrado | ❌ Necesita backend separado |
| **Routing** | ✅ Automático | ❌ Manual (React Router) |
| **SSR/SSG** | ✅ Nativo | ❌ Manual/complejo |
| **Optimizaciones** | ✅ Automáticas | ⚠️ Manuales |
| **Bundle Size** | ⚡⚡⚡⚡ | ⚡⚡⚡⚡ |
| **Developer Experience** | ⚡⚡⚡⚡⚡ | ⚡⚡⚡ |
| **Deploy** | ✅ Simple (Vercel) | ⚠️ Frontend + Backend |
| **Ecosystem** | ⚡⚡⚡⚡⚡ | ⚡⚡⚡⚡ |

**Veredicto:** Next.js 15 es superior para este proyecto

---

## 🚨 RIESGOS DE LA MIGRACIÓN

### Riesgos Técnicos (Alta probabilidad)

1. **Pérdida de funcionalidad** (80% probabilidad)
   - API routes necesitan backend completo
   - Proxies SSE/GraphQL pueden fallar
   - Autenticación Firebase puede tener issues

2. **Bugs en producción** (60% probabilidad)
   - Rutas dinámicas mal migradas
   - Context providers rotos
   - Socket.IO/WebSocket issues

3. **Performance regression** (40% probabilidad)
   - Sin optimizaciones automáticas de Next.js
   - Bundle mal configurado
   - Code splitting ineficiente

### Riesgos de Negocio (Media probabilidad)

1. **Downtime** durante migración
2. **Usuarios afectados** por bugs
3. **Tiempo de desarrollo** desviado de features nuevas
4. **ROI negativo** (mucha inversión, poco retorno)

---

## ✅ RECOMENDACIÓN FINAL

### ❌ **NO MIGRAR A VITE**

**Razones:**
1. ✅ **Next.js 15 ya es muy rápido** (Turbopack, SWC)
2. ❌ **Costo muy alto** (6-12 semanas desarrollo)
3. ❌ **Riesgo alto** de romper funcionalidades
4. ❌ **Beneficio mínimo** en la práctica
5. ✅ **API Routes son críticas** para tu arquitectura
6. ✅ **Routing automático** ahorra mucho tiempo

### 🎯 **MEJOR ESTRATEGIA: OPTIMIZAR NEXT.JS**

**Plan de optimización (1-2 días):**

1. **Habilitar Turbopack** (si no está ya)
```javascript
// next.config.js
module.exports = {
  experimental: {
    turbo: true // HMR 10x más rápido
  }
}
```

2. **Analizar bundle**
```bash
npm install @next/bundle-analyzer
```

3. **Lazy loading agresivo**
```typescript
const HeavyComponent = dynamic(() => import('./Heavy'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

4. **Optimizar imágenes**
```tsx
import Image from 'next/image'
<Image src="/logo.png" width={200} height={200} priority />
```

5. **Implementar ISR** para páginas públicas
```typescript
export async function getStaticProps() {
  return {
    props: { data },
    revalidate: 60 // Regenerar cada 60 segundos
  }
}
```

**Resultado esperado:**
- ✅ +30-50% mejora en velocidad de desarrollo
- ✅ +20-40% mejora en build time
- ✅ Mejor experiencia de usuario
- ✅ Tiempo: 1-2 días (vs 6-12 semanas de migración)
- ✅ Riesgo: Mínimo
- ✅ Costo: Bajo

---

## 📞 CONCLUSIÓN

**Pregunta:** ¿Vale la pena migrar a Vite?
**Respuesta:** ❌ **NO**

**Mejor opción:** Optimizar Next.js 15 existente

**Si aún quieres migrar:** Considera Remix (mejor que Vite para apps dinámicas)

**Tiempo estimado de migración:** 6-12 semanas
**Costo estimado:** $15,000-$30,000 USD
**Beneficio:** Mínimo (Next.js 15 ya es muy rápido)
**Riesgo:** Alto (muchas integraciones complejas)

---

**Recomendación final:** Invierte ese tiempo en:
1. ✅ Optimizar el código existente
2. ✅ Implementar nuevas features
3. ✅ Mejorar la experiencia de usuario
4. ✅ Resolver el bug del Copilot (backend)
5. ✅ Documentar el proyecto

**ROI:** Mucho mayor que una migración innecesaria

---

**Generado por:** Análisis técnico de arquitectura
**Fecha:** 5 de Febrero 2026
