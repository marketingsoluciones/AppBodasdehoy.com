# 🔗 URLs e IPs Completas del Sistema

## 🚀 Resumen Rápido

### URLs Principales
```
Frontend Local:     http://127.0.0.1:8080
Chat Local:         http://localhost:3210
Backend IA:         https://api-ia.bodasdehoy.com
Chat Test:          https://chat-test.bodasdehoy.com (❌ no carga)
Chat Producción:    https://chat.bodasdehoy.com
```

### IPs del Backend
```
WebSocket:          45.55.44.46:80
API Bodas Alt:      96.126.110.203:4500
Ollama Local:       127.0.0.1:11434
Backend Local:      127.0.0.1:8030
```

---

## 📍 URLs del Frontend

### Desarrollo Local
- **Web App**: `http://127.0.0.1:8080` o `http://localhost:8080`
- **Login**: `http://127.0.0.1:8080/login`
- **API Verificación**: `http://127.0.0.1:8080/api/verify-urls`

### Producción/Test
- **Web Principal**: `https://bodasdehoy.com`
- **Organizador**: `https://organizador.bodasdehoy.com`
- **Custom Web**: `https://web.bodasdehoy.com`

---

## 🔌 Backend APIs

### API Principal (GraphQL)
```
https://apiapp.bodasdehoy.com
```
- **Variable**: `NEXT_PUBLIC_BASE_URL`
- **Uso**: API GraphQL principal

### API Bodas
```
https://api.bodasdehoy.com
```
- **Variable**: `NEXT_PUBLIC_BASE_API_BODAS`
- **Uso**: API REST de Bodas

### API Bodas (Alternativa - IP Directa)
```
http://96.126.110.203:4500
```
- **IP**: `96.126.110.203`
- **Puerto**: `4500`
- **Variable**: `NEXT_PUBLIC_BASE_API_BODAS_`
- **Nota**: IP directa, no pasa por Cloudflare

---

## 🤖 Backend de IA

### Producción
```
https://api-ia.bodasdehoy.com
```
- **Variable**: `PYTHON_BACKEND_URL` o `NEXT_PUBLIC_BACKEND_URL`
- **Endpoints**:
  - `POST /webapi/chat/auto` - Chat automático
  - `POST /webapi/chat/openai` - Chat OpenAI
  - `POST /webapi/chat/anthropic` - Chat Anthropic
  - `POST /webapi/chat/google` - Chat Google
  - `GET /webapi/models/{provider}` - Lista modelos
  - `GET /health` - Health check

### Local (Desarrollo)
```
http://localhost:8030
http://127.0.0.1:8030
```
- **Variable**: `NEXT_PUBLIC_BACKEND_URL`
- **Uso**: Backend local para credenciales de IA
- **Endpoint**: `GET /api/developers/{developerId}/ai-credentials`

---

## 🦙 Ollama (IA Local)

### Configuración
```
http://127.0.0.1:11434
```
- **Variable**: `OLLAMA_PROXY_URL`
- **Estado**: ⚠️ Actualmente no disponible
- **Nota**: Solo funciona si Ollama está instalado y corriendo localmente

### Verificar Ollama
```bash
curl http://127.0.0.1:11434/api/tags
```

---

## 💬 Chat/Copilot

### Chat Test (❌ No Carga)
```
https://chat-test.bodasdehoy.com
```
- **Estado**: Error 502 Bad Gateway
- **Causa**: Problema con Cloudflare o servidor de origen
- **Variable**: `NEXT_PUBLIC_CHAT` (fallback)

### Chat Producción
```
https://chat.bodasdehoy.com
```
- **Estado**: ✅ Funcional
- **Variable**: `NEXT_PUBLIC_CHAT`

### Chat Local (Desarrollo)
```
http://localhost:3210
http://127.0.0.1:3210
```
- **Uso**: LobeChat local para desarrollo
- **Nota**: Debe estar corriendo localmente

---

## 🌐 WebSocket

### Socket API
```
ws://45.55.44.46:80/subscriptions
```
- **IP**: `45.55.44.46`
- **Puerto**: `80`
- **Protocolo**: WebSocket
- **Variable**: `NEXT_PUBLIC_URL_API_SOCKET`
- **Nota**: IP directa, no pasa por Cloudflare

---

## 🎨 Servicios Adicionales

### CMS
```
https://cms.bodasdehoy.com
```
- **Variable**: `NEXT_PUBLIC_CMS`

### Directory
```
https://bodasdehoy.com
```
- **Variable**: `NEXT_PUBLIC_DIRECTORY`

---

## 🔍 Verificación Rápida

### Desde Terminal
```bash
# Frontend local
curl -I http://127.0.0.1:8080/

# Backend IA
curl -I https://api-ia.bodasdehoy.com/health

# Chat Test (debería dar 502)
curl -I https://chat-test.bodasdehoy.com

# IPs del backend
ping 45.55.44.46
ping 96.126.110.203

# Ollama local
curl http://127.0.0.1:11434/api/tags
```

### Desde el Navegador
1. Abre: `http://127.0.0.1:8080`
2. Presiona F12 (Consola)
3. Verás automáticamente la verificación de todas las URLs

---

## 📋 Variables de Entorno Completas

```env
# Frontend
NEXT_PUBLIC_DIRECTORY=https://bodasdehoy.com
NEXT_PUBLIC_DOMINIO=.bodasdehoy.com
NEXT_PUBLIC_PRODUCTION=true

# Backend APIs
NEXT_PUBLIC_BASE_URL=https://apiapp.bodasdehoy.com
NEXT_PUBLIC_BASE_API_BODAS=https://api.bodasdehoy.com
NEXT_PUBLIC_BASE_API_BODAS_=http://96.126.110.203:4500

# WebSocket
NEXT_PUBLIC_URL_API_SOCKET=ws://45.55.44.46:80/subscriptions

# Backend IA
PYTHON_BACKEND_URL=https://api-ia.bodasdehoy.com
NEXT_PUBLIC_BACKEND_URL=https://api-ia.bodasdehoy.com
# Local: NEXT_PUBLIC_BACKEND_URL=http://localhost:8030

# Chat/Copilot
NEXT_PUBLIC_CHAT=https://chat.bodasdehoy.com
# Test: NEXT_PUBLIC_CHAT=https://chat-test.bodasdehoy.com

# Servicios
NEXT_PUBLIC_CMS=https://cms.bodasdehoy.com
NEXT_PUBLIC_CUSTOMWEB=https://web.bodasdehoy.com/
NEXT_PUBLIC_EVENTSAPP=https://organizador.bodasdehoy.com

# Ollama (Local)
OLLAMA_PROXY_URL=http://127.0.0.1:11434
ENABLED_OLLAMA=1
```

---

## 🚨 Problemas Conocidos

### 1. Chat Test No Carga (502)
- **URL**: `https://chat-test.bodasdehoy.com`
- **Solución**: Usar `https://chat.bodasdehoy.com` o local `http://localhost:3210`

### 2. Ollama No Disponible
- **Error**: "Ollama no disponible"
- **Solución**: Configurar otros providers (OpenAI, Anthropic, Google)

### 3. Backend IA EMPTY_RESPONSE
- **Error**: `error_code: "EMPTY_RESPONSE"`
- **Ver**: `BUG_REPORT_BACKEND_IA_OLLAMA.md`

---

## 📚 Documentación Relacionada

- **IPs y URLs Backend IA**: `IPs_Y_URLs_BACKEND_IA.md`
- **URLs Verificación**: `URLS_VERIFICACION.md`
- **URLs Rápidas**: `URLS_RAPIDAS.md`
- **Análisis 502**: `docs/ANALISIS-502-VPN.md`
- **Bug Report IA**: `BUG_REPORT_BACKEND_IA_OLLAMA.md`
