## Smoke Test Backend IA

- **Base URL**: `https://api-ia.bodasdehoy.com`
- **Development**: `bodasdehoy`
- **Providers**: `auto`
- **Model (default)**: `openrouter/auto`
- **RequestId**: `smoke_20260120_200737_9386`
- **Fecha (UTC)**: `2026-01-20T19:07:37Z`

### 1) Health
```
HTTP/2 200 
date: Tue, 20 Jan 2026 19:07:38 GMT
content-type: application/json
content-length: 124
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=yZJBOeu8w%2Fhn9fxwJHZPZOknSUUf6OHntE0nTO0IOkw8wKG8jKbac3oAqyxTkWR0Ng9WyBuDxK0pFlH3xwIgmz%2Bzzt%2BCuCaBpIsb6lRMSvT6iwq3IA%3D%3D"}]}
cf-ray: 9c10db196db1f767-MAD
alt-svc: h3=":443"; ma=86400

{"status":"healthy","timestamp":"2026-01-20T19:07:38.100513","services":{"websockets":"0 active","graphql_proxy":"running"}}```

### 2) Models (auto)
```
HTTP/2 200 
date: Tue, 20 Jan 2026 19:07:38 GMT
content-type: application/json
content-length: 213
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=LLs3MXTgGDD94lSb9LhL50MGAE3mneTE71d9a3CuUMMoyaRv9aQgT1FOjXe%2BmzvFt4uzRKNevE9SYZ2MtVQw1LPpF8Sovjb21RtQJbdrwaiSobmdUg%3D%3D"}]}
cf-ray: 9c10db1c2e4f0351-MAD
alt-svc: h3=":443"; ma=86400

[{"id":"auto","name":"Auto - Selección automática","provider":"auto","context":128000,"maxOutput":4096,"description":"El sistema selecciona automáticamente el mejor provider según disponibilidad y criterios"}]```

### 3) Chat (auto) stream:false (esperado: JSON)
```
HTTP/2 200 
date: Tue, 20 Jan 2026 19:07:39 GMT
content-type: application/json
content-length: 216
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=rfh%2FRyNRatmW%2BYXBEhM7CLNObP6e4kkgX5IaZeaMGoNGHcAFlraP4iHRD0P0arfXDwykEV6vkHqT9sqNxPMubk5XiIDHkOFyeueUGys1XF2ty7oNEg%3D%3D"}]}
cf-ray: 9c10db1f28daf76b-MAD
alt-svc: h3=":443"; ma=86400

{"success":true,"message":"Lo siento, no pude generar una respuesta. Por favor, intenta de nuevo.","metadata":{},"provider":"anthropic","model":"claude-3-opus-20240229","tokens_used":0,"cost":0,"trace_id":"45e71f3b"}```

**Resultado:** ❌ FAIL — el backend devolvió mensaje fallback genérico (sin respuesta real).

### 4) Chat (auto) stream:true (esperado: SSE sin event:error)
```
HTTP/2 503 
date: Tue, 20 Jan 2026 19:07:39 GMT
content-type: application/json
content-length: 508
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=Ss4FFoRT6MN81IhITruqyS1MV1SPK5i2nV8eAblACNEhibjELTq0ye6p5DEfFMnSOpePgtia%2BA103TQlcWM%2FiBq4oNuTCfl98WlkM%2F9sCVrzcFsJqw%3D%3D"}]}
cf-ray: 9c10db2309831bc0-MAD
alt-svc: h3=":443"; ma=86400

{"detail":{"error":"No hay proveedores disponibles. Por favor, configura al menos una API key (OpenAI, Anthropic, OpenRouter, etc.) o asegúrate de que Ollama esté corriendo.","error_code":"NO_PROVIDERS_AVAILABLE","trace_id":"724084b3","provider":"auto","model":null,"upstream_status":null,"timestamp":"2026-01-20T19:07:39.702497","context":{"suggestion":"Por favor, configura al menos una API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY, etc.) o asegúrate de que Ollama esté corriendo."}}}```

**Resultado:** ✅ OK (no se detectó event: error en los primeros 220 líneas).

### 5) API chat alternativa (/api/chat) (solo para comparar contrato)
```
HTTP/2 200 
date: Tue, 20 Jan 2026 19:07:40 GMT
content-type: application/json
content-length: 422
server: cloudflare
cf-cache-status: DYNAMIC
nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
report-to: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=NPHmIQ7hyxeSV5Bf8nk4IW%2BupmfColRWxaLa4sGT5Ve8jsVPTAaR9iNISCFedA%2FUHam18slV4TTDsW7LMMTgBZebZkzmVv%2FeYweNqk00Q4hxpjq%2F1w%3D%3D"}]}
cf-ray: 9c10db265ed8b690-MAD
alt-svc: h3=":443"; ma=86400

{"response":"Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.","session_id":"sess_559e1049c97d","requires_event_selection":false,"suggested_events":[],"metadata":{"tools_used":[],"tools_count":0,"response_time_ms":0,"billing":{},"provider":"ollama","model":"qwen2.5:14b","tokens_used":0,"real_cost":0.0,"billed_cost":0.0,"margin":0.0,"chat_config":{},"channel":"web","session_metadata":{}}}```

## Fin smoke test
- **RequestId**: `smoke_20260120_200737_9386`
- **Reporte**: `docs/reports/BACKEND_IA_SMOKE_smoke_20260120_200737_9386.md`
