# Resultados de Pruebas - Login y Sincronización con Chat

## Estado de las Pruebas

### ✅ Implementación Completada

1. **Atributos `data-testid` agregados** ✅
   - `data-testid="email-input"` - Campo de email
   - `data-testid="password-input"` - Campo de password
   - `data-testid="login-tabs"` - Contenedor de tabs
   - `data-testid="submit-button"` - Botón de submit
   - Ya existían: `login-modal`, `google-login-button`, `facebook-login-button`

2. **Scripts de prueba creados** ✅
   - `test-login-sync.ts` - Funciones para probar login
   - `verify-chat-login.ts` - Funciones para verificar estado
   - `test-login-flow.mdc` - Ejemplos prácticos

### ⚠️ Limitaciones del Navegador MCP de Cursor

El navegador MCP de Cursor tiene limitaciones conocidas:
- No puede ejecutar scripts JavaScript directamente en el contexto de la página
- No puede acceder a `localStorage` o cookies directamente
- Las pruebas automatizadas completas requieren herramientas adicionales

## Pruebas Realizadas

### Test 1: Navegación y Apertura de Modal ✅

**Resultado:** ✅ EXITOSO
- Navegación a `www.bodasdehoy.com` funciona correctamente
- Clic en botón "Iniciar sesión" abre el modal correctamente
- Modal se muestra con todos los elementos:
  - Botón "Continúa con Google"
  - Botón "Continúa con Facebook"
  - Campos de email y password
  - Botón "Iniciar sesión"

### Test 2: Clic en Botón de Google ✅

**Resultado:** ✅ EXITOSO (hasta popup)
- Clic en botón "Continúa con Google" funciona
- El popup de Google OAuth se abre (requiere interacción manual)
- **Nota:** El popup requiere interacción manual para seleccionar cuenta y autorizar

### Test 3: Llenado de Campos de Email/Password ✅

**Resultado:** ✅ EXITOSO
- Campo de email se llena correctamente
- Campo de password se llena correctamente
- Los campos mantienen los valores ingresados

### Test 4: Clic en Botón de Submit ✅

**Resultado:** ✅ EXITOSO
- Clic en botón "Iniciar sesión" funciona
- El formulario se envía correctamente

## Métodos de Login Disponibles

### 1. Login con Google
- **Email de prueba:** `bodasdehoy.com@gmail.com`
- **Proceso:**
  1. Abrir modal de login
  2. Clic en "Continúa con Google"
  3. Seleccionar cuenta `bodasdehoy.com@gmail.com` (manual)
  4. Autorizar acceso (manual)
  5. Verificar que usuario está logueado en chat

### 2. Login/Registro con Email/Contraseña
- **Email:** `jcc@recargaexpress.com`
- **Proceso:**
  1. Abrir modal de login
  2. Si es nuevo usuario, cambiar a tab "Registrarse"
  3. Llenar email: `jcc@recargaexpress.com`
  4. Llenar password
  5. Clic en "Crear cuenta" o "Iniciar sesión"
  6. Verificar que usuario está logueado en chat

### 3. Bypass de Desarrollo
- **Para entornos de test:** `localhost`, `chat-test.bodasdehoy.com`
- **Proceso:**
  1. Activar bypass en `sessionStorage`:
     ```javascript
     sessionStorage.setItem('dev_bypass', 'true');
     sessionStorage.setItem('dev_bypass_email', 'bodasdehoy.com@gmail.com');
     ```
  2. Recargar la página
  3. Usuario se loguea automáticamente

## Verificación de Sincronización con Chat

Después de hacer login, verificar:

### 1. localStorage
```javascript
// En consola del navegador
const api2Token = localStorage.getItem('api2_jwt_token');
const devUserConfig = localStorage.getItem('dev-user-config');
console.log('Token:', api2Token);
console.log('Config:', JSON.parse(devUserConfig));
```

### 2. Cookies
```javascript
// Verificar cookie dev-user-config
document.cookie.split(';').find(c => c.includes('dev-user-config'));
```

### 3. Store de Zustand (si está disponible)
```javascript
// Si useChatStore está disponible globalmente
const chatStore = window.useChatStore?.getState();
console.log('Current User ID:', chatStore?.currentUserId);
console.log('Development:', chatStore?.development);
```

### 4. UI del Chat
- Verificar que el usuario aparece en la interfaz del chat
- Verificar que no se muestra el prompt de registro
- Verificar que las funciones premium están disponibles

## Sesión Compartida entre Subdominios

### Verificación

1. **Hacer login en un subdominio:**
   - Ejemplo: `www.bodasdehoy.com` o `chat-test.bodasdehoy.com`

2. **Navegar a otro subdominio:**
   - Ejemplo: De `www.bodasdehoy.com` a `chat-test.bodasdehoy.com`

3. **Verificar que la sesión persiste:**
   ```javascript
   // En consola del navegador en el nuevo subdominio
   const devUserConfig = localStorage.getItem('dev-user-config');
   const hasCookie = document.cookie.includes('dev-user-config');
   
   console.log('Sesión compartida:', {
     hasLocalStorage: !!devUserConfig,
     hasCookie: hasCookie,
     userId: devUserConfig ? JSON.parse(devUserConfig).userId : null
   });
   ```

### Resultado Esperado

- ✅ `localStorage.getItem('dev-user-config')` existe en ambos subdominios
- ✅ Cookie `dev-user-config` está presente (dominio `.bodasdehoy.com`)
- ✅ Usuario no requiere re-login
- ✅ Usuario aparece logueado en el chat del subdominio

## Guía de Pruebas Manuales

### Prueba Completa: Login con Google

1. **Abrir navegador** (Chrome, Firefox, etc.)
2. **Navegar a:** `https://www.bodasdehoy.com`
3. **Abrir consola del navegador** (F12)
4. **Abrir modal de login:**
   ```javascript
   window.openLoginModal();
   ```
5. **Hacer clic en "Continúa con Google"**
6. **En el popup de Google:**
   - Seleccionar cuenta `bodasdehoy.com@gmail.com`
   - Autorizar acceso
7. **Después del login, verificar en consola:**
   ```javascript
   const token = localStorage.getItem('api2_jwt_token');
   const config = JSON.parse(localStorage.getItem('dev-user-config'));
   console.log('Login exitoso:', {
     hasToken: !!token,
     userId: config?.userId,
     development: config?.development
   });
   ```
8. **Navegar al chat:**
   - Ir a `https://chat-test.bodasdehoy.com`
   - Verificar que el usuario está logueado automáticamente

### Prueba Completa: Login con Email/Contraseña

1. **Abrir navegador**
2. **Navegar a:** `https://www.bodasdehoy.com`
3. **Abrir modal de login:**
   ```javascript
   window.openLoginModal();
   ```
4. **Si es nuevo usuario:**
   - Cambiar a tab "Registrarse"
   - Llenar email: `jcc@recargaexpress.com`
   - Llenar password
   - Clic en "Crear cuenta"
5. **Si es usuario existente:**
   - Asegurar que está en tab "Iniciar sesión"
   - Llenar email: `jcc@recargaexpress.com`
   - Llenar password
   - Clic en "Iniciar sesión"
6. **Verificar login en consola:**
   ```javascript
   const token = localStorage.getItem('api2_jwt_token');
   const config = JSON.parse(localStorage.getItem('dev-user-config'));
   console.log('Login exitoso:', {
     hasToken: !!token,
     userId: config?.userId
   });
   ```
7. **Navegar al chat y verificar sincronización**

### Prueba: Sesión Compartida

1. **Hacer login** en `www.bodasdehoy.com` (usando cualquiera de los métodos)
2. **Verificar estado en consola:**
   ```javascript
   const config = localStorage.getItem('dev-user-config');
   console.log('Estado antes de navegar:', JSON.parse(config));
   ```
3. **Navegar a:** `https://chat-test.bodasdehoy.com`
4. **Verificar que la sesión persiste:**
   ```javascript
   const config = localStorage.getItem('dev-user-config');
   const hasCookie = document.cookie.includes('dev-user-config');
   console.log('Sesión compartida:', {
     hasLocalStorage: !!config,
     hasCookie: hasCookie,
     userId: config ? JSON.parse(config).userId : null
   });
   ```

## Troubleshooting

### El modal no se abre
- Verificar que `window.openLoginModal` está disponible
- Verificar que la página está completamente cargada
- Intentar hacer clic manualmente en el botón "Iniciar sesión"

### El login no se sincroniza con el chat
- Verificar que `api2_jwt_token` está en localStorage
- Verificar que `dev-user-config` está en localStorage
- Verificar que la cookie `dev-user-config` está presente
- Recargar la página del chat

### La sesión no se comparte entre subdominios
- Verificar que las cookies están configuradas con dominio base (`.bodasdehoy.com`)
- Verificar que estás navegando entre subdominios del mismo dominio base
- Limpiar cookies y localStorage y volver a hacer login

## Próximos Pasos

1. **Probar manualmente** usando la guía de arriba
2. **Usar herramientas de automatización** como Playwright o Puppeteer para pruebas E2E
3. **Verificar en diferentes navegadores** (Chrome, Firefox, Safari)
4. **Probar en diferentes subdominios** para verificar sesión compartida

---

**Fecha:** Enero 2025  
**Estado:** ✅ Implementación completada, pruebas manuales recomendadas debido a limitaciones del navegador MCP de Cursor
