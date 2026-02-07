## Smoke Test Backend IA

- **Base URL**: `https://api-ia.bodasdehoy.com`
- **Development**: `bodasdehoy`
- **Providers**: `auto`
- **Model (default)**: ``
- **RequestId**: `smoke_20260121_074802_2547`
- **Fecha (UTC)**: `2026-01-21T06:48:02Z`

### 1) Health
```
HTTP/2 200 
date: Wed, 21 Jan 2026 06:48:03 GMT
content-type: application/json
content-length: 124
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=INGNaLhD0UX3qbdPvCVXKGr5Exvkulhkjlo3KO5jQKatmBJ2%2BK90P5Sg5411%2BSEYehP%2BjE5M3xfG4jM5no6zOMUhLnqPl%2BFbzsk8ifisnfplTHkW%2Fw%3D%3D"}]}
cf-ray: 9c14dd1a7a922168-MAD
alt-svc: h3=":443"; ma=86400

{"status":"healthy","timestamp":"2026-01-21T06:48:03.272865","services":{"websockets":"0 active","graphql_proxy":"running"}}```

### 2) Models (auto)
```
HTTP/2 200 
date: Wed, 21 Jan 2026 06:48:03 GMT
content-type: application/json
content-length: 213
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=SBIZdEAlH5HrZcB5aDrlecXVJBybVcTutZpjHmxMugEITl8Czt9Dy3clZVEmBrrT4SXj52%2BzAvJ%2B0tgkU2aT9hjLiQZ2ByJ7c8KwMW3lsCVyE8M%3D"}]}
cf-ray: 9c14dd1d7d8324b7-MAD
alt-svc: h3=":443"; ma=86400

[{"id":"auto","name":"Auto - Selección automática","provider":"auto","context":128000,"maxOutput":4096,"description":"El sistema selecciona automáticamente el mejor provider según disponibilidad y criterios"}]```

### 3) Chat (auto) stream:false (esperado: JSON)
```
HTTP/2 503 
date: Wed, 21 Jan 2026 06:48:07 GMT
content-type: application/json
content-length: 625
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=IeX9OvMeRDXWKnEKDh2GB8LMrmYm5CgBuTgIuUn2mvaXmEfUJ17OJZfQBNT7zk%2BN9KRhaEOFg1VamXZ4zRjzZGQarEfDErkjMYltaCBDCC5KOdEgKA%3D%3D"}]}
cf-ray: 9c14dd1f3f6c0423-MAD
alt-svc: h3=":443"; ma=86400

{"success":false,"error":"No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.","error_code":"EMPTY_RESPONSE","trace_id":"ac0d6d92","provider":"openai","model":"gpt-4o-mini","upstream_status":null,"timestamp":"2026-01-21T06:48:07.398929","suggestion":"Por favor, intenta de nuevo o verifica la configuración de providers.","metadata":{"error":"empty_response","original_result":"{'message': 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.', 'error': 'Error de OpenAI: 429', 'tokens_used': 0, 'cost': 0, 'provider': 'openai', 'model': 'gpt-4o-mini"}}```

**Resultado:** ⚠️ WARN — 503 con error_code: EMPTY_RESPONSE pero el upstream parece ser 429 (rate limit).

**Sugerencia (backend):** devolver error_code=UPSTREAM_RATE_LIMIT (o similar) y upstream_status=429 explícito, en lugar de error_code=EMPTY_RESPONSE.

### 4) Chat (auto) stream:true (esperado: SSE sin event:error, o 503 JSON estructurado)
```
HTTP/2 503 
date: Wed, 21 Jan 2026 06:48:08 GMT
content-type: application/json
content-length: 508
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=1COoyKrtc0u5t1SpGOFnqoLw6AXbNLHpXH%2BT8rLLrTg4DVs1JiHRSOwPYG3JioE59%2FP56cQIlmNpShuYrw0%2F4PZu4bQNC9eFsEoR95bSqwffMGQ96A%3D%3D"}]}
cf-ray: 9c14dd375ee2f778-MAD
alt-svc: h3=":443"; ma=86400

{"detail":{"error":"No hay proveedores disponibles. Por favor, configura al menos una API key (OpenAI, Anthropic, OpenRouter, etc.) o asegúrate de que Ollama esté corriendo.","error_code":"NO_PROVIDERS_AVAILABLE","trace_id":"19e08571","provider":"auto","model":null,"upstream_status":null,"timestamp":"2026-01-21T06:48:08.139988","context":{"suggestion":"Por favor, configura al menos una API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY, etc.) o asegúrate de que Ollama esté corriendo."}}}```

**Resultado:** ✅ OK (503 esperado: NO_PROVIDERS_AVAILABLE).

### 6) Provider forzado (debe respetarse o devolver AUTH_ERROR/PROVIDER_ERROR; NO caer a Ollama)

#### 6.1) Chat (google) stream:false
```
HTTP/2 503 
date: Wed, 21 Jan 2026 06:48:08 GMT
content-type: application/json
content-length: 624
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=EsOlyCgYBEasHE%2B7JzpFN%2ByDrX0%2B%2BO2kWq2qBzZzatb7IoeqSyUloz8iX2Pey0C24A21SZrlcrtV87MipIc055zvs7Q%2BMp36rZluSESjT9HrQxC5tw%3D%3D"}]}
cf-ray: 9c14dd3bf89ac909-MAD
alt-svc: h3=":443"; ma=86400

{"success":false,"error":"No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.","error_code":"EMPTY_RESPONSE","trace_id":"b9ffd00f","provider":"ollama","model":"qwen2.5:7b","upstream_status":null,"timestamp":"2026-01-21T06:48:08.655937","suggestion":"Por favor, intenta de nuevo o verifica la configuración de providers.","metadata":{"error":"empty_response","original_result":"{'message': 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.', 'error': 'Ollama no disponible', 'tokens_used': 0, 'cost': 0, 'provider': 'ollama', 'model': 'qwen2.5:7b'"}}```

**Resultado:** ❌ FAIL — provider=google terminó usando provider=ollama.

#### 6.2) Chat (openai) stream:false
```
HTTP/2 503 
date: Wed, 21 Jan 2026 06:48:09 GMT
content-type: application/json
content-length: 624
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=f8OczFdmkcIIX%2BMd483PtArKQpNXlbMNXalU3MrKNPKbVvu0dXEGD1aMR%2Bm%2FD%2BNCnBMyc5NmBULOpHSg7jl70F9kQFi5VxlDAv2V%2BwqtKTO116deoA%3D%3D"}]}
cf-ray: 9c14dd3f394cddf6-MAD
alt-svc: h3=":443"; ma=86400

{"success":false,"error":"No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.","error_code":"EMPTY_RESPONSE","trace_id":"f66502e4","provider":"ollama","model":"qwen2.5:7b","upstream_status":null,"timestamp":"2026-01-21T06:48:09.173231","suggestion":"Por favor, intenta de nuevo o verifica la configuración de providers.","metadata":{"error":"empty_response","original_result":"{'message': 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.', 'error': 'Ollama no disponible', 'tokens_used': 0, 'cost': 0, 'provider': 'ollama', 'model': 'qwen2.5:7b'"}}```

**Resultado:** ❌ FAIL — provider=openai terminó usando provider=ollama.

#### 6.3) Chat (anthropic) stream:false
```
HTTP/2 503 
date: Wed, 21 Jan 2026 06:48:09 GMT
content-type: application/json
content-length: 624
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=MJQHlEstHYkudkdwIPPlKwnT%2FIKvblg1sMOpLHSpMU3E5mAG7nrSXIcqnTV8TRechO%2FSRLIGN6%2BkH8tiKcGm1OtghEGViPtOHhSImlrJAcCCe1bbuA%3D%3D"}]}
cf-ray: 9c14dd426f09b730-MAD
alt-svc: h3=":443"; ma=86400

{"success":false,"error":"No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.","error_code":"EMPTY_RESPONSE","trace_id":"b91b5261","provider":"ollama","model":"qwen2.5:7b","upstream_status":null,"timestamp":"2026-01-21T06:48:09.678307","suggestion":"Por favor, intenta de nuevo o verifica la configuración de providers.","metadata":{"error":"empty_response","original_result":"{'message': 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.', 'error': 'Ollama no disponible', 'tokens_used': 0, 'cost': 0, 'provider': 'ollama', 'model': 'qwen2.5:7b'"}}```

**Resultado:** ❌ FAIL — provider=anthropic terminó usando provider=ollama.

### 5) API chat alternativa (/api/chat) (solo para comparar contrato)
```
HTTP/2 200 
date: Wed, 21 Jan 2026 06:48:10 GMT
content-type: application/json
content-length: 422
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=aUVofCljkNVxIWrZTY%2FFZEhnT0KFXw%2FTufc6N9AVwDRbnKbUHY3AHFCckfu2udNaO2PunvJy%2Bmm12vbBvJTx2sFNjg6Y7mVK3gj919DJOr6pAoF1vA%3D%3D"}]}
cf-ray: 9c14dd4589240140-MAD
alt-svc: h3=":443"; ma=86400

{"response":"Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.","session_id":"sess_7d21a9c75064","requires_event_selection":false,"suggested_events":[],"metadata":{"tools_used":[],"tools_count":0,"response_time_ms":0,"billing":{},"provider":"ollama","model":"qwen2.5:14b","tokens_used":0,"real_cost":0.0,"billed_cost":0.0,"margin":0.0,"chat_config":{},"channel":"web","session_metadata":{}}}```

## Fin smoke test
- **RequestId**: `smoke_20260121_074802_2547`
- **Reporte**: `docs/reports/BACKEND_IA_SMOKE_smoke_20260121_074802_2547.md`
