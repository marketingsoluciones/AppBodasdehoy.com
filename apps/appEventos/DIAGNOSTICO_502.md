# 🔍 Diagnóstico Completo: Error 502 Bad Gateway

## 📋 Resumen del Problema

**URL afectada**: `https://chat-test.bodasdehoy.com`  
**Error**: `502 Bad Gateway` o `Could not resolve host`  
**Significado**: 
- `502`: Cloudflare no puede comunicarse con el servidor de origen
- `Could not resolve host`: Problema de resolución DNS (no se puede encontrar el dominio)

### ⚠️ Estado Actual Detectado

**Error DNS**: `Could not resolve host: chat-test.bodasdehoy.com`

Esto indica que:
1. El dominio no está configurado en DNS
2. Hay un problema de red/VPN que bloquea la resolución DNS
3. El DNS local no puede resolver estos dominios

---

## 🔄 Flujo de la Petición

```
Usuario → Cloudflare (CDN/WAF) → Servidor Origen (chat-test)
   ✅           ✅                    ❌ → 502
```

**El 502 significa**: Cloudflare recibió la petición del usuario, pero el servidor de origen no respondió correctamente.

---

## 🔍 Diagnóstico Paso a Paso

### 1. Verificar Estado del Servidor de Origen

```bash
# Verificar si el servidor responde directamente (bypass Cloudflare)
curl -I https://chat-test.bodasdehoy.com

# Verificar con más detalle
curl -v https://chat-test.bodasdehoy.com 2>&1 | head -20

# Verificar con timeout corto
curl --max-time 5 -I https://chat-test.bodasdehoy.com

# Verificar desde diferentes ubicaciones (si tienes acceso)
curl -I https://chat-test.bodasdehoy.com --resolve chat-test.bodasdehoy.com:443:IP_ORIGEN
```

**Resultados esperados**:
- `502 Bad Gateway` → Problema confirmado
- `200 OK` → El servidor funciona, problema en Cloudflare
- `Timeout` → El servidor no responde
- `Connection refused` → El servidor está caído

### 2. Verificar Cloudflare

#### A. Verificar DNS
```bash
# Verificar resolución DNS
nslookup chat-test.bodasdehoy.com
dig chat-test.bodasdehoy.com

# Verificar IP del origen
dig chat-test.bodasdehoy.com +short
```

#### B. Verificar Headers de Cloudflare
```bash
# Ver headers completos
curl -I https://chat-test.bodasdehoy.com -v 2>&1 | grep -i cloudflare

# Verificar si Cloudflare está activo
curl -I https://chat-test.bodasdehoy.com | grep -i "cf-"
```

**Headers importantes**:
- `CF-Ray`: Confirma que pasa por Cloudflare
- `Server: cloudflare`: Cloudflare está activo
- `CF-Cache-Status`: Estado del cache

### 3. Verificar VPN y Red

```bash
# Verificar tu IP actual
curl ifconfig.me
curl ipinfo.io

# Verificar si el problema es específico de VPN
# 1. Con VPN activa
curl -I https://chat-test.bodasdehoy.com

# 2. Sin VPN
curl -I https://chat-test.bodasdehoy.com
```

**Si funciona sin VPN pero no con VPN**:
- Problema de ruteo en Cloudflare
- WAF bloqueando IPs de datacenter
- Timeout por latencia adicional

### 4. Verificar Otros Servicios Relacionados

```bash
# Verificar chat producción (debería funcionar)
curl -I https://chat.bodasdehoy.com

# Verificar backend IA
curl -I https://api-ia.bodasdehoy.com/health

# Verificar APIs principales
curl -I https://apiapp.bodasdehoy.com
curl -I https://api.bodasdehoy.com
```

**Si otros servicios funcionan pero chat-test no**:
- Problema específico del servidor de chat-test
- Configuración incorrecta en Cloudflare para ese subdominio

---

## 🚨 Causas Comunes del 502

### 1. Servidor de Origen Caído
**Síntomas**:
- Timeout en todas las peticiones
- Connection refused
- No hay respuesta del servidor

**Solución**:
- Verificar que el proceso Next.js esté corriendo
- Revisar logs del servidor
- Verificar recursos del servidor (CPU, memoria, disco)

### 2. Problema de Configuración en Cloudflare
**Síntomas**:
- Otros servicios funcionan
- Solo chat-test da 502
- Headers de Cloudflare presentes

**Solución**:
- Verificar configuración DNS en Cloudflare
- Revisar Origin Rules
- Verificar Load Balancer (si aplica)
- Revisar Workers que puedan estar interfiriendo

### 3. Firewall Bloqueando Cloudflare
**Síntomas**:
- Servidor responde directamente (bypass Cloudflare)
- Cloudflare no puede conectar

**Solución**:
- Permitir rangos de IPs de Cloudflare: https://www.cloudflare.com/ips/
- Verificar firewall del servidor
- Revisar reglas de iptables/ufw

### 4. Timeout del Origen
**Síntomas**:
- Peticiones lentas
- Timeout después de varios segundos
- Servidor sobrecargado

**Solución**:
- Aumentar timeout en Cloudflare (default: 100s)
- Optimizar aplicación Next.js
- Revisar recursos del servidor

### 5. Problema con VPN
**Síntomas**:
- Funciona sin VPN
- No funciona con VPN
- IPs de datacenter

**Solución**:
- Desactivar VPN temporalmente
- Verificar reglas WAF en Cloudflare
- Revisar Rate Limiting

### 6. Certificado SSL/TLS
**Síntomas**:
- Error de certificado
- Problemas de handshake TLS

**Solución**:
- Verificar certificado SSL en Cloudflare
- Verificar certificado en el servidor de origen
- Revisar configuración SSL/TLS en Cloudflare

---

## 🛠️ Checklist de Troubleshooting

### En el Servidor de Origen

- [ ] **Proceso Next.js corriendo**
  ```bash
  # Verificar procesos
  ps aux | grep next
  pm2 list  # Si usa PM2
  systemctl status nextjs  # Si usa systemd
  ```

- [ ] **Puerto escuchando**
  ```bash
  # Verificar puerto (ej: 3000, 8080)
  netstat -tulpn | grep :PUERTO
  lsof -i :PUERTO
  ```

- [ ] **Logs del servidor**
  ```bash
  # Revisar logs de errores
  tail -f /var/log/nextjs/error.log
  pm2 logs  # Si usa PM2
  journalctl -u nextjs -f  # Si usa systemd
  ```

- [ ] **Recursos del servidor**
  ```bash
  # CPU y memoria
  top
  htop
  free -h
  df -h  # Espacio en disco
  ```

- [ ] **Firewall permitiendo Cloudflare**
  ```bash
  # Verificar reglas
  iptables -L -n
  ufw status
  ```

### En Cloudflare Dashboard

- [ ] **DNS configurado correctamente**
  - Tipo: A o CNAME
  - Proxy: Activado (nube naranja)
  - IP/Valor correcto

- [ ] **Origin Rules**
  - Timeout configurado (default: 100s)
  - Headers correctos
  - Sin reglas que bloqueen

- [ ] **WAF (Web Application Firewall)**
  - Sin reglas bloqueando chat-test
  - Verificar logs de WAF
  - Revisar IPs bloqueadas

- [ ] **Rate Limiting**
  - Sin límites muy restrictivos
  - Verificar logs de rate limit

- [ ] **Load Balancer (si aplica)**
  - Orígenes saludables
  - Health checks pasando
  - Sin orígenes caídos

- [ ] **Workers**
  - Sin Workers interfiriendo
  - Revisar código de Workers

- [ ] **SSL/TLS**
  - Modo: Full o Full (strict)
  - Certificado válido
  - Sin errores de certificado

---

## 🔧 Soluciones Inmediatas

### 1. Usar Chat Producción (Temporal)
```bash
# Cambiar variable de entorno
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
```

### 2. Usar Chat Local (Desarrollo)
```bash
# Levantar chat local
cd apps/copilot
npm run dev  # o pnpm dev

# URL: http://localhost:3210
```

### 3. Bypass Cloudflare (Solo para Testing)
```bash
# Editar /etc/hosts (solo para testing local)
IP_ORIGEN chat-test.bodasdehoy.com
```

### 4. Verificar desde Diferentes Ubicaciones
```bash
# Usar servicios online
# - https://downforeveryoneorjustme.com/chat-test.bodasdehoy.com
# - https://www.isitdownrightnow.com/chat-test.bodasdehoy.com
```

---

## 📊 Comandos de Diagnóstico Completos

```bash
#!/bin/bash
# Script de diagnóstico 502

echo "=== Diagnóstico 502 Bad Gateway ==="
echo ""

echo "1. Verificar DNS:"
nslookup chat-test.bodasdehoy.com
echo ""

echo "2. Verificar respuesta HTTP:"
curl -I https://chat-test.bodasdehoy.com
echo ""

echo "3. Verificar headers de Cloudflare:"
curl -I https://chat-test.bodasdehoy.com -v 2>&1 | grep -i cloudflare
echo ""

echo "4. Verificar con timeout:"
curl --max-time 5 -I https://chat-test.bodasdehoy.com
echo ""

echo "5. Verificar IP actual:"
curl ifconfig.me
echo ""

echo "6. Verificar chat producción (debería funcionar):"
curl -I https://chat.bodasdehoy.com
echo ""

echo "7. Verificar backend IA:"
curl -I https://api-ia.bodasdehoy.com/health
echo ""

echo "=== Fin del diagnóstico ==="
```

---

## 📝 Información para Soporte

Si necesitas contactar soporte, proporciona:

1. **URL afectada**: `https://chat-test.bodasdehoy.com`
2. **Error**: `502 Bad Gateway`
3. **Cuándo empezó**: Fecha y hora
4. **Frecuencia**: Siempre / Intermitente / Solo con VPN
5. **Resultados de diagnóstico**:
   - Output de `curl -I https://chat-test.bodasdehoy.com`
   - Headers de Cloudflare
   - IP actual (con/sin VPN)
   - Estado de otros servicios

---

## 🔗 Referencias

- **Análisis 502 + VPN**: `docs/ANALISIS-502-VPN.md`
- **Cloudflare 502 Errors**: https://support.cloudflare.com/hc/en-us/articles/115003011431
- **Cloudflare IP Ranges**: https://www.cloudflare.com/ips/
- **URLs del Sistema**: `URLS_E_IPs_COMPLETAS.md`

---

## ✅ Próximos Pasos

1. Ejecutar diagnóstico completo
2. Verificar estado del servidor de origen
3. Revisar configuración en Cloudflare
4. Probar con/sin VPN
5. Contactar soporte si persiste
