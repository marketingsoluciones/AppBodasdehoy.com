## Ticket Cliente (AppBodasdehoy) → Proveedor Backend IA
**Asunto:** `429 (rate limit)` se está reportando como `EMPTY_RESPONSE` (clasificación incorrecta)

Hola equipo,

Tras vuestros fixes de timeout y filtrado de modelos, hemos vuelto a ejecutar smoke tests contra producción.
El endpoint responde rápido (bien), pero detectamos un problema de **clasificación del error**:

---

## Evidencia (prueba real)
Smoke report generado:
- `docs/reports/BACKEND_IA_SMOKE_smoke_20260121_003833_10477.md`

En el test `provider=auto` `stream:false` el backend devuelve:
- HTTP `503`
- `error_code: EMPTY_RESPONSE`
- `provider: openai`, `model: gpt-4o-mini`

Pero en el body (`metadata.original_result`) se ve claramente:
- `Error de OpenAI: 429` (rate limit)

Es decir: **la causa real es upstream 429**, no una “respuesta vacía”.

---

## Repro (copiar/pegar)
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_rate_limit_check_001" \
  --data '{"messages":[{"role":"user","content":"ping"}],"stream":false}'
```

---

## Esperado (contrato de error)
Si el upstream devuelve 429:
- `error_code` debería ser algo tipo:
  - `UPSTREAM_RATE_LIMIT` (recomendado) o `UPSTREAM_ERROR`
- y `upstream_status` debería ser **429** (no `null`)

Esto permite al cliente:
- diferenciar “sin respuesta” vs “rate limit”
- aplicar retry/backoff correcto
- alertar con mensaje más útil

---

## Petición concreta
1) Cambiar la clasificación cuando detectéis 429:
   - `error_code: UPSTREAM_RATE_LIMIT`
   - `upstream_status: 429`
2) Reservar `EMPTY_RESPONSE` para casos donde realmente el modelo devolvió vacío/genérico **sin** upstream error.

Gracias.

