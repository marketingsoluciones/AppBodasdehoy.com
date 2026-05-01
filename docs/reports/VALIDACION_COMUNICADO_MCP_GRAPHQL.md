## Validación del comunicado “API2 GraphQL only” (cliente)
**Fecha:** 2026-01-21  
**Base:** `https://api-ia.bodasdehoy.com`  
**Development:** `bodasdehoy`

### Qué dice el comunicado
- Backend IA ya **no conecta a MongoDB**
- Usa **API2 GraphQL** como única fuente
- No requiere cambios en frontend
- Groq/Gemini/Cloudflare deberían estar disponibles “automáticamente”

---

## Pruebas reales (desde cliente)

### 1) Modelos por provider
```bash
curl -i -H "X-Development: bodasdehoy" "https://api-ia.bodasdehoy.com/webapi/models/groq"
curl -i -H "X-Development: bodasdehoy" "https://api-ia.bodasdehoy.com/webapi/models/google"
curl -i -H "X-Development: bodasdehoy" "https://api-ia.bodasdehoy.com/webapi/models/cloudflare"
```

**Resultado observado:**
- `models/groq` → `[]` (vacío)
- `models/google` → incluye `gemini-1.5-pro` ✅
- `models/cloudflare` → `[]` (vacío)

### 2) Chat auto (stream:false)
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_auto_verify_004" \
  --data '{"messages":[{"role":"user","content":"ping"}],"stream":false}'
```

**Resultado observado (ejemplo):**
- HTTP `503`
- `provider: openai` + `error: Error de OpenAI: 429`
- `error_code` devuelto: `EMPTY_RESPONSE` (clasificación mejorable)

### 3) Chat provider google directo (para aislar)
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/google" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: force_google_004" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gemini-1.5-pro","stream":false}'
```

**Resultado observado (ejemplo):**
- HTTP `503`
- `provider: ollama` + `error: Ollama no disponible`
- `error_code` devuelto: `EMPTY_RESPONSE`

---

## Conclusión (cliente)
1) El filtrado de modelos ha mejorado (ya no mezcla Ollama en `models/openai|anthropic`).
2) Sin embargo, en producción:
   - Solo vemos `google` con un modelo (Gemini), pero `groq` y `cloudflare` aparecen vacíos.
   - `auto` sigue intentando OpenAI y cae en `429` (rate limit).
   - En llamadas directas a `google`, parece caer a `ollama` (no disponible), lo que sugiere:
     - key/config de Google no está usable en runtime, o
     - routing/fallback está ignorando el provider solicitado.
3) Clasificación de errores: cuando la causa es `429` o `Ollama no disponible`, `error_code=EMPTY_RESPONSE` no ayuda. Recomendación:
   - `UPSTREAM_RATE_LIMIT` con `upstream_status: 429`
   - `UPSTREAM_UNAVAILABLE` / `PROVIDER_UNAVAILABLE` para Ollama no disponible

