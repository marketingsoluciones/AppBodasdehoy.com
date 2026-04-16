## Reintento #2 (cliente) — Backend IA sigue fallando en producción
**Fecha:** 2026-01-21  
**Base URL:** `https://api-ia.bodasdehoy.com`  
**Development:** `bodasdehoy`

Este documento confirma que, tras el “V2 Correcciones Aplicadas”, **el comportamiento en producción aún no refleja esas correcciones**.

---

## Evidencia automática
- **Smoke test (extendido + provider forzado)**:
  - **RequestId:** `smoke_20260121_074802_2547`
  - **Reporte:** `docs/reports/BACKEND_IA_SMOKE_smoke_20260121_074802_2547.md`

---

## Evidencia con curls directos (RequestId/TraceId)
**RequestId base:** `retry_20260121_074815_29875`

### 1) Modelos (siguen vacíos)
- `GET /webapi/models/groq` → `[]`
- `GET /webapi/models/cloudflare` → `[]`
- `GET /webapi/models/google` → `[]`

### 2) Provider forzado sigue cayendo a Ollama (FAIL)
Repros (copiar/pegar):

```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/google" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: retry_20260121_074815_29875_chat_google" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gemini-1.5-pro","stream":false}'

curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/openai" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: retry_20260121_074815_29875_chat_openai" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gpt-4o-mini","stream":false}'

curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: retry_20260121_074815_29875_chat_auto" \
  --data '{"messages":[{"role":"user","content":"ping"}],"stream":false}'
```

**Resultado observado:** en los 3 casos devuelve HTTP `503` y termina con:
- `provider: ollama`
- `error: "Ollama no disponible"`
- `error_code: EMPTY_RESPONSE`

TraceIds del reintento:
- **google:** `f3217a0b`
- **openai:** `a5fb3e49`
- **auto:** `fd0d0935`

---

## Conclusión (cliente)
Las correcciones V2 descritas (forzar provider solicitado, no caer a Ollama, error_code específico) **no están activas en producción** en el momento de estas pruebas.

**Acción solicitada:**
1) Confirmar despliegue real (commit/tag/fecha) y si hay rollout parcial.
2) Reiniciar servicio/instancias en producción si aplica.
3) Repetir los repros anteriores y devolver `trace_id` y `error_code` esperados (`AUTH_ERROR`/`PROVIDER_ERROR`/`PROVIDER_UNAVAILABLE`).

