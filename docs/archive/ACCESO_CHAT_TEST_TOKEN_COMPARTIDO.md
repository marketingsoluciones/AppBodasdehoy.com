# ✅ Solución: Acceso desde chat-test.bodasdehoy.com

**Fecha**: 2026-02-10
**Ventaja**: chat-test.bodasdehoy.com **SÍ comparte sesión** con appbodasdehoy.com

---

## 🎯 Por Qué Funciona

```
Firebase AUTH_DOMAIN: bodasdehoy-1063.firebaseapp.com
Dominio compartido: bodasdehoy.com

✅ chat-test.bodasdehoy.com → Comparte sesión
✅ app-test.bodasdehoy.com → Comparte sesión
✅ appbodasdehoy.com → Comparte sesión
❌ localhost:3210 → NO comparte (dominio diferente)
```

**Solución**: Acceder al copilot desde **chat-test.bodasdehoy.com** en lugar de localhost

---

## 🚀 Pasos para Obtener Token

### Método 1: Desde chat-test (MÁS FÁCIL) ⭐

**Si chat-test.bodasdehoy.com está configurado para apuntar a tu máquina local:**

1. **Abrir**: http://chat-test.bodasdehoy.com:3210/get-token

   O si usa puerto 80/443:
   http://chat-test.bodasdehoy.com/get-token

2. **Esperar** que cargue (automáticamente detecta sesión compartida)

3. **Click** "📋 Copiar Comando"

4. **Ejecutar** en terminal

**Listo** ✅ - La sesión de Firebase es compartida entre todos los subdominios de bodasdehoy.com

---

### Método 2: Desde appbodasdehoy.com (Alternativa)

Si chat-test no está configurado, obtener token desde donde ya estás logueado:

1. **Abrir**: https://appbodasdehoy.com

2. **DevTools** (F12) → **Console**

3. **Ejecutar**:
   ```javascript
   firebase.auth().currentUser.getIdToken().then(t => {
     console.log('FIREBASE_TOKEN="' + t + '" node test-memories-api.js');
   });
   ```

4. **Copiar** el comando completo

5. **Ejecutar** en terminal

---

## 🔧 Configuración del Servidor

El servidor ahora está configurado para escuchar en **todas las interfaces**:

```bash
# Antes
next dev -H localhost -p 3210  # Solo localhost

# Ahora
next dev -H 0.0.0.0 -p 3210    # Todas las interfaces
```

Esto permite acceso desde:
- ✅ http://localhost:3210
- ✅ http://127.0.0.1:3210
- ✅ http://chat-test.bodasdehoy.com:3210 (si DNS apunta aquí)
- ✅ http://<tu-ip-local>:3210

---

## 🌐 Verificar DNS de chat-test

Para que chat-test.bodasdehoy.com funcione, debe estar configurado en:

### Opción A: /etc/hosts (local)

```bash
# Editar /etc/hosts
sudo nano /etc/hosts

# Agregar:
127.0.0.1 chat-test.bodasdehoy.com
```

### Opción B: DNS Real

Si chat-test.bodasdehoy.com ya apunta a tu servidor/máquina en DNS, funcionará directamente.

---

## ✅ Ventajas de Este Método

1. **Sesión Compartida**: Firebase reconoce el dominio bodasdehoy.com
2. **Sin Scripts Manuales**: /get-token funciona automáticamente
3. **Login Único**: Una sola sesión para toda la familia de apps
4. **Más Realista**: Testing en condiciones similares a producción

---

## 🎯 Próximos Pasos

### Si chat-test Está Configurado:

1. **Ir a**: http://chat-test.bodasdehoy.com:3210/get-token
2. **Copiar** comando con token
3. **Ejecutar** test-memories-api.js

### Si chat-test NO Está Configurado:

1. **Ir a**: https://appbodasdehoy.com
2. **DevTools** → Console → Ejecutar script
3. **Copiar** comando con token
4. **Ejecutar** test-memories-api.js

---

## 📊 Resultado Esperado

```bash
═══════════════════════════════════════
  Validación Memories API
  Backend: https://api-ia.bodasdehoy.com
═══════════════════════════════════════

[P0] Endpoints Críticos

✓ GET /api/memories/albums - 541ms
✓ GET /api/memories/albums/{id} - 289ms
✓ GET /api/memories/albums/{id}/media - 412ms
✓ GET /api/memories/albums/{id}/members - 198ms

[P1] Endpoints Altos

✓ POST /api/memories/albums - 387ms
✓ PUT /api/memories/albums/{id} - 301ms
✓ POST /api/memories/albums/{id}/members - 267ms
✓ POST /api/memories/albums/{id}/share-link - 234ms

═══════════════════════════════════════
  Resultados
═══════════════════════════════════════
✓ Exitosos: 8
✗ Fallidos: 0

Performance:
  Promedio: 328.6ms
  Más rápido: 198ms
  Más lento: 541ms

✓ Performance objetivo alcanzado (<500ms)
═══════════════════════════════════════
```

---

## 🐛 Troubleshooting

### Error: "chat-test.bodasdehoy.com no resuelve"

**Solución**: Agregar a /etc/hosts:
```bash
sudo nano /etc/hosts
# Agregar: 127.0.0.1 chat-test.bodasdehoy.com
```

### Error: "Conexión rechazada"

**Verificar servidor está escuchando**:
```bash
lsof -i :3210
# Debe mostrar: node (escuchando en 0.0.0.0:3210)
```

### Error: "Firebase no detecta sesión"

**Causa**: Cookies no se comparten entre subdominios

**Solución**:
1. Hacer login en chat-test.bodasdehoy.com primero
2. O usar el método alternativo desde appbodasdehoy.com

---

## 🎊 Conclusión

**Mejor método**: Acceder desde **chat-test.bodasdehoy.com**

**Por qué**:
- ✅ Sesión compartida con Firebase
- ✅ /get-token funciona automáticamente
- ✅ Testing más realista
- ✅ Sin scripts manuales

**Alternativa**: Si chat-test no está configurado, usar appbodasdehoy.com + DevTools Console

---

**Servidor actualizado**: Escuchando en 0.0.0.0:3210
**Estado**: ✅ Listo para acceso desde chat-test
**Próxima acción**: Ir a chat-test.bodasdehoy.com:3210/get-token
