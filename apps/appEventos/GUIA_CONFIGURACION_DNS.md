# 🔧 Guía de Configuración DNS e Instalación

## 📋 Verificación de Instalación Actual

### 1. Verificar Variables de Entorno

```bash
# Verificar archivo .env.production
cat apps/web/.env.production

# Verificar variables críticas
echo $NEXT_PUBLIC_CHAT
echo $NEXT_PUBLIC_BASE_URL
echo $NEXT_PUBLIC_BACKEND_URL
```

### 2. Verificar Configuración de Next.js

```bash
# Verificar next.config.js
cat apps/web/next.config.js | grep -A 5 "copilotProdBase"
```

---

## 🌐 Configuración DNS en Cloudflare

### Paso 1: Verificar Dominios Existentes

1. Ir a **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Seleccionar dominio: `bodasdehoy.com`
3. Ir a **DNS → Records**
4. Verificar registros existentes:

**Registros que DEBERÍAN existir**:
```
chat.bodasdehoy.com          → CNAME o A → [IP del servidor]
chat-test.bodasdehoy.com    → CNAME o A → [IP del servidor]
api-ia.bodasdehoy.com       → CNAME o A → [IP del servidor]
apiapp.bodasdehoy.com       → CNAME o A → [IP del servidor]
api.bodasdehoy.com          → CNAME o A → [IP del servidor]
```

### Paso 2: Crear Registro DNS para chat-test (si no existe)

1. En Cloudflare Dashboard → DNS → Records
2. Click en **"Add record"**
3. Configurar:
   - **Type**: `CNAME` (recomendado) o `A`
   - **Name**: `chat-test`
   - **Target**: 
     - Si CNAME: `chat.bodasdehoy.com` o IP del servidor
     - Si A: IP del servidor directamente
   - **Proxy status**: ✅ **Proxied** (nube naranja)
   - **TTL**: Auto
4. Click **Save**

### Paso 3: Verificar Proxy Status

**Importante**: Todos los registros deben tener el **proxy activado** (nube naranja):
- ✅ **Proxied** = Nube naranja = Pasa por Cloudflare
- ❌ **DNS only** = Nube gris = No pasa por Cloudflare

---

## 🔍 Verificación Post-Configuración

### 1. Esperar Propagación DNS
```bash
# DNS puede tardar hasta 5 minutos en propagarse
# Verificar cada minuto:
dig @8.8.8.8 chat-test.bodasdehoy.com +short
```

### 2. Verificar desde Terminal
```bash
# Verificar resolución DNS
ping -c 1 chat-test.bodasdehoy.com

# Verificar HTTP
curl -I https://chat-test.bodasdehoy.com

# Verificar headers de Cloudflare
curl -I https://chat-test.bodasdehoy.com | grep -i cloudflare
```

### 3. Verificar desde Navegador
1. Abrir: `https://chat-test.bodasdehoy.com`
2. Presionar F12 → Network
3. Verificar:
   - Status: 200 OK (no 502)
   - Headers incluyen `cf-ray` (confirma Cloudflare)

---

## 🛠️ Configuración Local (Desarrollo)

### Opción 1: Usar Chat Producción
```env
# apps/web/.env.local
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
```

### Opción 2: Usar Chat Local
```bash
# Levantar chat local
cd apps/copilot
npm run dev
# O
pnpm dev

# Configurar en apps/web/.env.local
NEXT_PUBLIC_CHAT=http://localhost:3210
```

### Opción 3: Bypass DNS con /etc/hosts (Solo Testing)
```bash
# Editar /etc/hosts (requiere sudo)
sudo nano /etc/hosts

# Agregar línea:
IP_DEL_SERVIDOR chat-test.bodasdehoy.com

# Ejemplo:
192.168.1.100 chat-test.bodasdehoy.com
```

---

## 📝 Checklist de Configuración

### Cloudflare
- [ ] Dominio `bodasdehoy.com` configurado en Cloudflare
- [ ] Registro DNS para `chat-test.bodasdehoy.com` existe
- [ ] Proxy activado (nube naranja) para chat-test
- [ ] SSL/TLS configurado (Full o Full Strict)
- [ ] WAF no bloquea el subdominio

### Variables de Entorno
- [ ] `NEXT_PUBLIC_CHAT` configurado correctamente
- [ ] `NEXT_PUBLIC_BASE_URL` apunta a API correcta
- [ ] `NEXT_PUBLIC_BACKEND_URL` apunta a backend IA
- [ ] Archivo `.env.production` existe y está configurado

### Servidor de Origen
- [ ] Proceso Next.js corriendo
- [ ] Puerto escuchando (ej: 3000, 8080)
- [ ] Firewall permite conexiones desde Cloudflare
- [ ] Certificado SSL válido

### Red Local
- [ ] DNS local funcionando
- [ ] Sin VPN bloqueando DNS
- [ ] Firewall local no bloquea conexiones

---

## 🚨 Solución Rápida (Si chat-test no funciona)

### Usar Chat Producción
```bash
# Editar apps/web/.env.production
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
```

### O Usar Chat Local
```bash
# Levantar chat local
cd apps/copilot
npm run dev

# En apps/web/.env.local
NEXT_PUBLIC_CHAT=http://localhost:3210
```

---

## 🔗 URLs de Verificación

### Verificar desde Servicios Online
- **DNS Checker**: https://www.whatsmydns.net/#CNAME/chat-test.bodasdehoy.com
- **Is it down?**: https://downforeveryoneorjustme.com/chat-test.bodasdehoy.com
- **SSL Checker**: https://www.ssllabs.com/ssltest/analyze.html?d=chat-test.bodasdehoy.com

### Verificar desde Terminal
```bash
# DNS desde Google
dig @8.8.8.8 chat-test.bodasdehoy.com

# DNS desde Cloudflare
dig @1.1.1.1 chat-test.bodasdehoy.com

# Verificar HTTP
curl -I https://chat-test.bodasdehoy.com

# Verificar con más detalle
curl -v https://chat-test.bodasdehoy.com 2>&1 | head -30
```

---

## 📚 Documentación Relacionada

- **Diagnóstico 502**: `DIAGNOSTICO_502.md`
- **Resumen Diagnóstico**: `RESUMEN_DIAGNOSTICO_502.md`
- **URLs Completas**: `URLS_E_IPs_COMPLETAS.md`
- **IPs Backend IA**: `IPs_Y_URLs_BACKEND_IA.md`

---

## ✅ Próximos Pasos

1. **Verificar Cloudflare Dashboard** → Confirmar registros DNS
2. **Crear registro chat-test** si no existe
3. **Verificar proxy activado** (nube naranja)
4. **Esperar propagación DNS** (5 minutos)
5. **Probar desde navegador** → `https://chat-test.bodasdehoy.com`
6. **Si no funciona** → Usar chat producción o local
