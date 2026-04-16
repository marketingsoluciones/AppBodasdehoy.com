# 🚀 Cómo Levantar el Servidor para Ver el Playground

## ⚠️ El servidor necesita estar corriendo

El Playground está creado pero necesitas levantar el servidor del copilot para verlo.

## 📋 Pasos para Levantar el Servidor

### Opción 1: Desde Terminal (Recomendado)

1. **Abre una terminal** (Terminal.app o iTerm)

2. **Navega al directorio del copilot:**
   ```bash
   cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/copilot
   ```

3. **Instala dependencias (si es necesario):**
   ```bash
   npm install
   # O
   pnpm install
   ```

4. **Levanta el servidor:**
   ```bash
   npm run dev
   # O
   pnpm dev
   ```

5. **Espera a ver:**
   ```
   ✓ Ready in X seconds
   ○ Compiling / ...
   ```

6. **Abre en el navegador:**
   ```
   http://localhost:3210/bodasdehoy/admin/playground
   ```

### Opción 2: Si hay problemas de permisos

Si el puerto 3210 está bloqueado:

```bash
# Usar otro puerto
PORT=3001 npm run dev
# Luego: http://localhost:3001/bodasdehoy/admin/playground
```

## 🎯 Una vez que el servidor esté corriendo

1. **Abre el navegador** y ve a:
   ```
   http://localhost:3210/bodasdehoy/admin/playground
   ```

2. **Verás:**
   - Panel izquierdo: Lista de preguntas
   - Panel derecho: Resultados en tiempo real
   - Barra superior: Configuración

3. **Para probar:**
   - Selecciona algunas preguntas (checkboxes)
   - Selecciona modelo y provider
   - Click en "Ejecutar Seleccionadas"
   - Observa cómo la IA escribe en tiempo real

## 🔍 Verificar que el servidor está corriendo

```bash
# Verificar puerto
lsof -i :3210

# O probar con curl
curl http://localhost:3210
```

## ⚠️ Si hay errores

1. **Error de puerto ocupado:**
   ```bash
   # Matar proceso en puerto 3210
   lsof -ti :3210 | xargs kill -9
   ```

2. **Error de dependencias:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Error de compilación:**
   - Revisa los logs en la terminal
   - Verifica que todas las dependencias estén instaladas

## 📝 Notas

- El servidor puede tardar 30-60 segundos en iniciar
- Debes ver "Ready" en la terminal antes de abrir el navegador
- El Playground está en `/admin/playground` una vez que el servidor esté corriendo

---

**Una vez que veas "Ready" en la terminal, abre el navegador y disfruta del Playground!** 🎉
