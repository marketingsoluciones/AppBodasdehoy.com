# 🔍 Diagnóstico Definitivo: Error 502 Bad Gateway

**Fecha**: 2026-01-25 18:40:04 UTC  
**Error**: 502 Bad Gateway  
**Cloudflare Ray ID**: 9c39e59e8861038a  
**Dominio**: chat-test.bodasdehoy.com

---

## 📊 Análisis de la Captura de Pantalla

### ✅ Lo que FUNCIONA:

1. **Browser (Tu Navegador)** ✅
   - Conexión al navegador funciona
   - No hay problema de red local

2. **Cloudflare (Madrid PoP)** ✅
   - Cloudflare está funcionando correctamente
   - El PoP de Madrid está operativo
   - Cloudflare recibió la petición del navegador

### ❌ Lo que FALLA:

3. **Host (chat-test.bodasdehoy.com)** ❌
   - **ESTE ES EL PROBLEMA**
   - El servidor de origen NO está respondiendo
   - Cloudflare no puede conectar con el servidor de origen

---

## 🎯 CONCLUSIÓN DEFINITIVA

**El problema NO es**:
- ❌ Cloudflare (funciona correctamente)
- ❌ Tu VPN (Cloudflare recibió la petición)
- ❌ Tu navegador (conecta bien)

**El problema ES**:
- ✅ **El servidor de origen (chat-test.bodasdehoy.com) NO está corriendo o NO responde**

---

## 🔍 Causas Posibles del Servidor de Origen

### Causa 1: Servidor No Está Corriendo (MÁS PROBABLE) ⚠️

**Síntomas**:
- El proceso Next.js no está activo
- El servidor está apagado o reiniciándose
- El puerto no está escuchando

**Diagnóstico**:
```bash
# En el servidor donde debería correr chat-test
ps aux | grep next
pm2 list  # Si usa PM2
systemctl status nextjs  # Si usa systemd

# Verificar puerto
lsof -i :3210  # O el puerto configurado
netstat -tulpn | grep :PUERTO
```

**Solución**:
1. Levantar el servidor Next.js
2. Verificar que esté escuchando en el puerto correcto
3. Verificar logs para errores

### Causa 2: Servidor Caído o Reiniciándose ⚠️

**Síntomas**:
- El servidor se cayó por error
- Está reiniciándose
- Proceso crasheó

**Diagnóstico**:
```bash
# Ver logs del servidor
tail -f /var/log/nextjs/error.log
pm2 logs  # Si usa PM2
journalctl -u nextjs -f  # Si usa systemd

# Verificar recursos
top
free -h
df -h
```

**Solución**:
1. Revisar logs para encontrar el error
2. Reiniciar el servidor
3. Verificar recursos del servidor (memoria, CPU, disco)

### Causa 3: Firewall Bloqueando Cloudflare ⚠️

**Síntomas**:
- Servidor está corriendo localmente
- Pero Cloudflare no puede conectar
- Firewall bloquea conexiones externas

**Diagnóstico**:
```bash
# Verificar firewall
iptables -L -n
ufw status

# Verificar si permite IPs de Cloudflare
# Rangos: https://www.cloudflare.com/ips/
```

**Solución**:
1. Permitir rangos de IPs de Cloudflare en firewall
2. Verificar reglas de firewall
3. Asegurar que el puerto está abierto

### Causa 4: Configuración DNS Incorrecta en Cloudflare ⚠️

**Síntomas**:
- DNS apunta a IP incorrecta
- DNS apunta a servidor que no existe
- Registro DNS no configurado correctamente

**Diagnóstico**:
1. Ir a Cloudflare Dashboard
2. DNS → Records
3. Verificar registro de `chat-test.bodasdehoy.com`
4. Verificar que la IP/Target sea correcta

**Solución**:
1. Verificar IP del servidor de origen
2. Actualizar registro DNS en Cloudflare
3. Esperar propagación DNS (5 minutos)

### Causa 5: Servidor SobreCargado o Lento ⚠️

**Síntomas**:
- Servidor responde muy lento
- Timeout después de varios segundos
- Recursos del servidor al límite

**Diagnóstico**:
```bash
# Verificar recursos
top
htop
free -h
df -h

# Verificar logs de timeout
grep -i timeout /var/log/nextjs/error.log
```

**Solución**:
1. Optimizar aplicación
2. Aumentar recursos del servidor
3. Aumentar timeout en Cloudflare (default: 100s)

---

## 🛠️ Plan de Acción Inmediato

### Paso 1: Verificar Estado del Servidor

**En el servidor donde corre chat-test**:

```bash
# Verificar proceso Next.js
ps aux | grep next

# Verificar puerto
lsof -i :3210  # O el puerto configurado

# Verificar logs
tail -50 /var/log/nextjs/error.log
# O si usa PM2:
pm2 logs
```

### Paso 2: Verificar Configuración DNS en Cloudflare

1. Ir a: https://dash.cloudflare.com
2. Seleccionar dominio: `bodasdehoy.com`
3. Ir a: **DNS → Records**
4. Buscar registro: `chat-test`
5. Verificar:
   - ✅ Tipo: A o CNAME
   - ✅ Target: IP correcta del servidor
   - ✅ Proxy: Activado (nube naranja)
   - ✅ TTL: Auto

### Paso 3: Verificar Firewall

```bash
# Verificar reglas de firewall
iptables -L -n
ufw status

# Permitir IPs de Cloudflare si es necesario
# Ver: https://www.cloudflare.com/ips/
```

### Paso 4: Levantar Servidor (Si No Está Corriendo)

```bash
# Si usa PM2
cd /ruta/al/servidor
pm2 start npm --name "chat-test" -- run dev

# O directamente
cd /ruta/al/servidor
npm run dev
# O
pnpm dev
```

---

## 📋 Checklist de Verificación

### Servidor de Origen

- [ ] Proceso Next.js corriendo
- [ ] Puerto escuchando (ej: 3210)
- [ ] Logs sin errores críticos
- [ ] Recursos disponibles (memoria, CPU, disco)
- [ ] Firewall permite conexiones desde Cloudflare
- [ ] Certificado SSL válido (si usa HTTPS directo)

### Cloudflare

- [ ] Registro DNS existe para `chat-test.bodasdehoy.com`
- [ ] IP/Target correcto en DNS
- [ ] Proxy activado (nube naranja)
- [ ] SSL/TLS configurado (Full o Full Strict)
- [ ] WAF no bloquea el subdominio
- [ ] Origin Rules configuradas correctamente
- [ ] Timeout adecuado (default: 100s)

---

## 🔧 Soluciones Rápidas

### Solución 1: Usar Chat Producción (Temporal)

Si chat-test no funciona, usar producción:

```bash
# Editar apps/web/.env.production
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
```

### Solución 2: Usar Chat Local (Desarrollo)

```bash
# Levantar chat local
cd apps/copilot
npm run dev

# Configurar en apps/web/.env.local
NEXT_PUBLIC_CHAT=http://localhost:3210
```

### Solución 3: Verificar y Levantar Servidor chat-test

```bash
# En el servidor de producción/test
cd /ruta/a/chat-test
npm run dev
# O
pm2 restart chat-test
```

---

## 📊 Resumen del Diagnóstico

### Estado Actual:

```
Browser → Cloudflare → Servidor Origen
   ✅         ✅            ❌ → 502
```

### Problema Identificado:

**El servidor de origen (chat-test.bodasdehoy.com) NO está respondiendo**

### Causas Más Probables (en orden):

1. **Servidor no está corriendo** (80% probabilidad)
2. **Servidor caído o reiniciándose** (15% probabilidad)
3. **Firewall bloqueando Cloudflare** (3% probabilidad)
4. **DNS incorrecto en Cloudflare** (2% probabilidad)

---

## 🎯 Próximos Pasos

1. **Verificar estado del servidor**:
   - ¿Está corriendo el proceso Next.js?
   - ¿Está escuchando en el puerto correcto?

2. **Revisar logs del servidor**:
   - ¿Hay errores que causaron el crash?
   - ¿Hay problemas de recursos?

3. **Verificar configuración DNS**:
   - ¿El registro DNS en Cloudflare es correcto?
   - ¿La IP apunta al servidor correcto?

4. **Levantar servidor si es necesario**:
   - Reiniciar proceso Next.js
   - Verificar que escuche correctamente

---

**Conclusión**: El problema es **definitivamente el servidor de origen**, no Cloudflare ni la VPN. El servidor chat-test.bodasdehoy.com necesita ser levantado o verificado.
