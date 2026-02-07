## Ticket Cliente (AppBodasdehoy) → Proveedor Backend IA
**Asunto:** Las correcciones reportadas no se reflejan en producción (models vacíos + google cae a Ollama + error_code sigue siendo EMPTY_RESPONSE)

Hola equipo,

Gracias por vuestra respuesta indicando que ya están corregidos:
- modelos vacíos (Groq/Cloudflare),
- `POST /webapi/chat/google` sin caer a Ollama,
- códigos de error específicos (`UPSTREAM_RATE_LIMIT`, `PROVIDER_UNAVAILABLE`, `AUTH_ERROR`, etc.).

Hemos validado **en producción** (`https://api-ia.bodasdehoy.com`) y, **a la fecha/hora de estas pruebas**, el comportamiento observado **no coincide** con lo descrito.

---

### Contexto
- **Base URL:** `https://api-ia.bodasdehoy.com`
- **Development:** `bodasdehoy`

---

## 1) Modelos por provider (siguen vacíos)

### Evidencia (real)
```bash
curl -i -H "X-Development: bodasdehoy" "https://api-ia.bodasdehoy.com/webapi/models/groq"
curl -i -H "X-Development: bodasdehoy" "https://api-ia.bodasdehoy.com/webapi/models/cloudflare"
curl -i -H "X-Development: bodasdehoy" "https://api-ia.bodasdehoy.com/webapi/models/google"
```

**Resultado observado:** `[]` en los 3 endpoints (groq/cloudflare/google).

**Esperado según vuestro mensaje:** si hay keys en `lobeChatConfig.aiProviders.*`, deberían retornar modelos.

---

## 2) `POST /webapi/chat/google` sigue cayendo a Ollama

### Evidencia (real)
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/google" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: verify_google_005" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gemini-1.5-pro","stream":false}'
```

**Resultado observado (ejemplo):**
- HTTP `503`
- `provider: ollama`
- `error: "Ollama no disponible"`
- `error_code: EMPTY_RESPONSE`
- `trace_id: c53b2c4e`

**Esperado según vuestro mensaje:**
- Si no hay key → `503` con `error_code: AUTH_ERROR` (sin fallback a Ollama)
- Si hay error del provider → `503` con `error_code: PROVIDER_ERROR` (sin fallback a Ollama)

---

## 3) Códigos de error específicos no se ven en prod

### Evidencia (real) — auto y openai
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: verify_auto_005" \
  --data '{"messages":[{"role":"user","content":"ping"}],"stream":false}'

curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/openai" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: verify_openai_005" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gpt-4o-mini","stream":false}'
```

**Resultado observado (ejemplos):**
- ambos retornan `503` con `provider: ollama`, `error: "Ollama no disponible"`, `error_code: EMPTY_RESPONSE`
- `trace_id` ejemplo: `a7a3bb4c`, `0c25836d`

**Esperado según vuestro mensaje:**
- 429 → `UPSTREAM_RATE_LIMIT` con `upstream_status: 429`
- Ollama no disponible → `PROVIDER_UNAVAILABLE`

---

## Preguntas concretas (para desbloquear)
1) **¿Está desplegado en producción** lo que describís? Necesitamos:
   - commit/tag/fecha exacta
   - confirmar si hay múltiples entornos (staging vs prod) o si hay rollout parcial.
2) Para `development=bodasdehoy`, ¿qué devuelve vuestro GraphQL (API2) hoy para:
   - `lobeChatConfig.aiProviders.groq`
   - `lobeChatConfig.aiProviders.google`
   - `lobeChatConfig.aiProviders.cloudflare`
   (solo **isActive** y si **apiKey existe**, sin exponer la key completa)
3) ¿Por qué `provider=google` está cayendo a `ollama` en lugar de devolver `AUTH_ERROR`/`PROVIDER_ERROR` como indicáis?

Gracias. En cuanto tengamos confirmación de despliegue/config, repetimos tests y cerramos.

