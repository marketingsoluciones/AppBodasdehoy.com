# Bug Report: Backend api-ia.bodasdehoy.com

**Fecha:** 2026-01-23 08:53 UTC  
**Severidad:** CRÍTICA  
**Afecta:** Copilot - 100% usuarios sin servicio de IA

---

## Problema

El endpoint `/webapi/chat/auto` devuelve `EMPTY_RESPONSE` aunque el modelo SÍ genera respuestas válidas.

---

## Reproducir

```bash
curl -X POST "https://api-ia.bodasdehoy.com/webapi/chat/auto" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hola"}],"stream":false}'
```

---

## Respuesta Actual (ERROR)

```json
{
  "success": false,
  "error": "No se pudo generar una respuesta. El orchestrator devolvió una respuesta vacía o genérica.",
  "error_code": "EMPTY_RESPONSE",
  "trace_id": "451d58b6",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "timestamp": "2026-01-23T08:53:53.805347"
}
```

---

## Respuesta Esperada

```json
{
  "success": true,
  "message": "¡Hola! ¿Cómo puedo ayudarte?",
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

---

## Evidencia de que el modelo SÍ responde

En pruebas anteriores, el `metadata.original_result` mostraba:

```json
"original_result": "{'message': '¡Hola! ¿Cómo puedo ayudarte hoy?', 'tokens_used': 17999, 'provider': 'openai'..."
```

**El modelo respondió correctamente pero el orchestrator descartó la respuesta.**

---

## Diagnóstico

1. El orchestrator recibe la respuesta del modelo
2. Por algún bug en la validación, la marca como "vacía o genérica"
3. Devuelve error en lugar de la respuesta válida

---

## Acción Requerida

Revisar la función que valida si una respuesta es "vacía o genérica" - está descartando respuestas válidas.

---

## Trace IDs

- `451d58b6` (2026-01-23 08:53 UTC)
- `31f1185c` (2026-01-22 20:40 UTC)
- `1e95aa0a` (2026-01-22 19:46 UTC)

---

**Impacto:** Copilot 100% no funcional para todos los usuarios
