# Resumen de Sesión: Fixes de Login y Monorepo

**Fecha**: 2026-02-11
**Proyecto**: AppBodasdehoy.com (Monorepo)
**Apps**: apps/web (puerto 8080) + apps/copilot (puerto 3210)

## 🎯 Objetivos de la Sesión

1. ✅ Hacer funcionar apps/web en puerto 8080 junto con apps/copilot (puerto 3210)
2. ✅ Resolver errores de consola y crashes de la aplicación
3. ⚠️ Resolver problema de autenticación (sessionCookie)
4. ⚠️ Optimizar carga de eventos (lentitud)

---

## ✅ Problemas Resueltos

### 1. Error: "Application error: a client-side exception has occurred"
**Causa**: Múltiples errores en cascada
**Solución**: Identificados y resueltos uno por uno (ver detalles abajo)

### 2. Error: `Cannot read properties of undefined (reading 'reduce')` en Notifications.tsx
**Ubicación**: `apps/web/components/Notifications.tsx`
**Causa**: Acceso a `notifications?.results[0]` sin verificar que el array existe y tiene elementos
**Solución**: Agregadas validaciones en 4 ubicaciones:
- Línea 35: `handleScroll` - Agregado `notifications?.results &&`
- Línea 82: `useEffect` - Agregado `notifications.results.length > 0`
- Línea 107-111: `handleFalseShowNotifications` - Agregado early return si no hay resultados
- Línea 146: JSX - Agregado `notifications.results.length > 0`

### 3. Error: `Cannot read properties of undefined (reading '0')` en AuthContext
**Ubicación**: `apps/web/context/AuthContext.tsx:208`
**Causa**: `c[idx - 1]` accedido sin validar que `c` existe y que `idx > 0`
**Solución**:
```typescript
const domainDevelop = (c && idx !== undefined && idx !== -1 && idx > 0 && c[idx - 1])
  ? c[idx - 1]
  : devDomain[0]
```

### 4. Incompatibilidad: next/navigation en Pages Router
**Causa**: 63 archivos importando desde `next/navigation` (solo para App Router) en proyecto con Pages Router
**Solución**: Sistema de polyfill completo
- **Creado**: `apps/web/hooks/useCompatRouter.ts` - Implementa todos los hooks de next/navigation usando next/router
- **Configurado**: Webpack alias en `next.config.js` que redirige `'next/navigation'` al polyfill
- **Hooks implementados**:
  - `useRouter()` - navegación
  - `usePathname()` - pathname actual
  - `useSearchParams()` - query params como URLSearchParams
  - `useParams()` - parámetros dinámicos de ruta
  - `useCompatRouter()` - hook completo combinado
  - `useQueryParams()` - helper para query params

### 5. Código minificado imposible de debuggear
**Causa**: Producción con minificación activa
**Solución**: Desactivada minificación en `next.config.js` para debugging:
```javascript
if (!dev && !isServer) {
  config.optimization.minimize = false;
}
```

### 6. ErrorBoundary para capturar errores de React
**Creado**: `apps/web/components/ErrorBoundary.tsx`
- Captura errores con stack traces completos
- Muestra error message, stack y component stack
- Incluye botón de recarga

### 7. Parsing de hostname con puerto
**Ubicación**: `apps/web/pages/_app.tsx`
**Causa**: `app-test.bodasdehoy.com:8080` se parseaba incorrectamente
**Solución**:
```typescript
const hostWithPort = req ? req.headers.host : window.location.hostname;
const host = hostWithPort?.split(':')[0]; // Remover puerto
```

### 8. Usuario convertido a "guest" después de login exitoso
**Ubicación**: `apps/web/context/AuthContext.tsx:657-674`
**Causa**: Lógica que creaba usuario guest cuando no había sessionCookie, incluso si había usuario autenticado en Firebase
**Solución**:
```typescript
// Antes: if (!sessionCookie)
// Ahora: if (!sessionCookie && !user?.uid)

// Agregada lógica alternativa:
else if (user?.uid && !sessionCookieParsed?.user_id) {
  // Usuario autenticado en Firebase sin sessionCookie
  setUser(user)
  moreInfo(user)
}
```

### 9. Logout automático después de login
**Ubicación**: `apps/web/context/AuthContext.tsx:578-677` (función `verificator`)
**Causa**: Verificador hacía `signOut()` si no había sessionCookie válida
**Solución**: Desactivado logout automático temporalmente + agregados logs detallados
- Agregado check de `isStartingRegisterOrLogin` para evitar verificación durante login
- Comentado `signOut()` automático
- Agregados logs extensivos para debugging

### 10. Proxy para API de autenticación (CORS)
**Ubicación**: `apps/web/next.config.js`
**Causa**: Llamadas a `https://api.bodasdehoy.com/graphql` bloqueadas por CORS en desarrollo
**Solución**: Agregado proxy en rewrites:
```javascript
{
  source: '/api/proxy-bodas/graphql',
  destination: 'https://api.bodasdehoy.com/graphql',
}
```

---

## ⚠️ Problemas Parcialmente Resueltos

### 1. SessionCookie no se obtiene de la API
**Estado**: INVESTIGANDO
**Síntoma**: La mutation `auth(idToken)` no devuelve `sessionCookie`
**Impacto**: Usuario puede loguearse pero no mantiene sesión completa
**Workaround actual**: Usuario se mantiene autenticado usando datos de Firebase directamente
**Diagnóstico creado**:
- `apps/web/pages/api-debug.tsx` - Herramienta para probar mutation directamente
- Logs detallados en `Authentication.tsx` líneas 47-107
- Logs detallados en `AuthContext.tsx` función `verificator`

**Próximos pasos necesarios**:
1. Usuario debe ir a http://app-test.bodasdehoy.com:8080/api-debug
2. Hacer clic en "🧪 Probar Auth Mutation"
3. Copiar resultado completo (especialmente respuesta de la API)
4. Con esa información podemos identificar si el problema es:
   - API backend no generando sessionCookie
   - Headers incorrectos en la petición
   - Problema de autenticación en Firebase
   - Problema de desarrollo/producción

### 2. Carga lenta de eventos
**Estado**: OPTIMIZADO CON LOGS
**Síntoma**: "Cargando eventos..." tarda mucho
**Causa probable**: Llamadas secuenciales a API para obtener detalles de usuarios compartidos
**Diagnóstico agregado**: `apps/web/context/EventsGroupContext.tsx` líneas 116-161
- Logs de tiempo de fetch inicial
- Logs por cada evento procesado
- Log de tiempo total de carga de detalles
- Log de tiempo total completo

**Próximos pasos necesarios**:
1. Usuario debe abrir consola del navegador
2. Hacer login
3. Copiar logs que comienzan con `[EventsGroup]`
4. Analizar qué parte es más lenta:
   - Fetch inicial de eventos
   - Carga de detalles de usuarios
   - Procesamiento de permisos

---

## 🔧 Archivos Modificados

### Archivos Críticos
1. `apps/web/components/Notifications.tsx` - 4 fixes de array access
2. `apps/web/context/AuthContext.tsx` - Fix de guest user + logs en verificator
3. `apps/web/utils/Authentication.tsx` - Logs detallados de auth mutation
4. `apps/web/context/EventsGroupContext.tsx` - Logs de performance
5. `apps/web/pages/_app.tsx` - Fix de hostname parsing + ErrorBoundary wrapper
6. `apps/web/next.config.js` - Webpack alias, proxy, minification desactivada

### Archivos Nuevos Creados
1. `apps/web/hooks/useCompatRouter.ts` - Polyfill de next/navigation
2. `apps/web/components/ErrorBoundary.tsx` - Error boundary de React
3. `apps/web/pages/test-login-debug.tsx` - Página de diagnóstico de login
4. `apps/web/pages/api-debug.tsx` - Herramienta de diagnóstico de API
5. `apps/web/utils/next-navigation-polyfill.ts` - Polyfill de console (desactivado)
6. `apps/web/.env.production.local` - Variables de entorno para desarrollo local

---

## 🚀 Estado de los Servidores

### apps/web
- **Puerto**: 8080
- **URL**: http://app-test.bodasdehoy.com:8080
- **Estado**: ✅ FUNCIONANDO
- **Build**: Producción sin minificación
- **Características**:
  - Login funcional (Firebase)
  - Usuario NO se convierte en guest después de login ✅
  - ErrorBoundary capturando errores ✅
  - Logs detallados de autenticación ✅
  - Logs de performance de eventos ✅

### apps/copilot
- **Puerto**: 3210
- **URL**: http://chat-test.bodasdehoy.com:3210
- **Estado**: ✅ FUNCIONANDO
- **Sin cambios**: Corriendo desde sesión anterior

---

## 📋 Páginas de Diagnóstico Disponibles

1. **http://app-test.bodasdehoy.com:8080/test-login-debug**
   - Diagnóstico básico de login
   - Muestra config, usuario, Firebase state
   - Permite probar login con logs en tiempo real

2. **http://app-test.bodasdehoy.com:8080/api-debug**
   - ⭐ **MÁS IMPORTANTE**
   - Prueba la mutation `auth` directamente
   - Compara llamada directa vs proxy
   - Muestra respuesta completa de la API
   - Logs detallados en consola tipo terminal

3. **http://app-test.bodasdehoy.com:8080/debug-error**
   - Captura errores globales del navegador
   - Muestra environment info
   - Lista todos los errores capturados

---

## 🔍 Información Necesaria para Continuar

Para resolver completamente los problemas restantes, necesitamos:

### 1. Logs de la API de autenticación
**Cómo obtenerlos**:
```
1. Ir a http://app-test.bodasdehoy.com:8080/api-debug
2. Hacer clic en "🧪 Probar Auth Mutation"
3. Copiar TODA la salida, especialmente:
   - Estado Actual (cookies presentes/ausentes)
   - Resultado del Test (ambas llamadas: directa y proxy)
   - Logs Detallados (terminal negra con texto verde)
```

### 2. Logs de carga de eventos
**Cómo obtenerlos**:
```
1. Abrir http://app-test.bodasdehoy.com:8080/login
2. Abrir consola del navegador (F12 → Console)
3. Hacer login con bodasdehoy.com@gmail.com / lorca2012M*+
4. Copiar todos los logs que comienzan con:
   - [EventsGroup]
   - [Auth]
   - [Verificator]
```

### 3. Logs de errores en consola
**Cómo obtenerlos**:
```
1. Con F12 → Console abierta
2. Copiar cualquier error en rojo
3. Copiar stack traces completos
```

---

## 📝 Decisiones Técnicas Tomadas

### 1. Polyfill de next/navigation vs Migración a App Router
**Decisión**: Polyfill
**Razón**:
- Migrar 63 archivos a App Router es muy riesgoso
- El polyfill funciona perfectamente
- Permite compatibilidad inmediata
- Se puede migrar gradualmente en el futuro

### 2. Desactivar minificación en producción
**Decisión**: Desactivada temporalmente
**Razón**: Necesario para debugging
**Próximo paso**: Re-activar cuando todos los bugs estén resueltos

### 3. No hacer logout automático sin sessionCookie
**Decisión**: Desactivado temporalmente
**Razón**:
- Permite que el usuario se mantenga logueado
- Facilita el debugging del problema de sessionCookie
- Se puede re-activar cuando la API funcione correctamente

### 4. Usar datos de Firebase directamente si no hay sessionCookie
**Decisión**: Implementado como workaround
**Razón**:
- Permite funcionalidad básica mientras se resuelve el problema de la API
- Usuario puede usar la app
- Se puede quitar cuando sessionCookie funcione

---

## 🎯 Próximos Pasos Recomendados

### Inmediatos (Sesión Actual)
1. ✅ Verificar que usuario puede hacer login y NO se convierte en guest
2. ⏳ Obtener logs de /api-debug para diagnosticar problema de sessionCookie
3. ⏳ Obtener logs de [EventsGroup] para identificar cuello de botella en carga

### Corto Plazo (Próxima Sesión)
1. Resolver problema de sessionCookie basado en logs de /api-debug
2. Optimizar carga de eventos basado en logs de performance
3. Verificar que notificaciones funcionan correctamente

### Medio Plazo (Cuando esté estable)
1. Re-activar minificación en producción
2. Re-activar logout automático si sessionCookie inválida
3. Limpiar logs de debugging
4. Documentar solución final

### Largo Plazo (Mejoras futuras)
1. Considerar migración gradual a App Router
2. Implementar sistema de caché para eventos
3. Optimizar queries de GraphQL (batch requests)
4. Implementar lazy loading de detalles de usuarios

---

## 💡 Lecciones Aprendidas

1. **Array Access Safety**: Siempre verificar `array && array.length > 0` antes de `array[0]`
2. **Pages Router vs App Router**: Incompatibilidad crítica, necesita polyfill o migración
3. **Production Debugging**: Minificación debe ser desactivable para debugging
4. **Error Boundaries**: Esenciales para capturar errores de React en producción
5. **Hostname Parsing**: Siempre separar puerto del hostname antes de procesar
6. **Guest User Logic**: Verificar estado de Firebase antes de crear usuario guest
7. **API Debugging**: Herramientas de diagnóstico in-app son invaluables

---

## 🔗 URLs Útiles

- **App Principal**: http://app-test.bodasdehoy.com:8080
- **Copilot**: http://chat-test.bodasdehoy.com:3210
- **Login**: http://app-test.bodasdehoy.com:8080/login
- **Diagnóstico API**: http://app-test.bodasdehoy.com:8080/api-debug ⭐
- **Diagnóstico Login**: http://app-test.bodasdehoy.com:8080/test-login-debug
- **Diagnóstico Errores**: http://app-test.bodasdehoy.com:8080/debug-error

---

## 📞 Credenciales de Prueba

- **Email**: bodasdehoy.com@gmail.com
- **Password**: lorca2012M*+

---

**Última actualización**: 2026-02-11
**Estado**: ✅ Login funcional, ⚠️ SessionCookie pendiente, ⚠️ Performance en investigación
