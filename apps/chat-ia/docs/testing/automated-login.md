# Automatización de Login con Google

Esta documentación explica cómo usar las herramientas MCP del navegador de Cursor para automatizar el proceso de login con Google en el modal emergente del proyecto.

## Sistema Multi-Marca (Whitelabel) - Completo

El proyecto soporta múltiples marcas/developments que comparten la misma aplicación pero con diferentes dominios:

### Marcas Disponibles

- **bodasdehoy** - `bodasdehoy.com`, `www.bodasdehoy.com`
- **eventosorganizador** - `eventosorganizador.com`, `www.eventosorganizador.com`
- **champagneevents** - `champagne-events.com.mx`, `www.champagne-events.com.mx`
- **annloevents** - `annloevents.com`, `www.annloevents.com`
- Y otras marcas adicionales...

## Sistema de Login Compartido - Reglas Fundamentales

### 1. Login Compartido Entre Subdominios (OBLIGATORIO)

**Regla Fundamental**: Los subdominios DEBEN compartir un único login. Es un requisito del sistema, no opcional.

#### Cómo Funciona

- **Mismo dominio base = misma sesión**
  - `www.bodasdehoy.com` ↔ `chat-test.bodasdehoy.com` ↔ `ticket.bodasdehoy.com` ↔ `invitado.bodasdehoy.com`
  - Todos comparten la misma cookie: `sessionBodas` con dominio `.bodasdehoy.com`
  - **Si te logueas en uno, estás logueado en todos automáticamente**

#### Implementación Técnica

1. **Cookie con Dominio Base**: Las cookies se establecen con `domain: '.bodasdehoy.com'` (punto inicial para subdominios)
2. **Accesibilidad**: La cookie es accesible en todos los subdominios del mismo dominio base
3. **Sin Re-autenticación**: No requiere re-autenticación al navegar entre subdominios

#### Ejemplo Práctico

```typescript
// 1. Login en cualquier subdominio
await browser_navigate({ url: 'https://www.bodasdehoy.com' });
// ... proceso de login ...

// 2. Navegar a cualquier otro subdominio (SIN re-login)
await browser_navigate({ url: 'https://chat-test.bodasdehoy.com' });
// ✅ Automáticamente autenticado

await browser_navigate({ url: 'https://ticket.bodasdehoy.com' });
// ✅ Automáticamente autenticado

await browser_navigate({ url: 'https://invitado.bodasdehoy.com' });
// ✅ Automáticamente autenticado
```

### 2. Registro Compartido Entre Subdominios

**Regla**: Si te registras en un dominio, ya estás registrado para el resto de subdominios de ese dominio.

#### Cómo Funciona

- **Base de datos unificada**: El usuario se identifica por email, no por dominio específico
- **Sistema de identificación**: `identifyUserByEmail()` busca al usuario por email en el development, independientemente del subdominio
- **Sin re-registro**: Una vez registrado en un subdominio, puedes acceder a todos los demás subdominios del mismo dominio base sin volver a registrarte

#### Ejemplo Práctico

```typescript
// 1. Registro en dominio principal
// Usuario se registra en www.bodasdehoy.com con email user@example.com

// 2. Acceso a subdominio técnico
// Navega a chat-test.bodasdehoy.com
// ✅ Mismo usuario, sin re-registro necesario

// 3. Acceso a subdominio funcional
// Navega a ticket.bodasdehoy.com
// ✅ Mismo usuario, sin re-registro necesario
```

### 3. Casos Específicos: Login Compartido Entre Diferentes Dominios/Marcas

**Regla**: En ciertos casos específicos, si te has registrado en un dominio o subdominio, también se puede compartir con otro dominio (pero serán casos muy específicos).

#### Mecanismo

- **Identificación por email**: El sistema `identifyUserByEmail()` puede identificar al mismo usuario (mismo email) en diferentes developments/marcas
- **Base de datos compartida**: El mismo email puede estar registrado en múltiples marcas
- **Reconocimiento automático**: En casos específicos, el sistema puede reconocer al mismo usuario entre marcas

#### Limitaciones Técnicas

- **Cookies separadas**: Cada marca tiene su propia cookie de sesión:
  - `bodasdehoy` → `sessionBodas` (dominio `.bodasdehoy.com`)
  - `eventosorganizador` → `sessionOrganizador` (dominio `.eventosorganizador.com`)
  - Las cookies **NO se comparten** entre diferentes dominios base

- **Re-autenticación requerida**: Aunque el sistema puede reconocer al mismo usuario, **se requiere re-autenticación** para establecer la cookie de la nueva marca

#### Casos Específicos Posibles

1. **Usuarios multi-marca**: Usuarios que tienen cuenta en múltiples marcas (mismo email)
2. **Identificación automática**: El sistema puede identificar al usuario por email al cambiar de marca
3. **Configuración especial**: Requiere lógica de negocio específica o configuración especial

#### Ejemplo Potencial

```typescript
// 1. Usuario registrado en bodasdehoy.com
// Email: user@example.com
// Cookie: sessionBodas (dominio .bodasdehoy.com)

// 2. Navega a eventosorganizador.com
// El sistema puede identificar al usuario por email
// Pero requiere re-autenticación para establecer sessionOrganizador

// 3. Después de re-autenticación
// Tiene ambas cookies: sessionBodas y sessionOrganizador
// Puede navegar entre ambas marcas sin re-login
```

**Nota**: Este comportamiento depende de la configuración específica y lógica de negocio implementada.

## Descripción General

El script de automatización permite:
- Navegar a la página del proyecto
- Abrir el modal de login automáticamente
- Hacer clic en el botón "Continuar con Google"
- Verificar el estado del login

**Importante**: El popup de Google OAuth requiere interacción manual para completar la autenticación.

## Requisitos Previos

1. **Herramientas MCP del navegador**: Las herramientas MCP de Cursor deben estar configuradas y disponibles
   - Verificar en `~/.cursor/mcp.json`
   - Servidores `cursor-ide-browser` y `cursor-browser-extension` deben estar habilitados

2. **Proyecto en ejecución**: El proyecto debe estar corriendo
   - Desarrollo: `http://localhost:8000`
   - Producción: URL del dominio correspondiente

3. **Atributos de testing**: El modal debe tener los atributos `data-testid` (ya implementados)

## Uso del Script

### Consideraciones Multi-Marca

Al automatizar el login, ten en cuenta:

1. **Detección Automática**: El sistema detecta automáticamente el development desde el hostname/dominio
2. **Cookies Específicas**: Cada marca tiene su propia cookie de sesión (ej: `sessionBodas`, `sessionOrganizador`)
3. **Dominio de Cookie**: Las cookies se establecen con el dominio base para compartir entre subdominios
4. **Navegación Sin Re-login**: Una vez logueado, puedes navegar entre dominios relacionados sin re-autenticarte

### Opción 1: Usar las Herramientas MCP Directamente

Puedes usar las herramientas MCP del navegador directamente desde Cursor:

```typescript
// 1. Navegar a la página
await browser_navigate({ url: 'http://localhost:8000' });

// 2. Esperar a que la página cargue
await browser_wait_for({ time: 2000 });

// 3. Abrir el modal usando la función global
await browser_execute_script({
  script: 'window.openLoginModal && window.openLoginModal();'
});

// 4. Esperar a que el modal sea visible
await browser_wait_for({ text: 'Continuar con Google' });

// 5. Hacer clic en el botón de Google
await browser_click({
  element: 'Botón Continuar con Google',
  ref: '[data-testid="google-login-button"]'
});

// 6. En este punto, se abrirá el popup de Google OAuth
// REQUIERE INTERACCIÓN MANUAL: Seleccionar cuenta y autorizar

// 7. Después de la interacción manual, verificar login
const result = await browser_execute_script({
  script: `
    (() => {
      const token = localStorage.getItem('api2_jwt_token');
      const userConfig = localStorage.getItem('dev-user-config');
      const hostname = window.location.hostname;
      
      // Detectar development desde el dominio
      const detectDevelopment = () => {
        if (hostname.includes('bodasdehoy')) return 'bodasdehoy';
        if (hostname.includes('eventosorganizador')) return 'eventosorganizador';
        if (hostname.includes('champagne')) return 'champagneevents';
        if (hostname.includes('annlo')) return 'annloevents';
        return 'unknown';
      };
      
      const development = detectDevelopment();
      const cookieName = {
        'bodasdehoy': 'sessionBodas',
        'eventosorganizador': 'sessionOrganizador',
        'champagneevents': 'sessionChampagne-events',
        'annloevents': 'sessionAnnloevents'
      }[development] || 'sessionBodas';
      
      // Verificar cookie de sesión
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(cookieName + '='));
      
      return {
        hasToken: !!token,
        hasUserConfig: !!userConfig,
        hasSessionCookie: !!sessionCookie,
        url: window.location.href,
        hostname: hostname,
        development: development,
        cookieName: cookieName,
        userEmail: userConfig 
          ? JSON.parse(userConfig).userId 
          : null
      };
    })()
  `
});

console.log('Estado del login:', result);

// 8. (Opcional) Verificar sesión compartida navegando a otro dominio
// await browser_navigate({ url: 'https://chat-test.bodasdehoy.com' });
// const crossDomainCheck = await browser_execute_script({
//   script: '({ hasToken: !!localStorage.getItem("api2_jwt_token"), cookies: document.cookie })'
// });
// console.log('Sesión compartida:', crossDomainCheck);
```

### Opción 2: Usar el Script Helper

Importar y usar el script helper:

```typescript
import { automateGoogleLoginHelper } from './scripts/automate-google-login';

await automateGoogleLoginHelper('http://localhost:8000', {
  timeout: 30000,
  waitForManualInteraction: true
});
```

## Limitaciones Importantes

### 1. Popup de Google OAuth

**Limitación**: El popup de Google OAuth **requiere interacción manual** para:
- Seleccionar la cuenta de Google
- Autorizar el acceso a la aplicación
- Completar cualquier verificación de seguridad (2FA, captcha, etc.)

**Razón**: Google implementa medidas de seguridad que detectan y bloquean la automatización completa del proceso OAuth.

**Solución**: El script automatiza hasta el punto de abrir el popup. Después de hacer clic en el botón, debes:
1. Completar manualmente el proceso en el popup de Google
2. Esperar a que el popup se cierre
3. Verificar que el login fue exitoso

### 2. Detección de Automatización

**Limitación**: Google puede detectar automatización y requerir:
- Verificación CAPTCHA
- Verificación de dos factores (2FA)
- Confirmación adicional de seguridad

**Solución**: 
- Usar el navegador en modo no-headless cuando sea posible
- No automatizar demasiadas veces en corto tiempo
- Considerar usar credenciales de testing si están disponibles

### 3. Cookies y Sesiones

**Limitación**: El navegador MCP puede no mantener cookies/sesiones entre ejecuciones del script.

**Solución**: 
- Asegurarse de que el navegador mantenga el estado entre llamadas
- Verificar que las cookies se están guardando correctamente
- Considerar usar modo persistente del navegador si está disponible

### 4. Redirects vs Popups

**Limitación**: El flujo de autenticación puede usar popup o redirect dependiendo de la configuración de Firebase.

**Solución**: 
- Si usa popup: El script funciona como se describe
- Si usa redirect: El script debe esperar a que la página redirija y verificar la URL de retorno

## Atributos de Testing

El modal y los botones tienen atributos `data-testid` para facilitar la automatización:

- **Modal**: `data-testid="login-modal"`
- **Botón Google**: `data-testid="google-login-button"`
- **Botón Facebook**: `data-testid="facebook-login-button"`

### Función Global

Se expone una función global `window.openLoginModal()` que puede ser llamada desde la consola del navegador o desde scripts:

```javascript
// Abrir modal desde consola
window.openLoginModal();

// Abrir modal con razón específica
window.openLoginModal('premium_feature');
```

## Flujo Completo de Autenticación

1. **Usuario navega** → Página carga
2. **Modal se abre** → Automatizado o manual
3. **Usuario hace clic en "Continuar con Google"** → Automatizado
4. **Firebase abre popup/redirect de Google** → Automatizado (apertura)
5. **Usuario selecciona cuenta y autoriza** → **MANUAL** ⚠️
6. **Firebase retorna token** → Automatizado (verificación)
7. **Token se intercambia por JWT de API2** → Automatizado
8. **Sesión se guarda en localStorage/cookies** → Automatizado
9. **Modal se cierra y página se recarga** → Automatizado

## Verificación de Login Exitoso

Después de completar la interacción manual, puedes verificar que el login fue exitoso. La verificación incluye:

1. **Token JWT**: Verificar que `api2_jwt_token` está en localStorage
2. **Configuración de Usuario**: Verificar que `dev-user-config` está en localStorage
3. **Cookie de Sesión**: Verificar que la cookie específica del development está presente
4. **Sesión Compartida**: (Opcional) Verificar que la sesión persiste en otros dominios relacionados

```typescript
const verification = await browser_execute_script({
  script: `
    (() => {
      const token = localStorage.getItem('api2_jwt_token');
      const userConfig = localStorage.getItem('dev-user-config');
      const hostname = window.location.hostname;
      
      // Detectar development y cookie correspondiente
      const detectDevelopment = () => {
        if (hostname.includes('bodasdehoy')) return { dev: 'bodasdehoy', cookie: 'sessionBodas' };
        if (hostname.includes('eventosorganizador')) return { dev: 'eventosorganizador', cookie: 'sessionOrganizador' };
        if (hostname.includes('champagne')) return { dev: 'champagneevents', cookie: 'sessionChampagne-events' };
        if (hostname.includes('annlo')) return { dev: 'annloevents', cookie: 'sessionAnnloevents' };
        return { dev: 'unknown', cookie: 'sessionBodas' };
      };
      
      const { dev, cookie } = detectDevelopment();
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(cookie + '='));
      
      return {
        hasToken: !!token,
        hasUserConfig: !!userConfig,
        hasSessionCookie: !!sessionCookie,
        token: token,
        userConfig: userConfig ? JSON.parse(userConfig) : null,
        development: dev,
        cookieName: cookie,
        url: window.location.href,
        hostname: hostname
      };
    })()
  `
});

if (verification.hasToken && verification.hasUserConfig && verification.hasSessionCookie) {
  console.log('✅ Login exitoso');
  console.log('Usuario:', verification.userConfig.userId);
  console.log('Development:', verification.development);
  console.log('Cookie de sesión:', verification.cookieName, '-', verification.hasSessionCookie ? 'Presente' : 'No encontrada');
  console.log('URL:', verification.url);
  
  // Verificar sesión compartida (opcional)
  console.log('🌐 La sesión está disponible en todos los subdominios de', verification.hostname.split('.').slice(-2).join('.'));
} else {
  console.warn('⚠️ Login puede no haberse completado');
  console.warn('Token:', verification.hasToken);
  console.warn('User Config:', verification.hasUserConfig);
  console.warn('Session Cookie:', verification.hasSessionCookie);
}
```

## Subdominios: Funcionales vs Técnicos

El sistema distingue entre **subdominios funcionales** (parte del negocio) y **subdominios técnicos** (infraestructura).

### Subdominios Funcionales (Parte del Negocio)

Estos subdominios tienen propósitos específicos del negocio y routing especial:

#### `ticket` / `testticket`
- **Propósito**: Gestión de entradas/tickets para eventos
- **Routing especial**: Redirige automáticamente a `/RelacionesPublicas` cuando se accede a la raíz
- **Ejemplo**: `ticket.bodasdehoy.com` → redirige a `ticket.bodasdehoy.com/RelacionesPublicas`
- **Importante para automatización**: Si automatizas login en este subdominio, debes considerar la redirección automática

#### `invitado` / `testinvitado`
- **Propósito**: Gestión de invitados y listas de invitados
- **Routing especial**: Tiene su propia lógica de routing
- **Ejemplo**: `invitado.bodasdehoy.com`

#### `dev`
- **Propósito**: Desarrollo y testing
- **Routing especial**: Configuración específica para desarrollo

**Características comunes de subdominios funcionales:**
- ✅ Comparten la misma sesión (misma cookie de dominio base)
- ✅ Si te registras en uno, estás registrado en todos
- ⚠️ Tienen routing especial que puede afectar la automatización
- ⚠️ Pueden tener redirecciones automáticas

### Subdominios Técnicos (Infraestructura)

Estos subdominios son para propósitos técnicos/infraestructura:

#### `chat-test`
- **Propósito**: Entorno de testing del chat
- **Características**: Soporta bypass de desarrollo

#### `test.`
- **Propósito**: Entorno de testing general
- **Características**: Soporta bypass de desarrollo

#### `staging.`
- **Propósito**: Entorno de staging
- **Características**: Similar a producción pero para pruebas

**Características comunes de subdominios técnicos:**
- ✅ Comparten la misma sesión (misma cookie de dominio base)
- ✅ Si te registras en uno, estás registrado en todos
- ✅ Algunos soportan bypass de desarrollo para testing

## Sistema de Bypass de Desarrollo

**Característica crítica para testing automatizado**: El sistema incluye un bypass que permite acceso sin autenticación completa con Google OAuth.

### Cómo Funciona

El bypass permite cargar un usuario de desarrollo directamente sin pasar por el flujo completo de Google OAuth.

#### Activación

```typescript
// Activar bypass desde la consola del navegador o script
sessionStorage.setItem('dev_bypass', 'true');

// Opcional: Especificar email personalizado
sessionStorage.setItem('dev_bypass_email', 'tu-email@example.com');
```

#### Entornos Soportados

El bypass solo funciona en:
- `localhost` / `127.0.0.1`
- `chat-test.bodasdehoy.com` (y otros subdominios de test)
- `test.*` (cualquier subdominio que empiece con `test.`)

#### UID Conocido

Por defecto, el bypass usa un UID conocido:
- **UID**: `'upSETrmXc7ZnsIhrjDjbHd7u2up1'`
- **Email**: `bodasdehoy.com@gmail.com`

#### Ventajas para Automatización

1. **Más rápido**: No requiere interacción manual con popup de Google
2. **Más confiable**: No depende de la disponibilidad de Google OAuth
3. **Ideal para testing**: Permite testing automatizado sin intervención humana

#### Ejemplo de Uso en Automatización

```typescript
// Opción 1: Activar bypass antes de navegar
await browser_execute_script({
  script: `
    sessionStorage.setItem('dev_bypass', 'true');
    sessionStorage.setItem('dev_bypass_email', 'test@example.com');
  `
});

await browser_navigate({ url: 'https://chat-test.bodasdehoy.com' });
await browser_wait_for({ time: 3000 });

// El bypass se activa automáticamente y carga el usuario
// No requiere login con Google

// Verificar que el bypass funcionó
const bypassCheck = await browser_execute_script({
  script: `
    ({
      bypassActive: sessionStorage.getItem('dev_bypass') === 'true',
      hasUser: !!localStorage.getItem('dev-user-config'),
      userEmail: localStorage.getItem('dev-user-config') 
        ? JSON.parse(localStorage.getItem('dev-user-config')).userId 
        : null
    })
  `
});
```

#### Limitaciones

- ⚠️ Solo funciona en entornos de test/desarrollo
- ⚠️ No funciona en producción
- ⚠️ Requiere que el usuario exista en la base de datos
- ⚠️ No establece cookie de sesión real (usa datos de desarrollo)

## Sesión Compartida Entre Subdominios - Guía Detallada

### Cómo Funciona la Sesión Compartida

El sistema utiliza cookies con dominio base para permitir que la sesión persista entre subdominios:

1. **Establecimiento de Cookie**: Cuando te logueas en `www.bodasdehoy.com`, la cookie se establece con `domain: '.bodasdehoy.com'`
2. **Disponibilidad**: Esta cookie es accesible en todos los subdominios:
   - `www.bodasdehoy.com` ✅
   - `chat-test.bodasdehoy.com` ✅
   - `ticket.bodasdehoy.com` ✅
   - `invitado.bodasdehoy.com` ✅
   - `api.bodasdehoy.com` ✅
   - Cualquier otro subdominio de `bodasdehoy.com` ✅

3. **Persistencia**: Al navegar entre estos subdominios, no necesitas volver a loguearte
4. **Registro compartido**: Si te registras en un subdominio, ya estás registrado en todos los demás

### Verificar Sesión Compartida con Automatización

```typescript
// Paso 1: Login en dominio principal
await browser_navigate({ url: 'https://www.bodasdehoy.com' });
await browser_wait_for({ time: 2000 });

await browser_execute_script({
  script: 'window.openLoginModal && window.openLoginModal();'
});

await browser_wait_for({ text: 'Continuar con Google' });

await browser_click({
  element: 'Botón Continuar con Google',
  ref: '[data-testid="google-login-button"]'
});

// Esperar interacción manual...

// Paso 2: Verificar login en dominio principal
const loginCheck1 = await browser_execute_script({
  script: `
    ({
      hasToken: !!localStorage.getItem('api2_jwt_token'),
      hasSessionCookie: document.cookie.includes('sessionBodas='),
      domain: window.location.hostname
    })
  `
});

console.log('Login en dominio principal:', loginCheck1);

// Paso 3: Navegar a subdominio relacionado
await browser_navigate({ url: 'https://chat-test.bodasdehoy.com' });
await browser_wait_for({ time: 2000 });

// Paso 4: Verificar que la sesión persiste
const loginCheck2 = await browser_execute_script({
  script: `
    ({
      hasToken: !!localStorage.getItem('api2_jwt_token'),
      hasSessionCookie: document.cookie.includes('sessionBodas='),
      domain: window.location.hostname,
      // Verificar que la cookie está disponible
      cookieValue: document.cookie
        .split('; ')
        .find(row => row.startsWith('sessionBodas='))
        ?.split('=')[1] || null
    })
  `
});

console.log('Sesión en subdominio:', loginCheck2);

if (loginCheck2.hasToken && loginCheck2.hasSessionCookie) {
  console.log('✅ Sesión compartida verificada correctamente');
  console.log('🌐 Puedes navegar entre dominios sin re-login');
} else {
  console.warn('⚠️ La sesión no se compartió correctamente');
}
```

### Marcas y Sus Dominios

Cada marca tiene su propio dominio base y cookie de sesión:

| Marca | Dominio Base | Cookie de Sesión | Subdominios Funcionales |
|-------|--------------|------------------|-------------------------|
| bodasdehoy | `.bodasdehoy.com` | `sessionBodas` | `ticket`, `invitado`, `dev` |
| eventosorganizador | `.eventosorganizador.com` | `sessionOrganizador` | `ticket`, `invitado`, `dev` |
| champagneevents | `.champagne-events.com.mx` | `sessionChampagne-events` | `ticket`, `invitado`, `dev` |
| annloevents | `.annloevents.com` | `sessionAnnloevents` | `ticket`, `invitado`, `dev` |

### Reglas de Compartición de Sesión

#### Dentro del Mismo Dominio Base (OBLIGATORIO)

✅ **Sesión compartida automática** entre todos los subdominios:
- `www.bodasdehoy.com` → `chat-test.bodasdehoy.com` ✅
- `www.bodasdehoy.com` → `ticket.bodasdehoy.com` ✅
- `www.bodasdehoy.com` → `invitado.bodasdehoy.com` ✅
- Cualquier combinación de subdominios del mismo dominio base ✅

#### Entre Diferentes Dominios Base (Casos Específicos)

⚠️ **Re-autenticación requerida**, pero el sistema puede reconocer al mismo usuario:
- `www.bodasdehoy.com` → `www.eventosorganizador.com` ⚠️
  - El sistema puede identificar al usuario por email
  - Pero requiere re-autenticación para establecer la cookie de la nueva marca
  - Después de re-autenticación, puede tener sesión en ambas marcas

**Ejemplo de caso específico:**
```typescript
// 1. Usuario logueado en bodasdehoy.com
// Email: user@example.com
// Cookie: sessionBodas

// 2. Navega a eventosorganizador.com
// El sistema identifica al usuario por email
// Pero requiere re-autenticación para establecer sessionOrganizador

// 3. Después de re-autenticación
// Tiene ambas cookies: sessionBodas y sessionOrganizador
// Puede navegar entre ambas marcas sin re-login
```

### Casos Específicos: Compartir Login Entre Diferentes Dominios/Marcas

**Regla**: En ciertos casos específicos, si te has registrado en un dominio o subdominio, también se puede compartir con otro dominio (pero serán casos muy específicos).

#### Mecanismo Técnico

El sistema utiliza `identifyUserByEmail()` para identificar usuarios por email en diferentes developments:

1. **Identificación por email**: El mismo email puede estar registrado en múltiples marcas
2. **Reconocimiento automático**: El sistema puede reconocer al mismo usuario al cambiar de marca
3. **Re-autenticación requerida**: Aunque se reconoce al usuario, se requiere re-autenticación para establecer la cookie de la nueva marca

#### Limitaciones Técnicas

- **Cookies separadas**: Cada marca tiene su propia cookie de sesión con su propio dominio base
- **No hay compartición automática de cookies**: Las cookies NO se comparten entre diferentes dominios base
- **Re-autenticación necesaria**: Para tener sesión en múltiples marcas, debes autenticarte en cada una

#### Casos Específicos Posibles

1. **Usuarios multi-marca**: 
   - Usuario con cuenta en `bodasdehoy.com` y `eventosorganizador.com` (mismo email)
   - Al cambiar de marca, el sistema puede identificar al usuario
   - Requiere re-autenticación para establecer la cookie de la nueva marca

2. **Identificación automática**:
   - El sistema `identifyUserByEmail()` busca al usuario en el development correspondiente
   - Si el usuario existe, puede ser reconocido automáticamente
   - Facilita el proceso de re-autenticación

3. **Configuración especial**:
   - Puede requerir lógica de negocio específica
   - Puede requerir configuración especial en el backend
   - Depende de cómo esté implementado el sistema de identificación

#### Ejemplo de Automatización para Casos Entre Dominios

```typescript
// Escenario: Usuario con cuenta en múltiples marcas

// 1. Login en primera marca (bodasdehoy)
await browser_navigate({ url: 'https://www.bodasdehoy.com' });
// ... proceso de login ...
// Cookie establecida: sessionBodas (dominio .bodasdehoy.com)

// 2. Verificar login en primera marca
const check1 = await browser_execute_script({
  script: `
    ({
      hasSessionBodas: document.cookie.includes('sessionBodas='),
      userEmail: localStorage.getItem('dev-user-config') 
        ? JSON.parse(localStorage.getItem('dev-user-config')).userId 
        : null
    })
  `
});

// 3. Navegar a segunda marca (eventosorganizador)
await browser_navigate({ url: 'https://www.eventosorganizador.com' });

// 4. El sistema puede identificar al usuario por email
// Pero requiere re-autenticación para establecer sessionOrganizador

// 5. Re-autenticación en segunda marca
await browser_execute_script({
  script: 'window.openLoginModal && window.openLoginModal();'
});
// ... proceso de login ...

// 6. Después de re-autenticación, verificar ambas cookies
const check2 = await browser_execute_script({
  script: `
    ({
      hasSessionBodas: document.cookie.includes('sessionBodas='),
      hasSessionOrganizador: document.cookie.includes('sessionOrganizador='),
      userEmail: localStorage.getItem('dev-user-config') 
        ? JSON.parse(localStorage.getItem('dev-user-config')).userId 
        : null
    })
  `
});

// 7. Ahora puede navegar entre ambas marcas sin re-login
// (siempre que ambas cookies estén presentes)
```

**Nota importante**: Este comportamiento depende de la configuración específica y lógica de negocio implementada. No todos los casos entre dominios diferentes funcionan de la misma manera.

## Consideraciones para Automatización

### Manejo de Subdominios Funcionales

Al automatizar login en subdominios funcionales, considera:

1. **Redirecciones automáticas**: 
   - `ticket.bodasdehoy.com` redirige automáticamente a `/RelacionesPublicas`
   - Espera a que la redirección se complete antes de intentar hacer login

2. **Routing especial**:
   - Los subdominios funcionales pueden tener rutas diferentes
   - Verifica la URL final después de la navegación

3. **Ejemplo de automatización en subdominio funcional**:

```typescript
// Navegar a subdominio funcional
await browser_navigate({ url: 'https://ticket.bodasdehoy.com' });

// Esperar a que se complete la redirección automática
await browser_wait_for({ time: 2000 });

// Verificar que estamos en la ruta correcta
const currentUrl = await browser_execute_script({
  script: 'window.location.href'
});

console.log('URL después de redirección:', currentUrl);
// Puede ser: https://ticket.bodasdehoy.com/RelacionesPublicas

// Ahora proceder con el login normalmente
await browser_execute_script({
  script: 'window.openLoginModal && window.openLoginModal();'
});
```

### Uso del Bypass para Testing Automatizado

Para testing automatizado, el bypass es más eficiente que el login completo:

```typescript
// Configuración para usar bypass
const useBypass = true; // Cambiar a false para login completo

if (useBypass) {
  // Activar bypass antes de navegar
  await browser_execute_script({
    script: `
      sessionStorage.setItem('dev_bypass', 'true');
      sessionStorage.setItem('dev_bypass_email', 'test@example.com');
    `
  });
  
  // Navegar a subdominio de test
  await browser_navigate({ url: 'https://chat-test.bodasdehoy.com' });
  
  // Esperar a que el bypass cargue el usuario
  await browser_wait_for({ time: 3000 });
  
  // Verificar que el bypass funcionó
  const bypassResult = await browser_execute_script({
    script: `
      ({
        bypassActive: sessionStorage.getItem('dev_bypass') === 'true',
        hasUser: !!localStorage.getItem('dev-user-config'),
        userEmail: localStorage.getItem('dev-user-config') 
          ? JSON.parse(localStorage.getItem('dev-user-config')).userId 
          : null
      })
    `
  });
  
  if (bypassResult.hasUser) {
    console.log('✅ Bypass exitoso, usuario cargado:', bypassResult.userEmail);
  }
} else {
  // Usar login completo con Google OAuth
  // ... proceso de login normal ...
}
```

## Soluciones Alternativas

### 1. Modo Testing con Credenciales Directas

Para testing completo sin interacción manual, considera crear un endpoint de testing que acepte un token de Google directamente:

```typescript
// Endpoint de testing (solo en desarrollo)
POST /api/auth/test-login-with-google-token
Body: { token: string }
```

### 2. Mock de Autenticación

En desarrollo, puedes crear un modo de mock que permita login sin OAuth real:

```typescript
// En desarrollo, permitir login mock
if (process.env.NODE_ENV === 'development' && process.env.ENABLE_MOCK_AUTH) {
  // Login sin OAuth
}
```

### 3. Scripts de E2E Testing

Para testing end-to-end completo, considera usar herramientas más robustas:
- **Playwright**: Con modo no-headless para interacción manual cuando sea necesario
- **Selenium**: Con soporte para manejo de popups
- **Cypress**: Con plugins para OAuth

## Troubleshooting

### El modal no se abre

- Verificar que `window.openLoginModal` está disponible
- Verificar que el componente `LoginModal` está montado
- Verificar que `LoginModalContext` está configurado correctamente

### El botón no se encuentra

- Verificar que el modal está visible
- Verificar que el selector `[data-testid="google-login-button"]` es correcto
- Esperar más tiempo antes de hacer clic

### El popup de Google no se abre

- Verificar que los popups no están bloqueados en el navegador
- Verificar la configuración de Firebase Auth
- Verificar que el dominio está autorizado en Firebase Console

### El login no se completa

- Verificar que completaste la interacción manual en el popup
- Verificar que no hay errores en la consola del navegador
- Verificar que el token se está guardando en localStorage

## Referencias

- [Componente LoginModal](../../src/components/LoginModal/index.tsx)
- [Servicio Firebase Auth](../../src/services/firebase-auth/index.ts)
- [Script de Automatización](../../scripts/automate-google-login.ts)
- [Documentación de Firebase Auth](https://firebase.google.com/docs/auth)
