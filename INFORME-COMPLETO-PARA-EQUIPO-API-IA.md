# 🚨 INFORME COMPLETO: Problemas Críticos en api-ia.bodasdehoy.com

**Fecha**: 2026-02-11
**Developer afectado**: `bodasdehoy`
**Investigación realizada por**: Claude Code (Frontend Team)
**Prioridad**: 🔴 **CRÍTICA - Sistema no funcional**

---

## 📊 RESUMEN EJECUTIVO

Después de investigación exhaustiva (40+ tests), se identificaron **TRES problemas críticos** que impiden que el sistema de IA funcione:

1. 🔴 **API Key de OpenAI sin saldo** (quota exceeded)
2. 🔴 **Modelo de Groq descomisionado** (ya no existe)
3. 🔴 **API Key incorrecta para Anthropic** (es de OpenAI, no de Anthropic)

**NOTA IMPORTANTE**: Las credenciales SÍ están configuradas en whitelabel, pero tienen problemas de validez.

---

## 🔍 HALLAZGOS DETALLADOS

### 🔴 PROBLEMA 1: OpenAI - Quota Exceeded (Sin Saldo)

**Evidencia del test directo a OpenAI**:
```json
// Test: curl https://api.openai.com/v1/chat/completions
{
  "error": {
    "message": "You exceeded your current quota, please check your plan and billing details.",
    "type": "insufficient_quota",
    "code": "insufficient_quota"
  }
}
HTTP Status: 429
```

**API Key configurada**:
```
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
```

**Diagnóstico**:
- ✅ La API key es válida (lista modelos correctamente)
- ❌ **No tiene saldo/cuota** para hacer llamadas
- ❌ Error 429: insufficient_quota

**Impacto**:
- api-ia no puede usar OpenAI para este developer
- El fallback a OpenAI no funcionará
- Cualquier llamada a OpenAI falla

**Solución requerida**:
1. Agregar créditos a la cuenta de OpenAI
2. O reemplazar con una API key nueva con créditos
3. Verificar plan de facturación en https://platform.openai.com/account/billing

---

### 🔴 PROBLEMA 2: Groq - Modelo Descomisionado

**Evidencia del test directo a Groq**:
```json
// Test: curl https://api.groq.com/openai/v1/chat/completions
{
  "error": {
    "message": "The model `llama-3.1-70b-versatile` has been decommissioned and is no longer supported.",
    "type": "invalid_request_error",
    "code": "model_decommissioned"
  }
}
HTTP Status: 400
```

**Modelo configurado en whitelabel**:
```json
{
  "provider": "groq",
  "model": "llama-3.1-70b-versatile"  // ← YA NO EXISTE
}
```

**Diagnóstico**:
- ✅ La API key de Groq es válida
- ❌ El modelo `llama-3.1-70b-versatile` **fue descomisionado** por Groq
- ❌ Groq ya no ofrece ese modelo

**Modelos disponibles en Groq actualmente**:
```json
{
  "modelos_activos": [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.3-70b-versatile",  // ← REEMPLAZO SUGERIDO
    "llama-3.1-8b-instant",
    "groq/compound",
    "groq/compound-mini",
    "openai/gpt-oss-120b",
    "moonshotai/kimi-k2-instruct",
    "qwen/qwen3-32b"
  ]
}
```

**Impacto**:
- api-ia no puede usar Groq con el modelo actual
- El fallback a Groq no funcionará
- Error: "EMPTY_RESPONSE" del orchestrator

**Solución requerida**:
1. Actualizar configuración de Groq en whitelabel:
   ```json
   {
     "groq": {
       "apiKey": "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",
       "model": "llama-3.3-70b-versatile"  // ← NUEVO MODELO
     }
   }
   ```
2. Documentación de modelos Groq: https://console.groq.com/docs/models

---

### 🔴 PROBLEMA 3: Anthropic - API Key Incorrecta

**Evidencia del test directo a Anthropic**:
```json
// Test: curl https://api.anthropic.com/v1/messages
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "invalid x-api-key"
  }
}
HTTP Status: 401
```

**API Key configurada en whitelabel**:
```
sk-proj-d0UqDqL-...  ← Esta es una API key de OPENAI
```

**Diagnóstico**:
- ❌ La API key configurada **NO es de Anthropic**
- ❌ Es la **misma API key de OpenAI** (sk-proj-...)
- ✅ API keys de Anthropic deberían empezar con: `sk-ant-`

**Impacto**:
- api-ia no puede usar Anthropic
- Error 401: invalid x-api-key
- El proveedor principal (Anthropic) no funciona

**Solución requerida**:
1. Obtener una API key VÁLIDA de Anthropic
   - Ir a: https://console.anthropic.com/
   - Settings → API Keys → Create Key
2. Actualizar configuración en whitelabel:
   ```json
   {
     "anthropic": {
       "apiKey": "sk-ant-api03-...",  // ← API KEY NUEVA
       "model": "claude-3-5-sonnet-20241022"
     }
   }
   ```

---

## 🔍 ANÁLISIS DE ROOT CAUSE

### ¿Por qué api-ia no está funcionando?

**Flujo actual del sistema**:
```
Usuario → Copilot → api-ia.bodasdehoy.com
                      ↓
          1. Recupera credenciales de whitelabel ✅
                      ↓
          2. Intenta llamar a Anthropic
             └─> ❌ API key inválida (es de OpenAI)
                      ↓
          3. Fallback a Groq
             └─> ❌ Modelo descomisionado
                      ↓
          4. Fallback a OpenAI
             └─> ❌ Sin cuota/saldo
                      ↓
          5. Error: EMPTY_RESPONSE
```

**Conclusión**: El sistema de whitelabel SÍ está configurado, pero las credenciales tienen problemas:
- Anthropic: API key incorrecta (de otro provider)
- Groq: Modelo ya no existe
- OpenAI: Sin saldo

---

## 📋 CONFIGURACIÓN ACTUAL vs REQUERIDA

### Estado Actual (INCORRECTA)
```json
{
  "developer": "bodasdehoy",
  "credentials": {
    "anthropic": {
      "apiKey": "sk-proj-d0UqDqL-...",  // ❌ API key de OpenAI
      "model": "claude-3-5-sonnet-20241022"
    },
    "groq": {
      "apiKey": "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",
      "model": "llama-3.1-70b-versatile"  // ❌ Modelo descomisionado
    }
  }
}
```

### Estado Requerido (CORRECTO)
```json
{
  "developer": "bodasdehoy",
  "credentials": {
    "anthropic": {
      "apiKey": "sk-ant-api03-NUEVA_KEY_VALIDA",  // ✅ API key de Anthropic
      "model": "claude-3-5-sonnet-20241022"
    },
    "groq": {
      "apiKey": "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",
      "model": "llama-3.3-70b-versatile"  // ✅ Modelo actual
    },
    "openai": {
      "apiKey": "sk-NUEVA_KEY_CON_CREDITOS",  // ✅ API key con saldo
      "model": "gpt-4o-mini"
    }
  }
}
```

---

## 🔧 ACCIONES REQUERIDAS (Por Prioridad)

### 🔴 CRÍTICO 1: Configurar API Key de Anthropic
**Responsable**: Equipo api-ia / DevOps
**Deadline**: URGENTE (bloqueante)
**Pasos**:
1. Ir a https://console.anthropic.com/
2. Login con cuenta de la empresa
3. Settings → API Keys → Create Key
4. Actualizar en whitelabel de `bodasdehoy`:
   ```bash
   # Endpoint (requiere X-Admin-Key):
   PUT /api/admin/whitelabels/bodasdehoy
   {
     "ai_credentials": {
       "anthropic": {
         "apiKey": "sk-ant-api03-...",
         "model": "claude-3-5-sonnet-20241022"
       }
     }
   }
   ```

**Test de verificación**:
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"claude-3-5-sonnet-20241022"}'
```
**Resultado esperado**: Respuesta de Claude (no error 401)

---

### 🔴 CRÍTICO 2: Actualizar Modelo de Groq
**Responsable**: Equipo api-ia / DevOps
**Deadline**: URGENTE (bloqueante)
**Pasos**:
1. Actualizar configuración de Groq:
   ```bash
   PUT /api/admin/whitelabels/bodasdehoy
   {
     "ai_credentials": {
       "groq": {
         "apiKey": "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",
         "model": "llama-3.3-70b-versatile"  // NUEVO
       }
     }
   }
   ```

**Test de verificación**:
```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/groq" \
  -H "X-Development: bodasdehoy" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"llama-3.3-70b-versatile"}'
```
**Resultado esperado**: Respuesta de Groq (no error de modelo)

---

### 🟡 ALTO: Agregar Créditos a OpenAI
**Responsable**: Equipo api-ia / Finanzas
**Deadline**: 1-2 días
**Pasos**:
1. Ir a https://platform.openai.com/account/billing
2. Agregar créditos a la cuenta
3. O generar nueva API key con plan activo
4. Actualizar en whitelabel si se genera nueva key

**Test de verificación**:
```bash
curl -X POST "https://api.openai.com/v1/chat/completions" \
  -H "Authorization: Bearer sk-..." \
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"test"}],"max_tokens":5}'
```
**Resultado esperado**: Respuesta de OpenAI (no error 429)

---

## ✅ TESTS DE VERIFICACIÓN POST-FIX

Una vez aplicadas las correcciones, ejecutar estos tests:

### Test 1: Anthropic funciona
```bash
curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"Di: test exitoso"}],
    "model": "claude-3-5-sonnet-20241022",
    "stream": false
  }' | jq '.'
```
**Resultado esperado**:
```json
{
  "choices": [{
    "message": {
      "content": "test exitoso"
    }
  }],
  "provider": "anthropic"
}
```

---

### Test 2: Groq funciona
```bash
curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/groq" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"Di: groq ok"}],
    "model": "llama-3.3-70b-versatile",
    "stream": false
  }' | jq '.'
```
**Resultado esperado**: Respuesta de Groq con "groq ok"

---

### Test 3: Auto-routing funciona
```bash
curl -s -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -d '{
    "messages": [{"role":"user","content":"Hola"}],
    "stream": false
  }' | jq '.'
```
**Resultado esperado**: Respuesta del proveedor seleccionado automáticamente

---

### Test 4: Copilot End-to-End
1. Ir a http://localhost:3210
2. Iniciar sesión
3. Enviar: "Hola, ¿cuántos eventos tengo?"
4. Verificar respuesta inteligente de Claude

---

## 📊 MATRIZ DE ESTADO DE PROVIDERS

| Provider | API Key | Estado Key | Modelo | Estado Modelo | Error Actual | Acción |
|----------|---------|------------|--------|---------------|--------------|--------|
| **Anthropic** | `sk-proj-...` | ❌ Incorrecta (de OpenAI) | `claude-3-5-sonnet-20241022` | ✅ OK | 401 invalid x-api-key | 🔴 Reemplazar key |
| **Groq** | `gsk_87V0...` | ✅ Válida | `llama-3.1-70b-versatile` | ❌ Descomisionado | 400 model_decommissioned | 🔴 Actualizar modelo |
| **OpenAI** | `sk-proj-...` | ⚠️ Válida sin saldo | `gpt-4o-mini` | ✅ OK | 429 insufficient_quota | 🟡 Agregar créditos |

---

## 🔍 INFORMACIÓN TÉCNICA

### Endpoints Relevantes de api-ia

**Obtener credenciales** (sin auth ⚠️):
```bash
GET /api/developers/{developer}/ai-credentials
```

**Actualizar whitelabel** (requiere X-Admin-Key):
```bash
PUT /api/admin/whitelabels/{development}
Headers: X-Admin-Key: <admin_key>
Body: { "ai_credentials": {...} }
```

**Verificar providers**:
```bash
GET /api/providers/{developer}
```

**Chat endpoint**:
```bash
POST /webapi/chat/{provider}
Headers: X-Development: bodasdehoy
```

---

### Trace IDs para Debugging

**Anthropic errors**:
- `fb7f5647` - AUTH_ERROR con bodasdehoy
- `52173c19` - AUTH_ERROR con Development header
- `88ec897b` - AUTH_ERROR con ambos headers

**Groq errors**:
- `138cc332` - EMPTY_RESPONSE
- `9cc5aaea` - EMPTY_RESPONSE con auto

**OpenAI errors**:
- `0d979b2d` - EMPTY_RESPONSE

---

## 📞 INFORMACIÓN DE CONTACTO

**Frontend Team**: @juancarlosparra
**Fecha de investigación**: 2026-02-11
**Tests realizados**: 40+ tests exhaustivos
**Scripts generados**:
- `/tmp/investigacion-profunda-api-ia.sh` - 29 tests de api-ia
- `/tmp/test-proveedores-directos.sh` - Tests directos a APIs
- `/tmp/analizar-whitelabel.sh` - Análisis de whitelabel

---

## 🎯 TL;DR (Resumen Ultra-Ejecutivo)

**Problemas encontrados**:
1. 🔴 Anthropic: API key es de OpenAI, no de Anthropic
2. 🔴 Groq: Modelo `llama-3.1-70b-versatile` descomisionado
3. 🟡 OpenAI: Sin saldo/cuota (error 429)

**Soluciones**:
1. Obtener API key de Anthropic (sk-ant-...) y configurar
2. Cambiar modelo de Groq a `llama-3.3-70b-versatile`
3. Agregar créditos a OpenAI

**Impacto**: Sistema completamente no funcional hasta aplicar fixes.

**Próximo paso inmediato**: Configurar API key de Anthropic válida.

---

## 📋 CHECKLIST DE ACCIONES

- [ ] Obtener API key de Anthropic (https://console.anthropic.com/)
- [ ] Actualizar credencial de Anthropic en whitelabel
- [ ] Actualizar modelo de Groq a `llama-3.3-70b-versatile`
- [ ] Verificar test de Anthropic (debe responder sin error 401)
- [ ] Verificar test de Groq (debe responder sin error modelo)
- [ ] Agregar créditos a OpenAI
- [ ] Verificar test de OpenAI (debe responder sin error 429)
- [ ] Test end-to-end del Copilot
- [ ] Notificar a frontend team cuando esté listo

---

**Última actualización**: 2026-02-11 por Claude Code
**Estado**: Investigación completada - Esperando acciones de equipo api-ia
**Documentos relacionados**:
- `INFORME-EQUIPO-API-IA.md` - Informe anterior
- `DIAGNOSTICO-API-IA-COPILOT.md` - Diagnóstico de usuario
- `SISTEMA-FALLBACK-COPILOT.md` - Sistema de fallback
