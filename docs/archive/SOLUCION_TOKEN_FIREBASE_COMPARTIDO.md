# 🔑 Solución: Obtener Token Firebase desde appbodasdehoy.com

**Fecha**: 2026-02-10
**Problema**: Login no funciona en localhost porque Firebase AUTH_DOMAIN está en `bodasdehoy-1063.firebaseapp.com`
**Solución**: Obtener token desde appbodasdehoy.com (donde ya estás logueado)

---

## 🎯 Método Más Fácil: Token desde appbodasdehoy.com

Como el login es compartido entre appbodasdehoy.com y el copilot, puedes obtener el token directamente desde la app principal.

### Paso 1: Abrir appbodasdehoy.com

```
https://appbodasdehoy.com
```

O cualquier variante donde ya estés logueado:
- https://bodasdehoy.com
- https://iachat.bodasdehoy.com

### Paso 2: Abrir DevTools

**Mac**: `Cmd + Option + I`
**Windows/Linux**: `F12`

### Paso 3: Ir a Console

Click en la pestaña "Console"

### Paso 4: Ejecutar este código

```javascript
// Método 1: Si firebase está disponible globalmente
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().currentUser.getIdToken()
    .then(token => {
      console.log('\n═══════════════════════════════════════');
      console.log('🔑 TOKEN FIREBASE');
      console.log('═══════════════════════════════════════\n');
      console.log(token);
      console.log('\n═══════════════════════════════════════');
      console.log('📋 COMANDO PARA COPIAR:');
      console.log('═══════════════════════════════════════\n');
      console.log(`FIREBASE_TOKEN="${token}" node test-memories-api.js`);
      console.log('\n═══════════════════════════════════════');
    });
} else {
  console.log('⚠️ Firebase no encontrado, buscando en otras ubicaciones...');

  // Método 2: Buscar en localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('firebase:authUser:')) {
      const data = localStorage.getItem(key);
      console.log('Datos de Firebase encontrados:', key);
      const parsed = JSON.parse(data);
      if (parsed && parsed.stsTokenManager && parsed.stsTokenManager.accessToken) {
        const token = parsed.stsTokenManager.accessToken;
        console.log('\n═══════════════════════════════════════');
        console.log('🔑 TOKEN FIREBASE (desde localStorage)');
        console.log('═══════════════════════════════════════\n');
        console.log(token);
        console.log('\n═══════════════════════════════════════');
        console.log('📋 COMANDO:');
        console.log('═══════════════════════════════════════\n');
        console.log(`FIREBASE_TOKEN="${token}" node test-memories-api.js`);
        console.log('\n═══════════════════════════════════════');
      }
    }
  }
}
```

### Paso 5: Copiar el Comando

Verás algo como:

```
═══════════════════════════════════════
🔑 TOKEN FIREBASE
═══════════════════════════════════════

eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4YTk1M...
(token muy largo)

═══════════════════════════════════════
📋 COMANDO PARA COPIAR:
═══════════════════════════════════════

FIREBASE_TOKEN="eyJhbGciOiJSUzI1NiI..." node test-memories-api.js

═══════════════════════════════════════
```

**Copiar** todo el comando que empieza con `FIREBASE_TOKEN=`

### Paso 6: Ejecutar en Terminal

Pegar el comando en tu terminal (en la raíz del proyecto):

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
# Pegar el comando copiado
```

---

## 🎯 Alternativa: Script Automático

Si lo anterior no funciona, puedo crear un script que:

1. Use Firebase Admin SDK
2. Genere un custom token para testing
3. Lo use automáticamente en los tests

**¿Quieres que cree este script?**

---

## 🔧 Por Qué No Funciona localhost:3210/get-token

El problema es que:

```
Firebase AUTH_DOMAIN: bodasdehoy-1063.firebaseapp.com
Localhost: http://localhost:3210

❌ Dominios diferentes = Sesión NO compartida
```

**Para que funcione**, necesitarías:
1. Configurar Firebase para permitir localhost
2. O usar el mismo dominio (no es posible con localhost)

**Solución más simple**: Obtener token desde appbodasdehoy.com (donde YA estás logueado)

---

## ✅ Verificación Rápida

Después de obtener el token y ejecutar el comando:

```bash
# Deberías ver:
✓ GET /api/memories/albums - XXXms
✓ POST /api/memories/albums - XXXms
✓ GET /api/memories/albums/{id} - XXXms
...

Resultados:
✓ Exitosos: 8
✗ Fallidos: 0
```

---

## 🚀 Siguiente Paso

1. **Ir a**: https://appbodasdehoy.com
2. **Abrir** DevTools → Console
3. **Ejecutar** el script del Paso 4
4. **Copiar** el comando
5. **Pegar** en terminal
6. **Ver** resultados de validación

---

**¿Necesitas que cree el script automático con Firebase Admin SDK?**

O mejor aún: **¿ya tienes un token de prueba que funcione con el backend?**
