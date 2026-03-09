## Pruebas (cliente) — Backend IA “debería funcionar” (V2)
**Fecha:** 2026-01-21  
**Base URL:** `https://api-ia.bodasdehoy.com`  
**Development:** `bodasdehoy`

Incluye pruebas adicionales para detectar dos bugs críticos:
1) **Selección/fallback a Ollama** cuando Ollama no está disponible.
2) **Provider forzado ignorado** (`/webapi/chat/google|openai|anthropic` terminando en `provider: ollama`).

---

## Smoke test extendido (auto + provider forzado)
- **Script:** `scripts/smoke-test-backend-ia.sh`
- **RequestId:** `smoke_20260121_071541_20431`
- **Reporte generado:** `docs/reports/BACKEND_IA_SMOKE_smoke_20260121_071541_20431.md`

### Resultados clave
1) `POST /webapi/chat/auto` `stream:false`
- **HTTP 503**
- `error_code: EMPTY_RESPONSE`
- **provider real:** `ollama`
- **error real:** `Ollama no disponible`

➡️ **FAIL**: si Ollama no está disponible, no debería seleccionarse; y el error debería ser `PROVIDER_UNAVAILABLE` (o similar), no `EMPTY_RESPONSE`.

2) Provider forzado (NO debe caer a Ollama)
- `POST /webapi/chat/google` (model `gemini-1.5-pro`) → **provider: ollama** → **FAIL**
- `POST /webapi/chat/openai` (model `gpt-4o-mini`) → **provider: ollama** → **FAIL**
- `POST /webapi/chat/anthropic` (model `claude-3-opus-20240229`) → **provider: ollama** → **FAIL**

➡️ **FAIL**: cuando el provider es explícito, el backend debe:
- responder con `provider` solicitado (200), **o**
- devolver 503 con `error_code: AUTH_ERROR` / `PROVIDER_ERROR` (sin fallback a otro provider).

---

## Repro directo (copiar/pegar)

### 1) Auto
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_auto_repro_v2" \
  --data '{"messages":[{"role":"user","content":"ping"}],"stream":false}'
```

### 2) Provider forzado: Google
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/google" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_google_repro_v2" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gemini-1.5-pro","stream":false}'
```

### 3) Provider forzado: OpenAI
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/openai" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_openai_repro_v2" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gpt-4o-mini","stream":false}'
```

### 4) Provider forzado: Anthropic
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_anthropic_repro_v2" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"claude-3-opus-20240229","stream":false}'
```

---

## Qué debe cambiar en backend (resumen)
1) No seleccionar Ollama si no está disponible.
2) Si el provider es explícito (`/chat/google|openai|anthropic`):
   - no hacer fallback a otro provider
   - devolver error estructurado (`AUTH_ERROR`/`PROVIDER_ERROR`) si no puede operar.
3) Clasificar “Ollama no disponible” como `PROVIDER_UNAVAILABLE` (o similar), no `EMPTY_RESPONSE`.

