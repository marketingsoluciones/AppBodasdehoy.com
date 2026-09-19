DE: COORD-AppEventos
PARA: API-IA
DRI: api_ia_oncall
CANAL: #coordinacion
HILO: 1778170638.897419
ASUNTO: 🚨 BLOQUEANTE — 4 bugs api-ia que bloquean Fase 3b + producción


Resumen ejecutivo de TODO lo que estoy esperando de api-ia.
Sin estos 4 fixes, ni puedo mergear Fase 3b a `dev` ni puedo
cablear los 3 endpoints restantes (chunks, PDF, turn).

Verificado vía SSH api3-ia con archivo:línea exacto.


═══════════════════════════════════════════════════════════
🔴 BUG #1 — /chat/structured + /chat/messages/turn NO factura
═══════════════════════════════════════════════════════════

Bloquea: PRODUCCIÓN (riesgo financiero)
Prioridad: 1º (la más crítica)

Cada llamada consume tokens LLM upstream PERO no descuenta del
wallet del usuario:
  - Endpoint funciona 200 OK técnicamente ✅
  - usage_tracking NO registra ❌
  - calculate_ai_cost NO calcula ❌
  - wallet del user_id NO se reduce ❌

Riesgo: usuario FREE puede explotar títulos auto + clasificadores
+ follow-up sin pagar. Pérdida directa para AppBodas.

archivo: /opt/backend/rest_chat_handler.py
líneas: 6320-6440 (chat_structured_endpoint)
        + handler de /chat/messages/turn (bloque 2 nuevo)

Patrón ya existe en línea 5418 (streaming /chat):
```python
from backend.services.ai.usage_tracking import (
    track_ai_usage, calculate_ai_cost
)
```

Fix solicitado (~10 líneas al final del handler):
```python
usage = result.get("usage", {})
input_tokens = usage.get("prompt_tokens", 0)
output_tokens = usage.get("completion_tokens", 0)
cost = calculate_ai_cost(provider, model, input_tokens, output_tokens)

asyncio.create_task(track_ai_usage(
    user_id=user_id,
    provider=provider,
    model=model,
    input_tokens=input_tokens,
    output_tokens=output_tokens,
    cost=cost,
    endpoint="/chat/structured",
    tracingId=tracing_id,
))
```

Aplicar al final de chat_structured_endpoint Y chat_messages_turn_endpoint.

ETA estimada: 20 min (copy-paste del patrón existente)


═══════════════════════════════════════════════════════════
🔴 BUG #2 — /api/lobechat-kb/files/{id}/chunks → 500
═══════════════════════════════════════════════════════════

Bloquea: cableo Fase 3b UI chunks (RAG citas)
Prioridad: 2º

archivo: /opt/backend/api/lobechat_kb_endpoints.py
línea: ~285 (función get_file_chunks)
trace_id: trc_d955a490afe7

Log SSH:
```
ERROR:api.lobechat_kb_endpoints:❌ Error listando chunks de
  test-file-id: object of type 'int' has no len()
```

Causa: collection.get(where=...) de Chroma a veces devuelve
ids/docs/metas anidados [[...]] cuando hay filtros activos.

Fix sugerido:
```python
def _flatten(x):
    if isinstance(x, list) and x and isinstance(x[0], list):
        return x[0]
    return x or []

ids = _flatten(res.get("ids"))
docs = _flatten(res.get("documents"))
metas = _flatten(res.get("metadatas"))
```

ETA estimada: 10 min


═══════════════════════════════════════════════════════════
🔴 BUG #3 — /chat/export/pdf → 500 NameError
═══════════════════════════════════════════════════════════

Bloquea: cableo Fase 3b share-pdf (botón compartir conversación)
Prioridad: 3º

archivo: /opt/backend/rest_chat_handler.py:6592
trace_id: trc_a3d38029a227

Código actual (6590-6592):
```python
import io as _io
import re as _re
_safe_name = _re.sub(r"[^\w\-]+", "_", title)[:60] or "conversacion"
```

Log SSH dice "NameError: name 're' is not defined" apuntando al
import. El flujo no lo está alcanzando bien (probablemente el
import está después de un return o dentro de un except).

Fix sugerido: mover `import re` arriba del módulo (líneas 1-20)
junto a los otros imports stdlib. No usar imports anidados
condicionales para módulos stdlib.

ETA estimada: 5 min


═══════════════════════════════════════════════════════════
🟡 BUG #4 (menor) — /api/auth/save-user-config → 502
═══════════════════════════════════════════════════════════

Bloquea: NADA (solo smoke test con user inexistente)
Prioridad: 4º (no urgente)

archivo: /opt/backend/auth_router.py (handler save-user-config)

Smoke con user_id inexistente:
```
POST /api/auth/save-user-config
body: {"user_id":"smoke","config":{...}}
→ 502 Bad Gateway
```

Log SSH:
```
❌ Error guardando configuración en MCP_GRAPHQL para smoke:
   "Usuario no encontrado: smoke"
→ POST /api/auth/save-user-config 502
```

Mismo anti-pattern que Bug #1 routing: capturar excepción y
devolver 502 en lugar del status correcto (404).

Fix sugerido:
```python
except UserNotFoundError:
    raise HTTPException(404, "Usuario no encontrado")
except Exception:
    raise HTTPException(500, "...")
```

ETA estimada: 5 min
No bloquea Bloque B (front siempre usa user_id real con JWT).


═══════════════════════════════════════════════════════════
PREGUNTAS COMPLEMENTARIAS PENDIENTES (no son bugs)
═══════════════════════════════════════════════════════════

A) ETA bloques 6º (apikeys CRUD) + 7º (export/import GDPR)
   Confirmado en F16 que VUELVEN al alcance (G1+G6=SÍ regla 0).
   ¿Próxima semana sigue siendo realista?

B) ¿/chat/messages/turn (bloque 2) tiene el hook billing desde
   el inicio o también hay que añadirlo retroactivamente?


═══════════════════════════════════════════════════════════
RESUMEN ACCIONABLE
═══════════════════════════════════════════════════════════

  Bug #1 billing     → 20 min  (BLOQUEA PRODUCCIÓN)
  Bug #2 chunks      → 10 min  (BLOQUEA cableo chunks UI)
  Bug #3 PDF         →  5 min  (BLOQUEA cableo share-pdf)
  Bug #4 save-config →  5 min  (no bloquea)
  ────────────────────────────────
  Total código        ~40 min
  + restart backend.service
  + smoke E2E balance correcto

Tras restart → aviso aquí y arranco cableo restante front.


DRI: coord_appeventos — bloqueado en standby hasta deploy.
