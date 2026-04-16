# 🌐 Verificar en el Navegador

## ⚠️ Estado Actual

- **Servidor**: No está corriendo (puerto 8080 libre)
- **Navegador Cursor**: No disponible (Chrome remote debugging no activo)

## 🚀 Pasos para Verificar

### 1. Levantar el Servidor

Abre una terminal y ejecuta:

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web
npm run dev
```

Espera a ver:
```
✓ Ready in X seconds
○ Compiling / ...
```

### 2. Abrir en el Navegador

Una vez que el servidor esté listo, abre en tu navegador:

```
http://127.0.0.1:8080
```

O también puedes probar:

```
http://localhost:8080
```

### 3. Verificar en la Consola del Navegador

1. Presiona **F12** (o Cmd+Option+I en Mac)
2. Ve a la pestaña **Console**
3. Verifica:
   - ✅ ¿Hay errores en rojo?
   - ✅ ¿Aparece la verificación de URLs automática?
   - ✅ ¿Carga la página correctamente?

### 4. Verificar el Chat

1. Navega a una página que tenga el chat/Copilot
2. Verifica si el iframe de `chat-test.bodasdehoy.com` carga
3. Revisa la consola por errores 502

## 🔍 Qué Buscar

### ✅ Si Funciona Correctamente
- Página carga sin errores
- No hay errores 502 en la consola
- El chat se carga correctamente

### ❌ Si Hay Problemas
- Error 502: Problema con Cloudflare/servidor origen
- Error de conexión: Servidor no está corriendo
- Errores de compilación: Revisar logs del servidor

## 📝 Información para Debugging

Si ves errores, comparte:
1. **Error en consola del navegador** (F12 → Console)
2. **Error en terminal del servidor**
3. **URL que estás intentando cargar**
