## Smoke Test Backend IA

- **Base URL**: `https://api-ia.bodasdehoy.com`
- **Development**: `bodasdehoy`
- **Provider**: `openrouter`
- **Model**: `openrouter/auto`
- **RequestId**: `smoke_20260120_184346_7298`
- **Fecha (UTC)**: `2026-01-20T17:43:46Z`

### 1) Health
```
HTTP/2 200 
date: Tue, 20 Jan 2026 17:43:47 GMT
content-type: application/json
content-length: 124
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=k%2B3vDD3%2FPkNICWgAmZvuiZWCuoj2RbcWA7IUE%2F8viDqnZzbC46HcX%2FAhxC8dYzIp8E2GtuGPvhsk9Z9rizwLmslrBcyRp9x1t3mIIMKqPzoQk%2BtIEw%3D%3D"}]}
cf-ray: 9c106046c874f7e9-MAD
alt-svc: h3=":443"; ma=86400

{"status":"healthy","timestamp":"2026-01-20T17:43:47.298203","services":{"websockets":"0 active","graphql_proxy":"running"}}```

### 2) Models (openrouter)
```
HTTP/2 200 
date: Tue, 20 Jan 2026 17:43:47 GMT
content-type: application/json
content-length: 740
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=nKS%2FcPCezMWlriCnsy88mdP8gE00dKJQ0xFnPIMh%2FnDQGv12Gm9YJEFMrmi8BmzhHwWLAUAsIbq%2Ba4RvFMMmjzmpiukmdCjldIuTYeV%2B4krnenYRMQ%3D%3D"}]}
cf-ray: 9c106049a98d344b-MAD
alt-svc: h3=":443"; ma=86400

{"models":[{"id":"openrouter/auto","name":"Openrouter/Auto","provider":"openrouter","context":128000,"maxOutput":4096},{"id":"anthropic/claude-3.5-sonnet","name":"Claude 3.5 Sonnet","provider":"openrouter","context":128000,"maxOutput":4096},{"id":"openai/gpt-4o","name":"GPT-4","provider":"openrouter","context":128000,"maxOutput":4096},{"id":"google/gemini-pro-1.5","name":"Gemini 1.5 Pro","provider":"openrouter","context":128000,"maxOutput":4096},{"id":"qwen2.5:7b","name":"Qwen 2.5 7B","provider":"ollama","context":128000,"maxOutput":4096},{"id":"llama3.2:3b","name":"Llama 3.2 3B","provider":"ollama","context":128000,"maxOutput":4096},{"id":"phi3:medium","name":"Phi-3 Medium","provider":"ollama","context":128000,"maxOutput":4096}]}```

### 3) Chat stream:false (esperado: JSON, no SSE)
```
HTTP/2 500 
date: Tue, 20 Jan 2026 17:43:47 GMT
content-type: application/json
content-length: 293
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=PpZeXR6%2Bh7pU9cGPgZeSSK2FHr29LATVyDRY5ZyxvjJ%2FnOxtcZRVaJBwFOrarTKS%2FBZO6RaUEULoui7S5YJMBwTsLFo4VW2jP5mz0HvjwyeREQb6Pg%3D%3D"}]}
cf-ray: 9c10604b7b47301c-MAD
alt-svc: h3=":443"; ma=86400

{"success":false,"error":"Orchestrator.process_message() missing 1 required positional argument: 'user_context'","error_code":"TypeError_ERROR","trace_id":"3bc2b5ad","provider":"openrouter","model":"openrouter/auto","upstream_status":null,"timestamp":"2026-01-20T17:43:47.861953","context":{}}```

### 4) Chat stream:true (esperado: SSE event:text/done o chunks OpenAI sin event:error)
```
HTTP/2 200 
date: Tue, 20 Jan 2026 17:43:48 GMT
content-type: text/event-stream; charset=utf-8
cache-control: no-cache
server: cloudflare
x-model: openrouter/auto
x-provider: openrouter
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=mTtT%2FZFpMWF1DfQRTAiw%2BBYAAlTXCLt89NExkhM54BNNVtDJB93KSWmTTGBG1MGQ08v0BFrxtXkw%2Bjk8iGNQFfndzlYxGgZs5Qt24jsIjK16kO66Hg%3D%3D"}]}
cf-ray: 9c10604d2b171ba3-MAD
alt-svc: h3=":443"; ma=86400

event: error
data: {"error": "cannot access local variable 'provider' where it is not associated with a value", "error_code": "UnboundLocalError_ERROR", "trace_id": "8d920c37", "provider": "openrouter", "model": "openrouter/auto", "upstream_status": null, "timestamp": "2026-01-20T17:43:48.131162", "context": {}}

event: done
data: {}

```

### 5) API chat alternativa (/api/chat) (solo para comparar contrato)
```
HTTP/2 200 
date: Tue, 20 Jan 2026 17:43:48 GMT
content-type: application/json
content-length: 308
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=PV0%2B34myoN5iNQ5A95v8sCGZZV5jWF435FwTRMzXCK8Ey38VrPSVvpLacTfNQ%2FXng8zt9HRQsVoatrEVvr0erR7HLvPtRNjxyuK67CE6oo%2F4RPjxBA%3D%3D"}]}
cf-ray: 9c10604ec92b0422-MAD
alt-svc: h3=":443"; ma=86400

{"response":"Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.","session_id":"sess_cache_1768931028","requires_event_selection":false,"suggested_events":[],"metadata":{"provider":"cache","model":"cached_response","response_time_ms":1,"from_cache":true,"cache_type":"greeting"}}```

## Fin smoke test
- **RequestId**: `smoke_20260120_184346_7298`
- **Reporte**: `docs/reports/BACKEND_IA_SMOKE_smoke_20260120_184346_7298.md`
