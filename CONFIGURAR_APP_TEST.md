# 🔧 Configuración de app-test.bodasdehoy.com

**Objetivo**: Hacer pruebas reales del copilot en app-test.bodasdehoy.com con login compartido

---

## Paso 1: Agregar Dominios al /etc/hosts

Necesitas ejecutar estos comandos en tu terminal (te pedirá la contraseña de tu Mac):

```bash
echo "127.0.0.1 app-test.bodasdehoy.com" | sudo tee -a /etc/hosts
echo "127.0.0.1 chat-test.bodasdehoy.com" | sudo tee -a /etc/hosts
```

**Verificar que se agregó correctamente:**
```bash
grep -E "app-test|chat-test" /etc/hosts
```

Deberías ver:
```
127.0.0.1 app-test.bodasdehoy.com
127.0.0.1 chat-test.bodasdehoy.com
```

---

## Paso 2: Detener el Servidor Actual

Actualmente hay un servidor en puerto 8080 (solo localhost). Vamos a reiniciarlo en el puerto correcto:

```bash
# Encontrar el proceso
lsof -ti:8080

# Detenerlo (usa el PID que te muestre el comando anterior)
kill <PID>
```

O si prefieres:
```bash
# Detener cualquier proceso en 8080
kill $(lsof -ti:8080)
```

---

## Paso 3: Iniciar el Servidor Correctamente

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/copilot

# Iniciar en puerto 3210 escuchando en todas las interfaces (0.0.0.0)
pnpm dev
```

Esto iniciará el servidor con:
- **Host**: 0.0.0.0 (accesible desde cualquier IP)
- **Puerto**: 3210
- **URLs disponibles**:
  - http://localhost:3210
  - http://app-test.bodasdehoy.com:3210
  - http://chat-test.bodasdehoy.com:3210

---

## Paso 4: Verificar Acceso

Una vez iniciado el servidor, verifica que funciona:

```bash
# Desde localhost
curl -I http://localhost:3210

# Desde app-test
curl -I http://app-test.bodasdehoy.com:3210

# Desde chat-test
curl -I http://chat-test.bodasdehoy.com:3210
```

Todos deberían devolver: `HTTP/1.1 200 OK`

---

## Paso 5: Abrir en el Navegador

Abre cualquiera de estas URLs:
- **http://app-test.bodasdehoy.com:3210** ⭐ (Recomendado)
- http://chat-test.bodasdehoy.com:3210
- http://localhost:3210

**Ventaja de usar app-test.bodasdehoy.com:**
- ✅ Comparte sesión de Firebase con bodasdehoy.com
- ✅ Login automático si ya estás logueado en la app principal
- ✅ Testing más realista (dominio real vs localhost)

---

## Paso 6: Probar Login de Firebase

1. Abre: http://app-test.bodasdehoy.com:3210
2. Haz login con Google o las credenciales de prueba
3. Verifica que el login funcione correctamente
4. Abre DevTools (F12) → Console
5. Verifica que no haya errores

---

## ✅ Checklist de Validación

- [ ] /etc/hosts configurado con app-test y chat-test
- [ ] Servidor corriendo en puerto 3210 con host 0.0.0.0
- [ ] Acceso desde http://app-test.bodasdehoy.com:3210 funciona
- [ ] Login de Firebase funcional
- [ ] Sin errores en consola del navegador
- [ ] Performance del copilot aceptable (<2s carga)

---

## 🐛 Troubleshooting

### Error: "No se puede resolver app-test.bodasdehoy.com"
**Solución**: Verifica que esté en /etc/hosts:
```bash
grep app-test /etc/hosts
```

### Error: "Conexión rechazada"
**Solución**: Verifica que el servidor esté corriendo:
```bash
lsof -i:3210
```

### Error: "Firebase no comparte sesión"
**Causa**: Estás usando localhost en vez de app-test.bodasdehoy.com
**Solución**: Usa http://app-test.bodasdehoy.com:3210 en el navegador

---

## 🎯 Resultado Esperado

Una vez completado, podrás:
- ✅ Acceder al copilot desde app-test.bodasdehoy.com
- ✅ Login compartido con bodasdehoy.com
- ✅ Hacer pruebas reales de funcionalidad
- ✅ Validar integración con Memories API

---

**¿Listo para continuar?** Ejecuta los comandos en orden y avísame cuando llegues al Paso 5.
