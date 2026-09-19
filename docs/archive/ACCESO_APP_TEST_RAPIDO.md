# ⚡ Acceso Rápido a app-test.bodasdehoy.com

**Estado Actual**: ✅ Servidor corriendo en http://localhost:3210

---

## 🚀 Pasos para Acceder desde app-test.bodasdehoy.com

### Paso 1: Agregar Dominio a /etc/hosts (30 segundos)

Abre una nueva terminal y ejecuta:

```bash
echo "127.0.0.1 app-test.bodasdehoy.com" | sudo tee -a /etc/hosts
```

Te pedirá tu contraseña de Mac. Luego verifica:

```bash
grep app-test /etc/hosts
```

Deberías ver:
```
127.0.0.1 app-test.bodasdehoy.com
```

---

### Paso 2: Abrir en el Navegador

Una vez agregado al hosts, abre:

**http://app-test.bodasdehoy.com:3210**

---

## ✅ Ventajas de usar app-test.bodasdehoy.com

1. **Login Compartido**: Firebase reconoce el dominio bodasdehoy.com
2. **Sesión Automática**: Si ya estás logueado en otra app de bodasdehoy.com, no necesitas volver a hacer login
3. **Testing Real**: Condiciones similares a producción
4. **Cookies Funcionan**: Las cookies de Firebase se comparten entre *.bodasdehoy.com

---

## 🔍 Verificación Rápida

Antes de abrir el navegador, verifica que el servidor responde:

```bash
curl -I http://app-test.bodasdehoy.com:3210
```

Deberías ver: `HTTP/1.1 200 OK`

---

## 🎯 URLs Disponibles

Una vez configurado el /etc/hosts, puedes acceder desde:

- **http://app-test.bodasdehoy.com:3210** ⭐ Recomendado
- http://localhost:3210 (no comparte sesión de Firebase)
- http://127.0.0.1:3210 (no comparte sesión de Firebase)

---

## 🧪 Qué Probar

1. **Login de Firebase**
   - Haz login con Google o con: bodasdehoy.com@gmail.com / «definida en .env.e2e.dev.local — nunca en el repo»
   - Verifica que funcione correctamente

2. **Performance**
   - La carga inicial debe ser <2 segundos
   - Navegación fluida

3. **Funcionalidad del Copilot**
   - Enviar mensajes
   - Crear conversaciones
   - Subir archivos (si aplica)

4. **Consola del Navegador**
   - F12 → Console
   - No debe haber errores críticos

---

## 📊 Estado del Sistema

```
✅ Servidor: Corriendo en puerto 3210
✅ Host: 0.0.0.0 (accesible desde cualquier interfaz)
✅ Backend API: https://api-ia.bodasdehoy.com
✅ Firebase Auth: bodasdehoy-1063.firebaseapp.com
✅ Performance: Optimizada (<1s en dev)
```

---

## 🐛 Si Algo Falla

### Error: "No se puede acceder a app-test.bodasdehoy.com"
```bash
# Verificar que está en /etc/hosts
grep app-test /etc/hosts

# Si no está, agregarlo:
echo "127.0.0.1 app-test.bodasdehoy.com" | sudo tee -a /etc/hosts
```

### Error: "Conexión rechazada"
```bash
# Verificar que el servidor esté corriendo
lsof -i:3210

# Si no está, iniciarlo:
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/copilot
pnpm dev
```

### Login No Funciona
- Asegúrate de estar usando http://app-test.bodasdehoy.com:3210
- NO uses http://localhost:3210 (no comparte sesión)

---

## 📝 Comando de Acceso Rápido

Copia y ejecuta esto en tu terminal:

```bash
# Agregar al hosts (solo necesitas hacerlo una vez)
echo "127.0.0.1 app-test.bodasdehoy.com" | sudo tee -a /etc/hosts

# Verificar que funciona
curl -I http://app-test.bodasdehoy.com:3210

# Abrir en navegador
open http://app-test.bodasdehoy.com:3210
```

---

**¿Listo?** Ejecuta el comando de "Acceso Rápido" y en 30 segundos estarás probando el copilot en condiciones reales.
