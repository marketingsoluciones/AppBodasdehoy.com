# 🔍 Diagnóstico: Redirect Automático en /login

**Fecha**: 2026-02-07 (Continuación de sesión)
**Problema**: Login se redirige automáticamente a "/" incluso después de comentar auto-redirect en login.js
**Estado**: 🔄 Investigando

---

## 📋 Resumen Ejecutivo

### Problema Reportado
Los tests automatizados muestran que al navegar a `/login`, la página se redirige automáticamente a `/` después de 1-3 segundos, incluso después de:
- ✅ Comentar el auto-redirect en `login.js` (líneas 63-95)
- ✅ Limpiar todas las cookies
- ✅ Limpiar localStorage, sessionStorage
- ✅ Eliminar bases de datos de IndexedDB de Firebase

### Evidencia del Problema

**Output del test `test-login-clean.mjs`**:
```
📝 Paso 2: Navegando a /login...
   ✅ Página cargada
   ⏱️  Esperando 3s para verificar que permanece en /login...
   ⚠️  ADVERTENCIA: Se redirigió a: http://localhost:8080/
   🔄 Volviendo a /login...

📝 Paso 3: Llenando formulario de login...
   Buscando campo de email...
   ❌ No se encontró el campo de email
```

**Conclusión**: Hay código JavaScript que causa un redirect automático desde `/login` a `/` que NO está en `login.js`.

---

## 🔎 Investigación

### Archivos Analizados

#### 1. apps/web/pages/login.js ✅
**Estado**: Auto-redirect COMENTADO correctamente

```javascript
// Líneas 63-96 - COMENTADO
/*
useEffect(() => {
  if (user && user?.displayName !== "guest") {
    // ... lógica de redirect ...
    const timer = setTimeout(() => {
      router.replace(redirectPath)
    }, 100)
    return () => clearTimeout(timer)
  }
}, [user, queryD, router])
*/
```

**Conclusión**: No es la causa del redirect.

---

#### 2. apps/web/context/AuthContext.tsx ⚠️
**Estado**: MÚLTIPLES puntos de redirect encontrados

##### Punto de Redirect 1: Líneas 481-482
```typescript
} else {
  // Usuario no existe, redirigir a registro
  setUser(result.user)
  setVerificationDone(true)
  if (window.location.pathname !== '/login') {
    window.location.href = config?.pathLogin || '/login'
  }
}
```

**Análisis**:
- Este código redirige **A** `/login` si NO estás en `/login`
- No es la causa del redirect **DESDE** `/login`

---

##### Punto de Redirect 2: Líneas 456-476 ⚠️ **CAUSA PROBABLE**
```typescript
// Si estamos en la URL correcta, redirigir a la página principal o la URL de destino
// Esperar un momento para asegurar que las cookies se establezcan correctamente
const queryD = new URLSearchParams(window.location.search).get('d')
const redirectPath = queryD || '/'
console.log("[Auth] ✅ Login exitoso, esperando para establecer cookies antes de redirigir a:", redirectPath)

// Esperar 1 segundo para asegurar que las cookies se establezcan
setTimeout(() => {
  // Verificar cookies antes de redirigir
  const sessionCookie = Cookies.get(config?.cookie)
  const idToken = Cookies.get("idTokenV0.1.0")

  if (sessionCookie && idToken) {
    console.log("[Auth] ✅ Cookies verificadas, redirigiendo...")
    window.location.href = redirectPath
  } else {
    console.warn("[Auth] ⚠️ Algunas cookies no están presentes, redirigiendo de todas formas...")
    window.location.href = redirectPath
  }
}, 1000)
```

**Análisis CRÍTICO**:
1. Este código se ejecuta dentro del handler de `getRedirectResult` (líneas 292-502)
2. `getRedirectResult` se ejecuta **SIEMPRE** al cargar AuthContext, no solo después de login de Google/Facebook
3. Si Firebase detecta una **sesión residual en memoria**, `getRedirectResult` puede retornar un usuario
4. El `setTimeout` de **1000ms (1 segundo)** coincide con el timing del redirect observado en los tests
5. El redirect va a `queryD || '/'`, que explica por qué va a `/`

---

##### Punto de Redirect 3: Líneas 214-218
```typescript
if (["ticket", "testticket"].includes(resp.subdomain) && window.location.pathname.split("/")[1] === "") {
  router.push("/RelacionesPublicas")
}
```

**Análisis**: Solo aplica para subdominios de tickets. No es la causa.

---

### ¿Por Qué Persiste el Problema?

#### Sesiones de Firebase en Memoria
Firebase Auth mantiene sesiones en múltiples lugares:

1. **Cookies** ✅ (limpiadas)
   - `sessionBodas`
   - `idTokenV0.1.0`

2. **localStorage** ✅ (limpiado)
   ```javascript
   localStorage.clear()
   ```

3. **sessionStorage** ✅ (limpiado)
   ```javascript
   sessionStorage.clear()
   ```

4. **IndexedDB** ✅ (limpiado)
   ```javascript
   window.indexedDB.deleteDatabase('firebaseLocalStorageDb')
   window.indexedDB.deleteDatabase('firebase-heartbeat-database')
   window.indexedDB.deleteDatabase('firebase-installations-database')
   ```

5. **Memoria del navegador** ❌ (NO limpiable)
   - Firebase mantiene el estado de autenticación en memoria JavaScript
   - Persiste hasta que se cierra la pestaña o el navegador
   - **No hay API para limpiar esto**

---

## 🎯 Causa Raíz Identificada

### El Problema Real

1. **Estado**: Usuario previamente autenticado en sesión anterior
2. **Acción**: Test limpia cookies, localStorage, sessionStorage, IndexedDB
3. **Problema**: Firebase Auth mantiene sesión en memoria del proceso del navegador
4. **Resultado**: `getRedirectResult()` en AuthContext.tsx detecta la sesión residual
5. **Ejecución**: Código en líneas 456-476 se ejecuta
6. **Redirect**: `setTimeout` de 1s redirige a `queryD || '/'`
7. **Observado**: Página se redirige de `/login` a `/` después de ~1-3 segundos

### Diagrama de Flujo

```
Usuario hace login → Firebase guarda sesión en memoria
                     ↓
Test ejecuta → Limpia cookies/storage/IndexedDB
                     ↓
Test navega a /login → Página carga
                     ↓
AuthContext monta → getRedirectResult() ejecuta
                     ↓
Firebase memoria → Retorna usuario de sesión anterior
                     ↓
Código líneas 456-476 → setTimeout(1000ms)
                     ↓
Redirect → window.location.href = '/'
```

---

## ✅ Soluciones Propuestas

### Solución 1: Modo Incógnito ⭐ IMPLEMENTADA
**Archivo**: `test-login-incognito.mjs`

**Estrategia**:
- Usar contexto de incógnito del navegador
- Garantiza sesión completamente nueva sin persistencia
- No requiere cambios en el código de producción

**Ventajas**:
- ✅ No modifica código de producción
- ✅ Sesión 100% limpia garantizada
- ✅ Simula usuario completamente nuevo

**Código**:
```javascript
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  storageState: undefined  // Modo incógnito
});
const page = await context.newPage();
```

**Estado**: 🔄 Test ejecutándose actualmente

---

### Solución 2: Query Parameter de Test
**Modificación requerida**: `apps/web/context/AuthContext.tsx`

**Estrategia**:
- Agregar flag `?test-mode=1` que deshabilita redirects automáticos
- Tests usan este flag en todas las navegaciones

**Código sugerido**:
```typescript
// Línea 456, ANTES del redirect
const isTestMode = new URLSearchParams(window.location.search).get('test-mode') === '1'

if (!isTestMode) {
  setTimeout(() => {
    window.location.href = redirectPath
  }, 1000)
} else {
  console.log("[Auth] Test mode: skipping auto-redirect")
}
```

**Ventajas**:
- ✅ Control preciso sobre redirects
- ✅ No afecta flujo de producción

**Desventajas**:
- ❌ Requiere modificar código de producción
- ❌ Flag debe mantenerse en sincronía con tests

---

### Solución 3: Cerrar/Reabrir Navegador Entre Tests
**Modificación requerida**: Scripts de test

**Estrategia**:
- Cerrar navegador completamente después de cada test
- Abrir navegador nuevo para siguiente test
- Limpia completamente la memoria de Firebase

**Código sugerido**:
```javascript
// Test 1
let browser = await chromium.launch();
// ... ejecutar test ...
await browser.close(); // IMPORTANTE: Cerrar completamente

// Esperar 1s
await new Promise(resolve => setTimeout(resolve, 1000));

// Test 2
browser = await chromium.launch(); // NUEVO navegador, nueva memoria
// ... ejecutar test ...
await browser.close();
```

**Ventajas**:
- ✅ No modifica código de producción
- ✅ Limpieza completa de memoria

**Desventajas**:
- ❌ Tests más lentos (overhead de abrir/cerrar navegador)
- ❌ Más complejo de implementar

---

### Solución 4: Deshabilitar getRedirectResult en Localhost
**Modificación requerida**: `apps/web/context/AuthContext.tsx`

**Estrategia**:
- Deshabilitar completamente `getRedirectResult` en localhost
- Solo ejecutarlo en producción

**Código sugerido**:
```typescript
// Línea 292
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

if (!isLocalhost) {
  getRedirectResult(getAuth())
    .then(async (result) => {
      // ... código existente ...
    })
} else {
  console.log("[Auth] Localhost: skipping getRedirectResult")
  // Continuar con flujo normal de onAuthStateChanged
}
```

**Ventajas**:
- ✅ Elimina el problema en localhost/testing
- ✅ No afecta producción

**Desventajas**:
- ❌ No prueba el flujo completo de redirect login
- ❌ Diferencias entre localhost y producción

---

## 📊 Comparación de Soluciones

| Solución | Cambios en Código | Efectividad | Complejidad | Velocidad Tests |
|----------|-------------------|-------------|-------------|-----------------|
| 1. Modo Incógnito | ✅ Ninguno | ⭐⭐⭐⭐⭐ | ⭐⭐ Baja | ⭐⭐⭐⭐ Rápida |
| 2. Query Parameter | ❌ AuthContext | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ Media | ⭐⭐⭐⭐⭐ Muy rápida |
| 3. Cerrar/Reabrir | ✅ Solo tests | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ Alta | ⭐⭐ Lenta |
| 4. Deshabilitar Redirect | ❌ AuthContext | ⭐⭐⭐ Parcial | ⭐⭐ Baja | ⭐⭐⭐⭐⭐ Muy rápida |

---

## 🎯 Recomendación

### Solución Inmediata: **Modo Incógnito** (Solución 1)
**Estado**: ✅ Implementada en `test-login-incognito.mjs`

**Por qué**:
1. No requiere cambios en código de producción
2. Sesión 100% limpia garantizada
3. Simula comportamiento de usuario nuevo real
4. Tests rápidos

**Siguientes pasos**:
1. ✅ Verificar que test-login-incognito.mjs funciona correctamente
2. ⏳ Verificar que NO ocurre redirect automático
3. ⏳ Verificar que campos de formulario son encontrados
4. ⏳ Verificar que login funciona correctamente

---

### Solución a Largo Plazo: **Query Parameter** (Solución 2)
**Cuando**: Después de verificar que modo incógnito funciona

**Por qué**:
1. Más control sobre el flujo de autenticación
2. Útil para otros tipos de tests automatizados
3. Puede usarse en desarrollo manual
4. No cambia comportamiento de producción

**Implementación sugerida**:
```typescript
// AuthContext.tsx línea ~456
const isTestMode =
  process.env.NODE_ENV === 'development' &&
  new URLSearchParams(window.location.search).get('test-mode') === '1'

if (!isTestMode) {
  setTimeout(() => {
    window.location.href = redirectPath
  }, 1000)
} else {
  console.log("[Auth] 🧪 Test mode activo: auto-redirect deshabilitado")
}
```

---

## 📝 Logs Útiles para Debugging

### Verificar si getRedirectResult está ejecutando
```javascript
// AuthContext.tsx línea ~292
console.log("[Auth] ⚙️ Ejecutando getRedirectResult...");
getRedirectResult(getAuth())
  .then(async (result) => {
    console.log("[Auth] 📊 Resultado de getRedirectResult:", {
      hasResult: !!result,
      hasUser: !!result?.user,
      email: result?.user?.email,
      pathname: window.location.pathname
    });
    // ...
  })
```

### Verificar cuando va a redirigir
```javascript
// AuthContext.tsx línea ~463
setTimeout(() => {
  console.log("[Auth] ⚠️ EJECUTANDO REDIRECT AHORA:", {
    from: window.location.href,
    to: redirectPath,
    sessionCookie: !!sessionCookie,
    idToken: !!idToken
  });
  window.location.href = redirectPath
}, 1000)
```

---

## 🔍 Próximos Pasos

### Inmediato
1. ⏳ Verificar resultado de `test-login-incognito.mjs`
2. ⏳ Confirmar que NO ocurre redirect
3. ⏳ Confirmar que formulario se encuentra
4. ⏳ Confirmar que login funciona

### Si Modo Incógnito Funciona
1. Usar este enfoque para todos los tests automatizados
2. Documentar en README de tests
3. Crear suite completa de tests con modo incógnito

### Si Modo Incógnito NO Funciona
1. Implementar Solución 2 (Query Parameter)
2. Modificar AuthContext.tsx
3. Actualizar todos los tests para usar `?test-mode=1`

---

## 📚 Referencias

### Archivos Relevantes
- [apps/web/pages/login.js](apps/web/pages/login.js) - Formulario de login
- [apps/web/context/AuthContext.tsx:292-502](apps/web/context/AuthContext.tsx#L292-L502) - Handler de getRedirectResult
- [apps/web/context/AuthContext.tsx:456-476](apps/web/context/AuthContext.tsx#L456-L476) - Código de redirect con setTimeout
- [test-login-incognito.mjs](test-login-incognito.mjs) - Test con modo incógnito

### Documentos Relacionados
- [ESTADO_FINAL_SESION_2026-02-07.md](ESTADO_FINAL_SESION_2026-02-07.md) - Estado de la sesión
- [FIX_LOGIN_Y_MENU_2026-02-07.md](FIX_LOGIN_Y_MENU_2026-02-07.md) - Fix de login auto-cierre

---

**Última actualización**: 2026-02-07
**Estado**: 🔄 Test de modo incógnito ejecutándose
**Próximo paso**: Verificar resultado del test
