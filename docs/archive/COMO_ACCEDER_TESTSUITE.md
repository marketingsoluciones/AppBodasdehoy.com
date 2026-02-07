# 🧪 Cómo Acceder al TestSuite Correctamente

**Fecha**: 2026-01-25  
**Problema**: Se ve respuesta JSON del backend en lugar del TestSuite UI

---

## ✅ Lo que Estás Viendo

La respuesta JSON que ves:
```json
{
  "message": "Lobe Chat Harbor - Backend Middleware",
  "version": "2.1.0",
  "status": "running",
  ...
}
```

**Significa**: ✅ El backend está funcionando correctamente

**Pero**: Estás en la URL del backend, no en el TestSuite UI del frontend.

---

## 🎯 Cómo Acceder al TestSuite Correcto

### Opción 1: Desde chat-test (Recomendado)

**URL correcta**:
```
https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
```

**O si chat-test no funciona**:
```
https://chat.bodasdehoy.com/bodasdehoy/admin/tests
```

---

### Opción 2: Desde localhost (Si tienes servidor local)

**URL correcta**:
```
http://localhost:3210/bodasdehoy/admin/tests
```

---

## 🔍 Diferencias

### URL del Backend (Lo que estás viendo ahora)
```
https://api-ia.bodasdehoy.com
```
**Muestra**: JSON con información del backend

### URL del TestSuite UI (Lo que necesitas)
```
https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
```
**Muestra**: Interfaz web con tabla de tests, botones, etc.

---

## 🚀 Pasos para Acceder Correctamente

### Paso 1: Determinar URL Base

**Desde configuración**:
```bash
cat apps/web/.env.production | grep NEXT_PUBLIC_CHAT
```

**Resultado esperado**:
```
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
```

---

### Paso 2: Construir URL del TestSuite

**Fórmula**:
```
{NEXT_PUBLIC_CHAT}/bodasdehoy/admin/tests
```

**Ejemplos**:
- `https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests`
- `https://chat.bodasdehoy.com/bodasdehoy/admin/tests`
- `http://localhost:3210/bodasdehoy/admin/tests`

---

### Paso 3: Abrir en Navegador

**Usar script**:
```bash
./scripts/abrir-testsuite.sh
```

**O manualmente**:
1. Copiar URL del TestSuite
2. Pegar en navegador
3. Presionar Enter

---

## ✅ Qué Deberías Ver en el TestSuite

### Interfaz Correcta

1. **Header**:
   - Título: "Test Suite" o similar
   - Contador: "X tests disponibles"
   - Botones: "Run Tests", "Reset", etc.

2. **Tabla de Tests**:
   - Columnas: Checkbox, ID, Pregunta, Categoría, Dificultad, Estado
   - Filas con cada test
   - Checkboxes para seleccionar

3. **Filtros**:
   - Por categoría
   - Por dificultad
   - Búsqueda

4. **Estadísticas**:
   - Tests pasados/fallidos
   - Tiempo promedio
   - Por categoría

---

## ❌ Qué NO Deberías Ver

### Si Ves Esto, Estás en el Lugar Incorrecto

1. **Solo JSON**:
   ```json
   {"message": "Lobe Chat Harbor...", ...}
   ```
   → Estás en el backend, no en el frontend

2. **Error 404**:
   → La ruta no existe o está mal escrita

3. **Error 502**:
   → El servidor no responde (usa fallback automático)

4. **`error.title` o `error.desc`**:
   → El fix de i18n no está aplicado

---

## 🔧 Solución Rápida

### Si Estás Viendo JSON del Backend

**Problema**: Estás en `https://api-ia.bodasdehoy.com` (backend)

**Solución**: Ir a la URL del frontend:
```
https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
```

---

### Si No Carga el TestSuite

**Verificar**:
1. ¿Estás logueado? (necesitas autenticación)
2. ¿La URL es correcta? (debe tener `/bodasdehoy/admin/tests`)
3. ¿El servidor está corriendo? (si es localhost)

---

## 📋 Checklist de Verificación

- [ ] URL correcta: `{CHAT_URL}/bodasdehoy/admin/tests`
- [ ] No estás en `api-ia.bodasdehoy.com` (ese es el backend)
- [ ] Estás en `chat-test.bodasdehoy.com` o `chat.bodasdehoy.com` (frontend)
- [ ] Ves interfaz web con tabla, no solo JSON
- [ ] No aparecen `error.title` o `error.desc`

---

## 🎯 URL Correcta para Tu Configuración

Según tu `.env.production`:
```
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
```

**URL del TestSuite**:
```
https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
```

**Si chat-test no funciona, usar producción**:
```
https://chat.bodasdehoy.com/bodasdehoy/admin/tests
```

---

**Estado**: ✅ Backend funcionando - Necesitas acceder al frontend para ver TestSuite UI
