# 🧪 PRUEBAS DE REPRODUCCIÓN PARA EQUIPO api-ia

**Fecha**: 2026-02-11
**De**: Copilot LobeChat
**Para**: Equipo Backend api-ia
**Propósito**: Reproducir problemas reportados

---

## 📤 Enviar pruebas reales a Slack para que api-ia analice

Para **enviar por Slack** un resumen de pruebas reales contra api-ia (y que el equipo api-ia vea si el fallo es de ellos o nuestro):

```bash
bash scripts/test-api-ia-y-enviar-slack.sh
```

El script hace: (1) GET /health, (2) POST /webapi/chat/auto con mensaje real, (3) GET /api/config/bodasdehoy, y **envía el resumen a #copilot-api-ia**. Requiere `.env` con `SLACK_WEBHOOK_FRONTEND` o `SLACK_WEBHOOK` (opcional; hay default).

---

## ⚡ Test rápido: comprobar todos los proveedores

Para saber **si todos los proveedores de IA están funcionando correctamente** en api-ia:

```bash
./scripts/test-api-ia-providers.sh
```

O con otra URL/development:

```bash
BASE_URL="https://api-ia.bodasdehoy.com" DEVELOPMENT="bodasdehoy" ./scripts/test-api-ia-providers.sh
```

El script:
1. Comprueba que el servicio esté operativo (`/health`).
2. Obtiene los proveedores configurados (`/api/providers/{developer}`).
3. Llama a `/webapi/chat/{provider}` para **anthropic**, **groq**, **openai** y **auto**.
4. Muestra una tabla con estado **OK** / **FAIL** / **WARN** y el detalle (error_code, trace_id).

**Salida**: tabla resumen indicando qué proveedores responden bien y cuáles fallan (credenciales, modelo descomisionado, sin saldo, etc.).

---

## 📋 INSTRUCCIONES (comandos manuales)

Copien y peguen estos comandos **exactamente como están** en su terminal para reproducir los problemas que estamos reportando.

---

## ✅ SECCIÓN 1: VERIFICAR ESTADO DEL SERVICIO

### Test 1.1: Health Check

```bash
curl -s https://api-ia.bodasdehoy.com/health | jq '.'
```

**Resultado esperado**: `"status": "healthy"`

---

### Test 1.2: Info del Servidor

```bash
curl -s https://api-ia.bodasdehoy.com/ | jq '.'
```

**Resultado esperado**: `"version": "2.1.0"`, `"status": "running"`

---

## 🔑 SECCIÓN 2: VERIFICAR CREDENCIALES (CRÍTICO)

### Test 2.1: AI Config de bodasdehoy

```bash
curl -s https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-config | jq '.'
```

**Resultado actual**:
```json
{
  "provider": "ollama",
  "model": "qwen2.5:7b",
  "api_key_configured": true
}
```

---

### Test 2.2: Credenciales de IA ⚠️ **CRÍTICO**

```bash
curl -s https://api-ia.bodasdehoy.com/api/developers/bodasdehoy/ai-credentials | jq '.'
```

**Resultado actual**:
```json
{
  "success": true,
  "credentials": {
    "anthropic": {
      "apiKey": "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"
    },
    "groq": {
      "apiKey": "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"
    }
  }
}
```

### ❌ **PROBLEMA DETECTADO:**

- **Key de Anthropic empieza con**: `sk-proj-` ← Esto es formato **OpenAI**
- **Debería empezar con**: `sk-ant-` ← Formato **Anthropic**

**¿Pueden verificar?**:
1. ¿Qué key tienen almacenada en su base de datos para Anthropic?
2. ¿Es posible que se confundieron las keys entre providers?
3. ¿Cuándo fue la última vez que actualizaron esta configuración?

---

### Test 2.3: Providers Configurados

```bash
curl -s https://api-ia.bodasdehoy.com/api/providers/bodasdehoy | jq '.'
```

**Resultado actual**:
```json
{
  "providers": [
    {
      "provider": "groq",
      "model": "llama-3.1-70b-versatile"
    },
    {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022"
    }
  ]
}
```

### ❌ **PROBLEMA DETECTADO:**

- **Modelo de Groq**: `llama-3.1-70b-versatile` ← **DESCOMISIONADO**
- **Modelo correcto**: `llama-3.3-70b-versatile`

---

## 🔬 SECCIÓN 3: TESTS DIRECTOS A LOS PROVIDERS

Estos tests llaman **directamente** a OpenAI, Anthropic y Groq usando las keys que tienen configuradas.

### Test 3.1: Probar key actual contra OpenAI

```bash
curl -s https://api.openai.com/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer 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' \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 5
  }' | jq '.'
```

**Resultado esperado**:
```json
{
  "error": {
    "message": "You exceeded your current quota",
    "type": "insufficient_quota",
    "code": "insufficient_quota"
  }
}
```

**Conclusión**: La key de OpenAI es válida pero **no tiene saldo**.

---

### Test 3.2: Probar key actual contra Anthropic

```bash
curl -s https://api.anthropic.com/v1/messages \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: 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' \
  -H 'anthropic-version: 2023-06-01' \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "test"}]
  }' | jq '.'
```

**Resultado esperado**:
```json
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "invalid x-api-key"
  }
}
```

**Conclusión**: Anthropic **rechaza** la key porque **NO es una key de Anthropic** (es de OpenAI).

---

### Test 3.3: Probar modelo actual contra Groq

```bash
curl -s https://api.groq.com/openai/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer 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' \
  -d '{
    "model": "llama-3.1-70b-versatile",
    "messages": [{"role": "user", "content": "test"}],
    "max_tokens": 10
  }' | jq '.'
```

**Resultado esperado**:
```json
{
  "error": {
    "message": "The model `llama-3.1-70b-versatile` has been decommissioned",
    "type": "invalid_request_error",
    "code": "model_decommissioned"
  }
}
```

**Conclusión**: El modelo **fue descomisionado** por Groq.

---

### Test 3.4: Ver modelos disponibles en Groq (ahora)

```bash
curl -s https://api.groq.com/openai/v1/models \
  -H 'Authorization: Bearer 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' \
  | jq '.data[] | select(.id | contains("llama")) | .id'
```

**Resultado esperado**:
```
"llama-3.3-70b-versatile"  ← Este es el modelo actual
"llama-3.1-8b-instant"
...
```

**Conclusión**: Deberían actualizar a `llama-3.3-70b-versatile`.

---

## 🔌 SECCIÓN 4: TESTS A SUS ENDPOINTS DE CHAT

Estos tests llaman a **sus endpoints** para verificar cómo responden.

### Test 4.1: Chat con Anthropic (SIN stream)

```bash
curl -s -X POST 'https://api-ia.bodasdehoy.com/webapi/chat/anthropic' \
  -H 'Content-Type: application/json' \
  -H 'X-Development: bodasdehoy' \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": false
  }' | jq '.'
```

**Resultado actual**:
```json
{
  "success": false,
  "error": "Error de autenticación con el proveedor de IA",
  "error_code": "AUTH_ERROR",
  "trace_id": "7e45e918",
  "upstream_status": 401
}
```

**Por favor revisen en sus logs**: Trace ID `7e45e918`

**Pregunta**: ¿Qué key usaron internamente cuando hicieron la llamada a Anthropic?

---

### Test 4.2: Chat con Groq

```bash
curl -s -X POST 'https://api-ia.bodasdehoy.com/webapi/chat/groq' \
  -H 'Content-Type: application/json' \
  -H 'X-Development: bodasdehoy' \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "model": "llama-3.1-70b-versatile",
    "stream": false
  }' | jq '.'
```

**Resultado actual**:
```json
{
  "success": false,
  "error": "El orchestrator devolvió una respuesta vacía",
  "error_code": "EMPTY_RESPONSE",
  "trace_id": "dd23a7dd"
}
```

**Por favor revisen en sus logs**: Trace ID `dd23a7dd`

**Pregunta**: ¿El orchestrator detectó que el modelo está descomisionado?

---

### Test 4.3: Chat con Anthropic (CON stream)

```bash
curl -s -X POST 'https://api-ia.bodasdehoy.com/webapi/chat/anthropic' \
  -H 'Content-Type: application/json' \
  -H 'X-Development: bodasdehoy' \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": true
  }' | jq '.'
```

**Resultado actual**:
```json
{
  "success": false,
  "error": "API key de anthropic no configurada para este developer",
  "error_code": "AUTH_ERROR"
}
```

**Pregunta**: ¿Por qué con `stream: true` da un error diferente?

---

### Test 4.4: Auto-routing

```bash
curl -s -X POST 'https://api-ia.bodasdehoy.com/webapi/chat/auto' \
  -H 'Content-Type: application/json' \
  -H 'X-Development: bodasdehoy' \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "stream": false
  }' | jq '.'
```

**Resultado actual**:
```json
{
  "success": false,
  "error": "El orchestrator devolvió una respuesta vacía",
  "error_code": "EMPTY_RESPONSE",
  "provider": "groq"
}
```

**Pregunta**: ¿Por qué el auto-routing intenta Groq primero si el modelo está descomisionado?

---

## 📊 RESUMEN DE PROBLEMAS

| # | Problema | Estado | Qué verificar |
|---|----------|--------|---------------|
| 1 | **Credenciales Anthropic** | ❌ Incorrecto | Key tiene formato OpenAI (`sk-proj-`) en lugar de Anthropic (`sk-ant-`) |
| 2 | **Modelo Groq** | ❌ Desactualizado | `llama-3.1-70b-versatile` fue descomisionado, usar `llama-3.3-70b-versatile` |
| 3 | **Key OpenAI** | ⚠️ Sin saldo | Key válida pero sin cuota |
| 4 | **Orchestrator** | ⚠️ Problema | Devuelve EMPTY_RESPONSE para Groq y OpenAI |
| 5 | **Error diferente con stream** | ⚠️ Revisar | Con stream=true da error diferente |

---

## 🔍 TRACE IDs PARA REVISAR EN SUS LOGS

Por favor busquen estos trace IDs en sus logs y verifiquen:
- ¿Qué key se usó?
- ¿Qué respuesta obtuvieron del provider?
- ¿Hay algún error en sus logs?

**Trace IDs actuales** (2026-02-11 21:37 UTC):
- Anthropic (sin stream): `7e45e918`
- Groq: `dd23a7dd`

**Trace IDs anteriores** (de nuestro informe original):
- Anthropic: `935aaaf0`, `fb7f5647`, `1bab9c32`
- Groq: `138cc332`, `9cc5aaea`
- OpenAI: `0d979b2d`
- Auto-routing: `b67c9ab2`

---

## ✅ SOLICITUD DE VERIFICACIÓN

Por favor:

1. ✅ **Ejecuten todos estos comandos** en su terminal
2. ✅ **Verifiquen los trace IDs** en sus logs
3. ✅ **Revisen su base de datos**: ¿Qué credenciales tienen almacenadas para `bodasdehoy`?
4. ✅ **Confirmen endpoints**: ¿Los endpoints que usamos son correctos?
5. ✅ **Verifiquen cambios recientes**: ¿Hubo algún cambio en las últimas 48-56 horas?

---

## 📞 CÓMO RESPONDER

Pueden respondernos directamente en Slack: **#copilot-api-ia**

O usar estos scripts que les compartimos en otro documento:
```bash
# Si tienen configurado Slack
./slack-send.sh "Revisamos el problema, encontramos que..."
./slack-notify.sh success "Credenciales corregidas"
./slack-notify.sh info "Logs revisados, el problema es..."
```

---

## 📦 SCRIPT AUTOMATIZADO

También creamos un script que ejecuta todas estas pruebas automáticamente:

**Ubicación**: `scripts/test-api-ia-reproduccion.sh`

```bash
chmod +x scripts/test-api-ia-reproduccion.sh
./scripts/test-api-ia-reproduccion.sh
```

Este script ejecuta todos los tests y muestra los resultados formateados.

---

**Gracias por su atención urgente a este problema.**

**Equipo Copilot LobeChat**
**2026-02-11**
