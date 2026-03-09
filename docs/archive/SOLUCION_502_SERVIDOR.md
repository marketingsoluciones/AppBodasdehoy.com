# ✅ Solución: Error 502 - Servidor de Origen No Responde

**Fecha**: 2026-01-25  
**Problema Confirmado**: El servidor de origen (chat-test.bodasdehoy.com) NO está respondiendo

---

## 🎯 Diagnóstico Confirmado

Según la captura de pantalla de Cloudflare:

```
Browser ✅ → Cloudflare ✅ → Servidor Origen ❌ → 502
```

**Conclusión**: El problema es **100% el servidor de origen**, NO Cloudflare ni VPN.

---

## 🔧 Soluciones Inmediatas

### Solución 1: Levantar Servidor chat-test (Recomendado)

**Si tienes acceso al servidor**:

```bash
# 1. Conectar al servidor
ssh usuario@servidor-chat-test

# 2. Verificar si hay proceso corriendo
ps aux | grep next
pm2 list  # Si usa PM2

# 3. Si no está corriendo, levantarlo
cd /ruta/a/apps/copilot
npm run dev
# O
pm2 start npm --name "chat-test" -- run dev

# 4. Verificar que escucha en el puerto correcto
lsof -i :3210  # O el puerto configurado
```

### Solución 2: Verificar Configuración DNS en Cloudflare

**Si el servidor está corriendo pero Cloudflare no puede conectar**:

1. **Ir a Cloudflare Dashboard**:
   - https://dash.cloudflare.com
   - Dominio: `bodasdehoy.com`
   - DNS → Records

2. **Verificar registro `chat-test`**:
   - Tipo: A o CNAME
   - Target: IP correcta del servidor
   - Proxy: ✅ Activado (nube naranja)

3. **Si no existe, crearlo**:
   ```
   Type: A
   Name: chat-test
   Target: IP_DEL_SERVIDOR
   Proxy: ✅ Proxied
   ```

### Solución 3: Usar Chat Producción (Temporal)

**Mientras se resuelve chat-test**:

```bash
# Editar apps/web/.env.production
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
```

### Solución 4: Usar Chat Local (Desarrollo)

**Para desarrollo local**:

```bash
# Levantar chat local
cd apps/copilot
npm run dev

# Configurar en apps/web/.env.local
NEXT_PUBLIC_CHAT=http://localhost:3210
```

---

## 🔍 Verificaciones Necesarias

### En el Servidor de Origen

```bash
# 1. Verificar proceso
ps aux | grep next
pm2 list

# 2. Verificar puerto
lsof -i :3210
netstat -tulpn | grep :3210

# 3. Verificar logs
tail -f /var/log/nextjs/error.log
pm2 logs chat-test

# 4. Verificar recursos
top
free -h
df -h

# 5. Verificar firewall
iptables -L -n
ufw status
```

### En Cloudflare Dashboard

- [ ] Registro DNS existe para `chat-test`
- [ ] IP/Target correcto
- [ ] Proxy activado
- [ ] SSL/TLS configurado
- [ ] WAF no bloquea
- [ ] Origin Rules correctas

---

## 📊 Información del Error

- **Error**: 502 Bad Gateway
- **Cloudflare Ray ID**: 9c39e59e8861038a
- **Timestamp**: 2026-01-25 18:40:04 UTC
- **Dominio**: chat-test.bodasdehoy.com
- **PoP Cloudflare**: Madrid ✅ (funcionando)
- **Servidor Origen**: ❌ (no responde)

---

## 🚀 Acción Inmediata Recomendada

1. **Verificar estado del servidor chat-test**
2. **Levantar servidor si no está corriendo**
3. **Verificar logs para encontrar causa del fallo**
4. **Verificar configuración DNS en Cloudflare**
5. **Probar conexión después de levantar servidor**

---

**Estado**: ⚠️ Servidor de origen no responde - necesita ser levantado o verificado
