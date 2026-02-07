## Ticket Cliente (AppBodasdehoy) → Proveedor Backend IA
**Asunto:** `/webapi/chat/auto` se queda colgado (timeout) aunque `/health` responde OK

Hola equipo,

Gracias por la “Respuesta Final” y por las correcciones (UnboundLocalError, fallback por créditos y filtrado de modelos).
Como cliente, al intentar validar en **producción** (`api-ia.bodasdehoy.com`) tenemos un **bloqueo actual**: el endpoint de chat está haciendo **timeout**.

---

### ✅ Contexto
- **Base URL:** `https://api-ia.bodasdehoy.com`
- **Development:** `bodasdehoy`
- **Uso:** Copilot (iframe) / LobeChat integrado en AppBodasdehoy

---

## ❗ Problema (bloqueante)
**`POST /webapi/chat/auto` se queda colgado (no responde)**
- `GET /health` → **200 OK**
- `POST /webapi/chat/auto` → **timeout** (30s sin recibir bytes)

Esto impide validar que los fixes estén funcionando y rompe el flujo del Copilot (la request no retorna ni 200 ni 503 estructurado).

---

## 🧪 Pruebas reproducibles (copiar/pegar)

### 1) Health (OK)
```bash
curl -i "https://api-ia.bodasdehoy.com/health"
```

### 2) Chat auto (stream:false) — timeout
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_timeout_check_001" \
  --data '{"messages":[{"role":"user","content":"ping"}],"stream":false}'
```

### 3) Chat auto (stream:true) — (si aplica)
```bash
curl -i --max-time 30 -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -H "X-Development: bodasdehoy" \
  -H "X-Request-Id: client_timeout_check_stream_001" \
  --data '{"messages":[{"role":"user","content":"ping"}],"stream":true}'
```

---

## ✅ Comportamiento esperado (contrato)
- **Éxito:** HTTP `200` con `success:true` + `response`/`message` + `provider` + `model` + `trace_id`
- **Error:** HTTP `503` con `success:false` + `error` + `error_code` + `trace_id` + `suggestion`
- **Importante:** responder en pocos segundos (ideal <5s) y **no dejar colgada la request**.

---

## ❓ Preguntas concretas
1) **Deploy**
- ¿Confirmáis que los fixes descritos están desplegados en `api-ia.bodasdehoy.com`?
- Indicad **commit/tag/fecha**.

2) **Disponibilidad / saturación**
- ¿Tenéis incidentes de carga / deadlocks / colas / upstream colgado en `/webapi/chat/*`?
- Vemos `/health` OK pero `/webapi/chat/auto` timeout.

3) **Política de timeouts**
- ¿Podéis garantizar que si el upstream está degradado, el backend responda **503 rápido** en vez de colgar la request?

4) **MongoDB / Keys (según vuestra respuesta previa)**
- Si MongoDB no está accesible, la lectura desde `lobeChatConfig.aiProviders.*` (ubicación principal de la guía) no ocurre.
- ¿Cuándo vais a configurar `MONGODB_URI` en producción para leer la ubicación principal?

---

## Nota (lado cliente)
En frontend ya mostramos overlay con reporte y evitamos “cargando infinito”, pero dependemos de que el backend responda (200 o 503 estructurado) y no se quede colgado.

Gracias.

