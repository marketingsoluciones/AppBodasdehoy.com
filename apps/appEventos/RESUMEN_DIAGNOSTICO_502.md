# 🚨 Resumen: Diagnóstico 502 Bad Gateway

## ⚠️ Estado Actual

### Error Detectado
```
curl: (6) Could not resolve host: chat-test.bodasdehoy.com
```

**Esto significa**: El problema NO es un 502 Bad Gateway, sino que **el DNS no puede resolver el dominio**.

---

## 🔍 Causas Posibles

### 1. Problema de DNS
- El dominio `chat-test.bodasdehoy.com` no está configurado en DNS
- El registro DNS no existe o está mal configurado
- El DNS no está propagado correctamente

### 2. Problema de Red/VPN
- VPN bloqueando resolución DNS
- Firewall bloqueando consultas DNS
- DNS local corrupto o mal configurado

### 3. Dominio No Existe
- El subdominio `chat-test` no está creado
- Solo existe `chat.bodasdehoy.com` (producción)

---

## ✅ Verificaciones Inmediatas

### 1. Verificar DNS
```bash
# Verificar resolución DNS
nslookup chat-test.bodasdehoy.com
dig chat-test.bodasdehoy.com

# Verificar desde diferentes DNS
dig @8.8.8.8 chat-test.bodasdehoy.com  # Google DNS
dig @1.1.1.1 chat-test.bodasdehoy.com  # Cloudflare DNS
```

### 2. Verificar VPN
```bash
# Desactivar VPN y probar
curl -I https://chat-test.bodasdehoy.com

# Verificar DNS actual
cat /etc/resolv.conf
```

### 3. Verificar si el Dominio Existe
- Revisar Cloudflare Dashboard → DNS
- Verificar que existe registro para `chat-test.bodasdehoy.com`
- Verificar que el proxy está activado (nube naranja)

---

## 🛠️ Soluciones

### Solución 1: Usar Chat Producción
Si `chat-test` no existe o no está configurado, usar producción:

```env
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
```

### Solución 2: Configurar DNS en Cloudflare
1. Ir a Cloudflare Dashboard
2. Seleccionar dominio `bodasdehoy.com`
3. Ir a DNS → Records
4. Agregar registro:
   - **Tipo**: CNAME o A
   - **Nombre**: `chat-test`
   - **Contenido**: IP del servidor o CNAME
   - **Proxy**: Activado (nube naranja)

### Solución 3: Usar Chat Local
Para desarrollo, usar chat local:

```bash
cd apps/copilot
npm run dev
# URL: http://localhost:3210
```

---

## 📊 Comparación de Estados

| Servicio | Estado | Error |
|----------|--------|-------|
| `chat-test.bodasdehoy.com` | ❌ No resuelve | `Could not resolve host` |
| `chat.bodasdehoy.com` | ❓ Por verificar | `Could not resolve host` |
| `api-ia.bodasdehoy.com` | ❓ Por verificar | `Could not resolve host` |

**Nota**: Todos los dominios dan el mismo error DNS, lo que sugiere un problema de red/VPN o DNS local.

---

## 🔧 Acciones Recomendadas

1. **Verificar DNS desde otra red**
   - Probar desde otro dispositivo/red
   - Usar servicios online: https://www.whatsmydns.net/

2. **Verificar Cloudflare Dashboard**
   - Confirmar que los dominios existen
   - Verificar configuración DNS

3. **Probar sin VPN**
   - Desactivar VPN completamente
   - Limpiar cache DNS: `sudo dscacheutil -flushcache` (macOS)

4. **Usar DNS públicos**
   ```bash
   # Cambiar DNS temporalmente
   # macOS: System Preferences → Network → Advanced → DNS
   # Agregar: 8.8.8.8, 1.1.1.1
   ```

---

## 📝 Información para Soporte

Si el problema persiste, proporcionar:

1. **Output de diagnóstico DNS**:
   ```bash
   nslookup chat-test.bodasdehoy.com
   dig chat-test.bodasdehoy.com
   ```

2. **Estado de VPN**: Activada/Desactivada

3. **DNS actual**: `cat /etc/resolv.conf`

4. **Resultado desde otra red**: Probar desde móvil u otro dispositivo

---

## 🔗 Documentación Relacionada

- **Diagnóstico Completo**: `DIAGNOSTICO_502.md`
- **Análisis 502 + VPN**: `docs/ANALISIS-502-VPN.md`
- **URLs del Sistema**: `URLS_E_IPs_COMPLETAS.md`
