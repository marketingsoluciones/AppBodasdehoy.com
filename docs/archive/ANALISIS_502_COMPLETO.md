# 🔍 Análisis Completo: Error 502 Bad Gateway

**Fecha**: 2026-01-25  
**Objetivo**: Determinar si el 502 es por servidor no cargado o fallo de VPN/Cloudflare

---

## 📊 Diagnóstico Realizado

### 1. Verificación HTTP

```bash
curl -I https://chat-test.bodasdehoy.com
```

**Resultados esperados**:
- `502 Bad Gateway` → Cloudflare no puede conectar con origen
- `200 OK` → Servidor funciona, problema en otra parte
- `Timeout` → Servidor no responde
- `Could not resolve host` → Problema DNS

### 2. Verificación DNS

```bash
dig chat-test.bodasdehoy.com +short
nslookup chat-test.bodasdehoy.com
```

**Resultados esperados**:
- IP válida → DNS funciona
- Sin respuesta → DNS no configurado o problema de red

### 3. Verificación Cloudflare

```bash
curl -v https://chat-test.bodasdehoy.com 2>&1 | grep -i cloudflare
```

**Headers importantes**:
- `CF-Ray` → Confirma que pasa por Cloudflare
- `Server: cloudflare` → Cloudflare está activo
- `CF-Cache-Status` → Estado del cache

### 4. Comparación con Otros Servicios

```bash
curl -I https://chat.bodasdehoy.com          # Producción
curl -I https://api-ia.bodasdehoy.com/health # Backend IA
```

**Si otros servicios funcionan pero chat-test no**:
- Problema específico del servidor chat-test
- Configuración incorrecta en Cloudflare para ese subdominio

---

## 🔍 Posibles Causas del 502

### Causa 1: Servidor de Origen No Está Corriendo ⚠️

**Síntomas**:
- 502 constante
- Timeout en todas las peticiones
- No hay respuesta del servidor

**Diagnóstico**:
```bash
# Verificar si el proceso Next.js está corriendo
ps aux | grep next

# Verificar puerto
lsof -i :3210  # O el puerto que use chat-test

# Verificar logs del servidor
tail -f /var/log/nextjs/error.log
```

**Solución**:
1. Levantar el servidor Next.js
2. Verificar que esté escuchando en el puerto correcto
3. Verificar logs para errores

### Causa 2: Cloudflare No Puede Conectar con Origen ⚠️

**Síntomas**:
- 502 desde Cloudflare
- Headers de Cloudflare presentes (`CF-Ray`)
- Otros servicios funcionan

**Diagnóstico**:
```bash
# Verificar IP del origen desde Cloudflare
dig chat-test.bodasdehoy.com +short

# Verificar si el origen responde directamente (bypass Cloudflare)
curl -I http://IP_ORIGEN:PUERTO
```

**Posibles problemas**:
1. **Firewall bloqueando Cloudflare**:
   - El servidor no permite conexiones desde IPs de Cloudflare
   - Solución: Permitir rangos de IPs de Cloudflare

2. **IP incorrecta en DNS**:
   - DNS apunta a IP incorrecta o no existe
   - Solución: Verificar configuración DNS en Cloudflare

3. **Puerto incorrecto**:
   - Cloudflare intenta conectar a puerto incorrecto
   - Solución: Verificar Origin Rules en Cloudflare

### Causa 3: VPN Bloqueando o Interfiriendo ⚠️

**Síntomas**:
- Funciona sin VPN
- No funciona con VPN
- 502 intermitente

**Diagnóstico**:
```bash
# Verificar IP actual
curl ifconfig.me

# Probar con/sin VPN
curl -I https://chat-test.bodasdehoy.com
```

**Posibles problemas**:
1. **Ruteo diferente con VPN**:
   - Cloudflare envía tráfico a otro PoP
   - Ese PoP no puede conectar con origen
   - Solución: Verificar configuración de Load Balancer en Cloudflare

2. **WAF bloqueando IPs de VPN**:
   - Cloudflare WAF bloquea IPs de datacenter
   - Solución: Revisar reglas WAF en Cloudflare

3. **Timeout por latencia**:
   - VPN añade latencia
   - Origen tarda demasiado en responder
   - Cloudflare cierra conexión (timeout)
   - Solución: Aumentar timeout en Cloudflare

### Causa 4: Servidor SobreCargado o Lento ⚠️

**Síntomas**:
- 502 intermitente
- Timeout después de varios segundos
- Otros servicios funcionan

**Diagnóstico**:
```bash
# Verificar recursos del servidor
top
htop
free -h
df -h
```

**Solución**:
1. Optimizar aplicación Next.js
2. Aumentar recursos del servidor
3. Aumentar timeout en Cloudflare

---

## 🛠️ Checklist de Diagnóstico

### En el Servidor de Origen

- [ ] **Proceso Next.js corriendo**
  ```bash
  ps aux | grep next
  pm2 list  # Si usa PM2
  ```

- [ ] **Puerto escuchando**
  ```bash
  lsof -i :3210  # O el puerto configurado
  netstat -tulpn | grep :PUERTO
  ```

- [ ] **Logs del servidor**
  ```bash
  tail -f /var/log/nextjs/error.log
  pm2 logs  # Si usa PM2
  ```

- [ ] **Recursos del servidor**
  ```bash
  top
  free -h
  df -h
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

- [ ] **SSL/TLS**
  - Modo: Full o Full (strict)
  - Certificado válido
  - Sin errores de certificado

---

## 🔧 Soluciones por Causa

### Si el Servidor No Está Corriendo

1. **Levantar servidor**:
   ```bash
   cd apps/copilot
   npm run dev
   # O
   pm2 start npm --name "copilot" -- run dev
   ```

2. **Verificar que escucha en puerto correcto**:
   ```bash
   lsof -i :3210
   ```

3. **Verificar logs**:
   ```bash
   tail -f logs/error.log
   ```

### Si Cloudflare No Puede Conectar

1. **Verificar IP del origen**:
   ```bash
   dig chat-test.bodasdehoy.com +short
   ```

2. **Verificar firewall**:
   - Permitir rangos de IPs de Cloudflare: https://www.cloudflare.com/ips/
   - Verificar reglas de firewall del servidor

3. **Verificar configuración DNS en Cloudflare**:
   - Tipo correcto (A o CNAME)
   - IP/Valor correcto
   - Proxy activado

### Si VPN Está Interfiriendo

1. **Desactivar VPN temporalmente**:
   - Probar sin VPN
   - Si funciona, problema es VPN

2. **Verificar reglas WAF**:
   - Revisar si bloquean IPs de datacenter
   - Ajustar reglas si es necesario

3. **Aumentar timeout**:
   - Cloudflare default: 100s
   - Aumentar si VPN añade latencia

---

## 📋 Comandos de Diagnóstico Completos

```bash
#!/bin/bash
echo "=== Diagnóstico 502 Bad Gateway ==="
echo ""

echo "1. Verificar DNS:"
dig chat-test.bodasdehoy.com +short
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

## 🎯 Conclusión

El error 502 puede ser causado por:

1. **Servidor no corriendo** (más probable)
2. **Cloudflare no puede conectar con origen**
3. **VPN interfiriendo con ruteo**
4. **Servidor sobrecargado/lento**

**Próximos pasos**:
1. Ejecutar diagnóstico completo
2. Verificar estado del servidor
3. Revisar configuración en Cloudflare
4. Probar con/sin VPN

---

**Estado**: 🔍 Análisis en progreso
