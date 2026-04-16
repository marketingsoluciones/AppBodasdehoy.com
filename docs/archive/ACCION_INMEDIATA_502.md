# 🚨 Acción Inmediata: Error 502 en chat-test

**Fecha**: 2026-01-25 18:45:15 UTC  
**Error**: 502 Bad Gateway  
**Dominio**: chat-test.bodasdehoy.com  
**Estado**: Browser ✅ | Cloudflare ✅ | Host ❌

---

## ✅ Diagnóstico Confirmado

**El problema es 100% el servidor de origen**:
- ✅ Tu navegador funciona
- ✅ Cloudflare (Madrid) funciona
- ❌ **Servidor chat-test.bodasdehoy.com NO responde**

---

## 🔧 Soluciones Inmediatas (En Orden de Prioridad)

### Solución 1: Configurar DNS para Usar Servidor de Producción (5 minutos) ⚡

**La más rápida - No requiere levantar servidor**

1. **Ir a Cloudflare Dashboard**:
   - https://dash.cloudflare.com
   - Login
   - Seleccionar: `bodasdehoy.com`

2. **DNS → Records → Add record** (o editar si existe)

3. **Configurar**:
   ```
   Type: CNAME
   Name: chat-test
   Target: chat.bodasdehoy.com
   Proxy status: ✅ Proxied (nube naranja)
   TTL: Auto
   ```

4. **Save** y esperar 5 minutos

5. **Verificar**:
   ```bash
   curl -I https://chat-test.bodasdehoy.com
   # Debería dar: HTTP/2 200 (no 502)
   ```

**✅ Resultado**: `chat-test` funcionará usando el servidor de producción

---

### Solución 2: Verificar y Levantar Servidor chat-test (Si Existe)

**Si tienes acceso al servidor donde debería correr chat-test**:

```bash
# 1. Conectar al servidor
ssh usuario@servidor-chat-test

# 2. Verificar si hay proceso corriendo
ps aux | grep next
pm2 list  # Si usa PM2
systemctl status chat-test  # Si usa systemd

# 3. Si NO está corriendo, levantarlo
cd /ruta/a/apps/copilot
npm run dev
# O con PM2:
pm2 start npm --name "chat-test" -- run dev

# 4. Verificar que escucha
lsof -i :3210  # O el puerto configurado
netstat -tulpn | grep :3210

# 5. Verificar logs
tail -f logs/error.log
pm2 logs chat-test
```

---

### Solución 3: Usar chat Producción Temporalmente

**Mientras se resuelve chat-test**:

```bash
# Editar apps/web/.env.production
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
```

**Ventaja**: Funciona inmediatamente

---

### Solución 4: Usar Chat Local para Desarrollo

**Si estás desarrollando localmente**:

```bash
# 1. Levantar chat local
cd apps/copilot
npm run dev  # Escucha en http://localhost:3210

# 2. Configurar para usar local
# Crear/editar apps/web/.env.local
NEXT_PUBLIC_CHAT=http://localhost:3210

# 3. Reiniciar servidor web
cd apps/web
npm run dev
```

---

## 📋 Checklist de Verificación

### En Cloudflare Dashboard

- [ ] Ir a: https://dash.cloudflare.com
- [ ] Dominio: `bodasdehoy.com`
- [ ] DNS → Records
- [ ] Verificar si existe registro `chat-test`
- [ ] Si NO existe: Crear CNAME a `chat.bodasdehoy.com`
- [ ] Si existe: Verificar que Target sea correcto
- [ ] Verificar que Proxy esté activado (nube naranja)
- [ ] Guardar cambios
- [ ] Esperar 5 minutos (propagación DNS)

### En el Servidor (Si Tienes Acceso)

- [ ] Conectar al servidor
- [ ] Verificar proceso Next.js: `ps aux | grep next`
- [ ] Verificar puerto: `lsof -i :3210`
- [ ] Verificar logs: `tail -f logs/error.log`
- [ ] Si no está corriendo: Levantarlo
- [ ] Verificar recursos: `top`, `free -h`, `df -h`

---

## 🎯 Recomendación Inmediata

**Para resolverlo AHORA**:

1. **Ir a Cloudflare Dashboard** (2 minutos)
2. **Crear CNAME `chat-test` → `chat.bodasdehoy.com`** (1 minuto)
3. **Esperar 5 minutos** (propagación DNS)
4. **Probar**: `https://chat-test.bodasdehoy.com`

**✅ Esto hará que `chat-test` funcione inmediatamente usando el servidor de producción**

---

## 📊 Estado Actual

| Componente | Estado | Acción Necesaria |
|------------|--------|------------------|
| Browser | ✅ Funciona | Ninguna |
| Cloudflare | ✅ Funciona | Ninguna |
| Servidor chat-test | ❌ No responde | Levantar servidor O configurar DNS |
| DNS chat-test | ⚠️ Puede no existir | Crear registro en Cloudflare |

---

## 🚀 Próximo Paso Inmediato

**Acción recomendada**: Configurar DNS en Cloudflare para que `chat-test` apunte a `chat` (Solución 1)

**Tiempo estimado**: 5-10 minutos

**Resultado**: `chat-test.bodasdehoy.com` funcionará

---

**Estado**: ⚠️ Servidor de origen no responde - Configurar DNS es la solución más rápida
