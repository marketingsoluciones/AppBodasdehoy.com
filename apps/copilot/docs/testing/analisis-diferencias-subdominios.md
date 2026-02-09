# Análisis Profundo: Diferencias entre Sistema Actual y Propuesta de Subdominios

## Resumen Ejecutivo

Este documento analiza las diferencias principales entre el **sistema de login actual de AppBodas** (antes de los cambios recientes) y la **propuesta de automatización con subdominios** que se documentó. Se identifican 5 diferencias críticas que deben ser consideradas.

---

## 1. SUBDOMINIOS FUNCIONALES vs SUBDOMINIOS TÉCNICOS

### Sistema Actual de AppBodas

El sistema distingue entre **subdominios funcionales** (parte del negocio) y **subdominios técnicos** (infraestructura):

#### Subdominios Funcionales (Routing Especial)
- **`ticket`** / **`testticket`**: Redirige automáticamente a `/RelacionesPublicas`
- **`invitado`** / **`testinvitado`**: Para gestión de invitados
- **`dev`**: Para desarrollo

**Código relevante:**
```typescript
// apps/web/context/AuthContext.tsx:214-218
resp.subdomain = ["ticket", "testticket", "invitado", "testinvitado", "dev"].includes(c[0]) 
  ? c[0] 
  : subdomainDevelop

// Redirección automática para ticket
if (["ticket", "testticket"].includes(resp.subdomain) && 
    window.location.pathname.split("/")[1] === "") {
  router.push("/RelacionesPublicas")
}
```

#### Subdominios Técnicos (Infraestructura)
- **`chat-test`**: Entorno de testing del chat
- **`test.`**: Entorno de testing general
- **`dev.`**: Desarrollo
- **`staging.`**: Staging

**Código relevante:**
```typescript
// apps/web/utils/urlHelpers.ts:152-158
const TEST_SUBDOMAIN_PATTERNS = [
  '://test.',
  '://chat-test.',
  '://dev.',
  '://staging.',
  '://local.',
];
```

### Mi Propuesta (Documentación)

❌ **NO menciona** los subdominios funcionales (`ticket`, `invitado`)
✅ Solo se enfoca en subdominios técnicos (`chat-test`, `test.`, etc.)
❌ Asume que **todos** los subdominios comparten sesión de la misma manera
❌ No explica el routing especial para subdominios funcionales

### Impacto

- **Crítico**: Si alguien intenta automatizar login en `ticket.bodasdehoy.com`, será redirigido automáticamente a `/RelacionesPublicas`, lo cual puede romper el flujo de automatización.
- **Importante**: Los subdominios funcionales tienen propósitos específicos del negocio que no se mencionan en la documentación.

---

## 2. BYPASS DE DESARROLLO PARA SUBDOMINIOS DE TEST

### Sistema Actual de AppBodas

Existe un **sistema de bypass** específico para subdominios de test que permite acceso sin autenticación completa:

**Código relevante:**
```typescript
// apps/web/context/AuthContext.tsx:267-274
const hostname = window.location.hostname
const isTestEnv = hostname.includes('chat-test') || 
                  hostname.includes('test.') || 
                  hostname.includes('localhost') || 
                  hostname.includes('127.0.0.1')
const devBypass = sessionStorage.getItem('dev_bypass') === 'true'

if (isTestEnv && devBypass) {
  console.log("[Auth] 🔓 Bypass de desarrollo activo para subdominio de test")
  // Carga usuario y eventos directamente sin autenticación completa
  // Usa UID conocido: 'upSETrmXc7ZnsIhrjDjbHd7u2up1'
  // Obtiene UID de cookie dev-user-config si existe
}
```

**Características del bypass:**
- Se activa con `sessionStorage.setItem('dev_bypass', 'true')`
- Usa un UID conocido de desarrollo: `'upSETrmXc7ZnsIhrjDjbHd7u2up1'`
- Puede usar email personalizado: `sessionStorage.setItem('dev_bypass_email', 'email@example.com')`
- Carga datos del usuario directamente desde GraphQL sin pasar por Firebase Auth completo
- Solo funciona en entornos de test (`chat-test`, `test.`, `localhost`)

### Mi Propuesta (Documentación)

❌ **NO menciona** el sistema de bypass
❌ No explica cómo activar el bypass para testing
❌ Asume que siempre se requiere autenticación completa con Google OAuth

### Impacto

- **Crítico**: Para testing automatizado, el bypass es **mucho más eficiente** que el login completo con Google OAuth.
- **Importante**: La documentación no explica esta funcionalidad, lo que puede llevar a intentar automatizar el login completo cuando existe una alternativa más simple.

---

## 3. DETECCIÓN Y MANEJO DE SUBDOMINIOS DE TEST

### Sistema Actual de AppBodas

El sistema tiene lógica especial para detectar y manejar subdominios de test:

**Código relevante:**
```typescript
// apps/web/context/AuthContext.tsx:219-244
const isOnTestSubdomain = isTestSubdomain()
const isLocalhost = idx === -1

if (isLocalhost || isOnTestSubdomain) {
  // Para subdominios de test, usar el origin actual para mantener el usuario en el mismo subdominio
  let directory: string
  if (isOnTestSubdomain) {
    // Mantener el subdominio actual (ej: chat-test.bodasdehoy.com -> chat-test.bodasdehoy.com)
    directory = window.origin
  } else {
    // Localhost - usar la variable de entorno
    directory = process.env.NEXT_PUBLIC_DIRECTORY
  }

  resp = {
    ...resp,
    domain: process.env.NEXT_PUBLIC_PRODUCTION ? resp?.domain : process.env.NEXT_PUBLIC_DOMINIO,
    pathDirectory: resp?.pathDirectory ? `${directory}` : undefined,
    pathLogin: resp?.pathLogin ? `${directory}/login` : undefined,
    pathSignout: resp?.pathSignout ? `${directory}/signout` : undefined,
    pathPerfil: resp?.pathPerfil ? `${directory}/configuracion` : undefined
  }
}
```

**Características:**
- Los subdominios de test **mantienen el mismo subdominio** en redirects (no redirigen a dominio principal)
- Las rutas de login/logout/perfil se adaptan al subdominio actual
- Hay configuración especial de Firebase App Check para subdominios de test

**Código relevante:**
```typescript
// apps/web/context/AuthContext.tsx:250-255
const debugHosts = ['localhost', 'chat-test.bodasdehoy.com']
if (typeof window !== 'undefined' && debugHosts.includes(window.location.hostname)) {
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = 'CD2BCA5A-E34F-4F7E-B24B-81BC9DEB52C8'
  console.log('[Firebase] App Check debug token configurado para:', window.location.hostname)
}
```

### Mi Propuesta (Documentación)

✅ Menciona que los subdominios comparten sesión
❌ **NO explica** que los redirects se mantienen en el mismo subdominio
❌ **NO menciona** la configuración especial de Firebase App Check
❌ **NO explica** cómo se adaptan las rutas (login, logout, perfil) al subdominio

### Impacto

- **Moderado**: La automatización puede fallar si espera que los redirects vayan al dominio principal cuando en realidad se mantienen en el subdominio de test.
- **Importante**: No se explica que `chat-test.bodasdehoy.com/login` es diferente de `www.bodasdehoy.com/login` en términos de routing.

---

## 4. ESTABLECIMIENTO DE COOKIES CON DOMINIO BASE

### Sistema Actual de AppBodas

El código actual **ya establece cookies con dominio base** para compartir entre subdominios:

**Código relevante:**
```typescript
// apps/web/context/AuthContext.tsx:485-524
// Determinar el dominio correcto para la cookie
let cookieDomain = config?.domain || ""
if (!cookieDomain) {
  cookieDomain = process.env.NEXT_PUBLIC_PRODUCTION 
    ? config?.domain 
    : process.env.NEXT_PUBLIC_DOMINIO || ".bodasdehoy.com"
}
// Asegurar que el dominio empiece con punto para subdominios
if (cookieDomain && !cookieDomain.startsWith('.')) {
  cookieDomain = `.${cookieDomain.replace(/^https?:\/\//, '').split('/')[0]}`
}

Cookies.set(config?.cookie, sessionCookie, { 
  domain: cookieDomain,  // Ej: ".bodasdehoy.com"
  expires: dateExpire,
  path: "/",
  secure: window.location.protocol === "https:",
  sameSite: "lax"
})
```

**Características:**
- El dominio de la cookie se normaliza para empezar con punto (`.bodasdehoy.com`)
- Se elimina el protocolo (`https://`) si está presente
- La cookie se establece con `path: "/"` para estar disponible en todas las rutas
- Se usa `sameSite: "lax"` para compatibilidad

### Mi Propuesta (Documentación)

✅ **Correctamente explica** que las cookies se establecen con dominio base
✅ Menciona que esto permite compartir entre subdominios
❌ **NO explica** la lógica de normalización del dominio (agregar punto, eliminar protocolo)
❌ **NO menciona** los parámetros específicos (`path`, `sameSite`, `secure`)

### Impacto

- **Bajo**: La documentación es correcta en el concepto, pero falta detalle técnico sobre la implementación.

---

## 5. DETECCIÓN DE DEVELOPMENT DESDE HOSTNAME

### Sistema Actual de AppBodas

El sistema detecta el development desde el hostname con lógica compleja:

**Código relevante:**
```typescript
// apps/web/context/AuthContext.tsx:200-214
const path = window.location.hostname
const c = path?.split(".")
const idx = c?.findIndex(el => el === "com" || el === "mx")

const devDomain = ["bodasdehoy", "eventosplanificador", "eventosorganizador", 
                   "vivetuboda", "champagne-events", "annloevents", 
                   "miamorcitocorazon", "eventosintegrados", "ohmaratilano", 
                   "corporativozr", "theweddingplanner"]

// En desarrollo local (localhost), usar bodasdehoy (index 0) para mejor compatibilidad
const domainDevelop = !!idx && idx !== -1 ? c[idx - 1] : devDomain[0]

const subdomainDevelop = idx === -1 && devSubdomain[0]

resp = developments.filter(elem => elem.name === domainDevelop)[0]
resp.subdomain = ["ticket", "testticket", "invitado", "testinvitado", "dev"]
  .includes(c[0]) ? c[0] : subdomainDevelop
```

**Lógica:**
1. Divide el hostname por puntos
2. Busca el índice de "com" o "mx"
3. El development es el elemento **anterior** a "com"/"mx" (ej: `bodasdehoy.com` → `bodasdehoy`)
4. Si no encuentra "com"/"mx" (localhost), usa el primer development de la lista
5. Detecta subdominios funcionales desde el primer elemento del array

### Mi Propuesta (Documentación)

✅ Menciona detección automática de development
❌ **NO explica** la lógica compleja de detección
❌ **NO menciona** el manejo especial de localhost
❌ **NO explica** cómo se separa el subdominio funcional del development

### Impacto

- **Moderado**: La documentación asume que la detección es simple, pero en realidad hay lógica compleja que puede afectar la automatización.

---

## TABLA COMPARATIVA RESUMIDA

| Aspecto | Sistema Actual AppBodas | Mi Propuesta (Documentación) | Diferencia |
|---------|------------------------|------------------------------|------------|
| **Subdominios Funcionales** | ✅ Maneja `ticket`, `invitado`, `dev` con routing especial | ❌ No menciona | **CRÍTICA** |
| **Bypass de Desarrollo** | ✅ Sistema completo de bypass para test | ❌ No menciona | **CRÍTICA** |
| **Manejo de Subdominios Test** | ✅ Mantiene subdominio en redirects, adapta rutas | ⚠️ Menciona pero sin detalles | **IMPORTANTE** |
| **Cookies con Dominio Base** | ✅ Implementado con normalización | ✅ Explicado correctamente | **BAJA** |
| **Detección de Development** | ✅ Lógica compleja desde hostname | ⚠️ Menciona pero simplificado | **MODERADA** |
| **Firebase App Check** | ✅ Configuración especial para test | ❌ No menciona | **MODERADA** |
| **Routing Especial** | ✅ Redirección automática para `ticket` | ❌ No menciona | **CRÍTICA** |

---

## RECOMENDACIONES

### 1. Actualizar Documentación de Automatización

Agregar secciones sobre:
- **Subdominios funcionales** y su routing especial
- **Sistema de bypass** para testing automatizado
- **Manejo de subdominios de test** (redirects, rutas adaptadas)
- **Lógica de detección de development** (más detallada)

### 2. Mejorar Script de Automatización

Incluir:
- Detección de subdominios funcionales y manejo de redirecciones
- Opción para usar bypass en lugar de login completo
- Manejo correcto de rutas adaptadas al subdominio

### 3. Ejemplos Prácticos

Agregar ejemplos de:
- Automatización en `chat-test.bodasdehoy.com` usando bypass
- Manejo de redirección en `ticket.bodasdehoy.com`
- Verificación de sesión compartida considerando subdominios funcionales

---

## CONCLUSIÓN

La propuesta de documentación original era **correcta en el concepto general** (sesión compartida entre subdominios), pero **faltaba información crítica** sobre:

1. **Subdominios funcionales** que tienen routing especial
2. **Sistema de bypass** que es más eficiente para testing
3. **Manejo detallado de subdominios de test** (redirects, rutas)
4. **Login compartido obligatorio** entre subdominios (no opcional)
5. **Registro compartido** entre subdominios
6. **Casos específicos** de compartir entre diferentes dominios/marcas

## ACTUALIZACIÓN COMPLETADA

El plan ha sido **mejorado y actualizado** para reflejar la complejidad real del sistema:

### ✅ Cambios Implementados

1. **Documentación Principal Actualizada** (`apps/copilot/docs/testing/automated-login.md`):
   - ✅ Sección completa sobre login compartido obligatorio entre subdominios
   - ✅ Sección sobre registro compartido entre subdominios
   - ✅ Sección sobre casos específicos entre diferentes dominios/marcas
   - ✅ Sección sobre subdominios funcionales vs técnicos
   - ✅ Sección completa sobre sistema de bypass de desarrollo
   - ✅ Ejemplos prácticos para cada escenario

2. **Script de Automatización Mejorado** (`apps/copilot/scripts/automate-google-login.ts`):
   - ✅ Soporte para bypass de desarrollo
   - ✅ Detección automática de subdominios funcionales
   - ✅ Manejo de redirecciones automáticas
   - ✅ Verificación mejorada de sesión compartida
   - ✅ Soporte para verificar sesión en múltiples subdominios

3. **Ejemplos Prácticos Completos** (`apps/copilot/scripts/example-google-login-automation.mdc`):
   - ✅ Ejemplo de login completo con Google OAuth
   - ✅ Ejemplo de uso de bypass para testing
   - ✅ Ejemplo de login en subdominio funcional
   - ✅ Ejemplo de verificación de sesión compartida
   - ✅ Ejemplo de casos entre diferentes dominios/marcas

### Estado Actual

**La documentación ahora refleja correctamente**:
- ✅ Login compartido obligatorio entre subdominios
- ✅ Registro compartido entre subdominios
- ✅ Subdominios funcionales con routing especial
- ✅ Sistema de bypass para testing eficiente
- ✅ Casos específicos entre diferentes dominios/marcas
- ✅ Complejidad real del sistema multi-marca

**Prioridad de actualización: COMPLETADA** ✅
