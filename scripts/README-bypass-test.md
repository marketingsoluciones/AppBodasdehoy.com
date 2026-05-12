# Bypass para Test - Verificar Notificaciones

Scripts para usar el bypass de desarrollo en el entorno test y verificar notificaciones pendientes.

## 📋 Requisitos

- Tener acceso a los entornos test/dev
- Tener un email de usuario válido en el sistema

## 🚀 Scripts Disponibles

### 1. `test-bypass-notificaciones.sh` - Bypass para verificar notificaciones

**Uso:**
```bash
./scripts/test-bypass-notificaciones.sh <email> [entorno] [evento_id]
```

**Ejemplos:**
```bash
# Bypass en test con email jcc@bodasdehoy.com
./scripts/test-bypass-notificaciones.sh jcc@bodasdehoy.com test

# Bypass en test con email de eventosorganizador
./scripts/test-bypass-notificaciones.sh jcc@eventosorganizador.com test

# Bypass en test con email y evento específico
./scripts/test-bypass-notificaciones.sh jcc@bodasdehoy.com test EVENTO_123

# Bypass en entorno dev
./scripts/test-bypass-notificaciones.sh jcc@bodasdehoy.com dev

# Bypass en local
./scripts/test-bypass-notificaciones.sh jcc@bodasdehoy.com local
```

**Entornos disponibles:**
- `test` - https://app-test.bodasdehoy.com
- `dev` - https://app-dev.bodasdehoy.com  
- `local` - http://localhost:3220

### 2. `test-email-with-bypass.sh` - Bypass para probar envío de emails

**Uso:**
```bash
./scripts/test-email-with-bypass.sh <email> <evento_id> [development] [puerto]
```

### 3. `test-email-delivery.ts` - Script TypeScript para probar envío de emails

**Uso:**
```bash
tsx scripts/test-email-delivery.ts --email=test@example.com --evento=EVENTO_ID
```

## 🔍 Cómo verificar notificaciones

### Método 1: Interfaz gráfica
1. Usa el script para abrir el bypass
2. Espera a que cargue la página principal
3. Busca el icono de campana 🔔 en la esquina superior derecha
4. Haz clic en el icono de notificaciones
5. Revisa si hay notificaciones pendientes
6. Si hay un número rojo sobre el icono, indica notificaciones no leídas

### Método 2: Consola del navegador
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña 'Console'
3. Ejecuta estos comandos:

```javascript
// Verificar email del bypass
localStorage.getItem('dev_bypass_email')

// Verificar si el bypass está activo
localStorage.getItem('dev_bypass')

// Ver notificaciones (si la API está disponible)
fetch('/api/notifications').then(r => r.json()).then(console.log)
```

## 📊 Tipos de notificaciones que puedes encontrar

- **Invitaciones pendientes de confirmación**
- **Mensajes de proveedores**
- **Recordatorios de eventos**
- **Actualizaciones de presupuesto**
- **Notificaciones del sistema**
- **Alertas de vencimiento**
- **Mensajes de chat**

## 🛠️ Solución de problemas

### ❌ El bypass no funciona
1. Verifica que el entorno esté accesible:
   ```bash
   curl -I https://app-test.bodasdehoy.com
   ```
2. Asegúrate de que el endpoint `/api/dev/bypass` esté disponible
3. Verifica que el email sea válido en el sistema

### ❌ No se ven notificaciones
1. El usuario puede no tener notificaciones pendientes
2. Verifica en diferentes secciones de la app
3. Prueba con diferentes usuarios/emails

### ❌ Error de permisos
El bypass solo funciona en entornos de desarrollo/test. Asegúrate de:
- No estar en producción
- Usar `test`, `dev` o `local` como entorno

## 🔧 Configuración avanzada

### Usar con diferentes whitelabels
```bash
# Para eventosorganizador
./scripts/test-bypass-notificaciones.sh jcc@eventosorganizador.com test

# Para marketingsoluciones  
./scripts/test-bypass-notificaciones.sh jcc@marketingsoluciones.com test
```

### Redirigir a página específica
El bypass acepta el parámetro `d` para redirigir a una página específica:
```
https://app-test.bodasdehoy.com/api/dev/bypass?email=jcc@bodasdehoy.com&d=/evento/EVENTO_ID/invitaciones
```

## 📝 Notas importantes

1. **Solo para desarrollo/test**: El bypass no funciona en producción
2. **Datos reales**: Estás accediendo a datos reales del entorno test
3. **Seguridad**: No uses emails sensibles o contraseñas reales
4. **Persistencia**: El bypass usa localStorage, se mantiene entre sesiones

## 🆘 Soporte

Si encuentras problemas:
1. Verifica los logs del navegador
2. Revisa la consola de desarrollador
3. Verifica la conectividad de red
4. Contacta al equipo de desarrollo si persiste el problema