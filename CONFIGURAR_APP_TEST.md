# 🔧 Configuración de app-test.bodasdehoy.com

**Objetivo**: Hacer pruebas reales en app-test (web + login) y chat-test (Copilot) con login compartido.

**Importante:** En este monorepo **app-test** = app web (`apps/web`, puerto 8080 dev / 3000 prod), **chat-test** = Copilot (`apps/copilot`, puerto 3210). Guía unificada con todos los detalles: **`docs/SUBDOMINIOS-APUNTAN-REPOSITORIO.md`**.

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

## Paso 3: Iniciar los servidores correctamente

Necesitas **dos** procesos: web (app-test) y Copilot (chat-test).

**Terminal 1 – Web (app-test, puerto 8080):**
```bash
cd apps/web
npm run dev:local
# 0.0.0.0:8080
```

**Terminal 2 – Copilot (chat-test, puerto 3210):**
```bash
cd apps/copilot
pnpm dev
# 0.0.0.0:3210
```

URLs:
- **app-test (web + login):** http://app-test.bodasdehoy.com:8080
- **chat-test (Copilot):** http://chat-test.bodasdehoy.com:3210

---

## Paso 4: Verificar acceso

```bash
curl -I http://app-test.bodasdehoy.com:8080
curl -I http://chat-test.bodasdehoy.com:3210
```

Deben devolver `HTTP/1.1 200 OK`.

---

## Paso 5: Abrir en el navegador

- **http://app-test.bodasdehoy.com:8080** ⭐ (web + login)
- http://chat-test.bodasdehoy.com:3210 (Copilot)

**Ventaja de usar app-test.bodasdehoy.com:**
- ✅ Comparte sesión de Firebase con bodasdehoy.com
- ✅ Login automático si ya estás logueado en la app principal
- ✅ Testing más realista (dominio real vs localhost)

---

## Paso 6: Probar login de Firebase

1. Abre: http://app-test.bodasdehoy.com:8080
2. Haz login con Google o las credenciales de prueba
3. Verifica que el login funcione correctamente
4. Abre DevTools (F12) → Console
5. Verifica que no haya errores

---

## ✅ Checklist de Validación

- [ ] /etc/hosts configurado con app-test y chat-test
- [ ] Web en 8080 (dev:local) y Copilot en 3210
- [ ] Acceso desde http://app-test.bodasdehoy.com:8080 y http://chat-test.bodasdehoy.com:3210
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
**Solución**: Verifica que los procesos estén corriendo:
```bash
lsof -i:8080
lsof -i:3210
```

### Error: "Firebase no comparte sesión"
**Causa**: Estás usando localhost en vez de app-test.bodasdehoy.com
**Solución**: Usa http://app-test.bodasdehoy.com:8080 en el navegador

---

## 🎯 Resultado Esperado

Una vez completado, podrás:
- ✅ Acceder al copilot desde app-test.bodasdehoy.com
- ✅ Login compartido con bodasdehoy.com
- ✅ Hacer pruebas reales de funcionalidad
- ✅ Validar integración con Memories API

---

**¿Listo para continuar?** Ejecuta los comandos en orden y avísame cuando llegues al Paso 5.
