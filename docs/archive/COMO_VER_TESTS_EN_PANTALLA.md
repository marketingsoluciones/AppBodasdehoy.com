# 🖥️ Cómo Ver los Tests en Pantalla y Verlos Correr

**Fecha**: 2026-01-25  
**Problema**: No se ven avances ni carga la web

---

## 🚀 Forma Rápida de Abrir el TestSuite

### Opción 1: Script Automático (Recomendado)

```bash
# Desde la raíz del proyecto
./scripts/abrir-testsuite.sh
```

Este script:
- ✅ Detecta automáticamente la URL correcta
- ✅ Verifica conectividad
- ✅ Abre el navegador automáticamente
- ✅ Muestra información útil

### Opción 2: Abrir Manualmente

**URL del TestSuite**:
```
https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
```

O si estás en local:
```
http://localhost:3210/bodasdehoy/admin/tests
```

---

## ✅ Mejoras Visuales Implementadas

### 1. Indicador de Carga Inicial
Cuando la página carga por primera vez, ahora verás:
- 🔄 Spinner animado
- Mensaje: "Cargando tests..."
- Mensaje: "Conectando con el backend..."

### 2. Indicador de Progreso al Ejecutar Tests
Cuando ejecutas tests, ahora verás:
- 🚀 Banner azul con spinner
- Mensaje: "Ejecutando tests..."
- Contador de progreso: "Progreso: X / Y"

### 3. Estado Vacío Mejorado
Si no hay tests disponibles:
- 📋 Icono grande
- Mensaje claro
- Instrucciones de qué hacer

### 4. Contador de Tests en Header
El header ahora muestra:
- "X tests disponibles" cuando hay tests cargados

---

## 🔍 Verificación de Problemas

### Si No Carga la Web

1. **Verificar que el servidor esté corriendo**:
   ```bash
   # Verificar proceso Next.js
   ps aux | grep next
   
   # O verificar puerto
   lsof -i :3210
   ```

2. **Verificar conectividad al backend**:
   ```bash
   # Probar endpoint de tests
   curl https://api-ia.bodasdehoy.com/api/admin/tests/questions
   ```

3. **Verificar VPN**:
   - Si usas VPN, puede estar bloqueando conexiones
   - Prueba desactivarla temporalmente

4. **Verificar consola del navegador**:
   - Abre DevTools (F12)
   - Ve a la pestaña "Console"
   - Busca errores en rojo

### Si Carga Pero No Muestra Tests

1. **Verificar autenticación**:
   - Debes estar autenticado para ver el TestSuite
   - Verifica que tengas sesión activa

2. **Verificar backend**:
   - El backend debe estar corriendo
   - Debe tener las 1,000 preguntas disponibles

3. **Verificar logs**:
   - Abre consola del navegador (F12)
   - Busca mensajes que empiecen con `[TestSuite]`
   - Deberías ver:
     - `🔄 Cargando tests desde: ...`
     - `✅ Tests cargados: X`

---

## 📊 Qué Verás en Pantalla

### Pantalla Inicial (Cargando)
```
┌─────────────────────────────────────┐
│         🔄 (spinner animado)        │
│      Cargando tests...              │
│   Conectando con el backend...      │
└─────────────────────────────────────┘
```

### Pantalla con Tests Cargados
```
┌─────────────────────────────────────┐
│ Test Suite                          │
│ 1000 tests disponibles              │
│                                     │
│ [☑] Question │ Category │ Status  │
│ [☑] "..."    │ general  │ pending │
│ [☑] "..."    │ location │ passed  │
│ ...                                 │
│                                     │
│ [▶ Run Tests (1000)] [🔄 Reset]    │
└─────────────────────────────────────┘
```

### Ejecutando Tests
```
┌─────────────────────────────────────┐
│ 🚀 Ejecutando tests...              │
│ Progreso: 150 / 1000                │
└─────────────────────────────────────┘
```

---

## 🛠️ Solución de Problemas

### Problema: "No hay tests disponibles"

**Causas posibles**:
1. Backend no está corriendo
2. Error de conexión al backend
3. No hay tests en la base de datos

**Solución**:
```bash
# Verificar backend
curl http://localhost:8030/api/admin/tests/questions

# O con producción
curl https://api-ia.bodasdehoy.com/api/admin/tests/questions
```

### Problema: "Error loading tests"

**Causas posibles**:
1. Error de autenticación
2. Backend devuelve error
3. Problema de CORS

**Solución**:
- Abre consola del navegador (F12)
- Ve a la pestaña "Network"
- Busca la petición a `/api/admin/tests/questions`
- Verifica el código de estado HTTP

### Problema: No se ve progreso al ejecutar

**Causas posibles**:
1. Tests se ejecutan muy rápido
2. No hay actualización de UI

**Solución**:
- Los tests ahora muestran progreso en tiempo real
- Verifica que veas el banner azul "Ejecutando tests..."

---

## 📝 Logs Útiles

En la consola del navegador deberías ver:

```
[TestSuite] 🔄 Cargando tests desde: http://localhost:8030/api/admin/tests/questions
[TestSuite] ✅ Tests cargados: 1000
```

Si ves errores:
```
[TestSuite] ❌ Error loading tests: ...
```

---

## ✅ Checklist de Verificación

- [ ] Servidor Next.js corriendo
- [ ] Backend corriendo (localhost:8030 o producción)
- [ ] VPN configurada correctamente (si es necesario)
- [ ] Autenticación válida
- [ ] Consola del navegador abierta (F12)
- [ ] URL correcta: `/bodasdehoy/admin/tests`

---

**Estado**: ✅ Mejoras visuales implementadas, listo para ver tests en pantalla
