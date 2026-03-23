# Plan de mejora — IA Routing, Calidad y Observabilidad

**Basado en:** análisis de 2,606 eventos de chat (2026-02-20 → 2026-03-15)
**Fecha del plan:** 2026-03-16
**Archivos clave:** `api-ia:/opt/backend/rest_chat_handler.py`, `core/auto_routing_unified.py`, `tracking/chat_events_log.py`

---

## 1. Estado actual (resumen ejecutivo)

| Semana | Mensajes reales | Éxito |
|--------|----------------|-------|
| W08 (20 feb) | 278 | **25%** — Bug: deepseek-chat enrutado via provider anthropic |
| W09 | 479 | **31%** |
| W10 | 60 | **90%** — Post-fix |
| W11 (≥9 mar) | 113 | **98%** ✅ |

El sistema **ya funciona bien** en las últimas 2 semanas. Los errores históricos vienen de una mala configuración de modelo/proveedor que ya fue corregida. El plan es ahora consolidar la observabilidad y hacer el routing más inteligente para subir del 98% a 99%+ de forma sostenida.

### Éxito por tipo de intención (acumulado 30 días)

| Intención | Msgs | Éxito | Proveedor principal | Nota |
|-----------|------|-------|---------------------|------|
| `crud_add` (agregar) | 46 | **83%** ✅ | Anthropic | Bien — no tocar |
| `consejo` (planificación) | 52 | 44% | Groq | Mejorable con Anthropic |
| `datos_fetch` (¿cuántos?) | 246 | 37% | Groq/Anthropic | Mejorable |
| `navegacion` (llévame a) | 103 | 36% | Groq/Anthropic | Debería ser 90%+ |
| `crud_update` (confirmar) | 3 | 0% | Anthropic | Muestra pequeña |

### Errores principales (acumulado)

| Error | Ocurrencias | Causa | Estado |
|-------|-------------|-------|--------|
| `EMPTY_RESPONSE` | 245 | Groq devuelve vacío cuando hay muchas tools en el context | Parcialmente resuelto |
| `AUTH_ERROR` | 149 | Modelo deepseek-chat enrutado por provider anthropic | ✅ Resuelto |
| `PROVIDER_ERROR` | 139 | Fallos de red / rate limit | En curso |
| `TIMEOUT_ERROR` | 11 | Groq >30s en horarios de alta carga | En curso |

---

## 2. Infraestructura ya instalada (no replantear)

- **Rutina semanal** `scripts/analisis_semanal.py` — cron cada domingo 8am UTC, genera informe en `data/reports/report_YYYY-MM-DD.json`
- **Cache de respuestas** — `core/response_cache.py` ya existe y está activo en el flujo principal
- **Fallback automático** 403/400 — si OpenAI/Groq falla, intenta siguiente proveedor
- **Keyword detection** — ya detecta si el mensaje requiere function calling y ajusta `requirements`
- **`requires_fast_response`** — capability ya definida en `auto_routing_unified.py` (solo falta usarla)

---

## 3. Mejoras propuestas (por prioridad)

### P1 — Tracking de latencia (observabilidad)

**Problema:** `processing_time_ms` siempre es 0. No sabemos si Groq responde en 800ms o en 8s.
**Impacto:** Sin datos de latencia no podemos optimizar la experiencia de usuario.

**Qué hacer en `rest_chat_handler.py`:**
- Registrar `time.monotonic()` al inicio de `handle_chat_request`
- Calcular diff y pasarlo a `record_chat_result(processing_time_ms=...)`
- Ya hay dos call-sites: path de éxito (línea ~1815) y fallback 403 (línea ~1728)

**Nota:** Este cambio ya fue aplicado en el servidor (2026-03-15) sin incidents.

---

### P2 — Routing diferenciado por intención del mensaje

**Problema:** Todos los mensajes se evalúan con los mismos `requirements`. Una pregunta "llévame al presupuesto" (solo necesita `filter_view`) recibe el mismo tratamiento que "agrégame 50 invitados" (necesita function calling completo + api2).

**Qué hacer:** Añadir clasificador de intención justo después del bloque de keyword detection existente (línea ~2050 de `rest_chat_handler.py`):

```python
# Grupos de keywords por intención
_CRUD_ADD_KW    = ["agregar","añadir","añade","crear","crea","registrar","nuevo","nueva","apuntar"]
_CRUD_UPDATE_KW = ["actualizar","cambiar","modificar","editar","confirmar","marcar","completar"]
_NAV_KW         = ["llevame","llévame","ir a","abrir","ve a","navega"]
_ADVICE_KW      = ["consejo","recomienda","como organizar","mejor forma","tips","me ayudas"]

is_crud    = any(kw in message_lower for kw in _CRUD_ADD_KW + _CRUD_UPDATE_KW)
is_nav     = any(kw in message_lower for kw in _NAV_KW) and not is_crud
is_advice  = any(kw in message_lower for kw in _ADVICE_KW)

if is_crud:
    # CRUD: máxima fiabilidad — Anthropic tiene 83% histórico
    requirements['requires_high_quality'] = True
    requirements['requires_function_calling'] = True
    requirements['requires_data_access'] = True

elif is_nav:
    # Navegación: solo filter_view, modelo rápido y barato
    requirements['requires_high_quality'] = False
    requirements['requires_function_calling'] = False
    requirements['requires_fast_response'] = True

elif is_advice:
    # Consejo/planificación: calidad sobre velocidad
    requirements['requires_high_quality'] = True
```

**Dónde:** `rest_chat_handler.py`, línea ~2055 (tras el bloque `if requiere_function_calling:`)

---

### P3 — Fallback más agresivo ante EMPTY_RESPONSE de Groq

**Problema:** Groq devuelve respuesta vacía cuando el system prompt + tools supera cierto tamaño. Actualmente esto termina como error 503 para el usuario.

**Qué hacer:** En el bloque que detecta `is_generic_error` (línea ~1775), **antes de devolver 503**, intentar `get_next_provider` excluyendo Groq y reintentar una vez — igual que ya se hace con 403/400.

```python
# Si es EMPTY_RESPONSE y el proveedor fue Groq, intentar fallback
if is_generic_error and result.get("provider") == "groq":
    next_p, next_m, next_key = await get_next_provider(
        development, exclude_providers=["groq"]
    )
    if next_p:
        # reintentar con anthropic/gemini
        retry_result = await self._process_chat_sync(next_p, payload, request)
        if retry_result.get("success"):
            return JSONResponse(content={...}, status_code=200)
```

**Impacto esperado:** Reducir EMPTY_RESPONSE de 245 a <20 en el próximo período.

---

### P4 — Enriquecer logs con user_id

**Problema:** `user_id` siempre vacío en `chat_events.ndjson`. No podemos analizar patrones por usuario ni detectar usuarios con problemas recurrentes.

**Qué hacer:** En `rest_chat_handler.py`, extraer `user_id` de los headers (`X-User-ID`, `X-User-Email`, `X-User-UID`) y pasarlo a `record_chat_result`.

```python
user_id = (
    request.headers.get("X-User-ID") or
    request.headers.get("X-User-Email") or
    request.headers.get("X-User-UID") or
    ""
)
record_chat_result(..., user_id=user_id[:64])
```

**Dónde:** Los dos `record_chat_result` calls en el handler no-streaming (~líneas 1728 y 1815).

---

### P5 — Análisis de conversaciones completas (no solo primer mensaje)

**Problema:** `message_sent_preview` guarda solo el último mensaje del usuario, no el contexto de la conversación. Una pregunta "dame el resumen" puede tener contexto muy diferente.

**Qué hacer:** Añadir campo `conversation_length` (número de turnos) y `has_tool_calls` (bool) al evento NDJSON:

```python
log_chat_event(
    ...,
    # campos nuevos en tracking/chat_events_log.py:
    conversation_length=len(messages),
    had_tool_calls=bool(result.get("tool_calls_count", 0)),
)
```

Esto permite al script semanal identificar si los fallos ocurren más en conversaciones largas (posible overflow de context).

---

## 4. Mejoras de modelo/proveedor a evaluar

Basado en los datos y el routing actual:

### Modelo razonador para CRUD complejo
Cuando el usuario hace operaciones multi-paso ("agregar 50 invitados y distribuirlos en mesas"), considerar enrutar a **claude-sonnet** con `thinking` habilitado. Actualmente el reasoning se activa solo si el usuario lo pide explícitamente desde el frontend.

**Criterio de activación:** mensaje con >2 entidades mencionadas + intención CRUD.

### DeepSeek para consultas de datos puras
`datos_fetch` (¿cuántos invitados?, ¿cuánto llevo pagado?) son queries estructuradas, sin necesidad de razonamiento profundo. **DeepSeek-chat** tiene 100% éxito en los 2 casos registrados y es muy barato. Vale la pena probarlo a mayor escala para este tipo de intent.

### Gemini Flash para navegación
`navegacion` solo necesita llamar a `filter_view`. **Gemini 2.0 Flash** tiene 100% éxito en los 6 casos y ~500ms de latencia. Candidato ideal para ser el proveedor de navegación.

---

## 5. Rutina de revisión semanal

Ya está instalada. Cada domingo:

```
cron: 0 8 * * 0
cmd:  cd /opt/backend && venv/bin/python3 scripts/analisis_semanal.py 7
log:  data/reports/cron.log
out:  data/reports/report_YYYY-MM-DD.json
```

**Proceso manual recomendado (mensual):**
1. Leer el último informe: `cat /opt/backend/data/reports/report_$(date +%Y-%m-%d).json | python3 -m json.tool`
2. Si `success_rate_real < 85%` → revisar errores y ajustar routing
3. Si `EMPTY_RESPONSE > 20` → revisar fallback de Groq (P3)
4. Si hay nueva intención frecuente en `otro` → añadirla al clasificador (P2)
5. Si un proveedor tiene `AUTH_ERROR > 10` → verificar API key en whitelabel api2

---

## 6. Orden de ejecución recomendado

| # | Mejora | Dificultad | Impacto | Archivo |
|---|--------|-----------|---------|---------|
| 1 | P1: Latencia (ya aplicado) | Trivial | Observabilidad | `rest_chat_handler.py` |
| 2 | P2: Intent routing | Baja | Medio | `rest_chat_handler.py` ~L2055 |
| 3 | P3: Fallback Groq EMPTY | Media | Alto | `rest_chat_handler.py` ~L1775 |
| 4 | P4: user_id en logs | Baja | Observabilidad | `rest_chat_handler.py` ~L1728,1815 |
| 5 | P5: conversation_length | Baja | Observabilidad | `tracking/chat_events_log.py` + handler |
| 6 | DeepSeek para datos_fetch | Media | Experimental | `auto_routing_unified.py` |
| 7 | Gemini Flash para navegación | Media | Experimental | `auto_routing_unified.py` |
| 8 | Reasoning para CRUD complejo | Alta | Premium | `rest_chat_handler.py` + frontend |
