## Pruebas de verificación (cliente) — Backend IA
**Fecha:** 2026-01-21  
**Base URL:** `https://api-ia.bodasdehoy.com`  
**Development:** `bodasdehoy`

Este documento contiene **pruebas reproducibles** y **resultados observados** para pasarlos al proveedor si el backend “ya debería funcionar” pero sigue fallando.

---

## 1) Smoke test automático (auto)
- **Script:** `scripts/smoke-test-backend-ia.sh`
- **RequestId:** `smoke_20260121_071215_12114`
- **Reporte generado:** `docs/reports/BACKEND_IA_SMOKE_smoke_20260121_071215_12114.md`

Resultado clave del smoke test:
- `POST /webapi/chat/auto` `stream:false` → **503** `EMPTY_RESPONSE` con `provider: ollama` + `error: Ollama no disponible`.
- `POST /webapi/chat/auto` `stream:true` → **503** `NO_PROVIDERS_AVAILABLE`.

---

## 2) Pruebas directas (curls) con RequestId
**RequestId base:** `client_verify_20260121_071228_24211`

### 2.1 Modelos por provider
```bash
curl -i -H "X-Development: bodasdehoy" -H "X-Request-Id: client_verify_20260121_071228_24211_models_groq" \
  "https://api-ia.bodasdehoy.com/webapi/models/groq"

curl -i -H "X-Development: bodasdehoy" -H "X-Request-Id: client_verify_20260121_071228_24211_models_cloudflare" \
  "https://api-ia.bodasdehoy.com/webapi/models/cloudflare"

curl -i -H "X-Development: bodasdehoy" -H "X-Request-Id: client_verify_20260121_071228_24211_models_google" \
  "https://api-ia.bodasdehoy.com/webapi/models/google"
```

**Resultado observado:**
- `models/groq` → `[]`
- `models/cloudflare` → `[]`
- `models/google` → `[]`

Mientras tanto:
- `models/openai` → devuelve modelos OpenAI (OK)
- `models/anthropic` → devuelve modelos Anthropic (OK)

---

## 3) Chat (auto / google / openai)

### 3.1 Auto (stream:false)
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_verify_20260121_071228_24211_chat_auto" \
  --data '{"messages":[{"role":"user","content":"ping"}],"stream":false}'
```

**Resultado observado (ejemplo):**
- HTTP `503`
- `error_code: EMPTY_RESPONSE`
- `provider: ollama`
- `error: Ollama no disponible`
- `trace_id: 5bb5a959`

### 3.2 Google (stream:false)
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/google" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_verify_20260121_071228_24211_chat_google" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gemini-1.5-pro","stream":false}'
```

**Resultado observado (ejemplo):**
- HTTP `503`
- `error_code: EMPTY_RESPONSE`
- `provider: ollama`
- `error: Ollama no disponible`
- `trace_id: 644520d8`

### 3.3 OpenAI (stream:false)
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/openai" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_verify_20260121_071228_24211_chat_openai" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gpt-4o-mini","stream":false}'
```

**Resultado observado (ejemplo):**
- HTTP `503`
- `error_code: EMPTY_RESPONSE`
- `provider: ollama`
- `error: Ollama no disponible`
- `trace_id: a37acab4`

---

## Conclusión para el proveedor
Aunque el backend declara estar “arreglado”, **desde cliente** se observa que:
1) Los modelos para `groq/cloudflare/google` aparecen vacíos (`[]`).
2) Requests a `/webapi/chat/google` y `/webapi/chat/openai` terminan ejecutando `provider: ollama` y fallan por `Ollama no disponible`.
3) El `error_code` sigue siendo `EMPTY_RESPONSE` incluso cuando el error real es “provider no disponible”.

**Acción solicitada al proveedor:** revisar por qué el `development=bodasdehoy` no está resolviendo keys/config en runtime y por qué se cae a Ollama incluso cuando se fuerza provider.

