# 🔍 SOLICITUD DE INVESTIGACIÓN: api-ia.bodasdehoy.com y api2.eventosorganizador.com

**Fecha**: 2026-02-11
**Solicitado por**: Frontend Team (@juancarlosparra)
**Para**: Equipo api-ia + Equipo api2
**Prioridad**: 🔴 **URGENTE**
**Developer afectado**: `bodasdehoy`

---

## 📋 CONTEXTO

El Copilot de `bodasdehoy` no está funcionando. Realizamos investigación exhaustiva desde el frontend y encontramos varios problemas potenciales en las credenciales.

**IMPORTANTE**: Es posible que los endpoints hayan cambiado en las últimas **48-56 horas** y nuestras consultas estén obsoletas.

**Necesitamos que verifiquen**:
1. ✅ Si las credenciales están correctamente configuradas en sus sistemas
2. ✅ Si hay algún error o corrupción de datos
3. ✅ Si se confundieron credenciales entre providers
4. ✅ Si nuestras consultas están usando endpoints incorrectos
5. ✅ Si algo cambió recientemente que pueda causar estos errores

---

## 🔍 CONSULTAS EXACTAS REALIZADAS (PARA REPRODUCCIÓN)

A continuación están TODAS las consultas que realizamos. Por favor **reprodúzcanlas en su lado** para verificar si obtienen los mismos resultados.

---

### 📡 SECCIÓN 1: Consultas a api-ia.bodasdehoy.com

#### Consulta 1.1: Health Check
```bash
curl -s https://api-ia.bodasdehoy.com/health
```

**Respuesta que obtuvimos**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-11T11:09:13.772306",
  "services": {
    "websockets": "0 active",
    "graphql_proxy": "running"
  }
}
HTTP Status: 200
```

**Pregunta para el equipo**: ¿Es correcta esta respuesta?

---

#### Consulta 1.2: Info del Servidor
```bash
curl -s https://api-ia.bodasdehoy.com/
```

**Respuesta que obtuvimos**:
```json
{
  "message": "Lobe Chat Harbor - Backend Middleware",
  "version": "2.1.0",
  "status": "running"
}
HTTP Status: 200
```

**Pregunta para el equipo**: ¿La versión 2.1.0 es la correcta?

---

#### Consulta 1.3: Configuración del Developer
```bash
curl -s https://api-ia.bodasdehoy.com/api/config/bodasdehoy
```

**Respuesta que obtuvimos**:
```json
{
  "developer": "bodasdehoy",
  "name": "Bodas de Hoy",
  "enabled": true,
  "color_primary": "#D4AF37",
  "color_secondary": "#8B7355"
}
HTTP Status: 200
```

**Pregunta para el equipo**: ¿Es correcta esta configuración?

---

#### Consulta 1.4: AI Config del Developer
```bash
curl -s https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-config
```

**Respuesta que obtuvimos**:
```json
{
  "provider": "ollama",
  "model": "qwen2.5:7b",
  "auto_routing_enabled": true,
  "api_key_configured": true,
  "available_providers": ["ollama", "openai", "anthropic"]
}
HTTP Status: 200
```

**Pregunta para el equipo**:
- ¿Por qué el provider por defecto es "ollama"?
- ¿Por qué dice que hay API key configurada si luego falla?

---

#### Consulta 1.5: Credenciales de IA (⚠️ CRÍTICA)
```bash
curl -s https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-credentials
```

**Respuesta que obtuvimos**:
```json
{
  "success": true,
  "credentials": {
    "anthropic": {
      "apiKey": "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",
      "enabled": true,
      "model": null,
      "models": [],
      "baseURL": null
    },
    "groq": {
      "apiKey": "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",
      "enabled": true,
      "model": null,
      "models": [],
      "baseURL": null
    }
  }
}
HTTP Status: 200
```

**PROBLEMAS ENCONTRADOS**:
1. ⚠️ La API key de "anthropic" empieza con `sk-proj-` (formato de OpenAI)
2. ⚠️ API keys de Anthropic deberían empezar con `sk-ant-`

**PREGUNTAS CRÍTICAS**:
- ¿Es posible que se hayan confundido las credenciales?
- ¿La key de Anthropic debería ser la misma que la de OpenAI?
- ¿Hubo algún cambio en cómo se almacenan las credenciales?
- ¿Hay logs de cuándo se actualizó esta configuración?

---

#### Consulta 1.6: Providers Configurados
```bash
curl -s https://api-ia.bodasdehoy.com/api/providers/bodasdehoy
```

**Respuesta que obtuvimos**:
```json
{
  "success": true,
  "development": "bodasdehoy",
  "providers": [
    {
      "provider": "groq",
      "enabled": true,
      "has_key": true,
      "model": "llama-3.1-70b-versatile",
      "base_url": "https://api.groq.com/openai/v1"
    },
    {
      "provider": "anthropic",
      "enabled": true,
      "has_key": true,
      "model": "claude-3-5-sonnet-20241022",
      "base_url": null
    }
  ],
  "active_count": 2,
  "fallback_order": ["groq", "anthropic"]
}
HTTP Status: 200
```

**PREGUNTA**: ¿Por qué dice `has_key: true` si luego falla la autenticación?

---

#### Consulta 1.7: Chat con Anthropic (SIN Headers)
```bash
curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": false
  }'
```

**Respuesta que obtuvimos**:
```json
{
  "success": false,
  "error": "Error de autenticación con el proveedor de IA. La API key configurada no es válida.",
  "error_code": "AUTH_ERROR",
  "trace_id": "935aaaf0",
  "provider": "anthropic",
  "model": "claude-3-opus-20240229",
  "upstream_status": 401,
  "timestamp": "2026-02-11T11:09:15.823155"
}
HTTP Status: 503
```

**TRACE ID**: `935aaaf0`

**PREGUNTA**: ¿Pueden revisar sus logs con este trace_id y verificar qué key se usó internamente?

---

#### Consulta 1.8: Chat con Anthropic (CON Header X-Development)
```bash
curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": false
  }'
```

**Respuesta que obtuvimos**:
```json
{
  "success": false,
  "error": "Error de autenticación con el proveedor de IA. La API key configurada no es válida.",
  "error_code": "AUTH_ERROR",
  "trace_id": "fb7f5647",
  "provider": "anthropic",
  "model": "claude-3-opus-20240229",
  "upstream_status": 401
}
HTTP Status: 503
```

**TRACE ID**: `fb7f5647`

**PREGUNTA**: ¿El header `X-Development: bodasdehoy` es correcto? ¿O cambió?

---

#### Consulta 1.9: Chat con Anthropic (Streaming)
```bash
curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": true
  }'
```

**Respuesta que obtuvimos**:
```json
{
  "success": false,
  "error": "API key de anthropic no configurada para este developer",
  "error_code": "AUTH_ERROR",
  "trace_id": "1bab9c32",
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "upstream_status": null
}
HTTP Status: 503
```

**TRACE ID**: `1bab9c32`

**OBSERVACIÓN**: Con `stream: true` da un error diferente: "API key de anthropic no configurada"

**PREGUNTA**: ¿Por qué con stream da error diferente? ¿Usa diferente lógica?

---

#### Consulta 1.10: Chat con Groq
```bash
curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/groq" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "model": "llama-3.1-70b-versatile",
    "stream": false
  }'
```

**Respuesta que obtuvimos**:
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
HTTP Status: 503
```

**TRACE ID**: `138cc332`

**PREGUNTA**: ¿El orchestrator está configurado para Groq? ¿Pueden revisar logs?

---

#### Consulta 1.11: Chat con OpenAI
```bash
curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/openai" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "model": "gpt-4o-mini",
    "stream": false
  }'
```

**Respuesta que obtuvimos**:
```json
{
  "success": false,
  "error": "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.",
  "error_code": "EMPTY_RESPONSE",
  "trace_id": "0d979b2d",
  "provider": "openai",
  "model": "gpt-4o-mini"
}
HTTP Status: 503
```

**TRACE ID**: `0d979b2d`

---

#### Consulta 1.12: Auto-routing
```bash
curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "stream": false
  }'
```

**Respuesta que obtuvimos**:
```json
{
  "success": false,
  "error": "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.",
  "error_code": "EMPTY_RESPONSE",
  "trace_id": "b67c9ab2",
  "provider": "groq",
  "model": "llama-3.1-70b-versatile"
}
HTTP Status: 503
```

**TRACE ID**: `b67c9ab2`

**PREGUNTA**: ¿El auto-routing está funcionando? ¿Por qué intenta Groq primero?

---

### 📡 SECCIÓN 2: Consultas DIRECTAS a APIs de Proveedores

**OBJETIVO**: Verificar si las API keys funcionan directamente con los proveedores.

#### Consulta 2.1: Test Directo a OpenAI
```bash
curl -s https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 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" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 5
  }'
```

**Respuesta que obtuvimos**:
```json
{
  "error": {
    "message": "You exceeded your current quota, please check your plan and billing details.",
    "type": "insufficient_quota",
    "code": "insufficient_quota"
  }
}
HTTP Status: 429
```

**HALLAZGO**: La API key de OpenAI **NO tiene saldo/cuota**.

**PREGUNTA**: ¿Es esto esperado? ¿Hay otra key con saldo?

---

#### Consulta 2.2: Test Directo a Groq
```bash
curl -s https://api.groq.com/openai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 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" \
  -d '{
    "model": "llama-3.1-70b-versatile",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 10
  }'
```

**Respuesta que obtuvimos**:
```json
{
  "error": {
    "message": "The model `llama-3.1-70b-versatile` has been decommissioned and is no longer supported.",
    "type": "invalid_request_error",
    "code": "model_decommissioned"
  }
}
HTTP Status: 400
```

**HALLAZGO**: El modelo `llama-3.1-70b-versatile` **fue descomisionado** por Groq.

**PREGUNTA**: ¿Cuándo se actualizó por última vez la configuración de modelos?

---

#### Consulta 2.3: Modelos Disponibles en Groq (Ahora)
```bash
curl -s https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer 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"
```

**Respuesta que obtuvimos**:
```json
{
  "data": [
    {"id": "llama-3.3-70b-versatile", "active": true},
    {"id": "llama-3.1-8b-instant", "active": true},
    {"id": "groq/compound", "active": true},
    {"id": "openai/gpt-oss-120b", "active": true},
    ...
  ]
}
```

**HALLAZGO**: El modelo actual debería ser `llama-3.3-70b-versatile`.

---

#### Consulta 2.4: Test Directo a Anthropic
```bash
curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: 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" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "test"}]
  }'
```

**Respuesta que obtuvimos**:
```json
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "invalid x-api-key"
  },
  "request_id": "req_011CY2CudUnZMUUtM1pqm9LZ"
}
HTTP Status: 401
```

**HALLAZGO**: Anthropic rechaza la key porque **NO es una key de Anthropic**.

**REQUEST ID de Anthropic**: `req_011CY2CudUnZMUUtM1pqm9LZ`

---

### 📡 SECCIÓN 3: Consultas a api2.eventosorganizador.com

#### Consulta 3.1: Whitelabel Config desde API2
```bash
SUPPORT_KEY="VpKvdEFxVpdNFdErLK9aEGEaLbCqkz5atQGLH5KMJj8ucVp8kQbfwPdwbzJmtLR9"

curl -s -X POST "https://api2.eventosorganizador.com/graphql" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"query { getWhiteLabelConfig(development: \\\"bodasdehoy\\\", supportKey: \\\"$SUPPORT_KEY\\\") { success aiProvider aiModel aiApiKey errors { field message } } }\"}"
```

**Respuesta que obtuvimos**:
```json
{
  "errors": [{
    "message": "Usuario no autenticado o supportKey inválido"
  }]
}
```

**PREGUNTA**: ¿El supportKey cambió? ¿Es correcto el endpoint?

---

## 🎯 RESUMEN DE HALLAZGOS (Desde Frontend)

| Provider | API Key | Estado | Problema Encontrado |
|----------|---------|--------|---------------------|
| **Anthropic** | `sk-proj-...` | ❌ | Key es de OpenAI, no de Anthropic |
| **Groq** | `gsk_87V0...` | ⚠️ | Key válida, pero modelo descomisionado |
| **OpenAI** | `sk-proj-...` | ⚠️ | Key válida, pero sin cuota/saldo |

---

## ❓ PREGUNTAS CRÍTICAS PARA LOS EQUIPOS

### Para Equipo api-ia:

1. **Endpoints**: ¿Hubo algún cambio en los endpoints en las últimas 48-56 horas?
   - `/api/developers/{developer}/ai-credentials` - ¿Es correcto?
   - `/api/providers/{developer}` - ¿Es correcto?
   - `/webapi/chat/{provider}` - ¿Es correcto?

2. **Credenciales**: ¿Pueden verificar en su base de datos/configuración:
   - ¿Qué API key tienen almacenada para Anthropic de developer "bodasdehoy"?
   - ¿Es posible que se hayan confundido las keys entre providers?
   - ¿Hay logs de cuándo se actualizó la configuración?

3. **Orchestrator**: ¿Por qué devuelve "EMPTY_RESPONSE" para Groq y OpenAI?
   - ¿Está configurado correctamente?
   - ¿Hay logs para los trace_ids proporcionados?

4. **Headers**: ¿El header `X-Development: bodasdehoy` es correcto?
   - ¿O cambió a otro nombre?
   - ¿Se requiere autenticación adicional?

5. **Modelos**: ¿Hay proceso de actualización automática de modelos?
   - ¿Por qué sigue configurado `llama-3.1-70b-versatile`?

---

### Para Equipo api2:

1. **Whitelabel**: ¿El endpoint `getWhiteLabelConfig` es correcto?
   - ¿Cambió el nombre o ubicación?
   - ¿El supportKey es válido?

2. **Credenciales**: ¿Qué credenciales tienen almacenadas para "bodasdehoy"?
   - ¿Pueden verificar si son correctas?
   - ¿Hay algún sistema de sincronización con api-ia?

3. **Cambios recientes**: ¿Hubo algún cambio en:
   - Formato de credenciales
   - Endpoints de API
   - Sistema de autenticación
   - En las últimas 48-56 horas

---

## 📋 SOLICITUD DE VERIFICACIÓN

**Por favor verifiquen**:

1. ✅ **Reproduzcan las consultas** exactas que hicimos (arriba)
2. ✅ **Revisen sus logs** con los trace_ids proporcionados
3. ✅ **Verifiquen credenciales** en su base de datos
4. ✅ **Confirmen endpoints** que estamos usando son correctos
5. ✅ **Verifiquen cambios** en las últimas 48-56 horas

---

## 📊 TRACE IDS PARA REVISAR EN LOGS

| Provider | Trace ID | Error |
|----------|----------|-------|
| Anthropic | `935aaaf0` | AUTH_ERROR |
| Anthropic | `fb7f5647` | AUTH_ERROR |
| Anthropic | `1bab9c32` | AUTH_ERROR (stream) |
| Groq | `138cc332` | EMPTY_RESPONSE |
| Groq | `9cc5aaea` | EMPTY_RESPONSE |
| OpenAI | `0d979b2d` | EMPTY_RESPONSE |
| Auto | `b67c9ab2` | EMPTY_RESPONSE |

**Anthropic Request ID**: `req_011CY2CudUnZMUUtM1pqm9LZ`

---

## 🔧 POSIBLES CAUSAS (Hipótesis)

1. **Endpoints cambiaron** en las últimas 48-56 horas
2. **Credenciales se confundieron** entre providers (la de Anthropic es de OpenAI)
3. **Formato de almacenamiento cambió** y hay corrupción de datos
4. **Orchestrator no está configurado** correctamente para estos providers
5. **Headers requeridos cambiaron** (X-Development → otro)
6. **Sistema de whitelabel** no está sincronizando correctamente
7. **Modelos desactualizados** (Groq usa modelo viejo)
8. **Problema de saldo** en las APIs (OpenAI sin cuota)

---

## 📞 INFORMACIÓN DE CONTACTO

**Frontend Team**: @juancarlosparra
**Fecha de investigación**: 2026-02-11
**Tests realizados**: 40+ consultas diferentes
**Developer afectado**: `bodasdehoy`

**Scripts de reproducción**:
- `/tmp/investigacion-profunda-api-ia.sh`
- `/tmp/test-proveedores-directos.sh`
- `/tmp/analizar-whitelabel.sh`

---

## ⏰ URGENCIA

Este problema está **bloqueando completamente** el funcionamiento del Copilot para el developer `bodasdehoy`.

**Necesitamos respuesta urgente** para saber:
1. ¿Nuestras consultas son correctas?
2. ¿Las credenciales están bien configuradas en su lado?
3. ¿Hay algún error que necesiten corregir?

---

## 📋 CHECKLIST PARA EL EQUIPO

- [ ] Revisar logs con los trace_ids proporcionados
- [ ] Verificar credenciales en base de datos
- [ ] Confirmar que endpoints son correctos
- [ ] Verificar si hubo cambios recientes (48-56 horas)
- [ ] Reproducir las consultas exactas
- [ ] Verificar orchestrator para Groq/OpenAI
- [ ] Verificar headers requeridos
- [ ] Responder con hallazgos

---

**Gracias por su ayuda urgente en esta investigación.**

---

**Última actualización**: 2026-02-11
**Estado**: Esperando investigación de equipos api-ia y api2
