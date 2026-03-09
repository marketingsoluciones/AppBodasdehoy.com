## Validación cliente: timeout + aclaración “MongoDB no requerido por el cliente”
**Fecha:** 2026-01-20

### 1) Hechos (desde cliente)
Como cliente **AppBodasdehoy**, nosotros **solo consumimos la API** del backend IA (`https://api-ia.bodasdehoy.com`).  
No realizamos conexiones directas a MongoDB desde frontend / LobeChat.

### 2) Pruebas reales (resultado)

#### 2.1 `/health` OK
```bash
curl -i "https://api-ia.bodasdehoy.com/health"
```

#### 2.2 Filtrado de modelos (confirmado)
`/webapi/models/openai` devuelve solo OpenAI (sin Ollama):
```bash
curl -i -H "X-Development: bodasdehoy" "https://api-ia.bodasdehoy.com/webapi/models/openai"
```

`/webapi/models/anthropic` devuelve solo Anthropic:
```bash
curl -i -H "X-Development: bodasdehoy" "https://api-ia.bodasdehoy.com/webapi/models/anthropic"
```

#### 2.3 Chat (openai) devuelve 503 rápido (sin colgarse)
```bash
curl -i --max-time 40 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/openai" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: force_openai_003" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gpt-4o-mini","stream":false}'
```

**Resultado observado:** HTTP `503` en ~2–3s con `error_code: EMPTY_RESPONSE` y metadata indicando `Error de OpenAI: 429`.

### 3) Qué queda pendiente (backend)
- El backend ahora falla rápido (bien), pero cuando el upstream devuelve `429` sería más útil devolver:
  - `error_code: UPSTREAM_RATE_LIMIT` (o similar) en vez de `EMPTY_RESPONSE`
  - y propagar `upstream_status: 429` explícitamente.
- Si el backend decide leer keys desde MongoDB (`lobeChatConfig.aiProviders`), eso es **interno**:
  - Para el cliente no es requisito; el requisito es que **`/webapi/chat/auto` funcione** con las keys que el backend dice tener configuradas.

