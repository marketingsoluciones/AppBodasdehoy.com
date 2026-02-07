## Respuesta Cliente (AppBodasdehoy) → Proveedor Backend IA
**Asunto:** Confirmación fixes + validación de timeouts + discrepancia guía de keys (MongoDB) + seguridad

Hola equipo,

Gracias por vuestra respuesta final y por las correcciones (UnboundLocalError, fallback por créditos, filtrado de modelos y timeout global).

Como cliente, necesitamos cerrar el incidente con **validación objetiva** en producción y aclarar dos puntos críticos: **fuente real de keys** (MongoDB) y **seguridad** (secreto expuesto).

---

## ✅ 1) Validación requerida (criterio de aceptación)
Para dar el incidente por cerrado, necesitamos que el backend cumpla y podamos verificar:

- `POST /webapi/chat/auto` (stream:false) responde siempre en **< 25s** con:
  - **200** + `success:true` + `response`/`message` real, **o**
  - **503** + `success:false` + `error_code` + `trace_id` + `suggestion`
- No debe quedarse “colgado” (sin bytes) hasta timeout del cliente.

---

## 🧪 2) Pruebas reproducibles (copiar/pegar)

### 2.1 Health
```bash
curl -i "https://api-ia.bodasdehoy.com/health"
```

### 2.2 Auto (stream:false) — debe responder <25s
```bash
time curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_timeout_check_002" \
  --data '{"messages":[{"role":"user","content":"ping"}],"stream":false}'
```

### 2.3 Auto (stream:true)
```bash
time curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_timeout_check_stream_002" \
  --data '{"messages":[{"role":"user","content":"ping"}],"stream":true}'
```

### 2.4 Providers directos (para aislar degradación)
```bash
time curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/openai" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: force_openai_002" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"gpt-4o-mini","stream":false}'

time curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/anthropic" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: force_anthropic_002" \
  --data '{"messages":[{"role":"user","content":"ping"}],"model":"claude-3-opus-20240229","stream":false}'
```

---

## ⚠️ 3) Discrepancia con la “Guía del Cliente” (keys en Mongo)
La guía indica que la **ubicación principal** de keys es:
`whitelabel.lobeChatConfig.aiProviders.{provider}.apiKey`

Pero vuestra respuesta confirma que en producción:
- **MongoDB no está configurado / no accesible**
- Por lo tanto **no se pueden leer** `lobeChatConfig.aiProviders.*`
- Solo se usa el backup `ai_config.api_keys.*`

Esto es crítico porque limita el auto‑routing y deja menos fallbacks (sobre todo si OpenAI está con 429 y Anthropic sin créditos).

**Pregunta concreta:**
- ¿Cuándo vais a configurar `MONGODB_URI` en producción para que la guía sea aplicable y `auto` pueda detectar Groq/Gemini/Cloudflare?

---

## 🔐 4) Seguridad (muy importante)
En la respuesta se incluyó un `MONGODB_URI` con credenciales.
Pedimos por favor:
- **Rotar esas credenciales** inmediatamente
- Compartir valores sensibles solo por canal seguro (no por ticket/email)
- Reenviar la instrucción de configuración **sin secretos** (p.ej. “configurar `MONGODB_URI`” sin incluir usuario/password)

---

## ✅ 5) Confirmación final esperada
Para cerrar, por favor confirmad:
- Que el deploy con timeout global (25s) y timeouts por provider (10s) está activo en prod.
- Resultado de ejecutar las pruebas 2.2 y 2.3 (con `RequestId` + `TraceId`).

Gracias.

