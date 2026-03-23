# ⚡ Validación Rápida - Token Compartido

**Fecha**: 2026-02-10
**Ventaja**: Sistema de login compartido entre AppBodasdehoy y Chat

---

## 🎯 Método Simplificado (2 minutos)

Como el sistema de login de AppBodasdehoy es compartido con el chat, puedes obtener el token desde donde ya estás logueado.

### Opción 1: Desde appbodasdehoy.com (MÁS FÁCIL) ⭐

**Por qué este método**: Firebase AUTH_DOMAIN está en `bodasdehoy-1063.firebaseapp.com`, entonces localhost:3210 NO comparte la sesión. Pero appbodasdehoy.com SÍ tiene la sesión.

1. **Abrir**: https://appbodasdehoy.com (o https://bodasdehoy.com)

2. **DevTools** (F12) → **Console**

3. **Ejecutar** este código:
   ```javascript
   firebase.auth().currentUser.getIdToken().then(t => {
     console.log('FIREBASE_TOKEN="' + t + '" node test-memories-api.js');
   });
   ```

4. **Copiar** el comando que aparece

5. **Pegar en terminal** y ejecutar

**Listo** - Los tests se ejecutarán con tu token real.

---

### Opción 2: Consola del Navegador (30 segundos)

Si prefieres hacerlo manualmente:

1. **Abrir**: http://localhost:3210

2. **DevTools** (F12 o Cmd+Option+I) → **Console**

3. **Ejecutar**:
   ```javascript
   firebase.auth().currentUser.getIdToken().then(t => console.log('FIREBASE_TOKEN="' + t + '" node test-memories-api.js'))
   ```

4. **Copiar** el comando completo que aparece

5. **Pegar en terminal** y ejecutar

---

## 📊 Resultado Esperado

```bash
===========================================
  Validación Memories API
  Backend: https://api-ia.bodasdehoy.com
===========================================

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

===========================================
  Resultados
===========================================
✓ Exitosos: 8
✗ Fallidos: 0

Performance:
  Promedio: 328.6ms
  Más rápido: 198ms
  Más lento: 541ms

✓ Performance objetivo alcanzado (<500ms)

===========================================
```

---

## 🎊 Si Todo Sale Bien

**Siguiente paso**: Reportar al backend

```
¡Validación exitosa! 🎉

Métricas confirmadas:
- 8/8 endpoints funcionando
- Promedio: XXX ms
- Performance excelente (bajo objetivo de 500ms)

Sistema validado y listo para uso en producción.
Excelente trabajo equipo backend!
```

---

## 🐛 Si Hay Errores

### Error: "firebase is not defined"

**Solución**:
- Asegúrate de estar en http://localhost:3210 (no /get-token)
- Espera unos segundos a que Firebase cargue
- Vuelve a ejecutar el comando

### Error: "Cannot read property 'currentUser' of undefined"

**Solución**:
- Refresca la página
- Asegúrate de estar logueado
- Intenta desde la página principal primero

### Error: "401 Unauthorized" en tests

**Solución**:
- El token expiró (válido 1 hora)
- Obtén un nuevo token
- Vuelve a ejecutar los tests

---

## 📁 Archivos Relacionados

- [test-memories-api.js](test-memories-api.js) - Script de validación
- [RESULTADOS_VALIDACION_PARCIAL_2026-02-10.md](RESULTADOS_VALIDACION_PARCIAL_2026-02-10.md) - Resultados actuales
- [SIGUIENTE_PASO_VALIDACION_2026-02-10.md](SIGUIENTE_PASO_VALIDACION_2026-02-10.md) - Plan completo

---

## ⚡ TL;DR

```bash
# Paso 1: Obtener comando con token
# Ir a: http://localhost:3210/get-token
# Click: "Copiar Comando"

# Paso 2: Ejecutar en terminal
# (pegar el comando copiado)

# Paso 3: Ver resultados
# Esperado: 8/8 tests exitosos
```

---

**Ventaja del sistema compartido**: No necesitas hacer login adicional, el token ya está disponible.

**Creado**: 2026-02-10
**Tiempo total**: 2 minutos
