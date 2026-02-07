# 🔧 Solución para Error EPERM en macOS

**Problema**: `Error: listen EPERM: operation not permitted ::1:3210`

Este error ocurre cuando macOS bloquea las conexiones de red para aplicaciones que no tienen los permisos adecuados.

---

## ✅ Soluciones (en orden de preferencia)

### Solución 1: Verificar Permisos de Accesibilidad (Recomendado)

1. **Abrir Preferencias del Sistema**
   - Click en el logo de Apple (esquina superior izquierda)
   - Seleccionar "Preferencias del Sistema" o "Configuración del Sistema"

2. **Ir a Seguridad y Privacidad**
   - Buscar "Seguridad y Privacidad" o "Privacidad y Seguridad"
   - Click en la pestaña "Privacidad"

3. **Verificar Accesibilidad**
   - En la lista lateral, seleccionar "Accesibilidad"
   - Buscar y asegurar que estén marcados:
     - ✅ **Cursor** (o tu editor)
     - ✅ **Terminal** (o iTerm2, si usas)
     - ✅ **Node.js** (si aparece)

4. **Si no están marcados**:
   - Click en el candado 🔒 (abajo a la izquierda)
   - Ingresar contraseña de administrador
   - Marcar las casillas para Cursor y Terminal
   - Cerrar y reiniciar Cursor/Terminal

5. **Reiniciar aplicaciones**
   ```bash
   # Cerrar completamente Cursor y Terminal
   # Luego abrir de nuevo
   ```

---

### Solución 2: Verificar y Configurar Firewall

```bash
# Verificar estado del firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Si está activo, agregar excepciones
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /Applications/Cursor.app
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /opt/homebrew/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node

# Verificar aplicaciones permitidas
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps
```

---

### Solución 3: Usar Puerto Diferente

Si el problema persiste, intentar con un puerto diferente:

```bash
cd apps/copilot

# Probar con puerto 3000 (puerto común)
PORT=3000 pnpm dev

# O modificar package.json temporalmente
# Cambiar "dev": "next dev -H localhost -p 3210"
# Por: "dev": "next dev -H localhost -p 3000"
```

---

### Solución 4: Deshabilitar IPv6 Temporalmente

El error muestra `::1:3210` que es IPv6. Puedes forzar IPv4:

```bash
# En package.json, cambiar:
"dev": "next dev -H 127.0.0.1 -p 3210"

# En lugar de:
"dev": "next dev -H localhost -p 3210"
```

---

### Solución 5: Verificar Procesos en el Puerto

```bash
# Ver qué está usando el puerto 3210
lsof -i :3210

# Si hay un proceso, matarlo
kill -9 <PID>

# O usar un puerto diferente
```

---

## 🔍 Diagnóstico

### Verificar si es problema de permisos:

```bash
# Intentar hacer un bind manual
node -e "require('net').createServer().listen(3210, 'localhost', () => console.log('OK')).on('error', (e) => console.error(e))"
```

Si esto también falla con EPERM, es definitivamente un problema de permisos del sistema.

---

## 📝 Notas Importantes

1. **El problema EPERM es específico de macOS** y requiere permisos del sistema
2. **No es un problema del código**, es una restricción de seguridad de macOS
3. **Los tests funcionan correctamente** sin necesidad del servidor corriendo
4. **Para desarrollo**, puedes trabajar con los tests sin necesidad del servidor

---

## ✅ Verificación Post-Solución

Después de aplicar las soluciones:

```bash
cd apps/copilot
pnpm dev

# Debe mostrar:
# ✓ Ready in X seconds
# ○ Local: http://localhost:3210
```

Si aún falla, el problema puede ser:
- Restricciones de seguridad más estrictas en tu Mac
- Software de seguridad de terceros bloqueando conexiones
- Configuración de red corporativa

---

## 🚀 Alternativa: Desarrollo sin Servidor

Los tests unitarios funcionan perfectamente sin el servidor corriendo. Puedes:

1. **Desarrollar y probar con tests**:
   ```bash
   pnpm test-app --watch
   ```

2. **Usar el servidor solo cuando sea necesario** para pruebas manuales

3. **Configurar un entorno de desarrollo remoto** si el problema persiste

---

**Última actualización**: 2026-01-25 09:20 UTC
