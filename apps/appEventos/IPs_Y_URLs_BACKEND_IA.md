# 🔌 IPs y URLs del Backend e IA

## 📍 IPs del Backend (Directas)

### WebSocket
```
ws://45.55.44.46:80/subscriptions
```
- **IP**: `45.55.44.46`
- **Puerto**: `80`
- **Protocolo**: WebSocket
- **Uso**: Subscripciones en tiempo real
- **Variable**: `NEXT_PUBLIC_URL_API_SOCKET`

### API Bodas (Alternativa)
```
http://96.126.110.203:4500
```
- **IP**: `96.126.110.203`
- **Puerto**: `4500`
- **Protocolo**: HTTP
- **Uso**: API alternativa de Bodas
- **Variable**: `NEXT_PUBLIC_BASE_API_BODAS_` (con guion bajo al final)

---

## 🤖 Backend de IA (Inteligencia Artificial)

### Producción
```
https://api-ia.bodasdehoy.com
```
- **URL**: `https://api-ia.bodasdehoy.com`
- **Uso**: Backend Python de IA (Ollama, OpenAI, Anthropic, Google, etc.)
- **Endpoints principales**:
  - `POST /webapi/chat/auto` - Chat automático
  - `POST /webapi/chat/openai` - Chat con OpenAI
  - `POST /webapi/chat/anthropic` - Chat con Anthropic
  - `POST /webapi/chat/google` - Chat con Google
  - `GET /webapi/models/openai` - Lista modelos OpenAI
  - `GET /webapi/models/anthropic` - Lista modelos Anthropic
  - `GET /health` - Health check
- **Variables**:
  - `PYTHON_BACKEND_URL` (prioridad)
  - `NEXT_PUBLIC_BACKEND_URL` (fallback)
  - Default: `https://api-ia.bodasdehoy.com`

### Local (Desarrollo)
```
http://localhost:8030
```
- **URL**: `http://localhost:8030` o `http://127.0.0.1:8030`
- **Uso**: Backend local para obtener credenciales de IA
- **Endpoints**:
  - `GET /api/developers/{developerId}/ai-credentials` - Obtener credenciales
- **Variable**: `NEXT_PUBLIC_BACKEND_URL`

---

## 🦙 Ollama (IA Local)

### Configuración
```
http://127.0.0.1:11434
```
- **URL**: `http://127.0.0.1:11434` (puerto por defecto de Ollama)
- **Uso**: Modelos de IA locales (Ollama)
- **Variable**: `OLLAMA_PROXY_URL`
- **Estado**: Actualmente no disponible (según bug reports)
- **Nota**: El backend intenta usar Ollama pero falla con "Ollama no disponible"

### Verificar Ollama Local
```bash
# Verificar que Ollama está corriendo
curl http://127.0.0.1:11434/api/tags

# Verificar modelos disponibles
curl http://127.0.0.1:11434/api/tags | jq
```

---

## 💬 Chat Test (No Carga - 502)

### URL del Chat Test
```
https://chat-test.bodasdehoy.com
```
- **Estado**: ❌ No carga (Error 502 Bad Gateway)
- **Causa probable**: 
  - Problema con Cloudflare (CDN/WAF)
  - Servidor de origen no responde
  - VPN activa (puede causar 502)
- **Variable**: `NEXT_PUBLIC_CHAT` (fallback: `https://chat-test.bodasdehoy.com`)

### Chat Local (Desarrollo)
```
http://localhost:3210
http://127.0.0.1:3210
```
- **URL**: `http://localhost:3210` o `http://127.0.0.1:3210`
- **Uso**: Copilot/Chat local (LobeChat)
- **Nota**: Debe estar corriendo localmente para desarrollo

### Chat Producción
```
https://chat.bodasdehoy.com
```
- **URL**: `https://chat.bodasdehoy.com`
- **Estado**: Producción

---

## 🔍 Verificación de URLs e IPs

### Verificar Backend IA
```bash
# Health check
curl -I https://api-ia.bodasdehoy.com/health

# Verificar modelos disponibles
curl -H "X-Development: bodasdehoy" https://api-ia.bodasdehoy.com/webapi/models/openai

# Probar chat
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"Hola"}],"stream":false}'
```

### Verificar IPs del Backend
```bash
# Verificar WebSocket (solo verifica que la IP responde)
ping 45.55.44.46

# Verificar API Bodas alternativa
curl -I http://96.126.110.203:4500

# Verificar Ollama local
curl http://127.0.0.1:11434/api/tags
```

### Verificar Chat Test
```bash
# Verificar si responde (debería dar 502)
curl -I https://chat-test.bodasdehoy.com

# Verificar con timeout
curl --max-time 5 https://chat-test.bodasdehoy.com
```

---

## 📋 Resumen de Variables de Entorno

### Backend APIs
```env
# API Principal (GraphQL)
NEXT_PUBLIC_BASE_URL=https://apiapp.bodasdehoy.com

# API Bodas
NEXT_PUBLIC_BASE_API_BODAS=https://api.bodasdehoy.com
NEXT_PUBLIC_BASE_API_BODAS_=http://96.126.110.203:4500

# WebSocket
NEXT_PUBLIC_URL_API_SOCKET=ws://45.55.44.46:80/subscriptions
```

### Backend IA
```env
# Backend IA (Producción)
PYTHON_BACKEND_URL=https://api-ia.bodasdehoy.com
NEXT_PUBLIC_BACKEND_URL=https://api-ia.bodasdehoy.com

# Backend IA (Local - para credenciales)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8030
```

### Ollama
```env
# Ollama Local
OLLAMA_PROXY_URL=http://127.0.0.1:11434
ENABLED_OLLAMA=1
```

### Chat/Copilot
```env
# Chat Producción
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com

# Chat Test (fallback)
NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com
```

---

## 🚨 Problemas Conocidos

### 1. Chat Test No Carga (502)
- **URL**: `https://chat-test.bodasdehoy.com`
- **Error**: `502 Bad Gateway`
- **Causas posibles**:
  - Cloudflare no puede conectar con el servidor de origen
  - Servidor de origen caído o no responde
  - VPN activa (puede causar bloqueos)
  - Firewall bloqueando conexiones
- **Solución temporal**: Usar `https://chat.bodasdehoy.com` (producción)

### 2. Ollama No Disponible
- **Error**: `"Ollama no disponible"` en respuestas del backend
- **Causa**: El backend intenta usar Ollama pero no está disponible
- **Impacto**: El backend cae a Ollama cuando otros providers fallan
- **Solución**: Configurar otros providers (OpenAI, Anthropic, Google) correctamente

### 3. Backend IA Devuelve EMPTY_RESPONSE
- **Error**: `error_code: "EMPTY_RESPONSE"`
- **Causa**: El orchestrator marca respuestas válidas como "vacías"
- **Impacto**: Copilot 100% no funcional
- **Ver**: `BUG_REPORT_BACKEND_IA_OLLAMA.md`

---

## 🔗 URLs Relacionadas

### APIs Principales
- `https://apiapp.bodasdehoy.com` - API GraphQL principal
- `https://api.bodasdehoy.com` - API Bodas
- `https://cms.bodasdehoy.com` - CMS
- `https://web.bodasdehoy.com` - Custom Web
- `https://organizador.bodasdehoy.com` - Organizador

### Servicios
- `https://bodasdehoy.com` - Web principal
- `https://chat.bodasdehoy.com` - Chat producción
- `https://chat-test.bodasdehoy.com` - Chat test (❌ no carga)

---

## 📝 Notas Importantes

1. **IPs Directas**: Las IPs `45.55.44.46` y `96.126.110.203` son servidores directos (no pasan por Cloudflare)

2. **Backend IA**: `api-ia.bodasdehoy.com` es el backend principal de IA, siempre usa este en producción

3. **Ollama Local**: Solo funciona si tienes Ollama instalado y corriendo localmente en `127.0.0.1:11434`

4. **Chat Test**: Actualmente no funciona (502), usar chat producción o local

5. **VPN**: Si usas VPN y ves 502, prueba desactivarla

---

## 🛠️ Comandos Útiles

```bash
# Verificar todas las URLs del sistema
curl http://127.0.0.1:8080/api/verify-urls

# Verificar backend IA
curl -I https://api-ia.bodasdehoy.com/health

# Verificar Ollama local
curl http://127.0.0.1:11434/api/tags

# Verificar IPs
ping 45.55.44.46
ping 96.126.110.203

# Verificar chat test
curl -I https://chat-test.bodasdehoy.com
```
