## Smoke Test Backend IA

- **Base URL**: `https://api-ia.bodasdehoy.com`
- **Development**: `bodasdehoy`
- **Provider**: `openrouter`
- **Model**: `openrouter/auto`
- **RequestId**: `smoke_20260120_185746_7043`
- **Fecha (UTC)**: `2026-01-20T17:57:46Z`

### 1) Health
```
HTTP/2 200 
date: Tue, 20 Jan 2026 17:57:46 GMT
content-type: application/json
content-length: 124
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=pN60c6ybo8rsri5y00SkhQqhbBOoiRDocvcttTJGYwf3i4WbOkDd%2BYWaXmJM604PV5%2FpLg5TTPqXCXvCeqsYKB%2BF%2B%2BgKG5LpXKu6ChwynVBBcsk%3D"}]}
cf-ray: 9c1074c4af12f76f-MAD
alt-svc: h3=":443"; ma=86400

{"status":"healthy","timestamp":"2026-01-20T17:57:46.647997","services":{"websockets":"0 active","graphql_proxy":"running"}}```

### 2) Models (openrouter)
```
HTTP/2 200 
date: Tue, 20 Jan 2026 17:57:47 GMT
content-type: application/json
content-length: 740
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=NLmnZ9oyAwgARLtMLsBWPr8oqrin97LRX%2BgGQ0RXnGm6CKYxDU91wNdMM9OmRDduuPw8GhQ0sYIhPK%2B%2FxWnii3aaRG%2FOW8Qx19GgkDWHpGBIkJc%3D"}]}
cf-ray: 9c1074c8cc26ae85-MAD
alt-svc: h3=":443"; ma=86400

{"models":[{"id":"openrouter/auto","name":"Openrouter/Auto","provider":"openrouter","context":128000,"maxOutput":4096},{"id":"anthropic/claude-3.5-sonnet","name":"Claude 3.5 Sonnet","provider":"openrouter","context":128000,"maxOutput":4096},{"id":"openai/gpt-4o","name":"GPT-4","provider":"openrouter","context":128000,"maxOutput":4096},{"id":"google/gemini-pro-1.5","name":"Gemini 1.5 Pro","provider":"openrouter","context":128000,"maxOutput":4096},{"id":"qwen2.5:7b","name":"Qwen 2.5 7B","provider":"ollama","context":128000,"maxOutput":4096},{"id":"llama3.2:3b","name":"Llama 3.2 3B","provider":"ollama","context":128000,"maxOutput":4096},{"id":"phi3:medium","name":"Phi-3 Medium","provider":"ollama","context":128000,"maxOutput":4096}]}```

### 3) Chat stream:false (esperado: JSON, no SSE)
```
HTTP/2 200 
date: Tue, 20 Jan 2026 17:57:48 GMT
content-type: application/json
content-length: 109
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=9WjEoxtZWo8Rxe2rQN6bh8SU9y3%2FeazhtbHMzVnFRDG9bzjH2qcBgsuKropcPibKICegCaG1H1TT8iGpxI8Z0TgxHJmG7lyKqKT568LX2mUsQOE8aw%3D%3D"}]}
cf-ray: 9c1074cb5dd8562d-MAD
alt-svc: h3=":443"; ma=86400

{"success":true,"message":"","metadata":{},"provider":"ollama","model":"qwen2.5:7b","tokens_used":0,"cost":0}```

### 4) Chat stream:true (esperado: SSE event:text/done o chunks OpenAI sin event:error)
```
HTTP/2 200 
date: Tue, 20 Jan 2026 17:57:48 GMT
content-type: text/event-stream; charset=utf-8
cache-control: no-cache
server: cloudflare
x-model: openrouter/auto
x-provider: openrouter
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=bmlEoFTs2espUQL1pKKHrVJjtnWus%2BFq%2BpPCYEau2XRKGENWM9p4wMRQm%2B5PR1VqgqG2oMXA4tY5TOv05sDuTtgg61q%2Fs3O5NOBugzpRsw6VV6aigw%3D%3D"}]}
cf-ray: 9c1074cfd90f2a5a-MAD
alt-svc: h3=":443"; ma=86400

event: error
data: {"error": "API key de OpenRouter no configurada y no hay fallback disponible. Por favor, configura OPENROUTER_API_KEY o usa otro provider.", "error_code": "AUTH_ERROR", "trace_id": "be7e4ba2", "provider": "openrouter", "model": "openrouter/auto", "upstream_status": null, "timestamp": "2026-01-20T17:57:48.290266", "context": {}}

event: done
data: {}

```

### 5) API chat alternativa (/api/chat) (solo para comparar contrato)
```
HTTP/2 200 
date: Tue, 20 Jan 2026 17:57:49 GMT
content-type: application/json
content-length: 422
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=wqWFbQtlUqyjBVjBI0VPg8Qpaw76XrozEwVBqUtZO3iIpq8pOWpIMeQu5r8%2Ba2ruxw99K7I%2BHRvfRWx7RKK1lY2Bk0WZnSryTTQvxy1FJSjU6SzB5Q%3D%3D"}]}
cf-ray: 9c1074d1e87ddbf5-MAD
alt-svc: h3=":443"; ma=86400

{"response":"Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.","session_id":"sess_f5aa99af8502","requires_event_selection":false,"suggested_events":[],"metadata":{"tools_used":[],"tools_count":0,"response_time_ms":0,"billing":{},"provider":"ollama","model":"qwen2.5:14b","tokens_used":0,"real_cost":0.0,"billed_cost":0.0,"margin":0.0,"chat_config":{},"channel":"web","session_metadata":{}}}```

## Fin smoke test
- **RequestId**: `smoke_20260120_185746_7043`
- **Reporte**: `docs/reports/BACKEND_IA_SMOKE_smoke_20260120_185746_7043.md`
