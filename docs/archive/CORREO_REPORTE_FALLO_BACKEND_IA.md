# Reporte de Fallo - Copilot Backend IA - ✅ RESUELTO

---

**Para:** Equipo Backend / DevOps
**Asunto:** [RESUELTO] Copilot Chat - Error de conexión con Backend IA (api-ia.bodasdehoy.com)
**Fecha:** 2026-01-28
**Prioridad:** ~~Alta~~ Resuelto
**Actualizado:** 2026-01-28 00:40 UTC

---

## ✅ ESTADO: RESUELTO

El equipo de Backend configuró correctamente los proveedores en `/webapi/chat/auto`.

**Prueba V8 (después del fix):**
```
=== ESTADO DEL CHAT ===
   Error Backend IA: ✅ NO
   No Providers: ✅ NO
   Input disponible: ✅ SÍ
   Mensaje bienvenida: ✅ SÍ
```

---

## Resumen del Problema (Ya Resuelto)

El chat Copilot integrado en **app-test.bodasdehoy.com** y **chat-test.bodasdehoy.com** mostraba el error **"Backend IA: Error de conexión"**.

**Causa:** El endpoint `/webapi/chat/auto` no tenía proveedores configurados.

**Solución aplicada por Backend:** Configuración de proveedores (groq/anthropic) para el whitelabel bodasdehoy.

---

## DIAGNÓSTICO DETALLADO (Nuevo)

### Prueba de Endpoints del Backend IA

| Endpoint | Estado | Detalle |
|----------|--------|---------|
| `api-ia.bodasdehoy.com/api/providers/bodasdehoy` | ✅ 200 OK | Proveedores groq y anthropic configurados |
| `api-ia.bodasdehoy.com/api/chat/send` | ✅ 200 OK | Responde con groq/llama-3.3-70b-versatile |
| `api-ia.bodasdehoy.com/webapi/chat/auto` | ❌ Error | "No hay proveedores disponibles" |
| `app-test.bodasdehoy.com/api/copilot/chat` | ❌ 503 | IA_BACKEND_UNAVAILABLE |
| `localhost:8080/api/copilot/chat` | ❌ 503 | IA_BACKEND_UNAVAILABLE |

### Error del Endpoint `/webapi/chat/auto`:
```json
{
  "error": "No hay proveedores disponibles. Por favor, configura al menos una API key (OpenAI, Anthropic, OpenRouter, etc.) o asegúrate de que Ollama esté corriendo.",
  "error_code": "NO_PROVIDERS_AVAILABLE",
  "trace_id": "628447e0"
}
```

### El Problema:
El archivo `apps/web/pages/api/copilot/chat.ts` (línea 357) hace la llamada a:
```javascript
const backendUrl = `${PYTHON_BACKEND_URL}/webapi/chat/${provider}`;
// Resulta en: https://api-ia.bodasdehoy.com/webapi/chat/auto
```

**Pero el endpoint que funciona es `/api/chat/send`, NO `/webapi/chat/auto`.**

### Solución Requerida:
Cambiar la URL del backend en el proxy de Next.js para usar `/api/chat/send` en lugar de `/webapi/chat/auto`, O configurar las API keys de proveedores en el backend para que `/webapi/chat/auto` funcione.

---

## Pruebas Realizadas

### 1. Backend API-IA - FUNCIONA ✅

```bash
# Test de proveedores
curl -s "https://api-ia.bodasdehoy.com/api/providers/bodasdehoy"
```

**Respuesta:**
```json
{
  "success": true,
  "providers": [
    {"provider": "groq", "enabled": true, "has_key": true},
    {"provider": "anthropic", "enabled": true, "has_key": true}
  ],
  "active_count": 2
}
```

```bash
# Test de chat directo
curl -X POST "https://api-ia.bodasdehoy.com/api/chat/send" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"message":"Hola","session_id":"test123"}'
```

**Respuesta:** ✅ El bot responde correctamente con groq/llama-3.3-70b-versatile

### 2. Frontend Copilot - FALLA ❌

- URL: `app-test.bodasdehoy.com` → Copilot como iframe
- El iframe carga: `chat-test.bodasdehoy.com/bodasdehoy/chat?embed=1&embedded=1&minimal=1`
- **Error visible:** "Backend IA: Error de conexión" con botón "Reintentar"

### 3. Prueba con Usuario Autenticado

Se probó con usuario correctamente autenticado (no Guest):
- ✅ Usuario autenticado como "UD" (Usuario Dev)
- ✅ Copilot se abre correctamente
- ✅ Se puede escribir y enviar mensajes
- ❌ **Error persiste:** "Backend IA: Error de conexión"

**Conclusión:** El problema NO es de autenticación.

---

## Diagnóstico

El error "Backend IA: Error de conexión" se debe a que el proxy de Next.js (`/api/copilot/chat`) llama al endpoint incorrecto del backend.

### ✅ CAUSA RAÍZ IDENTIFICADA:

**El proxy llama a `/webapi/chat/auto` pero debería llamar a `/api/chat/send`.**

El backend IA tiene dos sistemas de chat:
1. `/api/chat/send` → Usa credenciales del whitelabel (groq/anthropic) → **FUNCIONA**
2. `/webapi/chat/auto` → Usa variables de entorno (OPENAI_API_KEY, etc.) → **NO CONFIGURADO**

### Archivo afectado:
`apps/web/pages/api/copilot/chat.ts` línea 357:
```javascript
const backendUrl = `${PYTHON_BACKEND_URL}/webapi/chat/${provider}`;
```

---

## Evidencia Adjunta

### Capturas de pantalla:
- `evidencia_fallo_chat/app-V7-02-copilot-abierto.png` - Copilot con error visible
- `evidencia_fallo_chat/app-V7-04-mensaje-enviado.png` - Error después de enviar mensaje

### Logs:
- `/tmp/app-test-v7.log` - Log completo de la prueba automatizada

### Scripts de prueba:
- `apps/web/scripts/app-test-bypass-v7.js` - Script Playwright para reproducir el problema
- `apps/web/scripts/test-backend-ia-endpoint.js` - Script Node.js para diagnosticar endpoints del backend

---

## Información Técnica

**Contexto del Chat (visible en UI):**
```
Role Settings: 0
Plugin Settings: 12,268
History Summary: 0
Chat Messages: 16
Total Used: 12,284
Remaining: 387,716
Total Available: 400,000
```

**URLs involucradas:**
- Frontend App: `https://app-test.bodasdehoy.com`
- Iframe Chat: `https://chat-test.bodasdehoy.com/bodasdehoy/chat`
- Backend IA: `https://api-ia.bodasdehoy.com`

**Cloudflare Tunnels:**
- `chat-test.bodasdehoy.com` → `localhost:3210` (Copilot/LobeChat)
- `app-test.bodasdehoy.com` → `localhost:8080` (Next.js Web)

---

## Acciones Requeridas

### OPCIÓN A: Modificar el Proxy de Next.js (Recomendado)
Cambiar `apps/web/pages/api/copilot/chat.ts` línea 357 de:
```javascript
const backendUrl = `${PYTHON_BACKEND_URL}/webapi/chat/${provider}`;
```
A:
```javascript
const backendUrl = `${PYTHON_BACKEND_URL}/api/chat/send`;
```

### OPCIÓN B: Configurar el Backend IA
Configurar las API keys como variables de entorno en el backend para que `/webapi/chat/auto` funcione:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENROUTER_API_KEY`
- O habilitar Ollama

### Verificación rápida:
```bash
# Este endpoint FUNCIONA:
curl -X POST "https://api-ia.bodasdehoy.com/api/chat/send" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{"message":"Hola","session_id":"test123"}'

# Este endpoint FALLA:
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"ping"}]}'
```

---

## Cómo Reproducir

1. Abrir `https://app-test.bodasdehoy.com`
2. En la consola del navegador ejecutar:
   ```javascript
   sessionStorage.setItem('dev_bypass', 'true');
   location.reload();
   ```
3. Click en botón "Copilot" en el header
4. Observar el error "Backend IA: Error de conexión"
5. Intentar enviar un mensaje - no hay respuesta

---

**Contacto:** [Tu nombre/email]
**Repositorio:** AppBodasdehoy.com
**Branch:** feature/nextjs-15-migration

---

*Este reporte fue generado con pruebas automatizadas usando Playwright.*
