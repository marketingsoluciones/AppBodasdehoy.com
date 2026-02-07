# 🎯 URL Correcta del TestSuite

**Problema**: Estás viendo JSON del backend en lugar del TestSuite UI

---

## ✅ Lo que Estás Viendo Ahora

**URL actual**: Probablemente `https://api-ia.bodasdehoy.com`

**Respuesta**: JSON con información del backend
```json
{
  "message": "Lobe Chat Harbor - Backend Middleware",
  "version": "2.1.0",
  "status": "running",
  ...
}
```

**Significa**: ✅ El backend está funcionando correctamente

**Pero**: Necesitas acceder al **frontend** para ver el TestSuite UI

---

## 🎯 URL Correcta del TestSuite

### Opción 1: chat-test (Configurado)

**URL completa**:
```
https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
```

**Si chat-test da 502**: El fix automático usará chat producción

---

### Opción 2: chat Producción (Fallback)

**URL completa**:
```
https://chat.bodasdehoy.com/bodasdehoy/admin/tests
```

---

### Opción 3: Localhost (Si tienes servidor local)

**URL completa**:
```
http://localhost:3210/bodasdehoy/admin/tests
```

---

## 🔍 Estructura de la URL

```
{CHAT_URL}/bodasdehoy/admin/tests
```

**Partes**:
- `{CHAT_URL}`: `https://chat-test.bodasdehoy.com` o `https://chat.bodasdehoy.com`
- `/bodasdehoy`: Variante del sistema
- `/admin`: Panel de administración
- `/tests`: Página del TestSuite

---

## 🚀 Cómo Acceder Correctamente

### Método 1: Script Automático

```bash
./scripts/abrir-testsuite.sh
```

Este script:
- ✅ Detecta la URL correcta automáticamente
- ✅ Abre el TestSuite en el navegador
- ✅ Verifica conectividad

---

### Método 2: Manual

1. **Copiar URL correcta**:
   ```
   https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
   ```

2. **Pegar en navegador**

3. **Presionar Enter**

---

## ✅ Qué Deberías Ver

### Interfaz del TestSuite (Correcto)

- ✅ **Header**: "Test Suite" o similar
- ✅ **Contador**: "X tests disponibles"
- ✅ **Tabla**: Con columnas (Checkbox, ID, Pregunta, Categoría, Dificultad, Estado)
- ✅ **Botones**: "Run Tests", "Reset", etc.
- ✅ **Filtros**: Por categoría, dificultad, búsqueda
- ✅ **Estadísticas**: Tests pasados/fallidos

---

## ❌ Qué NO Deberías Ver

### Solo JSON (Lo que estás viendo ahora)

```json
{"message": "Lobe Chat Harbor...", ...}
```

**Significa**: Estás en el backend, no en el frontend

**Solución**: Ir a la URL del frontend con `/bodasdehoy/admin/tests`

---

## 📋 Diferencias Clave

| URL | Qué Muestra | Correcto Para |
|-----|-------------|---------------|
| `https://api-ia.bodasdehoy.com` | JSON del backend | Verificar backend |
| `https://chat-test.bodasdehoy.com` | Frontend (página principal) | Acceder al frontend |
| `https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests` | **TestSuite UI** | **Ejecutar tests** ✅ |

---

## 🎯 Acción Inmediata

**Abrir esta URL en el navegador**:
```
https://chat-test.bodasdehoy.com/bodasdehoy/admin/tests
```

**O si chat-test no funciona**:
```
https://chat.bodasdehoy.com/bodasdehoy/admin/tests
```

---

## 🔧 Si No Carga

### Verificar Autenticación

- Debes estar logueado
- La sesión debe ser válida
- Si no estás logueado, te redirigirá al login

### Verificar que el Servidor Esté Corriendo

- Si es localhost: `cd apps/copilot && npm run dev`
- Si es remoto: Verificar que el servidor esté activo

### Verificar Fix de i18n

- Si ves `error.title` o `error.desc`: El fix no está aplicado
- Reiniciar servidor si es necesario

---

**Estado**: ✅ Backend funcionando - Necesitas acceder al frontend para ver TestSuite UI
