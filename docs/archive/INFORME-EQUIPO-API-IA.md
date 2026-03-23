# 🚨 INFORME CRÍTICO: Problemas en api-ia.bodasdehoy.com

**Fecha**: 2026-02-11
**Investigador**: Claude Code
**Prioridad**: 🔴 **CRÍTICA**
**Componente**: api-ia.bodasdehoy.com
**Developer afectado**: `bodasdehoy`

---

## 🎯 HALLAZGO PRINCIPAL - ROOT CAUSE

### ❌ API Key INCORRECTA configurada para Anthropic

**Problema**: La API key configurada para Anthropic en el developer `bodasdehoy` es una **API key de OpenAI**, no de Anthropic.

**Evidencia**:
```json
// Endpoint: https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-credentials
{
  "anthropic": {
    "apiKey": "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",
    "enabled": true
  }
}
```

**Identificación del error**:
- ❌ API keys de **OpenAI** empiezan con: `sk-proj-`
- ✅ API keys de **Anthropic** deberían empezar con: `sk-ant-`

**Resultado**:
```json
{
  "error": "Error de autenticación con el proveedor de IA. La API key configurada no es válida.",
  "error_code": "AUTH_ERROR",
  "upstream_status": 401  ← Anthropic rechaza la key porque es de OpenAI
}
```

---

## 📊 Resumen de Tests Realizados

**Total de tests**: 29
**Herramientas**: curl, análisis de OpenAPI spec, inspección de endpoints
**Tiempo de investigación**: ~2 horas

---

## 🔍 Hallazgos Detallados

### 1. Estado del Servicio
✅ **api-ia.bodasdehoy.com está OPERATIVO**
- Health check: ✅ `{"status": "healthy"}`
- Versión: `2.1.0`
- WebSocket jobs: ✅ Funcionando
- GraphQL proxy: ✅ Funcionando

---

### 2. Configuración del Developer "bodasdehoy"

#### ✅ Configuración de Branding (OK)
```json
{
  "developer": "bodasdehoy",
  "name": "Bodas de Hoy",
  "enabled": true,
  "color_primary": "#D4AF37",
  "color_secondary": "#8B7355"
}
```

#### ❌ Configuración de AI (INCORRECTA)

**Endpoint**: `/api/developers/bodasdehoy/ai-config`
```json
{
  "provider": "ollama",  ← Provider por defecto
  "model": "qwen2.5:7b",
  "auto_routing_enabled": true,
  "api_key_configured": true,
  "available_providers": ["ollama", "openai", "anthropic"]
}
```

**Endpoint**: `/api/providers/bodasdehoy`
```json
{
  "providers": [
    {
      "provider": "groq",
      "enabled": true,
      "has_key": true,
      "model": "llama-3.1-70b-versatile"
    },
    {
      "provider": "anthropic",
      "enabled": true,
      "has_key": true,  ← Dice que tiene key...
      "model": "claude-3-5-sonnet-20241022"
    }
  ],
  "fallback_order": ["groq", "anthropic"]
}
```

**Endpoint**: `/api/developers/bodasdehoy/ai-credentials`
⚠️ **AQUÍ ESTÁ EL PROBLEMA**:
```json
{
  "anthropic": {
    "apiKey": "sk-proj-d0UqDqL-...",  ← ❌ API KEY DE OPENAI!
    "enabled": true,
    "model": null
  },
  "groq": {
    "apiKey": "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",
    "enabled": true
  }
}
```

---

### 3. Resultados de Tests por Provider

#### ❌ Anthropic - AUTH_ERROR 401
**Test realizado**:
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"claude-3-5-sonnet-20241022"}'
```

**Resultado**:
```json
{
  "success": false,
  "error": "Error de autenticación con el proveedor de IA. La API key configurada no es válida.",
  "error_code": "AUTH_ERROR",
  "trace_id": "fb7f5647",
  "provider": "anthropic",
  "model": "claude-3-opus-20240229",
  "upstream_status": 401,  ← Anthropic rechaza la key
  "timestamp": "2026-02-11T11:09:16.455075"
}
```

**Modelos probados** (todos fallan con 401):
- ❌ `claude-3-5-sonnet-20241022` → AUTH_ERROR 401
- ❌ `claude-3-opus-20240229` (default) → AUTH_ERROR 401
- ❌ `claude-3-haiku-20240307` → AUTH_ERROR 401

---

#### ⚠️ Groq - EMPTY_RESPONSE
**Test realizado**:
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/groq" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"llama-3.1-70b-versatile"}'
```

**Resultado**:
```json
{
  "success": false,
  "error": "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.",
  "error_code": "EMPTY_RESPONSE",
  "trace_id": "138cc332",
  "provider": "groq",
  "model": "llama-3.1-70b-versatile",
  "upstream_status": null
}
```

**Análisis**:
- La API key de Groq es válida (`gsk_87V0...`)
- No hay error de autenticación 401
- El problema parece ser en el orchestrator o en el parsing de la respuesta

---

#### ⚠️ OpenAI - EMPTY_RESPONSE
**Test realizado**:
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/openai" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"gpt-4o-mini"}'
```

**Resultado**:
```json
{
  "success": false,
  "error": "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.",
  "error_code": "EMPTY_RESPONSE",
  "trace_id": "0d979b2d",
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

---

#### ⚠️ Auto-routing - EMPTY_RESPONSE
**Test realizado**:
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

**Resultado**:
```json
{
  "success": false,
  "error": "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.",
  "error_code": "EMPTY_RESPONSE",
  "provider": "groq",  ← Intentó con Groq (primer fallback)
  "model": "llama-3.1-70b-versatile"
}
```

---

### 4. Comparación con Otro Developer

#### ⚠️ Developer "eventosorganizador" - EMPTY_RESPONSE (no AUTH_ERROR)
**Test realizado**:
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "X-Development: eventosorganizador" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"claude-3-opus-20240229"}'
```

**Resultado**:
```json
{
  "success": false,
  "error": "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.",
  "error_code": "EMPTY_RESPONSE",  ← Diferente! No es AUTH_ERROR
  "provider": "anthropic",
  "model": "claude-3-opus-20240229",
  "upstream_status": null  ← No hay 401
}
```

**Conclusión**: El developer `eventosorganizador` NO tiene error de autenticación, lo que sugiere que sus credenciales podrían estar correctas pero hay otro problema (orchestrator).

---

## 🔧 Problemas Identificados

### 🔴 Problema 1: API Key Incorrecta para Anthropic
**Severidad**: CRÍTICA
**Developer**: `bodasdehoy`
**Provider**: `anthropic`
**Síntoma**: Error 401 Unauthorized de Anthropic
**Causa raíz**: API key configurada es de OpenAI (`sk-proj-...`), no de Anthropic (`sk-ant-...`)

**Solución**:
```json
// Reemplazar en la configuración de bodasdehoy:
{
  "anthropic": {
    "apiKey": "sk-ant-api03-...",  ← API key VÁLIDA de Anthropic
    "enabled": true,
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

---

### 🟡 Problema 2: Orchestrator devuelve EMPTY_RESPONSE
**Severidad**: ALTA
**Developer**: `bodasdehoy` (y posiblemente otros)
**Providers afectados**: `groq`, `openai`, `auto`
**Síntoma**: "El orchestrator devolvió una respuesta vacía o genérica"
**Causa raíz**: Desconocida - requiere investigación del equipo api-ia

**Posibles causas**:
1. Error en el parsing de respuestas del orchestrator
2. Timeout en la comunicación con el orchestrator
3. Orchestrator no configurado correctamente para estos providers
4. Problemas de serialización/deserialización de mensajes

**Trace IDs para debugging**:
- Groq: `138cc332`, `9cc5aaea`
- OpenAI: `0d979b2d`
- Auto: `b67c9ab2`

---

### ⚠️ Problema 3: Seguridad - API Keys Expuestas
**Severidad**: MEDIA
**Endpoint**: `/api/developers/{developer_id}/ai-credentials`
**Síntoma**: Endpoint devuelve API keys en texto plano sin autenticación

**Evidencia**:
```bash
# Sin ninguna autenticación:
curl https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-credentials

# Devuelve:
{
  "anthropic": {
    "apiKey": "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"
  }
}
```

**Recomendación**: Este endpoint debería:
1. Requerir autenticación (Bearer token, API key, etc.)
2. Limitar acceso solo a admins
3. Ocultar API keys (mostrar solo últimos 4 caracteres)
4. Registrar accesos en audit log

---

## 📋 Acciones Requeridas (Por Prioridad)

### 🔴 CRÍTICO - Reemplazar API Key de Anthropic
**Responsable**: Equipo API-IA / DevOps
**Deadline**: URGENTE
**Acción**:
1. Obtener API key VÁLIDA de Anthropic (empezar con `sk-ant-`)
2. Actualizar configuración de developer `bodasdehoy`:
   ```bash
   # Endpoint para actualizar (requiere auth admin):
   PUT /api/developers/bodasdehoy/ai-credentials
   {
     "anthropic": {
       "apiKey": "sk-ant-api03-NUEVA_KEY_VALIDA",
       "enabled": true,
       "model": "claude-3-5-sonnet-20241022"
     }
   }
   ```
3. Verificar con test:
   ```bash
   curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
     -H "X-Development: bodasdehoy" \
     -d '{"messages":[{"role":"user","content":"test"}],"model":"claude-3-5-sonnet-20241022"}'
   ```
4. Resultado esperado: Respuesta exitosa de Claude (no error 401)

---

### 🟡 ALTO - Investigar EMPTY_RESPONSE del Orchestrator
**Responsable**: Equipo API-IA Backend
**Deadline**: 1-2 días
**Acción**:
1. Revisar logs del orchestrator para los trace_ids:
   - `138cc332` (Groq)
   - `0d979b2d` (OpenAI)
   - `b67c9ab2` (Auto)
2. Verificar que el orchestrator esté configurado para providers Groq/OpenAI
3. Revisar serialización/deserialización de mensajes
4. Verificar timeouts de comunicación
5. Probar manualmente llamadas a Groq y OpenAI desde el orchestrator

**Debugging sugerido**:
```python
# En el orchestrator, agregar logs antes de devolver respuesta:
logger.info(f"Orchestrator response: {response}")
logger.info(f"Response type: {type(response)}")
logger.info(f"Response content: {response.content if hasattr(response, 'content') else 'N/A'}")
```

---

### 🟢 MEDIO - Asegurar Endpoint de Credenciales
**Responsable**: Equipo API-IA Security
**Deadline**: 1 semana
**Acción**:
1. Agregar autenticación al endpoint `/api/developers/{developer_id}/ai-credentials`
2. Limitar acceso solo a admins autorizados
3. Ocultar API keys completas (mostrar solo `sk-ant-***...***1234`)
4. Implementar audit logging para accesos
5. Agregar rate limiting

---

## ✅ Tests de Verificación Post-Fix

Una vez que se reemplace la API key de Anthropic:

### Test 1: Chat básico con Anthropic
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"Hola, di test exitoso si funcionas"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": false
  }'
```

**Resultado esperado**:
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "test exitoso"
    }
  }],
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022"
}
```

---

### Test 2: Streaming con Anthropic
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"Cuenta del 1 al 5"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": true
  }'
```

**Resultado esperado**: Stream SSE con eventos `data: {...}` y `data: [DONE]`

---

### Test 3: Copilot End-to-End
1. Ir a http://localhost:3210
2. Iniciar sesión
3. Enviar: "Hola, ¿cuántos eventos tengo?"
4. Verificar respuesta de Claude con información real

---

## 📊 Matriz de Estado de Providers

| Provider | API Key Configurada | API Key Válida | Estado | Acción Requerida |
|----------|---------------------|----------------|--------|------------------|
| **Anthropic** | ✅ Sí | ❌ **No (es de OpenAI)** | ❌ Error 401 | 🔴 Reemplazar key |
| **Groq** | ✅ Sí | ✅ Sí | ⚠️ EMPTY_RESPONSE | 🟡 Investigar orchestrator |
| **OpenAI** | ❓ ? | ❓ ? | ⚠️ EMPTY_RESPONSE | 🟡 Investigar orchestrator |
| **Ollama** | ✅ Sí (local) | ✅ Sí | ❓ No probado | 🟢 OK (probablemente) |

---

## 📁 Archivos de Evidencia

**Scripts de investigación**:
- `/tmp/investigacion-profunda-api-ia.sh` - 29 tests exhaustivos

**Logs y resultados**:
- Todos los trace_ids registrados en el informe
- Screenshots de respuestas disponibles bajo request

**Documentación generada**:
- Este informe: `INFORME-EQUIPO-API-IA.md`
- Documentación de usuario: `DIAGNOSTICO-API-IA-COPILOT.md`
- Sistema de fallback: `SISTEMA-FALLBACK-COPILOT.md`

---

## 🔬 Metodología de Investigación

**Tests realizados**:
1. ✅ Health checks (health, root endpoint)
2. ✅ OpenAPI spec analysis
3. ✅ Security schemes verification
4. ✅ Tests con diferentes headers (X-Development, Development, Authorization)
5. ✅ Tests con diferentes providers (anthropic, groq, openai, auto)
6. ✅ Tests con diferentes modelos
7. ✅ Tests streaming vs non-streaming
8. ✅ CORS verification
9. ✅ Endpoints de configuración (config, ai-config, ai-credentials, providers)
10. ✅ Comparación con otro developer (eventosorganizador)

**Herramientas usadas**:
- curl (HTTP client)
- jq (JSON processor)
- grep (pattern matching)
- OpenAPI spec analysis

---

## 📞 Contacto

**Frontend Team**: @juancarlosparra
**Fecha de investigación**: 2026-02-11
**Tiempo invertido**: ~2 horas
**Script completo**: `/tmp/investigacion-profunda-api-ia.sh`

---

## 🎯 TL;DR (Resumen Ejecutivo)

1. 🔴 **API key de Anthropic es INCORRECTA** - Es una key de OpenAI, no de Anthropic
2. 🟡 **Orchestrator devuelve EMPTY_RESPONSE** para Groq/OpenAI - Requiere investigación
3. ⚠️ **Endpoint de credenciales NO está protegido** - Expone API keys sin autenticación
4. ✅ **Servicio api-ia está operativo** - No hay problemas de infraestructura

**Próximo paso inmediato**: Reemplazar la API key de Anthropic en la configuración de `bodasdehoy` con una key válida que empiece con `sk-ant-`

---

**Última actualización**: 2026-02-11 por Claude Code
**Estado**: Investigación completa - Esperando acción del equipo api-ia
