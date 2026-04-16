# 🚨 SERVIDOR LOBECHAT CAÍDO - Error 500

**Fecha:** 5 de Febrero 2026, 21:05
**Severidad:** 🔴 CRÍTICA - El Copilot NO funciona
**Responsable:** Equipo que gestiona `chat-test.bodasdehoy.com`

---

## 📋 RESUMEN EJECUTIVO

**El servidor de LobeChat (`chat-test.bodasdehoy.com`) está retornando Error 500**, lo que impide que el iframe del Copilot se cargue.

**Backend API-IA (`api-ia.bodasdehoy.com`) está funcionando correctamente** ✅

---

## 🎯 ARQUITECTURA DEL COPILOT

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Frontend Next.js (app-test.bodasdehoy.com)                  │
│     - Usuario hace clic en "Abrir Copilot"                      │
│     - Intenta cargar iframe...                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Servidor LobeChat (chat-test.bodasdehoy.com) ❌ ERROR 500   │
│     URL: https://chat-test.bodasdehoy.com/bodasdehoy/chat       │
│     PROBLEMA: El servidor NO responde correctamente             │
│     IMPACTO: El iframe NO se carga                              │
└─────────────────────────────────────────────────────────────────┘
                       │
                       │ (Si el iframe cargara, haría requests a:)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Proxy Next.js (/api/copilot/chat) ✅ FUNCIONA              │
│     - Recibe mensaje del usuario                                │
│     - Reenvía al backend Python...                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Backend API-IA (api-ia.bodasdehoy.com) ✅ FUNCIONA          │
│     URL: https://api-ia.bodasdehoy.com/webapi/chat/auto         │
│     Health: https://api-ia.bodasdehoy.com/health → 200 OK       │
│     Status: FUNCIONANDO CORRECTAMENTE                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔴 PROBLEMA IDENTIFICADO

### Error Detectado

```bash
$ curl -I https://chat-test.bodasdehoy.com/bodasdehoy/chat

HTTP/2 500 Internal Server Error ❌
date: Thu, 05 Feb 2026 20:02:52 GMT
content-type: text/plain
content-length: 21
server: cloudflare
```

**Respuesta del servidor:**
```
Internal Server Error
```

### ✅ Confirmación: API-IA SÍ funciona

```bash
$ curl https://api-ia.bodasdehoy.com/health

{"status":"healthy","timestamp":"2026-02-05T20:03:35.556394","services":{"websockets":"0 active","graphql_proxy":"running"}}
```

---

## 🎯 CAUSA RAÍZ

**El servidor de LobeChat está caído o tiene un error de configuración.**

El problema NO es:
- ❌ El backend de API-IA (funciona perfectamente)
- ❌ El proxy de Next.js (funciona correctamente)
- ❌ El código del frontend (funciona correctamente)

El problema SÍ es:
- ✅ **El servidor que ejecuta LobeChat en `chat-test.bodasdehoy.com`**

---

## 📊 IMPACTO

- ❌ **100% de usuarios NO pueden usar el Copilot**
- ❌ El iframe nunca se carga (error 500 antes de renderizar)
- ❌ El usuario ve un loading infinito o pantalla en blanco
- ❌ NO es posible enviar preguntas al Copilot

---

## 🔧 DIAGNÓSTICO Y SOLUCIÓN

### Paso 1: Verificar el servidor de LobeChat

```bash
# SSH al servidor que ejecuta LobeChat
ssh usuario@servidor-lobechat

# Ver si el servicio está corriendo
docker ps | grep lobechat
# O si usa PM2:
pm2 list | grep lobechat
# O si usa systemd:
systemctl status lobechat
```

**Resultado esperado:** El servicio debería estar "running"
**Si NO está corriendo:** El servicio se cayó → reiniciar

### Paso 2: Revisar logs de LobeChat

```bash
# Si usa Docker:
docker logs lobechat-container-name --tail 100

# Si usa PM2:
pm2 logs lobechat --lines 100

# Si usa archivos de log:
tail -100 /var/log/lobechat/error.log
```

**Buscar:**
- Errores de Node.js
- Errores de base de datos (PostgreSQL/MySQL)
- Errores de variables de entorno
- Out of memory errors
- Port already in use
- Connection timeouts

### Paso 3: Verificar variables de entorno

LobeChat requiere estas variables:

```bash
# Variables críticas de LobeChat
DATABASE_URL=postgresql://...       # Base de datos
NEXTAUTH_SECRET=...                 # Secret para autenticación
NEXT_PUBLIC_SERVICE_MODE=...        # Modo de servicio
```

**Verificar:**
```bash
# Si usa Docker:
docker exec lobechat-container env | grep -E "DATABASE_URL|NEXTAUTH"

# Si usa archivo .env:
cat /ruta/a/lobechat/.env
```

### Paso 4: Verificar base de datos

```bash
# Si LobeChat usa PostgreSQL:
docker ps | grep postgres
# Verificar que la BD responde:
docker exec postgres-container psql -U usuario -d lobechat -c "SELECT 1;"
```

**Si la BD NO responde:** Reiniciar el contenedor de PostgreSQL

### Paso 5: Reiniciar LobeChat

```bash
# OPCIÓN 1: Docker Compose (RECOMENDADO)
cd /ruta/a/lobechat
docker-compose restart

# OPCIÓN 2: Docker directo
docker restart lobechat-container-name

# OPCIÓN 3: PM2
pm2 restart lobechat

# OPCIÓN 4: Systemd
sudo systemctl restart lobechat
```

### Paso 6: Verificar que funcione

```bash
# Esperar 30 segundos después del reinicio
sleep 30

# Verificar que responde correctamente
curl -I https://chat-test.bodasdehoy.com/bodasdehoy/chat

# Debería retornar:
# HTTP/2 200 OK
```

---

## 🐛 CAUSAS COMUNES DE ERROR 500

### 1. Variables de entorno faltantes

**Síntoma:** Error al iniciar, logs muestran "undefined is not a function"

**Solución:**
```bash
# Verificar archivo .env
cat /ruta/a/lobechat/.env

# Comparar con .env.example
cat /ruta/a/lobechat/.env.example

# Agregar variables faltantes
```

### 2. Base de datos no accesible

**Síntoma:** Error "Connection refused" o "ECONNREFUSED"

**Solución:**
```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep postgres

# Si NO está corriendo:
docker-compose up -d postgres

# Esperar 10 segundos
sleep 10

# Reiniciar LobeChat
docker-compose restart lobechat
```

### 3. Puerto ya en uso

**Síntoma:** Error "EADDRINUSE: address already in use"

**Solución:**
```bash
# Encontrar proceso usando el puerto (ej: 3000)
lsof -i :3000

# Matar el proceso
kill -9 <PID>

# Reiniciar LobeChat
docker-compose restart lobechat
```

### 4. Memoria insuficiente (OOM)

**Síntoma:** Logs muestran "JavaScript heap out of memory"

**Solución:**
```bash
# Si usa Docker, aumentar límite de memoria:
# En docker-compose.yml:
services:
  lobechat:
    mem_limit: 2g  # Aumentar de 1g a 2g

# Reiniciar con nueva configuración
docker-compose down
docker-compose up -d
```

### 5. Build corrupto

**Síntoma:** Error 500 sin logs claros

**Solución:**
```bash
# Rebuild completo
cd /ruta/a/lobechat
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📝 CHECKLIST DE RECUPERACIÓN

Ejecutar en orden:

- [ ] SSH al servidor de LobeChat
- [ ] Verificar que el servicio está corriendo (`docker ps` / `pm2 list`)
- [ ] Revisar logs (`docker logs` / `pm2 logs`)
- [ ] Identificar el error en los logs
- [ ] Verificar variables de entorno (`.env`)
- [ ] Verificar que la base de datos responde
- [ ] Reiniciar el servicio de LobeChat
- [ ] Esperar 30 segundos
- [ ] Verificar con `curl -I https://chat-test.bodasdehoy.com/bodasdehoy/chat`
- [ ] Confirmar que retorna 200 OK (no 500)
- [ ] Re-ejecutar test del Copilot: `node scripts/test-para-proveedor.js`

---

## 🚀 DESPUÉS DE ARREGLAR

Una vez que el servidor de LobeChat funcione correctamente:

### 1. Verificar manualmente

```bash
# Abrir navegador
open https://chat-test.bodasdehoy.com/bodasdehoy/chat

# Debería cargar la interfaz de LobeChat (no error 500)
```

### 2. Ejecutar test automatizado

```bash
cd /Users/juancarlosparra/Projects/AppBodasdehoy.com/apps/web/scripts
node test-para-proveedor.js
```

**Resultado esperado:**
- ✅ Iframe se carga correctamente
- ✅ Chat de LobeChat visible
- ✅ Usuario puede escribir preguntas
- ⚠️ Si NO responde a preguntas → Ver `RESUMEN-FINAL-TESTS-API-IA.md` (usuario no existe en BD)

---

## 📊 RESUMEN DE BLOQUEADORES

### ✅ Funcionando correctamente

1. **Backend API-IA** (`api-ia.bodasdehoy.com`)
   - Health check: 200 OK
   - Endpoints: Funcionando
   - Status: ✅ OPERATIVO

2. **Proxy Next.js** (`/api/copilot/chat`)
   - Configuración: Correcta
   - Status: ✅ OPERATIVO

### ❌ Bloqueadores actuales

1. **🔴 CRÍTICO: Servidor LobeChat caído** (`chat-test.bodasdehoy.com`)
   - Error: 500 Internal Server Error
   - Impacto: El Copilot NO se puede usar
   - Acción: **REINICIAR SERVIDOR** (pasos arriba)
   - Tiempo estimado de fix: **5-15 minutos**

2. **⚠️ PENDIENTE: Usuario no existe en BD de API-IA**
   - Error: Usuario `upSETrmXc7ZnsIhrjDjbHd7u2up1` no está creado
   - Impacto: Una vez que LobeChat funcione, el Copilot NO responderá preguntas
   - Acción: Ejecutar SQL (ver `RESUMEN-FINAL-TESTS-API-IA.md`)
   - Tiempo estimado de fix: **5 minutos**

---

## 📁 INFORMACIÓN ADICIONAL

### Reportes relacionados

- **`RESUMEN-FINAL-TESTS-API-IA.md`** - Pruebas del backend de API-IA (funciona correctamente)
- **`REPORTE-PARA-API-IA.md`** - Reporte detallado para equipo de API-IA
- **`/tmp/resultados-api-ia.json`** - Resultados de tests en JSON

### Scripts de test

```bash
# Test rápido (solo verifica que cargue)
node scripts/test-copilot-rapido.js

# Test completo con Firefox (recomendado)
node scripts/test-para-proveedor.js

# Test directo de API-IA (confirmar que funciona)
node scripts/test-api-ia-parametros-correctos.js
```

---

## 💡 PREVENCIÓN FUTURA

### Monitoring recomendado

```bash
# Crear health check cada 5 minutos
*/5 * * * * curl -sf https://chat-test.bodasdehoy.com/bodasdehoy/chat > /dev/null || echo "LobeChat DOWN" | mail -s "ALERT: LobeChat caído" admin@bodasdehoy.com
```

### Alertas automáticas

1. **UptimeRobot** - Monitorear `https://chat-test.bodasdehoy.com/bodasdehoy/chat`
2. **Cloudflare Workers** - Health checks cada minuto
3. **Docker auto-restart** - `restart: always` en docker-compose.yml

### Auto-recovery

```yaml
# docker-compose.yml
services:
  lobechat:
    restart: always  # Auto-reinicia si se cae
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/bodasdehoy/chat"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

---

## 📞 CONTACTO

**Prioridad:** 🔴 P0 - CRÍTICA
**Tiempo estimado de fix:** 5-15 minutos
**Responsable:** Equipo que gestiona el servidor de LobeChat

**Pasos:**
1. Reiniciar servidor de LobeChat (15 minutos)
2. Crear usuario en BD de API-IA (5 minutos)
3. Verificar que todo funciona (5 minutos)

**Total:** ~25 minutos hasta que el Copilot funcione completamente

---

**Generado por:** Tests Automatizados Frontend
**Fecha:** 5 de Febrero 2026, 21:05
**Estado:** 🔴 BLOQUEADOR CRÍTICO - SERVIDOR LOBECHAT CAÍDO
