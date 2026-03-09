# 🔑 Métodos para Obtener Token de Firebase

**Fecha**: 2026-02-10
**Objetivo**: Validar Memories API con token de autenticación

---

## 📊 Resumen: Dominio Compartido

```
Firebase AUTH_DOMAIN: bodasdehoy-1063.firebaseapp.com
Dominio compartido: *.bodasdehoy.com

✅ appbodasdehoy.com → Comparte sesión
✅ chat-test.bodasdehoy.com → Comparte sesión
✅ app-test.bodasdehoy.com → Comparte sesión
❌ localhost:3210 → NO comparte (dominio diferente)
```

**Por eso trabajas con chat-test y app-test**: Comparten dominio y contraseñas con Firebase

---

## ⭐ Método 1: chat-test.bodasdehoy.com (RECOMENDADO)

### Ventajas
- ✅ Sesión compartida automáticamente
- ✅ Página /get-token funciona
- ✅ Sin scripts manuales
- ✅ Más realista (como producción)

### Requisitos
DNS o /etc/hosts configurado para chat-test.bodasdehoy.com

### Pasos

**1. Configurar DNS local** (si no está configurado):
```bash
sudo nano /etc/hosts

# Agregar esta línea:
127.0.0.1 chat-test.bodasdehoy.com
```

**2. Abrir en navegador**:
```
http://chat-test.bodasdehoy.com:3210/get-token
```

**3. Copiar comando** que aparece en pantalla

**4. Ejecutar en terminal**:
```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com
# Pegar comando copiado
```

---

## 🌐 Método 2: appbodasdehoy.com

### Ventajas
- ✅ Ya está en producción
- ✅ Ya tienes sesión activa
- ✅ No requiere configuración local

### Desventajas
- ⚠️ Requiere DevTools y script manual

### Pasos

**1. Abrir**: https://appbodasdehoy.com

**2. DevTools** (F12) → **Console**

**3. Ejecutar**:
```javascript
firebase.auth().currentUser.getIdToken().then(t => {
  console.log('\n═══════════════════════════════════════');
  console.log('🔑 TOKEN FIREBASE');
  console.log('═══════════════════════════════════════\n');
  console.log(t);
  console.log('\n═══════════════════════════════════════');
  console.log('📋 COMANDO:');
  console.log('═══════════════════════════════════════\n');
  console.log('FIREBASE_TOKEN="' + t + '" node test-memories-api.js');
  console.log('\n═══════════════════════════════════════');
});
```

**4. Copiar** el comando que aparece

**5. Ejecutar** en terminal

---

## 🛠️ Método 3: app-test.bodasdehoy.com

Similar al Método 1, pero usando app-test en lugar de chat-test.

### Configurar
```bash
sudo nano /etc/hosts
# Agregar: 127.0.0.1 app-test.bodasdehoy.com
```

### Usar
```
http://app-test.bodasdehoy.com:3210/get-token
```

---

## 💻 Método 4: Script con Credenciales (Avanzado)

### Ventajas
- ✅ Automatizado
- ✅ Sin navegador

### Desventajas
- ⚠️ Requiere instalar Firebase SDK
- ⚠️ Requiere credenciales de prueba

### Pasos

**1. Instalar Firebase** (si no está):
```bash
npm install firebase
```

**2. Ejecutar script**:
```bash
node generate-firebase-token.js --email tu@email.com --password tupassword
```

**3. Copiar** comando que aparece

**4. Ejecutar** test-memories-api.js

---

## 🎯 Comparación de Métodos

| Método | Dificultad | Tiempo | Recomendado |
|--------|------------|--------|-------------|
| chat-test.bodasdehoy.com | Baja | 1 min | ⭐⭐⭐⭐⭐ |
| appbodasdehoy.com | Media | 2 min | ⭐⭐⭐⭐ |
| app-test.bodasdehoy.com | Baja | 1 min | ⭐⭐⭐⭐ |
| Script con credenciales | Alta | 5 min | ⭐⭐ |

---

## 🚀 Servidor Configurado

El servidor ya está configurado para acceso externo:

```bash
# Escuchando en todas las interfaces
Local:   http://localhost:3210
Network: http://0.0.0.0:3210

# Accesible desde:
✅ http://localhost:3210
✅ http://chat-test.bodasdehoy.com:3210
✅ http://app-test.bodasdehoy.com:3210
✅ http://<tu-ip>:3210
```

---

## ✅ Verificación Rápida

Después de obtener el token:

```bash
# Ejecutar tests
FIREBASE_TOKEN="<token>" node test-memories-api.js

# Resultado esperado:
✓ GET /api/memories/albums - XXXms
✓ POST /api/memories/albums - XXXms
...
✓ Exitosos: 8/8
✗ Fallidos: 0/8
```

---

## 🎓 Por Qué Funciona

### Dominio Compartido
Firebase reconoce todos los subdominios de `bodasdehoy.com` como el mismo dominio para propósitos de autenticación.

```
bodasdehoy.com (dominio raíz)
├─ appbodasdehoy.com
├─ chat-test.bodasdehoy.com
├─ app-test.bodasdehoy.com
└─ iachat.bodasdehoy.com

Todos comparten:
- Cookies de Firebase
- Sesión de autenticación
- Tokens de acceso
```

### Por Qué NO localhost
```
localhost ≠ bodasdehoy.com

Dominio diferente = Sesión separada
```

---

## 📚 Documentación Relacionada

- [ACCESO_CHAT_TEST_TOKEN_COMPARTIDO.md](ACCESO_CHAT_TEST_TOKEN_COMPARTIDO.md) - Guía detallada chat-test
- [SOLUCION_TOKEN_FIREBASE_COMPARTIDO.md](SOLUCION_TOKEN_FIREBASE_COMPARTIDO.md) - Solución general
- [VALIDACION_RAPIDA_TOKEN_COMPARTIDO.md](VALIDACION_RAPIDA_TOKEN_COMPARTIDO.md) - Método rápido
- [generate-firebase-token.js](generate-firebase-token.js) - Script con credenciales

---

## 🎯 Recomendación Final

**Si ya tienes chat-test configurado**: Usa Método 1 ⭐⭐⭐⭐⭐

**Si no**: Usa Método 2 (appbodasdehoy.com) ⭐⭐⭐⭐

**Ambos funcionan perfectamente** porque comparten el dominio `bodasdehoy.com`

---

## 🚀 Próximo Paso

1. **Elegir método** (chat-test o appbodasdehoy.com)
2. **Obtener token** (1-2 minutos)
3. **Ejecutar tests**: `FIREBASE_TOKEN="..." node test-memories-api.js`
4. **Validar resultados**: 8/8 endpoints OK

---

**Estado actual**: ✅ Servidor configurado y listo
**Acceso**: http://chat-test.bodasdehoy.com:3210 o https://appbodasdehoy.com
**Tiempo estimado**: 2 minutos para completar validación
